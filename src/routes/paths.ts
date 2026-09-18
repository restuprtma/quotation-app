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
      detail: (id: string) => `/blueprint/${id}`,
    },
  },
  public: {
    contract: (token: string) => `/p/c/${token}`,
  },
};
