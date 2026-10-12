import type { ProjectConfig } from "../src/config/types";
import { requireEnv } from "../src/config/env";
import hdToner from "./hdtoner";

/**
 * HD-Toner Switzerland: same shop software and business logic as hd-toner.de, so the profile
 * extends it. Only verified differences are overridden (checked on staging.hd-toner.ch).
 */
const config: ProjectConfig = {
  ...hdToner,
  name: "HD-Toner CH",
  baseURL: requireEnv("BASE_URL_HDTONERCH"),
  locale: "de-CH",
  currencySymbol: "CHF",

  // the CMS pages live below /informationen/ in lower case (/AGB/, /Impressum/ ... are 404 here)
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

  selectors: {
    ...hdToner.selectors,
    // discounted listing prices show the struck-through price as .product-price-unit-list-price (not .list-price)
    listing: { listPrice: ".list-price, .product-price-unit-list-price" },
  },

  testData: {
    ...hdToner.testData,
    vatRate: 0.081, // Swiss VAT (net CHF 26.32 / gross CHF 28.45 on the staging shop)
    // "Büroartikel" is not part of the main navigation on the Swiss shop (the category /bueroartikel/ still exists
    // and is used for the listing tests)
    mainCategories: ["Druckerpatronen", "Toner", "Trommel", "Papier"],
    // the Swiss shop has no /Papier/<series>/<product>.html SEO URL: products are served at /<name>/<number>
    simpleProduct: {
      path: "/druckerpapier-din-a4-80g-weiss-500-blatt/43924",
      productNumber: "43924",
      name: "Druckerpapier DIN A4 - 80g - weiß - 500 Blatt",
    },
    printerFinder: {
      ...hdToner.testData.printerFinder!,
      modelUrlPart: /\/brother\/brother-hl-l-2300-d\//i,
    },
    customer: {
      ...hdToner.testData.customer,
      // the Swiss shop delivers to Switzerland only: Swiss addresses (country "Schweiz")
      address: {
        street: "Bahnhofstrasse 1",
        zipcode: "8001",
        city: "Zürich",
        countryIso: "CH",
        countryLabel: "Schweiz|Switzerland",
      },
      // Endereco offers no suggestion for a made-up street ("Teststrasse 1": popup without proposal); the abbreviated
      // street is not accepted unchanged and the plugin proposes "Bahnhofstrasse 1"
      invalidAddress: {
        street: "Bahnhofstr 1",
        zipcode: "8001",
        city: "Zürich",
        countryIso: "CH",
        countryLabel: "Schweiz|Switzerland",
      },
    },
  },
};

export default config;
