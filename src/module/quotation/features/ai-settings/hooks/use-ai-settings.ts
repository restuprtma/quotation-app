import type { AISettingsTestRequest, AISettingsUpdateRequest } from '../types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { aiSettingsApi } from '../api';

export const useGetAISettings = () =>
  useQuery({
    queryKey: ['ai-settings'],
    queryFn: aiSettingsApi.getSettings,
  });

export const useUpdateAISettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AISettingsUpdateRequest) => aiSettingsApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
    },
  });
};

export const useTestAIConnection = () =>
  useMutation({
    mutationFn: (data: AISettingsTestRequest) => aiSettingsApi.testConnection(data),
  });
