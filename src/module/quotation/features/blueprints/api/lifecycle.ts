import axios, { endpoints } from 'src/shared/lib/axios';

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  errors?: string | { detail?: string[] } | null;
};

function extractError(payload: ApiEnvelope<unknown>): string {
  if (!payload.errors) return payload.message ?? 'Request failed';
  if (typeof payload.errors === 'string') return payload.errors;
  return payload.errors.detail?.[0] ?? payload.message ?? 'Request failed';
}

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const response = await promise;
  if (response.data.data === undefined || response.data.data === null) {
    throw new Error(extractError(response.data));
  }
  return response.data.data;
}

export type PublishBlueprintRequest = {
  revision_id: string;
  confirm_partial?: boolean;
  warning_codes?: string[];
};

export type CreateBlueprintRevisionRequest = {
  mode: 'clone' | 'regenerate_from_source';
  source_quotation_revision_id?: string;
};

export type BlueprintRevisionResponse = {
  id: string;
  blueprint_id: string;
  revision_number: number;
  publication_status: 'draft' | 'published' | 'superseded';
  completeness_status: 'partial' | 'complete';
  [key: string]: any;
};

export async function publishBlueprint(
  id: string,
  req: PublishBlueprintRequest
): Promise<{ status: string }> {
  return unwrap<{ status: string }>(axios.post(endpoints.quotation.blueprints.publish(id), req));
}

export async function createBlueprintRevision(
  id: string,
  req?: CreateBlueprintRevisionRequest
): Promise<BlueprintRevisionResponse> {
  return unwrap<BlueprintRevisionResponse>(
    axios.post(endpoints.quotation.blueprints.revisions(id), req)
  );
}

export async function listBlueprintRevisions(id: string): Promise<BlueprintRevisionResponse[]> {
  return unwrap<BlueprintRevisionResponse[]>(
    axios.get(endpoints.quotation.blueprints.revisions(id))
  );
}

export async function deleteBlueprintDraft(id: string): Promise<void> {
  const response = await axios.delete(endpoints.quotation.blueprints.deleteDraft(id));
  if (response.data && response.data.errors) {
    throw new Error(extractError(response.data));
  }
}
