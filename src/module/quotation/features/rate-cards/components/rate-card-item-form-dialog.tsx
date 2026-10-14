import type {
  Discipline,
  Seniority,
  TermType,
  RateCardItem,
  CreateRateCardItemPayload,
} from '../types';

import { z } from 'zod';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Accordion from '@mui/material/Accordion';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

import { TERM_TYPES, SENIORITIES, DISCIPLINES } from '../types';

// Preprocessor for optional number fields (empty string -> undefined)
const optionalNumber = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  const num = Number(val);
  return Number.isNaN(num) ? undefined : num;
}, z.number().min(0).optional());

const schema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  role: z.string().optional(),
  seniority: z.enum(['associate', 'intermediate', 'senior']),
  discipline: z.enum(['ENGINEERING', 'QA', 'PRODUCT', 'DATA', 'INFRASTRUCTURE', 'SUPPORT']),
  term_type: z.enum(['short_term', 'long_term']),
  amount_per_month: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return 0;
    const num = Number(val);
    return Number.isNaN(num) ? 0 : num;
  }, z.number().positive('Amount must be greater than 0')),
  base_salary: optionalNumber,
  tech_lead_fee: optionalNumber,
  ai_rnd_fee: optionalNumber,
  workspace_fee: optionalNumber,
  management_fee: optionalNumber,
  published_rate: optionalNumber,
  max_discount_pct: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    const num = Number(val);
    return Number.isNaN(num) ? undefined : num;
  }, z.number().min(0).max(100).optional()),
  floor_rate: optionalNumber,
  education_requirement: z.string().optional(),
  experience_requirement: z.string().optional(),
  kickoff_fee: optionalNumber,
  recruitment_fee: optionalNumber,
  onboarding_fee: optionalNumber,
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateRateCardItemPayload) => Promise<void>;
  initialData?: RateCardItem | null;
  loading?: boolean;
}

export function RateCardItemFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: Props) {
  const { t } = useTranslate('rate_card');
  const { t: tCommon } = useTranslate('common');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: '',
      role: '',
      seniority: 'senior',
      discipline: 'ENGINEERING',
      term_type: 'long_term',
      amount_per_month: '' as any,
      base_salary: '' as any,
      tech_lead_fee: '' as any,
      ai_rnd_fee: '' as any,
      workspace_fee: '' as any,
      management_fee: '' as any,
      published_rate: '' as any,
      max_discount_pct: '' as any,
      floor_rate: '' as any,
      education_requirement: '',
      experience_requirement: '',
      kickoff_fee: '' as any,
      recruitment_fee: '' as any,
      onboarding_fee: '' as any,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          displayName: initialData.display_name || initialData.role || '',
          role: initialData.role || '',
          seniority: initialData.seniority || 'senior',
          discipline: initialData.discipline || 'ENGINEERING',
          term_type: initialData.term_type || 'long_term',
          amount_per_month: initialData.amount_per_month ?? ('' as any),
          base_salary: initialData.base_salary ?? ('' as any),
          tech_lead_fee: initialData.tech_lead_fee ?? ('' as any),
          ai_rnd_fee: initialData.ai_rnd_fee ?? ('' as any),
          workspace_fee: initialData.workspace_fee ?? ('' as any),
          management_fee: initialData.management_fee ?? ('' as any),
          published_rate: initialData.published_rate ?? ('' as any),
          max_discount_pct: initialData.max_discount_pct ?? ('' as any),
          floor_rate: initialData.floor_rate ?? ('' as any),
          education_requirement: initialData.education_requirement || '',
          experience_requirement: initialData.experience_requirement || '',
          kickoff_fee: initialData.kickoff_fee ?? ('' as any),
          recruitment_fee: initialData.recruitment_fee ?? ('' as any),
          onboarding_fee: initialData.onboarding_fee ?? ('' as any),
        });
      } else {
        reset({
          displayName: '',
          role: '',
          seniority: 'senior',
          discipline: 'ENGINEERING',
          term_type: 'long_term',
          amount_per_month: '' as any,
          base_salary: '' as any,
          tech_lead_fee: '' as any,
          ai_rnd_fee: '' as any,
          workspace_fee: '' as any,
          management_fee: '' as any,
          published_rate: '' as any,
          max_discount_pct: '' as any,
          floor_rate: '' as any,
          education_requirement: '',
          experience_requirement: '',
          kickoff_fee: '' as any,
          recruitment_fee: '' as any,
          onboarding_fee: '' as any,
        });
      }
    }
  }, [open, initialData, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = async (values: FormValues) => {
    const slug = (values.role?.trim() || values.displayName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const payload: CreateRateCardItemPayload = {
      role: slug,
      display_name: values.displayName.trim(),
      seniority: values.seniority as Seniority,
      discipline: values.discipline as Discipline,
      term_type: values.term_type as TermType,
      amount_per_month: Number(values.amount_per_month),
      base_salary: values.base_salary !== undefined ? Number(values.base_salary) : undefined,
      tech_lead_fee: values.tech_lead_fee !== undefined ? Number(values.tech_lead_fee) : undefined,
      ai_rnd_fee: values.ai_rnd_fee !== undefined ? Number(values.ai_rnd_fee) : undefined,
      workspace_fee: values.workspace_fee !== undefined ? Number(values.workspace_fee) : undefined,
      management_fee:
        values.management_fee !== undefined ? Number(values.management_fee) : undefined,
      published_rate:
        values.published_rate !== undefined ? Number(values.published_rate) : undefined,
      max_discount_pct:
        values.max_discount_pct !== undefined ? Number(values.max_discount_pct) : undefined,
      floor_rate: values.floor_rate !== undefined ? Number(values.floor_rate) : undefined,
      education_requirement: values.education_requirement?.trim() || undefined,
      experience_requirement: values.experience_requirement?.trim() || undefined,
      kickoff_fee: values.kickoff_fee !== undefined ? Number(values.kickoff_fee) : undefined,
      recruitment_fee:
        values.recruitment_fee !== undefined ? Number(values.recruitment_fee) : undefined,
      onboarding_fee:
        values.onboarding_fee !== undefined ? Number(values.onboarding_fee) : undefined,
    };

    await onSubmit(payload);
    reset();
    onClose();
  };

  const isEdit = Boolean(initialData);

  return (
    <Dialog
      open={open}
      onClose={isSubmitting || loading ? undefined : handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}
      >
        <Box component="span">
          {isEdit
            ? t('itemDialog.editTitle', { defaultValue: 'Edit Posisi' })
            : t('itemDialog.createTitle', { defaultValue: 'Tambah Posisi Baru' })}
        </Box>
        <IconButton size="small" onClick={handleClose} disabled={isSubmitting || loading}>
          <Iconify icon="mingcute:close-line" width={20} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent dividers sx={{ py: 3 }}>
          <Grid container spacing={2.5}>
            {/* Display Name */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="displayName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('itemDialog.displayNameLabel', { defaultValue: 'Nama Posisi' })}
                    placeholder={t('itemDialog.displayNamePlaceholder', {
                      defaultValue: 'misal: Full Stack AI Engineer',
                    })}
                    error={Boolean(errors.displayName)}
                    helperText={errors.displayName?.message}
                    inputProps={{ 'data-testid': 'item-display-name' }}
                    disabled={isSubmitting || loading}
                  />
                )}
              />
            </Grid>

            {/* Role Slug (Optional) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('itemDialog.roleLabel', { defaultValue: 'Pengenal Role (Slug)' })}
                    placeholder={t('itemDialog.rolePlaceholder', {
                      defaultValue: 'otomatis dari nama posisi jika kosong',
                    })}
                    helperText={t('itemDialog.roleHelper', {
                      defaultValue:
                        'Biarkan kosong untuk dibuat otomatis (misal: fullstack_ai_engineer)',
                    })}
                    inputProps={{ 'data-testid': 'item-role' }}
                    disabled={isSubmitting || loading}
                  />
                )}
              />
            </Grid>

            {/* Discipline */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="discipline"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label={t('itemDialog.disciplineLabel', { defaultValue: 'Disiplin' })}
                    error={Boolean(errors.discipline)}
                    helperText={errors.discipline?.message}
                    inputProps={{ 'data-testid': 'item-discipline' }}
                    disabled={isSubmitting || loading}
                  >
                    {DISCIPLINES.map((d) => (
                      <MenuItem key={d} value={d}>
                        {t(`disciplines.${d.toLowerCase()}`, { defaultValue: d })}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Seniority */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="seniority"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label={t('itemDialog.seniorityLabel', { defaultValue: 'Senioritas' })}
                    error={Boolean(errors.seniority)}
                    helperText={errors.seniority?.message}
                    inputProps={{ 'data-testid': 'item-seniority' }}
                    disabled={isSubmitting || loading}
                  >
                    {SENIORITIES.map((s) => (
                      <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                        {s}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Term Type */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="term_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label={t('itemDialog.termTypeLabel', { defaultValue: 'Durasi Kerja' })}
                    error={Boolean(errors.term_type)}
                    helperText={errors.term_type?.message}
                    inputProps={{ 'data-testid': 'item-term-type' }}
                    disabled={isSubmitting || loading}
                  >
                    {TERM_TYPES.map((tt) => (
                      <MenuItem key={tt} value={tt}>
                        {tt === 'short_term'
                          ? t('terms.shortTerm', { defaultValue: 'Jangka Pendek (< 6 bln)' })
                          : t('terms.longTerm', { defaultValue: 'Jangka Panjang (>= 6 bln)' })}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Monthly Rate (Required) */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="amount_per_month"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    fullWidth
                    label={t('itemDialog.amountPerMonthLabel', { defaultValue: 'Tarif Bulanan' })}
                    placeholder="0"
                    error={Boolean(errors.amount_per_month)}
                    helperText={errors.amount_per_month?.message}
                    inputProps={{ 'data-testid': 'item-amount-per-month', min: 1 }}
                    disabled={isSubmitting || loading}
                  />
                )}
              />
            </Grid>

            {/* Advanced Cost Breakdown Accordion */}
            <Grid size={{ xs: 12 }}>
              <Accordion
                disableGutters
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: '8px !important',
                  '&:before': { display: 'none' },
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary
                  expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                  sx={{ px: 2, bgcolor: 'background.neutral' }}
                >
                  <Box>
                    <Typography variant="subtitle2">
                      {t('itemDialog.advancedCostTitle', {
                        defaultValue: 'Rincian Biaya Lanjutan',
                      })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('itemDialog.advancedCostSubtitle', {
                        defaultValue:
                          'Komponen breakdown 5 biaya, batas negosiasi, dan biaya persiapan',
                      })}
                    </Typography>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 2.5 }}>
                  <Grid container spacing={2}>
                    {/* 5 Cost Components */}
                    <Grid size={{ xs: 12 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                      >
                        {t('breakdown.title', { defaultValue: 'Rincian 5 Komponen Biaya' })}
                      </Typography>
                    </Grid>

                    {/* Base Salary */}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Controller
                        name="base_salary"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            fullWidth
                            size="small"
                            label={t('itemDialog.baseSalaryLabel', {
                              defaultValue: 'Gaji Pokok Squad',
                            })}
                            inputProps={{ 'data-testid': 'item-base-salary', min: 0 }}
                            disabled={isSubmitting || loading}
                          />
                        )}
                      />
                    </Grid>

                    {/* Tech Lead Fee */}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Controller
                        name="tech_lead_fee"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            fullWidth
                            size="small"
                            label={t('itemDialog.techLeadFeeLabel', {
                              defaultValue: 'Alokasi Tech Lead',
                            })}
                            inputProps={{ 'data-testid': 'item-tech-lead-fee', min: 0 }}
                            disabled={isSubmitting || loading}
                          />
                        )}
                      />
                    </Grid>

                    {/* AI & R&D Fee */}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Controller
                        name="ai_rnd_fee"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            fullWidth
                            size="small"
                            label={t('itemDialog.aiRndFeeLabel', {
                              defaultValue: 'Alokasi AI & R&D',
                            })}
                            inputProps={{ 'data-testid': 'item-ai-rnd-fee', min: 0 }}
                            disabled={isSubmitting || loading}
                          />
                        )}
                      />
                    </Grid>

                    {/* Workspace Fee */}
                    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                      <Controller
                        name="workspace_fee"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            fullWidth
                            size="small"
                            label={t('itemDialog.workspaceFeeLabel', {
                              defaultValue: 'Ruang Kerja & Perangkat',
                            })}
                            inputProps={{ 'data-testid': 'item-workspace-fee', min: 0 }}
                            disabled={isSubmitting || loading}
                          />
                        )}
                      />
                    </Grid>

                    {/* Management Fee */}
                    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                      <Controller
                        name="management_fee"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            fullWidth
                            size="small"
                            label={t('itemDialog.managementFeeLabel', {
                              defaultValue: 'Manajemen Rekayasa',
                            })}
                            inputProps={{ 'data-testid': 'item-management-fee', min: 0 }}
                            disabled={isSubmitting || loading}
                          />
                        )}
                      />
                    </Grid>

                    {/* Negotiation Parameters */}
                    <Grid size={{ xs: 12 }} sx={{ pt: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                      >
                        {t('negotiation.title', { defaultValue: 'Batas Negosiasi' })}
                      </Typography>
                    </Grid>

                    {/* Published Rate */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Controller
                        name="published_rate"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            fullWidth
                            size="small"
                            label={t('itemDialog.publishedRateLabel', {
                              defaultValue: 'Harga Terbitan',
                            })}
                            inputProps={{ 'data-testid': 'item-published-rate', min: 0 }}
                            disabled={isSubmitting || loading}
                          />
                        )}
                      />
                    </Grid>

                    {/* Max Discount % */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Controller
                        name="max_discount_pct"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            fullWidth
                            size="small"
                            label={t('itemDialog.maxDiscountPctLabel', {
                              defaultValue: 'Diskon Maksimal (%)',
                            })}
                            inputProps={{
                              'data-testid': 'item-max-discount-pct',
                              min: 0,
                              max: 100,
                            }}
                            disabled={isSubmitting || loading}
                          />
                        )}
                      />
                    </Grid>

                    {/* Floor Rate */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Controller
                        name="floor_rate"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            fullWidth
                            size="small"
                            label={t('itemDialog.floorRateLabel', {
                              defaultValue: 'Harga Batas Bawah',
                            })}
                            inputProps={{ 'data-testid': 'item-floor-rate', min: 0 }}
                            disabled={isSubmitting || loading}
                          />
                        )}
                      />
                    </Grid>

                    {/* Requirements */}
                    <Grid size={{ xs: 12 }} sx={{ pt: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                      >
                        {t('table.role', { defaultValue: 'Posisi & Kualifikasi' })}
                      </Typography>
                    </Grid>

                    {/* Education Requirement */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="education_requirement"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            size="small"
                            label={t('itemDialog.educationReqLabel', {
                              defaultValue: 'Syarat Pendidikan',
                            })}
                            placeholder={t('itemDialog.educationReqPlaceholder', {
                              defaultValue: 'misal: S1 / D4 Teknik Informatika',
                            })}
                            inputProps={{ 'data-testid': 'item-education-requirement' }}
                            disabled={isSubmitting || loading}
                          />
                        )}
                      />
                    </Grid>

                    {/* Experience Requirement */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="experience_requirement"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            size="small"
                            label={t('itemDialog.experienceReqLabel', {
                              defaultValue: 'Syarat Pengalaman',
                            })}
                            placeholder={t('itemDialog.experienceReqPlaceholder', {
                              defaultValue: 'misal: > 3 tahun',
                            })}
                            inputProps={{ 'data-testid': 'item-experience-requirement' }}
                            disabled={isSubmitting || loading}
                          />
                        )}
                      />
                    </Grid>

                    {/* Hiring & Preparation Fees */}
                    <Grid size={{ xs: 12 }} sx={{ pt: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                      >
                        {t('preparation.title', { defaultValue: 'Biaya Persiapan & Rekrutmen' })}
                      </Typography>
                    </Grid>

                    {/* Kickoff Fee */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Controller
                        name="kickoff_fee"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            fullWidth
                            size="small"
                            label={t('itemDialog.kickoffFeeLabel', {
                              defaultValue: 'Biaya Kickoff',
                            })}
                            inputProps={{ 'data-testid': 'item-kickoff-fee', min: 0 }}
                            disabled={isSubmitting || loading}
                          />
                        )}
                      />
                    </Grid>

                    {/* Recruitment Fee */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Controller
                        name="recruitment_fee"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            fullWidth
                            size="small"
                            label={t('itemDialog.recruitmentFeeLabel', {
                              defaultValue: 'Biaya Rekrutmen',
                            })}
                            inputProps={{ 'data-testid': 'item-recruitment-fee', min: 0 }}
                            disabled={isSubmitting || loading}
                          />
                        )}
                      />
                    </Grid>

                    {/* Onboarding Fee */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Controller
                        name="onboarding_fee"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            fullWidth
                            size="small"
                            label={t('itemDialog.onboardingFeeLabel', {
                              defaultValue: 'Biaya Onboarding',
                            })}
                            inputProps={{ 'data-testid': 'item-onboarding-fee', min: 0 }}
                            disabled={isSubmitting || loading}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} color="inherit" disabled={isSubmitting || loading}>
            {tCommon('actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting || loading}
          >
            {isEdit ? tCommon('actions.save') : tCommon('actions.add')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
