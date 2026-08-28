import { useQuery } from '@tanstack/react-query';

import { getActiveSkills } from '../api';

export const ACTIVE_SKILLS_QUERY_KEY = ['ai-skills', 'active'] as const;

export function useActiveSkills() {
  return useQuery({
    queryKey: ACTIVE_SKILLS_QUERY_KEY,
    queryFn: getActiveSkills,
    staleTime: 5 * 60 * 1000,
  });
}
