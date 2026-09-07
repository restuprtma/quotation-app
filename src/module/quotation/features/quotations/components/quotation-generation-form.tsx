import type { SquadModel, ActiveSkill, SquadLineInput, GenerateQuotationPayload } from '../types';

import { z } from 'zod';
import { useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import {
  Form,
  RHFSelect,
  RHFSwitch,
  RHFTextField,
} from 'src/shared/ui/hook-form';

import { SquadPicker } from './squad-picker';
import { useClients } from '../hooks/use-clients';
import { SOLUTION_TYPES } from '../constants/scope-presets';
import { useActiveSkills } from '../hooks/use-active-skills';
import { useActiveRateCards } from '../hooks/use-active-rate-cards';
import { useDedicatedSquadPreview } from '../hooks/use-quotation-generation';
import { QuotationCalculationPreview } from './quotation-calculation-preview';
import { QuotationProfilePanel } from './quotation-profile-panel';
import { normalizeQuotationProfileForMode } from '../constants/dedicated-squad';
import {
  DEDICATED_SQUAD_MODELS,
  getDefaultPaymentCount,
  getDefaultTimelineMode,
  isGeneratorRateCardCode,
  DEDICATED_TIMELINE_MODES,
  getDedicatedSquadVisibility,
} from '../constants/dedicated-squad';

// ----------------------------------------------------------------------

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const baseLineSchema = z.object({
  role: z.string().trim().min(1),
  seniority: z.string().trim().min(1),
  headcount_quarters: z.number().int().min(1).max(400),
});

const projectLineSchema = baseLineSchema.extend({
  period_quarters: z.number().int().min(1).max(96),
  workday_count: z.number().int().min(0).max(0),
});

const sprintLineSchema = baseLineSchema.extend({
  period_quarters: z.number().int().min(0).max(0),
  workday_count: z.number().int().min(1).max(366),
});

const projectTimelineSchema = z.object({
  mode: z.enum(['relative', 'calendar']),
  start_date: z.string().regex(ISO_DATE_PATTERN).optional(),
  sprint_end_date: z.string().max(0).optional(),
});

const sprintTimelineSchema = z.object({
  mode: z.literal('sprint'),
  start_date: z.string().regex(ISO_DATE_PATTERN),
  sprint_end_date: z.string().regex(ISO_DATE_PATTERN),
});

const noTimelineSchema = z.object({
  mode: z.literal(''),
  start_date: z.string().max(0).optional(),
  sprint_end_date: z.string().max(0).optional(),
});

const commonDedicatedFields = {
  requirement: z.string().trim().min(1).max(20_000),
  payment_count: z.number().int().min(1).max(60),
  payment_anchor_date: z.string().regex(ISO_DATE_PATTERN),
};

const quotationProfileSchema = z.object({
  preparation_mode: z.enum(['', 'none', 'hiring', 'engineering_kickoff']).optional(),
  preparation_discount_bps: z.number().int().min(0).max(10_000).optional(),
  maintenance_mode: z.enum(['', 'none', 'separate_section', 'within_development']).optional(),
  scope_timeline_mode: z.enum(['', 'none', 'relative', 'calendar', 'sprint']).optional(),
  included_phases: z.array(z.enum(['requirement', 'development', 'sit', 'uat', 'go_live', 'maintenance', 'k6', 'pentest'])).optional(),
  payment_mode: z.enum(['', 'preset', 'explicit_rows']).optional(),
  payment_rows: z.array(z.object({
    work_period: z.string().trim().min(1).max(120),
    terms: z.string().trim().min(1).max(120),
    allocation_kind: z.enum(['investment_bps', 'net_preparation', 'remaining_bps']),
    allocation_bps: z.number().int().min(0).max(10_000).optional(),
    invoice_month_offset: z.number().int().min(0).max(59).optional(),
    invoice_at_sprint_end: z.boolean().optional(),
  })).max(60).optional(),
  document_options: z.object({
    letter_prefix: z.enum(['CTH', 'VEN', 'LANDA', 'VENTURO']).optional(),
    tax_treatment: z.enum(['', 'exclusive_ppn', 'inclusive_ppn']).optional(),
    clause_codes: z.array(z.enum(['out_of_pocket', 'overtime', 'onsite', 'third_party'])).optional(),
  }).optional(),
}).optional();

/**
 * Keep the form contract discriminated by model. The API has the same matrix;
 * this prevents controls hidden for one model from leaking into its payload.
 */
export const dedicatedSquadSchema = z.discriminatedUnion('model', [
  z.object({
    model: z.literal('1A'),
    ...commonDedicatedFields,
    development_squad: z.array(projectLineSchema).min(1),
    maintenance_enabled: z.boolean(),
    maintenance_squad: z.array(projectLineSchema),
    kickoff_discount_bps: z.literal(0),
    timeline: projectTimelineSchema,
    quotation_profile: quotationProfileSchema,
  }),
  z.object({
    model: z.literal('1B'),
    ...commonDedicatedFields,
    development_squad: z.array(projectLineSchema).min(1),
    maintenance_enabled: z.literal(false),
    maintenance_squad: z.array(projectLineSchema).max(0),
    kickoff_discount_bps: z.literal(0),
    timeline: projectTimelineSchema,
    quotation_profile: quotationProfileSchema,
  }),
  z.object({
    model: z.literal('1C'),
    ...commonDedicatedFields,
    development_squad: z.array(projectLineSchema).min(1),
    maintenance_enabled: z.literal(false),
    maintenance_squad: z.array(projectLineSchema).max(0),
    kickoff_discount_bps: z.union([z.literal(5_000), z.literal(10_000)]),
    timeline: noTimelineSchema,
    quotation_profile: quotationProfileSchema,
  }),
  z.object({
    model: z.literal('1D'),
    ...commonDedicatedFields,
    development_squad: z.array(sprintLineSchema).min(1),
    maintenance_enabled: z.literal(false),
    maintenance_squad: z.array(projectLineSchema).max(0),
    kickoff_discount_bps: z.literal(0),
    timeline: sprintTimelineSchema,
    quotation_profile: quotationProfileSchema,
  }),
]);

export const quotationGenerationSchema = z.object({
  client_id: z.string().optional(),
  client_name: z.string().trim().min(1).max(200),
  client_company_name: z.string().trim().optional(),
  subject: z.string().trim().min(1).max(200),
  solution_type: z.string().min(1),
  commercial_scheme: z.literal('dedicated_squad'),
  rate_card_id: z.string().min(1),
  dedicated_squad: dedicatedSquadSchema,
}).superRefine((data, context) => {
  if (
    data.dedicated_squad.model === '1A' &&
    data.dedicated_squad.maintenance_enabled &&
    data.dedicated_squad.maintenance_squad.length === 0
  ) {
    context.addIssue({
      code: 'custom',
      path: ['dedicated_squad', 'maintenance_squad'],
      message: 'Maintenance squad is required when enabled',
    });
  }
});

export type QuotationGenerationFormValues = z.infer<typeof quotationGenerationSchema>;

type Props = {
  selectedSkill?: ActiveSkill | null;
  isSubmitting?: boolean;
  onSubmit: (payload: GenerateQuotationPayload) => void;
  onCancel: () => void;
};

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function nextWeekday(date: Date) {
  const next = new Date(date);
  while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
  return next;
}

function getDefaultDates() {
  const start = nextWeekday(new Date());
  const end = new Date(start);
  let weekdays = 1;
  while (weekdays < 5) {
    end.setDate(end.getDate() + 1);
    if (end.getDay() !== 0 && end.getDay() !== 6) weekdays += 1;
  }
  return { start: toISODate(start), end: toISODate(end), anchor: toISODate(start) };
}

function getDefaultLine(model: SquadModel): SquadLineInput & { workday_count: number } {
  return {
    role: 'frontend_programmer',
    seniority: 'intermediate',
    headcount_quarters: 4,
    period_quarters: model === '1D' ? 0 : 24,
    workday_count: model === '1D' ? 5 : 0,
  };
}

function resolveSkillId(selectedSkill: ActiveSkill | null | undefined, activeSkills: ActiveSkill[]) {
  if (
    selectedSkill?.id &&
    !selectedSkill.id.startsWith('cmd-') &&
    selectedSkill.id !== '00000000-0000-0000-0000-000000000000'
  ) {
    return selectedSkill.id;
  }
  const match = activeSkills.find(
    (skill) =>
      skill.command === '/quotation' ||
      skill.command === 'quotation' ||
      skill.command === selectedSkill?.command
  );
  return match?.id || activeSkills[0]?.id || '00000000-0000-0000-0000-000000000000';
}

export function toDedicatedSquadPayload(
  data: QuotationGenerationFormValues,
  selectedSkill: ActiveSkill | null | undefined,
  activeSkills: ActiveSkill[],
  rateCardCode?: string
): GenerateQuotationPayload {
  const requirement = data.dedicated_squad.requirement.trim();
  return {
    skill_id: resolveSkillId(selectedSkill, activeSkills),
    client_id: data.client_id || undefined,
    client_name: data.client_name.trim(),
    client_company_name: data.client_company_name?.trim() || undefined,
    subject: data.subject.trim(),
    solution_type: data.solution_type,
    commercial_scheme: 'dedicated_squad',
    rate_card_id: data.rate_card_id,
    rate_card_code: rateCardCode,
    summary: requirement,
    mandatory_scope: [requirement],
    optional_scope: [],
    dedicated_squad: {
      ...data.dedicated_squad,
      requirement,
      development_squad: data.dedicated_squad.development_squad.map((line) => ({ ...line })),
      maintenance_squad: data.dedicated_squad.maintenance_squad.map((line) => ({ ...line })),
      quotation_profile: normalizeQuotationProfileForMode(data.dedicated_squad.quotation_profile),
    },
  };
}

export function createDefaultDedicatedSquadValues(
  model: SquadModel = '1A',
  rateCardId = '',
  client?: { id: string; name: string }
): QuotationGenerationFormValues {
  const dates = getDefaultDates();
  const line = getDefaultLine(model);
  return {
    client_id: client?.id || '',
    client_company_name: client?.name || '',
    client_name: 'Pimpinan Perusahaan',
    subject: '',
    solution_type: 'Web Application',
    commercial_scheme: 'dedicated_squad',
    rate_card_id: rateCardId,
    dedicated_squad: {
      model,
      requirement: '',
      development_squad: [line],
      maintenance_enabled: false,
      maintenance_squad: [],
      kickoff_discount_bps: model === '1C' ? 5_000 : 0,
      payment_count: getDefaultPaymentCount(model),
      payment_anchor_date: dates.anchor,
      timeline: {
        mode: getDefaultTimelineMode(model),
        start_date: model === '1D' ? dates.start : undefined,
        sprint_end_date: model === '1D' ? dates.end : undefined,
      },
    } as QuotationGenerationFormValues['dedicated_squad'],
  };
}

export function QuotationGenerationForm({
  selectedSkill,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslate('quotation');
  const { data: activeSkills = [] } = useActiveSkills();
  const { data: clients = [] } = useClients();
  const { data: allRateCards = [], isLoading: isLoadingRateCards } = useActiveRateCards();
  const rateCards = useMemo(
    () => allRateCards.filter((card) => isGeneratorRateCardCode(card.code)),
    [allRateCards]
  );

  const defaultValues = useMemo(
    () => createDefaultDedicatedSquadValues('1A', rateCards[0]?.id, clients[0]),
    [clients, rateCards]
  );
  const methods = useForm<QuotationGenerationFormValues>({
    resolver: zodResolver(quotationGenerationSchema),
    defaultValues,
    mode: 'onChange',
  });
  const { control, handleSubmit, setValue, formState } = methods;
  const values = useWatch({ control });
  const model = (values.dedicated_squad?.model || '1A') as SquadModel;
  const visibility = getDedicatedSquadVisibility(model);
  const timelineMode = values.dedicated_squad?.timeline?.mode;
  const maintenanceEnabled = Boolean(values.dedicated_squad?.maintenance_enabled);

  useEffect(() => {
    if (clients.length > 0 && !values.client_id && !values.client_company_name) {
      setValue('client_id', clients[0].id, { shouldValidate: true });
      setValue('client_company_name', clients[0].name, { shouldValidate: true });
    }
  }, [clients, setValue, values.client_company_name, values.client_id]);

  useEffect(() => {
    if (rateCards.length > 0 && !values.rate_card_id) {
      setValue('rate_card_id', rateCards[0].id, { shouldValidate: true });
    }
  }, [rateCards, setValue, values.rate_card_id]);

  useEffect(() => {
    if (model !== '1A' || !maintenanceEnabled || values.dedicated_squad?.maintenance_squad?.length) {
      return;
    }
    setValue('dedicated_squad.maintenance_squad', [getDefaultLine('1A')], {
      shouldValidate: true,
    });
  }, [maintenanceEnabled, model, setValue, values.dedicated_squad?.maintenance_squad?.length]);

  const previewPayload = useMemo(() => {
    const parsed = quotationGenerationSchema.safeParse(values);
    if (!parsed.success || rateCards.length === 0) return null;
    const card = rateCards.find((item) => item.id === parsed.data.rate_card_id);
    return toDedicatedSquadPayload(parsed.data, selectedSkill, activeSkills, card?.code);
  }, [activeSkills, rateCards, selectedSkill, values]);
  const preview = useDedicatedSquadPreview(previewPayload, formState.isValid && !isSubmitting);
  const previewReady = Boolean(
    preview.data && !preview.isFetching && !preview.isDebouncing && !preview.error
  );

  const submit = handleSubmit((data) => {
    if (!previewReady) return;
    const card = rateCards.find((item) => item.id === data.rate_card_id);
    onSubmit(toDedicatedSquadPayload(data, selectedSkill, activeSkills, card?.code));
  });

  const handleModelChange = (nextModel: SquadModel) => {
    const current = values.dedicated_squad as QuotationGenerationFormValues['dedicated_squad'];
    const dates = getDefaultDates();
    setValue('dedicated_squad.model', nextModel, { shouldValidate: true });
    setValue('dedicated_squad.payment_count', getDefaultPaymentCount(nextModel), {
      shouldValidate: true,
    });
    setValue('dedicated_squad.maintenance_enabled', false, { shouldValidate: true });
    setValue('dedicated_squad.maintenance_squad', [], { shouldValidate: true });
    setValue('dedicated_squad.kickoff_discount_bps', nextModel === '1C' ? 5_000 : 0, {
      shouldValidate: true,
    });
    if (nextModel === '1C') {
      setValue('dedicated_squad.timeline', { mode: '' }, { shouldValidate: true });
    } else if (nextModel === '1D') {
      setValue(
        'dedicated_squad.timeline',
        { mode: 'sprint', start_date: dates.start, sprint_end_date: dates.end },
        { shouldValidate: true }
      );
    } else {
      setValue(
        'dedicated_squad.timeline',
        { mode: getDefaultTimelineMode(nextModel) === 'calendar' ? 'calendar' : 'relative' },
        { shouldValidate: true }
      );
    }
    setValue(
      'dedicated_squad.development_squad',
      (current.development_squad || []).map((line) => ({
        ...line,
        period_quarters: nextModel === '1D' ? 0 : line.period_quarters || 24,
        workday_count: nextModel === '1D' ? line.workday_count || 5 : 0,
      })),
      { shouldValidate: true }
    );
  };

  return (
    <Form methods={methods} onSubmit={submit} sx={{ width: '100%', maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={3}>
        <Alert
          severity="info"
          icon={<Iconify icon="solar:atom-bold-duotone" width={22} />}
          action={
            <Button color="inherit" size="small" onClick={onCancel}>
              {t('dedicatedSquadForm.changeCommand')}
            </Button>
          }
          sx={{ borderRadius: 1.5 }}
        >
          <Typography variant="subtitle2">
            {t('dedicatedSquadForm.activeSkillBanner')} <strong>{selectedSkill?.command || '/quotation'}</strong>{' '}
            ({selectedSkill?.name || t('dedicatedSquadForm.defaultSkill')})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('dedicatedSquadForm.compact.aiHint')}
          </Typography>
        </Alert>

        <Card>
          <CardHeader
            title={t('dedicatedSquadForm.compact.identityTitle')}
            subheader={t('dedicatedSquadForm.compact.identitySubtitle')}
          />
          <CardContent>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 8 }}>
                <RHFTextField
                  name="subject"
                  label={t('dedicatedSquadForm.subject')}
                  placeholder={t('dedicatedSquadForm.subjectPlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <RHFSelect name="solution_type" label={t('dedicatedSquadForm.solutionType')} disabled={isSubmitting}>
                  {SOLUTION_TYPES.map((item) => (
                    <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                  ))}
                </RHFSelect>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name="client_company_name"
                  label={t('dedicatedSquadForm.clientCompany')}
                  placeholder={t('dedicatedSquadForm.clientCompanyPlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name="client_name"
                  label={t('dedicatedSquadForm.clientName')}
                  placeholder={t('dedicatedSquadForm.clientNamePlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title={t('dedicatedSquadForm.compact.modelTitle')}
            subheader={t('dedicatedSquadForm.compact.modelSubtitle')}
          />
          <CardContent>
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <RHFSelect
                    name="dedicated_squad.model"
                    label={t('dedicatedSquadForm.compact.modelLabel')}
                    disabled={isSubmitting}
                    onChange={(event) => handleModelChange(event.target.value as SquadModel)}
                  >
                    {DEDICATED_SQUAD_MODELS.map((item) => (
                      <MenuItem key={item.value} value={item.value}>
                        {item.value} — {t(`dedicatedSquadForm.${item.labelKey}`)}
                      </MenuItem>
                    ))}
                  </RHFSelect>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <RHFSelect
                    name="rate_card_id"
                    label={t('dedicatedSquadForm.rateCard')}
                    disabled={isSubmitting || isLoadingRateCards}
                  >
                    {rateCards.map((card) => (
                      <MenuItem key={card.id} value={card.id}>
                        {card.name} ({card.code})
                      </MenuItem>
                    ))}
                    {rateCards.length === 0 && (
                      <MenuItem value="" disabled>{t('dedicatedSquadForm.compact.noRateCards')}</MenuItem>
                    )}
                  </RHFSelect>
                </Grid>
              </Grid>

              <RHFTextField
                name="dedicated_squad.requirement"
                label={t('dedicatedSquadForm.compact.requirement')}
                placeholder={t('dedicatedSquadForm.compact.requirementPlaceholder')}
                multiline
                rows={5}
                disabled={isSubmitting}
                helperText={t('dedicatedSquadForm.compact.requirementHint')}
              />

              <SquadPicker name="dedicated_squad.development_squad" model={model} disabled={isSubmitting} />

              <QuotationProfilePanel disabled={isSubmitting} />

              {visibility.includeMaintenance && (
                <>
                  <RHFSwitch
                    name="dedicated_squad.maintenance_enabled"
                    label={t('dedicatedSquadForm.compact.maintenanceToggle')}
                    disabled={isSubmitting}
                  />
                  {maintenanceEnabled && (
                    <SquadPicker
                      name="dedicated_squad.maintenance_squad"
                      model="1A"
                      maintenance
                      disabled={isSubmitting}
                    />
                  )}
                </>
              )}

              {visibility.includeKickoffDiscount && (
                <RHFSelect
                  name="dedicated_squad.kickoff_discount_bps"
                  label={t('dedicatedSquadForm.compact.kickoffDiscount')}
                  disabled={isSubmitting}
                >
                  <MenuItem value={5_000}>{t('dedicatedSquadForm.compact.discount50')}</MenuItem>
                  <MenuItem value={10_000}>{t('dedicatedSquadForm.compact.discount100')}</MenuItem>
                </RHFSelect>
              )}
            </Stack>
          </CardContent>
        </Card>

        {visibility.includeTimeline && (
          <Card>
            <CardHeader
              title={t('dedicatedSquadForm.compact.timelineTitle')}
              subheader={t('dedicatedSquadForm.compact.timelineSubtitle')}
            />
            <CardContent>
              <Grid container spacing={2.5}>
                {visibility.includeTimelineMode && (
                  <Grid size={{ xs: 12, md: 4 }}>
                    <RHFSelect
                      name="dedicated_squad.timeline.mode"
                      label={t('dedicatedSquadForm.compact.timelineMode')}
                      disabled={isSubmitting}
                    >
                      {DEDICATED_TIMELINE_MODES.filter((item) => item.value !== 'sprint').map((item) => (
                        <MenuItem key={item.value} value={item.value}>
                          {t(`dedicatedSquadForm.${item.labelKey}`)}
                        </MenuItem>
                      ))}
                    </RHFSelect>
                  </Grid>
                )}
                {visibility.includeCalendarDates && timelineMode === 'calendar' && (
                  <Grid size={{ xs: 12, md: 4 }}>
                    <RHFTextField
                      name="dedicated_squad.timeline.start_date"
                      label={t('dedicatedSquadForm.compact.timelineStart')}
                      type="date"
                      disabled={isSubmitting}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                )}
                {visibility.includeSprintDates && (
                  <>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <RHFTextField
                        name="dedicated_squad.timeline.start_date"
                        label={t('dedicatedSquadForm.compact.timelineStart')}
                        type="date"
                        disabled={isSubmitting}
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <RHFTextField
                        name="dedicated_squad.timeline.sprint_end_date"
                        label={t('dedicatedSquadForm.compact.timelineEnd')}
                        type="date"
                        disabled={isSubmitting}
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader
            title={t('dedicatedSquadForm.compact.paymentTitle')}
            subheader={t('dedicatedSquadForm.compact.paymentSubtitle')}
          />
          <CardContent>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name="dedicated_squad.payment_anchor_date"
                  label={t('dedicatedSquadForm.compact.paymentAnchor')}
                  type="date"
                  disabled={isSubmitting}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name="dedicated_squad.payment_count"
                  label={t('dedicatedSquadForm.compact.paymentCount')}
                  type="number"
                  disabled={isSubmitting}
                  slotProps={{ htmlInput: { min: 1, max: 60, step: 1 } }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <QuotationCalculationPreview
          preview={preview.data}
          isLoading={preview.isFetching}
          isDebouncing={preview.isDebouncing}
          error={preview.error}
        />

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 1, pb: 4 }}>
          <Button variant="outlined" color="inherit" onClick={onCancel} disabled={isSubmitting}>
            {t('dedicatedSquadForm.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting || !formState.isValid || !previewReady}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Iconify icon="solar:atom-bold-duotone" />
              )
            }
          >
            {isSubmitting ? t('dedicatedSquadForm.submitting') : t('dedicatedSquadForm.compact.submit')}
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
}
