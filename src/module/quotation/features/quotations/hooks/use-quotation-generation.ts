import type {
  GenerateQuotationPayload,
  GenerateQuotationResponse,
  WhiteLabelPreviewResponse,
  KioskQueuePreviewResponse,
  DedicatedSquadPreviewResponse,
  SubscriptionSaaSPreviewResponse,
  CustomDevelopmentPreviewResponse,
  StandaloneMaintenancePreviewResponse,
} from '../types';

import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { normalizeWhiteLabel } from '../constants/white-label';
import { normalizeSubscriptionSaaS } from '../constants/subscription-saas';
import { normalizeKioskQueueSystem } from '../constants/kiosk-queue-system';
import { normalizeCustomDevelopment } from '../constants/custom-development';
import { normalizeStandaloneMaintenance } from '../constants/standalone-maintenance';
import {
  generateQuotation,
  previewWhiteLabel,
  previewDedicatedSquad,
  previewKioskQueueSystem,
  previewSubscriptionSaaS,
  previewCustomDevelopment,
  previewStandaloneMaintenance,
} from '../api';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r % 4) + 8;
    return v.toString(16);
  });
}

export function useGenerateQuotation() {
  const queryClient = useQueryClient();

  return useMutation<GenerateQuotationResponse, Error, GenerateQuotationPayload>({
    mutationFn: (payload) => {
      const payloadWithIdempotency: GenerateQuotationPayload = {
        ...payload,
        idempotency_key: payload.idempotency_key || generateUUID(),
      };
      return generateQuotation(payloadWithIdempotency);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', data.quotation_id] });
    },
  });
}

export const DEDICATED_SQUAD_PREVIEW_QUERY_KEY = ['quotation', 'dedicated-squad-preview'] as const;

/** Keep query keys small and stable while still invalidating every meaningful form change. */
export function normalizeDedicatedSquadPreviewPayload(
  payload: GenerateQuotationPayload | null | undefined
) {
  if (!payload || payload.commercial_scheme !== 'dedicated_squad') return null;

  const squad = payload.dedicated_squad;
  return {
    rate_card_id: payload.rate_card_id,
    dedicated_squad: {
      ...squad,
      development_squad: squad.development_squad.map((line) => ({ ...line })),
      maintenance_squad: squad.maintenance_squad.map((line) => ({ ...line })),
      quotation_profile: squad.quotation_profile
        ? {
            ...squad.quotation_profile,
            included_phases: squad.quotation_profile.included_phases
              ? [...squad.quotation_profile.included_phases]
              : undefined,
            payment_rows: squad.quotation_profile.payment_rows?.map((row) => ({ ...row })),
            document_options: squad.quotation_profile.document_options
              ? {
                  ...squad.quotation_profile.document_options,
                  clause_codes: squad.quotation_profile.document_options.clause_codes
                    ? [...squad.quotation_profile.document_options.clause_codes]
                    : undefined,
                }
              : undefined,
          }
        : undefined,
    },
  };
}

/**
 * Debounced server-authoritative preview. TanStack Query supplies an AbortSignal
 * to Axios, so changing a field while a request is in flight cancels stale
 * previews instead of allowing an old total to replace the current one.
 */
export function useDedicatedSquadPreview(
  payload: GenerateQuotationPayload | null | undefined,
  enabled = true
) {
  const normalized = useMemo(() => normalizeDedicatedSquadPreviewPayload(payload), [payload]);
  const [debounced, setDebounced] = useState(normalized);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    if (!enabled || !normalized) {
      setDebounced(null);
      setIsDebouncing(false);
      return undefined;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebounced(normalized);
      setIsDebouncing(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [enabled, normalized]);

  const query = useQuery<DedicatedSquadPreviewResponse, Error>({
    queryKey: [
      ...DEDICATED_SQUAD_PREVIEW_QUERY_KEY,
      debounced ? JSON.stringify(debounced) : 'disabled',
    ],
    queryFn: ({ signal }) => {
      if (!payload || !debounced || payload.commercial_scheme !== 'dedicated_squad') {
        throw new Error('Dedicated squad preview is disabled');
      }
      return previewDedicatedSquad(
        {
          ...payload,
          commercial_scheme: 'dedicated_squad',
          rate_card_id: debounced.rate_card_id,
          dedicated_squad: debounced.dedicated_squad,
        },
        signal
      );
    },
    enabled: Boolean(enabled && payload && debounced),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });

  return { ...query, isDebouncing };
}

export const SUBSCRIPTION_SAAS_PREVIEW_QUERY_KEY = [
  'quotation',
  'subscription-saas-preview',
] as const;

export function normalizeSubscriptionSaaSPreviewPayload(
  payload: GenerateQuotationPayload | null | undefined
) {
  if (!payload || payload.commercial_scheme !== 'subscription_saas') return null;
  return {
    commercial_scheme: payload.commercial_scheme,
    subscription_saas: normalizeSubscriptionSaaS(payload.subscription_saas),
  };
}

/**
 * Debounced server-authoritative preview for Subscription SaaS. TanStack Query
 * supplies an AbortSignal to Axios, so rapid typing cancels stale in-flight
 * preview requests.
 */
export function useSubscriptionSaaSPreview(
  payload: GenerateQuotationPayload | null | undefined,
  enabled = true
) {
  const normalized = useMemo(() => normalizeSubscriptionSaaSPreviewPayload(payload), [payload]);
  const [debounced, setDebounced] = useState(normalized);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    if (!enabled || !normalized) {
      setDebounced(null);
      setIsDebouncing(false);
      return undefined;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebounced(normalized);
      setIsDebouncing(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [enabled, normalized]);

  const query = useQuery<SubscriptionSaaSPreviewResponse, Error>({
    queryKey: [
      ...SUBSCRIPTION_SAAS_PREVIEW_QUERY_KEY,
      debounced ? JSON.stringify(debounced) : 'disabled',
    ],
    queryFn: ({ signal }) => {
      if (!payload || !debounced || payload.commercial_scheme !== 'subscription_saas') {
        throw new Error('Subscription SaaS preview is disabled');
      }
      return previewSubscriptionSaaS(
        {
          ...payload,
          commercial_scheme: 'subscription_saas',
          subscription_saas: debounced.subscription_saas,
        },
        signal
      );
    },
    enabled: Boolean(enabled && payload && debounced),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });

  return { ...query, isDebouncing };
}

export const WHITE_LABEL_PREVIEW_QUERY_KEY = ['quotation', 'white-label-preview'] as const;

export function normalizeWhiteLabelPreviewPayload(
  payload: GenerateQuotationPayload | null | undefined
) {
  if (!payload || payload.commercial_scheme !== 'white_label') return null;
  return {
    commercial_scheme: payload.commercial_scheme,
    white_label: normalizeWhiteLabel(payload.white_label),
  };
}

/**
 * Debounced server-authoritative preview for White Label. TanStack Query
 * supplies an AbortSignal to Axios, so rapid typing cancels stale in-flight
 * preview requests.
 */
export function useWhiteLabelPreview(
  payload: GenerateQuotationPayload | null | undefined,
  enabled = true
) {
  const normalized = useMemo(() => normalizeWhiteLabelPreviewPayload(payload), [payload]);
  const [debounced, setDebounced] = useState(normalized);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    if (!enabled || !normalized) {
      setDebounced(null);
      setIsDebouncing(false);
      return undefined;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebounced(normalized);
      setIsDebouncing(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [enabled, normalized]);

  const query = useQuery<WhiteLabelPreviewResponse, Error>({
    queryKey: [
      ...WHITE_LABEL_PREVIEW_QUERY_KEY,
      debounced ? JSON.stringify(debounced) : 'disabled',
    ],
    queryFn: ({ signal }) => {
      if (!payload || !debounced || payload.commercial_scheme !== 'white_label') {
        throw new Error('White Label preview is disabled');
      }
      return previewWhiteLabel(
        {
          ...payload,
          commercial_scheme: 'white_label',
          white_label: debounced.white_label,
        },
        signal
      );
    },
    enabled: Boolean(enabled && payload && debounced),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });

  return { ...query, isDebouncing };
}

export const STANDALONE_MAINTENANCE_PREVIEW_QUERY_KEY = [
  'quotation',
  'standalone-maintenance-preview',
] as const;

export function normalizeStandaloneMaintenancePreviewPayload(
  payload: GenerateQuotationPayload | null | undefined
) {
  if (!payload || payload.commercial_scheme !== 'standalone_maintenance') return null;
  return {
    commercial_scheme: payload.commercial_scheme,
    standalone_maintenance: normalizeStandaloneMaintenance(payload.standalone_maintenance),
  };
}

/**
 * Debounced server-authoritative preview for Standalone Maintenance. TanStack Query
 * supplies an AbortSignal to Axios, so rapid typing cancels stale in-flight
 * preview requests.
 */
export function useStandaloneMaintenancePreview(
  payload: GenerateQuotationPayload | null | undefined,
  enabled = true
) {
  const normalized = useMemo(
    () => normalizeStandaloneMaintenancePreviewPayload(payload),
    [payload]
  );
  const [debounced, setDebounced] = useState(normalized);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    if (!enabled || !normalized) {
      setDebounced(null);
      setIsDebouncing(false);
      return undefined;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebounced(normalized);
      setIsDebouncing(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [enabled, normalized]);

  const query = useQuery<StandaloneMaintenancePreviewResponse, Error>({
    queryKey: [
      ...STANDALONE_MAINTENANCE_PREVIEW_QUERY_KEY,
      debounced ? JSON.stringify(debounced) : 'disabled',
    ],
    queryFn: ({ signal }) => {
      if (!payload || !debounced || payload.commercial_scheme !== 'standalone_maintenance') {
        throw new Error('Standalone maintenance preview is disabled');
      }
      return previewStandaloneMaintenance(
        {
          ...payload,
          commercial_scheme: 'standalone_maintenance',
          standalone_maintenance: debounced.standalone_maintenance,
        },
        signal
      );
    },
    enabled: Boolean(enabled && payload && debounced),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });

  return { ...query, isDebouncing };
}

export const CUSTOM_DEVELOPMENT_PREVIEW_QUERY_KEY = [
  'quotation',
  'custom-development-preview',
] as const;

export function normalizeCustomDevelopmentPreviewPayload(
  payload: GenerateQuotationPayload | null | undefined
) {
  if (!payload || payload.commercial_scheme !== 'custom_development') return null;
  return {
    commercial_scheme: payload.commercial_scheme,
    custom_development: normalizeCustomDevelopment(payload.custom_development),
  };
}

/**
 * Debounced server-authoritative preview for Custom Development. TanStack Query
 * supplies an AbortSignal to Axios, so rapid typing cancels stale in-flight
 * preview requests.
 */
export function useCustomDevelopmentPreview(
  payload: GenerateQuotationPayload | null | undefined,
  enabled = true
) {
  const normalized = useMemo(
    () => normalizeCustomDevelopmentPreviewPayload(payload),
    [payload]
  );
  const [debounced, setDebounced] = useState(normalized);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    if (!enabled || !normalized) {
      setDebounced(null);
      setIsDebouncing(false);
      return undefined;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebounced(normalized);
      setIsDebouncing(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [enabled, normalized]);

  const query = useQuery<CustomDevelopmentPreviewResponse, Error>({
    queryKey: [
      ...CUSTOM_DEVELOPMENT_PREVIEW_QUERY_KEY,
      debounced ? JSON.stringify(debounced) : 'disabled',
    ],
    queryFn: ({ signal }) => {
      if (!payload || !debounced || payload.commercial_scheme !== 'custom_development') {
        throw new Error('Custom development preview is disabled');
      }
      return previewCustomDevelopment(
        {
          ...payload,
          commercial_scheme: 'custom_development',
          custom_development: debounced.custom_development,
        },
        signal
      );
    },
    enabled: Boolean(enabled && payload && debounced),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });

  return { ...query, isDebouncing };
}

export const KIOSK_QUEUE_PREVIEW_QUERY_KEY = [
  'quotation',
  'kiosk-queue-preview',
] as const;

export function normalizeKioskQueuePreviewPayload(
  payload: GenerateQuotationPayload | null | undefined
) {
  if (!payload || payload.commercial_scheme !== 'kiosk_queue_system') return null;
  return {
    commercial_scheme: payload.commercial_scheme,
    kiosk_queue_system: normalizeKioskQueueSystem(payload.kiosk_queue_system),
  };
}

/**
 * Debounced server-authoritative preview for Kiosk Queue System. TanStack Query
 * supplies an AbortSignal to Axios, so rapid typing cancels stale in-flight
 * preview requests.
 */
export function useKioskQueuePreview(
  payload: GenerateQuotationPayload | null | undefined,
  enabled = true
) {
  const normalized = useMemo(
    () => normalizeKioskQueuePreviewPayload(payload),
    [payload]
  );
  const [debounced, setDebounced] = useState(normalized);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    if (!enabled || !normalized) {
      setDebounced(null);
      setIsDebouncing(false);
      return undefined;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebounced(normalized);
      setIsDebouncing(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [enabled, normalized]);

  const query = useQuery<KioskQueuePreviewResponse, Error>({
    queryKey: [
      ...KIOSK_QUEUE_PREVIEW_QUERY_KEY,
      debounced ? JSON.stringify(debounced) : 'disabled',
    ],
    queryFn: ({ signal }) => {
      if (!payload || !debounced || payload.commercial_scheme !== 'kiosk_queue_system') {
        throw new Error('Kiosk queue preview is disabled');
      }
      return previewKioskQueueSystem(
        {
          ...payload,
          commercial_scheme: 'kiosk_queue_system',
          kiosk_queue_system: debounced.kiosk_queue_system,
        },
        signal
      );
    },
    enabled: Boolean(enabled && payload && debounced),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });

  return { ...query, isDebouncing };
}

