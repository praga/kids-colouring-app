import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || '/tmp';

async function diagnoseTextPadding() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // 1. Crop Header
  const header = page.locator('header');
  await header.screenshot({ path: path.join(ARTIFACT_DIR, 'crop_header.png') });
  console.log('📸 Saved crop_header.png');

  // 2. Crop Toolbar
  const toolbar = page.locator('.bg-white\\/95.border-t-2, .bg-white\\/95.border-t-3').first();
  await toolbar.screenshot({ path: path.join(ARTIFACT_DIR, 'crop_toolbar.png') });
  console.log('📸 Saved crop_toolbar.png');

  // 3. Open Bookshelf and crop modal parts
  await page.click('button[title="Choose a Colouring Page"]');
  await page.waitForTimeout(500);

  const bookshelfModal = page.locator('.fixed.inset-0.z-40');
  await bookshelfModal.screenshot({ path: path.join(ARTIFACT_DIR, 'crop_bookshelf_modal.png') });
  console.log('📸 Saved crop_bookshelf_modal.png');

  // Crop category pills bar
  const catPills = page.locator('.overflow-x-auto').first();
  await catPills.screenshot({ path: path.join(ARTIFACT_DIR, 'crop_category_pills.png') });
  console.log('📸 Saved crop_category_pills.png');

  // Crop first card
  const firstCard = page.locator('.grid button').first();
  await firstCard.screenshot({ path: path.join(ARTIFACT_DIR, 'crop_first_card.png') });
  console.log('📸 Saved crop_first_card.png');

  // Close bookshelf
  await page.click('button:has-text("Back")');
  await page.waitForTimeout(400);

  // 4. Open Clear modal and crop
  await page.click('button[title="Start Fresh / Clear"]');
  await page.waitForTimeout(400);

  const clearModal = page.locator('.fixed.inset-0.z-50');
  await clearModal.screenshot({ path: path.join(ARTIFACT_DIR, 'crop_clear_modal.png') });
  console.log('📸 Saved crop_clear_modal.png');

  await browser.close();
  console.log('✅ Done diagnosing text padding!');
}

diagnoseTextPadding().catch(console.error);
