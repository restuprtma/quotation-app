import type {
  RateCardItem,
  RateCardListParams,
  CreateRateCardPayload,
  RateCardDetailResponse,
  RateCardSummaryResponse,
  CreateRateCardItemPayload,
  UpdateRateCardItemPayload,
  UpdateRateCardItemArgs,
} from '../types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getRateCards,
  createRateCard,
  deleteRateCard,
  getRateCardDetail,
  setDefaultRateCard,
  createRateCardItem,
  updateRateCardItem,
  deleteRateCardItem,
} from '../api';

export const RATE_CARDS_KEYS = {
  all: ['rate-cards'] as const,
  lists: () => [...RATE_CARDS_KEYS.all, 'list'] as const,
  list: (params?: RateCardListParams) => [...RATE_CARDS_KEYS.lists(), params] as const,
  details: () => [...RATE_CARDS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...RATE_CARDS_KEYS.details(), id] as const,
};

export function useRateCards(activeOnly?: boolean, search?: string) {
  const params: RateCardListParams = {
    active_only: activeOnly,
    search: search?.trim() ? search.trim() : undefined,
  };

  return useQuery<RateCardSummaryResponse[], Error>({
    queryKey: RATE_CARDS_KEYS.list(params),
    queryFn: () => getRateCards(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useRateCardDetail(id: string) {
  return useQuery<RateCardDetailResponse, Error>({
    queryKey: RATE_CARDS_KEYS.detail(id),
    queryFn: () => getRateCardDetail(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRateCard() {
  const queryClient = useQueryClient();

  return useMutation<RateCardDetailResponse, Error, CreateRateCardPayload>({
    mutationFn: createRateCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RATE_CARDS_KEYS.all });
    },
  });
}

export function useDeleteRateCard() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteRateCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RATE_CARDS_KEYS.all });
    },
  });
}

export function useSetDefaultRateCard() {
  const queryClient = useQueryClient();

  return useMutation<RateCardDetailResponse, Error, string>({
    mutationFn: setDefaultRateCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RATE_CARDS_KEYS.all });
    },
  });
}

export function useCreateRateCardItem(rateCardId: string) {
  const queryClient = useQueryClient();

  return useMutation<RateCardItem, Error, CreateRateCardItemPayload>({
    mutationFn: (payload: CreateRateCardItemPayload) => createRateCardItem(rateCardId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RATE_CARDS_KEYS.detail(rateCardId) });
    },
  });
}

export function useUpdateRateCardItem(rateCardId: string) {
  const queryClient = useQueryClient();

  return useMutation<RateCardItem, Error, UpdateRateCardItemArgs>({
    mutationFn: ({ itemId, payload }: UpdateRateCardItemArgs) =>
      updateRateCardItem(rateCardId, itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RATE_CARDS_KEYS.detail(rateCardId) });
    },
  });
}

export function useDeleteRateCardItem(rateCardId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (itemId: string) => deleteRateCardItem(rateCardId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RATE_CARDS_KEYS.detail(rateCardId) });
    },
  });
}
