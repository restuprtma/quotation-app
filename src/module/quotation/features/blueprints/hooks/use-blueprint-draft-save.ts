import type {
  BlueprintDetail,
  ProviderSection,
  ManualContentMap,
  SaveBlueprintSectionDraftRequest,
} from '../types';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthContext } from 'src/module/core/features/auth/hooks';

import { saveBlueprintDraftSection } from '../api';

export function useBlueprintDraftSave<S extends ProviderSection>(
  blueprintId?: string | null,
  section?: S
) {
  const { company } = useAuthContext();
  const companyId = company?.id ?? 'anonymous';
  const queryClient = useQueryClient();

  return useMutation<BlueprintDetail, Error, SaveBlueprintSectionDraftRequest<ManualContentMap[S]>>(
    {
      mutationFn: (input) => {
        if (!blueprintId || !section) {
          throw new Error('blueprint_id and section are required to save draft');
        }
        return saveBlueprintDraftSection<ManualContentMap[S]>(blueprintId, section, input);
      },
      retry: false,
      onSuccess: (savedDetail) => {
        if (blueprintId) {
          queryClient.setQueryData(['blueprints', companyId, 'detail', blueprintId], savedDetail);
          queryClient.setQueryData(
            ['blueprints', companyId, 'status', blueprintId],
            savedDetail.status
          );
        }
      },
    }
  );
}
