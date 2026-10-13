import type { SignPublicQuotationPayload } from '../types/public';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { publicQuotationApi } from '../api/public';

export const publicQuotationQueryKeys = {
  detail: (token: string) => ['public-quotation', token] as const,
};

export function usePublicQuotation(token: string) {
  return useQuery({
    queryKey: publicQuotationQueryKeys.detail(token),
    queryFn: () => publicQuotationApi.getPublic(token),
    enabled: Boolean(token),
    retry: false,
    staleTime: 60 * 1000,
  });
}

export function useSignPublicQuotation(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SignPublicQuotationPayload) =>
      publicQuotationApi.signPublic(token, payload),
    onSuccess: (updatedData) => {
      queryClient.setQueryData(publicQuotationQueryKeys.detail(token), updatedData);
      queryClient.invalidateQueries({ queryKey: publicQuotationQueryKeys.detail(token) });
    },
  });
}
