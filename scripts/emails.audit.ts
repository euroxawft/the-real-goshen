/**
 * emails.audit.ts — Static audit (no server needed).
 * Renders every email template with realistic sample data (one preorder + one ready-stock item),
 * and verifies: logo present, escaped input, preorder text, correct copy per subject,
 * struck-through original price when discounted, and total shown.
 *
 * Run: npx tsx scripts/emails.audit.ts
 */
import {
  interestCustomerConfirmation,
  interestAdminNotification,
  interestReminder,
  contactAutoReply,
  contactAdminNotification,
  contactReplyToCustomer,
} from '../server/common/email-templates';
import { getAutoReplyCopy } from '../server/resources/contacts/admin-contacts.service';

type CheckResult = { name: string; passed: boolean; checks: { label: string; passed: boolean }[] };

const SAMPLE = {
  reference: 'TRG-PREV01',
  customerName: 'Ada Okafor',
  customerEmail: 'customer@example.com',
  customerPhone: '+2348012345678',
  totalEstimate: 85000,
  items: [
    { productName: 'Leather Tote Bag', quantity: 1, unitPrice: 60000, originalPrice: 75000, discountPercent: 20, imageUrl: 'https://cdn.example.com/tote.jpg', availability: 'preorder' as const, leadTimeText: 'about 4 to 8 weeks' },
    { productName: 'Gold Heels', quantity: 1, unitPrice: 25000, originalPrice: 25000, discountPercent: 0, imageUrl: 'https://cdn.example.com/heels.jpg', availability: 'ready_stock' as const, leadTimeText: null },
  ],
  leadTimeText: 'about 4 to 8 weeks',
  preorderNote: 'Preorder pieces are crafted after confirmation and arrive in 4-8 weeks.',
  whatsappNumber: '2348012345678',
  message: 'Thank you for your interest.',
  name: 'Ada Okafor',
};

const XSS_INPUT = '<script>alert("xss")</script>';

type Check = { label: string; test: (html: string) => boolean };

function auditTemplate(name: string, renderFn: () => { subject: string; html: string; text: string }, extraChecks: Check[] = []): CheckResult {
  const result = renderFn();
  const html = result.html;
  const hasItems = name.startsWith('interest_');

  const checks: { label: string; passed: boolean }[] = [
    { label: 'Logo image present', passed: html.includes('trg-logo-600.jpg') && html.includes('<img') },
    { label: 'Color-scheme meta present', passed: html.includes('color-scheme') && html.includes('light only') },
    { label: 'Gold bottom border on header', passed: html.includes('#c9a96a') },
    { label: 'No raw SVG tags', passed: !html.includes('<svg') },
    { label: 'No external CSS links', passed: !html.includes('rel="stylesheet"') },
    { label: 'Uses table layout', passed: html.includes('<table') },
  ];

  if (hasItems) {
    checks.push({ label: 'Preorder text present', passed: html.toLowerCase().includes('preorder') });
    checks.push({ label: 'Struck-through original price when discounted', passed: html.includes('<del') });
    checks.push({ label: 'Total estimate shown', passed: html.includes('85,000') || html.includes('Estimated total') });
    checks.push({ label: 'Item thumbnail present', passed: html.includes('tote.jpg') || html.includes('heels.jpg') });
  }

  for (const extra of extraChecks) {
    checks.push({ label: extra.label, passed: extra.test(html) });
  }

  return { name, passed: checks.every((c) => c.passed), checks };
}

const results: CheckResult[] = [];

results.push(auditTemplate('interest_customer', () => interestCustomerConfirmation(SAMPLE), [
  { label: 'Reference shown', test: (h) => h.includes('TRG-PREV01') },
]));
results.push(auditTemplate('interest_store', () => interestAdminNotification(SAMPLE)));
results.push(auditTemplate('reminder', () => interestReminder(SAMPLE), [
  { label: 'WhatsApp number shown', test: (h) => h.includes('2348012345678') },
]));

const subjects = ['general', 'order', 'product', 'partnership', 'complaint'] as const;
for (const subject of subjects) {
  const copy = getAutoReplyCopy(subject);
  results.push(auditTemplate(`contact_autoreply_${subject}`, () => contactAutoReply({ ...SAMPLE, message: copy }), [
    { label: 'Correct subject copy', test: (h) => h.includes(copy.substring(0, 20)) },
    { label: 'Complaint has apology', test: (h) => subject !== 'complaint' || h.toLowerCase().includes('sorry') },
  ]));
}

results.push(auditTemplate('contact_store', () => contactAdminNotification(SAMPLE)));
results.push(auditTemplate('contact_reply', () => contactReplyToCustomer(SAMPLE)));

// XSS test
const xssResult = contactAutoReply({ ...SAMPLE, name: XSS_INPUT, message: XSS_INPUT });
const xssPassed = !xssResult.html.includes('<script>');
results.push({ name: 'xss_escaping', passed: xssPassed, checks: [{ label: 'Script tags escaped', passed: xssPassed }] });

// Report
console.log('=== Email Audit ===\n');
let allPassed = true;
for (const r of results) {
  const status = r.passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${r.name}`);
  if (!r.passed) {
    allPassed = false;
    for (const c of r.checks) {
      if (!c.passed) console.log(`       FAIL: ${c.label}`);
    }
  }
}
console.log(`\n${allPassed ? 'PASS: All email checks passed.' : 'FAIL: Some email checks failed.'}`);
if (!allPassed) process.exit(1);
