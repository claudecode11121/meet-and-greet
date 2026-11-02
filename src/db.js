import 'dotenv/config';
import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default Turso Cloud Database Configuration (used if environment variables are not set in Vercel)
const DEFAULT_TURSO_URL = 'libsql://logistics-logistics.aws-us-east-2.turso.io';
const DEFAULT_TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkyNTc2NjUsImlkIjoiMDFhMDk3ZTMtYjkwMS03NDA0LTliZWMtNWMzZmRiMzE2Mjg4Iiwia2lkIjoiOFpDM0pCdDBCSGE5YXp0bzdDT1V2c0tBLThFSm9ISURmbHUzV3lVYnNrTSIsInJpZCI6IjBhM2QzYjVkLTM1NWYtNDE2My04Y2I2LTczNTQ4YzMyOTE5ZiJ9.xFYSNxHpbkz-c3b6u7z31LC2A1iXIeh_cJKv17gpEiEDAmiMYOEqETPRBWqTPOWJ56atoKQPigpTieYc7_3VCw';

// Detect Serverless environment (Vercel / AWS Lambda) where filesystem is read-only except /tmp
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
const DATA_DIR = isServerless
  ? path.join('/tmp', 'wme-data')
  : path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[WME DB] Could not create local data directory:', e.message);
}

let client = null;
let localClient = null;
let isCloud = false;
let isInitialized = false;

function getLocalClient() {
  if (!localClient) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch {}
    const localDbPath = 'file:' + path.join(DATA_DIR, 'meet-greet-db.sqlite');
    localClient = createClient({ url: localDbPath });
  }
  return localClient;
}

/**
 * Resilient query executor: attempts Turso Cloud, seamlessly falls back to local libSQL.
 */
async function execute(queryObj) {
  if (client && isCloud) {
    try {
      const res = await client.execute(queryObj);
      // Dual-write to local libSQL for write operations to ensure resilient fallback consistency
      if (typeof queryObj === 'object' && queryObj.sql && !queryObj.sql.trim().toUpperCase().startsWith('SELECT')) {
        try {
          await getLocalClient().execute(queryObj);
        } catch {}
      }
      return res;
    } catch (err) {
      console.warn(`✦ Turso Cloud query notice (${err.message}). Seamlessly engaging local libSQL.`);
      isCloud = false; // Stay on local libSQL for session to preserve write-read consistency
      try {
        return await getLocalClient().execute(queryObj);
      } catch (localErr) {
        throw err; // Preserve original cloud error if local also fails
      }
    }
  }
  return await getLocalClient().execute(queryObj);
}

const TABLE_SCHEMAS = [
  `CREATE TABLE IF NOT EXISTS meet_greet_submissions (
    reference_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    submitted_at TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    country TEXT,
    city TEXT,
    meeting_type TEXT,
    preferred_date TEXT,
    payload_json TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS meet_greet_admins (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_login_at TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS meet_greet_audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_reference_id TEXT,
    details_json TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS meet_greet_settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL
  );`
];

async function ensureTables(targetClient) {
  for (const sql of TABLE_SCHEMAS) {
    await targetClient.execute(sql);
  }
}

/**
 * Initialize connection to Turso cloud database or local libSQL fallback.
 */
export async function initDatabase() {
  if (isInitialized) return isCloud ? client : localClient;

  const cloudUrl = process.env.DATABASE_URL || DEFAULT_TURSO_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN || DEFAULT_TURSO_TOKEN;

  if (cloudUrl && (cloudUrl.startsWith('libsql://') || cloudUrl.startsWith('https://'))) {
    try {
      console.log(`✦ Connecting to Turso Cloud Database: ${cloudUrl}`);
      const testClient = createClient({
        url: cloudUrl,
        authToken: authToken,
        fetch: (url, opts) => fetch(url, { ...opts, signal: AbortSignal.timeout(6000) })
      });
      await testClient.execute("SELECT 1 AS connected;");
      client = createClient({ url: cloudUrl, authToken: authToken });
      isCloud = true;
      await ensureTables(client);
      console.log('✓ Successfully connected to Turso Cloud Database!');
      
      // Migrate initial seed data from JSON files if database tables are currently empty
      try {
        await migrateFromJsonFiles();
      } catch (migErr) {
        console.warn('[WME DB] Seed migration note:', migErr.message);
      }

      isInitialized = true;
      return client;
    } catch (err) {
      console.warn(`✦ Turso Cloud connection notice (${err.message}). Attempting local libSQL fallback.`);
    }
  }

  // Fallback to local SQLite only if cloud is unreachable or not configured
  try {
    const local = getLocalClient();
    await ensureTables(local);
    try {
      await migrateFromJsonFiles();
    } catch {}
    isInitialized = true;
    return local;
  } catch (err) {
    console.error('✦ Local libSQL fallback error:', err.message);
    isInitialized = true;
    return null;
  }
}

/**
 * Migrate existing JSON files into Turso libSQL if tables are empty.
 */
async function migrateFromJsonFiles() {
  try {
    // 1. Submissions migration
    const countRes = await execute("SELECT COUNT(*) AS total FROM meet_greet_submissions;");
    const count = Number(countRes.rows[0]?.total || 0);

    const submissionsFile = path.join(DATA_DIR, 'submissions.json');
    if (count === 0 && fs.existsSync(submissionsFile)) {
      const data = JSON.parse(fs.readFileSync(submissionsFile, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        console.log(`✦ Migrating ${data.length} existing submissions into Turso libSQL...`);
        for (const item of data) {
          await execute({
            sql: `INSERT OR REPLACE INTO meet_greet_submissions 
                  (reference_id, status, submitted_at, full_name, email, country, city, meeting_type, preferred_date, payload_json)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            args: [
              item.referenceId,
              item.status || 'Pending Review',
              item.submittedAt || new Date().toISOString(),
              item.personalInfo?.fullName || '',
              item.personalInfo?.email || '',
              item.personalInfo?.country || '',
              item.personalInfo?.city || '',
              item.meetAndGreetInfo?.meetingType || '',
              item.meetAndGreetInfo?.preferredDate || '',
              JSON.stringify(item)
            ]
          });
        }
        console.log('✓ Submissions migrated successfully.');
      }
    }

    // 2. Admins migration
    const adminCountRes = await execute("SELECT COUNT(*) AS total FROM meet_greet_admins;");
    const adminCount = Number(adminCountRes.rows[0]?.total || 0);
    const adminsFile = path.join(DATA_DIR, 'admins.json');
    if (adminCount === 0 && fs.existsSync(adminsFile)) {
      const admins = JSON.parse(fs.readFileSync(adminsFile, 'utf-8'));
      if (Array.isArray(admins) && admins.length > 0) {
        for (const a of admins) {
          await execute({
            sql: `INSERT OR REPLACE INTO meet_greet_admins 
                  (id, email, full_name, role, password_hash, salt, created_at, last_login_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            args: [
              a.id,
              a.email.toLowerCase(),
              a.fullName,
              a.role,
              a.passwordHash,
              a.salt,
              a.createdAt,
              a.lastLoginAt || null
            ]
          });
        }
        console.log('✓ Admin accounts migrated successfully.');
      }
    }

    // 3. Settings migration
    const settingsFile = path.join(DATA_DIR, 'settings.json');
    if (fs.existsSync(settingsFile)) {
      const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
      await execute({
        sql: `INSERT OR REPLACE INTO meet_greet_settings (key, value_json) VALUES ('main', ?);`,
        args: [JSON.stringify(settings)]
      });
    }

    // 4. Audit logs migration
    const logsFile = path.join(DATA_DIR, 'audit_logs.json');
    if (fs.existsSync(logsFile)) {
      const logs = JSON.parse(fs.readFileSync(logsFile, 'utf-8'));
      if (Array.isArray(logs) && logs.length > 0) {
        for (const l of logs.slice(0, 100)) {
          await execute({
            sql: `INSERT OR IGNORE INTO meet_greet_audit_logs 
                  (id, timestamp, actor_email, action, target_reference_id, details_json)
                  VALUES (?, ?, ?, ?, ?, ?);`,
            args: [
              l.id,
              l.timestamp,
              l.actorEmail,
              l.action,
              l.targetReferenceId || null,
              JSON.stringify(l.details || {})
            ]
          });
        }
      }
    }
  } catch (err) {
    console.warn('Migration note:', err.message);
  }
}

/**
 * Get all meet & greet submissions.
 */
export async function getSubmissions() {
  await initDatabase();
  const res = await execute("SELECT payload_json FROM meet_greet_submissions ORDER BY submitted_at DESC;");
  return res.rows.map(r => JSON.parse(r.payload_json));
}

/**
 * Get single submission by Reference ID.
 */
export async function getSubmissionById(referenceId) {
  await initDatabase();
  const res = await execute({
    sql: "SELECT payload_json FROM meet_greet_submissions WHERE reference_id = ? LIMIT 1;",
    args: [referenceId]
  });
  if (res.rows.length === 0) return null;
  return JSON.parse(res.rows[0].payload_json);
}

/**
 * Insert or replace a submission.
 */
export async function saveSubmission(submission) {
  await initDatabase();
  await execute({
    sql: `INSERT OR REPLACE INTO meet_greet_submissions 
          (reference_id, status, submitted_at, full_name, email, country, city, meeting_type, preferred_date, payload_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    args: [
      submission.referenceId,
      submission.status || 'Pending Review',
      submission.submittedAt || new Date().toISOString(),
      submission.personalInfo?.fullName || '',
      submission.personalInfo?.email || '',
      submission.personalInfo?.country || '',
      submission.personalInfo?.city || '',
      submission.meetAndGreetInfo?.meetingType || '',
      submission.meetAndGreetInfo?.preferredDate || '',
      JSON.stringify(submission)
    ]
  });

  // Sync to local JSON backup
  try {
    const list = await getSubmissions();
    const filePath = path.join(DATA_DIR, 'submissions.json');
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(list, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (e) {
    // Non-fatal if serverless or disk read-only
  }

  return submission;
}

/**
 * Bulk save submissions list.
 */
export async function saveSubmissionsList(list) {
  await initDatabase();
  for (const item of list) {
    await saveSubmission(item);
  }
}

/**
 * Get all administrators.
 */
export async function getAdmins() {
  await initDatabase();
  const res = await execute("SELECT * FROM meet_greet_admins;");
  return res.rows.map(r => ({
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    role: r.role,
    passwordHash: r.password_hash,
    salt: r.salt,
    createdAt: r.created_at,
    lastLoginAt: r.last_login_at
  }));
}

/**
 * Find admin by email.
 */
export async function findAdminByEmail(email) {
  await initDatabase();
  const cleanEmail = email.trim().toLowerCase();
  const res = await execute({
    sql: "SELECT * FROM meet_greet_admins WHERE email = ? LIMIT 1;",
    args: [cleanEmail]
  });
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    role: r.role,
    passwordHash: r.password_hash,
    salt: r.salt,
    createdAt: r.created_at,
    lastLoginAt: r.last_login_at
  };
}

/**
 * Save or update administrator.
 */
export async function saveAdmin(admin) {
  await initDatabase();
  await execute({
    sql: `INSERT OR REPLACE INTO meet_greet_admins 
          (id, email, full_name, role, password_hash, salt, created_at, last_login_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    args: [
      admin.id,
      admin.email.trim().toLowerCase(),
      admin.fullName,
      admin.role,
      admin.passwordHash,
      admin.salt,
      admin.createdAt,
      admin.lastLoginAt || null
    ]
  });

  // Dual backup to JSON
  try {
    const admins = await getAdmins();
    const filePath = path.join(DATA_DIR, 'admins.json');
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(admins, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (e) {}
}

/**
 * Record an audit log.
 */
export async function recordAuditLog(actorEmail, action, targetReferenceId = null, details = {}) {
  await initDatabase();
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  await execute({
    sql: `INSERT INTO meet_greet_audit_logs (id, timestamp, actor_email, action, target_reference_id, details_json)
          VALUES (?, ?, ?, ?, ?, ?);`,
    args: [
      logId,
      timestamp,
      actorEmail,
      action,
      targetReferenceId || null,
      JSON.stringify(details || {})
    ]
  });

  // Keep latest 500 audit logs
  await execute(`
    DELETE FROM meet_greet_audit_logs 
    WHERE id NOT IN (
      SELECT id FROM meet_greet_audit_logs ORDER BY timestamp DESC LIMIT 500
    );
  `);
}

/**
 * Get audit logs.
 */
export async function getAuditLogs(limit = 100) {
  await initDatabase();
  const res = await execute({
    sql: "SELECT * FROM meet_greet_audit_logs ORDER BY timestamp DESC LIMIT ?;",
    args: [limit]
  });
  return res.rows.map(r => ({
    id: r.id,
    timestamp: r.timestamp,
    actorEmail: r.actor_email,
    action: r.action,
    targetReferenceId: r.target_reference_id,
    details: r.details_json ? JSON.parse(r.details_json) : {}
  }));
}

/**
 * Get global settings.
 */
export async function getSettings() {
  await initDatabase();
  const defaultPricing = {
    feeAmount: 500,
    currency: 'USD',
    feeRequired: true,
    acceptedGiftCards: [
      'Apple Gift Card',
      'Amazon',
      'Steam',
      'Google Play',
      'Vanilla Visa / Mastercard',
      'Razer Gold'
    ],
    instructions: 'Enter a valid gift card claim code to complete VIP pass accreditation.'
  };

  const res = await execute("SELECT value_json FROM meet_greet_settings WHERE key = 'main' LIMIT 1;");
  if (res.rows.length === 0) {
    return {
      intakeStatus: 'Active',
      eventTitle: 'A Moment with Keanu Reeves',
      agency: 'WME (William Morris Endeavor)',
      coordinatorEmail: 'guest.relations@wmeagency.com',
      capacityLimit: 25,
      vipCardPricing: defaultPricing,
      updatedAt: new Date().toISOString()
    };
  }
  const parsed = JSON.parse(res.rows[0].value_json);
  if (!parsed.vipCardPricing) {
    parsed.vipCardPricing = defaultPricing;
  }
  return parsed;
}

/**
 * Save settings.
 */
export async function saveSettings(settings) {
  await initDatabase();
  await execute({
    sql: `INSERT OR REPLACE INTO meet_greet_settings (key, value_json) VALUES ('main', ?);`,
    args: [JSON.stringify(settings)]
  });

  // Dual backup to JSON
  try {
    const filePath = path.join(DATA_DIR, 'settings.json');
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(settings, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (e) {}

  return settings;
}

/**
 * Get VIP card activation state by card reference / ID.
 */
export async function getCardActivation(cardId) {
  await initDatabase();
  const sanitizedId = String(cardId).trim().toUpperCase();
  const res = await execute({
    sql: `SELECT value_json FROM meet_greet_settings WHERE key = ?;`,
    args: [`card_activation_${sanitizedId}`]
  });
  if (res.rows.length === 0) return null;
  try {
    return JSON.parse(res.rows[0].value_json);
  } catch {
    return null;
  }
}

/**
 * Save VIP card activation state.
 */
export async function saveCardActivation(cardId, data) {
  await initDatabase();
  const sanitizedId = String(cardId).trim().toUpperCase();
  const payload = {
    ...data,
    cardId: sanitizedId,
    updatedAt: new Date().toISOString()
  };
  await execute({
    sql: `INSERT OR REPLACE INTO meet_greet_settings (key, value_json) VALUES (?, ?);`,
    args: [`card_activation_${sanitizedId}`, JSON.stringify(payload)]
  });
  return payload;
}

export function isCloudDatabase() {
  return isCloud;
}

export default {
  initDatabase,
  getSubmissions,
  getSubmissionById,
  saveSubmission,
  saveSubmissionsList,
  getAdmins,
  findAdminByEmail,
  saveAdmin,
  recordAuditLog,
  getAuditLogs,
  getSettings,
  saveSettings,
  getCardActivation,
  saveCardActivation,
  isCloudDatabase
};
