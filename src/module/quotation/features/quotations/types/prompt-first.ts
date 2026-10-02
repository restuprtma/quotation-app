export type ValueSource = 'meeting' | 'catalog' | 'suggestion' | 'user';

export type Fact<T> = {
  value: T;
  source: ValueSource;
  evidence?: string;
  confirmed: boolean;
};

export type IssueSeverity = 'blocking' | 'warning';

export type DraftIssue = {
  code: string;
  field: string;
  message: string;
  severity: IssueSeverity;
};

export type PromptTeamLine = {
  requested_role: string;
  resolved_rate_item_id?: string;
  seniority: string;
  headcount_quarters: number;
  period_quarters: number;
  source: ValueSource;
  evidence?: string;
  confirmed: boolean;
};

export type PromptSubscriptionSaaSServiceInput = {
  kind: 'subscription_saas_v1';
  product_name: Fact<string>;
  initial_term_months: Fact<number>;
  billing_cycle: Fact<string>;
  feature_groups?: Array<{
    name: Fact<string>;
    features: Fact<string>[];
  }>;
};

export type PromptWhiteLabelServiceInput = {
  kind: 'white_label_v1';
  product_name: Fact<string>;
  license_items: Array<{
    name: Fact<string>;
    quantity: Fact<number>;
  }>;
  maintenance_items?: Array<{
    name: Fact<string>;
    fte_quarters: Fact<number>;
    period_months: Fact<number>;
  }>;
  hosting_items?: Array<{
    name: Fact<string>;
    quantity: Fact<number>;
    period_months: Fact<number>;
  }>;
  rights_statements?: Fact<string>[];
};

export type PromptMaintenanceRetainerItem = {
  name: Fact<string>;
  fte_quarters: Fact<number>;
  period_months: Fact<number>;
};

export type PromptMaintenanceHourlyCostItem = {
  name: Fact<string>;
  headcount: Fact<number>;
  hours_half_units: Fact<number>;
};

export type PromptMaintenanceDefectItem = {
  item_number: Fact<string>;
  priority: Fact<string>;
  function: Fact<string>;
  screen_flow: Fact<string>;
  existing: Fact<string>;
  improvement: Fact<string>;
  reference?: Fact<string>;
};

export type PromptMaintenanceDefectGroup = {
  title: Fact<string>;
  items: PromptMaintenanceDefectItem[];
};

export type PromptMaintenanceHourlyTask = {
  description: Fact<string>;
  platform: Fact<string>;
  hours_half_units: Fact<number>;
};

export type PromptStandaloneMaintenanceServiceInput = {
  kind: 'standalone_maintenance_v1';
  system_name: Fact<string>;
  mode: Fact<'retainer' | 'hourly_task' | string>;
  tax_treatment: Fact<string>;
  retainer_items?: PromptMaintenanceRetainerItem[];
  hourly_cost_items?: PromptMaintenanceHourlyCostItem[];
  defect_groups?: PromptMaintenanceDefectGroup[];
  hourly_tasks?: PromptMaintenanceHourlyTask[];
  rights_statements?: Fact<string>[];
};

export type PromptCustomDevelopmentPricingStatus = 'unknown' | 'explicit' | 'included';

export type PromptCustomDevelopmentCostItem = {
  name: Fact<string>;
  display_rate?: { amount?: number; source: ValueSource; catalog_ref?: string };
  headcount: Fact<number>;
  period_label: Fact<string>;
  pricing_status?: PromptCustomDevelopmentPricingStatus;
  quoted_line_total?: { amount?: number; source: ValueSource; catalog_ref?: string };
};

export type PromptCustomDevelopmentCostGroup = {
  title: Fact<string>;
  items: PromptCustomDevelopmentCostItem[];
};

export type PromptCustomDevelopmentMonthlyItem = {
  name: Fact<string>;
  specification?: Fact<string>;
  unit_rate: { amount?: number; source: ValueSource; catalog_ref?: string };
  quantity: Fact<number>;
};

export type PromptCustomDevelopmentModuleGroup = {
  name: Fact<string>;
  features: Fact<string>[];
};

export type PromptCustomDevelopmentTimelineRow = {
  description: Fact<string>;
  timeline: Fact<string>;
};

export type PromptCustomDevelopmentPaymentRow = {
  work_period: Fact<string>;
  terms: Fact<string>;
  invoice_date_label: Fact<string>;
  due_date_label: Fact<string>;
  component: 'development' | 'monthly_recurring';
  nominal: { amount?: number; source: ValueSource; catalog_ref?: string };
};

export type PromptCustomDevelopmentServiceInput = {
  kind: 'custom_development_v1';
  system_name: Fact<string>;
  development_table_mode: Fact<'monthly_period' | 'daily_period' | 'fixed_days' | string>;
  tax_treatment: Fact<string>;
  development_groups: PromptCustomDevelopmentCostGroup[];
  discount_label?: Fact<string>;
  monthly_items?: PromptCustomDevelopmentMonthlyItem[];
  monthly_notes?: Fact<string>[];
  module_groups: PromptCustomDevelopmentModuleGroup[];
  timeline_rows: PromptCustomDevelopmentTimelineRow[];
  payment_schedule: PromptCustomDevelopmentPaymentRow[];
  rights_statements?: Fact<string>[];
  limitation_codes: Fact<string>[];
  additional_limitations?: Fact<string>[];
};

export type PromptKioskQueueScopePhase = {
  title: Fact<string>;
  deliverables: Fact<string>[];
};

export type PromptKioskQueueExpertItem = {
  role: Fact<string>;
  headcount: Fact<number>;
  duration_label: Fact<string>;
  minimum_qualification: Fact<string>;
};

export type PromptKioskQueueServiceItem = {
  name: Fact<string>;
  monthly_rate?: { amount?: number; source: ValueSource; catalog_ref?: string };
  headcount: Fact<number>;
  period_quarters: Fact<number>;
};

export type PromptKioskQueueServiceGroup = {
  title: Fact<string>;
  items: PromptKioskQueueServiceItem[];
};

export type PromptKioskQueueHardwareItem = {
  name: Fact<string>;
  unit_price?: { amount?: number; source: ValueSource; catalog_ref?: string };
  quantity: Fact<number>;
};

export type PromptKioskQueueTimelineRow = {
  description: Fact<string>;
  timeline: Fact<string>;
};

export type PromptKioskQueueGovernmentPaymentRow = {
  stage: Fact<string>;
  billing_basis: Fact<string>;
  nominal?: { amount?: number; source: ValueSource; catalog_ref?: string };
};

export type PromptKioskQueuePrivatePaymentRow = {
  work_period: Fact<string>;
  terms: Fact<string>;
  invoice_date_label: Fact<string>;
  due_date_label: Fact<string>;
  nominal?: { amount?: number; source: ValueSource; catalog_ref?: string };
};

export type PromptKioskQueueServiceInput = {
  kind: 'kiosk_queue_system_v1';
  variant: Fact<'government_mpp' | 'private_food_court' | string>;
  document_number?: Fact<string>;
  system_name: Fact<string>;
  hardware_provision: Fact<'venturo_supplied' | 'client_supplied' | string>;
  tax_treatment: Fact<'inclusive_ppn_11' | 'exclusive_ppn' | string>;
  government_scope_phases?: PromptKioskQueueScopePhase[];
  expert_requirements?: PromptKioskQueueExpertItem[];
  service_groups: PromptKioskQueueServiceGroup[];
  hardware_items?: PromptKioskQueueHardwareItem[];
  maintenance_items?: PromptKioskQueueServiceItem[];
  private_timeline_rows?: PromptKioskQueueTimelineRow[];
  government_payment_schedule?: PromptKioskQueueGovernmentPaymentRow[];
  private_payment_schedule?: PromptKioskQueuePrivatePaymentRow[];
  payment_due_days?: Fact<number>;
  limitation_codes: Fact<string>[];
  additional_limitations?: Fact<string>[];
  rights_statements?: Fact<string>[];
};

export type PromptTalentCostItem = {
  name: Fact<string>;
  quantity: Fact<number>;
  quantity_unit: Fact<string>;
  period_count: Fact<number>;
  period_unit: 'month' | 'workday';
  unit_rate: { amount?: number; source: ValueSource; catalog_ref?: string };
};

export type PromptTalentCostGroup = {
  category: 'personnel' | 'non_personnel';
  title: Fact<string>;
  items: PromptTalentCostItem[];
};

export type PromptTalentPreparationItem = {
  name: Fact<string>;
  headcount: Fact<number>;
  quoted_line_total: { amount?: number; source: ValueSource; catalog_ref?: string };
};

export type PromptTalentSquadItem = {
  role: Fact<string>;
  monthly_rate: { amount?: number; source: ValueSource; catalog_ref?: string };
  headcount: Fact<number>;
  period_months: Fact<number>;
};

export type PromptTalentScopeBlock = {
  title: Fact<string>;
  description?: Fact<string>;
  responsibilities?: Fact<string>[];
  qualifications?: Fact<string>[];
  deliverables?: Fact<string>[];
  timeline?: Fact<string>;
};

export type PromptTalentPaymentRow = {
  work_period: Fact<string>;
  terms: Fact<string>;
  invoice_date_label: Fact<string>;
  due_date_label: Fact<string>;
  nominal: { amount?: number; source: ValueSource; catalog_ref?: string };
};

export type PromptTalentOutsourcingServiceInput = {
  kind: 'talent_outsourcing_v1';
  engagement_mode: Fact<'manpower_supply' | 'managed_squad' | string>;
  document_number: Fact<string>;
  service_name: Fact<string>;
  tax_treatment: Fact<'bpjs_dpp_ppn_12' | 'exclusive_ppn' | 'not_stated' | string>;
  cost_groups?: PromptTalentCostGroup[];
  preparation_items?: PromptTalentPreparationItem[];
  preparation_discount_amount?: { amount?: number; source: ValueSource; catalog_ref?: string };
  show_preparation_discount_row?: Fact<boolean>;
  squad_items?: PromptTalentSquadItem[];
  scope_blocks: PromptTalentScopeBlock[];
  payment_schedule: PromptTalentPaymentRow[];
  payment_due_days: Fact<number>;
  limitation_codes: Fact<string>[];
  additional_limitations?: Fact<string>[];
  warranty_statements?: Fact<string>[];
  rights_statements?: Fact<string>[];
};

export type PromptCloudPackageItem = {
  category: Fact<'shared_hosting' | 'vps_cloud' | string>;
  name: Fact<string>;
  vcpu: Fact<number>;
  ram_gb: Fact<number>;
  storage_gb: Fact<number>;
  unit_rate: { amount?: number; source: ValueSource; catalog_ref?: string };
};

export type PromptCloudSetupItem = {
  name: Fact<string>;
  amount: { amount?: number; source: ValueSource; catalog_ref?: string };
};

export type PromptCloudScopeSection = {
  title: Fact<string>;
  activities: Fact<string>[];
};

export type PromptCloudScopeRow = {
  sections: PromptCloudScopeSection[];
  timeline: Fact<string>;
};

export type PromptCloudPaymentRow = {
  work_period: Fact<string>;
  terms: Fact<string>;
  invoice_date_label: Fact<string>;
  due_date_label: Fact<string>;
  component: 'setup' | 'monthly_service' | string;
  nominal: { amount?: number; source: ValueSource; catalog_ref?: string };
};

export type PromptCloudInfrastructureServiceInput = {
  kind: 'cloud_infrastructure_v1';
  document_number: Fact<string>;
  service_name: Fact<string>;
  tax_treatment: Fact<'exclusive_ppn' | 'inclusive_ppn' | 'not_stated' | string>;
  package_items: PromptCloudPackageItem[];
  setup_items?: PromptCloudSetupItem[];
  scope_rows?: PromptCloudScopeRow[];
  payment_schedule: PromptCloudPaymentRow[];
  payment_due_days?: Fact<number>;
  limitation_codes: Fact<string>[];
  additional_limitations?: Fact<string>[];
};

// Server responses never carry raw meeting notes. Keep this projection distinct
// from MeetingDraftInput, whose notes exist only in form/request memory.
export type PromptQuotationStateView = {
  schema_version: string;
  client_name?: Fact<string>;
  client_company?: Fact<string>;
  pic_name?: Fact<string>;
  project_name?: Fact<string>;
  commercial_scheme?: Fact<string>;
  scope: Fact<string>[];
  duration_months?: Fact<number>;
  team: PromptTeamLine[];
  payment_pattern?: Fact<string>;
  additional_discount_bps?: number;
  service_input?: unknown;
  issues: DraftIssue[];
  readiness: 'incomplete' | 'priceable' | 'ready_for_final' | string;
};

/** @deprecated Use PromptQuotationStateView for every server-facing state. */
export type PromptQuotationState = PromptQuotationStateView;

export type PromptPatchOperation =
  | { type: 'set_duration_months'; duration_months: number }
  | { type: 'set_team'; team: PromptTeamLine[] }
  | { type: 'set_discount_bps'; discount_bps: number }
  | { type: 'set_payment_pattern'; payment_pattern: string }
  | { type: 'confirm_field'; field: 'duration_months' | 'team' | 'payment_pattern' };

export type PromptPatchPayload = {
  revision_id: string;
  content_version: number;
  state_version: number;
  operations: PromptPatchOperation[];
};

export type PromptNarrativeTarget = 'scope' | 'timeline' | 'narrative';

export type PromptRevisionPayload = {
  revision_id: string;
  content_version: number;
  state_version: number;
  instruction: string;
  target_section: PromptNarrativeTarget;
};

export type PromptCalculation = {
  total_before_discount: number;
  additional_discount: number;
  total_investment: number;
  discount: number;
  payments: Array<{
    work_period: string;
    terms: string;
    invoice_date: string;
    due_date: string;
    nominal: number;
  }>;
  total_contract?: number;
};

export type PromptPatchResponse = {
  quotation_id: string;
  revision_id: string;
  content_html: string;
  content_version: number;
  state_version: number;
  prompt_state: PromptQuotationState;
  issues: DraftIssue[];
  readiness: string;
  calculation: PromptCalculation;
  /** Safe role metadata from the quotation's persisted rate-card snapshot. */
  catalog_roles?: CatalogRoleOption[];
};

export type MeetingDraftInput = {
  project_name?: string;
  client_id?: string;
  client_company_name?: string;
  pic_name?: string;
  client_name?: string; // accepted only for old callers
  meeting_notes: string;
};

export type MeetingQuotationPayload = MeetingDraftInput & {
  idempotency_key: string;
};

export type PendingMeetingDraftResponse = {
  quotation_id: string;
  revision_id: string;
  quotation_number: string;
  generation_status: 'pending' | 'in_progress' | 'failed' | 'completed';
  idempotent_replay: boolean;
};

export type MeetingGenerationPhase =
  | 'idle'
  | 'creating_draft'
  | 'extracting_meeting'
  | 'finalizing_draft'
  | 'completed'
  | 'failed';

export type MeetingDraftResponse = {
  quotation_id: string;
  revision_id: string;
  quotation_number: string;
  content_html: string;
  content_version: number;
  state_version: number;
  prompt_state: PromptQuotationState;
  issues: DraftIssue[];
  readiness: string;
  calculation?: unknown;
  idempotent_replay: boolean;
  /** Safe role metadata from the quotation's persisted rate-card snapshot. */
  catalog_roles?: CatalogRoleOption[];
};

/** A role option returned by the prompt-first quotation catalog. */
export type CatalogRoleOption = {
  rate_item_id: string;
  role: string;
  display_name: string;
  seniority: string;
  term_type: string;
};

export type PromptRoleResolutionStatus = 'resolved' | 'unresolved' | 'ambiguous';

export type PromptRoleResolution = {
  status: PromptRoleResolutionStatus;
  requested: string;
  options: CatalogRoleOption[];
};

export function resolvePromptRole(
  requested: string,
  options: CatalogRoleOption[]
): PromptRoleResolution {
  const normalized = requested.trim().toLowerCase();
  const matches = normalized
    ? options.filter((option) => option.role.trim().toLowerCase() === normalized)
    : [];

  return {
    status: matches.length === 1 ? 'resolved' : matches.length > 1 ? 'ambiguous' : 'unresolved',
    requested,
    options: matches,
  };
}
