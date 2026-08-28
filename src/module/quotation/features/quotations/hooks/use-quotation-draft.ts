import { useQuery } from '@tanstack/react-query';

import { getQuotationDetail, getGenerationStatus } from '../api';

export function useQuotationDraft(id?: string | null) {
  return useQuery({
    queryKey: ['quotation', 'detail', id],
    queryFn: () => getQuotationDetail(id!),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

export function useGenerationStatus(id?: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['quotation', 'status', id],
    queryFn: () => getGenerationStatus(id!),
    enabled: Boolean(id) && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.generation_status;
      if (status === 'completed' || status === 'failed') return false;
      return 2000;
    },
  });
}
