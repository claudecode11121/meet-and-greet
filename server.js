import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import db from './src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Turso / libSQL Database (Cloud or Local Fallback)
try {
  await db.initDatabase();
} catch (dbErr) {
  console.error('[WME Server] Database initialization notice:', dbErr.message);
}

// Determine data storage directory:
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
const SOURCE_DATA_DIR = path.join(__dirname, 'data');
const DATA_DIR = isServerless ? path.join('/tmp', 'wme-data') : SOURCE_DATA_DIR;

const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Session secret from environment or securely generated
const SESSION_SECRET = process.env.SESSION_SECRET || 'wme-keanu-reeves-session-secret-key-2026';

// Cryptographic helpers for password hashing (using native crypto.scrypt)
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, salt, storedHash) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

// Initialize authorized admin account in database
async function initializeAdminAccount() {
  try {
    let admins = await db.getAdmins();
    if (!admins || admins.length === 0) {
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@wmeagency.com').trim().toLowerCase();
      const adminPassword = process.env.ADMIN_PASSWORD || 'KeanuMeet2026!WME';
      const adminName = process.env.ADMIN_NAME || 'WME Guest Relations Lead';

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(adminPassword, salt);

      const initialAdmin = {
        id: `adm_${crypto.randomBytes(4).toString('hex')}`,
        email: adminEmail,
        fullName: adminName,
        role: 'Administrator',
        passwordHash,
        salt,
        createdAt: new Date().toISOString(),
        lastLoginAt: null
      };

      await db.saveAdmin(initialAdmin);
      console.log(`✦ Initialized Authorized Administrator in Turso Database: ${adminEmail}`);
    }
  } catch (err) {
    console.error('Error initializing admin account in db:', err);
  }
}
try {
  await initializeAdminAccount();
} catch (adminErr) {
  console.error('[WME Server] Admin initialization notice:', adminErr.message);
}

// Helpers for reading/writing data via Turso Database
async function getSubmissions() {
  return await db.getSubmissions();
}

async function saveSubmissionsList(list) {
  return await db.saveSubmissionsList(list);
}

async function getAuditLogs() {
  return await db.getAuditLogs();
}

async function recordAuditLog(actorEmail, action, targetReferenceId = null, details = {}) {
  return await db.recordAuditLog(actorEmail, action, targetReferenceId, details);
}

// Session Token Generation & Verification
function createSessionToken(admin) {
  const payload = {
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    role: admin.role,
    exp: Date.now() + 8 * 3600 * 1000 // 8 hours validity
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

function verifySessionToken(tokenString) {
  if (!tokenString || typeof tokenString !== 'string') return null;
  const parts = tokenString.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Authorization Middleware
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  const session = verifySessionToken(token);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: A valid administrative session is required.'
    });
  }

  req.admin = session;
  next();
}

// Middleware
app.use(cors());

// Normalize req.url if rewritten by Vercel serverless functions
app.use((req, res, next) => {
  if (req.originalUrl && req.originalUrl.startsWith('/api') && !req.url.startsWith('/api')) {
    req.url = req.originalUrl;
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Helper to normalize status strings
const VALID_STATUSES = [
  'Submitted',
  'Under Review',
  'Awaiting Response',
  'Approved',
  'Confirmed',
  'Rejected',
  'Cancelled'
];

function normalizeStatus(st) {
  if (!st) return 'Submitted';
  const match = VALID_STATUSES.find(v => v.toLowerCase() === st.toLowerCase().replace(/_/g, ' '));
  return match || st;
}

// Email regex validation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'WME (William Morris Endeavor) Meet & Greet Request Intake & Admin API',
    timestamp: new Date().toISOString()
  });
});

/* ==========================================================================
   PUBLIC INTAKE ENDPOINT
   ========================================================================== */
app.post('/api/submissions', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      country,
      city,
      celebrityName,
      meetingType,
      preferredDate,
      attendees,
      reason,
      message,
      identification,
      signature,
      confirmedAccurate,
      acknowledgedPrivacy
    } = req.body || {};

    const errors = {};

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      errors.fullName = 'Full Name is required (minimum 2 characters).';
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      errors.email = 'A valid email address is required.';
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 6) {
      errors.phone = 'Phone number is required, including country code.';
    }

    if (!country || typeof country !== 'string' || !country.trim()) {
      errors.country = 'Country of residence is required.';
    }

    if (!city || typeof city !== 'string' || city.trim().length < 2) {
      errors.city = 'City is required (minimum 2 characters).';
    }

    const assignedCelebrity = 'Keanu Reeves';

    const validMeetingTypes = [
      'In-person',
      'Virtual',
      'No preference',
      'In-person Meet & Greet',
      'Virtual Meet & Greet',
      'No Preference'
    ];
    if (!meetingType || !validMeetingTypes.includes(meetingType)) {
      errors.meetingType = 'Please select a preferred meeting format.';
    }

    if (!attendees || typeof attendees !== 'string' || !attendees.trim()) {
      errors.attendees = 'Please select the number of attendees.';
    }

    // Government Identification Validation
    const cleanIdType = identification && typeof identification.idType === 'string' ? identification.idType.trim() : '';
    const cleanIdNumber = identification && typeof identification.idNumber === 'string' ? identification.idNumber.trim() : '';
    const cleanIdCountry = identification && typeof identification.idCountry === 'string' ? identification.idCountry.trim() : (country ? country.trim() : '');
    const cleanIdDocData = identification && typeof identification.idDocumentData === 'string' ? identification.idDocumentData.trim() : '';
    const cleanIdFileName = identification && typeof identification.idFileName === 'string' ? identification.idFileName.trim() : '';
    const cleanIdFileSize = identification && typeof identification.idFileSize === 'string' ? identification.idFileSize.trim() : '';

    if (!cleanIdType) {
      errors.idType = 'Government ID type is required.';
    }
    if (!cleanIdNumber || cleanIdNumber.length < 2) {
      errors.idNumber = 'Government ID document number is required.';
    }
    if (!cleanIdCountry) {
      errors.idCountry = 'ID issuing country is required.';
    }
    if (!cleanIdDocData) {
      errors.idDocument = 'A photo or scan of your government-issued ID card is required.';
    }

    // Digital Signature Validation
    const cleanSigType = signature && signature.signatureType === 'typed' ? 'typed' : 'drawn';
    const cleanSigData = signature && typeof signature.signatureData === 'string' ? signature.signatureData.trim() : '';
    const cleanSigneeName = signature && typeof signature.signeeName === 'string' ? signature.signeeName.trim() : (fullName ? fullName.trim() : '');

    if (!cleanSigData || cleanSigData.length < 30) {
      errors.signature = 'A digital signature (drawn or typed) is required to execute this application.';
    }
    if (!cleanSigneeName || cleanSigneeName.length < 2) {
      errors.signeeName = 'Signee legal name is required.';
    }

    if (confirmedAccurate !== true) {
      errors.confirmedAccurate = 'You must confirm that the information provided is accurate.';
    }

    if (acknowledgedPrivacy !== true) {
      errors.acknowledgedPrivacy = 'You must acknowledge and accept the privacy policy.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please review the highlighted fields.',
        errors
      });
    }

    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const referenceId = `MG-${randomHex}`;

    const submissionRecord = {
      referenceId,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      statusHistory: [
        {
          fromStatus: null,
          toStatus: 'Submitted',
          timestamp: new Date().toISOString(),
          changedBy: 'System / Fan Intake',
          reason: 'Initial application submitted'
        }
      ],
      internalNotes: [],
      personalInfo: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        country: country.trim(),
        city: city.trim()
      },
      meetAndGreetInfo: {
        celebrityName: assignedCelebrity,
        meetingType,
        preferredDate: preferredDate || null,
        attendees: attendees.trim(),
        reason: reason ? reason.trim() : '',
        message: message ? message.trim() : ''
      },
      identification: {
        idType: cleanIdType,
        idNumber: cleanIdNumber,
        idCountry: cleanIdCountry,
        idDocumentData: cleanIdDocData,
        idFileName: cleanIdFileName,
        idFileSize: cleanIdFileSize
      },
      signature: {
        signatureType: cleanSigType,
        signatureData: cleanSigData,
        signeeName: cleanSigneeName,
        signedAt: (signature && signature.signedAt) || new Date().toISOString()
      },
      confirmations: {
        confirmedAccurate: true,
        acknowledgedPrivacy: true,
        consentTimestamp: new Date().toISOString()
      },
      metadata: {
        userAgent: req.headers['user-agent'] || 'unknown',
        ipAddress: (req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'])) ||
                   (req.socket && req.socket.remoteAddress) ||
                   (req.connection && req.connection.remoteAddress) ||
                   'unknown'
      }
    };

    await db.saveSubmission(submissionRecord);

    console.log(`[PUBLIC INTAKE] New Meet & Greet Request: ${referenceId} for Keanu Reeves by ${submissionRecord.personalInfo.fullName} (ID: ${cleanIdType}, Sig: ${cleanSigType})`);

    return res.status(201).json({
      success: true,
      message: 'Your Meet & Greet request has been received.',
      referenceId,
      submittedAt: submissionRecord.submittedAt,
      summary: {
        fullName: submissionRecord.personalInfo.fullName,
        email: submissionRecord.personalInfo.email,
        celebrityName: assignedCelebrity,
        meetingType: submissionRecord.meetAndGreetInfo.meetingType,
        attendees: submissionRecord.meetAndGreetInfo.attendees,
        preferredDate: submissionRecord.meetAndGreetInfo.preferredDate,
        idType: submissionRecord.identification.idType,
        idNumber: submissionRecord.identification.idNumber,
        hasIdDocument: Boolean(submissionRecord.identification.idDocumentData),
        signatureType: submissionRecord.signature.signatureType,
        signeeName: submissionRecord.signature.signeeName,
        signatureData: submissionRecord.signature.signatureData,
        signedAt: submissionRecord.signature.signedAt
      }
    });
  } catch (error) {
    console.error('Error handling submission:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred while processing your request.'
    });
  }
});

/* ==========================================================================
   ADMIN AUTHENTICATION ENDPOINTS
   ========================================================================== */
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email address and password are required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = await db.findAdminByEmail(cleanEmail);
    if (!admin) {
      await recordAuditLog(cleanEmail, 'LOGIN_FAILED', null, { reason: 'User not found' });
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Access is restricted to authorized WME administrators.'
      });
    }

    const isValid = verifyPassword(password, admin.salt, admin.passwordHash);
    if (!isValid) {
      await recordAuditLog(cleanEmail, 'LOGIN_FAILED', null, { reason: 'Password mismatch' });
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Access is restricted to authorized WME administrators.'
      });
    }

    // Update last login
    admin.lastLoginAt = new Date().toISOString();
    await db.saveAdmin(admin);

    const token = createSessionToken(admin);
    await recordAuditLog(admin.email, 'LOGIN_SUCCESS', null, { role: admin.role });

    return res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred during authentication.'
    });
  }
});

app.get('/api/admin/me', requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    admin: req.admin
  });
});

app.post('/api/admin/logout', requireAdminAuth, (req, res) => {
  recordAuditLog(req.admin.email, 'LOGOUT', null);
  res.json({ success: true, message: 'Logged out successfully.' });
});

/* ==========================================================================
   ADMIN METRICS & OVERVIEW STATS
   ========================================================================== */
app.get('/api/admin/stats', requireAdminAuth, async (req, res) => {
  try {
    const list = await getSubmissions();

    const counts = {
      total: list.length,
      submitted: 0,
      underReview: 0,
      awaitingResponse: 0,
      approved: 0,
      confirmed: 0,
      rejected: 0,
      cancelled: 0,
      recent7Days: 0
    };

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 3600 * 1000;

    for (const item of list) {
      const st = normalizeStatus(item.status);
      if (st === 'Submitted') counts.submitted++;
      else if (st === 'Under Review') counts.underReview++;
      else if (st === 'Awaiting Response') counts.awaitingResponse++;
      else if (st === 'Approved') counts.approved++;
      else if (st === 'Confirmed') counts.confirmed++;
      else if (st === 'Rejected') counts.rejected++;
      else if (st === 'Cancelled') counts.cancelled++;

      if (item.submittedAt && new Date(item.submittedAt).getTime() >= sevenDaysAgo) {
        counts.recent7Days++;
      }
    }

    res.json({
      success: true,
      stats: counts,
      celebrity: 'Keanu Reeves',
      agency: 'WME (William Morris Endeavor)'
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ success: false, error: 'Failed to calculate overview statistics.' });
  }
});

/* ==========================================================================
   ADMIN REQUEST MANAGEMENT & LISTING
   ========================================================================== */
app.get('/api/admin/submissions', requireAdminAuth, async (req, res) => {
  try {
    let list = await getSubmissions();
    const { search, status, meetingType, sortBy = 'submittedAt', sortOrder = 'desc', page = 1, limit = 15 } = req.query;

    // Filter by search string
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(item => {
        const ref = (item.referenceId || '').toLowerCase();
        const name = (item.personalInfo?.fullName || '').toLowerCase();
        const email = (item.personalInfo?.email || '').toLowerCase();
        const city = (item.personalInfo?.city || '').toLowerCase();
        const country = (item.personalInfo?.country || '').toLowerCase();
        const idNum = (item.identification?.idNumber || '').toLowerCase();
        const idType = (item.identification?.idType || '').toLowerCase();
        const signee = (item.signature?.signeeName || '').toLowerCase();
        return ref.includes(q) || name.includes(q) || email.includes(q) || city.includes(q) || country.includes(q) || idNum.includes(q) || idType.includes(q) || signee.includes(q);
      });
    }

    // Filter by Status
    if (status && status !== 'All') {
      const targetStatus = normalizeStatus(status).toLowerCase();
      list = list.filter(item => normalizeStatus(item.status).toLowerCase() === targetStatus);
    }

    // Filter by Meeting Type
    if (meetingType && meetingType !== 'All') {
      const targetType = meetingType.toLowerCase();
      list = list.filter(item => (item.meetAndGreetInfo?.meetingType || '').toLowerCase().includes(targetType));
    }

    // Sorting
    list.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'fullName') {
        valA = (a.personalInfo?.fullName || '').toLowerCase();
        valB = (b.personalInfo?.fullName || '').toLowerCase();
      } else if (sortBy === 'status') {
        valA = normalizeStatus(a.status);
        valB = normalizeStatus(b.status);
      } else {
        valA = new Date(a.submittedAt || 0).getTime();
        valB = new Date(b.submittedAt || 0).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const totalCount = list.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const totalPages = Math.ceil(totalCount / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = list.slice(startIndex, startIndex + limitNum);

    // Map items cleanly with normalized status
    const sanitizedItems = paginatedItems.map(item => ({
      referenceId: item.referenceId,
      submittedAt: item.submittedAt,
      status: normalizeStatus(item.status),
      personalInfo: item.personalInfo,
      meetAndGreetInfo: item.meetAndGreetInfo,
      identification: item.identification ? {
        idType: item.identification.idType,
        idNumber: item.identification.idNumber,
        idCountry: item.identification.idCountry,
        hasDocument: Boolean(item.identification.idDocumentData)
      } : null,
      signature: item.signature ? {
        signatureType: item.signature.signatureType,
        signeeName: item.signature.signeeName,
        signedAt: item.signature.signedAt,
        hasSignature: Boolean(item.signature.signatureData)
      } : null,
      notesCount: (item.internalNotes || []).length
    }));

    res.json({
      success: true,
      submissions: sanitizedItems,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error listing submissions:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve applications.' });
  }
});

/* ==========================================================================
   APPLICATION DETAIL VIEW
   ========================================================================== */
app.get('/api/admin/submissions/:referenceId', requireAdminAuth, async (req, res) => {
  try {
    const { referenceId } = req.params;
    const item = await db.getSubmissionById(referenceId);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    res.json({
      success: true,
      submission: {
        ...item,
        status: normalizeStatus(item.status),
        statusHistory: item.statusHistory || [],
        internalNotes: item.internalNotes || []
      }
    });
  } catch (err) {
    console.error('Error fetching submission details:', err);
    res.status(500).json({ success: false, error: 'Failed to load application details.' });
  }
});

/* ==========================================================================
   STATUS UPDATE & AUDIT HISTORY
   ========================================================================== */
app.patch('/api/admin/submissions/:referenceId/status', requireAdminAuth, async (req, res) => {
  try {
    const { referenceId } = req.params;
    const { status, reason = '' } = req.body || {};

    const targetStatus = normalizeStatus(status);
    if (!VALID_STATUSES.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}`
      });
    }

    const list = await getSubmissions();
    const index = list.findIndex(s => s.referenceId.toLowerCase() === referenceId.toLowerCase());
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    const previousStatus = normalizeStatus(list[index].status);
    list[index].status = targetStatus;

    if (!list[index].statusHistory) list[index].statusHistory = [];
    list[index].statusHistory.unshift({
      fromStatus: previousStatus,
      toStatus: targetStatus,
      timestamp: new Date().toISOString(),
      changedBy: req.admin.email,
      reason: reason.trim()
    });

    await saveSubmissionsList(list);

    await recordAuditLog(req.admin.email, 'STATUS_CHANGE', referenceId, {
      fromStatus: previousStatus,
      toStatus: targetStatus,
      reason: reason.trim()
    });

    res.json({
      success: true,
      message: `Status updated to ${targetStatus}`,
      submission: {
        ...list[index],
        status: targetStatus
      }
    });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ success: false, error: 'Failed to update application status.' });
  }
});

/* ==========================================================================
   INTERNAL ADMINISTRATIVE NOTES
   ========================================================================== */
app.post('/api/admin/submissions/:referenceId/notes', requireAdminAuth, async (req, res) => {
  try {
    const { referenceId } = req.params;
    const { text } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Note text cannot be empty.' });
    }

    const list = await getSubmissions();
    const index = list.findIndex(s => s.referenceId.toLowerCase() === referenceId.toLowerCase());
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    if (!list[index].internalNotes) list[index].internalNotes = [];

    const newNote = {
      id: `note_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      authorName: req.admin.fullName,
      authorEmail: req.admin.email
    };

    list[index].internalNotes.unshift(newNote);
    await saveSubmissionsList(list);

    await recordAuditLog(req.admin.email, 'ADD_INTERNAL_NOTE', referenceId, {
      noteId: newNote.id,
      preview: newNote.text.slice(0, 40)
    });

    res.json({
      success: true,
      message: 'Internal note recorded.',
      notes: list[index].internalNotes
    });
  } catch (err) {
    console.error('Error adding note:', err);
    res.status(500).json({ success: false, error: 'Failed to add internal note.' });
  }
});

/* ==========================================================================
   SECURE CSV EXPORT WITH FORMULA INJECTION DEFENSE
   ========================================================================== */
app.get('/api/admin/export/csv', requireAdminAuth, async (req, res) => {
  try {
    let list = await getSubmissions();
    const { search, status, meetingType } = req.query;

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(item => {
        const ref = (item.referenceId || '').toLowerCase();
        const name = (item.personalInfo?.fullName || '').toLowerCase();
        const email = (item.personalInfo?.email || '').toLowerCase();
        return ref.includes(q) || name.includes(q) || email.includes(q);
      });
    }

    if (status && status !== 'All') {
      const targetStatus = normalizeStatus(status).toLowerCase();
      list = list.filter(item => normalizeStatus(item.status).toLowerCase() === targetStatus);
    }

    if (meetingType && meetingType !== 'All') {
      const targetType = meetingType.toLowerCase();
      list = list.filter(item => (item.meetAndGreetInfo?.meetingType || '').toLowerCase().includes(targetType));
    }

    // Helper to sanitize CSV field and protect against formula injection (=, +, -, @)
    function sanitizeCsvCell(str) {
      if (str === null || str === undefined) return '""';
      let clean = String(str).replace(/"/g, '""');
      // Protect against spreadsheet formula execution
      if (/^[=+\-@\t\r]/.test(clean)) {
        clean = `'${clean}`;
      }
      return `"${clean}"`;
    }

    const headers = [
      'Reference ID',
      'Submission Date',
      'Status',
      'Celebrity',
      'Applicant Full Name',
      'Email Address',
      'Phone Number',
      'Country of Residence',
      'City',
      'Meeting Format',
      'Attendees',
      'Preferred Date',
      'Government ID Type',
      'ID Document Number',
      'ID Issuing Authority',
      'ID Document Attached',
      'Digital Signature Type',
      'Signed By',
      'Signed At'
    ];

    const rows = [headers.join(',')];

    for (const item of list) {
      const row = [
        sanitizeCsvCell(item.referenceId),
        sanitizeCsvCell(item.submittedAt ? new Date(item.submittedAt).toISOString().split('T')[0] : ''),
        sanitizeCsvCell(normalizeStatus(item.status)),
        sanitizeCsvCell(item.meetAndGreetInfo?.celebrityName || 'Keanu Reeves'),
        sanitizeCsvCell(item.personalInfo?.fullName || ''),
        sanitizeCsvCell(item.personalInfo?.email || ''),
        sanitizeCsvCell(item.personalInfo?.phone || ''),
        sanitizeCsvCell(item.personalInfo?.country || ''),
        sanitizeCsvCell(item.personalInfo?.city || ''),
        sanitizeCsvCell(item.meetAndGreetInfo?.meetingType || ''),
        sanitizeCsvCell(item.meetAndGreetInfo?.attendees || ''),
        sanitizeCsvCell(item.meetAndGreetInfo?.preferredDate || ''),
        sanitizeCsvCell(item.identification?.idType || 'Not Provided'),
        sanitizeCsvCell(item.identification?.idNumber || ''),
        sanitizeCsvCell(item.identification?.idCountry || ''),
        sanitizeCsvCell(item.identification?.idDocumentData ? 'Yes' : 'No'),
        sanitizeCsvCell(item.signature?.signatureType || 'N/A'),
        sanitizeCsvCell(item.signature?.signeeName || ''),
        sanitizeCsvCell(item.signature?.signedAt || '')
      ];
      rows.push(row.join(','));
    }

    const csvContent = rows.join('\r\n');
    const filename = `wme-keanu-reeves-inquiries-${new Date().toISOString().split('T')[0]}.csv`;

    await recordAuditLog(req.admin.email, 'EXPORT_CSV', null, {
      exportedRows: list.length,
      filters: { search, status, meetingType }
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('Error generating CSV export:', err);
    res.status(500).json({ success: false, error: 'Failed to export applications to CSV.' });
  }
});

/* ==========================================================================
   AUDIT LOGS & EVENT SETTINGS
   ========================================================================== */
app.get('/api/admin/audit-logs', requireAdminAuth, async (req, res) => {
  const logs = (await getAuditLogs()).slice(0, 100);
  res.json({ success: true, logs });
});

app.get('/api/admin/event-settings', requireAdminAuth, async (req, res) => {
  try {
    const settings = await db.getSettings();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to read event settings.' });
  }
});

app.put('/api/admin/event-settings', requireAdminAuth, async (req, res) => {
  try {
    const { intakeStatus, coordinatorEmail, capacityLimit } = req.body || {};
    let settings = await db.getSettings();

    if (intakeStatus) settings.intakeStatus = intakeStatus;
    if (coordinatorEmail) settings.coordinatorEmail = coordinatorEmail;
    if (capacityLimit) settings.capacityLimit = parseInt(capacityLimit, 10) || settings.capacityLimit;
    settings.updatedAt = new Date().toISOString();
    settings.updatedBy = req.admin.email;

    await db.saveSettings(settings);
    await recordAuditLog(req.admin.email, 'UPDATE_EVENT_SETTINGS', null, settings);

    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update event settings.' });
  }
});

/* ==========================================================================
   STATIC CLIENT SERVING
   ========================================================================== */
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
}

export { app };
export default app;

// Start Server when run directly (local development / container platforms)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`✦ WME (William Morris Endeavor) Intake & Admin Server running at http://localhost:${PORT}`);
    console.log(`✦ Storage: ${SUBMISSIONS_FILE}`);
    console.log(`✦ Initial Admin: admin@wmeagency.com (Password: KeanuMeet2026!WME)`);
  });
}
