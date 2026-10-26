import { expect, type Page } from '@playwright/test';
import type { ResolvedConfig } from '../config/types';

/**
 * Asserts the shop's "page not found" response (HTTP status checked by the caller).
 * Shops render either the storefront error page, or — when `testData.notFoundPage` is
 * "exception" (staging throws the routing exception on purpose, but may also show the storefront
 * error page) — either the framework exception page for the unmatched route or the storefront one.
 */
export async function expectNotFoundPage(page: Page, cfg: ResolvedConfig): Promise<void> {
  if (cfg.testData.notFoundPage === 'exception') {
    const exception = page.getByRole('heading', { name: /No route found for "GET / });
    const storefront = page.locator(cfg.selectors.error.body);
    await expect(exception.or(storefront).first()).toBeAttached();
    return;
  }
  await expect(page.locator(cfg.selectors.error.body)).toBeAttached();
  await expect(page.locator(cfg.selectors.header.logo)).toBeVisible();
  await expect(page.locator(cfg.selectors.error.backToShop).first()).toBeVisible();
}
