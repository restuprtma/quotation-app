import type {
  AISkillResponse,
  AISettingsResponse,
  AISettingsTestRequest,
  AISettingsUpdateRequest,
} from '../types';

import axiosInstance from 'src/shared/lib/axios';

interface BaseResponse<T> {
  data: T;
  message: string;
}

export const aiSettingsApi = {
  getSettings: () =>
    axiosInstance
      .get<BaseResponse<AISettingsResponse>>('/quotation/v1/ai/settings')
      .then((res) => res.data.data),
  updateSettings: (data: AISettingsUpdateRequest) =>
    axiosInstance
      .put<BaseResponse<AISettingsResponse>>('/quotation/v1/ai/settings', data)
      .then((res) => res.data.data),
  testConnection: (data: AISettingsTestRequest) =>
    axiosInstance
      .post<BaseResponse<null>>('/quotation/v1/ai/settings/test', data)
      .then((res) => res.data),

  getSkills: () =>
    axiosInstance
      .get<BaseResponse<AISkillResponse[]>>('/quotation/v1/ai/skills')
      .then((res) => res.data.data),
  updateSkill: (id: string, data: Partial<AISkillResponse>) =>
    axiosInstance
      .put<BaseResponse<AISkillResponse>>(`/quotation/v1/ai/skills/${id}`, data)
      .then((res) => res.data.data),
  resetSkill: (id: string) =>
    axiosInstance
      .post<BaseResponse<AISkillResponse>>(`/quotation/v1/ai/skills/${id}/reset-default`)
      .then((res) => res.data.data),
};
