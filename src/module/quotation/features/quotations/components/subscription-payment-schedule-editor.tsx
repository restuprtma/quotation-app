import type { SubscriptionSaaSFormValues } from '../constants/subscription-saas';

import { useState } from 'react';
import { useWatch, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { RHFTextField } from 'src/shared/ui/hook-form';
import { RHFNumericField } from 'src/shared/ui/hook-form/rhf-numeric-field';

import { formatSubscriptionCurrency } from './subscription-saas-preview';
import { buildPaymentRowSkeletons } from '../constants/subscription-saas';

// ----------------------------------------------------------------------

type Props = {
  disabled?: boolean;
};

export function SubscriptionPaymentScheduleEditor({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control } = useFormContext<SubscriptionSaaSFormValues>();

  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    fields,
    append,
    remove,
    replace,
  } = useFieldArray({
    control,
    name: 'subscription_saas.payment_schedule',
  });

  const initialTermMonths = useWatch({
    control,
    name: 'subscription_saas.initial_term_months',
  }) || 12;

  const billingCycle = useWatch({
    control,
    name: 'subscription_saas.billing_cycle',
  }) || 'monthly';

  const pricePeriods = useWatch({
    control,
    name: 'subscription_saas.price_periods',
  }) || [];

  const oneTimeItems = useWatch({
    control,
    name: 'subscription_saas.one_time_items',
  }) || [];

  const paymentSchedule = useWatch({
    control,
    name: 'subscription_saas.payment_schedule',
  }) || [];

  // Contract total calculation
  const recurringTotal = pricePeriods.reduce(
    (sum, p) => sum + (Number(p?.duration_months) || 0) * (Number(p?.monthly_rate) || 0),
    0
  );
  const oneTimeTotal = oneTimeItems.reduce(
    (sum, item) => sum + (Number(item?.amount) || 0),
    0
  );
  const totalContract = recurringTotal + oneTimeTotal;

  // Schedule totals calculation
  const coveredMonths = paymentSchedule.reduce(
    (sum, row) => sum + (Number(row?.covered_months) || 0),
    0
  );
  const scheduleTotal = paymentSchedule.reduce(
    (sum, row) => sum + (Number(row?.nominal) || 0),
    0
  );
  const difference = scheduleTotal - totalContract;

  const isCoverageValid = coveredMonths === initialTermMonths;
  const isReconciled = difference === 0 && isCoverageValid && totalContract > 0;

  const handleGenerateSkeletons = () => {
    const skeletons = buildPaymentRowSkeletons(initialTermMonths, billingCycle);

    // Auto-distribute nominals so user has an immediately valid reconciliation baseline
    const distributed = skeletons.map((row, idx) => {
      if (initialTermMonths <= 0 || totalContract <= 0) return row;
      const share = Math.floor((recurringTotal * row.covered_months) / initialTermMonths);
      const nominal = idx === 0 ? share + oneTimeTotal : share;
      return {
        ...row,
        nominal,
      };
    });

    const sum = distributed.reduce((acc, r) => acc + r.nominal, 0);
    if (distributed.length > 0 && sum !== totalContract) {
      distributed[distributed.length - 1].nominal += totalContract - sum;
    }

    replace(distributed);
  };

  const handleOpenGenerateDialog = () => {
    if (fields.length > 0) {
      setConfirmOpen(true);
    } else {
      handleGenerateSkeletons();
    }
  };

  const handleAddRow = () => {
    const nextOffset = coveredMonths;
    append({
      work_period: `Bulan ${paymentSchedule.length + 1}`,
      start_month_offset: nextOffset,
      covered_months: 1,
      invoice_date_label: '',
      due_date_label: 'H+14',
      nominal: 0,
    });
  };

  return (
    <Card>
      <CardHeader
        title={t('subscriptionSaaSForm.paymentTitle')}
        subheader={t('subscriptionSaaSForm.paymentSubtitle')}
        action={
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="solar:refresh-circle-bold" />}
            onClick={handleOpenGenerateDialog}
            disabled={disabled}
          >
            {t('subscriptionSaaSForm.payment.generateFromCycle')}
          </Button>
        }
      />
      <CardContent>
        <Stack spacing={3}>
          {fields.length === 0 ? (
            <Alert severity="info">
              Jadwal pembayaran belum dibuat. Klik <strong>{t('subscriptionSaaSForm.payment.generateFromCycle')}</strong> di atas untuk membuat baris otomatis sesuai siklus billing.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {fields.map((field, index) => (
                <Card
                  key={field.id}
                  variant="outlined"
                  sx={{ p: 2, bgcolor: 'background.neutral' }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <RHFTextField
                        name={`subscription_saas.payment_schedule.${index}.work_period`}
                        label={t('subscriptionSaaSForm.payment.workPeriod')}
                        placeholder={t('subscriptionSaaSForm.payment.workPeriodPlaceholder')}
                        disabled={disabled}
                        size="small"
                      />
                    </Grid>

                    <Grid size={{ xs: 6, sm: 1.5 }}>
                      <RHFTextField
                        name={`subscription_saas.payment_schedule.${index}.start_month_offset`}
                        label={t('subscriptionSaaSForm.payment.startOffset')}
                        type="number"
                        disabled={disabled}
                        size="small"
                        helperText="Admin"
                        slotProps={{
                          htmlInput: { min: 0, max: 59, step: 1 },
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 6, sm: 1.5 }}>
                      <RHFTextField
                        name={`subscription_saas.payment_schedule.${index}.covered_months`}
                        label={t('subscriptionSaaSForm.payment.coveredMonths')}
                        type="number"
                        disabled={disabled}
                        size="small"
                        helperText="Bulan"
                        slotProps={{
                          htmlInput: { min: 1, max: 60, step: 1 },
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 6, sm: 2 }}>
                      <RHFTextField
                        name={`subscription_saas.payment_schedule.${index}.invoice_date_label`}
                        label={t('subscriptionSaaSForm.payment.invoiceDate')}
                        placeholder={t('subscriptionSaaSForm.payment.invoiceDatePlaceholder')}
                        disabled={disabled}
                        size="small"
                      />
                    </Grid>

                    <Grid size={{ xs: 6, sm: 1.5 }}>
                      <RHFTextField
                        name={`subscription_saas.payment_schedule.${index}.due_date_label`}
                        label={t('subscriptionSaaSForm.payment.dueDate')}
                        placeholder={t('subscriptionSaaSForm.payment.dueDatePlaceholder')}
                        disabled={disabled}
                        size="small"
                      />
                    </Grid>

                    <Grid size={{ xs: 10, sm: 2 }}>
                      <RHFNumericField
                        name={`subscription_saas.payment_schedule.${index}.nominal`}
                        label={t('subscriptionSaaSForm.payment.nominal')}
                        prefix="Rp"
                        disabled={disabled}
                        size="small"
                      />
                    </Grid>

                    <Grid size={{ xs: 2, sm: 0.5 }} sx={{ textAlign: 'right' }}>
                      <IconButton
                        color="error"
                        aria-label={t('subscriptionSaaSForm.payment.removeRow')}
                        onClick={() => remove(index)}
                        disabled={disabled}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Card>
              ))}

              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={handleAddRow}
                  disabled={disabled}
                >
                  {t('subscriptionSaaSForm.payment.addRow')}
                </Button>
              </Box>
            </Stack>
          )}

          {/* Reconciliation Footer */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: (theme) =>
                `1.5px solid ${
                  isReconciled ? theme.palette.success.main : theme.palette.error.main
                }`,
              bgcolor: (theme) =>
                isReconciled ? `${theme.palette.success.main}0a` : `${theme.palette.error.main}0a`,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
              {t('subscriptionSaaSForm.payment.reconciliationTitle')}
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t('subscriptionSaaSForm.payment.coveredMonthsLabel')}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color={isCoverageValid ? 'success.main' : 'error.main'}
                >
                  {coveredMonths} / {initialTermMonths} bulan
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t('subscriptionSaaSForm.payment.scheduleTotal')}
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {formatSubscriptionCurrency(scheduleTotal)}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t('subscriptionSaaSForm.payment.contractTotal')}
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {formatSubscriptionCurrency(totalContract)}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t('subscriptionSaaSForm.payment.difference')}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color={difference === 0 ? 'success.main' : 'error.main'}
                >
                  {formatSubscriptionCurrency(difference)}
                </Typography>
              </Grid>
            </Grid>

            {/* Error / Success Status with Icon and Text */}
            <Box aria-live="polite">
              {isReconciled ? (
                <Alert severity="success" icon={<Iconify icon="eva:checkmark-circle-2-fill" />}>
                  {t('subscriptionSaaSForm.payment.reconciled')}
                </Alert>
              ) : (
                <Alert severity="error" icon={<Iconify icon="eva:alert-circle-fill" />}>
                  <Typography variant="body2" fontWeight={600}>
                    {difference !== 0
                      ? `${
                          difference < 0
                            ? t('subscriptionSaaSForm.payment.underpaid')
                            : t('subscriptionSaaSForm.payment.overpaid')
                        }: Selisih ${formatSubscriptionCurrency(Math.abs(difference))}. Total jadwal pembayaran harus sama persis dengan total kontrak.`
                      : ''}
                  </Typography>
                  {!isCoverageValid && (
                    <Typography variant="caption" display="block">
                      {t('subscriptionSaaSForm.payment.coverageMismatch')}: Cakupan pembayaran ({coveredMonths} bulan) tidak sama dengan durasi kontrak ({initialTermMonths} bulan).
                    </Typography>
                  )}
                </Alert>
              )}
            </Box>
          </Box>
        </Stack>
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="confirm-generate-payment-dialog-title"
      >
        <DialogTitle id="confirm-generate-payment-dialog-title">
          {t('subscriptionSaaSForm.payment.confirmGenerateTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('subscriptionSaaSForm.payment.confirmGenerateDesc')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="inherit">
            {t('subscriptionSaaSForm.payment.confirmCancel')}
          </Button>
          <Button
            onClick={() => {
              setConfirmOpen(false);
              handleGenerateSkeletons();
            }}
            variant="contained"
            color="primary"
            autoFocus
          >
            {t('subscriptionSaaSForm.payment.confirmOk')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
