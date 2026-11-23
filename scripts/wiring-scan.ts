/**
 * wiring-scan.ts — Static audit (no server needed).
 * Scans every API route file for: correct methods, requireAdmin guards on admin routes,
 * error handling via handleError, and verifies email templates are called from the right routes.
 * Also checks that no mock data arrays remain in the codebase.
 *
 * Run: npx tsx scripts/wiring-scan.ts
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
type Finding = { file: string; severity: 'error' | 'warn'; message: string };
const findings: Finding[] = [];

function walkDir(dir: string, cb: (filePath: string) => void) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkDir(full, cb);
    else cb(full);
  }
}

// 1. Scan every route.ts for exported HTTP methods and guards
const ROUTE_DIR = join(ROOT, 'app/api');
const routeFiles: string[] = [];
walkDir(ROUTE_DIR, (f) => { if (f.endsWith('route.ts')) routeFiles.push(f); });

const ADMIN_ROUTE_PATTERN = '/api/admin/';
const HTTP_METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];

for (const file of routeFiles) {
  const content = readFileSync(file, 'utf-8');
  const relPath = relative(ROOT, file).replace('/route.ts', '').replace('app', '');
  const isAdmin = relPath.includes('/admin/') && !relPath.includes('/admin/auth/') && !relPath.includes('/admin/health');

  const exportedMethods = HTTP_METHODS.filter((m) => new RegExp(`export\\s+async\\s+function\\s+${m}\\b`).test(content));

  if (exportedMethods.length === 0) {
    findings.push({ file: relPath, severity: 'warn', message: 'No HTTP method exports found' });
  }

  // Admin routes (except auth and health) must call requireAdmin
  if (isAdmin && exportedMethods.length > 0) {
    const hasGuard = content.includes('requireAdmin');
    if (!hasGuard) {
      findings.push({ file: relPath, severity: 'error', message: 'Admin route missing requireAdmin guard' });
    }
  }

  // All routes should use handleError or return ok/fail
  const hasErrorHandling = content.includes('handleError') || content.includes('NextResponse.json');
  if (!hasErrorHandling && exportedMethods.length > 0) {
    findings.push({ file: relPath, severity: 'warn', message: 'No error handling (handleError/NextResponse.json) found' });
  }

  // Check for try/catch
  const hasTryCatch = content.includes('try') && content.includes('catch');
  if (!hasTryCatch && exportedMethods.length > 0) {
    findings.push({ file: relPath, severity: 'warn', message: 'No try/catch block' });
  }
}

// 2. Verify email templates are called from the right routes
const EMAIL_TRIGGER_MAP: Record<string, string[]> = {
  'interestCustomerConfirmation': ['app/api/interests/route.ts', 'server/resources/interests/admin-interests.service.ts'],
  'interestAdminNotification': ['app/api/interests/route.ts', 'server/resources/interests/interests.service.ts'],
  'interestReminder': ['server/resources/interests/admin-interests.service.ts'],
  'contactAutoReply': ['app/api/contact/route.ts', 'server/resources/contacts/admin-contacts.service.ts'],
  'contactAdminNotification': ['app/api/contact/route.ts'],
  'contactReplyToCustomer': ['server/resources/contacts/admin-contacts.service.ts'],
};

for (const [template, expectedFiles] of Object.entries(EMAIL_TRIGGER_MAP)) {
  let found = false;
  for (const expected of expectedFiles) {
    const full = join(ROOT, expected);
    if (existsSync(full) && readFileSync(full, 'utf-8').includes(template)) { found = true; break; }
  }
  if (!found) {
    findings.push({ file: 'email-templates', severity: 'error', message: `Template "${template}" is not called from any expected route` });
  }
}

// 3. Check for mock data arrays
const MOCK_PATTERNS = [
  /\bmockProducts\b/i, /\bmockCategories\b/i, /\bmockBlogs?\b/i, /\bmockFaqs?\b/i,
  /\bfakeProducts\b/i, /\bdummyProducts\b/i, /\bdemoProducts\b/i, /\bsampleData\b/i,
  /\bhardcodedProducts\b/i, /\bMOCK_/i, /\bFAKE_/i,
];
const SCAN_DIRS = ['app', 'components', 'lib', 'server'];
for (const dir of SCAN_DIRS) {
  walkDir(join(ROOT, dir), (f) => {
    if (!f.endsWith('.ts') && !f.endsWith('.tsx')) return;
    if (f.includes('node_modules') || f.includes('.next')) return;
    const content = readFileSync(f, 'utf-8');
    for (const pattern of MOCK_PATTERNS) {
      if (pattern.test(content)) {
        findings.push({ file: relative(ROOT, f), severity: 'warn', message: `Possible mock data: pattern "${pattern.source}" found` });
      }
    }
  });
}

// 4. Report
const errors = findings.filter((f) => f.severity === 'error');
const warns = findings.filter((f) => f.severity === 'warn');

console.log('=== Wiring Scan ===\n');
console.log(`Routes scanned: ${routeFiles.length}`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warns.length}\n`);

if (errors.length > 0) {
  console.log('--- Errors ---');
  for (const e of errors) console.log(`  [${e.file}] ${e.message}`);
  console.log();
}
if (warns.length > 0) {
  console.log('--- Warnings ---');
  for (const w of warns) console.log(`  [${w.file}] ${w.message}`);
  console.log();
}

if (errors.length === 0) console.log('PASS: No wiring errors found.');
else { console.log('FAIL: Wiring errors found.'); process.exit(1); }
