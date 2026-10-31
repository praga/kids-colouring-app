import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || '/tmp';

async function diagnoseUI() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  const viewports = [
    { name: 'lenovo_xiaoxin_landscape_1280x800', width: 1280, height: 800 },
    { name: 'lenovo_xiaoxin_portrait_800x1280', width: 800, height: 1280 },
    { name: 'tablet_landscape_1024x600', width: 1024, height: 600 },
    { name: 'tablet_portrait_600x1024', width: 600, height: 1024 },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true
    });

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const shotPath = path.join(ARTIFACT_DIR, `ui_${vp.name}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`📸 Screenshot saved: ${shotPath}`);

    // Check header, canvas, toolbar bounding boxes and overflow
    const layout = await page.evaluate(`(() => {
      const header = document.querySelector('header');
      const main = document.querySelector('main');
      const toolbar = document.querySelector('.bg-white\\\\/95.border-t-4') || document.querySelector('footer');
      const easel = document.querySelector('.relative.bg-white.rounded-3xl');
      const canvas = document.querySelector('canvas.cursor-crosshair');

      function getInfo(el, name) {
        if (!el) return { name: name, exists: false };
        const r = el.getBoundingClientRect();
        return {
          name: name,
          exists: true,
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          right: r.right,
          width: r.width,
          height: r.height,
          scrollWidth: el.scrollWidth,
          scrollHeight: el.scrollHeight,
          clientWidth: el.clientWidth,
          clientHeight: el.clientHeight,
          hasHorizontalOverflow: el.scrollWidth > el.clientWidth + 1,
          hasVerticalOverflow: el.scrollHeight > el.clientHeight + 1
        };
      }

      return {
        window: { innerWidth: window.innerWidth, innerHeight: window.innerHeight },
        header: getInfo(header, 'header'),
        main: getInfo(main, 'main'),
        toolbar: getInfo(toolbar, 'toolbar'),
        easel: getInfo(easel, 'easel'),
        canvas: getInfo(canvas, 'canvas')
      };
    })()`);

    console.log(`\n📐 Layout for ${vp.name}:`, JSON.stringify(layout, null, 2));

    await page.close();
  }

  // Also check Bookshelf at 1280x800
  const bsPage = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true
  });
  await bsPage.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await bsPage.waitForTimeout(500);
  await bsPage.click('button[title="Choose a Colouring Page"]');
  await bsPage.waitForTimeout(600);
  const bsShot = path.join(ARTIFACT_DIR, 'ui_bookshelf_1280x800.png');
  await bsPage.screenshot({ path: bsShot });
  console.log(`📸 Screenshot saved: ${bsShot}`);
  await bsPage.close();

  await browser.close();
}

diagnoseUI().catch(err => {
  console.error('Diagnosis error:', err);
  process.exit(1);
});
