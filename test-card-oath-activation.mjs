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
    console.log(`[Server] ${d.toString().trim()}`);
  });

  server.stderr.on('data', (d) => {
    console.error(`[Server Error] ${d.toString().trim()}`);
  });

  // Wait for server to be responsive
  let serverReady = false;
  for (let i = 0; i < 60; i++) {
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
    // Test 5: Browser UI Verification: Multi-Card Escrow & PIN-First Luxury Portal (/verify)
    // -------------------------------------------------------------
    console.log('\n📋 Test 5: Browser E2E - Authentic Luxury Portal & Multi-Card Escrow Deposit (/verify)...');
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    page.on('console', msg => console.log('  [Browser Console]', msg.text()));
    page.on('pageerror', err => console.error('  [Browser PageError]', err.message));

    // Reset card state and clear payment for fresh UI walkthrough
    await fetch(`${BASE_URL}/api/card/deactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'WME-KR26-0813-VIP', clearPayment: true })
    });

    await page.goto(`${BASE_URL}/verify?ref=WME-KR26-0813-VIP&guest=Brenda+Wright`, {
      waitUntil: 'networkidle0'
    });

    // Clear browser localStorage for pristine test state
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle0' });

    // Check that Admin Portal link is NOT showing on the passholder header
    const headerHtml = await page.$eval('header', el => el.innerHTML);
    assert(!headerHtml.includes('Admin Portal'), 'Header does NOT show Admin Portal button to passholder');

    // Check page text for authentic executive typography
    const pageText = await page.evaluate(() => document.body.innerText);
    assert(pageText.toUpperCase().includes('STEP 1: INPUT VIP ACTIVATION PIN'), 'Portal renders Step 1: Input VIP Activation PIN');
    assert(!pageText.includes('Auto-Fill'), 'Authentic UI does NOT display amateur "Auto-Fill" buttons');
    assert(!pageText.includes('Attach Sample Photo'), 'Authentic UI does NOT display amateur "Attach Sample Photo" button');
    assert(!pageText.includes('(configured from Admin)'), 'Authentic UI does NOT display "(configured from Admin)" leak');

    // 1. Enter PIN FIRST via realistic typing
    await page.waitForSelector('#oathPinInput', { visible: true });
    await page.click('#oathPinInput');
    await page.type('#oathPinInput', '813-026');
    const pinVal = await page.$eval('#oathPinInput', el => el.value);
    assert(pinVal === '813-026', 'Step 1: PIN input received 813-026');

    // Click authenticate PIN gate button to unlock main portal
    await page.click('#submit-pin-gate-btn');

    // Verify PIN Verified badge appears and Step 2 unlocks
    await page.waitForFunction(
      () => document.body.innerText.toUpperCase().includes('PIN 813-026 VERIFIED') && document.body.innerText.toUpperCase().includes('STEP 2: GIFT CARD DEPOSIT'),
      { timeout: 5000 }
    );
    const pinVerifiedText = await page.evaluate(() => document.body.innerText);
    assert(pinVerifiedText.toUpperCase().includes('PIN 813-026 VERIFIED'), 'Step 1 renders PIN 813-026 Verified badge');
    assert(pinVerifiedText.toUpperCase().includes('STEP 2: GIFT CARD DEPOSIT'), 'Portal renders Step 2: Gift Card Deposit');
    assert(pinVerifiedText.includes('$500') || pinVerifiedText.includes('500 USD'), 'Portal renders configured $500 escrow target');

    // 2. Multi-Card Escrow: Add Card 1 ($250 USD)
    console.log('  Testing multi-card escrow: entering first voucher of $250...');
    await page.waitForSelector('#giftCardCodeInput', { visible: true });
    await page.click('#giftCardCodeInput');
    await page.type('#giftCardCodeInput', 'APPL-250A-X94B-2026');

    // Ensure voucher amount is set to 250
    await page.waitForSelector('#cardAmountInput', { visible: true });
    await page.$eval('#cardAmountInput', el => {
      el.value = '250';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Attach high-res badge image as voucher proof
    const testImagePath = path.join(__dirname, 'meet-and-greet-card/assets/brenda_badge_photo.png');
    const fileInput = await page.$('#giftCardFileInput');
    if (fileInput) {
      await fileInput.uploadFile(testImagePath);
      await page.waitForSelector('img[alt="Gift Card Attached"]', { visible: true, timeout: 3000 });
      assert(true, 'First voucher scan attached and preview thumbnail displayed');
    }

    const btnDisabled = await page.$eval('#submit-giftcard-btn', el => el.disabled);
    const codeVal = await page.$eval('#giftCardCodeInput', el => el.value);
    console.log(`  [Debug] Submit button disabled: ${btnDisabled}, code: "${codeVal}"`);

    // Submit Card 1 to Escrow
    await page.evaluate(() => {
      const btn = document.getElementById('submit-giftcard-btn');
      btn.scrollIntoView();
      btn.click();
    });

    await page.waitForFunction(
      () => document.body.innerText.includes('$250.00') && document.body.innerText.includes('50%'),
      { timeout: 15000 }
    );

    const postCard1Text = await page.evaluate(() => document.body.innerText);
    assert(postCard1Text.toUpperCase().includes('TOTAL CREDITED') && postCard1Text.includes('$250.00'), 'Card 1 credited: Ledger displays $250.00 credited');
    assert(postCard1Text.toUpperCase().includes('BALANCE DUE') && postCard1Text.includes('$250.00'), 'Ledger displays $250.00 balance remaining');
    assert(postCard1Text.toUpperCase().includes('ACCREDITED VOUCHERS ON FILE (1)'), 'Itemized ledger displays 1 verified voucher');

    // 3. Multi-Card Escrow: Add Card 2 ($250 USD) to complete the $500 total
    console.log('  Testing multi-card escrow: entering second voucher of $250 to satisfy full $500 escrow...');
    await page.waitForSelector('#giftCardCodeInput', { visible: true });
    await page.click('#giftCardCodeInput');
    await page.type('#giftCardCodeInput', 'AMZN-250B-Q82P-2026');

    await page.$eval('#cardAmountInput', el => {
      el.value = '250';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.evaluate(() => {
      const btn = document.getElementById('submit-giftcard-btn');
      btn.scrollIntoView();
      btn.click();
    });

    await page.waitForFunction(
      () => document.body.innerText.includes('100% Escrow Satisfied'),
      { timeout: 15000 }
    );
    const postCard2Text = await page.evaluate(() => document.body.innerText);
    assert(postCard2Text.includes('100% Escrow Satisfied'), 'Ledger displays 100% Escrow Satisfied ($500.00 USD)');
    assert(postCard2Text.toUpperCase().includes('ACCREDITED VOUCHERS ON FILE (2)'), 'Itemized ledger lists both vouchers');

    // 4. Passholder sees Escrow Complete & Awaiting Admin Clearance (No self-activation)
    await page.waitForSelector('#escrow-pending-admin-box', { timeout: 8000 });
    const boxText = await page.$eval('#escrow-pending-admin-box', el => el.innerText);
    console.log('  [Debug boxText]:', boxText.replace(/\n/g, ' '));
    assert(boxText.includes('Escrow') && boxText.includes('Admin'), 'Passholder sees Escrow Complete • Awaiting WME Admin Verification');
    const wholePageText = await page.evaluate(() => document.body.innerText);
    assert(!wholePageText.includes('Authenticate PIN & Activate VIP Card'), 'Passholder portal does NOT allow self-activation');

    // 5. Admin verifies escrow deposit and activates credential via PIN 813-026
    const adminActivateRes = await fetch(`${BASE_URL}/api/card/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'WME-KR26-0813-VIP', pin: '813-026', adminOverride: true })
    });
    const adminActivateJson = await adminActivateRes.json();
    assert(adminActivateRes.ok && adminActivateJson.success === true, 'Admin alone clears and activates VIP pass via PIN');

    // 6. Real-time sync: Portal auto-updates with cleared accreditation
    try {
      await page.waitForFunction(
        () => document.body.innerText.toUpperCase().includes('VIP CREDENTIAL SUCCESSFULLY SYNCHRONIZED'),
        { timeout: 15000 }
      );
    } catch (err) {
      const currentBody = await page.evaluate(() => document.body.innerText);
      console.error('  [Debug] Current page text on timeout:\n', currentBody);
      throw err;
    }

    const activatedText = await page.evaluate(() => document.body.innerText);
    assert(activatedText.toUpperCase().includes('VIP CREDENTIAL SUCCESSFULLY SYNCHRONIZED'), 'Card Activation Portal renders success banner');
    assert(activatedText.includes('OATH-KR26-813-CLEAR'), 'Clearance code rendered on page');
    assert(activatedText.toUpperCase().includes('ESCROW CLEARED: $500.00 USD') || activatedText.toUpperCase().includes('500.00 USD'), 'Success banner displays $500.00 cleared escrow');
    assert(activatedText.includes('APPL') && activatedText.includes('AMZN'), 'Success banner displays itemized list of all contributing vouchers');
    assert(!activatedText.includes('Deactivate / Reset Test'), 'Passholder portal does NOT show any dev "Deactivate / Reset Test" button');

    // -------------------------------------------------------------
    // Test 6: Standalone Interactive Card (/meet-and-greet-card/index.html)
    // -------------------------------------------------------------
    console.log('\n📋 Test 6: Standalone Interactive Card Multi-Card Escrow & PIN Activation Modal...');
    await page.goto(`${BASE_URL}/meet-and-greet-card/index.html`, {
      waitUntil: 'networkidle0'
    });

    // Reset localStorage before test walkthrough
    await page.evaluate(() => {
      localStorage.removeItem('wme_kr26_card_activated');
      localStorage.removeItem('wme_kr26_giftcard_paid');
      localStorage.removeItem('wme_kr26_vouchers');
    });
    await page.reload({ waitUntil: 'networkidle0' });

    // Open OATH modal
    await page.evaluate(() => document.getElementById('activateCardBtn').click());
    await page.waitForSelector('#authModal.is-active', { timeout: 3000 });
    const modalVisible = await page.$eval('#authModal', el => el.classList.contains('is-active'));
    assert(modalVisible, 'Clicking OATH Activate opens the modal in standalone card');

    // 1. Input PIN FIRST
    await page.type('#cardPinInput', '813-026');
    const standalonePin = await page.$eval('#cardPinInput', el => el.value);
    assert(standalonePin === '813-026', 'Standalone modal accepts PIN 813-026');

    // 2. Input Multi-Card Vouchers
    await page.type('#giftCardCodeInput', 'APPL-250A-X94B-2026');
    await page.evaluate(() => document.getElementById('redeemGiftCardBtn').click());
    await new Promise(r => setTimeout(r, 200));

    await page.type('#giftCardCodeInput', 'AMZN-250B-Q82P-2026');
    await page.evaluate(() => document.getElementById('redeemGiftCardBtn').click());
    await new Promise(r => setTimeout(r, 200));

    // Verify standalone ledger displays full escrow
    const creditedAmt = await page.$eval('#standaloneCreditedAmt', el => el.textContent);
    assert(creditedAmt === '$500.00', 'Standalone card ledger shows $500.00 credited across multiple vouchers');

    // Click Authenticate PIN & Activate Card
    await page.evaluate(() => document.getElementById('submitPinAuthBtn').click());
    await page.waitForFunction(
      () => document.querySelector('#authSuccessSection').style.display !== 'none',
      { timeout: 5000 }
    );
    const successVisible = await page.$eval('#authSuccessSection', el => el.style.display !== 'none');
    assert(successVisible, 'Standalone card successfully activated with PIN first and multi-card escrow');

    // Cleanup: Reset card and clear test payment so database starts clean
    await fetch(`${BASE_URL}/api/card/deactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'WME-KR26-0813-VIP', clearPayment: true })
    });

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
