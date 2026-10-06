const ROOTS = {
  AUTH: '/auth',
};

export const paths = {
  auth: {
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
    },
  },
  dashboard: {
    root: '/',
    quotation: {
      root: '/quotation',
      prompt: '/quotation',
      advanced: '/quotation?view=advanced',
      advancedScheme: (scheme: string) =>
        `/quotation?view=advanced&scheme=${encodeURIComponent(scheme)}`,
      list: '/quotation/list',
      edit: (id: string) => `/quotation/${id}/edit`,
      aiSettings: '/quotation/ai-settings',
      rateCards: '/quotation/rate-cards',
      rateCardDetail: (id: string) => `/quotation/rate-cards/${id}`,
    },
    contract: {
      root: '/contract',
      edit: (id: string) => `/contract/${id}/edit`,
    },
    blueprint: {
      root: '/blueprint',
      create: '/blueprint',
      process: '/blueprint/process',
      list: '/blueprint/list',
      detail: (id: string) => `/blueprint/${id}`,
      edit: (id: string) => `/blueprint/${id}/edit`,
    },
  },
  public: {
    contract: (token: string) => `/p/c/${token}`,
    quotation: (token: string) => `/p/q/${token}`,
    blueprint: (token: string) => `/p/blueprint/${token}`,
  },
};

