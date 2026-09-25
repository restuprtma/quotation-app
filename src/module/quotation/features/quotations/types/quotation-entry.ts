export type QuotationEntryState = {
  version: 1;
  project_name: string;
  client_id: string;
  client_company_name: string;
  pic_name: string;
  meeting_notes: string;
};

export type QuotationEntryIdentity = Omit<QuotationEntryState, 'version' | 'meeting_notes'>;

export const EMPTY_QUOTATION_ENTRY: QuotationEntryState = {
  version: 1,
  project_name: '',
  client_id: '',
  client_company_name: '',
  pic_name: '',
  meeting_notes: '',
};

export const QUOTATION_ENTRY_STORAGE_KEY = 'quotation-entry:v1';
