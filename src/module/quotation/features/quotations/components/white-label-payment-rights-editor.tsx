import type { WhiteLabelFormValues } from '../constants/white-label';
import type { WhiteLabelLimitationCode, WhiteLabelPaymentComponent } from '../types';

import { useState } from 'react';
import { useWatch, Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Accordion from '@mui/material/Accordion';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import DialogContentText from '@mui/material/DialogContentText';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { RHFSelect, RHFTextField } from 'src/shared/ui/hook-form';
import { RHFNumericField } from 'src/shared/ui/hook-form/rhf-numeric-field';

import { formatWhiteLabelCurrency } from './white-label-preview';
import {
  LIMITATION_OPTIONS,
  TAX_TREATMENT_OPTIONS,
  PAYMENT_COMPONENT_OPTIONS,
  calculateWhiteLabelDraftTotals,
} from '../constants/white-label';

// ----------------------------------------------------------------------

type Props = {
  disabled?: boolean;
};

export function WhiteLabelPaymentRightsEditor({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control, setValue } = useFormContext<WhiteLabelFormValues>();

  const [confirmGenerateOpen, setConfirmGenerateOpen] = useState(false);
  const [confirmClearRightsOpen, setConfirmClearRightsOpen] = useState(false);

  const {
    fields: paymentFields,
    append: appendPayment,
    remove: removePayment,
    replace: replacePayments,
  } = useFieldArray({
    control,
    name: 'white_label.payment_schedule',
  });

  const {
    fields: rightsFields,
    append: appendRights,
    remove: removeRights,
    replace: replaceRights,
  } = useFieldArray({
    control,
    name: 'white_label.rights_statements' as any,
  });

  const watchedWhiteLabel = useWatch({
    control,
    name: 'white_label',
  });

  const watchedMaintenance = watchedWhiteLabel?.maintenance_items || [];
  const watchedHosting = watchedWhiteLabel?.hosting_items || [];

  const allPeriods = [
    ...watchedMaintenance.map((m) => Number(m?.period_months) || 0),
    ...watchedHosting.map((h) => Number(h?.period_months) || 0),
  ].filter((p) => p > 0);

  const hasServiceItems = allPeriods.length > 0;
  const isUniformServicePeriod = !hasServiceItems || allPeriods.every((p) => p === allPeriods[0]);
  const serviceDurationMonths = hasServiceItems && isUniformServicePeriod ? allPeriods[0] : 0;

  const totals = calculateWhiteLabelDraftTotals(
    watchedWhiteLabel || {
      product_name: '',
      quotation_date: '',
      tax_treatment: 'not_stated',
      license_items: [],
      maintenance_items: [],
      hosting_items: [],
      payment_schedule: [],
      limitation_codes: [],
    }
  );

  const handleGenerateSkeletons = () => {
    const rows: {
      work_period: string;
      terms: string;
      invoice_date_label: string;
      due_date_label: string;
      component: WhiteLabelPaymentComponent;
      nominal: number;
    }[] = [];

    // 1. License payment row
    rows.push({
      work_period: 'Tahap 1 / Awal Kontrak',
      terms: 'Saat penandatanganan SPK / Perjanjian',
      invoice_date_label: 'Saat SPK',
      due_date_label: 'H+14',
      component: 'license',
      nominal: 0,
    });

    // 2. Service payment rows if service items exist
    if (serviceDurationMonths > 0) {
      for (let m = 1; m <= serviceDurationMonths; m += 1) {
        rows.push({
          work_period: `Bulan ${m}`,
          terms: `Maintenance & Hosting Bulan ke-${m}`,
          invoice_date_label: `Awal Bulan ${m}`,
          due_date_label: 'H+14',
          component: 'maintenance_hosting',
          nominal: 0,
        });
      }
    }

    replacePayments(rows);
  };

  const handleOpenGenerateDialog = () => {
    if (paymentFields.length > 0) {
      setConfirmGenerateOpen(true);
    } else {
      handleGenerateSkeletons();
    }
  };

  const handleAddPaymentRow = () => {
    appendPayment({
      work_period: `Tahap ${paymentFields.length + 1}`,
      terms: '',
      invoice_date_label: '',
      due_date_label: 'H+14',
      component: 'license',
      nominal: 0,
    });
  };

  const handleAddRightsStatement = () => {
    appendRights('' as any);
  };

  const handleClearAllRights = () => {
    replaceRights([]);
    setValue('white_label.rights_statements', [], { shouldValidate: true });
  };

  return (
    <Card>
      <CardHeader
        title={t('whiteLabelForm.paymentTitle')}
        subheader={t('whiteLabelForm.paymentSubtitle')}
      />
      <CardContent>
        <Stack spacing={3}>
          {/* Payment Schedule Section */}
          <Box>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1}
              sx={{ mb: 2 }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                {t('whiteLabelForm.payment.scheduleTitle')}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  startIcon={<Iconify icon="solar:refresh-circle-bold" />}
                  onClick={handleOpenGenerateDialog}
                  disabled={disabled || !isUniformServicePeriod}
                >
                  {t('whiteLabelForm.payment.generateFromDuration')}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={handleAddPaymentRow}
                  disabled={disabled}
                >
                  {t('whiteLabelForm.payment.addRow')}
                </Button>
              </Stack>
            </Stack>

            {paymentFields.length === 0 ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Minimal 1 baris jadwal pembayaran wajib diisi. Anda dapat mengklik tombol{' '}
                <strong>{t('whiteLabelForm.payment.generateFromDuration')}</strong> untuk membuat
                contoh jadwal.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {paymentFields.map((field, index) => (
                  <Card
                    key={field.id}
                    variant="outlined"
                    sx={{ p: 2, bgcolor: 'background.neutral' }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <RHFTextField
                          name={`white_label.payment_schedule.${index}.work_period`}
                          label={t('whiteLabelForm.payment.workPeriod')}
                          placeholder={t('whiteLabelForm.payment.workPeriodPlaceholder')}
                          disabled={disabled}
                          size="small"
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 3 }}>
                        <RHFTextField
                          name={`white_label.payment_schedule.${index}.terms`}
                          label={t('whiteLabelForm.payment.terms')}
                          placeholder={t('whiteLabelForm.payment.termsPlaceholder')}
                          disabled={disabled}
                          size="small"
                        />
                      </Grid>

                      <Grid size={{ xs: 6, sm: 1.5 }}>
                        <RHFTextField
                          name={`white_label.payment_schedule.${index}.invoice_date_label`}
                          label={t('whiteLabelForm.payment.invoiceDate')}
                          placeholder={t('whiteLabelForm.payment.invoiceDatePlaceholder')}
                          disabled={disabled}
                          size="small"
                        />
                      </Grid>

                      <Grid size={{ xs: 6, sm: 1.5 }}>
                        <RHFTextField
                          name={`white_label.payment_schedule.${index}.due_date_label`}
                          label={t('whiteLabelForm.payment.dueDate')}
                          placeholder={t('whiteLabelForm.payment.dueDatePlaceholder')}
                          disabled={disabled}
                          size="small"
                        />
                      </Grid>

                      <Grid size={{ xs: 6, sm: 1.5 }}>
                        <RHFSelect
                          name={`white_label.payment_schedule.${index}.component`}
                          label={t('whiteLabelForm.payment.component')}
                          disabled={disabled}
                          size="small"
                        >
                          {PAYMENT_COMPONENT_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </RHFSelect>
                      </Grid>

                      <Grid size={{ xs: 5, sm: 1 }}>
                        <RHFNumericField
                          name={`white_label.payment_schedule.${index}.nominal`}
                          label={t('whiteLabelForm.payment.nominal')}
                          prefix="Rp"
                          disabled={disabled}
                          size="small"
                        />
                      </Grid>

                      <Grid size={{ xs: 1, sm: 0.5 }} sx={{ textAlign: 'right' }}>
                        <IconButton
                          color="error"
                          aria-label={t('whiteLabelForm.payment.removeRow')}
                          onClick={() => removePayment(index)}
                          disabled={disabled}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Card>
                ))}
              </Stack>
            )}

            {/* Component-level Reconciliation Footer */}
            <Box
              sx={{
                mt: 2.5,
                p: 2.5,
                borderRadius: 2,
                border: (theme) =>
                  `1.5px solid ${
                    totals.is_balanced ? theme.palette.success.main : theme.palette.error.main
                  }`,
                bgcolor: (theme) =>
                  totals.is_balanced
                    ? `${theme.palette.success.main}0a`
                    : `${theme.palette.error.main}0a`,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
                {t('whiteLabelForm.payment.reconciliationTitle')}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                {/* Lisensi Component */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined" sx={{ p: 1.5, bgcolor: 'background.paper' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      {t('whiteLabelForm.payment.componentLicense')}
                    </Typography>
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption">
                          {t('whiteLabelForm.payment.licenseSubtotal')}:
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {formatWhiteLabelCurrency(totals.license_subtotal)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption">
                          {t('whiteLabelForm.payment.licensePaymentTotal')}:
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {formatWhiteLabelCurrency(totals.license_payment_total)}
                        </Typography>
                      </Stack>
                      <Divider sx={{ my: 0.5 }} />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" fontWeight={700}>
                          {t('whiteLabelForm.payment.licenseDelta')}:
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color={totals.license_delta === 0 ? 'success.main' : 'error.main'}
                        >
                          {formatWhiteLabelCurrency(totals.license_delta)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Card>
                </Grid>

                {/* Maintenance & Hosting Component */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined" sx={{ p: 1.5, bgcolor: 'background.paper' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      {t('whiteLabelForm.payment.componentMaintenanceHosting')}
                    </Typography>
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption">
                          {t('whiteLabelForm.payment.serviceSubtotal')}:
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {formatWhiteLabelCurrency(totals.maintenance_hosting_subtotal)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption">
                          {t('whiteLabelForm.payment.servicePaymentTotal')}:
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {formatWhiteLabelCurrency(totals.maintenance_hosting_payment_total)}
                        </Typography>
                      </Stack>
                      <Divider sx={{ my: 0.5 }} />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" fontWeight={700}>
                          {t('whiteLabelForm.payment.serviceDelta')}:
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color={
                            totals.maintenance_hosting_delta === 0 ? 'success.main' : 'error.main'
                          }
                        >
                          {formatWhiteLabelCurrency(totals.maintenance_hosting_delta)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Card>
                </Grid>

                {/* Total Grand Investment */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined" sx={{ p: 1.5, bgcolor: 'background.paper' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      {t('whiteLabelForm.payment.totalInvestment')} (Grand Total)
                    </Typography>
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption">
                          {t('whiteLabelForm.payment.totalInvestment')}:
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {formatWhiteLabelCurrency(totals.total_investment)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption">
                          {t('whiteLabelForm.payment.totalPayment')}:
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {formatWhiteLabelCurrency(totals.payment_total)}
                        </Typography>
                      </Stack>
                      <Divider sx={{ my: 0.5 }} />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" fontWeight={700}>
                          {t('whiteLabelForm.payment.totalDelta')}:
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color={
                            totals.total_investment_delta === 0 ? 'success.main' : 'error.main'
                          }
                        >
                          {formatWhiteLabelCurrency(totals.total_investment_delta)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Card>
                </Grid>
              </Grid>

              {/* Status Banner */}
              <Box aria-live="polite">
                {totals.is_balanced ? (
                  <Alert severity="success" icon={<Iconify icon="eva:checkmark-circle-2-fill" />}>
                    {t('whiteLabelForm.payment.balanced')}
                  </Alert>
                ) : (
                  <Alert severity="error" icon={<Iconify icon="eva:alert-circle-fill" />}>
                    <Typography variant="body2" fontWeight={600}>
                      {t('whiteLabelForm.payment.unbalanced')}
                    </Typography>
                    {totals.license_delta !== 0 && (
                      <Typography variant="caption" display="block">
                        • Selisih Lisensi: {formatWhiteLabelCurrency(totals.license_delta)}{' '}
                        (Pembayaran {formatWhiteLabelCurrency(totals.license_payment_total)} vs
                        Subtotal {formatWhiteLabelCurrency(totals.license_subtotal)})
                      </Typography>
                    )}
                    {totals.maintenance_hosting_delta !== 0 && (
                      <Typography variant="caption" display="block">
                        • Selisih Maintenance & Hosting:{' '}
                        {formatWhiteLabelCurrency(totals.maintenance_hosting_delta)} (Pembayaran{' '}
                        {formatWhiteLabelCurrency(totals.maintenance_hosting_payment_total)} vs
                        Subtotal {formatWhiteLabelCurrency(totals.maintenance_hosting_subtotal)})
                      </Typography>
                    )}
                  </Alert>
                )}
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Tax Treatment Section */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
              {t('whiteLabelForm.payment.taxTitle')}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFSelect
                  name="white_label.tax_treatment"
                  label={t('whiteLabelForm.payment.taxTitle')}
                  disabled={disabled}
                >
                  {TAX_TREATMENT_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </RHFSelect>
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Limitations (4 Checkboxes) */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              {t('whiteLabelForm.payment.limitationsTitle')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              Pilih batasan dan pengecualian yang berlaku pada penawaran ini (minimal 1 batasan
              dipilih).
            </Typography>

            <Controller
              name="white_label.limitation_codes"
              control={control}
              render={({ field, fieldState: { error } }) => {
                const currentCodes: WhiteLabelLimitationCode[] = Array.isArray(field.value)
                  ? field.value
                  : [];

                const handleToggle = (code: WhiteLabelLimitationCode) => {
                  if (currentCodes.includes(code)) {
                    field.onChange(currentCodes.filter((c) => c !== code));
                  } else {
                    field.onChange([...currentCodes, code]);
                  }
                };

                return (
                  <Stack spacing={1}>
                    {LIMITATION_OPTIONS.map((opt) => (
                      <FormControlLabel
                        key={opt.value}
                        control={
                          <Checkbox
                            checked={currentCodes.includes(opt.value)}
                            onChange={() => handleToggle(opt.value)}
                            disabled={disabled}
                          />
                        }
                        label={<Typography variant="body2">{opt.label}</Typography>}
                      />
                    ))}
                    {error && (
                      <Typography variant="caption" color="error">
                        {error.message || 'Minimal satu batasan wajib dipilih'}
                      </Typography>
                    )}
                  </Stack>
                );
              }}
            />
          </Box>

          <Divider />

          {/* Progressive Disclosure: Rights & Rebranding Statements */}
          <Accordion
            defaultExpanded={false}
            sx={{
              borderRadius: '12px !important',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              '&:before': { display: 'none' },
              boxShadow: 'none',
            }}
          >
            <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Iconify
                  icon="solar:shield-check-bold-duotone"
                  width={24}
                  sx={{ color: 'primary.main' }}
                />
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {t('whiteLabelForm.payment.rightsTitle')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('whiteLabelForm.payment.rightsSubtitle')}
                  </Typography>
                </Box>
              </Stack>
            </AccordionSummary>

            <AccordionDetails sx={{ pt: 1, pb: 3, px: 3 }}>
              <Stack spacing={2.5}>
                <Alert severity="warning" icon={<Iconify icon="eva:alert-triangle-fill" />}>
                  {t('whiteLabelForm.payment.rightsWarning')}
                </Alert>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" fontWeight={600}>
                    Pernyataan Hak Tambahan ({rightsFields.length})
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {rightsFields.length > 0 && (
                      <Button
                        size="small"
                        color="error"
                        variant="text"
                        onClick={() => setConfirmClearRightsOpen(true)}
                        disabled={disabled}
                      >
                        {t('whiteLabelForm.payment.clearAllRights')}
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Iconify icon="solar:add-circle-bold" />}
                      onClick={handleAddRightsStatement}
                      disabled={disabled}
                    >
                      {t('whiteLabelForm.payment.addRights')}
                    </Button>
                  </Stack>
                </Stack>

                {rightsFields.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.disabled"
                    sx={{ fontStyle: 'italic', py: 1 }}
                  >
                    Tidak ada pernyataan hak khusus. Bagian Hak Lisensi akan menggunakan klausul
                    standar.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {rightsFields.map((field, rIndex) => (
                      <Stack key={field.id} direction="row" spacing={1.5} alignItems="center">
                        <RHFTextField
                          name={`white_label.rights_statements.${rIndex}`}
                          label={`Pernyataan ${rIndex + 1}`}
                          placeholder={t('whiteLabelForm.payment.rightsPlaceholder')}
                          disabled={disabled}
                          size="small"
                          multiline
                          rows={2}
                          sx={{ flex: 1 }}
                        />
                        <IconButton
                          color="error"
                          aria-label={t('whiteLabelForm.payment.removeRights')}
                          onClick={() => removeRights(rIndex)}
                          disabled={disabled}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Stack>
      </CardContent>

      {/* Confirmation Dialog for Payment Schedule Generator */}
      <Dialog
        open={confirmGenerateOpen}
        onClose={() => setConfirmGenerateOpen(false)}
        aria-labelledby="confirm-generate-white-label-payment-dialog-title"
      >
        <DialogTitle id="confirm-generate-white-label-payment-dialog-title">
          {t('whiteLabelForm.payment.confirmGenerateTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{t('whiteLabelForm.payment.confirmGenerateDesc')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmGenerateOpen(false)} color="inherit">
            {t('whiteLabelForm.payment.confirmCancel')}
          </Button>
          <Button
            onClick={() => {
              setConfirmGenerateOpen(false);
              handleGenerateSkeletons();
            }}
            variant="contained"
            color="primary"
            autoFocus
          >
            {t('whiteLabelForm.payment.confirmOk')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Clear All Rights */}
      <Dialog
        open={confirmClearRightsOpen}
        onClose={() => setConfirmClearRightsOpen(false)}
        aria-labelledby="confirm-clear-rights-dialog-title"
      >
        <DialogTitle id="confirm-clear-rights-dialog-title">
          {t('whiteLabelForm.payment.confirmClearRightsTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('whiteLabelForm.payment.confirmClearRightsDesc')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClearRightsOpen(false)} color="inherit">
            Batal
          </Button>
          <Button
            onClick={() => {
              setConfirmClearRightsOpen(false);
              handleClearAllRights();
            }}
            variant="contained"
            color="error"
            autoFocus
          >
            Hapus Semua
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
