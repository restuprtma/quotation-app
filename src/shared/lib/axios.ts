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

export const SAFE_ERROR_MESSAGES = {
  // Existing
  MEETING_NOTES_CHANGED: 'Meeting notes changed. Start a new extraction.',
  AI_BUDGET_EXHAUSTED: 'The AI extraction budget has been exhausted.',
  EXTRACTION_RETRY_CONFLICT: 'This extraction cannot be retried right now.',
  NOT_FOUND: 'The requested resource was not found.',
  INVALID_REQUEST: 'The request could not be processed.',
  INTERNAL_ERROR: 'Unable to process the request.',

  // Meeting extraction codes
  invalid_extraction: 'Meeting notes could not be processed into a draft.',
  'invalid_extraction.malformed_json': 'AI response was not valid JSON.',
  'invalid_extraction.trailing_content': 'AI response contained unexpected trailing content.',
  'invalid_extraction.missing_required_field': 'Meeting notes are missing required fields.',
  'invalid_extraction.unknown_field': 'AI response contained unsupported fields.',
  'invalid_extraction.schema_version': 'Unsupported extraction schema version.',
  'invalid_extraction.state_validation': 'Extraction failed draft validation.',
  'invalid_extraction.unsupported_evidence':
    'Extracted details could not be verified in the meeting notes.',
  'invalid_extraction.unsupported_evidence.client_company':
    'Client company could not be verified in the meeting notes.',
  'invalid_extraction.unsupported_evidence.project_name':
    'Project name could not be verified in the meeting notes.',
  'invalid_extraction.unsupported_evidence.duration_months':
    'Project duration could not be verified in the meeting notes.',
  'invalid_extraction.unsupported_evidence.team':
    'Team information could not be verified in the meeting notes.',
  'invalid_extraction.unsupported_evidence.scope':
    'Scope details could not be verified in the meeting notes.',
  'invalid_extraction.unsupported_evidence.payment_pattern':
    'Payment pattern could not be verified in the meeting notes.',
  'invalid_extraction.unsupported_evidence.commercial_scheme':
    'Commercial scheme could not be verified in the meeting notes.',
  'invalid_extraction.unsupported_evidence.service_input':
    'Service details could not be verified in the meeting notes.',

  // Domain & provider lifecycle codes
  meeting_notes_no_business_signal: 'No recognizable business requirements found in meeting notes.',
  draft_already_processing: 'Draft is currently being processed.',
  draft_already_completed: 'Draft has already been completed.',
  generation_failed: 'Failed to generate quotation draft.',
  provider_timeout: 'AI provider timed out.',
  provider_rate_limited: 'AI provider rate limit reached.',
  provider_auth_error: 'AI provider authentication failed.',
  provider_unavailable: 'AI provider is temporarily unavailable.',
} as const;

export type SafeApiErrorCode = keyof typeof SAFE_ERROR_MESSAGES;

export type SafeApiError = Error & {
  code: SafeApiErrorCode;
  status?: number;
  retryAfter?: number | null;
};

function isSafeErrorCode(code: unknown): code is SafeApiErrorCode {
  return (
    typeof code === 'string' && Object.prototype.hasOwnProperty.call(SAFE_ERROR_MESSAGES, code)
  );
}

function extractSafeCandidate(data: unknown): SafeApiErrorCode | null {
  if (!data || typeof data !== 'object') return null;

  const payload = data as {
    code?: unknown;
    errors?: unknown;
  };

  // 1. Check candidate payload.code (if string and in SAFE_ERROR_MESSAGES)
  if (isSafeErrorCode(payload.code)) {
    return payload.code;
  }

  // 2. Check candidate from payload.errors.detail (if array of strings, check detail[0] in SAFE_ERROR_MESSAGES)
  if (payload.errors && typeof payload.errors === 'object') {
    const detail = (payload.errors as { detail?: unknown }).detail;
    if (Array.isArray(detail) && detail.length > 0 && isSafeErrorCode(detail[0])) {
      return detail[0];
    }
  }

  // 3. Check candidate payload.errors (if string and in SAFE_ERROR_MESSAGES)
  if (isSafeErrorCode(payload.errors)) {
    return payload.errors;
  }

  return null;
}

export function toSafeApiError(error: unknown): SafeApiError {
  const axiosError = axios.isAxiosError(error);
  const data = axiosError ? error.response?.data : null;
  const safeCode = extractSafeCandidate(data);
  const code: SafeApiErrorCode = safeCode ?? 'INTERNAL_ERROR';
  const safe = new Error(SAFE_ERROR_MESSAGES[code]);

  Object.assign(safe, {
    code,
    status: axiosError ? error.response?.status : undefined,
    retryAfter:
      data && typeof (data as { retry_after?: unknown }).retry_after === 'number'
        ? (data as { retry_after: number }).retry_after
        : null,
  });

  return safe as SafeApiError;
}

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
        return Promise.reject(toSafeApiError(error));
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
        return Promise.reject(toSafeApiError(refreshError));
      }
    }

    return Promise.reject(toSafeApiError(error));
  }
);

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
    clientOrganizations: {
      root: '/quotation/v1/client-organizations',
    },
    quotations: {
      list: '/quotation/v1/quotations',
      byId: (id: string) => `/quotation/v1/quotations/${id}`,
      create: '/quotation/v1/quotations',
      update: (id: string) => `/quotation/v1/quotations/${id}`,
      generate: '/quotation/v1/quotations/generate',
      fromMeeting: '/quotation/v1/quotations/from-meeting',
      processMeeting: (id: string) => `/quotation/v1/quotations/${id}/process-meeting`,
      promptState: (id: string) => `/quotation/v1/quotations/${id}/prompt-state`,
      reviseSection: (id: string) => `/quotation/v1/quotations/${id}/revise-section`,
      preview: '/quotation/v1/quotations/preview',
      subscriptionPreview: '/quotation/v1/quotations/preview/subscription-saas',
      whiteLabelPreview: '/quotation/v1/quotations/preview/white-label',
      standaloneMaintenancePreview: '/quotation/v1/quotations/preview/standalone-maintenance',
      customDevelopmentPreview: '/quotation/v1/quotations/preview/custom-development',
      kioskQueuePreview: '/quotation/v1/quotations/preview/kiosk-queue-system',
      talentOutsourcingPreview: '/quotation/v1/quotations/preview/talent-outsourcing',
      cloudInfrastructurePreview: '/quotation/v1/quotations/preview/cloud-infrastructure',
      regenerate: (id: string) => `/quotation/v1/quotations/${id}/regenerate`,
      generationStatus: (id: string) => `/quotation/v1/quotations/${id}/generation-status`,
      saveDraft: (id: string) => `/quotation/v1/quotations/${id}/draft`,
      publish: (id: string) => `/quotation/v1/quotations/${id}/publish`,
      revisions: (id: string) => `/quotation/v1/quotations/${id}/revisions`,
    },
    public: {
      get: (token: string) => `/p/q/${token}`,
      sign: (token: string) => `/p/q/${token}/sign`,
    },
    ai: {
      skills: '/quotation/v1/ai/skills',
      settings: '/quotation/v1/ai/settings',
    },
    settings: {
      signature: '/quotation/v1/settings/signature',
    },
    rateCards: {
      list: '/quotation/v1/rate-cards',
      byId: (id: string) => `/quotation/v1/rate-cards/${id}`,
      details: (id: string) => `/quotation/v1/rate-cards/${id}/details`,
      create: '/quotation/v1/rate-cards',
      delete: (id: string) => `/quotation/v1/rate-cards/${id}`,
    },
    blueprints: {
      root: '/quotation/v1/blueprints',
      generate: '/quotation/v1/blueprints/generate',
      byId: (id: string) => `/quotation/v1/blueprints/${id}`,
      generationStatus: (id: string) => `/quotation/v1/blueprints/${id}/generation-status`,
      continue: (id: string) => `/quotation/v1/blueprints/${id}/continue`,
      retrySection: (id: string, section: string) =>
        `/quotation/v1/blueprints/${id}/sections/${section}/retry`,
      manualComplete: (id: string, section: string) =>
        `/quotation/v1/blueprints/${id}/sections/${section}/manual`,
      draftSection: (id: string, section: string) =>
        `/quotation/v1/blueprints/${id}/sections/${section}/draft`,
      publish: (id: string) => `/quotation/v1/blueprints/${id}/publish`,
      revisions: (id: string) => `/quotation/v1/blueprints/${id}/revisions`,
      deleteDraft: (id: string) => `/quotation/v1/blueprints/${id}/draft`,
      shareLinks: (id: string) => `/quotation/v1/blueprints/${id}/share-links`,
      revokeShareLink: (id: string, linkId: string) =>
        `/quotation/v1/blueprints/${id}/share-links/${linkId}`,
    },
  },
} as const;
