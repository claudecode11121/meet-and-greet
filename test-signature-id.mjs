import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function testSignatureAndIdIntake() {
  console.log('🚀 Starting Comprehensive Signature & Government ID Intake E2E Test Suite...\n');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failCount++;
    }
  }

  try {
    // 1. Visit Public Intake Form
    console.log('📋 Test 1: Public Intake Form with Section 03 (ID) & Section 04 (Signature)...');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:4000/', { waitUntil: 'networkidle0' });

    const title = await page.$eval('h1', el => el.innerText);
    assert(title.includes('Keanu Reeves'), `Intake form loaded: "${title}"`);

    // Check Guideline 04 in sidebar
    const sidebarText = await page.$eval('aside', el => el.innerText);
    assert(sidebarText.toLowerCase().includes('04 / identity & digital execution'), 'Sidebar includes "04 / Identity & Digital Execution" protocol');

    // Fill Section 01
    await page.type('#fullName', 'Diana Prince');
    await page.type('#email', 'diana.prince@themyscira.gov');
    await page.type('#phone', '2025550188');
    await page.type('#city', 'Washington D.C.');

    // Fill Section 02
    await page.select('#meetingType', 'In-person');
    await page.select('#attendees', '2 attendees');
    await page.type('#reason', 'Lifelong admirer of Keanu Reeves for his cinema mastery in The Matrix and John Wick, as well as his quiet, generous philanthropic foundations.');

    // Check Section 03 - Government ID Section
    console.log('\n📋 Test 2: Government-Issued Identification Section...');
    await page.select('#idType', "Driver's License");
    await page.type('#idNumber', 'DL-88294017');
    await page.select('#idCountry', 'United States');

    // Click "Use Verified Sample ID Card"
    await page.waitForSelector('#btn-sample-id', { timeout: 3000 });
    await page.click('#btn-sample-id');
    console.log('  ✓ PASS: Found and clicked "Use Verified Sample ID Card"');
    passCount++;
    await new Promise(r => setTimeout(r, 600));

    // Verify preview card appears
    await page.waitForSelector('#btn-inspect-id', { timeout: 4000 });
    console.log('  ✓ PASS: Government ID uploaded & preview card rendered');
    passCount++;

    // Test Inspect ID Modal
    await page.click('#btn-inspect-id');
    await page.waitForSelector('#btn-close-id-preview', { timeout: 4000 });
    console.log('  ✓ PASS: Clicked Inspect ID Document button');
    console.log('  ✓ PASS: Inspection modal opened displaying full government card');
    passCount += 2;

    // Close preview modal
    await page.click('#btn-close-id-preview');
    await new Promise(r => setTimeout(r, 400));

    // Check Section 04 - Signature Section
    console.log('\n📋 Test 3: Digital Signature Pad (Drawn and Typed modes)...');
    // Test Drawing on Canvas
    const canvas = await page.$('canvas');
    assert(!!canvas, 'Interactive HTML5 Canvas Signature Pad rendered');

    await page.evaluate(() => {
      const c = document.querySelector('canvas');
      if (c) {
        const rect = c.getBoundingClientRect();
        const startX = rect.left + 40;
        const startY = rect.top + 40;
        c.dispatchEvent(new MouseEvent('mousedown', { clientX: startX, clientY: startY, bubbles: true }));
        c.dispatchEvent(new MouseEvent('mousemove', { clientX: startX + 60, clientY: startY + 25, bubbles: true }));
        c.dispatchEvent(new MouseEvent('mousemove', { clientX: startX + 120, clientY: startY - 10, bubbles: true }));
        c.dispatchEvent(new MouseEvent('mouseup', { clientX: startX + 180, clientY: startY + 20, bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 500));

    const signatureAffixedDrawn = await page.evaluate(() => {
      return document.body.innerText.includes('Signature Affixed');
    });
    assert(signatureAffixedDrawn, 'Drawn signature successfully affixed on canvas');

    // Switch to Typed Signature mode
    await page.click('#tab-type-signature');
    await page.waitForSelector('#signeeNameInput', { timeout: 4000 });
    console.log('  ✓ PASS: Switched to Typed Signature mode');
    passCount++;

    const typedValue = await page.$eval('#signeeNameInput', el => el.value);
    assert(typedValue === 'Diana Prince', `Signee legal name pre-filled accurately: "${typedValue}"`);

    const cursiveRendered = await page.evaluate(() => {
      return document.body.innerText.includes('Diana Prince') &&
             document.body.innerText.includes('Authorized Legal Signee');
    });
    assert(cursiveRendered, 'Cursive digital signature styled representation rendered');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'public-form-id-signature.png') });

    // Check checkboxes
    console.log('\n📋 Test 4: Submitting Application with ID & Digital Signature...');
    await page.click('#confirmedAccurate');
    await page.click('#acknowledgedPrivacy');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for Confirmation View
    await page.waitForSelector('h2.font-serif', { timeout: 8000 });
    const confHeading = await page.$eval('h2.font-serif', el => el.innerText);
    assert(confHeading.includes('Request Received'), `Confirmation state displayed: "${confHeading}"`);

    // Verify Confirmation View shows ID & Signature
    const confirmationText = await page.evaluate(() => document.body.innerText);
    assert(confirmationText.includes("Driver's License"), 'Confirmation includes Government ID Type');
    assert(confirmationText.includes('Document Encrypted & Verified'), 'Confirmation includes ID Verified badge');
    assert(confirmationText.includes('Diana Prince'), 'Confirmation displays Signee Name');
    assert(confirmationText.includes('Legally Executed'), 'Confirmation displays Legally Executed signature status');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'confirmation-view-id-signature.png') });

    // Extract reference ID
    const refCode = await page.evaluate(() => {
      const match = document.body.innerText.match(/MG-[A-Z0-9]+/);
      return match ? match[0] : null;
    });
    assert(!!refCode, `Generated Reference ID: ${refCode}`);

    // 5. Test Admin Portal Viewing of this Application
    console.log('\n📋 Test 5: Admin Portal — Inspection of ID Document and Digital Signature...');
    await page.goto('http://localhost:4000/admin', { waitUntil: 'networkidle0' });

    // Check if already authenticated or needs login
    const needsLogin = await page.$('#admin-email');
    if (needsLogin) {
      await page.type('#admin-email', 'admin@wmeagency.com');
      await page.type('#admin-password', 'KeanuMeet2026!WME');
      await page.click('button[type="submit"]');
      await page.waitForSelector('h1', { timeout: 8000 });
    }

    // Navigate to Inquiries
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('aside nav button'));
      const reqBtn = btns.find(b => b.innerText.includes('Inquiries'));
      if (reqBtn) reqBtn.click();
    });
    await new Promise(r => setTimeout(r, 700));

    // Verify our new submission appears with ID badge and Signed badge
    const tableHtml = await page.evaluate(() => document.body.innerText);
    assert(tableHtml.includes('Diana Prince'), 'Newly submitted applicant Diana Prince rendered in table');
    assert(tableHtml.includes("Driver's License") || tableHtml.includes("DL-88294017"), 'Table displays Government ID badge');
    assert(tableHtml.includes('Signed'), 'Table displays Digital Signature Signed badge');

    // Click on Diana Prince to open Application Detail Modal
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const targetRow = rows.find(r => r.innerText.includes('Diana Prince'));
      if (targetRow) targetRow.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Wait for drawer
    await page.waitForSelector('h2.font-serif', { timeout: 5000 });
    const modalTitle = await page.$eval('h2.font-serif', el => el.innerText);
    assert(modalTitle.includes('Diana Prince'), `Application drawer opened for "${modalTitle}"`);

    // Verify Government ID Card section in admin modal
    const modalText = await page.evaluate(() => document.body.innerText);
    assert(modalText.toUpperCase().includes('GOVERNMENT IDENTIFICATION & VETTING'), 'Admin modal has "Government Identification & Vetting" card');
    assert(modalText.includes('DL-88294017'), 'Admin modal displays exact ID Number "DL-88294017"');
    assert(modalText.includes('ID Attached & Encrypted'), 'Admin modal displays "ID Attached & Encrypted" badge');

    // Verify Digital Signature section in admin modal
    assert(modalText.toUpperCase().includes('LEGAL EXECUTION & DIGITAL SIGNATURE'), 'Admin modal has "Legal Execution & Digital Signature" card');
    assert(modalText.includes('Legally Executed'), 'Admin modal displays "Legally Executed" status');
    assert(modalText.includes('Affirmed under penalty of false representation'), 'Admin modal displays legal declaration affirmation');

    // Test Inspect ID Document in Admin Modal
    await page.waitForSelector('#btn-admin-inspect-id', { timeout: 4000 });
    await page.click('#btn-admin-inspect-id');
    console.log('  ✓ PASS: Clicked "Inspect ID Document" in admin drawer');
    passCount++;
    await new Promise(r => setTimeout(r, 400));

    const adminLightboxOpen = await page.evaluate(() => {
      return document.body.innerText.toUpperCase().includes('FULL GOVERNMENT ID INSPECTION');
    });
    assert(adminLightboxOpen, 'Admin Lightbox opened displaying full-res government ID card for verification');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin-id-inspect-modal.png') });

    // Close admin lightbox
    await page.waitForSelector('#btn-admin-done-inspecting', { timeout: 3000 });
    await page.click('#btn-admin-done-inspecting');
    await new Promise(r => setTimeout(r, 300));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin-detail-id-signature.png') });

    // 6. Test CSV Export contains ID and Signature headers
    console.log('\n📋 Test 6: Sanitized CSV Export contains ID & Signature columns...');
    const token = await page.evaluate(() => localStorage.getItem('wme_admin_token'));
    const csvResponse = await page.evaluate(async (tok) => {
      const res = await fetch('/api/admin/export/csv', {
        headers: { 'Authorization': `Bearer ${tok}` }
      });
      return await res.text();
    }, token);

    assert(csvResponse.includes('Government ID Type'), 'CSV contains header "Government ID Type"');
    assert(csvResponse.includes('ID Document Number'), 'CSV contains header "ID Document Number"');
    assert(csvResponse.includes('Digital Signature Type'), 'CSV contains header "Digital Signature Type"');
    assert(csvResponse.includes('Diana Prince'), 'CSV contains submitted applicant data');
    assert(csvResponse.includes('DL-88294017'), 'CSV contains submitted ID number');

    console.log('\n======================================================');
    console.log(`🏁 Test Summary: ${passCount} Passed, ${failCount} Failed.`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('Test execution error:', err);
    failCount++;
  } finally {
    await browser.close();
    if (failCount > 0) {
      process.exit(1);
    }
  }
}

testSignatureAndIdIntake();
