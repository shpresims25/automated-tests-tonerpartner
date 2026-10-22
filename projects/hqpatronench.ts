import type { ProjectConfig } from "../src/config/types";
import { requireEnv } from "../src/config/env";
import hqPatronen from "./hqpatronen";

/**
 * HQ-Patronen Switzerland: same shop software, theme and business logic as hq-patronen.de, so the
 * profile extends it. Only differences verified on staging.hq-patronen.ch are overridden.
 */
const config: ProjectConfig = {
  ...hqPatronen,
  name: "HQ-Patronen CH",
  baseURL: requireEnv("BASE_URL_HQPATRONENCH"),
  locale: "de-CH",
  currencySymbol: "CHF",

  testData: {
    ...hqPatronen.testData,
    vatRate: 0.081, // Swiss VAT
    // the profile form requires a VAT ID here even for private customers (the .de form does not); the shop saves the
    // profile with any value and drops it again for a private customer
    profileVatId: "CHE-123.456.789 MWST",
    // The Swiss shop has no newsletter page (/kundenservice/newsletter/ is 404): the newsletter test is not registered.
    newsletterPath: undefined,
    printerFinder: {
      ...hqPatronen.testData.printerFinder!,
      // printer pages are served like products: /brother/<model>/<number> (de: /<model>/)
      modelUrlPart: /\/brother\/brother-hl-l-2300-d\/\d+/i,
    },
    customer: {
      ...hqPatronen.testData.customer,
      // the Swiss shop delivers to Switzerland only (country "Schweiz")
      address: {
        street: "Bahnhofstrasse 1",
        zipcode: "8001",
        city: "Zürich",
        countryIso: "CH",
        countryLabel: "Schweiz|Switzerland",
      },
      // abbreviated street: Endereco does not accept it unchanged and proposes "Bahnhofstrasse 1"
      invalidAddress: {
        street: "Bahnhofstr 1",
        zipcode: "8001",
        city: "Zürich",
        countryIso: "CH",
        countryLabel: "Schweiz|Switzerland",
      },
    },
  },

  // "Versandarten & -kosten" (/kundenservice/versandarten-kosten/) does not exist here: it is "Versand & Zahlung"
  importantLinks: [
    ...hqPatronen.importantLinks.filter((l) => l !== "/kundenservice/versandarten-kosten/"),
    "/kundenservice/versand-zahlung/",
    "/kundenservice/faq/",
  ],
};

export default config;
