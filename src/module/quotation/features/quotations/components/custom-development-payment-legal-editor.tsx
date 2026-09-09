import type { CustomDevelopmentFormValues } from './custom-development-form-model';

import { useState } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

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
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import DialogContentText from '@mui/material/DialogContentText';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { RHFSelect, RHFTextField } from 'src/shared/ui/hook-form';
import { RHFNumericField } from 'src/shared/ui/hook-form/rhf-numeric-field';

import { formatCustomDevelopmentCurrency } from './custom-development-preview';
import {
  CUSTOM_DEVELOPMENT_LIMITATION_OPTIONS,
  calculateCustomDevelopmentDraftTotals,
  CUSTOM_DEVELOPMENT_TAX_TREATMENT_OPTIONS,
  CUSTOM_DEVELOPMENT_PAYMENT_COMPONENT_OPTIONS,
} from '../constants/custom-development';

// ----------------------------------------------------------------------

type Props = {
  disabled?: boolean;
};

export function CustomDevelopmentPaymentLegalEditor({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control, setValue, getValues, watch } = useFormContext<CustomDevelopmentFormValues>();

  const [clearRightsDialogOpen, setClearRightsDialogOpen] = useState(false);

  const customDev = watch('custom_development') || {};
  const limitationCodes = customDev.limitation_codes || [];
  const rightsStatements = customDev.rights_statements || [];

  const {
    fields: paymentFields,
    append: appendPayment,
    remove: removePayment,
  } = useFieldArray({
    control,
    name: 'custom_development.payment_schedule',
  });

  const {
    fields: additionalLimitFields,
    append: appendAdditionalLimit,
    remove: removeAdditionalLimit,
  } = useFieldArray({
    control,
    name: 'custom_development.additional_limitations' as any,
  });

  const {
    fields: rightsFields,
    append: appendRights,
    remove: removeRights,
  } = useFieldArray({
    control,
    name: 'custom_development.rights_statements' as any,
  });

  const handleAddPaymentRow = () => {
    appendPayment({
      work_period: '',
      terms: '',
      invoice_date_label: '',
      due_date_label: '',
      component: 'development',
      nominal: 0,
    });
  };

  const handleAdd5050Rows = () => {
    appendPayment({
      work_period: 'Tahap 1 (Uang Muka)',
      terms: 'Termin 1 (DP 50%)',
      invoice_date_label: 'Setelah Penandatanganan Kontrak',
      due_date_label: '7 Hari Kalender',
      component: 'development',
      nominal: 0,
    });
    appendPayment({
      work_period: 'Tahap 2 (Pelunasan)',
      terms: 'Termin 2 (Pelunasan 50%)',
      invoice_date_label: 'Setelah Serah Terima Sistem (BAST)',
      due_date_label: '7 Hari Kalender',
      component: 'development',
      nominal: 0,
    });
  };

  const handleToggleLimitation = (code: any) => {
    const current = getValues('custom_development.limitation_codes') || [];
    if (current.includes(code)) {
      setValue(
        'custom_development.limitation_codes',
        current.filter((c) => c !== code),
        { shouldValidate: true }
      );
    } else {
      setValue('custom_development.limitation_codes', [...current, code], {
        shouldValidate: true,
      });
    }
  };

  const handleConfirmClearRights = () => {
    setValue('custom_development.rights_statements', [], { shouldValidate: true });
    setClearRightsDialogOpen(false);
  };

  const draftTotals = calculateCustomDevelopmentDraftTotals({
    development_groups: (customDev?.development_groups || []).filter(Boolean).map((g) => ({
      title: g.title || '',
      items: (g.items || []).filter(Boolean).map((item) => ({
        name: item.name || '',
        display_rate: item.display_rate ?? null,
        headcount: Number(item.headcount) || 1,
        period_label: item.period_label || '',
        quoted_line_total:
          item.quoted_line_total !== null && item.quoted_line_total !== undefined
            ? Number(item.quoted_line_total)
            : null,
      })),
    })),
    discount_amount: Number(customDev?.discount_amount) || 0,
    monthly_items: (customDev?.monthly_items || []).filter(Boolean).map((m) => ({
      name: m.name || '',
      specification: m.specification || '',
      unit_rate: Number(m.unit_rate) || 0,
      quantity: Number(m.quantity) || 1,
    })),
    payment_schedule: (customDev?.payment_schedule || []).filter(Boolean).map((p) => ({
      work_period: p.work_period || '',
      terms: p.terms || '',
      invoice_date_label: p.invoice_date_label || '',
      due_date_label: p.due_date_label || '',
      component: p.component || 'development',
      nominal: Number(p.nominal) || 0,
    })),
  });

  return (
    <Card>
      <CardHeader
        title={t('customDevelopmentForm.paymentLegalTitle')}
        subheader={t('customDevelopmentForm.paymentLegalSubtitle')}
      />
      <CardContent>
        <Stack spacing={3.5}>
          {/* 1. Payment Schedule */}
          <Stack spacing={2.5}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              sx={{ gap: 1 }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                {t('customDevelopmentForm.paymentLegal.scheduleTitle')}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={<Iconify icon="solar:calculator-bold" />}
                  onClick={handleAdd5050Rows}
                  disabled={disabled}
                >
                  {t('customDevelopmentForm.paymentLegal.btn5050')}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={handleAddPaymentRow}
                  disabled={disabled}
                >
                  {t('customDevelopmentForm.paymentLegal.addRow')}
                </Button>
              </Stack>
            </Stack>

            <Alert severity="info" sx={{ py: 0.5 }}>
              {t('customDevelopmentForm.paymentLegal.alert5050')}
            </Alert>

            {/* Payment Rows */}
            <Stack spacing={2}>
              {paymentFields.map((field, index) => (
                <Box
                  key={field.id}
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    bgcolor: 'background.neutral',
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                      <RHFTextField
                        name={`custom_development.payment_schedule.${index}.work_period`}
                        label={t('customDevelopmentForm.paymentLegal.workPeriod')}
                        placeholder={t('customDevelopmentForm.paymentLegal.workPeriodPlaceholder')}
                        disabled={disabled}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                      <RHFTextField
                        name={`custom_development.payment_schedule.${index}.terms`}
                        label={t('customDevelopmentForm.paymentLegal.terms')}
                        placeholder={t('customDevelopmentForm.paymentLegal.termsPlaceholder')}
                        disabled={disabled}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                      <RHFTextField
                        name={`custom_development.payment_schedule.${index}.invoice_date_label`}
                        label={t('customDevelopmentForm.paymentLegal.invoiceDate')}
                        placeholder={t('customDevelopmentForm.paymentLegal.invoiceDatePlaceholder')}
                        disabled={disabled}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                      <RHFTextField
                        name={`custom_development.payment_schedule.${index}.due_date_label`}
                        label={t('customDevelopmentForm.paymentLegal.dueDate')}
                        placeholder={t('customDevelopmentForm.paymentLegal.dueDatePlaceholder')}
                        disabled={disabled}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
                      <Controller
                        name={`custom_development.payment_schedule.${index}.component`}
                        control={control}
                        render={({ field: compField }) => (
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label={t('customDevelopmentForm.paymentLegal.component')}
                            value={compField.value || 'development'}
                            onChange={(e) => compField.onChange(e.target.value)}
                            disabled={disabled}
                          >
                            {CUSTOM_DEVELOPMENT_PAYMENT_COMPONENT_OPTIONS.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 10, sm: 5, md: 1.5 }}>
                      <RHFNumericField
                        name={`custom_development.payment_schedule.${index}.nominal`}
                        label={t('customDevelopmentForm.paymentLegal.nominal')}
                        disabled={disabled}
                      />
                    </Grid>

                    <Grid size={{ xs: 2, sm: 1, md: 0.5 }} sx={{ textAlign: 'right' }}>
                      <IconButton
                        color="error"
                        disabled={disabled || paymentFields.length <= 1}
                        onClick={() => removePayment(index)}
                        aria-label={t('customDevelopmentForm.paymentLegal.removeRow')}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Stack>

            {/* Reconciliation Banner */}
            <Box
              sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor:
                  draftTotals.development_delta === 0 ? 'success.lighter' : 'warning.lighter',
                border: (theme) =>
                  `1px solid ${
                    draftTotals.development_delta === 0
                      ? theme.palette.success.main
                      : theme.palette.warning.main
                  }`,
              }}
            >
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {t('customDevelopmentForm.paymentLegal.reconDevTitle')}
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {t('customDevelopmentForm.paymentLegal.targetInvestment')}
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {formatCustomDevelopmentCurrency(draftTotals.total_investment)}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {t('customDevelopmentForm.paymentLegal.currentDevPayment')}
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {formatCustomDevelopmentCurrency(draftTotals.development_payment_total)}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {t('customDevelopmentForm.paymentLegal.deltaDev')}
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      color={draftTotals.development_delta === 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCustomDevelopmentCurrency(draftTotals.development_delta)}
                    </Typography>
                  </Grid>
                </Grid>

                <Typography
                  variant="caption"
                  color={draftTotals.development_delta === 0 ? 'success.darker' : 'error.darker'}
                  fontWeight={600}
                >
                  {draftTotals.development_delta === 0
                    ? t('customDevelopmentForm.paymentLegal.balancedDev')
                    : t('customDevelopmentForm.paymentLegal.unbalancedDev')}
                </Typography>

                {draftTotals.monthly_total > 0 && (
                  <Box sx={{ pt: 1, borderTop: (theme) => `1px dashed ${theme.palette.divider}` }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                      {t('customDevelopmentForm.paymentLegal.reconMonthlyTitle')}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={draftTotals.monthly_rows_valid ? 'success.darker' : 'error.darker'}
                      fontWeight={600}
                    >
                      {draftTotals.monthly_rows_valid
                        ? t('customDevelopmentForm.paymentLegal.monthlyValid')
                        : t('customDevelopmentForm.paymentLegal.monthlyInvalid')}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ my: 1 }} />

          {/* 2. Tax Treatment */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              {t('customDevelopmentForm.paymentLegal.taxTreatment')}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFSelect
                  name="custom_development.tax_treatment"
                  label={t('customDevelopmentForm.paymentLegal.taxTreatment')}
                  disabled={disabled}
                >
                  {CUSTOM_DEVELOPMENT_TAX_TREATMENT_OPTIONS.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </RHFSelect>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* 3. Limitations */}
          <Stack spacing={2}>
            <Typography variant="subtitle2" fontWeight={700}>
              {t('customDevelopmentForm.paymentLegal.limitationsTitle')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('customDevelopmentForm.paymentLegal.catalogLimitationsSubtitle')}
            </Typography>

            <Grid container spacing={1}>
              {CUSTOM_DEVELOPMENT_LIMITATION_OPTIONS.map((item) => (
                <Grid key={item.value} size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={limitationCodes.includes(item.value)}
                        onChange={() => handleToggleLimitation(item.value)}
                        disabled={disabled}
                      />
                    }
                    label={<Typography variant="body2">{item.label}</Typography>}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Additional Limitations */}
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  {t('customDevelopmentForm.paymentLegal.additionalLimitationsTitle')}
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={() => appendAdditionalLimit('')}
                  disabled={disabled}
                >
                  {t('customDevelopmentForm.paymentLegal.addAdditionalLimitation')}
                </Button>
              </Stack>

              {additionalLimitFields.map((field, index) => (
                <Stack key={field.id} direction="row" spacing={1} alignItems="center">
                  <RHFTextField
                    name={`custom_development.additional_limitations.${index}`}
                    placeholder={t(
                      'customDevelopmentForm.paymentLegal.additionalLimitationPlaceholder'
                    )}
                    disabled={disabled}
                  />
                  <IconButton
                    color="error"
                    disabled={disabled}
                    onClick={() => removeAdditionalLimit(index)}
                    aria-label={t('customDevelopmentForm.paymentLegal.removeAdditionalLimitation')}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          </Stack>

          <Divider sx={{ my: 1 }} />

          {/* 4. Rights Statements (Accordion) */}
          <Accordion defaultExpanded={false}>
            <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
              <Typography variant="subtitle2" fontWeight={700}>
                {t('customDevelopmentForm.paymentLegal.rightsAccordionTitle')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Alert severity="warning" sx={{ py: 0.5 }}>
                  {t('customDevelopmentForm.paymentLegal.rightsWarning')}
                </Alert>

                <Stack spacing={1.5}>
                  {rightsFields.map((field, index) => (
                    <Stack key={field.id} direction="row" spacing={1} alignItems="center">
                      <RHFTextField
                        name={`custom_development.rights_statements.${index}`}
                        placeholder={t('customDevelopmentForm.paymentLegal.rightsPlaceholder')}
                        disabled={disabled}
                      />
                      <IconButton
                        color="error"
                        disabled={disabled}
                        onClick={() => removeRights(index)}
                        aria-label={t('customDevelopmentForm.paymentLegal.removeRightsStatement')}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Iconify icon="solar:add-circle-bold" />}
                    onClick={() => appendRights('')}
                    disabled={disabled}
                  >
                    {t('customDevelopmentForm.paymentLegal.addRightsStatement')}
                  </Button>
                  {rightsStatements.length > 0 && (
                    <Button
                      size="small"
                      color="error"
                      variant="text"
                      startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                      onClick={() => setClearRightsDialogOpen(true)}
                      disabled={disabled}
                    >
                      {t('customDevelopmentForm.paymentLegal.clearAllRights')}
                    </Button>
                  )}
                </Stack>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Stack>
      </CardContent>

      {/* Clear Rights Confirmation Dialog */}
      <Dialog open={clearRightsDialogOpen} onClose={() => setClearRightsDialogOpen(false)}>
        <DialogTitle>{t('customDevelopmentForm.paymentLegal.confirmClearRightsTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('customDevelopmentForm.paymentLegal.confirmClearRightsMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearRightsDialogOpen(false)} color="inherit">
            {t('customDevelopmentForm.paymentLegal.cancelClearRights')}
          </Button>
          <Button onClick={handleConfirmClearRights} variant="contained" color="warning" autoFocus>
            {t('customDevelopmentForm.paymentLegal.confirmClearRights')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
