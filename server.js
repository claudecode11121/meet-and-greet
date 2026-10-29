import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

// Ensure storage directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(SUBMISSIONS_FILE)) {
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Helper to safely load submissions
function getSubmissions() {
  try {
    const raw = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading submissions file:', err);
    return [];
  }
}

// Helper to safely write submissions
function saveSubmission(record) {
  const list = getSubmissions();
  list.unshift(record); // newest first
  // Atomic write via temp file
  const tempPath = `${SUBMISSIONS_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(list, null, 2), 'utf-8');
  fs.renameSync(tempPath, SUBMISSIONS_FILE);
  return record;
}

// Email regex validation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Celebrity Meet & Greet Request Intake API',
    timestamp: new Date().toISOString()
  });
});

// POST endpoint for handling submissions
app.post('/api/submissions', (req, res) => {
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
      confirmedAccurate,
      acknowledgedPrivacy
    } = req.body || {};

    const errors = {};

    // 1. Personal Information Validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      errors.fullName = 'Full Name is required (minimum 2 characters).';
    } else if (fullName.trim().length > 100) {
      errors.fullName = 'Full Name must not exceed 100 characters.';
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      errors.email = 'A valid email address is required.';
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
      errors.phone = 'Phone number is required, including country code.';
    } else if (phone.trim().length > 30) {
      errors.phone = 'Phone number must not exceed 30 characters.';
    }

    if (!country || typeof country !== 'string' || !country.trim()) {
      errors.country = 'Country of residence is required.';
    }

    if (!city || typeof city !== 'string' || city.trim().length < 2) {
      errors.city = 'City is required (minimum 2 characters).';
    } else if (city.trim().length > 100) {
      errors.city = 'City must not exceed 100 characters.';
    }

    // 2. Meet & Greet Information Validation
    if (!celebrityName || typeof celebrityName !== 'string' || celebrityName.trim().length < 2) {
      errors.celebrityName = "Celebrity's Name is required (minimum 2 characters).";
    } else if (celebrityName.trim().length > 100) {
      errors.celebrityName = "Celebrity's Name must not exceed 100 characters.";
    }

    const validMeetingTypes = [
      'In-person',
      'Virtual',
      'No preference',
      'In-person Meet & Greet',
      'Virtual Meet & Greet',
      'No Preference'
    ];
    if (!meetingType || !validMeetingTypes.includes(meetingType)) {
      errors.meetingType = 'Please select a valid Preferred Meeting Type.';
    }

    if (!attendees || typeof attendees !== 'string' || !attendees.trim()) {
      errors.attendees = 'Please select the number of people attending.';
    }

    // Optional validations
    if (preferredDate) {
      const parsedDate = new Date(preferredDate);
      if (isNaN(parsedDate.getTime())) {
        errors.preferredDate = 'Please provide a valid date format.';
      }
    }

    if (reason && typeof reason === 'string' && reason.length > 2500) {
      errors.reason = 'Reason text cannot exceed 2,500 characters.';
    }

    if (message && typeof message === 'string' && message.length > 2500) {
      errors.message = 'Additional message cannot exceed 2,500 characters.';
    }

    // 3. Confirmations
    if (confirmedAccurate !== true) {
      errors.confirmedAccurate = 'You must confirm that the information provided is accurate.';
    }

    if (acknowledgedPrivacy !== true) {
      errors.acknowledgedPrivacy = 'You must acknowledge and accept the privacy policy.';
    }

    // If validation fails
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please review the highlighted fields.',
        errors
      });
    }

    // Generate unique reference code: MG-XXXXXX
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const referenceId = `MG-${randomHex}`;

    const submissionRecord = {
      referenceId,
      submittedAt: new Date().toISOString(),
      status: 'SUBMITTED',
      personalInfo: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        country: country.trim(),
        city: city.trim()
      },
      meetAndGreetInfo: {
        celebrityName: celebrityName.trim(),
        meetingType,
        preferredDate: preferredDate || null,
        attendees: attendees.trim(),
        reason: reason ? reason.trim() : '',
        message: message ? message.trim() : ''
      },
      confirmations: {
        confirmedAccurate: true,
        acknowledgedPrivacy: true
      },
      metadata: {
        userAgent: req.headers['user-agent'] || 'unknown',
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
      }
    };

    saveSubmission(submissionRecord);

    console.log(`[SUBMISSION] New Meet & Greet Request: ${referenceId} for "${submissionRecord.meetAndGreetInfo.celebrityName}" by "${submissionRecord.personalInfo.fullName}" (${submissionRecord.personalInfo.email})`);

    return res.status(201).json({
      success: true,
      message: 'Your Meet & Greet request has been received.',
      referenceId,
      submittedAt: submissionRecord.submittedAt,
      summary: {
        fullName: submissionRecord.personalInfo.fullName,
        email: submissionRecord.personalInfo.email,
        celebrityName: submissionRecord.meetAndGreetInfo.celebrityName,
        meetingType: submissionRecord.meetAndGreetInfo.meetingType,
        attendees: submissionRecord.meetAndGreetInfo.attendees,
        preferredDate: submissionRecord.meetAndGreetInfo.preferredDate
      }
    });
  } catch (error) {
    console.error('Error handling submission:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred while processing your request. Please try again later.'
    });
  }
});

// Serve frontend build if dist directory exists
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    // If request is not an API route and accepts HTML, serve index.html
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
}

// Start listening
app.listen(PORT, () => {
  console.log(`✦ Celebrity Meet & Greet Intake Server running at http://localhost:${PORT}`);
  console.log(`✦ Storage file: ${SUBMISSIONS_FILE}`);
});
