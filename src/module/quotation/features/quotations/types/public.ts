export interface PublicQuotationClient {
  company_name: string;
  client_pic?: string;
}

export interface PublicQuotation {
  quotation_number: string;
  subject: string | null;
  client: PublicQuotationClient;
  revision_number: number;
  content_html: string;
  published_at: string;
  signed: boolean;
  signer_name: string | null;
  signed_at: string | null;
}

export interface SignPublicQuotationPayload {
  signature_data: string;
  consent: boolean;
  signer_name?: string;
  signer_email?: string;
}

