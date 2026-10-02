import type {
  DraftIssue,
  PromptPatchPayload,
  PromptPatchResponse,
  MeetingDraftResponse,
  PromptRevisionPayload,
  MeetingQuotationPayload,
  PendingMeetingDraftResponse,
} from '../types/prompt-first';

import axios, { endpoints } from 'src/shared/lib/axios';

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  errors?: string | { detail?: string[] } | null;
};

function apiEnvelopeError(payload: ApiEnvelope<unknown>, response?: unknown) {
  const error = new Error(
    typeof payload.errors === 'string'
      ? payload.errors
      : payload.errors?.detail?.[0] ?? payload.message ?? 'generation_failed'
  );
  Object.assign(error, { response });
  return error;
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
    throw apiEnvelopeError(response.data, response);
  }
  return response.data.data;
}

export async function createMeetingDraft(
  payload: MeetingQuotationPayload,
  signal?: AbortSignal
): Promise<PendingMeetingDraftResponse> {
  const response = await axios.post<ApiEnvelope<PendingMeetingDraftResponse>>(
    endpoints.quotation.quotations.fromMeeting,
    payload,
    { signal }
  );
  if (!response.data.data) {
    throw apiEnvelopeError(response.data, response);
  }
  return response.data.data;
}

export async function processMeetingDraft(
  quotationId: string,
  signal?: AbortSignal
): Promise<MeetingDraftResponse> {
  const response = await axios.post<ApiEnvelope<MeetingDraftResponse>>(
    endpoints.quotation.quotations.processMeeting(quotationId),
    {},
    { signal }
  );
  if (!response.data.data) throw apiEnvelopeError(response.data, response);
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
    throw apiEnvelopeError(response.data, response);
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
