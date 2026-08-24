import axiosInstance from 'src/shared/lib/axios';
import { AISettingsResponse, AISettingsUpdateRequest, AISettingsTestRequest, AISkillResponse } from '../types';

export const aiSettingsApi = {
  getSettings: () => axiosInstance.get<AISettingsResponse>('/quotation/v1/ai/settings').then(res => res.data),
  updateSettings: (data: AISettingsUpdateRequest) => axiosInstance.put<AISettingsResponse>('/quotation/v1/ai/settings', data).then(res => res.data),
  testConnection: (data: AISettingsTestRequest) => axiosInstance.post<{ message: string }>('/quotation/v1/ai/settings/test', data).then(res => res.data),
  
  getSkills: () => axiosInstance.get<AISkillResponse[]>('/quotation/v1/ai/skills').then(res => res.data),
  updateSkill: (id: string, data: Partial<AISkillResponse>) => axiosInstance.put<AISkillResponse>(`/quotation/v1/ai/skills/${id}`, data).then(res => res.data),
  resetSkill: (id: string) => axiosInstance.post<AISkillResponse>(`/quotation/v1/ai/skills/${id}/reset-default`).then(res => res.data),
};
