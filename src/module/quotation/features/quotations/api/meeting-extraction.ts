import type {
  MeetingExtractionStart,
  MeetingExtractionStatus,
  MeetingExtractionStartPayload,
} from '../types/meeting-extraction';

import axios, { toSafeApiError } from 'src/shared/lib/axios';

type ApiEnvelope<T> = {
  data?: T;
};

const extractionUrl = (quotationId: string) =>
  `/quotation/v1/quotations/${quotationId}/meeting-extraction`;

const statusUrl = (quotationId: string, runId: string) => `${extractionUrl(quotationId)}/${runId}`;

function requireData<T>(payload: ApiEnvelope<T>): T {
  if (payload.data !== undefined) return payload.data;

  throw toSafeApiError({
    isAxiosError: true,
    response: { status: 500, data: { code: 'INTERNAL_ERROR' } },
  });
}

export async function startMeetingExtraction(
  quotationId: string,
  payload: MeetingExtractionStartPayload
): Promise<MeetingExtractionStart> {
  const { service_scheme, meeting_notes, pipeline_version, idempotency_key } = payload;
  const response = await axios.post<ApiEnvelope<MeetingExtractionStart>>(extractionUrl(quotationId), {
    service_scheme,
    meeting_notes,
    ...(pipeline_version ? { pipeline_version } : {}),
    ...(idempotency_key ? { idempotency_key } : {}),
  });

  return requireData(response.data);
}

export async function getMeetingExtractionStatus(
  quotationId: string,
  runId: string,
  etag?: string
): Promise<
  | { notModified: true }
  | { notModified: false; data: MeetingExtractionStatus; etag: string | null }
> {
  const response = await axios.get<ApiEnvelope<MeetingExtractionStatus>>(statusUrl(quotationId, runId), {
    headers: etag ? { 'If-None-Match': etag } : undefined,
    validateStatus: (status) => status === 200 || status === 304,
  });

  if (response.status === 304) return { notModified: true };

  return {
    notModified: false,
    data: requireData(response.data),
    etag: response.headers.etag ?? null,
  };
}

export async function retryMeetingExtraction(
  quotationId: string,
  runId: string
): Promise<MeetingExtractionStart> {
  const response = await axios.post<ApiEnvelope<MeetingExtractionStart>>(
    `${statusUrl(quotationId, runId)}/retry`,
    {}
  );

  return requireData(response.data);
}
