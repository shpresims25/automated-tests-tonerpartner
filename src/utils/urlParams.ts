import type { Page } from "@playwright/test";
import type { ResolvedConfig } from "../config/types";

/** Adds the profile's `urlParams` (e.g. kameleoonDisabled=true) to a URL/path unless it already has them. */
export function withUrlParams(url: string, cfg: Pick<ResolvedConfig, "baseURL" | "urlParams">): string {
  const params = cfg.urlParams;
  if (!params || Object.keys(params).length === 0) return url;
  const u = new URL(url, cfg.baseURL + "/");
  if (u.origin !== new URL(cfg.baseURL).origin) return url;
  for (const [k, v] of Object.entries(params)) if (!u.searchParams.has(k)) u.searchParams.set(k, v);
  // keep relative paths relative (Playwright resolves them against baseURL)
  return /^https?:\/\//i.test(url) ? u.toString() : u.pathname + u.search + u.hash;
}

/**
 * Makes every `page.goto()` of this page carry the profile's `urlParams`
 * (hd-toner.at: `?kameleoonDisabled=true` switches the Kameleoon A/B-testing script off).
 */
export function applyUrlParams(page: Page, cfg: ResolvedConfig): void {
  if (!cfg.urlParams || Object.keys(cfg.urlParams).length === 0) return;
  const original = page.goto.bind(page);
  page.goto = ((url: string, options?: Parameters<Page["goto"]>[1]) =>
    original(withUrlParams(url, cfg), options)) as Page["goto"];
}
