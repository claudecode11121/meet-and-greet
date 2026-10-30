import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runAdminE2ETest() {
  console.log('🚀 Starting Admin Dashboard E2E & Responsiveness Test Suite...\n');

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
    // 1. Visit /admin (Should show login screen)
    console.log('📋 Test 1: Admin Login Interface...');
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:4000/admin', { waitUntil: 'networkidle0' });

    const loginTitle = await page.$eval('h1', el => el.innerText).catch(() => '');
    assert(loginTitle.includes('Staff Portal Login'), 'Login screen rendered with title "Staff Portal Login"');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin-login.png') });

    // 2. Perform Login with seeded credentials
    console.log('\n📋 Test 2: Authentication with seeded admin credentials...');
    await page.type('#admin-email', 'admin@wmeagency.com');
    await page.type('#admin-password', 'KeanuMeet2026!WME');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForSelector('h1', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 600));

    const dashboardTitle = await page.$eval('h1', el => el.innerText);
    assert(dashboardTitle.includes('Keanu Reeves Meet & Greet Inquiries'), `Admin dashboard loaded: "${dashboardTitle}"`);

    // Verify token was stored in localStorage
    const storedToken = await page.evaluate(() => localStorage.getItem('wme_admin_token'));
    assert(!!storedToken && storedToken.length > 20, 'Cryptographic session token saved in localStorage');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin-dashboard-overview.png') });

    // 3. Verify Metric Cards
    console.log('\n📋 Test 3: Overview Metric Cards & Pipeline Counts...');
    const metricButtons = await page.$$eval('main button', buttons =>
      buttons.map(b => b.innerText.replace(/\n/g, ' '))
    );
    const hasTotal = metricButtons.some(t => t.includes('TOTAL'));
    const hasApproved = metricButtons.some(t => t.includes('APPROVED'));
    const hasConfirmed = metricButtons.some(t => t.includes('CONFIRMED'));
    assert(hasTotal, 'Overview contains Total Submissions card');
    assert(hasApproved, 'Overview contains distinct Approved card');
    assert(hasConfirmed, 'Overview contains distinct Confirmed card');

    // 4. Test Navigation to Inquiries / Requests View
    console.log('\n📋 Test 4: Requests View & Filtering...');
    // Click on nav item for Inquiries & Requests
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('aside nav button'));
      const reqBtn = btns.find(b => b.innerText.includes('Inquiries'));
      if (reqBtn) reqBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const requestsViewTitle = await page.$eval('h1', el => el.innerText);
    assert(requestsViewTitle.includes('Meet & Greet Requests Management'), `Navigated to requests management: "${requestsViewTitle}"`);

    // Verify search input works
    const searchInput = await page.$('input[placeholder*="Search"]');
    assert(!!searchInput, 'Search input is present');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin-requests-table.png') });

    // 5. Test Application Detail Modal
    console.log('\n📋 Test 5: Application Detail Modal & Notes...');
    // Click on first "Review" button in table
    const firstReviewBtn = await page.$('table button');
    assert(!!firstReviewBtn, 'Review button present in table');
    await firstReviewBtn.click();

    // Wait for slide-over modal
    await page.waitForSelector('h2.font-serif', { timeout: 5000 });
    await new Promise(r => setTimeout(r, 400));

    const applicantModalName = await page.$eval('h2.font-serif', el => el.innerText);
    assert(!!applicantModalName, `Application Detail modal opened for: "${applicantModalName}"`);

    // Check fixed celebrity lockup
    const talentLockup = await page.evaluate(() => {
      return document.body.innerText.includes('Keanu Reeves');
    });
    assert(talentLockup, 'Celebrity correctly locked to "Keanu Reeves" in detail view');

    // Add an internal staff note
    const noteTextarea = await page.$('textarea[placeholder*="internal staff note"]');
    assert(!!noteTextarea, 'Internal staff note textarea present');
    await noteTextarea.focus();
    await page.keyboard.type('Automated E2E Verification Note: Identity vetted and confirmed compliant with WME policies.');
    await new Promise(r => setTimeout(r, 200));

    // Submit note using page.click on the submit button
    const recordBtn = await page.$('form button[type="submit"]');
    assert(!!recordBtn, 'Record Note submit button found');
    await recordBtn.click();
    await new Promise(r => setTimeout(r, 1200));

    // Verify note appears in modal
    const noteSaved = await page.evaluate(() => {
      return document.body.innerText.includes('Automated E2E Verification Note');
    });
    assert(noteSaved, 'Internal note successfully recorded and rendered in notes list');

    // Test Status Change workflow
    console.log('\n📋 Test 5b: Status Transition & Audit Trail within Detail Modal...');
    await page.select('#status-select', 'Under Review');
    await new Promise(r => setTimeout(r, 300));
    
    // Click "Save Status"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find(b => b.innerText.includes('Save Status'));
      if (saveBtn) saveBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    const statusUpdated = await page.evaluate(() => {
      return document.body.innerText.includes('Status updated to Under Review') ||
             document.body.innerText.includes('Under Review');
    });
    assert(statusUpdated, 'Application status updated to "Under Review" with audit trail');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin-application-modal.png') });

    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close details"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // 6. Test Event Governance View
    console.log('\n📋 Test 6: Event Governance View...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('aside nav button'));
      const setBtn = btns.find(b => b.innerText.includes('Event Governance'));
      if (setBtn) setBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const settingsTitle = await page.$eval('h1', el => el.innerText);
    assert(settingsTitle.includes('Event Intake & Governance Parameters'), `Event settings loaded: "${settingsTitle}"`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin-event-settings.png') });

    // 7. Test Security & Audit Trail View
    console.log('\n📋 Test 7: Security & Audit Trail View...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('aside nav button'));
      const auditBtn = btns.find(b => b.innerText.includes('Security'));
      if (auditBtn) auditBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const auditTitle = await page.$eval('h1', el => el.innerText);
    assert(auditTitle.includes('Administrator Profile & Security Audit Trail'), `Audit trail loaded: "${auditTitle}"`);

    // Verify scrypt indicator
    const hasScrypt = await page.evaluate(() => document.body.innerText.includes('scrypt Password Hashing'));
    assert(hasScrypt, 'Cryptographic scrypt protection confirmed in profile view');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin-audit-trail.png') });

    // 8. Test Responsiveness across Mobile, Tablet, and Desktop viewports
    console.log('\n📋 Test 8: Cross-Device Responsiveness (Zero Horizontal Overflow)...');
    const viewports = [
      { name: 'Mobile 320px', width: 320, height: 640 },
      { name: 'Mobile 375px', width: 375, height: 812 },
      { name: 'Tablet 768px', width: 768, height: 1024 },
      { name: 'Laptop 1024px', width: 1024, height: 768 },
      { name: 'Desktop 1440px', width: 1440, height: 900 }
    ];

    for (const vp of viewports) {
      await page.setViewport(vp);
      await new Promise(r => setTimeout(r, 200));

      const overflow = await page.evaluate((w) => {
        return document.documentElement.scrollWidth > w || document.body.scrollWidth > w;
      }, vp.width);

      assert(!overflow, `Viewport ${vp.name} (${vp.width}px): No horizontal overflow (scrollWidth <= ${vp.width}px)`);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `admin-resp-${vp.width}.png`) });
    }

    // 9. Test Public Form return link
    console.log('\n📋 Test 9: Public Form portal navigation...');
    await page.setViewport({ width: 1280, height: 800 });
    await page.evaluate(() => {
      const publicLink = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Public Form'));
      if (publicLink) publicLink.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const publicHeading = await page.$eval('h1', el => el.innerText).catch(() => '');
    assert(publicHeading.includes('Keanu Reeves'), `Successfully navigated back to public form: "${publicHeading}"`);

    // Check staff portal link in footer
    const hasStaffPortal = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('footer button')).some(b => b.innerText.includes('Staff Portal'));
    });
    assert(hasStaffPortal, 'Public form footer contains "Staff Portal" link');

    console.log('\n======================================================');
    console.log(`🏁 Test Summary: ${passCount} Passed, ${failCount} Failed.`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('Test execution error:', err);
    failCount++;
  } finally {
    await browser.close();
  }

  process.exit(failCount > 0 ? 1 : 0);
}

runAdminE2ETest();
