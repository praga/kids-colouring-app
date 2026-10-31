import { chromium } from 'playwright';

async function diagnose() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  page.on('console', (msg) => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const title = await page.locator('header h1').textContent();
  console.log('Active Page Title:', title);

  const canvas = page.locator('canvas.cursor-crosshair');
  const box = await canvas.boundingBox();
  console.log('Canvas BoundingBox:', box);

  // Test 1: Check mouse drag with Crayon
  console.log('\n--- 1. Testing Crayon Drag with Mouse ---');
  await page.click('button[title="Crayon"]');
  await page.click('button[title="Cherry Red"]');

  if (box) {
    const startX = box.x + box.width * 0.3;
    const startY = box.y + box.height * 0.3;
    const endX = box.x + box.width * 0.7;
    const endY = box.y + box.height * 0.7;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      const curX = startX + (endX - startX) * (i / 10);
      const curY = startY + (endY - startY) * (i / 10);
      await page.mouse.move(curX, curY);
    }
    await page.mouse.up();
    await page.waitForTimeout(400);

    // Inspect layers
    const layerPixels = await page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll('canvas'));
      const cCanvas = canvases[0]; // coloring canvas
      const lCanvas = canvases[1]; // line art canvas
      const aCanvas = canvases[2]; // active canvas

      const cCtx = cCanvas.getContext('2d');
      const lCtx = lCanvas.getContext('2d');
      const aCtx = aCanvas.getContext('2d');

      // Sample along center (400, 500)
      const cPixel = Array.from(cCtx.getImageData(400, 500, 1, 1).data);
      const lPixel = Array.from(lCtx.getImageData(400, 500, 1, 1).data);
      const aPixel = Array.from(aCtx.getImageData(400, 500, 1, 1).data);

      return {
        coloringPixel: cPixel,
        lineArtPixel: lPixel,
        activePixel: aPixel,
        canvasSizes: canvases.map((c) => ({ w: c.width, h: c.height, cw: c.clientWidth, ch: c.clientHeight })),
        mixBlendModes: canvases.map((c) => c.style.mixBlendMode)
      };
    });

    console.log('Layer diagnosis after Crayon drag:', JSON.stringify(layerPixels, null, 2));
  }

  // Test 2: Test Touch pointer event simulation
  console.log('\n--- 2. Testing Touch (Finger) simulation ---');
  const touchResult = await page.evaluate(() => {
    const canvas = document.querySelector('canvas.cursor-crosshair') as HTMLCanvasElement;
    if (!canvas) return 'Canvas not found';

    const rect = canvas.getBoundingClientRect();
    const touchDown = new PointerEvent('pointerdown', {
      pointerId: 2,
      pointerType: 'touch',
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      bubbles: true,
      cancelable: true
    });

    const dispatched = canvas.dispatchEvent(touchDown);
    return { dispatched, rect: { width: rect.width, height: rect.height } };
  });
  console.log('Touch PointerEvent result:', touchResult);

  // Test 3: Test Paint Bucket Tool
  console.log('\n--- 3. Testing Paint Bucket Tool ---');
  await page.click('button[title="Bucket"]');
  await page.click('button[title="Sunshine Yellow"]');

  if (box) {
    const clickX = box.x + box.width * 0.2;
    const clickY = box.y + box.height * 0.2;
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(500);

    const bucketResult = await page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll('canvas'));
      const cCanvas = canvases[0];
      const ctx = cCanvas.getContext('2d');
      // Sample around (160, 200)
      const pixel = Array.from(ctx.getImageData(160, 200, 1, 1).data);
      return { filledPixel: pixel };
    });
    console.log('Paint Bucket result at (160, 200):', bucketResult);
  }

  await page.screenshot({ path: '/tmp/diagnosis_screenshot.png' });
  console.log('Saved diagnosis screenshot to /tmp/diagnosis_screenshot.png');

  await browser.close();
}

diagnose().catch((err) => {
  console.error('Diagnosis failed:', err);
  process.exit(1);
});
