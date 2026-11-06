import type { ProjectConfig } from "../src/config/types";
import { requireEnv } from "../src/config/env";
import hdToner from "./hdtoner";

const config: ProjectConfig = {
  ...hdToner,
  name: "Cartouche Club",
  baseURL: requireEnv("BASE_URL_CARTOUCHECLUB"),
  locale: "fr-FR",
  currencySymbol: "€",

  features: {
    ...hdToner.features,
    consentLayer: true, 
    megaMenuFlyout: false, 
  },

  routes: {
    ...hdToner.routes,
    contactPage: "/a-propos/contactez-nous/",
  },

  testData: {
    ...hdToner.testData,
    layoutPageChecks: 9,
    vatRate: 0.2,
    mainCategories: ["Encre", "Toner", "Tambour", "Autres", "Bande", "Papier"],
    listingCategoryPath: "/papier/",
    listingHasPagination: false,
    simpleProduct: {
      path: "/papier-a-copier-papier-pour-imprimante-500-feuilles-din-a4-80-g-m2-blanc/43924",
      productNumber: "43924",
      name: "Papier à copier / papier pour imprimante",
    },
    searchTerm: "TN-2320",
    searchMinResults: 1,
    searchNoResultTerm: "9999999999999",
    paymentMethod: "Virement Bancaire",
    contactTopics: [],
    productTabs: ["Détails du produit", "Description", "Sécurité des produits"],
    breadcrumbPagePath: "/imprimante/brother/",
    customer: {
      ...hdToner.testData.customer,
      address: {
        street: "10 Rue de Rivoli",
        zipcode: "75001",
        city: "Paris",
        countryIso: "FR",
        countryLabel: "France",
      },
      invalidAddress: undefined,
    },
    printerFinder: {
      manufacturer: "Brother",
      manufacturerPath: "/imprimante/brother/",
      series: "HL-L",
      model: "Brother HL-L 2300 D",
      modelUrlPart: /\/brother\/brother-hl-l-2300-d\//i,
    },
    newsletterPath: "/services/newsletter/",
    contactLinkText: /Contact/i,
  },

  importantLinks: [
    "/",
    "/checkout/cart",
    "/account/login",
    "/sitemap.xml",
    "/robots.txt",
    "/papier/",
    "/imprimante/",
    "/imprimante/brother/",
    "/a-propos/contactez-nous/",
    "/a-propos/faq/",
    "/a-propos/livraisons-et-delais/",
    "/a-propos/modes-de-paiement/",
    "/informations-legales/cgv/",
    "/informations-legales/mentions-legales/",
    "/informations-legales/protection-des-donnees/",
    "/informations-legales/retours/",
  ],

  selectors: {
    ...hdToner.selectors,
    navigation: {
      ...hdToner.selectors?.navigation,
      rootLink: ".main-navigation-link.mega-menu-trigger",
    },
    product: {
      ...hdToner.selectors?.product,
      tax: 'main p:has-text("Prix TTC"):visible',
      delivery: 'main p:has-text("Commandez dans"):visible',
    },
    cookie: {
      banner: "#usercentrics-cmp-ui",
      acceptAll: '#usercentrics-cmp-ui button:has-text("Accepter tout")',
      onlyNecessary: '#usercentrics-cmp-ui button:has-text("Refuser")',
    },
  },
};

export default config;
