import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || '/tmp';

async function runBrowserTest() {
  console.log('🚀 Launching Chromium browser test...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true
  });

  // Emulate Lenovo Xiaoxin GT tablet viewport (16:10 aspect ratio landscape)
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
      console.error('Browser console error:', msg.text());
    } else {
      console.log('Browser log:', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error('Browser page error:', err);
  });

  console.log('🌐 Navigating to http://localhost:5173 ...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Screenshot 1: Initial Page (Unicorn)
  const shot1 = path.join(ARTIFACT_DIR, 'screenshot_1_unicorn_initial.png');
  await page.screenshot({ path: shot1 });
  console.log('📸 Saved Screenshot 1: Initial Unicorn Canvas ->', shot1);

  // Simulate Pointer drawing on canvas
  const canvas = await page.locator('canvas.cursor-crosshair');
  const box = await canvas.boundingBox();
  if (box) {
    console.log('🎨 Drawing simulated strokes on canvas at', box);

    // 1. Draw a rainbow stroke in center
    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.4);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.43);
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.46);
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.48);
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.45);
    await page.mouse.up();

    await page.waitForTimeout(500);

    // 2. Switch tool to Magic Sparkle Brush
    console.log('✨ Switching to Magic Sparkle brush...');
    await page.click('button[title="Magic"]');
    await page.waitForTimeout(300);

    // Switch to Gold color
    await page.click('button[title="Gold Sparkle"]');
    await page.waitForTimeout(300);

    // Draw sparkle trail
    await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.28);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.26);
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.27);
    await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.29);
    await page.mouse.up();

    await page.waitForTimeout(500);
  }

  // Screenshot 2: Colored Canvas with Crayon & Sparkles
  const shot2 = path.join(ARTIFACT_DIR, 'screenshot_2_colored_strokes.png');
  await page.screenshot({ path: shot2 });
  console.log('📸 Saved Screenshot 2: Colored Canvas ->', shot2);

  // 3. Open Bookshelf modal
  console.log('📚 Clicking Book button to open bookshelf...');
  await page.click('button[title="Choose a Colouring Page"]');
  await page.waitForTimeout(800);

  // Screenshot 3: Bookshelf
  const shot3 = path.join(ARTIFACT_DIR, 'screenshot_3_bookshelf.png');
  await page.screenshot({ path: shot3 });
  console.log('📸 Saved Screenshot 3: Bookshelf ->', shot3);

  // 4. Select Dinosaur page
  console.log('🦕 Selecting Baby Dino page...');
  await page.click('text="Baby Dino 🦕"');
  await page.waitForTimeout(800);

  // Screenshot 4: Dinosaur Page
  const shot4 = path.join(ARTIFACT_DIR, 'screenshot_4_dinosaur_page.png');
  await page.screenshot({ path: shot4 });
  console.log('📸 Saved Screenshot 4: Dinosaur Page ->', shot4);

  // 5. Test Palm Rejection toggle pill
  console.log('✍️ Testing Palm Rejection toggle...');
  const palmButton = page.locator('header button').filter({ hasText: /Pen|Touch/ });
  await palmButton.click();
  await page.waitForTimeout(300);

  const shot5 = path.join(ARTIFACT_DIR, 'screenshot_5_touch_mode.png');
  await page.screenshot({ path: shot5 });
  console.log('📸 Saved Screenshot 5: Touch Mode Toggled ->', shot5);

  await browser.close();

  console.log('\n📊 Test Summary:');
  console.log('Console Errors:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Errors found:', consoleErrors);
    process.exit(1);
  } else {
    console.log('🎉 ALL BROWSER UI VERIFICATIONS PASSED WITH ZERO CONSOLE ERRORS!');
  }
}

runBrowserTest().catch((err) => {
  console.error('Fatal error running browser test:', err);
  process.exit(1);
});
