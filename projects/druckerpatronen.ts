import type { ProjectConfig } from "../src/config/types";
import hqPatronen from "./hqpatronen";

/**
 * Druckerpatronen.de (staging: update.druckerpatronen.de; production www.druckerpatronen.de, read-only reference).
 * Same TonerPartner theme and FACT-Finder search as HQ-Patronen, so the profile extends it.
 * Verified differences (GET inspection of production + staging):
 *  - no main category navigation in the header: the shop is entered through the printer finder,
 *    the brand pages (/Drucker/<Brand>/) and the two category pages /Tinten-Toner/ and /Druckerzubehoer/
 *  - product URLs are /<name>/<number> (staging) – production uses /<name>/<32 hex id>
 *  - legal pages live under /Unternehmen/* on staging (production: /AGB/, /Datenschutz/, ...)
 *  - unknown URLs return the shop's own 404 page (HTTP 404)
 *  - no Endereco address check on the registration form (no invalid-address popup)
 *  - the cart button is a separate mobile link (a.header-cart-btn); .header-cart is desktop only
 */
const config: ProjectConfig = {
  ...hqPatronen,
  name: "Druckerpatronen.de",
  baseURL: process.env.BASE_URL_DRUCKERPATRONEN ?? "",

  features: {
    ...hqPatronen.features,
    megaMenuFlyout: false,
    // the price switch is a toggle (not the HQ-Patronen dropdown): covered by tests/storefront/druckerpatronen.spec.ts
    vatSwitch: false,
    vatToggle: true,
  },

  routes: {
    ...hqPatronen.routes,
    contactPage: "/unternehmen/kontakt/",
  },

  testData: {
    ...hqPatronen.testData,
    // there is no main navigation: see tests/storefront/druckerpatronen.spec.ts for the brand/category entry points
    mainCategories: [],
    listingCategoryPath: "/Druckerzubehoer/",
    // the "In den Warenkorb" buttons on /Druckerzubehoer/ are not wired to a form (no request is sent): buy from a printer page
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
    // staging only: /Druckerzubehoer/?p=99999 answers 500 (production + /Tinten-Toner/ answer 200)
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
    // no Endereco plugin on this shop: the invalid-address registration test is not registered
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
      // the first .cms-section of the start page is empty (height 0)
      cmsContent: ".cms-page",
    },
    offcanvasCart: {
      ...hqPatronen.selectors?.offcanvasCart,
      // the cart popup posts straight to the line-item endpoints (change-quantity / delete)
      updateRequest: "/checkout/line-item/",
    },
    header: {
      ...hqPatronen.selectors?.header,
      cart: ".header-cart:visible, a.header-cart-btn:visible",
      // guests: the account button itself links to /account/login (no dropdown)
      accountLoginLink: '.account-menu-btn[href$="/account/login"]',
    },
    listing: {
      ...hqPatronen.selectors?.listing,
      // printer pages list their compatible products without the CMS listing wrapper
      root: ".cms-element-product-listing, .product-box",
      // articles without a picture render Shopware's placeholder graphic instead of an <img>
      productImage: ".product-image-wrapper img, .product-image-wrapper .product-image-placeholder",
    },
    product: {
      ...hqPatronen.selectors?.product,
      productNumber: ".drp-product-detail-pim-id",
      // the listing links to product family pages (/<name>/<32 hex id>) that only carry the name in the breadcrumb
      name: ".product-detail-name, .breadcrumb-title-product-detail",
      // mobile shows .product-detail-delivery-information (d-lg-none) instead of the desktop calculate box
      delivery: ".product-detail-delivery-information:visible, .product-detail-delivery-info-calculate:visible",
      // quantity dropdown instead of a number input
      quantityInput: '.product-detail-buy select[name$="[quantity]"]',
    },
    printerFinder: {
      // the finder is collapsed until "Druckermodell wählen" is clicked
      opener: 'button:has-text("Druckermodell wählen"), a:has-text("Druckermodell wählen")',
    },
  },
};

export default config;
