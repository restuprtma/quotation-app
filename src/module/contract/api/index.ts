import type {
  Contract,
  PublicContract,
  SignContractPayload,
  CreateContractPayload,
  UpdateContractPayload,
} from '../types';

import axios, { withoutAuthRefresh } from 'src/shared/lib/axios';

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  errors?: string | { detail?: string[] } | null;
};

function extractError(payload: ApiEnvelope<unknown>) {
  if (!payload.errors) return payload.message ?? 'Empty response';
  if (typeof payload.errors === 'string') return payload.errors;
  return payload.errors.detail?.[0] ?? payload.message ?? 'Request failed';
}

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>) {
  const response = await promise;
  if (response.data.data === undefined || response.data.data === null) {
    throw new Error(extractError(response.data));
  }
  return response.data.data;
}

export const contractApi = {
  // Internal API
  create: (payload: CreateContractPayload) =>
    unwrap<Contract>(axios.post('/contract/v1/contracts', payload)),

  list: () => unwrap<Contract[]>(axios.get('/contract/v1/contracts')),

  get: (id: string) => unwrap<Contract>(axios.get(`/contract/v1/contracts/${id}`)),

  update: (id: string, payload: UpdateContractPayload) =>
    unwrap<Contract>(axios.put(`/contract/v1/contracts/${id}`, payload)),

  share: (id: string) => unwrap<Contract>(axios.post(`/contract/v1/contracts/${id}/share`)),

  // Public API
  getPublic: (token: string) =>
    unwrap<PublicContract>(axios.get(`/p/c/${token}`, withoutAuthRefresh())),

  signPublic: (token: string, payload: SignContractPayload) =>
    unwrap<null>(axios.post(`/p/c/${token}/sign`, payload, withoutAuthRefresh())),
};
