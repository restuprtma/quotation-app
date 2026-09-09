export type PaymentTermItem = {
  milestone_name: string;
  percentage: number;
  description?: string;
};

export type PaymentTermsInput = {
  mode: 'milestone';
  items: PaymentTermItem[];
};

export type SquadModel = '1A' | '1B' | '1C' | '1D';

export type DedicatedTimelineMode = 'relative' | 'calendar' | 'sprint';
export type PreparationMode = '' | 'none' | 'hiring' | 'engineering_kickoff';
export type MaintenanceMode = '' | 'none' | 'separate_section' | 'within_development';
export type ScopeTimelineMode = '' | 'none' | 'relative' | 'calendar' | 'sprint';
export type QuotationPaymentMode = '' | 'preset' | 'explicit_rows';
export type PaymentAllocationKind = 'investment_bps' | 'net_preparation' | 'remaining_bps';
export type TaxTreatment = '' | 'exclusive_ppn' | 'inclusive_ppn';
export type QuotationPhase =
  | 'requirement'
  | 'development'
  | 'sit'
  | 'uat'
  | 'go_live'
  | 'maintenance'
  | 'k6'
  | 'pentest';

export type PaymentRowInput = {
  work_period: string;
  terms: string;
  allocation_kind: PaymentAllocationKind;
  allocation_bps?: number;
  invoice_month_offset?: number;
  invoice_at_sprint_end?: boolean;
};

export type DocumentOptionsInput = {
  letter_prefix?: 'CTH' | 'VEN' | 'LANDA' | 'VENTURO';
  tax_treatment?: TaxTreatment;
  clause_codes?: string[];
};

export type QuotationProfileInput = {
  preparation_mode?: PreparationMode;
  preparation_discount_bps?: number;
  maintenance_mode?: MaintenanceMode;
  scope_timeline_mode?: ScopeTimelineMode;
  included_phases?: QuotationPhase[];
  payment_mode?: QuotationPaymentMode;
  payment_rows?: PaymentRowInput[];
  document_options?: DocumentOptionsInput;
};

/**
 * Values in headcount_quarters and period_quarters are quarter-units. The
 * backend deliberately uses integers (1 = 0.25 FTE/month) so preview and
 * generation cannot drift because of floating point arithmetic.
 */
export type SquadLineInput = {
  role: string;
  seniority: string;
  headcount_quarters: number;
  period_quarters: number;
  workday_count?: number;
};

export type DedicatedTimelineInput = {
  mode: DedicatedTimelineMode | '';
  start_date?: string;
  sprint_end_date?: string;
};

export type DedicatedSquadInput = {
  model: SquadModel;
  requirement: string;
  development_squad: SquadLineInput[];
  maintenance_enabled: boolean;
  maintenance_squad: SquadLineInput[];
  kickoff_discount_bps: number;
  payment_count: number;
  /** ISO calendar date used by the backend for invoices and H+14 due dates. */
  payment_anchor_date: string;
  timeline: DedicatedTimelineInput;
  quotation_profile?: QuotationProfileInput;
};

export type SubscriptionSectionLayout = 'subscription_development' | 'development_maintenance';

export type SubscriptionBillingCycle = 'monthly' | 'quarterly' | 'yearly';

export type SubscriptionTaxTreatment = 'not_stated' | 'exclusive_ppn' | 'inclusive_ppn';

export type SubscriptionPricePeriodInput = {
  label: string;
  start_month_offset: number;
  duration_months: number;
  monthly_rate: number;
};

export type SubscriptionOneTimeItemInput = {
  name: string;
  amount: number;
};

export type SubscriptionPaymentRowInput = {
  work_period: string;
  start_month_offset: number;
  covered_months: number;
  invoice_date_label: string;
  due_date_label: string;
  nominal: number;
};

export type SubscriptionFeatureGroupInput = {
  name: string;
  features: string[];
};

export type IncomeSharingInput = {
  venturo_share_bps: number;
  partner_share_bps: number;
  eligible_revenue_description: string;
  settlement_business_days: number;
  prohibit_unilateral_discount: boolean;
};

export type SubscriptionSaaSInput = {
  product_name: string;
  quotation_date: string;
  section_layout: SubscriptionSectionLayout;
  billing_cycle: SubscriptionBillingCycle;
  tax_treatment: SubscriptionTaxTreatment;
  initial_term_months: number;
  auto_renewal: boolean;
  price_periods: SubscriptionPricePeriodInput[];
  one_time_items?: SubscriptionOneTimeItemInput[];
  payment_schedule: SubscriptionPaymentRowInput[];
  feature_groups?: SubscriptionFeatureGroupInput[];
  rights_clause_code?: string;
  is_partnership: boolean;
  income_sharing?: IncomeSharingInput;
};

export type WhiteLabelTaxTreatment = 'not_stated' | 'exclusive_ppn' | 'inclusive_ppn';

export type WhiteLabelPaymentComponent = 'license' | 'maintenance_hosting';

export type WhiteLabelLicenseItemInput = {
  name: string;
  unit_rate: number;
  quantity: number;
};

export type WhiteLabelMaintenanceItemInput = {
  name: string;
  monthly_rate: number;
  fte_quarters: number;
  period_months: number;
};

export type WhiteLabelHostingItemInput = {
  name: string;
  monthly_rate: number;
  quantity: number;
  period_months: number;
};

export type WhiteLabelModuleGroupInput = {
  name: string;
  features: string[];
};

export type WhiteLabelTimelineRowInput = {
  description: string;
  timeline: string;
};

export type WhiteLabelPaymentRowInput = {
  work_period: string;
  terms: string;
  invoice_date_label: string;
  due_date_label: string;
  component: WhiteLabelPaymentComponent;
  nominal: number;
};

export type WhiteLabelLimitationCode =
  | 'out_of_pocket'
  | 'overtime'
  | 'third_party'
  | 'scope_change';

export type WhiteLabelInput = {
  product_name: string;
  quotation_date: string;
  tax_treatment: WhiteLabelTaxTreatment;
  license_items: WhiteLabelLicenseItemInput[];
  maintenance_items?: WhiteLabelMaintenanceItemInput[];
  hosting_items?: WhiteLabelHostingItemInput[];
  module_groups?: WhiteLabelModuleGroupInput[];
  timeline_rows?: WhiteLabelTimelineRowInput[];
  payment_schedule: WhiteLabelPaymentRowInput[];
  rights_statements?: string[];
  limitation_codes: WhiteLabelLimitationCode[];
};

export type StandaloneMaintenanceMode = 'retainer' | 'hourly_task';

export type StandaloneMaintenancePriority = 'P0' | 'P1' | 'P2';

export type StandaloneMaintenanceTaxTreatment = 'not_stated' | 'exclusive_ppn' | 'inclusive_ppn';

export type RetainerCostItem = {
  name: string;
  monthly_rate: number;
  fte_quarters: number;
  period_months: number;
};

export type HourlyCostItem = {
  name: string;
  display_monthly_rate: number;
  headcount: number;
  hours_half_units: number;
  quoted_line_total: number;
};

export type MaintenanceDefectItem = {
  item_number: string;
  priority: StandaloneMaintenancePriority;
  function: string;
  screen_flow: string;
  existing: string;
  improvement: string;
  reference?: string;
};

export type MaintenanceDefectGroup = {
  title: string;
  items: MaintenanceDefectItem[];
};

export type HourlyMaintenanceTask = {
  description: string;
  platform: string;
  hours_half_units: number;
};

export type PaymentScheduleItem = {
  work_period: string;
  terms: string;
  invoice_date_label: string;
  due_date_label: string;
  nominal: number;
};

export type StandaloneMaintenanceInput = {
  system_name: string;
  quotation_date: string;
  mode: StandaloneMaintenanceMode;
  tax_treatment: StandaloneMaintenanceTaxTreatment;
  retainer_items?: RetainerCostItem[];
  hourly_cost_items?: HourlyCostItem[];
  defect_groups?: MaintenanceDefectGroup[];
  hourly_tasks?: HourlyMaintenanceTask[];
  discount_amount: number;
  show_discount_row: boolean;
  payment_schedule: PaymentScheduleItem[];
  rights_statements?: string[];
};

export type CustomDevelopmentTableMode = 'monthly_period' | 'daily_period' | 'fixed_days';
export type CustomDevelopmentTaxTreatment = 'exclusive_ppn' | 'inclusive_ppn' | 'not_stated';
export type CustomDevelopmentPaymentComponent = 'development' | 'monthly_recurring';

export type CustomDevelopmentCostItemInput = {
  name: string;
  display_rate?: number | null;
  headcount: number;
  period_label: string;
  quoted_line_total?: number | null;
};

export type CustomDevelopmentCostGroupInput = {
  title: string;
  items: CustomDevelopmentCostItemInput[];
};

export type CustomDevelopmentMonthlyItemInput = {
  name: string;
  specification: string;
  unit_rate: number;
  quantity: number;
};

export type CustomDevelopmentModuleGroupInput = {
  name: string;
  features: string[];
};

export type CustomDevelopmentTimelineRowInput = {
  description: string;
  timeline: string;
};

export type CustomDevelopmentPaymentRowInput = {
  work_period: string;
  terms: string;
  invoice_date_label: string;
  due_date_label: string;
  component: CustomDevelopmentPaymentComponent;
  nominal: number;
};

export type CustomDevelopmentInput = {
  system_name: string;
  quotation_date: string;
  development_table_mode: CustomDevelopmentTableMode;
  tax_treatment: CustomDevelopmentTaxTreatment;
  development_groups: CustomDevelopmentCostGroupInput[];
  discount_label?: string;
  discount_amount: number;
  show_discount_row: boolean;
  monthly_items?: CustomDevelopmentMonthlyItemInput[];
  monthly_notes?: string[];
  module_groups: CustomDevelopmentModuleGroupInput[];
  timeline_rows: CustomDevelopmentTimelineRowInput[];
  payment_schedule: CustomDevelopmentPaymentRowInput[];
  rights_statements?: string[];
  limitation_codes?: string[];
  additional_limitations?: string[];
};

type GenerateQuotationBase = {
  idempotency_key?: string;
  skill_id: string;
  client_id?: string;
  client_name?: string;
  client_company_name?: string;
  subject: string;
  solution_type: string;
};

export type DedicatedSquadGeneratePayload = GenerateQuotationBase & {
  commercial_scheme: 'dedicated_squad';
  rate_card_id: string;
  rate_card_code?: string;
  dedicated_squad: DedicatedSquadInput;
  /** Legacy fields remain optional for old revisions and compatibility. */
  project_duration_months?: number;
  budget_maximum?: number;
  summary?: string;
  mandatory_scope?: string[];
  optional_scope?: string[];
  allowed_standard_activities?: string[];
  payment_terms?: PaymentTermsInput;
  additional_notes?: string;
  discount_type?: 'none' | 'round_to_target' | 'fixed_amount' | 'percent';
  discount_input?: number;
  discount_name?: string;
  discount_reason?: string;
  subscription_saas?: never;
  white_label?: never;
  standalone_maintenance?: never;
  custom_development?: never;
};

export type SubscriptionSaaSGeneratePayload = GenerateQuotationBase & {
  commercial_scheme: 'subscription_saas';
  subscription_saas: SubscriptionSaaSInput;
  dedicated_squad?: never;
  white_label?: never;
  standalone_maintenance?: never;
  custom_development?: never;
};

export type WhiteLabelGeneratePayload = GenerateQuotationBase & {
  commercial_scheme: 'white_label';
  white_label: WhiteLabelInput;
  dedicated_squad?: never;
  subscription_saas?: never;
  standalone_maintenance?: never;
  custom_development?: never;
};

export type StandaloneMaintenanceGeneratePayload = GenerateQuotationBase & {
  commercial_scheme: 'standalone_maintenance';
  standalone_maintenance: StandaloneMaintenanceInput;
  dedicated_squad?: never;
  subscription_saas?: never;
  white_label?: never;
  custom_development?: never;
  rate_card_id?: never;
};

export type CustomDevelopmentGeneratePayload = GenerateQuotationBase & {
  commercial_scheme: 'custom_development';
  custom_development: CustomDevelopmentInput;
  dedicated_squad?: never;
  subscription_saas?: never;
  white_label?: never;
  standalone_maintenance?: never;
  rate_card_id?: never;
};

export type CustomDevelopmentPayload = CustomDevelopmentGeneratePayload;

export type GenerateQuotationPayload =
  | DedicatedSquadGeneratePayload
  | SubscriptionSaaSGeneratePayload
  | WhiteLabelGeneratePayload
  | StandaloneMaintenanceGeneratePayload
  | CustomDevelopmentGeneratePayload;

export type GenerateQuotationResponse = {
  quotation_id: string;
};

export type SquadLineCalculation = SquadLineInput & {
  term_type: 'short_term' | 'long_term' | string;
  amount_per_unit: number;
  line_total: number;
};

export type PreparationCalculation = {
  kind: 'hiring' | 'engineering_kickoff' | 'none' | string;
  gross: number;
  discount: number;
  net: number;
};

export type PaymentRow = {
  work_period: string;
  terms: string;
  invoice_date: string;
  due_date: string;
  nominal: number;
};

export type DedicatedSquadCalculation = {
  model: SquadModel;
  development: SquadLineCalculation[];
  development_subtotal: number;
  maintenance: SquadLineCalculation[];
  maintenance_subtotal: number;
  preparation: PreparationCalculation;
  total: number;
  discount: number;
  total_investment: number;
  payments: PaymentRow[];
};

export type DedicatedSquadDocumentSection = {
  number: number;
  code: string;
  title: string;
};

export type DedicatedSquadPreviewResponse = {
  calculation: DedicatedSquadCalculation;
  resolved_profile: QuotationProfileInput & {
    preparation_kind?: string;
    preparation_discount_bps?: number;
    maintenance_mode?: MaintenanceMode;
    scope_timeline_mode?: ScopeTimelineMode;
  };
  visible_sections: DedicatedSquadDocumentSection[];
  include_k6: boolean;
  include_pentest: boolean;
};

export type SubscriptionPricePeriodCalculation = SubscriptionPricePeriodInput & {
  subtotal: number;
};

export type SubscriptionSaaSCalculation = {
  price_periods: SubscriptionPricePeriodCalculation[];
  one_time_items?: SubscriptionOneTimeItemInput[];
  recurring_total: number;
  one_time_total: number;
  total_contract: number;
  payments: SubscriptionPaymentRowInput[];
};

export type ResolvedSubscriptionSaaSProfile = {
  section_layout: SubscriptionSectionLayout;
  billing_cycle: SubscriptionBillingCycle;
  tax_treatment: SubscriptionTaxTreatment;
  tax_clause_text?: string;
  rights_clause_code?: string;
  rights_clause_text?: string;
  income_sharing_text?: string;
  auto_renewal_text?: string;
  legal_catalog_version: string;
  has_features?: boolean;
};

export type SubscriptionDocumentSection = {
  number: number;
  code: string;
  title: string;
};

export type SubscriptionSaaSPreviewResponse = {
  calculation: SubscriptionSaaSCalculation;
  resolved_profile: ResolvedSubscriptionSaaSProfile;
  visible_sections: SubscriptionDocumentSection[];
};

export type WhiteLabelLicenseLineCalculation = WhiteLabelLicenseItemInput & {
  line_total: number;
};

export type WhiteLabelMaintenanceLineCalculation = WhiteLabelMaintenanceItemInput & {
  line_total: number;
};

export type WhiteLabelHostingLineCalculation = WhiteLabelHostingItemInput & {
  line_total: number;
};

export type WhiteLabelCalculation = {
  license: WhiteLabelLicenseLineCalculation[];
  maintenance?: WhiteLabelMaintenanceLineCalculation[];
  hosting?: WhiteLabelHostingLineCalculation[];
  license_subtotal: number;
  maintenance_subtotal: number;
  hosting_subtotal: number;
  maintenance_hosting_subtotal: number;
  total_investment: number;
  license_payment_total: number;
  maintenance_hosting_payment_total: number;
  payment_total: number;
};

export type WhiteLabelDocumentSection = {
  number: number;
  code: string;
  title: string;
};

export type ResolvedWhiteLabelProfile = {
  tax_treatment: WhiteLabelTaxTreatment;
  tax_clause_text?: string;
  show_maintenance_hosting: boolean;
  show_scope_timeline: boolean;
  show_rights: boolean;
  sections: WhiteLabelDocumentSection[];
};

export type WhiteLabelPreviewResponse = {
  calculation: WhiteLabelCalculation;
  resolved_profile: ResolvedWhiteLabelProfile;
};

export type RetainerLineCalculation = RetainerCostItem & {
  line_total: number;
};

export type HourlyLineCalculation = HourlyCostItem & {
  line_total: number;
};

export type StandaloneMaintenanceCalculation = {
  mode: StandaloneMaintenanceMode;
  retainer?: RetainerLineCalculation[];
  hourly?: HourlyLineCalculation[];
  subtotal: number;
  discount_amount: number;
  total_investment: number;
  payment_total: number;
};

export type StandaloneMaintenanceDocumentSection = {
  number: number;
  code: string;
  title: string;
};

export type ResolvedStandaloneMaintenanceProfile = {
  mode: StandaloneMaintenanceMode;
  tax_treatment: StandaloneMaintenanceTaxTreatment;
  tax_clause_text?: string;
  show_discount_row: boolean;
  show_rights: boolean;
  sections: StandaloneMaintenanceDocumentSection[];
};

export type StandaloneMaintenancePreviewResponse = {
  calculation: StandaloneMaintenanceCalculation;
  resolved_profile: ResolvedStandaloneMaintenanceProfile;
};

export type CustomDevelopmentCalculation = {
  development_subtotal: number;
  discount_amount: number;
  total_investment: number;
  monthly_total: number;
  development_payment_total: number;
  monthly_payment_rows: number;
  development_lines: Array<{
    group_index: number;
    item_index: number;
    name: string;
    display_rate: number | null;
    headcount: number;
    period_label: string;
    quoted_line_total: number | null;
  }>;
  monthly_lines: Array<{
    name: string;
    specification: string;
    unit_rate: number;
    quantity: number;
    line_total: number;
  }>;
};

export type CustomDevelopmentSectionConfig = {
  number: number;
  title: string;
  component: string;
};

export type ResolvedCustomDevelopmentProfile = {
  show_monthly: boolean;
  show_rights: boolean;
  sections: CustomDevelopmentSectionConfig[];
  rate_header: string;
  period_header: string;
  show_rate_column: boolean;
  tax_disclaimer: string;
};

export type CustomDevelopmentPreviewResponse = {
  calculation: CustomDevelopmentCalculation;
  resolved_profile: ResolvedCustomDevelopmentProfile;
};

export type GenerationProgressStage =
  | 'validating_input'
  | 'creating_draft'
  | 'preparing_allocation'
  | 'checking_rate_card'
  | 'composing_quotation'
  | 'sanitizing_document'
  | 'completed'
  | 'failed';

export type GenerationRevisionStatus = 'queued' | 'pending' | 'completed' | 'failed';

export type GenerationStateResponse = {
  generation_status: GenerationRevisionStatus;
  content_version: number;
  content_html: string;
  generated_at?: string;
  updated_at: string;
};

export type LegalTemplateSnapshot = {
  code?: string;
  version?: number;
  content_html?: string;
};

export type QuotationGenerationDetail = {
  quotation_id: string;
  company_id: string;
  client_id: string;
  quotation_number: string;
  subject: string;
  status: string;
  revision_id: string;
  created_at: string;
  updated_at: string;
  generation_status: GenerationRevisionStatus;
  content_version: number;
  content_html: string;
  legal_template_snapshot?: LegalTemplateSnapshot | string;
  legal_content_modified?: boolean;
  commercial_content_modified?: boolean;
  generated_at?: string;
};

export type SaveDraftPayload = {
  revision_id: string;
  content_html: string;
  content_version: number;
};

export type SaveDraftResultResponse = {
  quotation_id: string;
  revision_id: string;
  content_version: number;
  content_html: string;
  legal_content_modified: boolean;
  commercial_content_modified: boolean;
  updated_at: string;
};

export type ActiveSkill = {
  id: string;
  name: string;
  command: string;
  content_instruction?: string;
  is_active: boolean;
};

export type RateCardSummary = {
  id: string;
  code: string;
  name: string;
  market: string;
  client_tier?: string;
  currency: string;
  is_active: boolean;
  item_count?: number;
};

export type ClientSummary = {
  id: string;
  name: string;
  slug?: string;
  is_active?: boolean;
};
