import { test, expect, shopConfig } from '../../src/fixtures';

/**
 * Printer model finder (Hersteller > Serie > Modell) of the TonerPartner shops. Customers find
 * their cartridges through their printer model, so this is the shops' main entry into the catalogue
 * (and replaces the standard filter panel the shops do not have). Runs when
 * `testData.printerFinder` is set in the project profile.
 */
if (shopConfig.testData.printerFinder) test.describe('Printer finder', () => {
  test.beforeEach(() => {
    // consent layer + finder start-up + a heavy printer page load: more than the default budget
    test.slow();
  });

  test('series and model stay locked until the previous choice is made', async ({ page, cfg, printerFinder }) => {
    const f = cfg.testData.printerFinder!;
    await page.goto(cfg.routes.home, { waitUntil: 'load' });
    await printerFinder.waitUntilReady();
    await expect(printerFinder.manufacturer).toBeEnabled();
    await expect(printerFinder.series).toBeDisabled();
    await expect(printerFinder.model).toBeDisabled();

    await printerFinder.chooseManufacturer(f.manufacturer);
    await expect(printerFinder.series).toBeEnabled();
    await expect(printerFinder.model).toBeDisabled();

    await printerFinder.chooseSeries(f.series);
    await expect(printerFinder.model).toBeEnabled();
  });

  test('choosing a model opens its printer page with title and breadcrumb', { tag: '@smoke' }, async ({ page, cfg, printerFinder }) => {
    const f = cfg.testData.printerFinder!;
    await page.goto(cfg.routes.home, { waitUntil: 'load' });
    await printerFinder.chooseManufacturer(f.manufacturer);
    await printerFinder.chooseSeries(f.series);
    await printerFinder.chooseModel(f.model);

    await expect(page).toHaveURL(f.modelUrlPart);
    await expect(page.locator('h1').first()).toContainText(f.model);
    await expect(page.locator(cfg.selectors.page.breadcrumb).first()).toContainText(f.model);
  });

  test('manufacturer page lists the printer series and a series page lists models', async ({ page, cfg }) => {
    const f = cfg.testData.printerFinder!;
    await page.goto(f.manufacturerPath, { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: new RegExp(f.manufacturer, 'i') }).first()).toBeVisible();
    const seriesLink = page.locator('main a', { hasText: new RegExp(`^\\s*${f.manufacturer} ${f.series}(\\s|$)`, 'i') }).first();
    await expect(seriesLink).toBeVisible();
    await Promise.all([page.waitForURL((u) => u.pathname !== f.manufacturerPath, { waitUntil: 'load' }), seriesLink.click()]);
    await expect(page.locator('main a', { hasText: f.model }).first()).toBeVisible();
  });
});
