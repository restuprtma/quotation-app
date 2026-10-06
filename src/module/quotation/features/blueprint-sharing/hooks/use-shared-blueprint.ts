import { useQuery } from '@tanstack/react-query';

import { sharedBlueprintApi } from '../api';

export function useSharedBlueprint(token: string) {
  return useQuery({
    queryKey: ['shared-blueprint', token],
    queryFn: () => sharedBlueprintApi.getShared(token),
    enabled: Boolean(token),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
