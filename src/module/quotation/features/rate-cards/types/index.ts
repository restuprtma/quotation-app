export type Discipline = 'ENGINEERING' | 'QA' | 'PRODUCT' | 'DATA' | 'INFRASTRUCTURE' | 'SUPPORT';

export type Seniority = 'associate' | 'intermediate' | 'senior';

export type TermType = 'short_term' | 'long_term';

export type ClientTier = 'commercial_national' | 'government_bumn' | 'international';

export type Market = 'national' | 'international';

export interface RateCardItem {
  id: string;
  rate_card_id: string;
  role: string;
  display_name: string;
  seniority: Seniority;
  discipline: Discipline;
  term_type: TermType;
  amount_per_month: number;
  base_salary: number;
  tech_lead_fee: number;
  ai_rnd_fee: number;
  workspace_fee: number;
  management_fee: number;
  daily_rate: number;
  hourly_rate: number;
  education_requirement: string;
  experience_requirement: string;
  published_rate: number;
  max_discount_pct: number;
  floor_rate: number;
  kickoff_fee: number;
  recruitment_fee: number;
  onboarding_fee: number;
  total_hiring_fee: number;
  created_at?: string;
  updated_at?: string;
}

export interface OvertimeRateConfig {
  id: string;
  company_id?: string;
  rate_card_id?: string;
  role: string;
  seniority: string;
  term_type: string;
  base_monthly_rate: number;
  hourly_rate: number;
  hourly_divisor: number;
  workday_first_hour_multiplier?: number;
  workday_subsequent_multiplier?: number;
  holiday_base_multiplier?: number;
  holiday_9th_hour_multiplier?: number;
  holiday_10plus_multiplier?: number;
}

export interface InfrastructurePackage {
  id: string;
  company_id?: string;
  rate_card_id?: string;
  category: 'shared_hosting' | 'vps_cloud' | string;
  package_name: string;
  vcpu: number;
  ram_gb: number;
  storage_gb: number;
  amount_per_month: number;
}

export interface RateCard {
  id: string;
  company_id?: string;
  code: string;
  name: string;
  market: Market;
  client_tier: ClientTier;
  currency: string;
  description: string;
  short_term_surcharge_pct: number;
  enterprise_markup_pct: number;
  is_active: boolean;
  is_default?: boolean;
  effective_from: string;
  effective_until?: string | null;
  items?: RateCardItem[];
  overtime_configs?: OvertimeRateConfig[];
  infra_packages?: InfrastructurePackage[];
  created_at: string;
  updated_at?: string;
}

export interface RateCardSummaryResponse {
  id: string;
  code: string;
  name: string;
  market: Market;
  client_tier: ClientTier;
  currency: string;
  is_active: boolean;
  is_default?: boolean;
  item_count: number;
  created_at: string;
}

export type RateCardDetailResponse = RateCard;

export interface CreateRateCardItemPayload {
  role: string;
  display_name: string;
  seniority: Seniority;
  discipline: Discipline;
  term_type: TermType;
  amount_per_month: number;
  base_salary?: number;
  tech_lead_fee?: number;
  ai_rnd_fee?: number;
  workspace_fee?: number;
  management_fee?: number;
  education_requirement?: string;
  experience_requirement?: string;
  published_rate?: number;
  max_discount_pct?: number;
  floor_rate?: number;
  kickoff_fee?: number;
  recruitment_fee?: number;
  onboarding_fee?: number;
}

export type UpdateRateCardItemPayload = Partial<CreateRateCardItemPayload>;

export interface UpdateRateCardItemArgs {
  itemId: string;
  payload: UpdateRateCardItemPayload;
}

export interface CreateRateCardPayload {
  code: string;
  name: string;
  market: Market;
  client_tier: ClientTier;
  currency: string;
  description?: string;
  short_term_surcharge_pct?: number;
  enterprise_markup_pct?: number;
  effective_from: string;
  effective_until?: string;
  items: CreateRateCardItemPayload[];
}

export interface RateCardListParams {
  active_only?: boolean;
  status?: 'active' | 'inactive';
  search?: string;
}

// ----------------------------------------------------------------------
// Standard Reference Data
// ----------------------------------------------------------------------

export interface StandardRoleDefinition {
  role: string;
  displayName: string;
  discipline: Discipline;
  education: string;
  experience: string;
}

export const STANDARD_ROLES: readonly StandardRoleDefinition[] = [
  {
    role: 'business_analyst',
    displayName: 'Business Analyst',
    discipline: 'PRODUCT',
    education: 'S1',
    experience: '> 2 th',
  },
  {
    role: 'system_analyst',
    displayName: 'System Analyst',
    discipline: 'ENGINEERING',
    education: 'S1',
    experience: '> 2 th',
  },
  {
    role: 'frontend_programmer',
    displayName: 'Front End Programmer',
    discipline: 'ENGINEERING',
    education: 'S1/D4',
    experience: '> 2 th',
  },
  {
    role: 'backend_programmer',
    displayName: 'Back End Programmer',
    discipline: 'ENGINEERING',
    education: 'S1/D4',
    experience: '> 2 th',
  },
  {
    role: 'fullstack_developer',
    displayName: 'Full Stack Developer',
    discipline: 'ENGINEERING',
    education: 'S1/D4',
    experience: '> 2 th',
  },
  {
    role: 'mobile_developer',
    displayName: 'Mobile Developer',
    discipline: 'ENGINEERING',
    education: 'S1/D4',
    experience: '> 2 th',
  },
  {
    role: 'devops',
    displayName: 'DevOps Engineer',
    discipline: 'INFRASTRUCTURE',
    education: 'S1/D4',
    experience: '> 2 th',
  },
  {
    role: 'data_engineer',
    displayName: 'Data Engineer',
    discipline: 'DATA',
    education: 'S1/D4',
    experience: '> 2 th',
  },
  {
    role: 'data_analyst',
    displayName: 'Data Analyst',
    discipline: 'DATA',
    education: 'S1/D4',
    experience: '> 2 th',
  },
  {
    role: 'ui_ux_designer',
    displayName: 'UI/UX Designer',
    discipline: 'PRODUCT',
    education: 'D3/S1',
    experience: '> 2 th',
  },
  {
    role: 'automated_tester',
    displayName: 'Automated Tester (QA Automation)',
    discipline: 'QA',
    education: 'D3/S1',
    experience: '< 2 th',
  },
  {
    role: 'functional_tester',
    displayName: 'Functional Tester (Manual QA)',
    discipline: 'QA',
    education: 'D3',
    experience: '< 2 th',
  },
  {
    role: 'technical_writer',
    displayName: 'Technical Writer',
    discipline: 'SUPPORT',
    education: 'D3',
    experience: '> 2 th',
  },
  {
    role: 'pentester',
    displayName: 'Penetration Tester',
    discipline: 'INFRASTRUCTURE',
    education: 'S1/Sertifikasi',
    experience: '> 2 th',
  },
] as const;

export const DISCIPLINES: readonly Discipline[] = [
  'ENGINEERING',
  'QA',
  'PRODUCT',
  'DATA',
  'INFRASTRUCTURE',
  'SUPPORT',
] as const;

export const SENIORITIES: readonly Seniority[] = ['associate', 'intermediate', 'senior'] as const;

export const TERM_TYPES: readonly TermType[] = ['short_term', 'long_term'] as const;

export const CLIENT_TIERS: readonly ClientTier[] = [
  'commercial_national',
  'government_bumn',
  'international',
] as const;
