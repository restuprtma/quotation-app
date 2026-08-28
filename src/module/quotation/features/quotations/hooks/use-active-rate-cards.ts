import { useQuery } from '@tanstack/react-query';

import { getActiveRateCards } from '../api';

export const RATE_CARDS_QUERY_KEY = ['rate-cards', 'active'] as const;

export function useActiveRateCards() {
  return useQuery({
    queryKey: RATE_CARDS_QUERY_KEY,
    queryFn: getActiveRateCards,
    staleTime: 5 * 60 * 1000,
  });
}
