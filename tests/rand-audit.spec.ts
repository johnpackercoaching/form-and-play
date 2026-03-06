import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5175';

test.describe('Paul Rand Design Audit', () => {
  test('page loads with no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Page loads
    await expect(page).toHaveTitle(/Form.*Play/i);

    // Filter out Firebase/network errors (not our code)
    const appErrors = errors.filter(
      (e) => !e.includes('firebase') && !e.includes('Firebase') && !e.includes('ERR_BLOCKED')
    );
    expect(appErrors).toHaveLength(0);
  });

  test('navigation renders correctly', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    const nav = page.locator('.gallery-nav');
    await expect(nav).toBeVisible();

    const brand = nav.locator('.nav-brand');
    await expect(brand).toBeVisible();

    const mark = nav.locator('.nav-mark');
    await expect(mark).toBeVisible();

    const title = nav.locator('.nav-title');
    await expect(title).toHaveText('Form & Play');
  });

  test('hero composition renders with geometric shapes', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    const hero = page.locator('.hero-composition');
    await expect(hero).toBeVisible();

    // Three shapes
    await expect(page.locator('.hero-shape--circle')).toBeVisible();
    await expect(page.locator('.hero-shape--square')).toBeVisible();
    await expect(page.locator('.hero-shape--triangle')).toBeVisible();

    // Hero text
    const heroTitle = page.locator('.hero-title');
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toHaveText('Form & Play');

    const heroSubtitle = page.locator('.hero-subtitle');
    await expect(heroSubtitle).toBeVisible();
  });

  test('color palette is correct -- 4 colors only', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Verify the nav mark is amber
    const markBg = await page.locator('.nav-mark').evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    // rgb(240, 160, 0) = #f0a000
    expect(markBg).toBe('rgb(240, 160, 0)');

    // Verify hero title is white
    const titleColor = await page.locator('.hero-title').evaluate((el) =>
      getComputedStyle(el).color
    );
    expect(titleColor).toBe('rgb(255, 255, 255)');

    // Verify subtitle is amber
    const subtitleColor = await page.locator('.hero-subtitle').evaluate((el) =>
      getComputedStyle(el).color
    );
    expect(subtitleColor).toBe('rgb(240, 160, 0)');
  });

  test('typography system is correct', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Hero title should be weight 900
    const titleWeight = await page.locator('.hero-title').evaluate((el) =>
      getComputedStyle(el).fontWeight
    );
    expect(titleWeight).toBe('900');

    // Hero title should be uppercase
    const titleTransform = await page.locator('.hero-title').evaluate((el) =>
      getComputedStyle(el).textTransform
    );
    expect(titleTransform).toBe('uppercase');

    // Subtitle should be monospace
    const subtitleFont = await page.locator('.hero-subtitle').evaluate((el) =>
      getComputedStyle(el).fontFamily
    );
    expect(subtitleFont).toContain('JetBrains Mono');
  });

  test('visual hierarchy -- hero dominates viewport', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    const heroBox = await page.locator('.hero-composition').boundingBox();
    expect(heroBox).not.toBeNull();
    // Hero should fill at least the full viewport height
    expect(heroBox!.height).toBeGreaterThanOrEqual(700);
  });

  test('accessibility -- focus styles and ARIA', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Nav brand has aria-label
    const brandLabel = await page.locator('.nav-brand').getAttribute('aria-label');
    expect(brandLabel).toBeTruthy();

    // Shapes are aria-hidden
    const shapesHidden = await page.locator('.hero-shapes').getAttribute('aria-hidden');
    expect(shapesHidden).toBe('true');

    // Tab to nav brand and check focus visibility
    await page.keyboard.press('Tab');
    const focusedEl = page.locator(':focus-visible');
    await expect(focusedEl).toBeVisible();
  });

  test('wit -- ampersand connects form to play in amber', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    const amp = page.locator('.hero-amp');
    await expect(amp).toBeVisible();
    await expect(amp).toHaveText('&');

    const ampColor = await amp.evaluate((el) => getComputedStyle(el).color);
    // Amber: rgb(240, 160, 0)
    expect(ampColor).toBe('rgb(240, 160, 0)');
  });

  test('honesty -- no fabricated claims', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Nav count should say "0 games" honestly, not "generating"
    const navCount = page.locator('.nav-count');
    await expect(navCount).toHaveText('0 games');

    // No fabricated tagline about game frequency
    const pageText = await page.locator('body').textContent();
    expect(pageText).not.toContain('every hour');
    expect(pageText).not.toContain('Every Hour');

    // No purposeless divider element
    const divider = page.locator('.hero-divider');
    await expect(divider).toHaveCount(0);
  });

  test('screenshot -- full page capture', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    // Wait for animations to settle
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: '/Users/johnye/form-and-play/tests/screenshots/homepage.png',
      fullPage: true,
    });
  });
});
