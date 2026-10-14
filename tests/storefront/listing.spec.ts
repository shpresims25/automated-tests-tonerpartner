import { test, expect, shopConfig } from "../../src/fixtures";

test.describe("Product listing", () => {
  test.beforeEach(async ({ listing, cfg }) => {
    await listing.open(cfg.testData.listingCategoryPath);
  });

  test(
    "shows product boxes with name, price and image",
    { tag: ["@smoke", "@mobile"] },
    async ({ listing, cfg }) => {
      const s = cfg.selectors.listing;
      await expect(listing.productBoxes.first()).toBeVisible();
      expect(await listing.productBoxes.count()).toBeGreaterThan(0);
      const first = listing.productBoxes.first();
      await expect(first.locator(s.productName)).not.toBeEmpty();
      await expect(first.locator(s.productPrice).first()).toContainText(/\d/);
      await expect(first.locator(s.productImage).first()).toBeVisible();
    },
  );

  test(
    "product box links to the detail page",
    { tag: "@smoke" },
    async ({ listing, product }) => {
      const name = await listing.openProduct(0);
      await expect(product.name).toContainText(name);
    },
  );

  test("pagination navigates to the next page", async ({
    page,
    listing,
    cfg,
  }) => {
    await expect(
      listing.pagination,
      "the configured listing category must span several pages",
    ).toBeVisible();
    const next = page
      .locator(cfg.selectors.listing.paginationNext)
      .locator("a, label")
      .first();
    const firstPage = await listing.productNames();
    await Promise.all([page.waitForResponse(/\/widgets\/cms/), next.click()]);
    await expect(page).toHaveURL(/[?&]p=\d/);
    await expect.poll(() => listing.productNames()).not.toEqual(firstPage);
  });

  test("prices are shown in the shop currency", async ({ listing, cfg }) => {
    await expect(listing.productBoxes.first()).toBeVisible();
    const prices = await listing.productBoxes
      .locator(cfg.selectors.listing.productPrice)
      .evaluateAll((els) => els.map((el) => el.textContent ?? ""));
    expect(prices.length).toBeGreaterThan(0);
    for (const text of prices)
      expect(text, `price "${text.trim()}"`).toContain(cfg.currencySymbol);
  });

  test("every product box has a name, an image and a link", async ({
    listing,
    cfg,
  }) => {
    const s = cfg.selectors.listing;
    await expect(listing.productBoxes.first()).toBeVisible();
    const boxes = await listing.productBoxes.evaluateAll(
      (els, sel) =>
        els.map((el) => ({
          name: el.querySelector(sel.name)?.textContent?.trim() ?? "",
          image: !!el.querySelector(sel.image),
          href: el.querySelector("a[href]")?.getAttribute("href") ?? "",
        })),
      { name: s.productName, image: s.productImage },
    );
    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) {
      expect(box.name, "product name").not.toBe("");
      expect(box.image, `image of "${box.name}"`).toBe(true);
      expect(box.href, `link of "${box.name}"`).not.toBe("");
    }
  });
});

// registered only for shops with the standard filter panel (the TonerPartner shops filter by printer model instead, see printer-finder.spec.ts)
if (shopConfig.testData.expectedFilterTypes.length > 0) test.describe("Filters", () => {
  test.beforeEach(async ({ listing, cfg }) => {
    await listing.open(cfg.testData.listingCategoryPath);
  });

  test(
    "expected filter types are available",
    { tag: "@smoke" },
    async ({ listing, cfg }) => {
      await listing.ensureFilterPanelVisible();
      for (const type of cfg.testData.expectedFilterTypes) {
        await expect(
          listing.filterOfType(type).first(),
          `filter "${type}" missing`,
        ).toBeAttached();
      }
    },
  );

  test(
    "manufacturer filter narrows results and can be reset",
    { tag: "@mobile" },
    async ({ page, listing }) => {
      const before = await listing.productBoxes.count();
      const label = await listing.applyMultiSelectFilter(
        listing.filterOfType("manufacturer"),
      );
      await expect(page).toHaveURL(/manufacturer=/);
      await expect(listing.activeFilters.first()).toContainText(label);
      expect(await listing.productBoxes.count()).toBeLessThanOrEqual(before);

      await listing.resetAllFilters();
      await expect(listing.activeFilters).toHaveCount(0);
    },
  );

  test("property filter narrows results", async ({ page, listing }) => {
    await listing.applyMultiSelectFilter(listing.filterOfType("properties"));
    await expect(page).toHaveURL(/properties=/);
    await expect(listing.activeFilters).toHaveCount(1);
    await expect(listing.productBoxes.first()).toBeVisible();
  });

  test("price filter limits product prices", async ({ page, listing }) => {
    const prices = await listing.productPrices();
    const max = Math.ceil(
      prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)],
    );
    await listing.applyPriceFilter(undefined, max);
    await expect(page).toHaveURL(/max-price=/);
    const filtered = await listing.productPrices();
    expect(
      filtered.every((p) => p <= max + 0.01),
      `prices above ${max}: ${filtered.join(", ")}`,
    ).toBe(true);
  });
});
