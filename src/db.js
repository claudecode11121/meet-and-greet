import 'dotenv/config';
import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure project data folder exists
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let client = null;
let localClient = null;
let isCloud = false;
let isInitialized = false;

function getLocalClient() {
  if (!localClient) {
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
      return await client.execute(queryObj);
    } catch (err) {
      console.warn(`✦ Turso Cloud query notice (${err.message}). Using local libSQL replica.`);
      return await getLocalClient().execute(queryObj);
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
  if (isInitialized) return client || getLocalClient();

  const local = getLocalClient();
  await ensureTables(local);

  const cloudUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  if (cloudUrl && cloudUrl.startsWith('libsql://')) {
    try {
      console.log(`✦ Connecting to Turso Cloud Database: ${cloudUrl}`);
      const testClient = createClient({
        url: cloudUrl,
        authToken: authToken,
        fetch: (url, opts) => fetch(url, { ...opts, signal: AbortSignal.timeout(5000) })
      });
      await testClient.execute("SELECT 1 AS connected;");
      client = createClient({ url: cloudUrl, authToken: authToken });
      isCloud = true;
      await ensureTables(client);
      console.log('✓ Successfully connected to Turso Cloud Database!');
    } catch (err) {
      console.warn(`✦ Turso Cloud notice (${err.message}). Local libSQL active.`);
    }
  }

  // Migrate initial seed data from JSON files if database tables are currently empty
  await migrateFromJsonFiles();

  isInitialized = true;
  return isCloud ? client : local;
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
  const res = await execute("SELECT value_json FROM meet_greet_settings WHERE key = 'main' LIMIT 1;");
  if (res.rows.length === 0) {
    return {
      intakeStatus: 'Active',
      eventTitle: 'A Moment with Keanu Reeves',
      agency: 'WME (William Morris Endeavor)',
      coordinatorEmail: 'guest.relations@wmeagency.com',
      capacityLimit: 25,
      updatedAt: new Date().toISOString()
    };
  }
  return JSON.parse(res.rows[0].value_json);
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
  isCloudDatabase
};
