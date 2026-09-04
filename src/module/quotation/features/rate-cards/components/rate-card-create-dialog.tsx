import type {
  Market,
  Seniority,
  ClientTier,
  CreateRateCardPayload,
  CreateRateCardItemPayload,
} from '../types';

import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

import { STANDARD_ROLES } from '../types';

const schema = z.object({
  code: z.string().min(2, 'Code is required'),
  name: z.string().min(2, 'Name is required'),
  market: z.enum(['national', 'international']),
  client_tier: z.enum(['commercial_national', 'government_bumn', 'international']),
  currency: z.string().min(1, 'Currency is required'),
  description: z.string().optional(),
  short_term_surcharge_pct: z.number().min(0).max(100),
  enterprise_markup_pct: z.number().min(0).max(100),
  effective_from: z.string().min(1, 'Effective from date is required'),
  seed_standard_roles: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateRateCardPayload) => Promise<void>;
  loading?: boolean;
}

export function RateCardCreateDialog({ open, onClose, onSubmit, loading = false }: Props) {
  const { t } = useTranslate('rate_card');
  const { t: tCommon } = useTranslate('common');

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      name: '',
      market: 'national',
      client_tier: 'commercial_national',
      currency: 'IDR',
      description: '',
      short_term_surcharge_pct: 40,
      enterprise_markup_pct: 35,
      effective_from: todayStr,
      seed_standard_roles: true,
    },
  });

  const handleFormSubmit = async (values: FormValues) => {
    let items: CreateRateCardItemPayload[] = [];

    if (values.seed_standard_roles) {
      const seniorities: Seniority[] = ['senior', 'intermediate', 'associate'];

      for (const roleDef of STANDARD_ROLES) {
        for (const sen of seniorities) {
          // Base cost structure based on seniority
          let baseSalary = 5500000;
          let techLeadFee = 1675000;
          let managementFee = 1375000;
          let maxDiscount = 5;

          if (sen === 'senior') {
            baseSalary = 6800000;
            techLeadFee = 1030000;
            managementFee = 2720000;
            maxDiscount = 5;
          } else if (sen === 'associate') {
            baseSalary = 4000000;
            techLeadFee = 1500000;
            managementFee = 1000000;
            maxDiscount = 8;
          }

          const aiRndFee = 500000;
          const workspaceFee = 500000;
          const longTermMonthly =
            baseSalary + techLeadFee + aiRndFee + workspaceFee + managementFee;
          const shortTermMonthly = Math.round(
            longTermMonthly * (1 + values.short_term_surcharge_pct / 100)
          );

          // Long-term item
          items.push({
            role: roleDef.role,
            display_name: roleDef.displayName,
            seniority: sen,
            discipline: roleDef.discipline,
            term_type: 'long_term',
            amount_per_month: longTermMonthly,
            base_salary: baseSalary,
            tech_lead_fee: techLeadFee,
            ai_rnd_fee: aiRndFee,
            workspace_fee: workspaceFee,
            management_fee: managementFee,
            education_requirement: roleDef.education,
            experience_requirement: roleDef.experience,
            published_rate: longTermMonthly,
            max_discount_pct: maxDiscount,
            floor_rate: Math.round(longTermMonthly * (1 - maxDiscount / 100)),
            kickoff_fee: 1000000,
            recruitment_fee: 3000000,
            onboarding_fee: 13600000,
          });

          // Short-term item
          items.push({
            role: roleDef.role,
            display_name: roleDef.displayName,
            seniority: sen,
            discipline: roleDef.discipline,
            term_type: 'short_term',
            amount_per_month: shortTermMonthly,
            base_salary: Math.round(baseSalary * (1 + values.short_term_surcharge_pct / 100)),
            tech_lead_fee: Math.round(techLeadFee * (1 + values.short_term_surcharge_pct / 100)),
            ai_rnd_fee: aiRndFee,
            workspace_fee: workspaceFee,
            management_fee: Math.round(managementFee * (1 + values.short_term_surcharge_pct / 100)),
            education_requirement: roleDef.education,
            experience_requirement: roleDef.experience,
            published_rate: shortTermMonthly,
            max_discount_pct: maxDiscount,
            floor_rate: Math.round(shortTermMonthly * (1 - maxDiscount / 100)),
            kickoff_fee: 1000000,
            recruitment_fee: 3000000,
            onboarding_fee: 13600000,
          });
        }
      }
    } else {
      // Minimal single item to satisfy API min=1 item constraint
      items = [
        {
          role: 'backend_programmer',
          display_name: 'Back End Programmer',
          seniority: 'senior',
          discipline: 'ENGINEERING',
          term_type: 'long_term',
          amount_per_month: 11550000,
          base_salary: 6800000,
          tech_lead_fee: 1030000,
          ai_rnd_fee: 500000,
          workspace_fee: 500000,
          management_fee: 2720000,
          education_requirement: 'S1/D4',
          experience_requirement: '> 2 th',
          published_rate: 11550000,
          max_discount_pct: 5,
          floor_rate: 10972500,
        },
      ];
    }

    const payload: CreateRateCardPayload = {
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      market: values.market as Market,
      client_tier: values.client_tier as ClientTier,
      currency: values.currency.trim().toUpperCase(),
      description: values.description?.trim(),
      short_term_surcharge_pct: values.short_term_surcharge_pct,
      enterprise_markup_pct: values.enterprise_markup_pct,
      effective_from: values.effective_from,
      items,
    };

    await onSubmit(payload);
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting || loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6">{t('dialog.createTitle')}</Typography>
        <IconButton size="small" onClick={onClose} disabled={isSubmitting || loading}>
          <Iconify icon="mingcute:close-line" width={20} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent dividers sx={{ py: 3 }}>
          <Grid container spacing={2.5}>
            {/* Code */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('dialog.codeLabel')}
                    placeholder="e.g. RC-COMM-2026"
                    error={Boolean(errors.code)}
                    helperText={errors.code?.message}
                    disabled={isSubmitting || loading}
                  />
                )}
              />
            </Grid>

            {/* Name */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('dialog.nameLabel')}
                    placeholder="e.g. Venturo National Commercial 2026"
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                    disabled={isSubmitting || loading}
                  />
                )}
              />
            </Grid>

            {/* Client Tier */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="client_tier"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label={t('dialog.clientTierLabel')}
                    error={Boolean(errors.client_tier)}
                    helperText={errors.client_tier?.message}
                    disabled={isSubmitting || loading}
                  >
                    <MenuItem value="commercial_national">{t('tiers.commercialNational')}</MenuItem>
                    <MenuItem value="government_bumn">{t('tiers.governmentBumn')}</MenuItem>
                    <MenuItem value="international">{t('tiers.international')}</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            {/* Market */}
            <Grid size={{ xs: 12, sm: 3 }}>
              <Controller
                name="market"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label={t('dialog.marketLabel')}
                    error={Boolean(errors.market)}
                    helperText={errors.market?.message}
                    disabled={isSubmitting || loading}
                  >
                    <MenuItem value="national">{t('markets.national')}</MenuItem>
                    <MenuItem value="international">{t('markets.international')}</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            {/* Currency */}
            <Grid size={{ xs: 12, sm: 3 }}>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('dialog.currencyLabel')}
                    placeholder="IDR"
                    error={Boolean(errors.currency)}
                    helperText={errors.currency?.message}
                    disabled={isSubmitting || loading}
                  />
                )}
              />
            </Grid>

            {/* Short-Term Surcharge % */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="short_term_surcharge_pct"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    fullWidth
                    label={t('dialog.shortTermSurchargeLabel')}
                    error={Boolean(errors.short_term_surcharge_pct)}
                    helperText={errors.short_term_surcharge_pct?.message}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={isSubmitting || loading}
                  />
                )}
              />
            </Grid>

            {/* Enterprise Markup % */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="enterprise_markup_pct"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    fullWidth
                    label={t('dialog.enterpriseMarkupLabel')}
                    error={Boolean(errors.enterprise_markup_pct)}
                    helperText={errors.enterprise_markup_pct?.message}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={isSubmitting || loading}
                  />
                )}
              />
            </Grid>

            {/* Effective From */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="effective_from"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    fullWidth
                    label={t('dialog.effectiveFromLabel')}
                    InputLabelProps={{ shrink: true }}
                    error={Boolean(errors.effective_from)}
                    helperText={errors.effective_from?.message}
                    disabled={isSubmitting || loading}
                  />
                )}
              />
            </Grid>

            {/* Description */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={2}
                    label={t('dialog.descriptionLabel')}
                    placeholder={t('dialog.descriptionPlaceholder')}
                    disabled={isSubmitting || loading}
                  />
                )}
              />
            </Grid>

            {/* Seed 14 Venturo standard roles checkbox */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.neutral' }}>
                <Controller
                  name="seed_standard_roles"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle2">
                            {t('dialog.seedRolesTitle')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('dialog.seedRolesDescription')}
                          </Typography>
                        </Box>
                      }
                    />
                  )}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={isSubmitting || loading}>
            {tCommon('actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting || loading}
          >
            {tCommon('actions.create')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
