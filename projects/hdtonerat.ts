import type { ProjectConfig } from "../src/config/types";
import { requireEnv } from "../src/config/env";
import hdToner from "./hdtoner";


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
