import type {
  ManualRequest,
  BlueprintStatus,
  BlueprintDetail,
  ProviderSection,
  GenerationStatus,
  CreateBlueprintInput,
  BlueprintListResponse,
  QuotationRevisionOption,
  SaveBlueprintSectionDraftRequest,
} from '../types';

import axios, { endpoints } from 'src/shared/lib/axios';

const MUTATION_TIMEOUT_MS = 200000;

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  errors?: string | { detail?: string[] } | null;
};

function extractError(payload: ApiEnvelope<unknown>): string {
  if (!payload.errors) return payload.message ?? 'Empty response';
  if (typeof payload.errors === 'string') return payload.errors;
  return payload.errors.detail?.[0] ?? payload.message ?? 'Request failed';
}

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const response = await promise;
  if (response.data.data === undefined || response.data.data === null) {
    const err = new Error(extractError(response.data));
    (err as any).response = response;
    throw err;
  }
  return response.data.data;
}

export function createBlueprint(input: CreateBlueprintInput): Promise<BlueprintStatus> {
  return unwrap<BlueprintStatus>(
    axios.post(endpoints.quotation.blueprints.generate, input, {
      timeout: MUTATION_TIMEOUT_MS,
    })
  );
}

export function getBlueprint(id: string, signal?: AbortSignal): Promise<BlueprintDetail> {
  return unwrap<BlueprintDetail>(axios.get(endpoints.quotation.blueprints.byId(id), { signal }));
}

export function getBlueprintStatus(id: string, signal?: AbortSignal): Promise<BlueprintStatus> {
  return unwrap<BlueprintStatus>(
    axios.get(endpoints.quotation.blueprints.generationStatus(id), { signal })
  );
}

export function continueBlueprint(id: string): Promise<BlueprintStatus> {
  return unwrap<BlueprintStatus>(
    axios.post(endpoints.quotation.blueprints.continue(id), undefined, {
      timeout: MUTATION_TIMEOUT_MS,
    })
  );
}

export function retryBlueprintSection(
  id: string,
  section: ProviderSection
): Promise<BlueprintStatus> {
  return unwrap<BlueprintStatus>(
    axios.post(endpoints.quotation.blueprints.retrySection(id, section), undefined, {
      timeout: MUTATION_TIMEOUT_MS,
    })
  );
}

export function completeBlueprintSection<T>(
  id: string,
  section: ProviderSection,
  input: ManualRequest<T>
): Promise<BlueprintStatus> {
  return unwrap<BlueprintStatus>(
    axios.put(endpoints.quotation.blueprints.manualComplete(id, section), input, {
      timeout: MUTATION_TIMEOUT_MS,
    })
  );
}

export function saveBlueprintDraftSection<T>(
  id: string,
  section: ProviderSection,
  input: SaveBlueprintSectionDraftRequest<T>
): Promise<BlueprintDetail> {
  return unwrap<BlueprintDetail>(
    axios.put(endpoints.quotation.blueprints.draftSection(id, section), input, {
      timeout: MUTATION_TIMEOUT_MS,
    })
  );
}

export type ListBlueprintsParams = {
  quotationId?: string;
  statuses?: GenerationStatus[];
  page?: number;
  limit?: number;
};

export function listBlueprints(
  params?: ListBlueprintsParams | string,
  signal?: AbortSignal
): Promise<BlueprintListResponse> {
  const queryParams: Record<string, any> = {};

  if (typeof params === 'string') {
    queryParams.quotation_id = params;
  } else if (params) {
    if (params.quotationId !== undefined) {
      queryParams.quotation_id = params.quotationId;
    }
    if (params.statuses && params.statuses.length > 0) {
      queryParams.generation_status = params.statuses.join(',');
    }
    if (params.page !== undefined) {
      queryParams.page = params.page;
    }
    if (params.limit !== undefined) {
      queryParams.limit = params.limit;
    }
  }

  return unwrap<BlueprintListResponse>(
    axios.get(endpoints.quotation.blueprints.root, {
      params: queryParams,
      signal,
    })
  );
}

export function listQuotationRevisions(
  quotationId: string,
  signal?: AbortSignal
): Promise<QuotationRevisionOption[]> {
  return unwrap<QuotationRevisionOption[]>(
    axios.get(endpoints.quotation.quotations.revisions(quotationId), { signal })
  );
}

export * from './lifecycle';
export * from './share-links';
