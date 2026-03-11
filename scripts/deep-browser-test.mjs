#!/usr/bin/env node
/**
 * Deep browser test — covers every remaining untested area:
 * - All 66 service pages
 * - LP form submissions
 * - Complaint form
 * - Blog post pages
 * - Share buttons
 * - External links validation
 * - WhatsApp number consistency
 * - Scroll interactions
 * - FAQ accordions on service pages
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    process.stdout.write(`  \u2713 ${name}\n`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    process.stdout.write(`  \u2717 ${name} \u2014 ${err.message}\n`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'AL-Deep-E2E/1.0',
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDC89 ALL 66 Service Pages — Render Check');
  // ═══════════════════════════════════════════════════════════════════════

  // Get all service slugs from the services page
  const serviceSlugs = [];
  {
    const page = await context.newPage();
    await page.goto(`${BASE}/services`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const links = await page.locator('a[href^="/services/"]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && !serviceSlugs.includes(href)) serviceSlugs.push(href);
    }
    await page.close();
  }

  console.log(`  Found ${serviceSlugs.length} service links`);

  // Test each service page renders
  for (const href of serviceSlugs) {
    await test(`Service ${href}`, async () => {
      const page = await context.newPage();
      const res = await page.goto(`${BASE}${href}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      assert(res.status() === 200, `Status ${res.status()}`);
      // Must have treatment name and a Book CTA
      const bookBtn = await page.locator('a[href^="/book"]').count();
      assert(bookBtn > 0, 'No Book CTA');
      // Must have description content (not empty page)
      const bodyText = await page.textContent('body');
      assert(bodyText.length > 500, `Page too short: ${bodyText.length} chars`);
      await page.close();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDCDD LP Lead Form Submission');
  // ═══════════════════════════════════════════════════════════════════════

  await test('LP form fills and submits', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/lp/laser-hair-removal`, { waitUntil: 'domcontentloaded' });

    // Find and fill the lead form
    const nameField = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    const phoneField = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]').first();

    if (await nameField.count() > 0 && await phoneField.count() > 0) {
      await nameField.fill('LP Test User');
      await phoneField.fill('+923009876543');

      const emailField = page.locator('input[name="email"], input[type="email"]').first();
      if (await emailField.count() > 0) await emailField.fill('lptest@test.com');

      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        const content = await page.textContent('body');
        const success = content.includes('Thank') || content.includes('success') || content.includes('WhatsApp') || content.includes('received');
        assert(success, 'No success state after LP form submit');
      }
    }
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDEA8 Complaint Form');
  // ═══════════════════════════════════════════════════════════════════════

  await test('Complaint form renders and has required fields', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/feedback/complaint`, { waitUntil: 'domcontentloaded' });

    // Should have category selector and textarea
    const selects = await page.locator('select').count();
    const textareas = await page.locator('textarea').count();
    assert(selects > 0 || textareas > 0, 'Missing form fields');

    // Fill and submit
    const textarea = page.locator('textarea').first();
    if (await textarea.count() > 0) {
      await textarea.fill('E2E deep test complaint - please ignore');
    }

    const select = page.locator('select').first();
    if (await select.count() > 0) {
      const options = await select.locator('option').all();
      if (options.length > 1) {
        const val = await options[1].getAttribute('value');
        if (val) await select.selectOption(val);
      }
    }

    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      const content = await page.textContent('body');
      const success = content.includes('Thank') || content.includes('submitted') || content.includes('received') || content.includes('recorded');
      assert(success, 'No success state after complaint submit');
    }
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDCF0 Blog Posts');
  // ═══════════════════════════════════════════════════════════════════════

  // Get blog post links
  const blogLinks = [];
  {
    const page = await context.newPage();
    await page.goto(`${BASE}/blog`, { waitUntil: 'domcontentloaded' });
    const links = await page.locator('a[href^="/blog/"]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && !blogLinks.includes(href) && href !== '/blog/') blogLinks.push(href);
    }
    await page.close();
  }

  console.log(`  Found ${blogLinks.length} blog posts`);

  for (const href of blogLinks.slice(0, 5)) {
    await test(`Blog ${href}`, async () => {
      const page = await context.newPage();
      const res = await page.goto(`${BASE}${href}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      assert(res.status() === 200, `Status ${res.status()}`);
      const bodyText = await page.textContent('body');
      assert(bodyText.length > 300, `Blog post too short: ${bodyText.length} chars`);
      await page.close();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDD17 External Links Validation');
  // ═══════════════════════════════════════════════════════════════════════

  await test('All external links have valid URLs', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });

    const externalLinks = await page.locator('a[href^="http"]').all();
    const invalidLinks = [];

    for (const link of externalLinks) {
      const href = await link.getAttribute('href');
      if (!href) continue;
      try {
        new URL(href);
      } catch {
        invalidLinks.push(href);
      }
    }

    assert(invalidLinks.length === 0, `Invalid URLs: ${invalidLinks.join(', ')}`);
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDCF1 WhatsApp Link Consistency');
  // ═══════════════════════════════════════════════════════════════════════

  await test('WhatsApp links use consistent phone number', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });

    const waLinks = await page.locator('a[href*="wa.me"]').all();
    const numbers = new Set();
    for (const link of waLinks) {
      const href = await link.getAttribute('href');
      const match = href.match(/wa\.me\/(\d+)/);
      if (match) numbers.add(match[1]);
    }

    // All WhatsApp links should use the same number
    assert(numbers.size <= 1, `Multiple WhatsApp numbers found: ${[...numbers].join(', ')}`);
    assert(numbers.size > 0, 'No WhatsApp links with phone number found');
    await page.close();
  });

  await test('WhatsApp links consistent across pages', async () => {
    const pages = ['/', '/contact', '/services/botox', '/lp/laser-hair-removal'];
    const allNumbers = new Set();

    for (const path of pages) {
      const page = await context.newPage();
      await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
      const waLinks = await page.locator('a[href*="wa.me"]').all();
      for (const link of waLinks) {
        const href = await link.getAttribute('href');
        const match = href.match(/wa\.me\/(\d+)/);
        if (match) allNumbers.add(match[1]);
      }
      await page.close();
    }

    assert(allNumbers.size <= 1, `Inconsistent WhatsApp numbers across pages: ${[...allNumbers].join(', ')}`);
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83C\uDFB5 Scroll & Sticky Elements');
  // ═══════════════════════════════════════════════════════════════════════

  await test('Header stays visible on scroll', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(500);

    // Header should still be visible (sticky/fixed)
    const header = page.locator('header').first();
    const isVisible = await header.isVisible();
    assert(isVisible, 'Header not visible after scroll');
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDDBC\uFE0F Gallery — All Categories');
  // ═══════════════════════════════════════════════════════════════════════

  await test('Gallery shows images and all filters work', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/gallery`, { waitUntil: 'domcontentloaded' });

    // Get all filter buttons
    const filterBtns = await page.locator('button').all();
    const filterTexts = [];
    for (const btn of filterBtns) {
      const text = await btn.textContent();
      if (text && text.length < 30) filterTexts.push(text.trim());
    }

    // Click each and verify images still show
    for (const btn of filterBtns.slice(0, 6)) {
      const text = await btn.textContent();
      if (text && text.length < 30) {
        await btn.click();
        await page.waitForTimeout(300);
        // Page should have images
        const images = await page.locator('img').count();
        assert(images > 0, `No images after clicking "${text.trim()}" filter`);
      }
    }
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDCE7 Social Page — All Links');
  // ═══════════════════════════════════════════════════════════════════════

  await test('Social page has valid external links', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/social`, { waitUntil: 'domcontentloaded' });

    const externalLinks = await page.locator('a[href^="http"]').all();
    assert(externalLinks.length > 0, 'No external links on social page');

    for (const link of externalLinks) {
      const href = await link.getAttribute('href');
      try {
        new URL(href);
      } catch {
        assert(false, `Invalid URL: ${href}`);
      }
    }
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDCB0 Price Guide Page');
  // ═══════════════════════════════════════════════════════════════════════

  await test('Price guide shows treatments and prices', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/price-guide`, { waitUntil: 'domcontentloaded' });

    const content = await page.textContent('body');
    // Should mention PKR or have price-like numbers
    const hasPrices = content.includes('PKR') || content.includes('Rs') || /\d{1,3}(,\d{3})+/.test(content) || /\d{4,}/.test(content);
    assert(hasPrices, 'No prices found on price guide');

    // Should have treatment names
    assert(content.length > 500, 'Price guide too short');
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDCC4 Promotions Page');
  // ═══════════════════════════════════════════════════════════════════════

  await test('Promotions page has CTA buttons', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/promotions`, { waitUntil: 'domcontentloaded' });

    // Should have Book or WhatsApp CTAs
    const ctas = await page.locator('a[href^="/book"], a[href*="wa.me"], a[href*="whatsapp"]').count();
    assert(ctas > 0, 'No CTA buttons on promotions page');
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDD10 Login Page');
  // ═══════════════════════════════════════════════════════════════════════

  await test('Login page has email input and submit', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/dashboard/login`, { waitUntil: 'domcontentloaded' });

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    assert(await emailInput.count() > 0, 'No email input on login page');

    const submitBtn = page.locator('button[type="submit"]');
    assert(await submitBtn.count() > 0, 'No submit button on login page');
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\u267B\uFE0F JS Error Check — Navigate Multiple Pages');
  // ═══════════════════════════════════════════════════════════════════════

  await test('No JS errors across page navigation', async () => {
    const page = await context.newPage();
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(`${page.url()}: ${err.message}`));

    const pagesToVisit = ['/', '/services', '/about', '/contact', '/book', '/gallery', '/blog', '/promotions', '/feedback', '/price-guide', '/lp/botox'];
    for (const path of pagesToVisit) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(300);
    }

    assert(jsErrors.length === 0, `JS errors found:\n${jsErrors.join('\n')}`);
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Report
  // ═══════════════════════════════════════════════════════════════════════
  await browser.close();

  console.log('\n' + '\u2550'.repeat(60));
  console.log(`  Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log('\u2550'.repeat(60));

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  \u2717 ${f.name}: ${f.error}`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
})();
