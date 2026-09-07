import type { SubscriptionSaaSFormValues } from '../constants/subscription-saas';

import { useWatch, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { RHFTextField } from 'src/shared/ui/hook-form';
import { RHFNumericField } from 'src/shared/ui/hook-form/rhf-numeric-field';

import { formatSubscriptionCurrency } from './subscription-saas-preview';

// ----------------------------------------------------------------------

type Props = {
  disabled?: boolean;
};

export function SubscriptionPricingPeriodEditor({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control } = useFormContext<SubscriptionSaaSFormValues>();

  const {
    fields: periodFields,
    append: appendPeriod,
    remove: removePeriod,
  } = useFieldArray({
    control,
    name: 'subscription_saas.price_periods',
  });

  const {
    fields: oneTimeFields,
    append: appendOneTime,
    remove: removeOneTime,
  } = useFieldArray({
    control,
    name: 'subscription_saas.one_time_items',
  });

  const watchedPeriods = useWatch({
    control,
    name: 'subscription_saas.price_periods',
  }) || [];

  const initialTermMonths = useWatch({
    control,
    name: 'subscription_saas.initial_term_months',
  }) || 12;

  const coveredMonths = watchedPeriods.reduce(
    (sum, p) => sum + (Number(p?.duration_months) || 0),
    0
  );

  const isCoverageValid = coveredMonths === initialTermMonths;

  const handleAddPeriod = () => {
    const nextOffset = coveredMonths;
    const remaining = Math.max(1, initialTermMonths - coveredMonths);
    appendPeriod({
      label: `Periode ${periodFields.length + 1}`,
      start_month_offset: nextOffset,
      duration_months: remaining,
      monthly_rate: 0,
    });
  };

  const handleAddOneTime = () => {
    appendOneTime({
      name: '',
      amount: 0,
    });
  };

  return (
    <Card>
      <CardHeader
        title={t('subscriptionSaaSForm.pricingTitle')}
        subheader={t('subscriptionSaaSForm.pricingSubtitle')}
      />
      <CardContent>
        <Stack spacing={3}>
          {/* Recurring Price Periods Section */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {t('subscriptionSaaSForm.pricing.periodsTitle')}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleAddPeriod}
                disabled={disabled}
              >
                {t('subscriptionSaaSForm.pricing.addPeriod')}
              </Button>
            </Stack>

            {/* Coverage Feedback */}
            <Box aria-live="polite" sx={{ mb: 2 }}>
              <Alert
                severity={isCoverageValid ? 'success' : 'warning'}
                icon={
                  <Iconify
                    icon={isCoverageValid ? 'eva:checkmark-circle-2-fill' : 'eva:alert-triangle-fill'}
                  />
                }
              >
                {t('subscriptionSaaSForm.pricing.coveredSummary', {
                  covered: coveredMonths,
                  total: initialTermMonths,
                })}
                {!isCoverageValid && (
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    {coveredMonths < initialTermMonths
                      ? `Kurang ${initialTermMonths - coveredMonths} bulan untuk memenuhi durasi awal (${initialTermMonths} bulan).`
                      : `Melebihi durasi kontrak awal sebesar ${coveredMonths - initialTermMonths} bulan.`}
                  </Typography>
                )}
              </Alert>
            </Box>

            <Stack spacing={2}>
              {periodFields.map((field, index) => {
                const currentPeriod = watchedPeriods[index];
                const duration = Number(currentPeriod?.duration_months) || 0;
                const rate = Number(currentPeriod?.monthly_rate) || 0;
                const subtotal = duration * rate;

                return (
                  <Card
                    key={field.id}
                    variant="outlined"
                    sx={{ p: 2, bgcolor: 'background.neutral' }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <RHFTextField
                          name={`subscription_saas.price_periods.${index}.label`}
                          label={t('subscriptionSaaSForm.pricing.label')}
                          placeholder={t('subscriptionSaaSForm.pricing.labelPlaceholder')}
                          disabled={disabled}
                          size="small"
                        />
                      </Grid>

                      <Grid size={{ xs: 6, sm: 2 }}>
                        <RHFTextField
                          name={`subscription_saas.price_periods.${index}.start_month_offset`}
                          label={t('subscriptionSaaSForm.pricing.startOffset')}
                          type="number"
                          disabled={disabled}
                          size="small"
                          slotProps={{
                            htmlInput: { min: 0, max: 59, step: 1 },
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 6, sm: 2 }}>
                        <RHFTextField
                          name={`subscription_saas.price_periods.${index}.duration_months`}
                          label={t('subscriptionSaaSForm.pricing.duration')}
                          type="number"
                          disabled={disabled}
                          size="small"
                          slotProps={{
                            htmlInput: { min: 1, max: 60, step: 1 },
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 3 }}>
                        <RHFNumericField
                          name={`subscription_saas.price_periods.${index}.monthly_rate`}
                          label={t('subscriptionSaaSForm.pricing.monthlyRate')}
                          prefix="Rp"
                          disabled={disabled}
                          size="small"
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 1 }} sx={{ textAlign: 'right' }}>
                        <IconButton
                          color="error"
                          aria-label={t('subscriptionSaaSForm.pricing.removePeriod')}
                          onClick={() => removePeriod(index)}
                          disabled={disabled || periodFields.length <= 1}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <Stack direction="row" justifyContent="flex-end" spacing={1}>
                          <Typography variant="caption" color="text.secondary">
                            {t('subscriptionSaaSForm.pricing.subtotal')}:
                          </Typography>
                          <Typography variant="caption" fontWeight={700}>
                            {formatSubscriptionCurrency(subtotal)}
                          </Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Card>
                );
              })}
            </Stack>
          </Box>

          <Divider />

          {/* One-time Items Section */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  {t('subscriptionSaaSForm.pricing.oneTimeTitle')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Biaya implementasi, setup server, pelatihan, atau migrasi data (opsional).
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleAddOneTime}
                disabled={disabled}
              >
                {t('subscriptionSaaSForm.pricing.addOneTime')}
              </Button>
            </Stack>

            {oneTimeFields.length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', py: 1 }}>
                Tidak ada biaya sekali bayar (one-time items).
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {oneTimeFields.map((field, index) => (
                  <Stack
                    key={field.id}
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems="center"
                  >
                    <RHFTextField
                      name={`subscription_saas.one_time_items.${index}.name`}
                      label={t('subscriptionSaaSForm.pricing.oneTimeName')}
                      placeholder={t('subscriptionSaaSForm.pricing.oneTimeNamePlaceholder')}
                      disabled={disabled}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <Box sx={{ width: { xs: '100%', sm: 260 } }}>
                      <RHFNumericField
                        name={`subscription_saas.one_time_items.${index}.amount`}
                        label={t('subscriptionSaaSForm.pricing.oneTimeAmount')}
                        prefix="Rp"
                        disabled={disabled}
                        size="small"
                      />
                    </Box>
                    <IconButton
                      color="error"
                      aria-label={t('subscriptionSaaSForm.pricing.removeOneTime')}
                      onClick={() => removeOneTime(index)}
                      disabled={disabled}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
