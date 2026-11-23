/**
 * responsive.audit.ts — Checks for horizontal scroll, off-screen elements,
 * broken images, and console/API errors at 6 viewport sizes.
 * Needs Playwright installed and a running server.
 *
 * Run: npx tsx scripts/responsive.audit.ts
 *
 * Env: BASE_URL (default http://localhost:3000), ADMIN_EMAIL, ADMIN_PASSWORD
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@trgstudio.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 640 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'wide-1920', width: 1920, height: 1080 },
];

const PUBLIC_PAGES = [
  '/',
  '/products',
  '/blog',
  '/faq',
  '/about',
  '/contact',
  '/cart',
];

type PageResult = {
  page: string;
  viewport: string;
  passed: boolean;
  issues: string[];
};

async function main() {
  let chromium: any;
  try {
    const pw = await import('playwright');
    chromium = pw.chromium;
  } catch {
    console.error('Playwright is not installed. Install with: npm install -D playwright && npx playwright install chromium');
    process.exit(1);
  }

  console.log('=== Responsive Audit ===\n');
  const browser = await chromium.launch();
  const allResults: PageResult[] = [];

  // Login context for admin pages
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  try {
    await adminPage.goto(`${BASE_URL}/admin/login`);
    await adminPage.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL).catch(() => {});
    await adminPage.fill('input[name="password"], input[type="password"]', ADMIN_PASSWORD).catch(() => {});
    await adminPage.click('button[type="submit"]').catch(() => {});
    await adminPage.waitForTimeout(2000);
  } catch { /* login may fail if no admin exists */ }

  const adminPages = ['/admin', '/admin/products', '/admin/interests', '/admin/contacts', '/admin/discounts', '/admin/faqs', '/admin/settings'];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    // Collect console errors and API failures
    const consoleErrors: string[] = [];
    const apiErrors: string[] = [];
    page.on('console', (msg: any) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('response', (res: any) => {
      if (res.status() >= 500) apiErrors.push(`${res.status()} ${res.url()}`);
    });

    for (const path of PUBLIC_PAGES) {
      const issues: string[] = [];
      try {
        await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(500);

        // Check horizontal scroll
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        if (scrollWidth > clientWidth + 2) {
          issues.push(`Horizontal scroll: ${scrollWidth}px > ${clientWidth}px`);
        }

        // Check for broken images
        const brokenImages = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          return imgs.filter((img) => img.naturalWidth === 0 && img.complete && img.src).map((img) => (img as HTMLImageElement).src);
        });
        if (brokenImages.length > 0) issues.push(`Broken images: ${brokenImages.slice(0, 3).join(', ')}`);

        // Check for off-screen interactive elements (buttons/links outside viewport)
        const offScreen = await page.evaluate((vpW) => {
          const els = Array.from(document.querySelectorAll('button, a, input, select, textarea'));
          return els.filter((el) => {
            const rect = el.getBoundingClientRect();
            return rect.right > vpW + 5 || rect.left < -5;
          }).length;
        }, vp.width);
        if (offScreen > 0) issues.push(`${offScreen} off-screen interactive elements`);

        // Page-specific console errors
        if (consoleErrors.length > 0) issues.push(`Console errors: ${consoleErrors.slice(0, 2).join('; ')}`);
        if (apiErrors.length > 0) issues.push(`API errors: ${apiErrors.slice(0, 2).join('; ')}`);
      } catch (e: any) {
        issues.push(`Navigation error: ${e.message}`);
      }

      const passed = issues.length === 0;
      allResults.push({ page: path, viewport: vp.name, passed, issues });
      if (!passed) console.log(`[FAIL] ${path} @ ${vp.name}`);
      consoleErrors.length = 0;
      apiErrors.length = 0;
    }

    await context.close();
  }

  // Admin pages at desktop only
  for (const path of adminPages) {
    const issues: string[] = [];
    try {
      await adminPage.setViewportSize({ width: 1440, height: 900 });
      await adminPage.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await adminPage.waitForTimeout(500);

      const scrollWidth = await adminPage.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await adminPage.evaluate(() => document.documentElement.clientWidth);
      if (scrollWidth > clientWidth + 2) issues.push(`Horizontal scroll: ${scrollWidth}px > ${clientWidth}px`);

      const brokenImages = await adminPage.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.filter((img) => img.naturalWidth === 0 && img.complete && img.src).map((img) => (img as HTMLImageElement).src);
      });
      if (brokenImages.length > 0) issues.push(`Broken images: ${brokenImages.slice(0, 3).join(', ')}`);
    } catch (e: any) {
      issues.push(`Navigation error: ${e.message}`);
    }

    const passed = issues.length === 0;
    allResults.push({ page: path, viewport: 'admin-desktop', passed, issues });
    if (!passed) console.log(`[FAIL] ${path} @ admin-desktop`);
  }

  await browser.close();

  // Report
  const passed = allResults.filter((r) => r.passed).length;
  const failed = allResults.filter((r) => !r.passed).length;
  console.log(`\nPassed: ${passed}/${allResults.length}`);

  if (failed > 0) {
    console.log(`\n--- Failures ---`);
    for (const r of allResults) {
      if (!r.passed) {
        console.log(`  FAIL: ${r.page} @ ${r.viewport}`);
        for (const issue of r.issues) console.log(`       - ${issue}`);
      }
    }
  }

  console.log(`\n${failed === 0 ? 'PASS: All responsive checks passed.' : `FAIL: ${failed} checks failed.`}`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
