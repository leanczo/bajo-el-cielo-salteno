// @ts-check

/** @type {import("pliny/config").PlinyConfig } */
const siteMetadata = {
  title: 'Bajo el cielo salteño',
  author: 'Leandro Cardozo',
  headerTitle: 'Bajo el cielo salteño',
  description:
    'Bajo el Cielo Salteño es un blog personal en el que comparto mis aventuras de trekking, centrándome principalmente en la maravillosa provincia de Salta, Argentina',
  language: 'es-ar',
  theme: 'system', // system, dark or light
  siteUrl: 'https://bajo-el-cielo-salteno.vercel.app',
  siteRepo: 'https://github.com/leanczo/bajo-el-cielo-salteno',
  siteLogo: '/static/images/logo.png',
  image: '/static/images/avatar.png',
  socialBanner: '/static/images/logo.png',
  email: 'lean094c@gmail.com',
  github: 'https://github.com/leanczo',
  twitter: 'https://twitter.com/Twitter',
  facebook: 'https://facebook.com',
  youtube: 'https://youtube.com',
  linkedin: 'https://www.linkedin.com/in/leanczo/',
  locale: 'es-AR',
  analytics: {
    // If you want to use an analytics provider you have to add it to the
    // content security policy in the `next.config.js` file.
    // supports plausible, simpleAnalytics, umami or googleAnalytics
    plausibleDataDomain: '', // e.g. tailwind-nextjs-starter-blog.vercel.app
    simpleAnalytics: false, // true or false
    umamiWebsiteId: '', // e.g. 123e4567-e89b-12d3-a456-426614174000
    posthogProjectApiKey: '', // e.g. AhnJK8392ndPOav87as450xd
    googleAnalyticsId: '', // e.g. UA-000000-2 or G-XXXXXXX
  },
  newsletter: {
    // supports mailchimp, buttondown, convertkit, klaviyo, revue, emailoctopus
    // Please add your .env file and modify it according to your selection
    provider: null,
  },
  comments: null,
  // search: {
  //   provider: 'kbar', // kbar or algolia
  //   kbarConfig: {
  //     searchDocumentsPath: 'search.json', // path to load documents to search
  //   },
  //   provider: 'algolia',
  //   algoliaConfig: {
  //     // The application ID provided by Algolia
  //     appId: 'R2IYF7ETH7',
  //     // Public API key: it is safe to commit it
  //     apiKey: '599cec31baffa4868cae4e79f180729b',
  //     indexName: 'docsearch',
  //   },
  // },
}

module.exports = siteMetadata
