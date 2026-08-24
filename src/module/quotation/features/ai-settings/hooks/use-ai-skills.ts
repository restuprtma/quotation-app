import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiSettingsApi } from '../api';
import { AISkillResponse } from '../types';

export const useGetAISkills = () => {
  return useQuery({
    queryKey: ['ai-skills'],
    queryFn: aiSettingsApi.getSkills,
  });
};

export const useUpdateAISkill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AISkillResponse> }) => 
      aiSettingsApi.updateSkill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-skills'] });
    },
  });
};

export const useResetAISkill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => aiSettingsApi.resetSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-skills'] });
    },
  });
};
