import type { UpdateSignatureSettingsPayload } from '../types/signature-settings';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { signatureSettingsApi } from '../api/signature-settings';

export const useSignatureSettings = () =>
  useQuery({
    queryKey: ['signature-settings'],
    queryFn: signatureSettingsApi.getSettings,
  });

export const useUpdateSignatureSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateSignatureSettingsPayload) =>
      signatureSettingsApi.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signature-settings'] });
    },
  });
};
