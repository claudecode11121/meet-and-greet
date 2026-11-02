/**
 * Comprehensive Automated Test Suite:
 * VIP Access Card Integration, Admin Pricing Control, Gift Card Payment Gate & OATH PIN Activation
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
  console.log('🚀 Starting VIP Card, Admin Pricing, Gift Card & OATH Activation Suite...\n');

  // Start server on port 4055
  const server = spawn('node', ['server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'pipe'
  });

  server.stdout.on('data', (d) => {
    // console.log(`[Server] ${d.toString().trim()}`);
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
    // Test 1: Admin Authentication & Dynamic Pricing Configuration
    // -------------------------------------------------------------
    console.log('\n📋 Test 1: Admin Login & VIP Pass Pricing Configuration API...');
    const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@wmeagency.com',
        password: 'KeanuMeet2026!WME'
      })
    });
    const loginJson = await loginRes.json();
    assert(loginRes.ok && Boolean(loginJson.token), 'Admin login successful and JWT token acquired');
    const adminToken = loginJson.token;

    // Configure VIP Card Pricing from admin side
    const updateSettingsRes = await fetch(`${BASE_URL}/api/admin/event-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        vipCardPricing: {
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
        }
      })
    });
    const updateSettingsJson = await updateSettingsRes.json();
    assert(updateSettingsRes.ok && updateSettingsJson.success === true, 'Admin PUT /api/admin/event-settings successfully saved VIP pricing');
    assert(updateSettingsJson.settings.vipCardPricing.feeAmount === 500, 'Admin feeAmount persisted as $500');
    assert(updateSettingsJson.settings.vipCardPricing.feeRequired === true, 'Admin feeRequired persisted as true');

    // Verify public pricing endpoint
    const pricingRes = await fetch(`${BASE_URL}/api/card/pricing`);
    const pricingJson = await pricingRes.json();
    assert(pricingRes.ok && pricingJson.success === true, 'GET /api/card/pricing returns success');
    assert(pricingJson.pricing.feeAmount === 500, 'Public pricing endpoint reflects configured $500 fee');
    assert(pricingJson.pricing.acceptedGiftCards.includes('Apple Gift Card'), 'Public pricing lists Apple Gift Card');

    // -------------------------------------------------------------
    // Test 2: Gift Card Payment Gate Rejection (Before Payment)
    // -------------------------------------------------------------
    console.log('\n📋 Test 2: Gate Enforcement - OATH PIN Activation Blocked Without Payment...');
    // Reset card and clear payment
    await fetch(`${BASE_URL}/api/card/deactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'WME-KR26-0813-VIP', clearPayment: true })
    });

    // Attempt PIN activation without payment
    const gateRes = await fetch(`${BASE_URL}/api/card/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'WME-KR26-0813-VIP', pin: '813-026' })
    });
    const gateJson = await gateRes.json();
    assert(gateRes.status === 402, 'Unpaid activation returns HTTP 402 Payment Required');
    assert(gateJson.feeRequired === true, 'Gate response specifies feeRequired: true');
    assert(gateJson.feeAmount === 500, 'Gate response specifies feeAmount: 500');

    // -------------------------------------------------------------
    // Test 3: Gift Card Payment Processing API (/api/card/pay)
    // -------------------------------------------------------------
    console.log('\n📋 Test 3: Gift Card Redemption & Clearing API (/api/card/pay)...');
    // Try invalid code
    const invalidPayRes = await fetch(`${BASE_URL}/api/card/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: 'WME-KR26-0813-VIP',
        giftCardType: 'Apple Gift Card',
        giftCardCode: '123'
      })
    });
    assert(invalidPayRes.status === 400, 'Short / invalid gift card claim code rejected with 400 Bad Request');

    // Submit valid gift card payment
    const validPayRes = await fetch(`${BASE_URL}/api/card/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: 'WME-KR26-0813-VIP',
        giftCardType: 'Apple Gift Card',
        giftCardCode: 'X7KM-92NQ-48PL-2026',
        giftCardPin: '8824',
        amount: 500
      })
    });
    const validPayJson = await validPayRes.json();
    assert(validPayRes.ok && validPayJson.success === true, 'Valid Gift Card successfully redeemed and verified');
    assert(validPayJson.payment.status === 'VERIFIED', 'Payment status marked VERIFIED');
    assert(Boolean(validPayJson.payment.paymentId), 'Payment receipt ID generated');
    assert(validPayJson.payment.giftCardCodeMasked.includes('****'), 'Claim code masked for security');

    // -------------------------------------------------------------
    // Test 4: OATH PIN Activation Post-Payment
    // -------------------------------------------------------------
    console.log('\n📋 Test 4: OATH PIN Activation Post-Payment...');
    const postPayActivateRes = await fetch(`${BASE_URL}/api/card/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'WME-KR26-0813-VIP', pin: '813-026' })
    });
    const postPayActivateJson = await postPayActivateRes.json();
    assert(postPayActivateRes.ok && postPayActivateJson.success === true, 'PIN 813-026 now successfully activates credential after verified payment');
    assert(postPayActivateJson.activation.activated === true, 'Activation status is true');
    assert(postPayActivateJson.activation.payment.status === 'VERIFIED', 'Activation record contains verified payment');

    // -------------------------------------------------------------
    // Test 5: Browser UI Verification: 2-Step PIN-First Activation Portal (/verify)
    // -------------------------------------------------------------
    console.log('\n📋 Test 5: Browser E2E - Card Activation Portal (PIN First, Gift Card Before Activation)...');
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Reset card state and clear payment for fresh UI walkthrough
    await fetch(`${BASE_URL}/api/card/deactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'WME-KR26-0813-VIP', clearPayment: true })
    });

    await page.goto(`${BASE_URL}/verify?ref=WME-KR26-0813-VIP&guest=Brenda+Wright`, {
      waitUntil: 'networkidle0'
    });

    // Check page text for Step 1 PIN Input and Step 2 Gift Card Deposit
    const pageText = await page.evaluate(() => document.body.innerText);
    assert(pageText.toUpperCase().includes('STEP 1: INPUT VIP ACTIVATION PIN'), 'Portal renders Step 1: Input VIP Activation PIN first');
    assert(pageText.toUpperCase().includes('STEP 2: GIFT CARD DEPOSIT'), 'Portal renders Step 2: Gift Card Deposit');
    assert(pageText.includes('$500') || pageText.includes('500 USD'), 'Portal renders configured $500 fee amount');

    // 1. Enter PIN FIRST via Auto-Fill button
    await page.waitForSelector('#quick-fill-pin-btn', { visible: true });
    await page.click('#quick-fill-pin-btn');
    const pinVal = await page.$eval('#oathPinInput', el => el.value);
    assert(pinVal === '813-026', 'Step 1: PIN input received 813-026 first');

    // Verify PIN Verified badge appears
    await page.waitForFunction(
      () => document.body.innerText.toUpperCase().includes('PIN 813-026 VERIFIED'),
      { timeout: 4000 }
    );
    const pinVerifiedText = await page.evaluate(() => document.body.innerText);
    assert(pinVerifiedText.toUpperCase().includes('PIN 813-026 VERIFIED'), 'Step 1 renders PIN 813-026 Verified badge');

    // 2. Fill Gift Card Claim Code
    await page.waitForSelector('#quick-fill-card-btn', { visible: true });
    await page.click('#quick-fill-card-btn');
    const filledCode = await page.$eval('#giftCardCodeInput', el => el.value);
    assert(filledCode === 'X7KM-92NQ-48PL-2026', 'Step 2: Gift Card Claim Code filled');

    // Small delay for React state update
    await new Promise(r => setTimeout(r, 200));

    // Submit PIN & Card activation
    await page.click('#submit-activate-btn');

    // Wait for success banner to render
    await page.waitForFunction(
      () => document.body.innerText.toUpperCase().includes('CREDENTIAL SUCCESSFULLY ACTIVATED'),
      { timeout: 8000 }
    );

    const activatedText = await page.evaluate(() => document.body.innerText);
    assert(activatedText.toUpperCase().includes('CREDENTIAL SUCCESSFULLY ACTIVATED'), 'Card Activation Portal renders success banner');
    assert(activatedText.includes('OATH-KR26-813-CLEAR'), 'Clearance code rendered on page');
    assert(activatedText.toUpperCase().includes('DEPOSIT PAID: APPLE GIFT CARD ($500 USD)'), 'Success banner displays Gift Card deposit receipt');

    // -------------------------------------------------------------
    // Test 6: Standalone Interactive Card (/meet-and-greet-card/index.html)
    // -------------------------------------------------------------
    console.log('\n📋 Test 6: Standalone Interactive Card PIN First & Gift Card Activation Modal...');
    await page.goto(`${BASE_URL}/meet-and-greet-card/index.html`, {
      waitUntil: 'networkidle0'
    });

    // Open OATH modal
    await page.evaluate(() => document.getElementById('activateCardBtn').click());
    await page.waitForSelector('#authModal.is-active', { timeout: 3000 });
    const modalVisible = await page.$eval('#authModal', el => el.classList.contains('is-active'));
    assert(modalVisible, 'Clicking OATH Activate opens the modal in standalone card');

    // Reset if previously active to test full cycle
    const isAlreadyActive = await page.$eval('#authSuccessSection', el => el.style.display !== 'none');
    if (isAlreadyActive) {
      await page.evaluate(() => document.getElementById('resetActivationBtn').click());
      await page.waitForFunction(
        () => document.querySelector('#authInputSection').style.display !== 'none',
        { timeout: 3000 }
      );
    }

    // 1. Input PIN FIRST
    await page.waitForSelector('#quickFillPinBtn', { visible: true });
    await page.evaluate(() => document.getElementById('quickFillPinBtn').click());
    const standalonePin = await page.$eval('#cardPinInput', el => el.value);
    assert(standalonePin === '813-026', 'Standalone modal auto-fills PIN 813-026 first');

    // 2. Input Gift Card
    await page.waitForSelector('#quickFillCardBtn', { visible: true });
    await page.evaluate(() => document.getElementById('quickFillCardBtn').click());

    // Click Authenticate PIN & Activate Card
    await page.evaluate(() => document.getElementById('submitPinAuthBtn').click());
    await page.waitForFunction(
      () => document.querySelector('#authSuccessSection').style.display !== 'none',
      { timeout: 5000 }
    );
    const successVisible = await page.$eval('#authSuccessSection', el => el.style.display !== 'none');
    assert(successVisible, 'Standalone card successfully activated with PIN first and Gift Card deposit');

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
