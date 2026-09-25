import type {
  ActiveSkill,
  ClientSummary,
  RateCardSummary,
  SaveDraftPayload,
  GenerationStateResponse,
  SaveDraftResultResponse,
  GenerateQuotationPayload,
  GenerateQuotationResponse,
  QuotationGenerationDetail,
  WhiteLabelPreviewResponse,
  KioskQueueGeneratePayload,
  KioskQueuePreviewResponse,
  DedicatedSquadPreviewResponse,
  SubscriptionSaaSPreviewResponse,
  CustomDevelopmentPreviewResponse,
  TalentOutsourcingPreviewResponse,
  CloudInfrastructureGeneratePayload,
  CloudInfrastructurePreviewResponse,
  StandaloneMaintenancePreviewResponse,
} from '../types';

import axios, { endpoints } from 'src/shared/lib/axios';

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

export function generateQuotation(payload: GenerateQuotationPayload) {
  return unwrap<GenerateQuotationResponse>(
    axios.post(endpoints.quotation.quotations.generate, payload)
  );
}

/**
 * Calculate the dedicated squad preview. The server owns all money math and
 * visibility decisions; this request never persists a quotation or invokes
 * the AI provider.
 */
export function previewDedicatedSquad(payload: GenerateQuotationPayload, signal?: AbortSignal) {
  return unwrap<DedicatedSquadPreviewResponse>(
    axios.post(endpoints.quotation.quotations.preview, payload, { signal })
  );
}

/**
 * Calculate the subscription SaaS preview. The server owns all money math,
 * section planning, and profile resolutions without calling AI or persisting data.
 */
export function previewSubscriptionSaaS(payload: GenerateQuotationPayload, signal?: AbortSignal) {
  return unwrap<SubscriptionSaaSPreviewResponse>(
    axios.post(endpoints.quotation.quotations.subscriptionPreview, payload, { signal })
  );
}

/**
 * Calculate the white label quotation preview. The server owns all money math,
 * section planning, and profile resolutions without calling AI or persisting data.
 */
export function previewWhiteLabel(payload: GenerateQuotationPayload, signal?: AbortSignal) {
  return unwrap<WhiteLabelPreviewResponse>(
    axios.post(endpoints.quotation.quotations.whiteLabelPreview, payload, { signal })
  );
}

/**
 * Calculate the standalone maintenance quotation preview. The server owns all money math,
 * section planning, and profile resolutions without calling AI or persisting data.
 */
export function previewStandaloneMaintenance(
  payload: GenerateQuotationPayload,
  signal?: AbortSignal
) {
  return unwrap<StandaloneMaintenancePreviewResponse>(
    axios.post(endpoints.quotation.quotations.standaloneMaintenancePreview, payload, { signal })
  );
}

/**
 * Calculate the custom development quotation preview. The server owns all money math,
 * section planning, and profile resolutions without calling AI or persisting data.
 */
export function previewCustomDevelopment(payload: GenerateQuotationPayload, signal?: AbortSignal) {
  return unwrap<CustomDevelopmentPreviewResponse>(
    axios.post(endpoints.quotation.quotations.customDevelopmentPreview, payload, { signal })
  );
}

/**
 * Calculate the kiosk queue system quotation preview. The server owns all money math,
 * section planning, and profile resolutions without calling AI or persisting data.
 */
export function previewKioskQueueSystem(payload: KioskQueueGeneratePayload, signal?: AbortSignal) {
  return unwrap<KioskQueuePreviewResponse>(
    axios.post(endpoints.quotation.quotations.kioskQueuePreview, payload, { signal })
  );
}

export function previewTalentOutsourcing(payload: GenerateQuotationPayload, signal?: AbortSignal) {
  return unwrap<TalentOutsourcingPreviewResponse>(
    axios.post(endpoints.quotation.quotations.talentOutsourcingPreview, payload, { signal })
  );
}

export function previewCloudInfrastructure(
  payload: CloudInfrastructureGeneratePayload,
  signal?: AbortSignal
) {
  return unwrap<CloudInfrastructurePreviewResponse>(
    axios.post(endpoints.quotation.quotations.cloudInfrastructurePreview, payload, { signal })
  );
}

export function getGenerationStatus(id: string) {
  return unwrap<GenerationStateResponse>(
    axios.get(endpoints.quotation.quotations.generationStatus(id))
  );
}

export function regenerateQuotation(id: string) {
  return unwrap<GenerationStateResponse>(axios.post(endpoints.quotation.quotations.regenerate(id)));
}

export function getQuotationDetail(id: string) {
  return unwrap<QuotationGenerationDetail>(axios.get(endpoints.quotation.quotations.byId(id)));
}

export function saveQuotationDraft(id: string, payload: SaveDraftPayload) {
  return unwrap<SaveDraftResultResponse>(
    axios.put(endpoints.quotation.quotations.saveDraft(id), payload)
  );
}

export function getActiveSkills() {
  return unwrap<ActiveSkill[]>(axios.get(endpoints.quotation.ai.skills));
}

export function getActiveRateCards() {
  return unwrap<RateCardSummary[]>(
    axios.get(endpoints.quotation.rateCards.list, { params: { status: 'active' } })
  );
}

export async function getClients(): Promise<ClientSummary[]> {
  const res = await unwrap<ClientSummary[] | { items: ClientSummary[]; total: number }>(
    axios.get(endpoints.quotation.clientOrganizations.root)
  );
  if (Array.isArray(res)) {
    return res;
  }
  if (res && Array.isArray((res as any).items)) {
    return (res as any).items;
  }
  return [];
}

export function createClientOrganization(name: string): Promise<ClientSummary> {
  return unwrap<ClientSummary>(
    axios.post(endpoints.quotation.clientOrganizations.root, {
      name: name.trim(),
    })
  );
}
