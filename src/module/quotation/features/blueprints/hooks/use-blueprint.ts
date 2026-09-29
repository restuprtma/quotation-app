import type {
  ManualRequest,
  BlueprintStatus,
  BlueprintDetail,
  ProviderSection,
  GenerationStatus,
  CreateBlueprintInput,
  BlueprintListResponse,
  QuotationRevisionOption,
} from '../types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthContext } from 'src/module/core/features/auth/hooks';

import {
  getBlueprint,
  listBlueprints,
  createBlueprint,
  continueBlueprint,
  getBlueprintStatus,
  retryBlueprintSection,
  listQuotationRevisions,
  completeBlueprintSection,
} from '../api';

export function useBlueprintDetail(id?: string | null, enabled: boolean = true) {
  const { company } = useAuthContext();
  const companyId = company?.id ?? 'anonymous';

  return useQuery<BlueprintDetail, Error>({
    queryKey: ['blueprints', companyId, 'detail', id],
    queryFn: ({ signal }) => getBlueprint(id!, signal),
    enabled: Boolean(id) && enabled,
    staleTime: 30 * 1000,
  });
}

export function useBlueprintStatus(id?: string | null, enabled: boolean = true) {
  const { company } = useAuthContext();
  const companyId = company?.id ?? 'anonymous';

  return useQuery<BlueprintStatus, Error>({
    queryKey: ['blueprints', companyId, 'status', id],
    queryFn: ({ signal }) => getBlueprintStatus(id!, signal),
    enabled: Boolean(id) && enabled,
    staleTime: 5 * 1000,
  });
}

export type UseBlueprintListParams = {
  quotationId?: string | null;
  statuses?: GenerationStatus[];
  page?: number;
  limit?: number;
};

export function useBlueprintList(
  params?: UseBlueprintListParams | string | null,
  enabled: boolean = true
) {
  const { company } = useAuthContext();
  const companyId = company?.id ?? 'anonymous';

  const normalizedParams: UseBlueprintListParams =
    typeof params === 'string' ? { quotationId: params } : (params ?? {});

  const quotationId = normalizedParams.quotationId ?? null;
  const statuses = normalizedParams.statuses;
  const sortedStatusesKey = statuses && statuses.length > 0 ? [...statuses].sort().join(',') : null;
  const page = normalizedParams.page ?? 1;
  const limit = normalizedParams.limit ?? 20;

  const queryKey = [
    'blueprints',
    companyId,
    'list',
    {
      quotationId,
      statuses: sortedStatusesKey,
      page,
      limit,
    },
  ];

  return useQuery<BlueprintListResponse, Error>({
    queryKey,
    queryFn: ({ signal }) =>
      listBlueprints(
        {
          quotationId: quotationId ?? undefined,
          statuses,
          page,
          limit,
        },
        signal
      ),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useQuotationRevisions(quotationId?: string | null, enabled: boolean = true) {
  const { company } = useAuthContext();
  const companyId = company?.id ?? 'anonymous';

  return useQuery<QuotationRevisionOption[], Error>({
    queryKey: ['quotations', companyId, 'revisions', quotationId],
    queryFn: ({ signal }) => listQuotationRevisions(quotationId!, signal),
    enabled: Boolean(quotationId) && enabled,
    staleTime: 30 * 1000,
  });
}

export function useCreateBlueprint() {
  const { company } = useAuthContext();
  const companyId = company?.id ?? 'anonymous';
  const queryClient = useQueryClient();

  return useMutation<BlueprintStatus, Error, CreateBlueprintInput>({
    mutationFn: (input) => createBlueprint(input),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprints', companyId] });
    },
  });
}

export function useContinueBlueprint() {
  return useMutation<BlueprintStatus, Error, string>({
    mutationFn: (id) => continueBlueprint(id),
    retry: false,
  });
}

export function useRetryBlueprintSection() {
  return useMutation<BlueprintStatus, Error, { id: string; section: ProviderSection }>({
    mutationFn: ({ id, section }) => retryBlueprintSection(id, section),
    retry: false,
  });
}

export function useCompleteBlueprintSection() {
  return useMutation<
    BlueprintStatus,
    Error,
    { id: string; section: ProviderSection; input: ManualRequest<any> }
  >({
    mutationFn: ({ id, section, input }) => completeBlueprintSection(id, section, input),
    retry: false,
  });
}

export { useBlueprintRunner } from './use-blueprint-runner';
export { useBlueprintDraftSave } from './use-blueprint-draft-save';
