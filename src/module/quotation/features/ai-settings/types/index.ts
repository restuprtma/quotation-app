export interface AISettingsResponse {
  provider: string;
  model: string;
  base_url?: string;
  credential_configured: boolean;
  key_hint: string;
  updated_at: string;
}

export interface AISettingsUpdateRequest {
  provider: string;
  model: string;
  base_url?: string;
  api_key: string; // Used for saving only; backend handles empty string as "keep current"
}

export interface AISettingsTestRequest {
  provider: string;
  model: string;
  base_url?: string;
  api_key: string;
}

export interface AISkillResponse {
  id: string;
  command: string;
  tone: string;
  domain_vocabulary: string;
  content_instruction: string;
  section_emphasis: string;
  is_active: boolean;
}
