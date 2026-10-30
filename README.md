# meet-and-greet

# WME (William Morris Endeavor) — Keanu Reeves Meet & Greet Intake & Admin Portal

A high-end, responsive, and secure **Celebrity Meet & Greet Request Form** and **Enterprise Administrative Dashboard** for **WME (William Morris Endeavor)**, configured for talent engagement with **Keanu Reeves**.

The project features a public-facing editorial intake form and an enterprise-grade administrative dashboard for vetting fan inquiries, scheduling, tracking audit history, recording private internal notes, and exporting sanitized CSVs.

---

## ✦ Key Features

### 1. Public Request Form (`/`)
- **Editorial Brand Identity**: Restrained paper/charcoal palette with subtle burgundy accents (`#6B1D2F`), `DM Serif Display` typography paired with `Inter`, and sharp 2px corner radii.
- **Fixed Celebrity Field**: Designated talent locked to **Keanu Reeves** under WME representation standards.
- **Segmented Phone Prefix Selector**: Custom responsive dial code select with 100+ countries, preventing international prefix text cramping.
- **Government-Issued Identification Verification**: Section 03 captures certified ID document type (*Driver's License*, *Passport*, *National Identity Card*, *State ID*, *Military ID*), document number, issuing jurisdiction, and high-resolution photo ID upload with instant preview and inspection lightbox.
- **Dual-Modality Digital Signature Pad**: Section 04 provides an official legal execution pad supporting both smooth draw-to-sign on interactive HTML5 Canvas (mouse, touch, stylus) and formal typed e-signatures rendered in cursive typography, backed by a legal affirmation declaration under penalty of false representation.
- **Real-Time Validation**: Instant inline validation and accessible ARIA attributes.
- **Sticky Desktop Navigation**: The introduction and guidelines stay pinned alongside form fields while scrolling on desktop (`overflow-x: clip`), with zero horizontal overflow on mobile viewports (320px–430px).
- **Confirmation State**: Generates a unique tracking reference code (`MG-XXXXXX`) with one-click clipboard copying, displaying ID verification certification and legal signature timestamp.

### 2. Enterprise Admin Dashboard (`/admin`)
- **Secure Authentication**:
  - Memory-hard `scrypt` password hashing with unique 64-byte random salts.
  - HMAC-SHA256 signed bearer sessions with an 8-hour expiration window.
  - Backend authorization middleware protecting all `/api/admin/*` endpoints.
- **Real-Time Pipeline Metrics**:
  - Automatically calculated from persistent records: *Total Submissions*, *Submitted (New)*, *Under Review*, *Awaiting Response*, *Approved*, *Confirmed*, and *Rejected/Cancelled*.
  - *Approved* is strictly kept distinct from *Confirmed*.
  - Clicking any metric card instantly filters the inquiries list.
- **Request Management**:
  - Real-time search across applicant name, email, city, country, reference ID, and ID document numbers.
  - Live table and card badges showing verified Government ID document types and Digital Signature execution status.
  - Filtering by application status and meeting format (*In-person*, *Virtual*, *No preference*).
  - Sorting by date or applicant name with pagination.
  - Desktop data table and mobile touch card layout (<768px).
- **Application Detail Drawer**:
  - Complete fan profile, attendance size, preferred date, and fan statements ("Why Keanu Reeves?").
  - Dedicated **Government Identification & Vetting** card displaying ID type, number, issuing jurisdiction, and an interactive full-resolution ID document inspection lightbox.
  - Dedicated **Legal Execution & Digital Signature** card rendering the applicant's certified visual signature, signee name, timestamp, and legal attestation.
  - Status management workflow with required confirmation dialog for high-impact transitions (`Approved`, `Confirmed`, `Rejected`, `Cancelled`).
  - Historical status audit timeline tracking actor, timestamp, and justification reason.
  - Confidential staff internal notes thread with instant recording.
- **Event Governance**:
  - Toggle intake status between *Active* and *Paused*.
  - Set maximum attendee capacity limits and update talent coordinator contact.
- **Security Audit Trail**:
  - Live log tracking operator logins, status changes, internal notes, CSV exports, and configuration updates.
- **Sanitized CSV Export**:
  - One-click export of filtered applications including Government ID Type, ID Document Number, Issuing Jurisdiction, ID Document Attached (Yes/No), Digital Signature Type, Signed By, and Timestamp.
  - Protection against spreadsheet formula injection (`=`, `+`, `-`, `@`).

---

## ✦ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Vite 8
- **Backend**: Node.js, Express 5, Native Crypto (`scrypt`, `createHmac`)
- **Storage**: Persistent JSON stores in `data/` (`submissions.json`, `admins.json`, `audit_logs.json`, `settings.json`)
- **Testing**: Puppeteer Core automated E2E & cross-device responsiveness test suite

---

## ✦ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/claudecode11121/meet-and-greet.git
cd meet-and-greet

# Install dependencies
npm install

# Build the client application
npm run build

# Start the unified backend server
node server.js
```

The application will be live at:
- **Public Intake Form**: `http://localhost:4000/`
- **Admin Portal**: `http://localhost:4000/admin`

---

## ✦ Default Administrator Credentials

To access the administrative dashboard:
- **Email**: `admin@wmeagency.com`
- **Password**: `KeanuMeet2026!WME`

To create additional administrators or update credentials via CLI:
```bash
node seed-admin.mjs <email> <password> [fullName] [role]
```

---

## ✦ Automated Testing

Run the full automated E2E test suite:
```bash
# Admin E2E test suite (Authentication, Metrics, Search, Detail, Notes, Status, Settings, Audit)
node test-admin-e2e.mjs

# Cross-Device Responsiveness test suite (320px to 1440px)
node test-responsive.mjs
```

---

## ✦ License
&copy; WME (William Morris Endeavor). All rights reserved.
