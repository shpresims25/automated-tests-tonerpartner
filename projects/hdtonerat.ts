import type { ProjectConfig } from "../src/config/types";
import { requireEnv } from "../src/config/env";
import hdToner from "./hdtoner";

/**
 * HD-Toner Austria (staging.hd-toner.at; production www.hd-toner.at is a read-only reference).
 * Same shop software as hd-toner.de, so the profile extends it. Verified differences (GET inspection of
 * staging + production, same on both):
 *  - the CMS pages live below /informationen/ in lower case (/AGB/, /Impressum/ ... are 404)
 *  - no newsletter page (/service/newsletter/ is 404)
 *  - the shop delivers to Austria only (country "Österreich"), VAT 20 %
 *  - "Büroartikel" is not part of the main navigation (the category /bueroartikel/ still exists)
 *  - every URL the tests open carries ?kameleoonDisabled=true (Kameleoon A/B testing must not interfere)
 */
const config: ProjectConfig = {
  ...hdToner,
  name: "HD-Toner AT",
  baseURL: requireEnv("BASE_URL_HDTONERAT"),
  locale: "de-AT",
  urlParams: { kameleoonDisabled: "true" },

  importantLinks: [
    "/",
    "/checkout/cart",
    "/account/login",
    "/sitemap.xml",
    "/robots.txt",
    "/Toner/",
    "/Druckerpatronen/",
    "/Papier/",
    "/service/kontakt/",
    "/informationen/impressum/",
    "/informationen/datenschutz/",
    "/informationen/agb/",
    "/informationen/zahlung-und-lieferung/",
    "/informationen/widerrufsrecht/",
  ],

  testData: {
    ...hdToner.testData,
    layoutPageChecks: 7,
    vatRate: 0.2,
    mainCategories: ["Druckerpatronen", "Toner", "Trommel", "Papier"],
    newsletterPath: undefined,
    customer: {
      ...hdToner.testData.customer,
      address: {
        street: "Stephansplatz 1",
        zipcode: "1010",
        city: "Wien",
        countryIso: "AT",
        countryLabel: "Österreich|Austria",
      },
      invalidAddress: {
        street: "Teststraße 1",
        zipcode: "1010",
        city: "Wien",
        countryIso: "AT",
        countryLabel: "Österreich|Austria",
      },
    },
  },
};

export default config;
