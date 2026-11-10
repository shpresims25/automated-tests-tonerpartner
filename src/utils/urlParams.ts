import type { APIRequestContext, BrowserContext, Page } from "@playwright/test";
import type { ResolvedConfig } from "../config/types";

/** Adds the profile's `urlParams` (e.g. kameleoonDisabled=true) to a URL/path unless it already has them. */
export function withUrlParams(url: string, cfg: Pick<ResolvedConfig, "baseURL" | "urlParams">): string {
  const params = cfg.urlParams;
  if (!params || Object.keys(params).length === 0) return url;
  const u = new URL(url, cfg.baseURL + "/");
  if (u.origin !== new URL(cfg.baseURL).origin) return url;
  for (const [k, v] of Object.entries(params)) if (!u.searchParams.has(k)) u.searchParams.set(k, v);
  return /^https?:\/\//i.test(url) ? u.toString() : u.pathname + u.search + u.hash;
}


export function applyUrlParams(page: Page, cfg: ResolvedConfig): void {
  if (!cfg.urlParams || Object.keys(cfg.urlParams).length === 0) return;
  const original = page.goto.bind(page);
  page.goto = ((url: string, options?: Parameters<Page["goto"]>[1]) =>
    original(withUrlParams(url, cfg), options)) as Page["goto"];
}

/**
 * Redirects every same-origin GET document navigation that lacks the profile's `urlParams` to the same URL
 * with them. `page.goto` is covered by `applyUrlParams`; this catches what the shop does on its own:
 * redirects (/account -> /account/login), link clicks (logo, categories) and form-post redirects.
 * POST navigations are left alone (a redirect would turn them into GETs).
 */
export async function enforceUrlParams(context: BrowserContext, cfg: ResolvedConfig): Promise<void> {
  if (!cfg.urlParams || Object.keys(cfg.urlParams).length === 0) return;
  const origin = new URL(cfg.baseURL).origin;
  await context.route(
    (url) => url.origin === origin,
    async (route) => {
      const req = route.request();
      if (req.method() !== "GET" || !req.isNavigationRequest() || req.resourceType() !== "document") return route.fallback();
      // Playwright does not route the hops of a redirect chain, so follow the shop's own redirects
      // (cart -> /checkout/confirm -> /checkout/register ...) here and send the browser straight to the final URL with the params.
      let url = withUrlParams(req.url(), cfg);
      let res = await route.fetch({ url, maxRedirects: 0 });
      for (let hop = 0; hop < 10 && res.status() >= 300 && res.status() < 400 && res.headers()["location"]; hop++) {
        url = withUrlParams(new URL(res.headers()["location"], url).toString(), cfg);
        if (new URL(url).origin !== origin) break;
        res = await route.fetch({ url, maxRedirects: 0 });
      }
      if (url !== req.url()) return route.fulfill({ status: 302, headers: { location: url, "cache-control": "no-store" } });
      await route.fulfill({ response: res });
    },
  );
}

/**
 * Adds the `urlParams` to the GET/HEAD requests made through an API request context (`request` fixture).
 * Not used for `page.request` POSTs: the parameter on a background cart/form POST changes what the shop
 * does for the session (HD-Toner then shows a different checkout layout).
 */
export function applyUrlParamsToRequests<T extends APIRequestContext>(api: T, cfg: ResolvedConfig): T {
  if (!cfg.urlParams || Object.keys(cfg.urlParams).length === 0) return api;
  for (const m of ["get", "head"] as const) {
    const original = (api[m] as (u: string, o?: unknown) => Promise<unknown>).bind(api);
    (api as unknown as Record<string, unknown>)[m] = (url: string, options?: unknown) =>
      original(typeof url === "string" ? withUrlParams(url, cfg) : url, options);
  }
  return api;
}
