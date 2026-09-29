import type {
  DraftIssue,
  PromptPatchPayload,
  PromptPatchResponse,
  MeetingDraftResponse,
  PromptRevisionPayload,
  MeetingQuotationPayload,
} from '../types/prompt-first';

import axios, { endpoints } from 'src/shared/lib/axios';

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  errors?: string | { detail?: string[] } | null;
};

function extractError(payload: ApiEnvelope<unknown>) {
  if (typeof payload.errors === 'string') return payload.errors;
  return payload.errors?.detail?.[0] ?? payload.message ?? 'generation_failed';
}

export async function revisePromptQuotationSection(
  quotationID: string,
  payload: PromptRevisionPayload,
  signal?: AbortSignal
): Promise<PromptPatchResponse> {
  const response = await axios.post<ApiEnvelope<PromptPatchResponse>>(
    endpoints.quotation.quotations.reviseSection(quotationID),
    payload,
    { signal }
  );
  if (!response.data.data) {
    const error = new Error(extractError(response.data));
    Object.assign(error, { response });
    throw error;
  }
  return response.data.data;
}

export async function createQuotationFromMeeting(
  payload: MeetingQuotationPayload,
  signal?: AbortSignal
): Promise<MeetingDraftResponse> {
  const response = await axios.post<ApiEnvelope<MeetingDraftResponse>>(
    endpoints.quotation.quotations.fromMeeting,
    payload,
    { signal }
  );
  if (!response.data.data) {
    const error = new Error(extractError(response.data));
    Object.assign(error, { response });
    throw error;
  }
  return response.data.data;
}

export async function patchPromptQuotation(
  quotationID: string,
  payload: PromptPatchPayload,
  signal?: AbortSignal
): Promise<PromptPatchResponse> {
  const response = await axios.patch<ApiEnvelope<PromptPatchResponse>>(
    endpoints.quotation.quotations.promptState(quotationID),
    payload,
    { signal }
  );
  if (!response.data.data) {
    const error = new Error(extractError(response.data));
    Object.assign(error, { response });
    throw error;
  }
  return response.data.data;
}

export function getPromptIssues(error: unknown): DraftIssue[] {
  const response = (error as { response?: { data?: ApiEnvelope<{ issues?: DraftIssue[] }> } })
    ?.response;
  const payload = response?.data;
  const issues = payload?.data?.issues;
  if (Array.isArray(issues)) return issues;
  const codes =
    payload?.errors && typeof payload.errors === 'object' ? (payload.errors.detail ?? []) : [];
  return codes.map((code) => ({ code, field: '', message: code, severity: 'blocking' as const }));
}
