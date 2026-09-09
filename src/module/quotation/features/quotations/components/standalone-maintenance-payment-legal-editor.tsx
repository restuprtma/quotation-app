import type { StandaloneMaintenanceTaxTreatment } from '../types';
import type { StandaloneMaintenanceFormValues } from '../constants/standalone-maintenance';

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
import Accordion from '@mui/material/Accordion';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import FormControlLabel from '@mui/material/FormControlLabel';
import DialogContentText from '@mui/material/DialogContentText';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { RHFTextField } from 'src/shared/ui/hook-form';
import { RHFNumericField } from 'src/shared/ui/hook-form/rhf-numeric-field';

import { formatStandaloneMaintenanceCurrency } from './standalone-maintenance-preview';
import {
  STANDALONE_MAINTENANCE_TAX_OPTIONS,
  calculateStandaloneMaintenanceDraftTotals,
} from '../constants/standalone-maintenance';

// ----------------------------------------------------------------------

type Props = {
  disabled?: boolean;
};

export function StandaloneMaintenancePaymentLegalEditor({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control, watch } = useFormContext<StandaloneMaintenanceFormValues>();

  const [confirmClearRightsOpen, setConfirmClearRightsOpen] = useState(false);

  const {
    fields: paymentFields,
    append: appendPayment,
    remove: removePayment,
  } = useFieldArray({
    control,
    name: 'standalone_maintenance.payment_schedule',
  });

  const {
    fields: rightsFields,
    append: appendRights,
    remove: removeRights,
    replace: replaceRights,
  } = useFieldArray({
    control,
    name: 'standalone_maintenance.rights_statements' as any,
  });

  const watchedMaintenance = watch('standalone_maintenance');

  const totals = calculateStandaloneMaintenanceDraftTotals(
    watchedMaintenance || {
      system_name: '',
      quotation_date: '',
      mode: 'retainer',
      tax_treatment: 'exclusive_ppn',
      retainer_items: [],
      hourly_cost_items: [],
      defect_groups: [],
      hourly_tasks: [],
      discount_amount: 0,
      show_discount_row: true,
      payment_schedule: [],
      rights_statements: [],
    }
  );

  const handleAddPaymentRow = () => {
    appendPayment({
      work_period: '',
      terms: '',
      invoice_date_label: '',
      due_date_label: '',
      nominal: 0,
    });
  };

  const handleAddRightsStatement = () => {
    appendRights('' as any);
  };

  const handleClearAllRights = () => {
    replaceRights([]);
    setConfirmClearRightsOpen(false);
  };

  return (
    <Stack spacing={3}>
      {/* 5. Pembayaran & Diskon */}
      <Card>
        <CardHeader
          title={t('standaloneMaintenanceForm.paymentTitle')}
          subheader={t('standaloneMaintenanceForm.paymentSubtitle')}
        />
        <CardContent>
          <Stack spacing={3}>
            {/* Payment Schedule Table */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              sx={{ gap: 1 }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                {t('standaloneMaintenanceForm.payment.scheduleTitle')}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleAddPaymentRow}
                disabled={disabled}
                aria-label={t('standaloneMaintenanceForm.payment.addRow')}
                sx={{ minHeight: 44, px: 2 }}
              >
                {t('standaloneMaintenanceForm.payment.addRow')}
              </Button>
            </Stack>

            <Stack spacing={2.5}>
              {paymentFields.map((field, index) => (
                <Box
                  key={field.id}
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.neutral',
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <RHFTextField
                        name={`standalone_maintenance.payment_schedule.${index}.work_period`}
                        label={t('standaloneMaintenanceForm.payment.workPeriod')}
                        placeholder={t('standaloneMaintenanceForm.payment.workPeriodPlaceholder')}
                        disabled={disabled}
                        size="small"
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                      <RHFTextField
                        name={`standalone_maintenance.payment_schedule.${index}.terms`}
                        label={t('standaloneMaintenanceForm.payment.terms')}
                        placeholder={t('standaloneMaintenanceForm.payment.termsPlaceholder')}
                        disabled={disabled}
                        size="small"
                      />
                    </Grid>

                    <Grid size={{ xs: 6, sm: 6, md: 2 }}>
                      <RHFTextField
                        name={`standalone_maintenance.payment_schedule.${index}.invoice_date_label`}
                        label={t('standaloneMaintenanceForm.payment.invoiceDate')}
                        placeholder={t('standaloneMaintenanceForm.payment.invoiceDatePlaceholder')}
                        disabled={disabled}
                        size="small"
                      />
                    </Grid>

                    <Grid size={{ xs: 6, sm: 6, md: 1.5 }}>
                      <RHFTextField
                        name={`standalone_maintenance.payment_schedule.${index}.due_date_label`}
                        label={t('standaloneMaintenanceForm.payment.dueDate')}
                        placeholder={t('standaloneMaintenanceForm.payment.dueDatePlaceholder')}
                        disabled={disabled}
                        size="small"
                      />
                    </Grid>

                    <Grid size={{ xs: 10, sm: 10, md: 2.5 }}>
                      <RHFNumericField
                        name={`standalone_maintenance.payment_schedule.${index}.nominal`}
                        label={t('standaloneMaintenanceForm.payment.nominal')}
                        disabled={disabled}
                        size="small"
                      />
                    </Grid>

                    <Grid size={{ xs: 2, sm: 2, md: 0.5 }} sx={{ textAlign: 'right' }}>
                      <IconButton
                        color="error"
                        aria-label={t('standaloneMaintenanceForm.payment.removeRow')}
                        disabled={disabled || paymentFields.length <= 1}
                        onClick={() => removePayment(index)}
                        sx={{ minWidth: 44, minHeight: 44 }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Stack>

            {/* Discount Section */}
            <Divider sx={{ my: 1 }} />

            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                {t('standaloneMaintenanceForm.payment.discountTitle')}
              </Typography>
              <Grid container spacing={2.5} alignItems="center">
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <RHFNumericField
                    name="standalone_maintenance.discount_amount"
                    label={t('standaloneMaintenanceForm.payment.discountAmount')}
                    disabled={disabled}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 8 }}>
                  <Controller
                    name="standalone_maintenance.show_discount_row"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(field.value)}
                            onChange={(e) => field.onChange(e.target.checked)}
                            disabled={disabled}
                          />
                        }
                        label={t('standaloneMaintenanceForm.payment.showDiscountRow')}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Reconciliation Footer */}
            <Divider sx={{ my: 1 }} />

            <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1.5 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t('standaloneMaintenanceForm.payment.totalInvestment')}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {formatStandaloneMaintenanceCurrency(totals.total_investment)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t('standaloneMaintenanceForm.payment.paymentTotal')}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {formatStandaloneMaintenanceCurrency(totals.payment_total)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t('standaloneMaintenanceForm.payment.delta')}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    color={totals.is_balanced ? 'success.main' : 'error.main'}
                  >
                    {formatStandaloneMaintenanceCurrency(totals.payment_delta)}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 1.5 }}>
                {totals.is_balanced ? (
                  <Alert severity="success">
                    {t('standaloneMaintenanceForm.payment.balanced')}
                  </Alert>
                ) : (
                  <Alert severity="error">
                    {t('standaloneMaintenanceForm.payment.unbalanced')}
                  </Alert>
                )}
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* 6. Pajak & Hak */}
      <Card>
        <CardHeader
          title={t('standaloneMaintenanceForm.taxLegalTitle')}
          subheader={t('standaloneMaintenanceForm.taxLegalSubtitle')}
        />
        <CardContent>
          <Stack spacing={3}>
            {/* Tax Treatment */}
            <Box>
              <Controller
                name="standalone_maintenance.tax_treatment"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    select
                    fullWidth
                    label={t('standaloneMaintenanceForm.taxLegal.taxTreatment')}
                    value={field.value ?? 'exclusive_ppn'}
                    onChange={(e) =>
                      field.onChange(e.target.value as StandaloneMaintenanceTaxTreatment)
                    }
                    error={Boolean(error)}
                    helperText={error?.message}
                    disabled={disabled}
                  >
                    {STANDALONE_MAINTENANCE_TAX_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>

            {/* Collapsible Rights Panel (Collapsed by default) */}
            <Accordion defaultExpanded={false} variant="outlined">
              <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {t('standaloneMaintenanceForm.taxLegal.rightsAccordionTitle')} (
                  {rightsFields.length})
                </Typography>
              </AccordionSummary>

              <AccordionDetails>
                <Stack spacing={2.5}>
                  <Alert severity="warning">
                    {t('standaloneMaintenanceForm.taxLegal.rightsWarning')}
                  </Alert>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{ gap: 1 }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Iconify icon="solar:add-circle-bold" />}
                      onClick={handleAddRightsStatement}
                      disabled={disabled}
                      aria-label={t('standaloneMaintenanceForm.taxLegal.addStatement')}
                      sx={{ minHeight: 44, px: 2 }}
                    >
                      {t('standaloneMaintenanceForm.taxLegal.addStatement')}
                    </Button>

                    {rightsFields.length > 0 && (
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => setConfirmClearRightsOpen(true)}
                        disabled={disabled}
                        aria-label={t('standaloneMaintenanceForm.taxLegal.clearAllRights')}
                        sx={{ minHeight: 44, px: 2 }}
                      >
                        {t('standaloneMaintenanceForm.taxLegal.clearAllRights')}
                      </Button>
                    )}
                  </Stack>

                  <Stack spacing={2}>
                    {rightsFields.map((field, index) => (
                      <Box key={field.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <RHFTextField
                          name={`standalone_maintenance.rights_statements.${index}`}
                          placeholder={t('standaloneMaintenanceForm.taxLegal.statementPlaceholder')}
                          disabled={disabled}
                          multiline
                          rows={2}
                          fullWidth
                        />
                        <IconButton
                          color="error"
                          aria-label={t('standaloneMaintenanceForm.taxLegal.removeStatement')}
                          disabled={disabled}
                          onClick={() => removeRights(index)}
                          sx={{ minWidth: 44, minHeight: 44 }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </CardContent>

        {/* Confirmation Dialog for Clear Rights */}
        <Dialog
          open={confirmClearRightsOpen}
          onClose={() => setConfirmClearRightsOpen(false)}
          aria-labelledby="clear-rights-dialog-title"
        >
          <DialogTitle id="clear-rights-dialog-title">
            {t('standaloneMaintenanceForm.taxLegal.clearRightsDialogTitle')}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t('standaloneMaintenanceForm.taxLegal.clearRightsDialogMessage')}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setConfirmClearRightsOpen(false)}
              color="inherit"
              sx={{ minHeight: 44, px: 2 }}
            >
              {t('standaloneMaintenanceForm.taxLegal.cancelClearRights')}
            </Button>
            <Button
              onClick={handleClearAllRights}
              variant="contained"
              color="error"
              autoFocus
              sx={{ minHeight: 44, px: 2 }}
            >
              {t('standaloneMaintenanceForm.taxLegal.confirmClearRights')}
            </Button>
          </DialogActions>
        </Dialog>
      </Card>
    </Stack>
  );
}
