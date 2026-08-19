import type { InitOptions } from 'i18next';

import resourcesToBackend from 'i18next-resources-to-backend';

// ----------------------------------------------------------------------

export const supportedLngs = ['id', 'en'] as const;
export type LangCode = (typeof supportedLngs)[number];

export const fallbackLng: LangCode = 'en';
export const defaultNS = 'common';

export const storageConfig = {
  localStorage: { key: 'i18nextLng', autoDetection: false },
} as const;

// ----------------------------------------------------------------------

export type LangOption = {
  value: LangCode;
  label: string;
  countryCode: string;
  adapterLocale: string;
  numberFormat: { code: string; currency: string };
};

export const allLangs: LangOption[] = [
  {
    value: 'en',
    label: 'English',
    countryCode: 'GB',
    adapterLocale: 'en',
    numberFormat: { code: 'en-US', currency: 'USD' },
  },
  {
    value: 'id',
    label: 'Bahasa Indonesia',
    countryCode: 'ID',
    adapterLocale: 'id',
    numberFormat: { code: 'id-ID', currency: 'IDR' },
  },
];

// ----------------------------------------------------------------------

const productionNamespaces = new Set([
  'auth',
  'common',
  'contract',
  'error',
  'messages',
  'navigation',
  'quotation',
  'settings',
]);

const productionLocaleModules = import.meta.glob(
  ['./langs/*/*.json', '!./langs/*/quotation-skill-lab.json'],
  { import: 'default' }
);

export const i18nResourceLoader = resourcesToBackend((lang: LangCode, namespace: string) => {
  if (import.meta.env.DEV && !productionNamespaces.has(namespace)) {
    return fetch(`/src/locales/langs/${lang}/${namespace}.json`).then((response) =>
      response.json()
    );
  }

  if (!productionNamespaces.has(namespace)) {
    return Promise.reject(new Error(`Unknown locale namespace: ${namespace}`));
  }

  const loader = productionLocaleModules[`./langs/${lang}/${namespace}.json`];

  if (!loader) {
    return Promise.reject(new Error(`Unknown locale resource: ${lang}/${namespace}`));
  }

  return loader();
});

export function i18nOptions(
  lang: LangCode = fallbackLng,
  namespace: string = defaultNS
): InitOptions {
  return {
    supportedLngs,
    fallbackLng,
    lng: lang,
    fallbackNS: defaultNS,
    defaultNS,
    ns: namespace,
    interpolation: { escapeValue: false },
  };
}

export function getCurrentLang(lang?: string): LangOption {
  const fallback = allLangs.find((l) => l.value === fallbackLng) ?? allLangs[0];
  if (!lang) return fallback;
  return allLangs.find((l) => l.value === lang) ?? fallback;
}
