import { expect, type Locator, type Response } from '@playwright/test';
import { BasePage, escapeRegExp } from './BasePage';

/** /checkout/confirm and /checkout/finish */
export class CheckoutPage extends BasePage {
  get lineItems(): Locator {
    return this.$(`${this.s.cart.root} ${this.s.checkout.lineItem}`);
  }
  get submitButton(): Locator {
    return this.$(this.s.checkout.submitOrder).first();
  }

  async openConfirm(): Promise<void> {
    await this.goto(this.cfg.routes.checkoutConfirm);
  }

  /** Selects the configured payment method unless it is already active (a default like PayPal can hide the submit button). */
  async ensurePaymentMethod(): Promise<void> {
    const { paymentMethod } = this.cfg.testData;
    if (!paymentMethod) return;
    const label = this.$(this.s.checkout.paymentMethodLabel).filter({ hasText: new RegExp(escapeRegExp(paymentMethod), 'i') }).first();
    const inputId = await label.getAttribute('for');
    const input = inputId ? this.page.locator(`[id="${inputId}"]`) : label.locator(this.s.checkout.paymentMethod);
    if (!(await input.isChecked())) await this.selectPaymentMethod(paymentMethod);
  }

  async expectOnConfirm(): Promise<void> {
    await this.expectPath(this.cfg.routes.checkoutConfirm);
    await this.ensurePaymentMethod();
    await expect(this.submitButton).toBeVisible();
  }

  async selectPaymentMethod(label: string): Promise<void> {
    const lbl = this.$(this.s.checkout.paymentMethodLabel).filter({ hasText: new RegExp(escapeRegExp(label), 'i') }).first();
    const inputId = await lbl.getAttribute('for');
    const input = inputId ? this.page.locator(`[id="${inputId}"]`) : lbl.locator(this.s.checkout.paymentMethod);
    if (await input.isChecked()) return;
    // Wait until the shop has stored the choice: ordering before that sends the order with the previous
    // method (PayPal) although the radio already looks selected. A click before the page script is
    // bound only ticks the radio without telling the shop, so repeat with a change event.
    const stored = (r: Response) => r.url().includes('/checkout/configure') && r.request().method() === 'POST';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await Promise.all([
          this.page.waitForResponse(stored, { timeout: 8_000 }),
          attempt === 1 ? lbl.click() : input.dispatchEvent('change'),
        ]);
        break;
      } catch (e) {
        if (attempt === 3) throw e;
      }
    }
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Clicks the order button. The PayPal script loads a few seconds after the confirm page and can hide
   * the standard button (d-none) although another payment method is selected; then the same order form
   * is submitted directly (terms are still validated by the browser and the shop).
   */
  private async submitOrder(): Promise<void> {
    await expect(this.submitButton).toBeAttached();
    if (await this.submitButton.isVisible()) {
      try {
        await this.submitButton.click({ timeout: 5_000 });
        return;
      } catch {
        // hidden while the click was being performed
      }
    }
    await this.submitButton.evaluate((el) => (el as HTMLButtonElement).form?.requestSubmit());
  }

  async selectShippingMethod(label: string): Promise<void> {
    const lbl = this.$(this.s.checkout.shippingMethodLabel).filter({ hasText: new RegExp(escapeRegExp(label), 'i') }).first();
    await Promise.all([this.page.waitForLoadState('domcontentloaded'), lbl.click()]);
  }

  async acceptTerms(): Promise<void> {
    const tos = this.$(this.s.checkout.tos).first();
    if (!(await tos.count())) return;
    // Shopware JS can re-render the confirm page right after load and drop the
    // checked state → wait for load and retry until the checkbox stays checked.
    await this.page.waitForLoadState('load');
    await expect(async () => {
      if (!(await tos.isChecked())) await tos.check();
      await expect(tos).toBeChecked({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
  }

  /** Accepts TOS, applies configured payment/shipping, places the order. Returns the order number if shown. */
  async placeOrder(): Promise<string | undefined> {
    const { paymentMethod, shippingMethod } = this.cfg.testData;
    if (shippingMethod) await this.selectShippingMethod(shippingMethod);
    if (paymentMethod) await this.selectPaymentMethod(paymentMethod);
    await this.acceptTerms();
    await Promise.all([
      this.page.waitForURL(new RegExp(escapeRegExp(this.cfg.routes.checkoutFinish)), { timeout: 45_000, waitUntil: 'domcontentloaded' }), // finish page keeps loading third-party widgets (promo popup)
      this.submitOrder(),
    ]);
    const nr = this.$(this.s.checkout.finishOrderNumber).first();
    return (await nr.count()) ? (await nr.innerText()).replace(/\D+/g, ' ').trim().split(' ').pop() : undefined;
  }

  get finishHeader(): Locator {
    return this.$(this.s.checkout.finishHeader).first();
  }
}
