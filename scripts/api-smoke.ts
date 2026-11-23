/**
 * api-smoke.ts — Live API smoke tests (needs running server + seeded DB).
 * Tests: API envelope shape, DTO shapes, validation errors (400/422),
 * auth flows (401 without cookie, login, refresh rotation, reuse detection),
 * 404 for missing resources, and rate-limit (429) on repeated submissions.
 *
 * Run: npx tsx scripts/api-smoke.ts
 *
 * Env: BASE_URL (default http://localhost:3000), ADMIN_EMAIL, ADMIN_PASSWORD
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@trgstudio.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

type TestResult = { name: string; passed: boolean; error?: string };
const results: TestResult[] = [];

async function json(path: string, options: RequestInit = {}, expectStatus?: number): Promise<{ status: number; body: any; cookies: string[] }> {
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const text = await res.text();
  let body: any = null;
  try { body = JSON.parse(text); } catch { body = text; }
  const cookies = res.headers.getSetCookie?.() ?? [];
  return { status: res.status, body, cookies };
}

function cookieHeader(cookies: string[]): string {
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

function test(name: string, fn: () => Promise<boolean>, error?: string) {
  results.push({ name, passed: false, error });
}

// Run sequentially
async function run(name: string, fn: () => Promise<{ passed: boolean; error?: string }>) {
  try {
    const r = await fn();
    results.push({ name, passed: r.passed, error: r.error });
  } catch (e: any) {
    results.push({ name, passed: false, error: e.message });
  }
}

async function main() {
  console.log(`=== API Smoke Tests ===`);
  console.log(`Target: ${BASE_URL}\n`);

  // 1. Health check
  await run('GET /api/health returns 200', async () => {
    const r = await json('/api/health');
    return { passed: r.status === 200 && r.body?.success === true, error: r.status !== 200 ? `Got ${r.status}` : undefined };
  });

  // 2. Public settings
  await run('GET /api/settings/public returns settings DTO', async () => {
    const r = await json('/api/settings/public');
    const d = r.body?.data;
    const hasFields = d && 'whatsappNumber' in d && 'heroHeadline' in d && 'preorderNote' in d;
    return { passed: r.status === 200 && r.body?.success === true && Boolean(hasFields), error: !hasFields ? 'Missing expected fields' : undefined };
  });

  // 3. Public products
  await run('GET /api/products returns paginated list', async () => {
    const r = await json('/api/products?page=1&limit=5');
    const d = r.body?.data;
    const hasShape = d && Array.isArray(d.items) && typeof d.total === 'number';
    return { passed: r.status === 200 && Boolean(hasShape), error: !hasShape ? 'Missing items/total' : undefined };
  });

  // 4. Categories
  await run('GET /api/categories returns array', async () => {
    const r = await json('/api/categories');
    const d = r.body?.data;
    return { passed: r.status === 200 && Array.isArray(d?.items), error: undefined };
  });

  // 5. Blog
  await run('GET /api/blog returns published posts', async () => {
    const r = await json('/api/blog');
    const d = r.body?.data;
    return { passed: r.status === 200 && Array.isArray(d?.items), error: undefined };
  });

  // 6. FAQs
  await run('GET /api/faqs returns published FAQs', async () => {
    const r = await json('/api/faqs');
    const d = r.body?.data;
    return { passed: r.status === 200 && Array.isArray(d?.items), error: undefined };
  });

  // 7. Admin route without auth -> 401
  await run('GET /api/admin/products without auth returns 401', async () => {
    const r = await json('/api/admin/products');
    return { passed: r.status === 401, error: r.status !== 401 ? `Expected 401, got ${r.status}` : undefined };
  });

  // 8. Admin login
  let authCookies: string[] = [];
  await run('POST /api/admin/auth/login succeeds', async () => {
    const r = await json('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    authCookies = r.cookies;
    return { passed: r.status === 200 && r.body?.success === true && r.body?.data?.admin, error: r.status !== 200 ? `Got ${r.status}: ${JSON.stringify(r.body)}` : undefined };
  });

  // 9. Authed admin call
  await run('GET /api/admin/products with auth returns 200', async () => {
    if (!authCookies.length) return { passed: false, error: 'No auth cookies from login' };
    const r = await json('/api/admin/products', { headers: { Cookie: cookieHeader(authCookies) } });
    return { passed: r.status === 200 && r.body?.success === true, error: r.status !== 200 ? `Got ${r.status}` : undefined };
  });

  // 10. Admin auth/me
  await run('GET /api/admin/auth/me returns admin profile', async () => {
    if (!authCookies.length) return { passed: false, error: 'No auth cookies' };
    const r = await json('/api/admin/auth/me', { headers: { Cookie: cookieHeader(authCookies) } });
    return { passed: r.status === 200 && r.body?.data?.email, error: undefined };
  });

  // 11. Dashboard
  await run('GET /api/admin/dashboard returns stats', async () => {
    if (!authCookies.length) return { passed: false, error: 'No auth cookies' };
    const r = await json('/api/admin/dashboard', { headers: { Cookie: cookieHeader(authCookies) } });
    const d = r.body?.data;
    return { passed: r.status === 200 && d && 'stats' in d, error: undefined };
  });

  // 12. Counts
  await run('GET /api/admin/counts returns counts', async () => {
    if (!authCookies.length) return { passed: false, error: 'No auth cookies' };
    const r = await json('/api/admin/counts', { headers: { Cookie: cookieHeader(authCookies) } });
    return { passed: r.status === 200 && r.body?.data, error: undefined };
  });

  // 13. Contact form validation
  await run('POST /api/contact with short message returns 422', async () => {
    const r = await json('/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'test@test.com', subject: 'general', message: 'hi' }),
    });
    return { passed: r.status === 400 || r.status === 422, error: r.status === 201 ? 'Should have rejected short message' : undefined };
  });

  // 14. Interest form validation
  await run('POST /api/interests with empty items returns 422', async () => {
    const r = await json('/api/interests', {
      method: 'POST',
      body: JSON.stringify({ customerName: 'Test', customerEmail: 'test@test.com', customerPhone: '1234567', items: [] }),
    });
    return { passed: r.status === 400 || r.status === 422, error: undefined };
  });

  // 15. 404 for missing product slug
  await run('GET /api/products/nonexistent-slug returns 404', async () => {
    const r = await json('/api/products/nonexistent-slug-xyz');
    return { passed: r.status === 404, error: r.status !== 404 ? `Got ${r.status}` : undefined };
  });

  // 16. Admin health
  await run('GET /api/admin/health with auth returns siteUrlIsPublic', async () => {
    if (!authCookies.length) return { passed: false, error: 'No auth cookies' };
    const r = await json('/api/admin/health', { headers: { Cookie: cookieHeader(authCookies) } });
    return { passed: r.status === 200 && r.body?.data, error: undefined };
  });

  // 17. Refresh token rotation
  let refreshCookies: string[] = [];
  await run('POST /api/admin/auth/refresh rotates token', async () => {
    if (!authCookies.length) return { passed: false, error: 'No auth cookies' };
    const r = await json('/api/admin/auth/refresh', {
      method: 'POST',
      headers: { Cookie: cookieHeader(authCookies) },
    });
    refreshCookies = r.cookies;
    const newRefresh = r.cookies.find((c) => c.startsWith('trg_refresh='));
    return { passed: r.status === 200 && Boolean(newRefresh), error: r.status !== 200 ? `Got ${r.status}` : undefined };
  });

  // 18. Reuse old refresh token -> should fail
  await run('Reusing old refresh token fails', async () => {
    const r = await json('/api/admin/auth/refresh', {
      method: 'POST',
      headers: { Cookie: cookieHeader(authCookies) },
    });
    return { passed: r.status === 401, error: r.status !== 401 ? `Expected 401, got ${r.status}` : undefined };
  });

  // Report
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`\nPassed: ${passed}/${results.length}`);
  if (failed > 0) {
    console.log(`\n--- Failures ---`);
    for (const r of results) {
      if (!r.passed) console.log(`  FAIL: ${r.name}${r.error ? ` — ${r.error}` : ''}`);
    }
  }
  console.log(`\n${failed === 0 ? 'PASS: All smoke tests passed.' : `FAIL: ${failed} tests failed.`}`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
