# Celebrity Meet & Greet Request Form
### Vanguard Talent Relations | Private Fan Engagement Intake

A responsive, high-end, and secure **Celebrity Meet & Greet Request Form** crafted with a black, white, and subtle gold luxury aesthetic. Fans can complete an inquiry to express interest in an in-person or virtual meet & greet with their preferred celebrity or public figure.

---

## ✦ Key Features

1. **Premium Celebrity-Inspired Aesthetic**
   - Palette: Deep obsidian blacks (`#0A0A0C`, `#121215`), subtle brushed champagne gold accents (`#C5A059`, `#E0BE7A`), and crisp white typography.
   - Editorial Typography: Cormorant Garamond serif headlines paired with modern Inter sans-serif body copy.
   - Tactile UI: Glassmorphism container, gold glow focus states, custom gold checkboxes, and interactive subtle hover states.

2. **Complete Field Specification**
   - **Personal Information**: Full Name, Email Address (format validated), Phone Number (with international dial code picker), Country of Residence (comprehensive country list), City.
   - **Meet & Greet Information**: Celebrity's Name, Preferred Meeting Type (*In-person*, *Virtual*, *No Preference*), Number of People Attending (1 to 5+ attendees), Preferred Date (optional), Reason for Meeting (optional with character counter), Additional Message (optional).
   - **Confirmations**: Accurate information certification, and Privacy Policy acknowledgement with an accessible interactive modal.

3. **Client & Server-Side Validation**
   - Real-time inline field validation on blur and full validation on submit.
   - Accessible ARIA attributes (`aria-invalid`, `aria-describedby`, `role="alert"`).
   - Loading indicator with spinning state on the submit button.
   - Clear error banners and field highlights.

4. **Polished Confirmation State**
   - After submission, replaces the form with a high-end confirmation card.
   - Generates a unique tracking reference code (`MG-XXXXXX`) with one-click clipboard copying.
   - Presents a structured summary of requested details.
   - Prominently displays the availability notice emphasizing that submitting does not guarantee a meeting.
   - Option to submit another inquiry.

---

## ✦ Submission Handling & Data Storage

### Current Working Mechanism
- The application includes a functional **Express Intake Server** (`server.js`) that exposes `POST /api/submissions`.
- When a fan submits the form:
  1. The server performs independent server-side validation against all required fields, email formatting, string lengths, and mandatory confirmations.
  2. The server generates a unique reference ID (e.g. `MG-DA5DFD`) and timestamp.
  3. The submission is appended to `data/submissions.json` via safe atomic writes.
  4. The server logs the submission to stdout and returns HTTP 201 with the receipt summary.

### Production Storage & Integration Options
For production environments, submissions can be routed securely without exposing credentials to the client:
- **Relational Databases (PostgreSQL / Supabase / MySQL)**: Connect via `DATABASE_URL` in an environment variable to store records in an encrypted `submissions` table.
- **Transactional Email (Resend / SendGrid / Postmark)**: Trigger an automated notification to talent managers and send an inquiry receipt to the fan using private server-side API keys.
- **CRM / Talent Management (Airtable / HubSpot / Notion)**: Forward validated records via secure server-side webhooks.

---

## ✦ Getting Started

### 1. Installation
```bash
npm install
```

### 2. Run in Development Mode
Runs the Vite development server with hot-module reloading:
```bash
npm run dev
```

### 3. Build & Run Production Server
Builds the optimized production bundle and runs the intake server on port 4000:
```bash
npm run build
npm start
```
Open [http://localhost:4000](http://localhost:4000) in your browser.
