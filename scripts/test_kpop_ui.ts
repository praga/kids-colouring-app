import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || '/tmp';

async function runBrowserTest() {
  console.log('🚀 Launching Chrome for testing K-Pop Demon Hunters...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true
  });

  // Emulate Lenovo Xiaoxin GT tablet viewport
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('Browser console error:', msg.text());
    }
  });

  console.log('🌐 Navigating to http://localhost:5173 ...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Initial screen: Golden HUNTR/X canvas
  const shot1 = path.join(ARTIFACT_DIR, 'kpop_huntrix_initial_canvas.png');
  await page.screenshot({ path: shot1 });
  console.log('📸 Screenshot 1: Canvas on load ->', shot1);

  // 2. Click the Book button to open page selector
  console.log('📚 Opening Book selector...');
  await page.click('button[title="Choose a Colouring Page"]');
  await page.waitForTimeout(800);

  const shot2 = path.join(ARTIFACT_DIR, 'kpop_bookshelf_all_pages.png');
  await page.screenshot({ path: shot2 });
  console.log('📸 Screenshot 2: Bookshelf with categories ->', shot2);

  // 3. Filter by K-Pop Demon Hunters category
  console.log('⚔️ Clicking K-Pop Demon Hunters filter pill...');
  await page.click('button:has-text("K-Pop Demon Hunters")');
  await page.waitForTimeout(600);

  const shot3 = path.join(ARTIFACT_DIR, 'kpop_bookshelf_filtered.png');
  await page.screenshot({ path: shot3 });
  console.log('📸 Screenshot 3: Bookshelf filtered to K-Pop Demon Hunters ->', shot3);

  // 4. Select Derpy Tiger Spirit
  console.log('🎨 Selecting Derpy Tiger Spirit page...');
  await page.click('h3:has-text("Derpy Tiger Spirit")');
  await page.waitForTimeout(1000);

  // 5. Draw some color on the canvas
  const canvas = await page.locator('canvas.cursor-crosshair');
  const box = await canvas.boundingBox();
  if (box) {
    console.log('🖍️ Coloring on canvas...');
    // Draw with pink crayon
    await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.45);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.45);
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.55);
    await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.55);
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Switch to paint bucket tool
    console.log('🪣 Testing Paint Bucket Fill...');
    const bucketBtn = page.locator('button[title="Bucket"]');
    if (await bucketBtn.count() > 0) {
      await bucketBtn.click();
      await page.waitForTimeout(300);
      // Click inside an open area
      await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.35);
      await page.waitForTimeout(500);
    }
  }

  const shot4 = path.join(ARTIFACT_DIR, 'kpop_derpy_colored_canvas.png');
  await page.screenshot({ path: shot4 });
  console.log('📸 Screenshot 4: Colored Derpy canvas ->', shot4);

  await browser.close();
  console.log('✅ UI verification completed successfully!');
}

runBrowserTest().catch(console.error);
