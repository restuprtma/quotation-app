import { useQuery } from '@tanstack/react-query';

import { getClients } from '../api';

export const CLIENTS_QUERY_KEY = ['clients', 'list'] as const;

export function useClients() {
  return useQuery({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: getClients,
    staleTime: 5 * 60 * 1000,
  });
}
