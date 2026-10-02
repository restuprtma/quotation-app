export type CommercialSchemeType =
  | 'dedicated_squad'
  | 'subscription_saas'
  | 'white_label'
  | 'standalone_maintenance'
  | 'custom_development'
  | 'kiosk_queue_system'
  | 'talent_outsourcing'
  | 'cloud_infrastructure';

export const MEETING_EXTRACTION_SCHEMES = [
  'dedicated_squad',
  'subscription_saas',
  'white_label',
  'standalone_maintenance',
  'custom_development',
  'kiosk_queue_system',
  'talent_outsourcing',
  'cloud_infrastructure',
] as const satisfies readonly CommercialSchemeType[];

export type MeetingExtractionServiceScheme = 'auto' | CommercialSchemeType;

export type MeetingExtractionStartPayload = {
  service_scheme: MeetingExtractionServiceScheme;
  meeting_notes: string;
  pipeline_version?: 'meeting-extraction-v1';
  idempotency_key?: string;
};

export type MeetingExtractionStart = {
  quotation_id: string;
  run_id: string;
  status: string;
  status_url: string;
};

export type MeetingExtractionStatus = {
  run_id: string;
  quotation_id: string;
  status: string;
  current_phase: string | null;
  progress: { completed: number; total: number };
  phases: Array<{
    key: string;
    label: string;
    status: string;
    attempt: number;
    error_code: string | null;
    retryable: boolean;
  }>;
  failed_phase: string | null;
  error: { code: string; message: string; retryable: boolean; retry_after: number | null } | null;
  needs_input: Array<{ code: string; field: string; message: string }>;
  warnings: Array<{ code: string; field: string; message: string }>;
};

export type MeetingExtractionSafeError = {
  code: string;
  message: string;
  retryable: boolean;
  retry_after: number | null;
};
