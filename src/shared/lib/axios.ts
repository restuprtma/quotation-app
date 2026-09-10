import type { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/shared/config';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
    _skipAuthRefresh?: boolean;
  }
}

type RetriableConfig = InternalAxiosRequestConfig;

type RefreshHandler = (
  refreshToken: string
) => Promise<{ access_token: string; refresh_token: string }>;
type UnauthorizedHandler = () => void;

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl,
  headers: { 'Content-Type': 'application/json' },
});

let getAccessTokenFn: () => string | null = () => null;
let getRefreshTokenFn: () => string | null = () => null;
let refreshHandler: RefreshHandler | null = null;
let onUnauthorized: UnauthorizedHandler | null = null;

let refreshPromise: Promise<string> | null = null;

export function configureAxiosAuth(opts: {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onRefresh: RefreshHandler;
  onUnauthorized: UnauthorizedHandler;
}) {
  getAccessTokenFn = opts.getAccessToken;
  getRefreshTokenFn = opts.getRefreshToken;
  refreshHandler = opts.onRefresh;
  onUnauthorized = opts.onUnauthorized;
}

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessTokenFn();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !original._skipAuthRefresh) {
      const refreshToken = getRefreshTokenFn();
      if (!refreshToken || !refreshHandler) {
        onUnauthorized?.();
        return Promise.reject(normalizeError(error));
      }

      original._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshHandler(refreshToken)
            .then((tokens) => tokens.access_token)
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newAccessToken = await refreshPromise;
        if (!original.headers) {
          original.headers = {} as InternalAxiosRequestConfig['headers'];
        }
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(original);
      } catch (refreshError) {
        onUnauthorized?.();
        return Promise.reject(normalizeError(refreshError));
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

function normalizeError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as
      | { message?: string; errors?: string | { detail?: string[] } | null }
      | undefined;
    let detail = 'Something went wrong!';
    if (typeof payload?.errors === 'string') {
      detail = payload.errors;
    } else if (
      payload?.errors &&
      typeof payload.errors === 'object' &&
      Array.isArray((payload.errors as any).detail) &&
      (payload.errors as any).detail.length > 0
    ) {
      detail = (payload.errors as any).detail[0];
    } else if (payload?.message) {
      detail = payload.message;
    } else if (error.message) {
      detail = error.message;
    }

    const wrapped = new Error(detail);
    (wrapped as Error & { status?: number; response?: any }).status = error.response?.status;
    (wrapped as any).response = error.response;
    return wrapped;
  }
  if (error instanceof Error) return error;
  return new Error('Something went wrong!');
}

export default axiosInstance;

export const fetcher = async <T = unknown>(
  args: string | [string, AxiosRequestConfig]
): Promise<T> => {
  const [url, config] = Array.isArray(args) ? args : [args, {}];
  const res = await axiosInstance.get<T>(url, config);
  return res.data;
};

export function withoutAuthRefresh(config: AxiosRequestConfig = {}): AxiosRequestConfig {
  return { ...config, _skipAuthRefresh: true };
}

export const endpoints = {
  auth: {
    signIn: '/core/v1/auth/signin',
    signUp: '/core/v1/auth/signup',
    google: '/core/v1/auth/google',
    refresh: '/core/v1/auth/refresh',
    logout: '/core/v1/auth/logout',
    logoutAll: '/core/v1/auth/logout-all',
    switchCompany: '/core/v1/auth/switch-company',
    me: '/core/v1/auth/me',
    companies: '/core/v1/auth/companies',
  },
  core: {
    clients: '/core/v1/admin/clients',
  },
  quotation: {
    quotations: {
      list: '/quotation/v1/quotations',
      byId: (id: string) => `/quotation/v1/quotations/${id}`,
      create: '/quotation/v1/quotations',
      update: (id: string) => `/quotation/v1/quotations/${id}`,
      generate: '/quotation/v1/quotations/generate',
      preview: '/quotation/v1/quotations/preview',
      subscriptionPreview: '/quotation/v1/quotations/preview/subscription-saas',
      whiteLabelPreview: '/quotation/v1/quotations/preview/white-label',
      standaloneMaintenancePreview: '/quotation/v1/quotations/preview/standalone-maintenance',
      customDevelopmentPreview: '/quotation/v1/quotations/preview/custom-development',
      kioskQueuePreview: '/quotation/v1/quotations/preview/kiosk-queue-system',
      regenerate: (id: string) => `/quotation/v1/quotations/${id}/regenerate`,
      generationStatus: (id: string) => `/quotation/v1/quotations/${id}/generation-status`,
      saveDraft: (id: string) => `/quotation/v1/quotations/${id}/draft`,
    },
    ai: {
      skills: '/quotation/v1/ai/skills',
      settings: '/quotation/v1/ai/settings',
    },
    rateCards: {
      list: '/quotation/v1/rate-cards',
      byId: (id: string) => `/quotation/v1/rate-cards/${id}`,
      details: (id: string) => `/quotation/v1/rate-cards/${id}/details`,
      create: '/quotation/v1/rate-cards',
      delete: (id: string) => `/quotation/v1/rate-cards/${id}`,
    },
  },
} as const;
