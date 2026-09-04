import type {
  GenerateQuotationPayload,
  GenerateQuotationResponse,
  DedicatedSquadPreviewResponse,
} from '../types';

import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { generateQuotation, previewDedicatedSquad } from '../api';

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
  if (!payload) return null;

  const squad = payload.dedicated_squad;
  return {
    rate_card_id: payload.rate_card_id,
    dedicated_squad: {
      ...squad,
      development_squad: squad.development_squad.map((line) => ({ ...line })),
      maintenance_squad: squad.maintenance_squad.map((line) => ({ ...line })),
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
      if (!payload || !debounced) {
        throw new Error('Dedicated squad preview is disabled');
      }
      return previewDedicatedSquad(
        {
          ...payload,
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
