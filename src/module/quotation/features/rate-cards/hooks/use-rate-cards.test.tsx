// @vitest-environment happy-dom
import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';
import { it, vi, expect, describe, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import axios, { endpoints } from 'src/shared/lib/axios';

import type {
  RateCardItem,
  RateCardDetailResponse,
  CreateRateCardItemPayload,
  UpdateRateCardItemPayload,
} from '../types';

import {
  RATE_CARDS_KEYS,
  useSetDefaultRateCard,
  useCreateRateCardItem,
  useUpdateRateCardItem,
  useDeleteRateCardItem,
} from './use-rate-cards';
import {
  setDefaultRateCard,
  createRateCardItem,
  updateRateCardItem,
  deleteRateCardItem,
} from '../api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

const mockRateCardDetail: RateCardDetailResponse = {
  id: 'rc-1',
  code: 'RC-001',
  name: 'Standard Rate Card',
  market: 'national',
  client_tier: 'commercial_national',
  currency: 'IDR',
  description: 'Standard rates',
  short_term_surcharge_pct: 15,
  enterprise_markup_pct: 20,
  is_active: true,
  is_default: true,
  effective_from: '2026-01-01',
  items: [],
  created_at: '2026-01-01T00:00:00Z',
};

const mockItem: RateCardItem = {
  id: 'item-1',
  rate_card_id: 'rc-1',
  role: 'fullstack_developer',
  display_name: 'Full Stack Developer',
  seniority: 'senior',
  discipline: 'ENGINEERING',
  term_type: 'long_term',
  amount_per_month: 20000000,
  base_salary: 20000000,
  tech_lead_fee: 0,
  ai_rnd_fee: 0,
  workspace_fee: 0,
  management_fee: 0,
  daily_rate: 909090,
  hourly_rate: 113636,
  education_requirement: 'S1/D4',
  experience_requirement: '> 2 th',
  published_rate: 20000000,
  max_discount_pct: 10,
  floor_rate: 18000000,
  kickoff_fee: 0,
  recruitment_fee: 0,
  onboarding_fee: 0,
  total_hiring_fee: 0,
};

describe('Rate card item CRUD and default switch endpoints, API functions, and hooks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Axios endpoints', () => {
    it('defines setDefault endpoint correctly', () => {
      expect((endpoints as any).quotation.rateCards.setDefault('rc-1')).toBe(
        '/quotation/v1/rate-cards/rc-1/set-default'
      );
    });

    it('defines items endpoint correctly', () => {
      expect((endpoints as any).quotation.rateCards.items('rc-1')).toBe(
        '/quotation/v1/rate-cards/rc-1/items'
      );
    });

    it('defines itemById endpoint correctly', () => {
      expect((endpoints as any).quotation.rateCards.itemById('rc-1', 'item-1')).toBe(
        '/quotation/v1/rate-cards/rc-1/items/item-1'
      );
    });
  });

  describe('API functions', () => {
    it('setDefaultRateCard calls axios.post with setDefault endpoint and unwraps data', async () => {
      const postSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: mockRateCardDetail,
          message: 'Rate card set as default successfully',
        },
      });

      const result = await setDefaultRateCard('rc-1');

      expect(postSpy).toHaveBeenCalledWith('/quotation/v1/rate-cards/rc-1/set-default');
      expect(result).toEqual(mockRateCardDetail);
    });

    it('createRateCardItem calls axios.post with items endpoint and unwraps data', async () => {
      const payload: CreateRateCardItemPayload = {
        role: 'fullstack_developer',
        display_name: 'Full Stack Developer',
        seniority: 'senior',
        discipline: 'ENGINEERING',
        term_type: 'long_term',
        amount_per_month: 20000000,
      };

      const postSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: mockItem,
          message: 'Rate card item created successfully',
        },
      });

      const result = await createRateCardItem('rc-1', payload);

      expect(postSpy).toHaveBeenCalledWith('/quotation/v1/rate-cards/rc-1/items', payload);
      expect(result).toEqual(mockItem);
    });

    it('updateRateCardItem calls axios.put with itemById endpoint and unwraps data', async () => {
      const payload: UpdateRateCardItemPayload = {
        amount_per_month: 25000000,
      };

      const updatedItem = { ...mockItem, amount_per_month: 25000000 };
      const putSpy = vi.spyOn(axios, 'put').mockResolvedValueOnce({
        data: {
          data: updatedItem,
          message: 'Rate card item updated successfully',
        },
      });

      const result = await updateRateCardItem('rc-1', 'item-1', payload);

      expect(putSpy).toHaveBeenCalledWith(
        '/quotation/v1/rate-cards/rc-1/items/item-1',
        payload
      );
      expect(result).toEqual(updatedItem);
    });

    it('deleteRateCardItem calls axios.delete with itemById endpoint', async () => {
      const deleteSpy = vi.spyOn(axios, 'delete').mockResolvedValueOnce({
        data: {
          data: null,
          message: 'Rate card item deleted successfully',
        },
      });

      await deleteRateCardItem('rc-1', 'item-1');

      expect(deleteSpy).toHaveBeenCalledWith('/quotation/v1/rate-cards/rc-1/items/item-1');
    });
  });

  describe('React Query hooks', () => {
    it('useSetDefaultRateCard calls endpoints.quotation.rateCards.setDefault via POST and invalidates RATE_CARDS_KEYS.all', async () => {
      const { queryClient, wrapper } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const postSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: { ...mockRateCardDetail, is_default: true },
          message: 'Rate card set as default successfully',
        },
      });

      const { result } = renderHook(() => useSetDefaultRateCard(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('rc-1');
      });

      expect(postSpy).toHaveBeenCalledWith(endpoints.quotation.rateCards.setDefault('rc-1'));
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: RATE_CARDS_KEYS.all });
    });

    it('useCreateRateCardItem calls endpoints.quotation.rateCards.items via POST and invalidates RATE_CARDS_KEYS.detail', async () => {
      const { queryClient, wrapper } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const postSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: mockItem,
          message: 'Rate card item created successfully',
        },
      });

      const payload: CreateRateCardItemPayload = {
        role: 'fullstack_developer',
        display_name: 'Full Stack Developer',
        seniority: 'senior',
        discipline: 'ENGINEERING',
        term_type: 'long_term',
        amount_per_month: 20000000,
      };

      const { result } = renderHook(() => useCreateRateCardItem('rc-1'), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(payload);
      });

      expect(postSpy).toHaveBeenCalledWith(endpoints.quotation.rateCards.items('rc-1'), payload);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: RATE_CARDS_KEYS.detail('rc-1') });
    });

    it('useUpdateRateCardItem calls endpoints.quotation.rateCards.itemById via PUT and invalidates RATE_CARDS_KEYS.detail', async () => {
      const { queryClient, wrapper } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const updatedItem = { ...mockItem, amount_per_month: 25000000 };
      const putSpy = vi.spyOn(axios, 'put').mockResolvedValueOnce({
        data: {
          data: updatedItem,
          message: 'Rate card item updated successfully',
        },
      });

      const payload: UpdateRateCardItemPayload = {
        amount_per_month: 25000000,
      };

      const { result } = renderHook(() => useUpdateRateCardItem('rc-1'), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ itemId: 'item-1', payload });
      });

      expect(putSpy).toHaveBeenCalledWith(
        endpoints.quotation.rateCards.itemById('rc-1', 'item-1'),
        payload
      );
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: RATE_CARDS_KEYS.detail('rc-1') });
    });

    it('useDeleteRateCardItem calls endpoints.quotation.rateCards.itemById via DELETE and invalidates RATE_CARDS_KEYS.detail', async () => {
      const { queryClient, wrapper } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const deleteSpy = vi.spyOn(axios, 'delete').mockResolvedValueOnce({
        data: {
          data: null,
          message: 'Rate card item deleted successfully',
        },
      });

      const { result } = renderHook(() => useDeleteRateCardItem('rc-1'), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('item-1');
      });

      expect(deleteSpy).toHaveBeenCalledWith(
        endpoints.quotation.rateCards.itemById('rc-1', 'item-1')
      );
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: RATE_CARDS_KEYS.detail('rc-1') });
    });
  });
});
