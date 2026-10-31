import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';

describe('UI Layout & Viewport Anti-Chopping Verification', () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  });

  afterAll(async () => {
    await browser?.close();
  });

  const testViewports = [
    { name: 'Lenovo Xiaoxin GT Landscape (1280x800)', width: 1280, height: 800 },
    { name: 'Lenovo Xiaoxin GT Portrait (800x1280)', width: 800, height: 1280 },
    { name: 'Compact Tablet Landscape (1024x600)', width: 1024, height: 600 },
    { name: 'Compact Tablet Portrait (600x1024)', width: 600, height: 1024 }
  ];

  for (const vp of testViewports) {
    it(`verifies no UI clipping or overflow on ${vp.name}`, async () => {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true
      });

      await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);

      const layout = await page.evaluate(() => {
        const header = document.querySelector('header');
        const main = document.querySelector('main');
        const toolbar = document.querySelector('.bg-white\\/95.border-t-2') || document.querySelector('.bg-white\\/95.border-t-3') || document.querySelector('.border-t-4');
        const easel = document.querySelector('.relative.bg-white.rounded-3xl');
        const canvas = document.querySelector('canvas.cursor-crosshair');
        const cleanBtn = document.querySelector('button[title="Start Fresh / Clear"]');
        const crayonBtn = document.querySelector('button[title="Crayon"]');

        const headerRect = header?.getBoundingClientRect();
        const mainRect = main?.getBoundingClientRect();
        const toolbarRect = toolbar?.getBoundingClientRect();
        const cleanRect = cleanBtn?.getBoundingClientRect();
        const crayonRect = crayonBtn?.getBoundingClientRect();

        // Check title and mode pill overlap
        const titleEl = header?.querySelector('h1');
        const pillEl = Array.from(header?.querySelectorAll('button') || []).find(b =>
          b.textContent?.includes('Pen') || b.textContent?.includes('Touch')
        );
        const titleRect = titleEl?.getBoundingClientRect();
        const pillRect = pillEl?.getBoundingClientRect();

        const overlaps = titleRect && pillRect && (titleRect.right > pillRect.left);

        return {
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          header: {
            exists: !!header,
            width: headerRect?.width,
            right: headerRect?.right,
            scrollWidth: header?.scrollWidth,
            clientWidth: header?.clientWidth,
            hasHorizontalOverflow: header ? header.scrollWidth > header.clientWidth + 1 : false
          },
          main: {
            exists: !!main,
            top: mainRect?.top,
            bottom: mainRect?.bottom,
            height: mainRect?.height
          },
          toolbar: {
            exists: !!toolbar,
            top: toolbarRect?.top,
            bottom: toolbarRect?.bottom,
            height: toolbarRect?.height
          },
          easel: {
            exists: !!easel,
            top: easel?.getBoundingClientRect().top,
            bottom: easel?.getBoundingClientRect().bottom
          },
          buttons: {
            cleanRight: cleanRect?.right,
            crayonLeft: crayonRect?.left
          },
          overlaps
        };
      });

      // 1. Header must never have horizontal overflow (no chopped buttons on right)
      expect(layout.header.hasHorizontalOverflow).toBe(false);
      expect(layout.header.right).toBeLessThanOrEqual(vp.width + 1);

      // 2. Title and Mode Pill must not overlap
      expect(layout.overlaps).toBe(false);

      // 3. Toolbar must sit within the viewport
      expect(layout.toolbar.bottom).toBeLessThanOrEqual(vp.height + 1);

      // 4. Easel must fit completely inside the main viewport without bleeding out
      expect(layout.easel.top).toBeGreaterThanOrEqual(layout.header.width ? 40 : 0);
      expect(layout.easel.bottom).toBeLessThanOrEqual(layout.toolbar.top + 2);

      // 5. Crayon button on far left must not be clipped (left >= 0)
      if (layout.buttons.crayonLeft !== undefined) {
        expect(layout.buttons.crayonLeft).toBeGreaterThanOrEqual(0);
      }

      await page.close();
    });
  }

  it('verifies Bookshelf modal categories and cards do not clip or slice text', async () => {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2
    });

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Open bookshelf
    await page.click('button[title="Choose a Colouring Page"]');
    await page.waitForTimeout(600);

    const check = await page.evaluate(() => {
      const modal = document.querySelector('.fixed.inset-0.z-40');
      const catContainer = modal?.querySelector('.overflow-x-auto');
      const catButtons = Array.from(modal?.querySelectorAll('.overflow-x-auto button') || []);
      const grid = modal?.querySelector('.grid');

      const modalRect = modal?.getBoundingClientRect();
      const catRect = catContainer?.getBoundingClientRect();
      const gridRect = grid?.getBoundingClientRect();

      const buttonHeights = catButtons.map(b => b.getBoundingClientRect().height);

      return {
        modalExists: !!modal,
        catCount: catButtons.length,
        minButtonHeight: Math.min(...buttonHeights),
        catTop: catRect?.top,
        catBottom: catRect?.bottom,
        gridTop: gridRect?.top,
        isCatSqueezed: catRect && gridRect ? (catRect.bottom > gridRect.top) : false
      };
    });

    expect(check.modalExists).toBe(true);
    expect(check.catCount).toBeGreaterThanOrEqual(3);
    // Button height must be at least 28px (not sliced in half)
    expect(check.minButtonHeight).toBeGreaterThanOrEqual(28);
    // Category container must not overlap or be covered by the grid
    expect(check.isCatSqueezed).toBe(false);

    await page.close();
  });
});
