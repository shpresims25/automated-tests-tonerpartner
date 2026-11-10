import { test, expect, shopConfig } from '../../src/fixtures';
import { parsePrice } from '../../src/utils/price';

/**
 * Druckerpatronen.de specifics: the shop has no main category navigation, the private/business
 * price switch is a toggle and the printer directory (/Drucker/) is the entry into the catalogue.
 * Registered when `features.vatToggle` is set in the project profile.
 */
if (shopConfig.features.vatToggle) {
  test.describe('Price toggle (incl. / excl. VAT)', () => {
    const toggle = 'label.switch:has(input[name="priceSwitch"])';

    test('toggle shows net prices (gross / 1.19) via priceTypeStatus and is remembered', async ({ page, cfg, product }) => {
      await product.open(cfg.testData.simpleProduct);
      const input = page.locator('input[name="priceSwitch"]').first();
      await expect(input).not.toBeChecked();
      const gross = await product.priceValue();

      await Promise.all([
        page.waitForResponse((r) => r.request().method() === 'POST' && /priceTypeStatus/.test(r.url())),
        page.locator(toggle).first().click(),
      ]);
      await expect(input).toBeChecked();
      await expect.poll(() => product.priceValue()).toBeLessThan(gross);
      const net = await product.priceValue();
      expect(Math.abs(net - gross / (1 + (cfg.testData.vatRate ?? 0.19)))).toBeLessThanOrEqual(0.02);
      expect((await page.context().cookies()).find((c) => c.name === 'brutoNeto')?.value).toBe('true');

      await page.reload({ waitUntil: 'load' });
      await expect(input).toBeChecked();
      expect(await product.priceValue()).toBeCloseTo(net, 2);

      // back to private customer: gross price again
      await Promise.all([
        page.waitForResponse((r) => r.request().method() === 'POST' && /priceTypeStatus/.test(r.url())),
        page.locator(toggle).first().click(),
      ]);
      await expect(input).not.toBeChecked();
      await expect.poll(() => product.priceValue()).toBeCloseTo(gross, 2);
    });
  });

  test.describe('Printer directory', () => {
    test('directory lists the printer brands alphabetically and a brand opens its series page', async ({ page }) => {
      await page.goto('/Drucker/', { waitUntil: 'load' });
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Drucker');
      const brand = page.locator('main a[href$="/Drucker/Brother/"]').first();
      await expect(brand).toBeVisible();
      await Promise.all([page.waitForURL(/\/Drucker\/Brother\/(\?.*)?$/, { waitUntil: 'load' }), brand.click()]);
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Brother');
      await expect(page.locator('main a[href$="/Drucker/Brother/HL-L/"]').first()).toBeVisible();
    });

    test('searching a printer model offers the printer page', async ({ page, cfg }) => {
      await page.goto(`${cfg.routes.search}?${cfg.routes.searchParam}=${encodeURIComponent('Brother HL-L 2310')}`, { waitUntil: 'load' });
      const printer = page.locator('main a[href*="/Brother-HL-L-2310-D/"]').first();
      await expect(printer).toBeVisible({ timeout: 30_000 });
      await Promise.all([page.waitForURL(/\/Brother-HL-L-2310-D\//, { waitUntil: 'load' }), printer.click()]);
      await expect(page.locator('main')).toContainText('Brother HL-L 2310 D');
    });

    test('searching an article number leads directly to the product page', async ({ page, cfg, product }) => {
      await page.goto(`${cfg.routes.search}?${cfg.routes.searchParam}=${cfg.testData.simpleProduct.productNumber}`, { waitUntil: 'load' });
      await expect(page).toHaveURL(new RegExp(`/${cfg.testData.simpleProduct.productNumber}(\\?.*)?$`));
      await expect(product.name).toContainText(cfg.testData.simpleProduct.name);
      expect(parsePrice(await product.price.innerText())).toBeGreaterThan(0);
    });
  });
}
