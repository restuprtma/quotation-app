import type { SharedBlueprintData } from '../types';

import axios, { withoutAuthRefresh } from 'src/shared/lib/axios';

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

export const sharedBlueprintApi = {
  getShared: (token: string) =>
    unwrap<SharedBlueprintData>(
      axios.get(`/p/blueprint/${token}`, withoutAuthRefresh())
    ),
};
