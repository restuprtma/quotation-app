import axios, { endpoints } from 'src/shared/lib/axios';

import type {
  SignatureSettings,
  UpdateSignatureSettingsPayload,
} from '../types/signature-settings';

interface BaseResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

export const signatureSettingsApi = {
  getSettings: async (): Promise<SignatureSettings> => {
    const response = await axios.get<BaseResponse<SignatureSettings>>(
      endpoints.quotation.settings.signature
    );
    return response.data.data;
  },
  updateSettings: async (
    payload: UpdateSignatureSettingsPayload
  ): Promise<SignatureSettings> => {
    const response = await axios.put<BaseResponse<SignatureSettings>>(
      endpoints.quotation.settings.signature,
      payload
    );
    return response.data.data;
  },
};
