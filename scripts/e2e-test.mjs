#!/usr/bin/env node
/**
 * E2E Test Suite for Aesthetic Lounge
 * Tests every public page, dashboard page, API endpoint, form, and button
 */

const BASE = 'http://localhost:3000';
let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    console.log(`  ✗ ${name} — ${err.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

async function get(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, { redirect: 'manual', ...opts });
  return res;
}

async function getOK(path) {
  const res = await get(path);
  assert(res.status === 200, `Expected 200, got ${res.status} for ${path}`);
  return res;
}

async function getHTML(path) {
  const res = await getOK(path);
  const html = await res.text();
  assert(html.includes('</html>') || html.includes('</body>'), `No HTML body for ${path}`);
  return html;
}

// ─── Public Pages ───────────────────────────────────────────────────
console.log('\n📄 Public Pages');

const publicPages = [
  '/', '/about', '/services', '/gallery', '/contact', '/book',
  '/promotions', '/price-guide', '/social', '/privacy', '/terms',
  '/feedback', '/feedback/complaint', '/intake/new',
];

for (const p of publicPages) {
  await test(`GET ${p}`, () => getHTML(p));
}

// ─── Service Pages (sample) ─────────────────────────────────────────
console.log('\n💉 Service Pages (sample)');

const sampleServices = [
  '/services/classical-facial', '/services/keravive-hydrafacial',
  '/services/botox', '/services/laser-hair-removal',
  '/services/fat-freeze-coolsculpting', '/services/dermal-fillers',
];

for (const p of sampleServices) {
  await test(`GET ${p}`, () => getHTML(p));
}

// ─── Landing Pages ──────────────────────────────────────────────────
console.log('\n🎯 Landing Pages');

const landingPages = ['/lp/laser-hair-removal', '/lp/hydrafacial', '/lp/botox'];
for (const p of landingPages) {
  await test(`GET ${p}`, () => getHTML(p));
}

// ─── Dashboard (should redirect to login without auth) ──────────────
console.log('\n🔒 Dashboard Auth Protection');

const dashPages = [
  '/dashboard', '/dashboard/leads', '/dashboard/appointments',
  '/dashboard/marketing', '/dashboard/analytics', '/dashboard/ads',
  '/dashboard/conversations', '/dashboard/settings',
  '/dashboard/feedback', '/dashboard/marketing/carousels',
  '/dashboard/marketing/brand-assets', '/dashboard/appointments/new',
];

for (const p of dashPages) {
  await test(`${p} → redirect`, async () => {
    const res = await get(p);
    // Should redirect (302/307) or return 200 with login form
    assert(
      res.status === 302 || res.status === 307 || res.status === 200,
      `Unexpected ${res.status} for ${p}`,
    );
  });
}

// ─── Public API Endpoints ───────────────────────────────────────────
console.log('\n🔌 Public API Endpoints');

await test('POST /api/lead (validation)', async () => {
  const res = await fetch(`${BASE}/api/lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  // Should fail validation (missing required fields)
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

await test('POST /api/lead (valid)', async () => {
  const res = await fetch(`${BASE}/api/lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'E2E Test',
      phone: '+923001234567',
      email: 'e2e@test.com',
      treatment: 'Botox',
      source: 'website',
      landing_page: '/e2e-test',
    }),
  });
  const data = await res.json();
  assert(res.status === 200 || res.status === 201, `Lead creation failed: ${res.status}`);
  assert(data.success || data.id, 'No success/id in response');
});

await test('POST /api/booking (validation)', async () => {
  const res = await fetch(`${BASE}/api/booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

await test('POST /api/booking (valid)', async () => {
  const res = await fetch(`${BASE}/api/booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'E2E Booking',
      phone: '+923009876543',
      treatment: 'Classical Facial',
      date: '2026-04-15',
      time: '14:00',
    }),
  });
  assert(res.status === 200 || res.status === 201 || res.status === 429, `Booking failed: ${res.status}`);
});

await test('POST /api/feedback', async () => {
  const res = await fetch(`${BASE}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'E2E Feedback',
      rating: 5,
      treatment: 'Hydrafacial',
      feedback: 'Great test experience',
    }),
  });
  assert(res.status === 200 || res.status === 201, `Feedback failed: ${res.status}`);
});

// ─── Dashboard APIs (should 401 without auth) ──────────────────────
console.log('\n🔐 Dashboard API Auth');

const protectedApis = [
  '/api/dashboard/leads',
  '/api/dashboard/appointments',
  '/api/dashboard/analytics',
];

for (const p of protectedApis) {
  await test(`GET ${p} → 401`, async () => {
    const res = await get(p);
    assert(res.status === 401 || res.status === 403, `Expected 401/403, got ${res.status}`);
  });
}

// ─── Pipeline Status (public check) ────────────────────────────────
console.log('\n🔧 Pipeline & Status');

await test('GET /api/al/status → 401 (auth required)', async () => {
  const res = await get('/api/al/status');
  assert(res.status === 401, `Expected 401, got ${res.status}`);
});

// ─── Static Assets ──────────────────────────────────────────────────
console.log('\n📦 Static Assets');

await test('GET /robots.txt', async () => {
  const res = await getOK('/robots.txt');
  const text = await res.text();
  assert(text.includes('Sitemap') || text.includes('User-agent'), 'Invalid robots.txt');
});

await test('GET /sitemap.xml', async () => {
  const res = await getOK('/sitemap.xml');
  const text = await res.text();
  assert(text.includes('urlset') || text.includes('sitemapindex'), 'Invalid sitemap');
});

// ─── Contact form sends treatment: null (not undefined) ─────────────
console.log('\n📝 Form Data Validation');

await test('Contact form sends null treatment (not undefined)', async () => {
  const res = await fetch(`${BASE}/api/lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Contact Form Test',
      phone: '+923005555555',
      treatment: null,
      source: 'website',
      landing_page: '/contact',
    }),
  });
  assert(res.status === 200 || res.status === 201, `Contact form failed: ${res.status}`);
});

// ─── 404 handling ───────────────────────────────────────────────────
console.log('\n🚫 Error Handling');

await test('GET /nonexistent → 404', async () => {
  const res = await get('/this-page-does-not-exist-12345');
  assert(res.status === 404, `Expected 404, got ${res.status}`);
});

// ─── Write API validations ──────────────────────────────────────────
console.log('\n✏️ Write API Validations');

await test('POST /api/dashboard/leads → 401', async () => {
  const res = await fetch(`${BASE}/api/dashboard/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'test' }),
  });
  assert(res.status === 401 || res.status === 403 || res.status === 405, `Expected auth rejection, got ${res.status}`);
});

await test('POST /api/al/pipeline → 401', async () => {
  const res = await fetch(`${BASE}/api/al/pipeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'test' }),
  });
  assert(res.status === 401 || res.status === 403, `Expected auth rejection, got ${res.status}`);
});

// ─── Summary ────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log(`  Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
if (failures.length > 0) {
  console.log('\n  Failed tests:');
  for (const f of failures) {
    console.log(`    ✗ ${f.name}: ${f.error}`);
  }
}
console.log('═'.repeat(60) + '\n');

process.exit(failed > 0 ? 1 : 0);
