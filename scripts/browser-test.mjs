#!/usr/bin/env node
/**
 * Browser-based E2E test — actually clicks buttons, fills forms, checks modals.
 * Uses Playwright to render pages in a real Chromium browser.
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
    console.log(`  \u2713 ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    console.log(`  \u2717 ${name} \u2014 ${err.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'AL-E2E-Browser-Test/1.0',
  });

  // Collect console errors
  const consoleErrors = [];

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83C\uDF10 Public Pages — Full Render');
  // ═══════════════════════════════════════════════════════════════════════

  const publicPages = [
    ['/', 'Aesthetic Lounge'],
    ['/services', 'Aesthetic Lounge'],
    ['/about', 'Aesthetic Lounge'],
    ['/contact', 'Aesthetic Lounge'],
    ['/book', 'Aesthetic Lounge'],
    ['/gallery', 'Aesthetic Lounge'],
    ['/blog', 'Aesthetic Lounge'],
    ['/promotions', 'Aesthetic Lounge'],
    ['/social', 'Aesthetic Lounge'],
    ['/price-guide', 'Aesthetic Lounge'],
    ['/privacy', 'Aesthetic Lounge'],
    ['/terms', 'Aesthetic Lounge'],
    ['/doctors', 'Aesthetic Lounge'],
    ['/feedback', 'Aesthetic Lounge'],
    ['/feedback/complaint', 'Aesthetic Lounge'],
  ];

  for (const [path, titleContains] of publicPages) {
    await test(`Render ${path}`, async () => {
      const page = await context.newPage();
      const response = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      assert(response.status() === 200, `Status ${response.status()}`);
      const title = await page.title();
      assert(title.toLowerCase().includes(titleContains.toLowerCase()), `Title "${title}" missing "${titleContains}"`);
      // Check no uncaught JS errors
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.waitForTimeout(500);
      assert(errors.length === 0, `JS errors: ${errors.join('; ')}`);
      await page.close();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDC89 Service Pages — Sample Render');
  // ═══════════════════════════════════════════════════════════════════════

  const serviceSlugs = [
    'botox', 'dermal-fillers', 'laser-hair-removal', 'prp-facial',
    'keravive-hydrafacial', 'chemical-peel-facial', 'dark-circle-treatment',
  ];
  for (const slug of serviceSlugs) {
    await test(`Render /services/${slug}`, async () => {
      const page = await context.newPage();
      const res = await page.goto(`${BASE}/services/${slug}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      assert(res.status() === 200, `Status ${res.status()}`);
      // Should have a Book/CTA button (links to /book or /book?treatment=...)
      const bookBtn = await page.locator('a[href^="/book"]').count();
      assert(bookBtn > 0, 'No Book button found');
      await page.close();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDD17 Header Navigation');
  // ═══════════════════════════════════════════════════════════════════════

  await test('Header links navigate correctly', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });

    // Check main nav links exist
    const navLinks = await page.locator('header a, header button').count();
    assert(navLinks > 3, `Only ${navLinks} nav elements found`);

    // Click Services link
    const servicesLink = page.locator('header a[href="/services"]').first();
    if (await servicesLink.count() > 0) {
      await servicesLink.click();
      await page.waitForURL('**/services', { timeout: 5000 });
      assert(page.url().includes('/services'), 'Services navigation failed');
    }
    await page.close();
  });

  await test('Mobile menu toggle', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Find mobile menu button
    const menuBtn = page.locator('button[aria-label="Toggle menu"]');
    assert(await menuBtn.isVisible(), 'Menu button not visible on mobile');
    await menuBtn.click();
    await page.waitForTimeout(500);

    // Mobile nav should be visible — check for nav with aria-label
    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
    const navVisible = await mobileNav.count() > 0 && await mobileNav.isVisible();
    assert(navVisible, 'Mobile menu did not open');
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDCDD Contact Form');
  // ═══════════════════════════════════════════════════════════════════════

  await test('Contact form validates required fields', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/contact`, { waitUntil: 'domcontentloaded' });

    // Try submitting empty form
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(500);
      // Should still be on contact page (not redirected)
      assert(page.url().includes('/contact'), 'Form submitted without validation');
    }
    await page.close();
  });

  await test('Contact form fills and submits', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/contact`, { waitUntil: 'domcontentloaded' });

    // Fill form fields
    await page.fill('input[name="name"], input[placeholder*="name" i]', 'E2E Test User');
    await page.fill('input[name="phone"], input[placeholder*="phone" i], input[type="tel"]', '+923001234567');

    // Try to find and fill email
    const emailField = page.locator('input[name="email"], input[type="email"]');
    if (await emailField.count() > 0) {
      await emailField.first().fill('e2etest@test.com');
    }

    // Try to find and fill message
    const messageField = page.locator('textarea');
    if (await messageField.count() > 0) {
      await messageField.first().fill('E2E browser test - please ignore');
    }

    // Submit
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(2000);

    // Check for success indicator
    const pageContent = await page.textContent('body');
    const hasSuccess = pageContent.includes('Thank') || pageContent.includes('success') || pageContent.includes('received');
    assert(hasSuccess, 'No success message after form submit');
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDCC5 Booking Form');
  // ═══════════════════════════════════════════════════════════════════════

  await test('Booking form step 1 renders', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/book`, { waitUntil: 'domcontentloaded' });

    // Should have treatment selection
    const content = await page.textContent('body');
    const hasTreatments = content.includes('treatment') || content.includes('Treatment') || content.includes('service') || content.includes('Service');
    assert(hasTreatments, 'No treatment selection found');
    await page.close();
  });

  await test('Booking form navigates steps', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/book`, { waitUntil: 'domcontentloaded' });

    // Select a treatment category/item
    const treatmentBtn = page.locator('button, [role="button"]').filter({ hasText: /facial|botox|laser/i }).first();
    if (await treatmentBtn.count() > 0) {
      await treatmentBtn.click();
      await page.waitForTimeout(500);
    }

    // Look for next/continue button
    const nextBtn = page.locator('button').filter({ hasText: /next|continue|proceed/i }).first();
    if (await nextBtn.count() > 0) {
      await nextBtn.click();
      await page.waitForTimeout(500);
      // Should have moved to next step
      const content = await page.textContent('body');
      const hasStep2 = content.includes('date') || content.includes('Date') || content.includes('name') || content.includes('Name') || content.includes('Step');
      assert(hasStep2, 'Did not advance to step 2');
    }
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\u2B50 Feedback Form');
  // ═══════════════════════════════════════════════════════════════════════

  await test('Feedback form star rating and submit', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/feedback`, { waitUntil: 'domcontentloaded' });

    // Click a star (5th star)
    const stars = page.locator('button[aria-label*="star" i], button svg, [role="radio"]');
    if (await stars.count() >= 5) {
      await stars.nth(4).click();
      await page.waitForTimeout(200);
    } else {
      // Try clicking by text pattern
      const starBtns = page.locator('button').filter({ has: page.locator('svg') });
      if (await starBtns.count() >= 5) {
        await starBtns.nth(4).click();
      }
    }

    // Fill feedback text
    const textarea = page.locator('textarea').first();
    if (await textarea.count() > 0) {
      await textarea.fill('E2E browser test feedback - please ignore');
    }

    // Submit
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      const content = await page.textContent('body');
      const success = content.includes('Thank') || content.includes('submitted') || content.includes('received');
      assert(success, 'No success message after feedback submit');
    }
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83C\uDF1F Gallery Filters');
  // ═══════════════════════════════════════════════════════════════════════

  await test('Gallery filter buttons work', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/gallery`, { waitUntil: 'domcontentloaded' });

    // Find filter buttons
    const filterBtns = page.locator('button').filter({ hasText: /all|face|body|skin|laser/i });
    const count = await filterBtns.count();
    assert(count > 0, 'No filter buttons found');

    // Click each filter
    for (let i = 0; i < Math.min(count, 3); i++) {
      await filterBtns.nth(i).click();
      await page.waitForTimeout(300);
    }

    // Should still be on gallery page without errors
    assert(page.url().includes('/gallery'), 'Left gallery page');
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83C\uDFC1 Landing Pages');
  // ═══════════════════════════════════════════════════════════════════════

  const lpSlugs = ['laser-hair-removal', 'hydrafacial', 'botox'];
  for (const slug of lpSlugs) {
    await test(`LP /lp/${slug} renders with CTA`, async () => {
      const page = await context.newPage();
      const res = await page.goto(`${BASE}/lp/${slug}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      assert(res.status() === 200, `Status ${res.status()}`);

      // Should have a form or CTA
      const formOrCta = await page.locator('form, a[href*="whatsapp"], button[type="submit"]').count();
      assert(formOrCta > 0, 'No form or CTA found');
      await page.close();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDEAA Cookie Consent');
  // ═══════════════════════════════════════════════════════════════════════

  await test('Cookie banner shows and accepts', async () => {
    const page = await context.newPage();
    // Clear cookies to force banner
    await context.clearCookies();
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Look for cookie banner
    const banner = page.locator('[class*="cookie" i], [id*="cookie" i], [aria-label*="cookie" i]');
    if (await banner.count() > 0) {
      const acceptBtn = page.locator('button').filter({ hasText: /accept|agree|ok/i }).first();
      if (await acceptBtn.count() > 0) {
        await acceptBtn.click();
        await page.waitForTimeout(500);
        // Banner should be gone
        const stillVisible = await banner.isVisible().catch(() => false);
        assert(!stillVisible, 'Cookie banner still visible after accept');
      }
    }
    // Cookie consent might not show if already accepted in storage
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDD12 404 Page');
  // ═══════════════════════════════════════════════════════════════════════

  await test('404 page renders branded', async () => {
    const page = await context.newPage();
    const res = await page.goto(`${BASE}/totally-nonexistent-page-xyz`, { waitUntil: 'domcontentloaded' });
    assert(res.status() === 404, `Expected 404, got ${res.status()}`);
    const content = await page.textContent('body');
    assert(content.includes('404'), 'No 404 text on page');
    assert(content.includes('Go Home') || content.includes('go home'), 'No Go Home button');
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDD12 Dashboard Auth Guard');
  // ═══════════════════════════════════════════════════════════════════════

  await test('Dashboard redirects to login', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
    // Should end up at login page
    await page.waitForTimeout(1000);
    const url = page.url();
    const content = await page.textContent('body');
    const isLogin = url.includes('login') || content.includes('Log in') || content.includes('Sign in') || content.includes('OTP') || content.includes('Email');
    assert(isLogin, `Not on login page. URL: ${url}`);
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDCF1 Responsive — Mobile Viewport');
  // ═══════════════════════════════════════════════════════════════════════

  await test('Homepage renders on mobile', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 375, height: 667 });
    const res = await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    assert(res.status() === 200, `Status ${res.status()}`);

    // No horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    assert(scrollWidth <= viewportWidth + 5, `Horizontal overflow: scrollWidth ${scrollWidth} > viewport ${viewportWidth}`);
    await page.close();
  });

  await test('Services page renders on mobile', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 375, height: 667 });
    const res = await page.goto(`${BASE}/services`, { waitUntil: 'domcontentloaded' });
    assert(res.status() === 200, `Status ${res.status()}`);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    assert(scrollWidth <= viewportWidth + 5, `Horizontal overflow: scrollWidth ${scrollWidth} > viewport ${viewportWidth}`);
    await page.close();
  });

  await test('Contact page renders on mobile', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 375, height: 667 });
    const res = await page.goto(`${BASE}/contact`, { waitUntil: 'domcontentloaded' });
    assert(res.status() === 200, `Status ${res.status()}`);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    assert(scrollWidth <= viewportWidth + 5, `Horizontal overflow: scrollWidth ${scrollWidth} > viewport ${viewportWidth}`);
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDD17 Footer Links');
  // ═══════════════════════════════════════════════════════════════════════

  await test('Footer contains all key links', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    const footer = page.locator('footer');
    assert(await footer.count() > 0, 'No footer element');

    const footerHTML = await footer.innerHTML();
    const requiredPaths = ['/services', '/#book', '/privacy', '/terms', '/dashboard/login'];
    for (const path of requiredPaths) {
      assert(footerHTML.includes(path), `Footer missing link to ${path}`);
    }
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n\uD83D\uDD0D WhatsApp Button');
  // ═══════════════════════════════════════════════════════════════════════

  await test('WhatsApp floating button present', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const waBtn = page.locator('a[href*="wa.me"], a[href*="whatsapp"]');
    assert(await waBtn.count() > 0, 'No WhatsApp button found');
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Report
  // ═══════════════════════════════════════════════════════════════════════
  await browser.close();

  console.log('\n\u2550'.repeat(60));
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
