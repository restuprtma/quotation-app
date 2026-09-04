import type { ActiveSkill, GenerateQuotationPayload } from '../types';

import { z } from 'zod';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { Form, RHFSelect, RHFTextField, RHFAutocomplete, RHFNumericField } from 'src/shared/ui/hook-form';

import { useClients } from '../hooks/use-clients';
import { useActiveSkills } from '../hooks/use-active-skills';
import { useActiveRateCards } from '../hooks/use-active-rate-cards';
import {
  SOLUTION_TYPES,
  SCOPE_PRESETS_BY_SOLUTION_TYPE,
  STANDARD_DEVELOPMENT_ACTIVITIES,
} from '../constants/scope-presets';

// ----------------------------------------------------------------------

const MILESTONE_PRESETS = [
  {
    label: '30% - 50% - 20% (Standard)',
    items: [
      {
        milestone_name: 'Down Payment (DP)',
        percentage: 30,
        description: 'Kickoff & Initial Discovery',
      },
      {
        milestone_name: 'UAT & Feature Complete',
        percentage: 50,
        description: 'User Acceptance Testing',
      },
      {
        milestone_name: 'Final Handover & Launch',
        percentage: 20,
        description: 'Production Deployment',
      },
    ],
  },
  {
    label: '50% - 50% (Two Phases)',
    items: [
      {
        milestone_name: 'Down Payment (DP)',
        percentage: 50,
        description: 'Project Inception & Development',
      },
      {
        milestone_name: 'Final Delivery',
        percentage: 50,
        description: 'Final Acceptance & Release',
      },
    ],
  },
  {
    label: '100% (Upfront)',
    items: [
      {
        milestone_name: 'Full Payment',
        percentage: 100,
        description: 'Full upfront payment upon agreement',
      },
    ],
  },
];

// ----------------------------------------------------------------------

const paymentTermItemSchema = z.object({
  milestone_name: z.string().trim().min(1, 'Milestone name is required'),
  percentage: z.number().min(1, 'Min 1%').max(100, 'Max 100%'),
  description: z.string().optional(),
});

const quotationGenerationSchema = z.object({
  client_id: z.string().optional(),
  client_name: z.string().trim().min(1, 'Nama penerima / PIC (Yth.) wajib diisi'),
  client_company_name: z.string().trim().optional(),
  subject: z.string().trim().min(1, 'Subject is required').max(200, 'Max 200 characters'),
  solution_type: z.string().min(1, 'Solution type is required'),
  commercial_scheme: z.literal('dedicated_squad'),
  rate_card_id: z.string().uuid('Rate card is required'),
  rate_card_code: z.string().optional(),
  project_duration_months: z
    .number()
    .min(1, 'Duration must be at least 1 month')
    .max(24, 'Duration cannot exceed 24 months'),
  budget_maximum: z.number().min(1, 'Budget maximum must be greater than 0'),
  summary: z.string().trim().min(1, 'Project summary is required'),
  mandatory_scope: z
    .array(
      z.object({
        value: z
          .string()
          .trim()
          .min(1, 'Scope item cannot be empty')
          .max(200, 'Max 200 characters'),
      })
    )
    .min(1, 'At least 1 mandatory scope item is required'),
  optional_scope: z.array(z.object({ value: z.string().trim() })).optional(),
  allowed_standard_activities: z.array(z.string()).optional(),
  payment_terms: z
    .object({
      mode: z.literal('milestone'),
      items: z.array(paymentTermItemSchema).min(1, 'At least 1 payment milestone is required'),
    })
    .refine(
      (val) => {
        const total = val.items.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);
        return total === 100;
      },
      {
        message: 'Total milestone percentages must equal exactly 100%',
        path: ['items'],
      }
    ),
  additional_notes: z.string().optional(),
  discount_type: z.enum(['none', 'round_to_target', 'fixed_amount', 'percent']).optional(),
  discount_input: z.number().min(0, 'Discount input cannot be negative').optional(),
  discount_name: z.string().max(100, 'Max 100 characters').optional(),
  discount_reason: z.string().max(500, 'Max 500 characters').optional(),
})
.refine(
  (data) => {
    if (!data.discount_type || data.discount_type === 'none') return true;
    return Number(data.discount_input ?? 0) > 0;
  },
  { message: 'Discount input is required', path: ['discount_input'] }
)
.refine(
  (data) => {
    if (data.discount_type !== 'percent') return true;
    const value = Number(data.discount_input ?? 0);
    return value >= 1 && value <= 100;
  },
  { message: 'Percentage must be between 1 and 100', path: ['discount_input'] }
);

type FormValues = z.infer<typeof quotationGenerationSchema>;

// ----------------------------------------------------------------------

type Props = {
  selectedSkill?: ActiveSkill | null;
  isSubmitting?: boolean;
  onSubmit: (payload: GenerateQuotationPayload) => void;
  onCancel: () => void;
};

export function QuotationGenerationForm({
  selectedSkill,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslate('quotation');
  const { data: activeSkills = [] } = useActiveSkills();
  const { data: clients = [], isLoading: isLoadingClients } = useClients();
  const { data: rateCards = [], isLoading: isLoadingRateCards } = useActiveRateCards();

  const defaultValues: FormValues = useMemo(() => ({
    client_id: clients[0]?.id || '',
    client_company_name: clients[0]?.name || '',
    client_name: 'Pimpinan Perusahaan',
    subject: '',
    solution_type: 'Web Application',
    commercial_scheme: 'dedicated_squad',
    rate_card_id: rateCards[0]?.id || '',
    rate_card_code: rateCards[0]?.code || '',
    project_duration_months: 6,
    budget_maximum: 150000000,
    summary: '',
    mandatory_scope: [
      { value: 'System Architecture & Database Design' },
      { value: 'Frontend UI/UX Implementation' },
      { value: 'Backend API Development' },
    ],
    optional_scope: [{ value: 'Mobile App Companion' }],
    allowed_standard_activities: STANDARD_DEVELOPMENT_ACTIVITIES.map((a) => a.id),
    payment_terms: {
      mode: 'milestone',
      items: [
        {
          milestone_name: 'Down Payment (DP)',
          percentage: 30,
          description: 'Upon contract agreement',
        },
        {
          milestone_name: 'Feature Complete & UAT',
          percentage: 50,
          description: 'After testing phase',
        },
        {
          milestone_name: 'Final Handover',
          percentage: 20,
          description: 'Final release and go-live',
        },
      ],
    },
    additional_notes: '',
    discount_type: 'none',
    discount_input: 0,
    discount_name: '',
    discount_reason: '',
  }), [clients, rateCards]);

  const methods = useForm<FormValues>({
    resolver: zodResolver(quotationGenerationSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (!watch('client_id') && !watch('client_company_name') && clients.length > 0) {
      setValue('client_id', clients[0].id, { shouldValidate: true });
      setValue('client_company_name', clients[0].name, { shouldValidate: true });
      if (!watch('client_name')) {
        setValue('client_name', 'Pimpinan Perusahaan', { shouldValidate: true });
      }
    }
  }, [clients, setValue, watch]);

  const mandatoryScopeArray = useFieldArray({
    control,
    name: 'mandatory_scope',
  });

  const optionalScopeArray = useFieldArray({
    control,
    name: 'optional_scope',
  });

  const paymentTermsArray = useFieldArray({
    control,
    name: 'payment_terms.items',
  });

  const watchedPaymentItems = watch('payment_terms.items');
  const currentTotalPercentage = useMemo(() => {
    const items = watchedPaymentItems || [];
    return items.reduce((acc, curr) => acc + (Number(curr?.percentage) || 0), 0);
  }, [watchedPaymentItems]);

  const isPercentageValid = currentTotalPercentage === 100;

  const watchedDiscountType = watch('discount_type');
  const watchedDiscountInput = watch('discount_input');
  const watchedBudgetMaximum = watch('budget_maximum');
  const hasDiscount = !!watchedDiscountType && watchedDiscountType !== 'none';

  const thousandFormatter = useMemo(() => new Intl.NumberFormat('id-ID'), []);

  const discountHint = useMemo(() => {
    const budget = Number(watchedBudgetMaximum ?? 0);
    if (!budget) return '';
    // Non-binding suggestion only: larger budgets commonly carry 5-10%.
    const thresholds: Array<[number, [number, number]]> = [
      [500_000_000, [5, 10]],
      [200_000_000, [5, 8]],
      [100_000_000, [3, 5]],
    ];
    const range = thresholds.find(([min]) => budget > min)?.[1];
    if (!range) return '';
    return t('dedicatedSquadForm.discount.hintForBudget', {
      budget: thousandFormatter.format(budget),
      min: range[0],
      max: range[1],
    });
  }, [watchedBudgetMaximum, t, thousandFormatter]);

  useEffect(() => {
    // Discounts over 15% require a justification on the backend; pre-populate
    // a placeholder so the rejection message is never a surprise.
    const isPercentOverFifteen =
      watchedDiscountType === 'percent' && Number(watchedDiscountInput ?? 0) > 15;
    const isFixedOverFifteen =
      watchedDiscountType === 'fixed_amount' &&
      Number(watchedDiscountInput ?? 0) > Number(watchedBudgetMaximum ?? 0) * 0.15;
    if (isPercentOverFifteen || isFixedOverFifteen) {
      const currentReason = watch('discount_reason');
      if (!currentReason?.trim()) {
        setValue('discount_reason', 'High-value discount pending approval', {
          shouldValidate: true,
        });
      }
    }
  }, [watchedDiscountType, watchedDiscountInput, watchedBudgetMaximum, watch, setValue]);

  const selectedSolutionType = watch('solution_type');
  const currentPreset = SCOPE_PRESETS_BY_SOLUTION_TYPE[selectedSolutionType];

  const handleApplyPreset = () => {
    if (!currentPreset) return;
    setValue(
      'mandatory_scope',
      currentPreset.mandatory.map((val) => ({ value: val })),
      { shouldValidate: true }
    );
    if (currentPreset.optional.length > 0) {
      setValue(
        'optional_scope',
        currentPreset.optional.map((val) => ({ value: val })),
        { shouldValidate: true }
      );
    }
  };

  const handleFormSubmit = handleSubmit((data: FormValues) => {
    // Resolve valid skill UUID
    let skillId = selectedSkill?.id;
    if (
      !skillId ||
      skillId.startsWith('cmd-') ||
      skillId === '00000000-0000-0000-0000-000000000000'
    ) {
      const match = activeSkills.find(
        (s) =>
          s.command === '/quotation' ||
          s.command === 'quotation' ||
          s.command === selectedSkill?.command
      );
      skillId = match?.id || activeSkills[0]?.id || '00000000-0000-0000-0000-000000000000';
    }

    const payload: GenerateQuotationPayload = {
      skill_id: skillId,
      client_id: data.client_id || undefined,
      client_name: data.client_name.trim(),
      client_company_name: data.client_company_name?.trim() || undefined,
      subject: data.subject.trim(),
      solution_type: data.solution_type,
      commercial_scheme: 'dedicated_squad',
      rate_card_id: data.rate_card_id,
      rate_card_code:
        rateCards.find((r) => r.id === data.rate_card_id)?.code || data.rate_card_code,
      project_duration_months: Number(data.project_duration_months),
      budget_maximum: Number(data.budget_maximum),
      summary: data.summary.trim(),
      mandatory_scope: data.mandatory_scope
        .map((s: { value: string }) => s.value.trim())
        .filter(Boolean),
      optional_scope:
        data.optional_scope?.map((s: { value: string }) => s.value.trim()).filter(Boolean) || [],
      allowed_standard_activities: data.allowed_standard_activities || [],
      payment_terms: {
        mode: 'milestone',
        items: data.payment_terms.items.map(
          (it: { milestone_name: string; percentage: number; description?: string }) => ({
            milestone_name: it.milestone_name.trim(),
            percentage: Number(it.percentage),
            description: it.description?.trim() || undefined,
          })
        ),
      },
      additional_notes: data.additional_notes?.trim() || undefined,
      ...(data.discount_type && data.discount_type !== 'none'
        ? {
            discount_type: data.discount_type,
            discount_input:
              data.discount_type === 'percent'
                ? Math.round(Number(data.discount_input ?? 0) * 100)
                : Math.round(Number(data.discount_input ?? 0)),
            discount_name: data.discount_name?.trim() || undefined,
            discount_reason: data.discount_reason?.trim() || undefined,
          }
        : { discount_type: 'none', discount_input: 0 }),
    };

    onSubmit(payload);
  });

  return (
    <Form
      methods={methods}
      onSubmit={handleFormSubmit}
      sx={{
        width: '100%',
        maxWidth: 960,
        mx: 'auto',
      }}
    >
      <Stack spacing={3}>
        {/* Banner Skill Active */}
        <Alert
          severity="info"
          icon={<Iconify icon="solar:atom-bold-duotone" width={22} />}
          action={
            <Button color="inherit" size="small" onClick={onCancel}>
              Change Command
            </Button>
          }
          sx={{ borderRadius: 1.5 }}
        >
          <Typography variant="subtitle2">
            Skill Active: <strong>{selectedSkill?.command || '/quotation'}</strong> (
            {selectedSkill?.name || 'Dedicated Squad AI Generator'})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Form below collects requirements for AI-assisted quotation drafting.
          </Typography>
        </Alert>

        {/* Section 1: Project Information */}
        <Card>
          <CardHeader
            title="1. Project Overview & Identity"
            subheader="General project metadata and solution definition"
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
          />
          <CardContent>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 8 }}>
                <RHFTextField
                  name="subject"
                  label="Project Subject / Proposal Title"
                  placeholder="e.g. Core Banking Integration & Mobile App Revamp"
                  disabled={isSubmitting}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <RHFSelect name="solution_type" label="Solution Type" disabled={isSubmitting}>
                  {SOLUTION_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </RHFSelect>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFAutocomplete
                  name="client_company_name"
                  label="Perusahaan / Organisasi Klien"
                  placeholder="Pilih atau ketik nama perusahaan klien..."
                  freeSolo
                  options={clients}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option?.name || '';
                  }}
                  isOptionEqualToValue={(option, value) => {
                    if (typeof value === 'string') {
                      return option.name === value;
                    }
                    return option.id === value?.id;
                  }}
                  value={
                    watch('client_id')
                      ? clients.find((c) => c.id === watch('client_id')) || watch('client_company_name')
                      : watch('client_company_name') || ''
                  }
                  onChange={(_event, newValue) => {
                    if (typeof newValue === 'string') {
                      setValue('client_id', '', { shouldValidate: true });
                      setValue('client_company_name', newValue, { shouldValidate: true });
                    } else if (newValue && typeof newValue === 'object') {
                      setValue('client_id', newValue.id, { shouldValidate: true });
                      setValue('client_company_name', newValue.name, { shouldValidate: true });
                    } else {
                      setValue('client_id', '', { shouldValidate: true });
                      setValue('client_company_name', '', { shouldValidate: true });
                    }
                  }}
                  onInputChange={(_event, newInputValue) => {
                    setValue('client_company_name', newInputValue, { shouldValidate: true });
                    const foundClient = clients.find((c) => c.name === newInputValue);
                    if (foundClient) {
                      setValue('client_id', foundClient.id, { shouldValidate: true });
                    } else {
                      setValue('client_id', '', { shouldValidate: true });
                    }
                  }}
                  loading={isLoadingClients}
                  disabled={isSubmitting || isLoadingClients}
                  helperText={errors.client_company_name?.message || 'Nama instansi, PT, atau organisasi'}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name="client_name"
                  label="Ditujukan Kepada / PIC (Yth.)"
                  placeholder="e.g. Bapak Hendra Kurniawan / Direksi PT"
                  disabled={isSubmitting}
                  helperText={errors.client_name?.message || 'Nama kontak / pejabat penerima quotation'}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <RHFTextField
                  name="commercial_scheme"
                  label="Commercial Scheme"
                  value="Dedicated Squad"
                  disabled
                  helperText="Fixed scheme for AI-driven squad allocation"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <RHFTextField
                  name="summary"
                  label="Project Executive Summary"
                  placeholder="Summarize project goals, business challenges, and main technology objectives..."
                  multiline
                  rows={3}
                  disabled={isSubmitting}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Section 2: Commercial & Internal Budget */}
        <Card>
          <CardHeader
            title="2. Commercial Parameters & Internal Budget"
            subheader="Pricing model and confidential allocation ceiling"
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
          />
          <CardContent>
            <Stack spacing={2.5}>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <RHFSelect
                    name="rate_card_id"
                    label="Rate Card Pricing Model"
                    disabled={isSubmitting || isLoadingRateCards}
                  >
                    {rateCards.map((rc) => (
                      <MenuItem key={rc.id} value={rc.id}>
                        {rc.name} ({rc.code})
                        {rc.client_tier
                          ? ` [${rc.client_tier.replace(/_/g, ' ').toUpperCase()}]`
                          : ''}{' '}
                        — {rc.currency}
                      </MenuItem>
                    ))}
                    {rateCards.length === 0 && (
                      <MenuItem value="" disabled>
                        No active rate card found
                      </MenuItem>
                    )}
                  </RHFSelect>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <RHFTextField
                    name="project_duration_months"
                    label="Project Duration (Months)"
                    type="number"
                    slotProps={{ htmlInput: { min: 1, max: 24 } }}
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <RHFNumericField
                    name="budget_maximum"
                    label="Budget Maksimum Internal (IDR)"
                    placeholder="150.000.000"
                    prefix="Rp "
                    disabled={isSubmitting}
                    helperText="Angka budget internal ini TIDAK AKAN DITAMPILKAN pada dokumen quotation resmi."
                  />
                </Grid>
              </Grid>

              {/* Confidential Budget Notice Banner */}
              <Alert
                severity="warning"
                variant="outlined"
                icon={<Iconify icon="solar:shield-keyhole-bold-duotone" width={20} />}
                sx={{
                  bgcolor: (theme) =>
                    theme.palette.mode === 'light' ? 'warning.lighter' : 'warning.dark',
                  borderRadius: 1.5,
                }}
              >
                <Typography variant="subtitle2" fontWeight={600} color="warning.darker">
                  Kerahasiaan Budget Internal:
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Nilai budget maksimal hanya digunakan oleh mesin AI untuk optimasi kapasitas squad
                  dan kesesuaian rate card. Dokumen final hanya akan memuat{' '}
                  <strong>Total Investment</strong> hasil kalkulasi deterministik backend tanpa
                  memperlihatkan batas budget internal ini.
                </Typography>
              </Alert>
            </Stack>
          </CardContent>
        </Card>

        {/* Section 3: Scope of Work */}
        <Card>
          <CardHeader
            title="3. Scope of Work (Mandatory & Optional)"
            subheader="Items will be mapped to resource allocation and narrative structure"
            action={
              currentPreset ? (
                <Button
                  size="small"
                  variant="soft"
                  color="primary"
                  startIcon={<Iconify icon="solar:magic-stick-3-bold-duotone" />}
                  onClick={handleApplyPreset}
                  disabled={isSubmitting}
                >
                  Terapkan Template Scope ({selectedSolutionType})
                </Button>
              ) : null
            }
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
          />
          <CardContent>
            <Stack spacing={3}>
              {/* Mandatory Scope */}
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1.5 }}
                >
                  <Typography variant="subtitle2" fontWeight={600}>
                    Mandatory Scope Items ({mandatoryScopeArray.fields.length})
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    onClick={() => mandatoryScopeArray.append({ value: '' })}
                    disabled={isSubmitting}
                  >
                    Add Scope
                  </Button>
                </Stack>

                {errors.mandatory_scope && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
                    {errors.mandatory_scope.message || 'Please provide valid mandatory scope items'}
                  </Typography>
                )}

                <Stack spacing={1.5}>
                  {mandatoryScopeArray.fields.map((field, idx) => (
                    <Stack key={field.id} direction="row" spacing={1} alignItems="center">
                      <Box sx={{ minWidth: 24, textAlign: 'center' }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                          {idx + 1}.
                        </Typography>
                      </Box>
                      <RHFTextField
                        name={`mandatory_scope.${idx}.value`}
                        placeholder={`Scope item #${idx + 1} (e.g. REST API Authentication Module)`}
                        size="small"
                        disabled={isSubmitting}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => mandatoryScopeArray.remove(idx)}
                        disabled={mandatoryScopeArray.fields.length <= 1 || isSubmitting}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              </Box>

              {/* Optional Scope */}
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1.5 }}
                >
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                    Optional Scope Items (Tergantung Budget Alokasi)
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    onClick={() => optionalScopeArray.append({ value: '' })}
                    disabled={isSubmitting}
                  >
                    Add Optional
                  </Button>
                </Stack>

                <Stack spacing={1.5}>
                  {optionalScopeArray.fields.map((field, idx) => (
                    <Stack key={field.id} direction="row" spacing={1} alignItems="center">
                      <Box sx={{ minWidth: 24, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.disabled">
                          +{idx + 1}.
                        </Typography>
                      </Box>
                      <RHFTextField
                        name={`optional_scope.${idx}.value`}
                        placeholder={`Optional feature #${idx + 1} (e.g. Automated E2E Test Suite)`}
                        size="small"
                        disabled={isSubmitting}
                      />
                      <IconButton
                        size="small"
                        color="inherit"
                        onClick={() => optionalScopeArray.remove(idx)}
                        disabled={isSubmitting}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Section 4: Standard Development Activities */}
        <Card>
          <CardHeader
            title="4. Standar Aktivitas Pengembangan (Standard Activities)"
            subheader="Pilih aktivitas standar yang diizinkan untuk disertakan oleh AI dalam alokasi squad"
            action={
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() =>
                    setValue(
                      'allowed_standard_activities',
                      STANDARD_DEVELOPMENT_ACTIVITIES.map((a) => a.id),
                      { shouldValidate: true }
                    )
                  }
                  disabled={isSubmitting}
                >
                  Pilih Semua
                </Button>
                <Button
                  size="small"
                  variant="text"
                  color="inherit"
                  onClick={() =>
                    setValue('allowed_standard_activities', [], { shouldValidate: true })
                  }
                  disabled={isSubmitting}
                >
                  Hapus Semua
                </Button>
              </Stack>
            }
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
          />
          <CardContent>
            <Grid container spacing={1.5}>
              {STANDARD_DEVELOPMENT_ACTIVITIES.map((activity) => {
                const checked = (watch('allowed_standard_activities') || []).includes(activity.id);
                return (
                  <Grid key={activity.id} size={{ xs: 12, sm: 6 }}>
                    <Box
                      onClick={() => {
                        if (isSubmitting) return;
                        const current = watch('allowed_standard_activities') || [];
                        const next = checked
                          ? current.filter((id: string) => id !== activity.id)
                          : [...current, activity.id];
                        setValue('allowed_standard_activities', next, { shouldValidate: true });
                      }}
                      sx={{
                        p: 1.5,
                        border: 1,
                        borderColor: checked ? 'primary.main' : 'divider',
                        bgcolor: checked ? 'action.hover' : 'background.paper',
                        borderRadius: 1,
                        cursor: isSubmitting ? 'default' : 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                      }}
                    >
                      <Checkbox
                        checked={checked}
                        size="small"
                        disabled={isSubmitting}
                        sx={{ p: 0, mt: 0.25 }}
                      />
                      <Box>
                        <Typography variant="subtitle2" fontSize="0.875rem">
                          {activity.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>

        {/* Section 5: Payment Terms (Milestones) */}
        <Card>
          <CardHeader
            title="5. Ketentuan Pembayaran (Milestones)"
            subheader="Define milestone payment breakdown (Total must equal exactly 100%)"
            action={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Total:
                </Typography>
                <Box
                  sx={{
                    px: 1.25,
                    py: 0.25,
                    borderRadius: 1,
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    bgcolor: isPercentageValid ? 'success.soft' : 'error.soft',
                    color: isPercentageValid ? 'success.darker' : 'error.darker',
                  }}
                >
                  {currentTotalPercentage}% / 100%
                </Box>
              </Stack>
            }
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
          />
          <CardContent>
            <Stack spacing={2}>
              {/* Presets Button */}
              <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Presets:
                </Typography>
                {MILESTONE_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    size="small"
                    variant="soft"
                    color="inherit"
                    sx={{ fontSize: '0.75rem', py: 0.25, px: 1 }}
                    onClick={() =>
                      setValue('payment_terms.items', preset.items, { shouldValidate: true })
                    }
                    disabled={isSubmitting}
                  >
                    {preset.label}
                  </Button>
                ))}
              </Stack>

              {errors.payment_terms?.items && (
                <Alert severity="error" sx={{ py: 0.5 }}>
                  {errors.payment_terms.items.message ||
                    'Total persentase milestone harus tepat 100%'}
                </Alert>
              )}

              <Stack spacing={2}>
                {paymentTermsArray.fields.map((field, idx) => (
                  <Grid key={field.id} container spacing={1.5} alignItems="center">
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <RHFTextField
                        name={`payment_terms.items.${idx}.milestone_name`}
                        label="Milestone Name"
                        placeholder="e.g. Down Payment (DP)"
                        size="small"
                        disabled={isSubmitting}
                      />
                    </Grid>
                    <Grid size={{ xs: 5, sm: 2 }}>
                      <RHFTextField
                        name={`payment_terms.items.${idx}.percentage`}
                        label="Percentage (%)"
                        type="number"
                        size="small"
                        slotProps={{ htmlInput: { min: 1, max: 100 } }}
                        disabled={isSubmitting}
                      />
                    </Grid>
                    <Grid size={{ xs: 5, sm: 4 }}>
                      <RHFTextField
                        name={`payment_terms.items.${idx}.description`}
                        label="Description / Condition"
                        placeholder="e.g. Upon contract signing"
                        size="small"
                        disabled={isSubmitting}
                      />
                    </Grid>
                    <Grid size={{ xs: 2, sm: 1 }}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => paymentTermsArray.remove(idx)}
                        disabled={paymentTermsArray.fields.length <= 1 || isSubmitting}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Stack>

              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() =>
                  paymentTermsArray.append({
                    milestone_name: `Milestone #${paymentTermsArray.fields.length + 1}`,
                    percentage: 0,
                    description: '',
                  })
                }
                sx={{ alignSelf: 'flex-start', mt: 1 }}
                disabled={isSubmitting}
              >
                Add Milestone
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Section 6: Discount (Optional) */}
        <Card>
          <CardHeader
            title={`6. ${t('dedicatedSquadForm.discount.sectionTitle')}`}
            subheader={t('dedicatedSquadForm.discount.sectionSub')}
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
          />
          <CardContent>
            <Stack spacing={2}>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <RHFSelect
                    name="discount_type"
                    label={t('dedicatedSquadForm.discount.type')}
                    disabled={isSubmitting}
                  >
                    <MenuItem value="none">{t('dedicatedSquadForm.discount.typeNone')}</MenuItem>
                    <MenuItem value="round_to_target">
                      {t('dedicatedSquadForm.discount.typeRoundToTarget')}
                    </MenuItem>
                    <MenuItem value="fixed_amount">
                      {t('dedicatedSquadForm.discount.typeFixedAmount')}
                    </MenuItem>
                    <MenuItem value="percent">{t('dedicatedSquadForm.discount.typePercent')}</MenuItem>
                  </RHFSelect>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  {watchedDiscountType === 'percent' ? (
                    <RHFNumericField
                      name="discount_input"
                      label={t('dedicatedSquadForm.discount.inputPercent')}
                      placeholder="5"
                      size="small"
                      disabled={isSubmitting}
                      helperText={t('dedicatedSquadForm.discount.percentHelper')}
                    />
                  ) : (
                    <RHFNumericField
                      name="discount_input"
                      label={
                        watchedDiscountType === 'round_to_target'
                          ? t('dedicatedSquadForm.discount.inputRoundToTarget')
                          : t('dedicatedSquadForm.discount.inputFixedAmount')
                      }
                      placeholder="15.000.000"
                      prefix="Rp "
                      size="small"
                      disabled={isSubmitting || !hasDiscount}
                    />
                  )}
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <RHFTextField
                    name="discount_name"
                    label={t('dedicatedSquadForm.discount.name')}
                    placeholder={t('dedicatedSquadForm.discount.namePlaceholder')}
                    size="small"
                    disabled={isSubmitting || !hasDiscount}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <RHFTextField
                    name="discount_reason"
                    label={t('dedicatedSquadForm.discount.reason')}
                    placeholder={t('dedicatedSquadForm.discount.reasonPlaceholder')}
                    multiline
                    rows={2}
                    disabled={isSubmitting || !hasDiscount}
                  />
                </Grid>
              </Grid>

              {discountHint && (
                <Alert severity="info" icon={<Iconify icon="solar:bulb-bold-duotone" width={18} />}>
                  <Typography variant="caption" color="text.secondary">
                    {discountHint}
                  </Typography>
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Section 7: Additional Notes */}
        <Card>
          <CardHeader
            title="7. Additional Instructions / Notes (Optional)"
            subheader="Any custom SLA, governance, or delivery constraints"
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
          />
          <CardContent>
            <RHFTextField
              name="additional_notes"
              label="Additional Notes"
              placeholder="e.g. WFH setup with weekly onsite sprint review, IP rights transferred on final payment."
              multiline
              rows={2}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 1, pb: 4 }}>
          <Button variant="outlined" color="inherit" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={isSubmitting || !isPercentageValid}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Iconify icon="solar:atom-bold-duotone" />
              )
            }
          >
            {isSubmitting ? 'Generating AI Quotation...' : 'Generate Quotation Draft with AI'}
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
}
