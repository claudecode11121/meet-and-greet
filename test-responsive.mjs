import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: '320px-small-mobile', width: 320, height: 640, isMobile: true },
  { name: '360px-compact-android', width: 360, height: 740, isMobile: true },
  { name: '375px-standard-mobile', width: 375, height: 812, isMobile: true },
  { name: '390px-modern-smartphone', width: 390, height: 844, isMobile: true },
  { name: '430px-large-smartphone', width: 430, height: 932, isMobile: true },
  { name: '480px-intermediate-mobile', width: 480, height: 800, isMobile: true },
  { name: '768px-tablet', width: 768, height: 1024, isMobile: false },
  { name: '900px-intermediate-tablet', width: 900, height: 800, isMobile: false },
  { name: '1024px-landscape-tablet', width: 1024, height: 768, isMobile: false },
  { name: '1280px-desktop', width: 1280, height: 800, isMobile: false },
  { name: '1440px-large-desktop', width: 1440, height: 900, isMobile: false },
];

const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runResponsiveTestSuite() {
  console.log('🔍 Executing Cross-Device UI & Responsiveness Test Suite...\n');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:4000', { waitUntil: 'networkidle0' });

  const testReport = [];
  let overallPass = true;

  for (const vp of VIEWPORTS) {
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.isMobile ? 2 : 1,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });
    await new Promise((r) => setTimeout(r, 200));

    // Deep layout inspection
    const metrics = await page.evaluate(() => {
      const windowWidth = window.innerWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      const hasHorizontalOverflow = scrollWidth > windowWidth || bodyScrollWidth > windowWidth;

      // Find any overflowing elements
      const overflowingNodes = [];
      document.querySelectorAll('*').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.right > windowWidth + 1.5 || rect.left < -1.5) {
          overflowingNodes.push({
            tag: el.tagName.toLowerCase(),
            class: (el.className || '').toString().slice(0, 45),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            windowWidth,
          });
        }
      });

      // Measure touch targets
      const touchTargets = [];
      document.querySelectorAll('input, select, textarea, button').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          touchTargets.push({
            tag: el.tagName.toLowerCase(),
            name: el.getAttribute('name') || el.getAttribute('type') || el.innerText?.slice(0, 15),
            height: Math.round(rect.height),
            width: Math.round(rect.width),
            meetsMinHeight: rect.height >= 40, // 40-48px target
          });
        }
      });

      // Check submit button
      const submitBtn = document.querySelector('button[type="submit"]');
      const submitBtnRect = submitBtn ? submitBtn.getBoundingClientRect() : null;

      // Check header
      const header = document.querySelector('header');
      const headerRect = header ? header.getBoundingClientRect() : null;

      // Check fluid title
      const title = document.querySelector('.fluid-title');
      const titleFontSize = title ? window.getComputedStyle(title).fontSize : '';

      return {
        windowWidth,
        scrollWidth,
        hasHorizontalOverflow,
        overflowCount: overflowingNodes.length,
        overflowingNodes: overflowingNodes.slice(0, 3),
        submitButton: submitBtnRect
          ? {
              width: Math.round(submitBtnRect.width),
              height: Math.round(submitBtnRect.height),
              fitsWindow: submitBtnRect.right <= windowWidth + 1,
            }
          : null,
        headerFits: headerRect ? headerRect.width <= windowWidth + 1 : true,
        titleFontSize,
        suboptimalTouchTargets: touchTargets.filter((t) => !t.meetsMinHeight),
      };
    });

    const isPass = !metrics.hasHorizontalOverflow && metrics.overflowCount === 0 && metrics.headerFits;
    if (!isPass) overallPass = false;

    // Take screenshot
    const shotPath = path.join(SCREENSHOT_DIR, `${vp.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });

    testReport.push({
      vp: vp.name,
      width: vp.width,
      isPass,
      scrollWidth: metrics.scrollWidth,
      submitBtn: metrics.submitButton,
      titleSize: metrics.titleFontSize,
      overflows: metrics.overflowingNodes,
      suboptimalTargets: metrics.suboptimalTouchTargets.length,
    });
  }

  // Also test Confirmation View on mobile (375px) and desktop (1280px)
  console.log('Testing Confirmation View across viewports...');
  await page.setViewport({ width: 375, height: 812 });

  // Fill in form and submit
  await page.type('#fullName', 'Marcus Aurelius');
  await page.type('#email', 'marcus@roman-arts.org');
  await page.type('#phone', '2125550192');
  await page.select('#country', 'United States');
  await page.type('#city', 'New York');
  await page.select('#meetingType', 'In-person');
  await page.select('#attendees', '1 attendee');
  await page.click('#confirmedAccurate');
  await page.click('#acknowledgedPrivacy');

  await page.click('button[type="submit"]');
  await page.waitForSelector('h2', { timeout: 5000 });
  await new Promise((r) => setTimeout(r, 600));

  // Check confirmation view on 375px
  const conf375 = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      windowWidth: window.innerWidth,
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'confirmation-375px-mobile.png') });

  // Check confirmation view on 1280px
  await page.setViewport({ width: 1280, height: 800 });
  await new Promise((r) => setTimeout(r, 300));
  const conf1280 = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      windowWidth: window.innerWidth,
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'confirmation-1280px-desktop.png') });

  await browser.close();

  console.log('\n================== TEST REPORT ==================');
  for (const r of testReport) {
    const status = r.isPass ? '✅ PASS' : '❌ FAIL';
    console.log(
      `${status} [${r.width}px - ${r.vp}]: ScrollWidth: ${r.scrollWidth}px | Title: ${r.titleSize} | SubmitBtn: ${r.submitBtn?.width}x${r.submitBtn?.height}px`
    );
    if (r.overflows.length > 0) {
      console.log('   ⚠️ Overflows:', JSON.stringify(r.overflows));
    }
  }

  console.log('\n--- Confirmation Screen Cross-Device Results ---');
  console.log(
    `Confirmation 375px: ${!conf375.hasOverflow ? '✅ PASS' : '❌ FAIL'} (ScrollWidth: ${conf375.scrollWidth}px)`
  );
  console.log(
    `Confirmation 1280px: ${!conf1280.hasOverflow ? '✅ PASS' : '❌ FAIL'} (ScrollWidth: ${conf1280.scrollWidth}px)`
  );
  console.log('=================================================\n');

  return overallPass && !conf375.hasOverflow && !conf1280.hasOverflow;
}

runResponsiveTestSuite()
  .then((allPassed) => {
    if (allPassed) {
      console.log('🎉 100% of Viewports & Cross-Device Flows Passed Flawlessly!');
      process.exit(0);
    } else {
      console.error('❌ Some viewport tests failed.');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  });
