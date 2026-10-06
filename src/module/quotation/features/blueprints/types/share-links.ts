export interface CreateShareLinkPayload {
  blueprint_revision_id: string;
  label: string;
}

export interface CreateShareLinkResponse {
  id: string;
  label: string;
  revision_number: number;
  url: string;
  created_at: string;
}

export interface ShareLinkItem {
  id: string;
  label: string;
  revision_number: number;
  blueprint_revision_id: string;
  created_at: string;
  revoked_at: string | null;
  last_accessed_at: string | null;
  is_revoked: boolean;
}
