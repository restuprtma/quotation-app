import type {
  SaveDraftPayload,
  SaveDraftResultResponse,
  QuotationGenerationDetail,
} from '../types';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { saveQuotationDraft } from '../api';

export function useSaveDraft(quotationId: string) {
  const queryClient = useQueryClient();

  return useMutation<SaveDraftResultResponse, Error, SaveDraftPayload>({
    mutationFn: (payload) => saveQuotationDraft(quotationId, payload),
    onSuccess: (result) => {
      queryClient.setQueryData<QuotationGenerationDetail | undefined>(
        ['quotation', 'detail', quotationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content_html: result.content_html,
            content_version: result.content_version,
            updated_at: result.updated_at.toString(),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}
