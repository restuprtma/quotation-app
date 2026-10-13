export interface SignatureSettings {
  director_name: string;
  director_title: string;
  director_signature_data: string;
  company_stamp_data: string;
  is_configured?: boolean;
}

export interface UpdateSignatureSettingsPayload {
  director_name: string;
  director_title: string;
  director_signature_data: string;
  company_stamp_data: string;
}
