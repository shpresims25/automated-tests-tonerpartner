import type { ProjectConfig } from "../src/config/types";
import hqPatronenCh from "./hqpatronench";

/**
 * HQ-Patronen24 Switzerland (staging.hq-patronen24.ch; production www.hq-patronen24.ch, read-only reference).
 * Same TonerPartner theme, CHF prices, Swiss VAT and Swiss-only delivery as hq-patronen.ch, so the profile extends it.
 * Verified differences (GET inspection of production + staging):
 *  - printer pages live under /drucker/<brand>/ (/brother/ is a 404; the model page is still /brother/<model>/<number>)
 *  - legal/service pages are /unternehmen/* and /kundenservice/* (no /garantie-sicherheit/*)
 *  - no newsletter page (/kundenservice/newsletter/ and /unternehmen/newsletter/ are 404)
 *  - production currently shows only "Büroartikel" and "Papier" in the main navigation; staging has all seven
 *    categories, so the navigation tests run against the staging category list
 */
const config: ProjectConfig = {
  ...hqPatronenCh,
  name: "HQ-Patronen24 CH",
  baseURL: process.env.BASE_URL_HQPATRONEN24_CH ?? "",

  testData: {
    ...hqPatronenCh.testData,
    // the manufacturer page has a breadcrumb (verified); /brother/ does not exist here
    breadcrumbPagePath: "/drucker/brother/",
    newsletterPath: undefined,
    printerFinder: {
      ...hqPatronenCh.testData.printerFinder!,
      manufacturerPath: "/drucker/brother/",
    },
  },

  importantLinks: [
    "/",
    "/checkout/cart",
    "/account/login",
    "/sitemap.xml",
    "/robots.txt",
    "/toner",
    "/tinte",
    "/papier/",
    "/bueroartikel/",
    "/toner-kompatibel",
    "/drucker/brother/",
    "/unternehmen/kontakt/",
    "/unternehmen/impressum/",
    "/unternehmen/ueber-uns/",
    "/unternehmen/datenschutz/",
    "/unternehmen/agb/",
    "/unternehmen/widerrufsrecht/",
    "/kundenservice/versandarten-kosten/",
    "/kundenservice/zahlungsmoeglichkeiten/",
    "/kundenservice/reklamation/",
  ],
};

export default config;
