import type { ShareLinkItem, CreateShareLinkPayload, CreateShareLinkResponse } from '../types/share-links';

import axios, { endpoints } from 'src/shared/lib/axios';

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

export async function createShareLink(
  blueprintId: string,
  payload: CreateShareLinkPayload
): Promise<CreateShareLinkResponse> {
  return unwrap<CreateShareLinkResponse>(
    axios.post(endpoints.quotation.blueprints.shareLinks(blueprintId), payload)
  );
}

export async function listShareLinks(blueprintId: string): Promise<ShareLinkItem[]> {
  return unwrap<ShareLinkItem[]>(
    axios.get(endpoints.quotation.blueprints.shareLinks(blueprintId))
  );
}

export async function revokeShareLink(blueprintId: string, linkId: string): Promise<void> {
  await axios.delete(endpoints.quotation.blueprints.revokeShareLink(blueprintId, linkId));
}
