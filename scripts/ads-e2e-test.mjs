#!/usr/bin/env node
/**
 * Ads E2E Test Suite for Aesthetic Lounge
 * Tests every ads-related API endpoint: optimizer, sync, performance,
 * learnings, config, flags, campaign creation, preflight, landing pages, chat.
 *
 * Usage:
 *   NEXTAUTH_SECRET=<secret> node scripts/ads-e2e-test.mjs [base-url]
 *
 * Default base URL: http://localhost:3000
 */

import crypto from 'crypto';

const BASE = process.argv[2] || 'http://localhost:3000';
const SECRET = process.env.NEXTAUTH_SECRET;
if (!SECRET) {
  console.error('ERROR: NEXTAUTH_SECRET env var is required to sign test session cookies.');
  process.exit(1);
}

let passed = 0;
let failed = 0;
let skipped = 0;
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

function skip(name, reason) {
  skipped++;
  console.log(`  ⊘ ${name} — SKIPPED: ${reason}`);
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

// ─── Session Cookie Signing ─────────────────────────────────────────
function signSession(payload) {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

const sessionPayload = {
  staffId: 'e2e-test-staff',
  email: 'e2e@aestheticlounge.test',
  name: 'E2E Test Admin',
  role: 'admin',
  phone: '+923001234567',
  exp: Date.now() + 24 * 60 * 60 * 1000, // 24h
};

const SESSION_COOKIE = signSession(sessionPayload);
const AUTH_COOKIE = `al_session=${SESSION_COOKIE}`;

function authHeaders(extra = {}) {
  return {
    Cookie: AUTH_COOKIE,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function authGet(path) {
  return fetch(`${BASE}${path}`, {
    redirect: 'manual',
    headers: { Cookie: AUTH_COOKIE },
  });
}

async function authPost(path, body = {}) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    redirect: 'manual',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
}

async function authPatch(path, body = {}) {
  return fetch(`${BASE}${path}`, {
    method: 'PATCH',
    redirect: 'manual',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
}

// ─── Track state across tests ───────────────────────────────────────
let createdLearningId = null;
let optimizerRunId = null;
let flagActionId = null;
let landingPageId = null;
let landingPageSlug = null;

console.log(`\n🎯 Ads E2E Test Suite — ${BASE}`);
console.log(`   Session: admin (${sessionPayload.email})\n`);

// ═════════════════════════════════════════════════════════════════════
// 1. AUTH PROTECTION (no cookie → 401)
// ═════════════════════════════════════════════════════════════════════
console.log('🔐 Auth Protection');

const protectedEndpoints = [
  { method: 'GET',  path: '/api/dashboard/ads/metrics' },
  { method: 'GET',  path: '/api/dashboard/ads/performance' },
  { method: 'GET',  path: '/api/dashboard/ads/learnings' },
  { method: 'POST', path: '/api/dashboard/ads/learnings' },
  { method: 'GET',  path: '/api/dashboard/ads/sync' },
  { method: 'POST', path: '/api/dashboard/ads/sync' },
  { method: 'POST', path: '/api/dashboard/ads/create' },
  { method: 'POST', path: '/api/dashboard/ads/preflight' },
  { method: 'GET',  path: '/api/dashboard/ads/landing-page' },
  { method: 'POST', path: '/api/dashboard/ads/landing-page' },
  { method: 'POST', path: '/api/dashboard/ads/pause' },
  { method: 'POST', path: '/api/dashboard/ads/activate' },
  { method: 'POST', path: '/api/dashboard/ads/auto-stop' },
  { method: 'GET',  path: '/api/ads/optimizer/config' },
  { method: 'PATCH',path: '/api/ads/optimizer/config' },
  { method: 'GET',  path: '/api/ads/optimizer/history' },
  { method: 'GET',  path: '/api/ads/optimizer/flags' },
  { method: 'PATCH',path: '/api/ads/optimizer/flags' },
  { method: 'POST', path: '/api/ads/optimizer/run' },
];

for (const ep of protectedEndpoints) {
  await test(`${ep.method} ${ep.path} → 401 without auth`, async () => {
    const res = await fetch(`${BASE}${ep.path}`, {
      method: ep.method,
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json' },
      body: ['POST', 'PATCH'].includes(ep.method) ? '{}' : undefined,
    });
    assert(
      res.status === 401 || res.status === 403,
      `Expected 401/403, got ${res.status}`,
    );
  });
}

await test('POST /api/al/ads/chat → 401 without auth', async () => {
  const res = await fetch(`${BASE}/api/al/ads/chat`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'test' }),
  });
  assert(res.status === 401, `Expected 401, got ${res.status}`);
});

// ═════════════════════════════════════════════════════════════════════
// 2. FORGED COOKIE → 401
// ═════════════════════════════════════════════════════════════════════
console.log('\n🔓 Forged Cookie Rejection');

await test('Forged plain JSON cookie → 401', async () => {
  const forged = Buffer.from(JSON.stringify(sessionPayload)).toString('base64url');
  const res = await fetch(`${BASE}/api/ads/optimizer/config`, {
    headers: { Cookie: `al_session=${forged}` },
    redirect: 'manual',
  });
  assert(res.status === 401 || res.status === 403, `Forged cookie accepted: ${res.status}`);
});

await test('Forged wrong-secret HMAC cookie → 401', async () => {
  const json = JSON.stringify(sessionPayload);
  const b64 = Buffer.from(json).toString('base64url');
  const sig = crypto.createHmac('sha256', 'wrong-secret').update(b64).digest('base64url');
  const res = await fetch(`${BASE}/api/ads/optimizer/config`, {
    headers: { Cookie: `al_session=${b64}.${sig}` },
    redirect: 'manual',
  });
  assert(res.status === 401 || res.status === 403, `Wrong-secret cookie accepted: ${res.status}`);
});

await test('Expired session cookie → 401', async () => {
  const expired = signSession({ ...sessionPayload, exp: Date.now() - 1000 });
  const res = await fetch(`${BASE}/api/ads/optimizer/config`, {
    headers: { Cookie: `al_session=${expired}` },
    redirect: 'manual',
  });
  assert(res.status === 401 || res.status === 403, `Expired cookie accepted: ${res.status}`);
});

// ═════════════════════════════════════════════════════════════════════
// 3. OPTIMIZER CONFIG
// ═════════════════════════════════════════════════════════════════════
console.log('\n⚙️  Optimizer Config');

await test('GET /api/ads/optimizer/config → returns config', async () => {
  const res = await authGet('/api/ads/optimizer/config');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const data = await res.json();
  assert(data.config, 'Missing config object');
  assert(data.config.target_cpl !== undefined, 'Missing target_cpl');
  assert(data.config.optimizer_enabled !== undefined, 'Missing optimizer_enabled');
});

await test('PATCH /api/ads/optimizer/config → update valid key', async () => {
  const res = await authPatch('/api/ads/optimizer/config', { target_cpl: '7' });
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const data = await res.json();
  assert(data.success, 'Expected success: true');
});

await test('PATCH /api/ads/optimizer/config → restore original', async () => {
  const res = await authPatch('/api/ads/optimizer/config', { target_cpl: '6' });
  assert(res.status === 200, `Expected 200, got ${res.status}`);
});

await test('PATCH /api/ads/optimizer/config → reject invalid key', async () => {
  const res = await authPatch('/api/ads/optimizer/config', { hacky_key: 'evil' });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

await test('PATCH /api/ads/optimizer/config → reject negative number', async () => {
  const res = await authPatch('/api/ads/optimizer/config', { target_cpl: '-5' });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

await test('PATCH /api/ads/optimizer/config → reject invalid boolean', async () => {
  const res = await authPatch('/api/ads/optimizer/config', { optimizer_enabled: 'yes' });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

// ═════════════════════════════════════════════════════════════════════
// 4. OPTIMIZER HISTORY
// ═════════════════════════════════════════════════════════════════════
console.log('\n📊 Optimizer History');

await test('GET /api/ads/optimizer/history → returns runs + actions', async () => {
  const res = await authGet('/api/ads/optimizer/history');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const data = await res.json();
  assert(Array.isArray(data.runs), 'Missing runs array');
  assert(Array.isArray(data.actions), 'Missing actions array');
});

// ═════════════════════════════════════════════════════════════════════
// 5. OPTIMIZER FLAGS
// ═════════════════════════════════════════════════════════════════════
console.log('\n🚩 Optimizer Flags');

await test('GET /api/ads/optimizer/flags → returns flags array', async () => {
  const res = await authGet('/api/ads/optimizer/flags');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const data = await res.json();
  assert(Array.isArray(data.flags), 'Missing flags array');
  if (data.flags.length > 0) {
    flagActionId = data.flags[0].id;
  }
});

if (flagActionId) {
  await test('PATCH /api/ads/optimizer/flags → dismiss flag', async () => {
    const res = await authPatch('/api/ads/optimizer/flags', {
      actionId: flagActionId,
      note: 'E2E test dismiss',
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });
} else {
  skip('PATCH /api/ads/optimizer/flags → dismiss', 'no active flags');
}

await test('PATCH /api/ads/optimizer/flags → missing actionId → 400', async () => {
  const res = await authPatch('/api/ads/optimizer/flags', {});
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

// ═════════════════════════════════════════════════════════════════════
// 6. OPTIMIZER RUN
// ═════════════════════════════════════════════════════════════════════
console.log('\n🤖 Optimizer Run');

await test('POST /api/ads/optimizer/run → manual trigger', async () => {
  const res = await authPost('/api/ads/optimizer/run?source=e2e-test');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const data = await res.json();
  assert(data.success, 'Expected success: true');
  assert(data.runId, 'Missing runId');
  assert(typeof data.adsEvaluated === 'number', 'Missing adsEvaluated');
  assert(typeof data.actionsExecuted === 'number', 'Missing actionsExecuted');
  assert(typeof data.actionsFlagged === 'number', 'Missing actionsFlagged');
  optimizerRunId = data.runId;
  console.log(`      → runId=${data.runId}, ads=${data.adsEvaluated}, actions=${data.actionsExecuted}, flags=${data.actionsFlagged}, syncError=${data.syncError || 'none'}`);
});

await test('GET /api/ads/optimizer/history → includes our run', async () => {
  const res = await authGet('/api/ads/optimizer/history');
  const data = await res.json();
  if (optimizerRunId) {
    const found = data.runs.find(r => r.id === optimizerRunId);
    assert(found, `Run ${optimizerRunId} not in history`);
    assert(found.triggerSource || found.trigger_source, 'Missing trigger_source');
  }
});

// ═════════════════════════════════════════════════════════════════════
// 7. SYNC
// ═════════════════════════════════════════════════════════════════════
console.log('\n🔄 Meta Sync');

await test('GET /api/dashboard/ads/sync → sync status', async () => {
  const res = await authGet('/api/dashboard/ads/sync');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const data = await res.json();
  assert(typeof data.campaigns === 'number', 'Missing campaigns count');
  assert(typeof data.adSets === 'number', 'Missing adSets count');
  assert(typeof data.ads === 'number', 'Missing ads count');
  console.log(`      → campaigns=${data.campaigns}, adSets=${data.adSets}, ads=${data.ads}`);
});

// POST sync triggers actual Meta API call — test it but don't fail on Meta errors
await test('POST /api/dashboard/ads/sync → triggers sync', async () => {
  const res = await authPost('/api/dashboard/ads/sync');
  // Could be 200 (success) or 500 (Meta API error) — both are valid responses
  assert(res.status === 200 || res.status === 500, `Unexpected status ${res.status}`);
  const data = await res.json();
  if (res.status === 200) {
    assert(typeof data.campaigns === 'number', 'Missing campaigns count');
    console.log(`      → synced: campaigns=${data.campaigns}, adSets=${data.adSets}, ads=${data.ads}`);
  } else {
    console.log(`      → sync error (expected if Meta creds missing): ${data.error}`);
  }
});

// ═════════════════════════════════════════════════════════════════════
// 8. PERFORMANCE
// ═════════════════════════════════════════════════════════════════════
console.log('\n📈 Performance');

await test('GET /api/dashboard/ads/performance → returns data', async () => {
  const res = await authGet('/api/dashboard/ads/performance');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const data = await res.json();
  assert(Array.isArray(data.daily), 'Missing daily array');
  assert(Array.isArray(data.summary), 'Missing summary array');
  assert(Array.isArray(data.autoStopCandidates), 'Missing autoStopCandidates');
  console.log(`      → daily rows=${data.daily.length}, summaries=${data.summary.length}, autoStop=${data.autoStopCandidates.length}`);
});

await test('GET /api/dashboard/ads/performance?days=7 → filtered', async () => {
  const res = await authGet('/api/dashboard/ads/performance?days=7');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const data = await res.json();
  assert(data.days === 7 || data.days === '7', `Expected days=7, got ${data.days}`);
});

// ═════════════════════════════════════════════════════════════════════
// 9. METRICS
// ═════════════════════════════════════════════════════════════════════
console.log('\n💰 Budget Metrics');

await test('GET /api/dashboard/ads/metrics → returns budget', async () => {
  const res = await authGet('/api/dashboard/ads/metrics');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const data = await res.json();
  assert(data.budget, 'Missing budget object');
  assert(typeof data.budget.spent === 'number', 'Missing budget.spent');
  assert(typeof data.budget.cap === 'number', 'Missing budget.cap');
  console.log(`      → spent=$${data.budget.spent}/$${data.budget.cap} monthly`);
});

// ═════════════════════════════════════════════════════════════════════
// 10. LEARNINGS
// ═════════════════════════════════════════════════════════════════════
console.log('\n📚 Learnings');

await test('GET /api/dashboard/ads/learnings → returns array', async () => {
  const res = await authGet('/api/dashboard/ads/learnings');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const data = await res.json();
  assert(Array.isArray(data.learnings), 'Missing learnings array');
});

await test('POST /api/dashboard/ads/learnings → create learning', async () => {
  const res = await authPost('/api/dashboard/ads/learnings', {
    campaign_name: 'E2E Test Campaign',
    category: 'targeting',
    learning: 'E2E test: DHA women 25-40 respond best to laser ads',
    impact: 'high',
  });
  assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
  const data = await res.json();
  assert(data.success || data.id, 'Missing success/id');
  createdLearningId = data.id;
  console.log(`      → created learning id=${createdLearningId}`);
});

await test('GET /api/dashboard/ads/learnings?category=targeting → filtered', async () => {
  const res = await authGet('/api/dashboard/ads/learnings?category=targeting');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const data = await res.json();
  assert(Array.isArray(data.learnings), 'Missing learnings array');
  if (createdLearningId) {
    const found = data.learnings.find(l => l.id === createdLearningId);
    assert(found, 'Created learning not found in filtered results');
  }
});

await test('POST /api/dashboard/ads/learnings → missing category → 400', async () => {
  const res = await authPost('/api/dashboard/ads/learnings', {
    learning: 'No category',
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

// ═════════════════════════════════════════════════════════════════════
// 11. PREFLIGHT
// ═════════════════════════════════════════════════════════════════════
console.log('\n✅ Preflight');

await test('POST /api/dashboard/ads/preflight → within budget', async () => {
  const res = await authPost('/api/dashboard/ads/preflight', {
    dailyBudgetCents: 300,
    campaignName: 'E2E Preflight Test',
  });
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const data = await res.json();
  assert(typeof data.ok === 'boolean', 'Missing ok boolean');
  assert(typeof data.currentDailySpendCents === 'number', 'Missing currentDailySpendCents');
  console.log(`      → ok=${data.ok}, headroom=${data.headroomCents}¢, warnings=${data.warnings?.length || 0}`);
});

await test('POST /api/dashboard/ads/preflight → over daily cap', async () => {
  const res = await authPost('/api/dashboard/ads/preflight', {
    dailyBudgetCents: 5000, // $50, way over $10 cap
  });
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const data = await res.json();
  assert(data.ok === false || (data.errors && data.errors.length > 0) || (data.warnings && data.warnings.length > 0),
    'Should have errors or warnings for over-budget');
});

// ═════════════════════════════════════════════════════════════════════
// 12. AD ACTIONS (pause/activate/auto-stop)
// ═════════════════════════════════════════════════════════════════════
console.log('\n⏸️  Ad Actions');

await test('POST /api/dashboard/ads/pause → missing metaId → 400', async () => {
  const res = await authPost('/api/dashboard/ads/pause', {});
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

await test('POST /api/dashboard/ads/activate → missing metaId → 400', async () => {
  const res = await authPost('/api/dashboard/ads/activate', {});
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

await test('POST /api/dashboard/ads/auto-stop → returns result', async () => {
  const res = await authPost('/api/dashboard/ads/auto-stop');
  // 200 = success, 500 = Meta API error (no creds)
  assert(res.status === 200 || res.status === 500, `Expected 200/500, got ${res.status}`);
  if (res.status === 200) {
    const data = await res.json();
    assert(typeof data.candidates === 'number' || Array.isArray(data.candidates),
      'Missing candidates');
    console.log(`      → candidates=${data.candidates}, paused=${data.paused || 0}`);
  }
});

// ═════════════════════════════════════════════════════════════════════
// 13. CAMPAIGN CREATION (validation only — don't create real Meta ads)
// ═════════════════════════════════════════════════════════════════════
console.log('\n🏗️  Campaign Creation (validation)');

await test('POST /api/dashboard/ads/create → missing type → 400', async () => {
  const res = await authPost('/api/dashboard/ads/create', {});
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

await test('POST /api/dashboard/ads/create → campaign missing name → 400', async () => {
  const res = await authPost('/api/dashboard/ads/create', {
    type: 'campaign',
    dailyBudget: 3,
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

await test('POST /api/dashboard/ads/create → ad missing fields → 400', async () => {
  const res = await authPost('/api/dashboard/ads/create', {
    type: 'ad',
    name: 'Test Ad',
    // missing: adSetId, headline, body, imageUrl
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

// ═════════════════════════════════════════════════════════════════════
// 14. LANDING PAGES
// ═════════════════════════════════════════════════════════════════════
console.log('\n🌐 Landing Pages');

await test('GET /api/dashboard/ads/landing-page → list', async () => {
  const res = await authGet('/api/dashboard/ads/landing-page');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const data = await res.json();
  assert(data.landingPages !== undefined || data.landingPage !== undefined, 'Missing response data');
  if (Array.isArray(data.landingPages)) {
    console.log(`      → ${data.landingPages.length} landing pages`);
    if (data.landingPages.length > 0) {
      landingPageId = data.landingPages[0].id;
      landingPageSlug = data.landingPages[0].slug;
    }
  }
});

// POST creates via AI — skip to avoid cost, but test validation
await test('POST /api/dashboard/ads/landing-page → missing treatment → 400', async () => {
  const res = await authPost('/api/dashboard/ads/landing-page', {});
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

if (landingPageId) {
  await test('PATCH /api/dashboard/ads/landing-page → update LP', async () => {
    const res = await authPatch('/api/dashboard/ads/landing-page', {
      id: landingPageId,
      cta_text: 'Book Now - E2E Test',
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // Restore
  await test('PATCH /api/dashboard/ads/landing-page → restore CTA', async () => {
    const res = await authPatch('/api/dashboard/ads/landing-page', {
      id: landingPageId,
      cta_text: 'Book Free Consultation',
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });
} else {
  skip('PATCH /api/dashboard/ads/landing-page', 'no existing landing pages');
}

if (landingPageSlug) {
  await test(`GET /lp/${landingPageSlug} → public LP page`, async () => {
    const res = await fetch(`${BASE}/lp/${landingPageSlug}`, { redirect: 'manual' });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const html = await res.text();
    assert(html.includes('</html>') || html.includes('</body>'), 'No HTML body');
  });
}

// ═════════════════════════════════════════════════════════════════════
// 15. CAMPAIGN CHAT (SSE)
// ═════════════════════════════════════════════════════════════════════
console.log('\n💬 Campaign Chat (SSE)');

await test('POST /api/al/ads/chat → SSE stream', async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000); // 60s max

  const res = await fetch(`${BASE}/api/al/ads/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      message: 'What treatments should I promote this month?',
      campaignState: { stage: 'researching' },
    }),
    signal: controller.signal,
  });

  clearTimeout(timeout);
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(
    res.headers.get('content-type')?.includes('text/event-stream') ||
    res.headers.get('content-type')?.includes('text/plain'),
    `Expected SSE content-type, got ${res.headers.get('content-type')}`,
  );

  // Read stream until we get a result or timeout
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let gotResult = false;
  let gotPing = false;

  const readTimeout = setTimeout(() => {
    reader.cancel();
  }, 55_000);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value, { stream: true });

      if (fullText.includes('"type":"ping"') || fullText.includes('"type": "ping"')) {
        gotPing = true;
      }
      if (fullText.includes('"type":"result"') || fullText.includes('"type": "result"')) {
        gotResult = true;
        break;
      }
    }
  } catch (e) {
    // AbortError from timeout is ok
    if (e.name !== 'AbortError') throw e;
  } finally {
    clearTimeout(readTimeout);
    try { reader.cancel(); } catch {}
  }

  // We should have gotten at least some data
  assert(fullText.length > 0, 'Empty SSE response');
  console.log(`      → stream received: ${fullText.length} bytes, ping=${gotPing}, result=${gotResult}`);
});

// ═════════════════════════════════════════════════════════════════════
// 16. DASHBOARD PAGE
// ═════════════════════════════════════════════════════════════════════
console.log('\n📄 Dashboard Ads Page');

await test('GET /dashboard/ads → loads with auth', async () => {
  const res = await fetch(`${BASE}/dashboard/ads`, {
    headers: { Cookie: AUTH_COOKIE },
    redirect: 'manual',
  });
  // 200 = page loaded, 302/307 = redirect (middleware may redirect)
  assert(
    res.status === 200 || res.status === 302 || res.status === 307,
    `Expected 200/302/307, got ${res.status}`,
  );
  if (res.status === 200) {
    const html = await res.text();
    assert(html.includes('ads') || html.includes('Ads') || html.includes('campaign') || html.includes('Campaign'),
      'Ads page missing expected content');
  }
});

// ═════════════════════════════════════════════════════════════════════
// 17. CLEANUP
// ═════════════════════════════════════════════════════════════════════
console.log('\n🧹 Cleanup');

// Clean up test learning
if (createdLearningId) {
  skip('Delete test learning', 'no DELETE endpoint — manual cleanup needed');
}

// ═════════════════════════════════════════════════════════════════════
// SUMMARY
// ═════════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(60));
console.log(`  Results: ${passed} passed, ${failed} failed, ${skipped} skipped (${passed + failed + skipped} total)`);
if (failures.length > 0) {
  console.log('\n  Failed tests:');
  for (const f of failures) {
    console.log(`    ✗ ${f.name}: ${f.error}`);
  }
}
console.log('═'.repeat(60) + '\n');

process.exit(failed > 0 ? 1 : 0);
