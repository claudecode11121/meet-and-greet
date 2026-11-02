/**
 * Comprehensive Automated Test Suite:
 * VIP Access Card Integration & OATH PIN Activation Flow
 */

import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4055;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('🚀 Starting VIP Card & OATH PIN Activation Verification Suite...\n');

  // Start server on port 4055
  const server = spawn('node', ['server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'pipe'
  });

  server.stdout.on('data', (d) => {
    console.log(`[Server] ${d.toString().trim()}`);
  });

  server.stderr.on('data', (d) => {
    console.error(`[Server Error] ${d.toString().trim()}`);
  });

  // Wait for server to be responsive
  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) {
        serverReady = true;
        break;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  if (!serverReady) {
    console.error('❌ Server failed to start on port', PORT);
    server.kill();
    process.exit(1);
  }
  console.log('✓ Test server is live and healthy on', BASE_URL);

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failCount++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Backend API Card Manifest & Status Endpoints
    // -------------------------------------------------------------
    console.log('\n📋 Test 1: Card Manifest & Initial Status API...');
    const manifestRes = await fetch(`${BASE_URL}/api/card/manifest?ref=WME-KR26-0813-VIP`);
    const manifest = await manifestRes.json();
    assert(manifest.success === true, 'GET /api/card/manifest returns success');
    assert(manifest.data.credential.passId === 'WME-KR26-0813-VIP', 'Manifest contains Brenda Wright passId WME-KR26-0813-VIP');
    assert(manifest.data.credential.activationPin === '813-026', 'Manifest contains activation PIN 813-026');
    assert(manifest.data.security.oathProtocol.includes('OATH'), 'Manifest specifies OATH security protocol');

    // -------------------------------------------------------------
    // Test 2: PIN Validation & Activation API
    // -------------------------------------------------------------
    console.log('\n📋 Test 2: OATH PIN Validation & Card Activation API...');
    // Reset to unactivated first
    await fetch(`${BASE_URL}/api/card/deactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'WME-KR26-0813-VIP' })
    });

    // Try invalid PIN
    const invalidRes = await fetch(`${BASE_URL}/api/card/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'WME-KR26-0813-VIP', pin: '999-999' })
    });
    const invalidJson = await invalidRes.json();
    assert(invalidRes.status === 401 && invalidJson.success === false, 'Invalid PIN correctly rejected with 401 Unauthorized');

    // Try valid PIN 813-026
    const validRes = await fetch(`${BASE_URL}/api/card/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'WME-KR26-0813-VIP', pin: '813-026' })
    });
    const validJson = await validRes.json();
    assert(validRes.ok && validJson.success === true, 'Generated PIN 813-026 accepted and activated card');
    assert(validJson.activation.activated === true, 'Activation record marked activated: true');
    assert(Boolean(validJson.activation.clearanceCode), 'Cryptographic clearance code issued');

    // Verify status endpoint reflects activation
    const statusRes = await fetch(`${BASE_URL}/api/card/status/WME-KR26-0813-VIP`);
    const statusJson = await statusRes.json();
    assert(statusJson.activated === true, 'GET /api/card/status confirms card is activated');

    // -------------------------------------------------------------
    // Test 3: Browser UI Verification: Card Activation Portal (/verify)
    // -------------------------------------------------------------
    console.log('\n📋 Test 3: Browser E2E - Card Activation Portal (/verify)...');
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    page.on('console', msg => console.log('[Browser Console]', msg.text()));
    page.on('pageerror', err => console.error('[Browser PageError]', err));

    // Reset card state for clean UI test
    await fetch(`${BASE_URL}/api/card/deactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'WME-KR26-0813-VIP' })
    });

    // Navigate to the verification URL encoded on the QR code
    await page.goto(`${BASE_URL}/verify?ref=WME-KR26-0813-VIP&guest=Brenda+Wright`, {
      waitUntil: 'networkidle0'
    });

    // Check page text
    const pageText = await page.evaluate(() => document.body.innerText);
    assert(pageText.includes('WME'), 'Page header contains WME brand');
    assert(pageText.includes('Keanu Reeves'), 'Page displays designated talent Keanu Reeves');
    assert(pageText.includes('Brenda Wright'), 'Page displays designated passholder Brenda Wright');
    assert(pageText.toUpperCase().includes('OATH SECURITY HANDSHAKE'), 'Page contains OATH Security Handshake section');

    // Click Auto-Fill: 813-026 or type directly into input
    await page.focus('#oathPinInput');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('813026');

    // Verify PIN input received 813-026
    const pinVal = await page.$eval('#oathPinInput', el => el.value);
    assert(pinVal.includes('813-026') || pinVal.includes('813026'), 'PIN input contains 813-026');

    // Small delay for React state update
    await new Promise(r => setTimeout(r, 200));

    // Click Authenticate & Activate VIP Card button
    await page.click('#submit-activate-btn');

    // Wait for success banner to render
    await page.waitForFunction(
      () => document.body.innerText.toUpperCase().includes('CREDENTIAL SUCCESSFULLY ACTIVATED'),
      { timeout: 8000 }
    );

    const activatedText = await page.evaluate(() => document.body.innerText);
    assert(activatedText.toUpperCase().includes('CREDENTIAL SUCCESSFULLY ACTIVATED'), 'Card Activation Portal renders success banner');
    assert(activatedText.includes('OATH-KR26-813-CLEAR'), 'Clearance code rendered on page');
    assert(activatedText.includes('ACTIVATED & SYNCED'), 'Pass preview displays ACTIVATED & SYNCED badge');

    // Test Flip Button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const flip = btns.find(b => b.innerText.toUpperCase().includes('SHOW BACK FACE'));
      if (flip) flip.click();
    });
    await new Promise(r => setTimeout(r, 400));
    const flipText = await page.evaluate(() => document.body.innerText);
    assert(flipText.toUpperCase().includes('SHOW FRONT FACE'), 'Flip button toggles between front and back credential face');

    // -------------------------------------------------------------
    // Test 4: Interactive Standalone Card (/meet-and-greet-card/index.html)
    // -------------------------------------------------------------
    console.log('\n📋 Test 4: Standalone Interactive Card OATH Activation Modal...');
    await page.goto(`${BASE_URL}/meet-and-greet-card/index.html`, {
      waitUntil: 'networkidle0'
    });

    // Check OATH Activate button exists
    const hasActivateBtn = await page.$('#activateCardBtn');
    assert(Boolean(hasActivateBtn), 'Standalone card controls bar includes OATH Activate button');

    // Open OATH modal
    await page.evaluate(() => document.getElementById('activateCardBtn').click());
    await page.waitForSelector('#authModal.is-active', { timeout: 3000 });
    const modalVisible = await page.$eval('#authModal', el => el.classList.contains('is-active'));
    assert(modalVisible, 'Clicking OATH Activate opens the OATH PIN Activation modal');

    // If already activated from earlier tests, click reset to test activation cycle
    const isAlreadyActive = await page.$eval('#authSuccessSection', el => el.style.display !== 'none');
    if (isAlreadyActive) {
      await page.evaluate(() => document.getElementById('resetActivationBtn').click());
      await page.waitForFunction(
        () => document.querySelector('#authInputSection').style.display !== 'none',
        { timeout: 3000 }
      );
    }

    // Quick-fill and submit in standalone card
    await page.waitForSelector('#quickFillPinBtn', { visible: true });
    await page.evaluate(() => document.getElementById('quickFillPinBtn').click());
    const standalonePin = await page.$eval('#cardPinInput', el => el.value);
    assert(standalonePin === '813-026', 'Standalone card modal auto-fills generated PIN 813-026');

    await page.evaluate(() => document.getElementById('submitPinAuthBtn').click());
    await page.waitForFunction(
      () => document.querySelector('#authSuccessSection').style.display !== 'none',
      { timeout: 5000 }
    );
    const successVisible = await page.$eval('#authSuccessSection', el => el.style.display !== 'none');
    assert(successVisible, 'Standalone card successfully authenticated and activated via OATH PIN');

    await browser.close();

    console.log(`\n======================================================`);
    console.log(`🏁 Test Summary: ${passCount} Passed, ${failCount} Failed.`);
    console.log(`======================================================\n`);

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    server.kill();
  }
}

runTests();
