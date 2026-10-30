import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');

const args = process.argv.slice(2);
const email = (args[0] || process.env.ADMIN_EMAIL || 'admin@wmeagency.com').trim().toLowerCase();
const password = args[1] || process.env.ADMIN_PASSWORD || 'KeanuMeet2026!WME';
const name = args[2] || process.env.ADMIN_NAME || 'WME Guest Relations Administrator';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let admins = [];
if (fs.existsSync(ADMINS_FILE)) {
  try {
    admins = JSON.parse(fs.readFileSync(ADMINS_FILE, 'utf-8'));
  } catch {
    admins = [];
  }
}

const salt = crypto.randomBytes(16).toString('hex');
const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');

const existingIndex = admins.findIndex(a => a.email.toLowerCase() === email);
const adminObj = {
  id: existingIndex >= 0 ? admins[existingIndex].id : `adm_${crypto.randomBytes(4).toString('hex')}`,
  email,
  fullName: name,
  role: 'Administrator',
  passwordHash,
  salt,
  createdAt: existingIndex >= 0 ? admins[existingIndex].createdAt : new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastLoginAt: existingIndex >= 0 ? admins[existingIndex].lastLoginAt : null
};

if (existingIndex >= 0) {
  admins[existingIndex] = adminObj;
  console.log(`Updated existing administrator account: ${email}`);
} else {
  admins.push(adminObj);
  console.log(`Created new administrator account: ${email}`);
}

fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2), 'utf-8');
console.log(`Password set securely with scrypt cryptographic hash.`);
