import type { ProjectConfig } from "../src/config/types";
import hqPatronen from "./hqpatronen";

const config: ProjectConfig = {
  ...hqPatronen,
  name: "Druckerpatronen.de",
  baseURL: process.env.BASE_URL_DRUCKERPATRONEN ?? "",

  features: {
    ...hqPatronen.features,
    megaMenuFlyout: false,
    vatSwitch: false,
    vatToggle: true,
  },

  routes: {
    ...hqPatronen.routes,
    contactPage: "/unternehmen/kontakt/",
  },

  testData: {
    ...hqPatronen.testData,
    mainCategories: [],
    listingCategoryPath: "/Druckerzubehoer/",

    buyableListingPath: "/Brother-HL-L-2310-D/50264058",
    breadcrumbPagePath: "/Drucker/Brother/",
    simpleProduct: {
      path: "/4K0U5NE-924/72879",
      productNumber: "72879",
      name: "4K0U5NE / 924",
    },
    searchTerm: "Brother HL-L 2310",
    searchMinResults: 1,
    notFoundPage: "shop",
    outOfRangePageReturns500: true,
    productTabs: ["Passende Druckmodelle", "Produktdetails", "Produktsicherheit"],
    printerFinder: {
      manufacturer: "Brother",
      manufacturerPath: "/Drucker/Brother/",
      series: "HL-L",
      model: "Brother HL-L 2310 D",
      modelUrlPart: /\/Brother-HL-L-2310-D\//i,
    },
    newsletterPath: undefined,
    customer: { ...hqPatronen.testData.customer, invalidAddress: undefined },
  },

  importantLinks: [
    "/",
    "/checkout/cart",
    "/account/login",
    "/sitemap.xml",
    "/robots.txt",
    "/Drucker/",
    "/Drucker/Brother/",
    "/Tinten-Toner/",
    "/Druckerzubehoer/",
    "/unternehmen/kontakt/",
    "/Unternehmen/AGB/",
    "/Unternehmen/Datenschutz/",
    "/Unternehmen/Impressum/",
    "/Unternehmen/Widerrufsrecht/",
    "/Kundenservice/Versandarten-kosten/",
  ],

  selectors: {
    ...hqPatronen.selectors,
    page: {
      ...hqPatronen.selectors?.page,
      cmsContent: ".cms-page",
    },
    header: {
      ...hqPatronen.selectors?.header,
      cart: ".header-cart:visible, a.header-cart-btn:visible",
      accountLoginLink: '.account-menu-btn[href$="/account/login"]',
    },
    listing: {
      ...hqPatronen.selectors?.listing,
      root: ".cms-element-product-listing, .product-box",
      productImage: ".product-image-wrapper img, .product-image-wrapper .product-image-placeholder",
    },
    product: {
      ...hqPatronen.selectors?.product,
      productNumber: ".drp-product-detail-pim-id",
      name: ".product-detail-name, .breadcrumb-title-product-detail",
      delivery: ".product-detail-delivery-information:visible, .product-detail-delivery-info-calculate:visible",
      quantityInput: '.product-detail-buy select[name$="[quantity]"]',
    },
    printerFinder: {
      opener: 'button:has-text("Druckermodell wählen"), a:has-text("Druckermodell wählen")',
    },
  },
};

export default config;
