import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiSettingsApi } from '../api';
import { AISettingsUpdateRequest, AISettingsTestRequest } from '../types';

export const useGetAISettings = () => {
  return useQuery({
    queryKey: ['ai-settings'],
    queryFn: aiSettingsApi.getSettings,
  });
};

export const useUpdateAISettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AISettingsUpdateRequest) => aiSettingsApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
    },
  });
};

export const useTestAIConnection = () => {
  return useMutation({
    mutationFn: (data: AISettingsTestRequest) => aiSettingsApi.testConnection(data),
  });
};
