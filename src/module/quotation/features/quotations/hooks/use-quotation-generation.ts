import type { GenerateQuotationPayload, GenerateQuotationResponse } from '../types';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { generateQuotation } from '../api';

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
