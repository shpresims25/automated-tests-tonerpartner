import { test, expect, shopConfig } from '../../src/fixtures';

const pages = shopConfig.importantLinks.filter((l) => !/\.(xml|txt)$/.test(l) && !l.startsWith('/checkout'));
const limit = shopConfig.testData.layoutPageChecks ?? pages.length;

test.describe('Shop pages render the shop layout', () => {
  for (const path of pages.slice(0, limit)) {
    test(`page ${path} renders with title, header and footer`, async ({ page, cfg, header }) => {
      const res = await page.goto(path);
      expect(res?.status(), `${path} status`).toBeLessThan(400);
      await expect(page).toHaveTitle(/.+/);
      await expect(header.logo).toBeVisible();
      await expect(page.locator(cfg.selectors.footer.root).first()).toBeAttached();
    });
  }
});

test.describe('Essentials', () => {
  test('robots.txt names the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/user-agent/i);
    expect(body).toMatch(/sitemap:/i);
  });

  test('sitemap index points to child sitemaps', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    expect((await res.text()).match(/<loc>/g)?.length ?? 0).toBeGreaterThan(0);
  });

  test('homepage declares the shop language', async ({ page, cfg }) => {
    await page.goto(cfg.routes.home);
    await expect(page.locator('html')).toHaveAttribute('lang', new RegExp(`^${cfg.locale.slice(0, 2)}`, 'i'));
  });

  test('login page offers e-mail, password and submit', async ({ page, cfg }) => {
    await page.goto(cfg.routes.login);
    const l = cfg.selectors.login;
    await expect(page.locator(l.email).first()).toBeVisible();
    await expect(page.locator(l.password).first()).toBeVisible();
    await expect(page.locator(l.submit).first()).toBeVisible();
  });

  test('registration page offers the registration form', async ({ page, cfg }) => {
    test.skip(!cfg.features.registration, 'registration is disabled for this shop');
    await page.goto(cfg.routes.register);
    await expect(page.locator(cfg.selectors.register.form).first()).toBeAttached();
  });

  test('search page without a query does not crash', async ({ page, cfg }) => {
    const res = await page.goto(cfg.routes.search);
    expect(res?.status()).toBeLessThan(500);
  });

  test('empty cart page is reachable and offers no checkout line items', async ({ cart }) => {
    await cart.open();
    await expect(cart.lineItems).toHaveCount(0);
  });

  test('product page shows image, price and buy button', async ({ product, page, cfg }) => {
    await product.open(cfg.testData.simpleProduct);
    await expect(product.price).toContainText(/\d/);
    await expect(product.buyButton).toBeVisible();
    await expect(page.locator('main img:visible').first()).toBeVisible();
  });

  // The <title> comes from per-product SEO meta data maintained in the CMS (and is
  // sometimes left untranslated on staging), so assert the rendered heading instead.
  test('product page heading shows the product name', async ({ product, page, cfg }) => {
    await product.open(cfg.testData.simpleProduct);
    await expect(page).toHaveTitle(/\S/);
    const name = cfg.testData.simpleProduct.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(product.name).toContainText(new RegExp(name, 'i'));
  });

  test('product page starts with quantity 1', async ({ product, cfg }) => {
    await product.open(cfg.testData.simpleProduct);
    await expect(product.quantity).toHaveValue('1');
  });
});
