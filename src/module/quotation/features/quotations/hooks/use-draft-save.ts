import type {
  SaveDraftPayload,
  SaveDraftResultResponse,
  QuotationGenerationDetail,
} from '../types';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { saveQuotationDraft, regenerateQuotation } from '../api';

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
            legal_content_modified: result.legal_content_modified,
            commercial_content_modified: result.commercial_content_modified,
            updated_at: result.updated_at.toString(),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}

export function useRegenerateQuotation(quotationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => regenerateQuotation(quotationId),
    onSuccess: (result) => {
      queryClient.setQueryData<QuotationGenerationDetail | undefined>(
        ['quotation', 'detail', quotationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content_html: result.content_html,
            content_version: result.content_version,
            generation_status: result.generation_status,
            legal_content_modified: false,
            commercial_content_modified: false,
            updated_at: result.updated_at.toString(),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}
