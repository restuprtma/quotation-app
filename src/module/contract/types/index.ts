export type ContractStatus = 'draft' | 'sent' | 'signed' | 'revoked';

export interface Contract {
  id: string;
  quotation_id: string;
  revision_id: string;
  contract_number: string;
  public_token: string;
  status: ContractStatus;
  client_snapshot: Record<string, any>;
  scope_data?: string;
  deliverables_data?: string;
  commercial_terms?: string;
  payment_terms?: string;
  timeline_data?: string;
  additional_terms?: string;
  signed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContractPayload {
  quotation_id: string;
}

export interface UpdateContractPayload {
  scope_data?: string | null;
  deliverables_data?: string | null;
  commercial_terms?: string | null;
  payment_terms?: string | null;
  timeline_data?: string | null;
  additional_terms?: string | null;
}

export interface SignContractPayload {
  signature_data_url: string;
}

export interface PublicContract {
  quotation_id: string;
  revision_id: string;
  contract_number: string;
  status: ContractStatus;
  client_snapshot: Record<string, any>;
  scope_data?: string;
  deliverables_data?: string;
  commercial_terms?: string;
  payment_terms?: string;
  timeline_data?: string;
  additional_terms?: string;
  signed_at?: string;
  created_at: string;
}
