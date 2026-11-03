import type { ProjectConfig } from "../src/config/types";
import hqPatronenCh from "./hqpatronench";

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
