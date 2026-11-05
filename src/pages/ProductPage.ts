import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import { parsePrice } from "../utils/price";
import type { ProductRef } from "../config/types";

export class ProductPage extends BasePage {
  get name(): Locator {
    return this.$(this.s.product.name).first();
  }
  get price(): Locator {
    return this.$(this.s.product.price).first();
  }
  get productNumber(): Locator {
    return this.$(this.s.product.productNumber).first();
  }
  get buyButton(): Locator {
    return this.$(this.s.product.buyButton).first();
  }
  get quantity(): Locator {
    return this.$(this.s.product.quantityInput).first();
  }
  get configuratorGroups(): Locator {
    return this.$(this.s.product.configuratorGroup);
  }

  async open(product: ProductRef | string): Promise<void> {
    await this.goto(typeof product === "string" ? product : product.path);
    await expect(this.name).toBeVisible();
  }

  async priceValue(): Promise<number> {
    return parsePrice(await this.price.innerText());
  }

  async setQuantity(qty: number): Promise<void> {
    // themes with a quantity dropdown (Druckerpatronen.de) instead of a number input
    if ((await this.quantity.evaluate((el) => el.tagName)) === "SELECT") {
      await this.quantity.selectOption(String(qty));
    } else {
      await this.quantity.fill(String(qty));
    }
  }

  async addToCart(qty?: number): Promise<void> {
    if (qty) await this.setQuantity(qty);
    // off-canvas cart (HD-Toner: "tp-cart-popup") with the checkout button
    const cart = this.$(this.s.offcanvasCart.root);
    // the add-to-cart script binds late after load (slow staging): a click before that is lost, so it is repeated
    await expect(async () => {
      if (await cart.isVisible()) return;
      await this.buyButton.click({ timeout: 5_000 });
      await expect(cart).toBeVisible({ timeout: 6_000 });
    }).toPass({ timeout: 40_000 });
    await expect(cart.locator(this.s.offcanvasCart.checkoutButton).first()).toBeVisible();
  }

  /**
   * Selects another option in the given configurator group (by index).
   * Shopware reloads the page/URL for the new variant.
   */
  async switchVariant(
    groupIndex: number,
  ): Promise<{ before: string; after: string }> {
    const before = (await this.productNumber.innerText()).trim();
    const group = this.configuratorGroups.nth(groupIndex);
    const options = group.locator(this.s.product.configuratorOptionInput);
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const opt = options.nth(i);
      if ((await opt.isChecked()) || (await opt.isDisabled())) continue;
      const cls = (await opt.getAttribute("class")) ?? "";
      if (!cls.includes("is-combinable")) continue;
      const id = await opt.getAttribute("id");
      await Promise.all([
        this.page.waitForURL((u) => !u.pathname.endsWith(before), {
          timeout: 15_000,
        }),
        this.page.locator(`label[for="${id}"]`).click(),
      ]);
      await expect(this.productNumber).not.toHaveText(before);
      return { before, after: (await this.productNumber.innerText()).trim() };
    }
    throw new Error("No alternative combinable variant option found");
  }

  get wishlistButton(): Locator {
    return this.$(this.s.product.wishlistButton).first();
  }
}
