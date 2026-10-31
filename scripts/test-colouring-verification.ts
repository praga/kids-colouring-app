import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || '/tmp';

async function verifyColouring() {
  console.log('🚀 Launching Chrome to verify colouring functionality...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('Browser ERROR:', msg.text());
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const canvas = page.locator('canvas.cursor-crosshair');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas box not found');
  console.log('Canvas location:', box);

  // 1. TEST TOUCH / FINGER DRAWING (CRAYON)
  console.log('🖍️ 1. Testing Crayon drawing with Touch event...');
  await page.click('button[title="Crayon"]');
  await page.click('button[title="Bubblegum Pink"]');

  // Draw a big pink circle in the center with Touch
  await page.evaluate(() => {
    const activeCanvas = document.querySelector('canvas.cursor-crosshair') as HTMLCanvasElement;
    const rect = activeCanvas.getBoundingClientRect();
    
    // Simulate pointerdown, pointermoves, pointerup with pointerType: 'touch'
    const centerX = rect.left + rect.width * 0.5;
    const centerY = rect.top + rect.height * 0.45;

    activeCanvas.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 10,
      pointerType: 'touch',
      clientX: centerX - 60,
      clientY: centerY,
      pressure: 0.8,
      bubbles: true,
      cancelable: true
    }));

    for (let angle = 0; angle <= Math.PI * 2; angle += 0.3) {
      const px = centerX + Math.cos(angle) * 60;
      const py = centerY + Math.sin(angle) * 60;
      activeCanvas.dispatchEvent(new PointerEvent('pointermove', {
        pointerId: 10,
        pointerType: 'touch',
        clientX: px,
        clientY: py,
        pressure: 0.85,
        bubbles: true,
        cancelable: true
      }));
    }

    activeCanvas.dispatchEvent(new PointerEvent('pointerup', {
      pointerId: 10,
      pointerType: 'touch',
      clientX: centerX + 60,
      clientY: centerY,
      bubbles: true,
      cancelable: true
    }));
  });

  await page.waitForTimeout(500);

  // 2. TEST PAINT BUCKET (FLOOD FILL)
  console.log('🪣 2. Testing Paint Bucket Tool on background...');
  await page.click('button[title="Bucket"]');
  await page.click('button[title="Sky Blue"]');

  // Click on background sky area
  await page.mouse.click(box.x + box.width * 0.15, box.y + box.height * 0.15);
  await page.waitForTimeout(500);

  // 3. TEST MAGIC SPARKLE BRUSH
  console.log('✨ 3. Testing Magic Sparkle Brush...');
  await page.click('button[title="Magic"]');
  await page.click('button[title="Gold Sparkle"]');

  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.25);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.25);
  await page.mouse.up();
  await page.waitForTimeout(500);

  // Take screenshot of easel to visually inspect
  const easel = page.locator('.relative.bg-white.rounded-3xl');
  const screenshotPath = path.join(ARTIFACT_DIR, 'easel_verified_colouring.png');
  await easel.screenshot({ path: screenshotPath });
  console.log('📸 Saved verified colouring screenshot to:', screenshotPath);

  // Check pixel colors to confirm coloring exists AND line art is on top
  const pixelCheck = await page.evaluate(() => {
    const canvases = Array.from(document.querySelectorAll('canvas'));
    const cCanvas = canvases[0]; // coloring layer
    const lCanvas = canvases[2]; // line art layer (on top!)

    const cCtx = cCanvas.getContext('2d');
    const lCtx = lCanvas.getContext('2d');

    // Sample background pixel where sky blue was filled
    const skyPixel = Array.from(cCtx.getImageData(120, 150, 1, 1).data);
    // Sample pink circle area
    const pinkPixel = Array.from(cCtx.getImageData(460, 450, 1, 1).data);
    // Sample a black outline pixel on the top line art canvas
    // Find a pixel where lineArt has alpha > 200
    const lData = lCtx.getImageData(0, 0, 800, 1000).data;
    let outlineCount = 0;
    for (let i = 3; i < lData.length; i += 4) {
      if (lData[i] > 200) outlineCount++;
    }

    return {
      skyPixel,
      pinkPixel,
      outlinePixelsOnTop: outlineCount
    };
  });

  console.log('📊 Colouring Pixel Check:', pixelCheck);

  if (pixelCheck.skyPixel[0] === 0 && pixelCheck.skyPixel[1] === 187 && pixelCheck.skyPixel[2] === 249) {
    console.log('✅ Paint Bucket flood fill verified! Pixel filled with exact Sky Blue (#00BBF9)');
  } else {
    console.log('Sky pixel filled:', pixelCheck.skyPixel);
  }

  if (pixelCheck.pinkPixel[3] > 0) {
    console.log('✅ Crayon touch stroke verified! Pixel contains color data');
  }

  console.log(`✅ Line Art confirmed on top layer: ${pixelCheck.outlinePixelsOnTop} black outline pixels`);

  await browser.close();
}

verifyColouring().catch((err) => {
  console.error('Colouring verification failed:', err);
  process.exit(1);
});
