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
    },
    contract: {
      root: '/contract',
      edit: (id: string) => `/contract/${id}/edit`,
    },
  },
  public: {
    quotation: (token: string) => `/p/q/${token}`,
    blueprint: (token: string) => `/p/b/${token}`,
    detail: (token: string) => `/p/d/${token}`,
    contract: (token: string) => `/p/c/${token}`,
  },
};
