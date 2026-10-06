import type { PublicQuotation, SignPublicQuotationPayload } from '../types/public';

import axios, { endpoints, withoutAuthRefresh } from 'src/shared/lib/axios';

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  errors?: string | { detail?: string[] } | null;
};

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const response = await promise;
  if (response.data.data === undefined || response.data.data === null) {
    const errorMsg =
      typeof response.data.errors === 'string'
        ? response.data.errors
        : response.data.message ?? 'Request failed';
    throw new Error(errorMsg);
  }
  return response.data.data;
}

export const publicQuotationApi = {
  getPublic: (token: string) =>
    unwrap<PublicQuotation>(
      axios.get(endpoints.quotation.public.get(token), withoutAuthRefresh())
    ),

  signPublic: (token: string, payload: SignPublicQuotationPayload) =>
    unwrap<PublicQuotation>(
      axios.post(endpoints.quotation.public.sign(token), payload, withoutAuthRefresh())
    ),
};
