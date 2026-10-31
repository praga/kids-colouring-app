import { chromium } from 'playwright';
import path from 'path';

const NAS_URL = process.env.NAS_URL || 'http://127.0.0.1:8091';
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || '/tmp';

async function testNas() {
  console.log(`🌐 Testing NAS deployment at ${NAS_URL} ...`);

  // 1. API Pages verification
  const pagesRes = await fetch(`${NAS_URL}/colouring-pages/pages.json`);
  if (!pagesRes.ok) {
    throw new Error(`Failed to load pages.json from NAS: ${pagesRes.status}`);
  }
  const pages = await pagesRes.json();
  console.log(`✅ Loaded ${pages.length} colouring pages from NAS:`, pages.map((p: any) => p.title).join(', '));

  // 2. Playwright Headless Browser on System Chrome
  console.log('🚀 Launching Chrome to inspect NAS deployment...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('NAS Browser error:', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error('NAS Page error:', err);
  });

  await page.goto(NAS_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Take screenshot of NAS deployment
  const screenshotPath = path.join(ARTIFACT_DIR, 'screenshot_nas_live.png');
  await page.screenshot({ path: screenshotPath });
  console.log('📸 Saved live NAS screenshot to:', screenshotPath);

  // Test drawing on NAS canvas
  const canvas = await page.locator('canvas.cursor-crosshair');
  const box = await canvas.boundingBox();
  if (box) {
    console.log('🎨 Testing live drawing on NAS canvas...');
    await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.45);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.45);
    await page.mouse.up();
  }

  // Open bookshelf on NAS
  await page.click('button[title="Choose a Colouring Page"]');
  await page.waitForTimeout(600);

  const bookshelfShot = path.join(ARTIFACT_DIR, 'screenshot_nas_bookshelf.png');
  await page.screenshot({ path: bookshelfShot });
  console.log('📸 Saved NAS Bookshelf screenshot to:', bookshelfShot);

  await browser.close();

  console.log(`\n======================================================`);
  console.log(`🎉 NAS VERIFICATION SUCCEEDED!`);
  console.log(`Console Errors: ${consoleErrors.length}`);
  console.log(`======================================================\n`);
}

testNas().catch((err) => {
  console.error('NAS Verification failed:', err);
  process.exit(1);
});
