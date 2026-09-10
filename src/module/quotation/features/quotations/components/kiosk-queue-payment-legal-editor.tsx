import type { KioskQueueLimitationCode } from '../types';
import type { KioskQueueFormValues } from './kiosk-queue-form-model';

import { useWatch, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import Accordion from '@mui/material/Accordion';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { RHFTextField, RHFNumericField } from 'src/shared/ui/hook-form';

import { fieldId } from './kiosk-queue-form-model';
import { KIOSK_QUEUE_LIMITATION_OPTIONS } from '../constants/kiosk-queue-system';

// ----------------------------------------------------------------------

type Props = {
  disabled?: boolean;
};

export function KioskQueuePaymentLegalEditor({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control, setValue } = useFormContext<KioskQueueFormValues>();

  const currentKiosk = useWatch({
    control,
    name: 'kiosk_queue_system',
  });

  const variant = currentKiosk?.variant || 'government_mpp';
  const hardwareProvision = currentKiosk?.hardware_provision || 'client_supplied';

  // Government payment schedule field array
  const {
    fields: govPaymentFields,
    append: appendGovPayment,
    remove: removeGovPayment,
  } = useFieldArray({
    control,
    name: 'kiosk_queue_system.government_payment_schedule',
  });

  // Private payment schedule field array
  const {
    fields: privPaymentFields,
    append: appendPrivPayment,
    remove: removePrivPayment,
  } = useFieldArray({
    control,
    name: 'kiosk_queue_system.private_payment_schedule',
  });

  // Additional limitations helper
  const additionalLimitations = (currentKiosk?.additional_limitations || []) as string[];
  const handleAddAdditionalLimitation = () => {
    setValue('kiosk_queue_system.additional_limitations', [...additionalLimitations, ''], {
      shouldValidate: true,
      shouldDirty: true,
    });
  };
  const handleRemoveAdditionalLimitation = (index: number) => {
    setValue(
      'kiosk_queue_system.additional_limitations',
      additionalLimitations.filter((_, i) => i !== index),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  // Rights statements helper
  const rightsStatements = (currentKiosk?.rights_statements || []) as string[];
  const handleAddRightsStatement = () => {
    setValue('kiosk_queue_system.rights_statements', [...rightsStatements, ''], {
      shouldValidate: true,
      shouldDirty: true,
    });
  };
  const handleRemoveRightsStatement = (index: number) => {
    setValue(
      'kiosk_queue_system.rights_statements',
      rightsStatements.filter((_, i) => i !== index),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  // Handle limitation checkboxes
  const currentLimitationCodes: KioskQueueLimitationCode[] = currentKiosk?.limitation_codes || [];

  const handleToggleLimitation = (code: KioskQueueLimitationCode) => {
    // If mandatory, ignore toggle
    if (code === 'civil_electrical' && variant === 'government_mpp') return;
    if (code === 'client_hardware' && hardwareProvision === 'client_supplied') return;

    let next: KioskQueueLimitationCode[];
    if (currentLimitationCodes.includes(code)) {
      next = currentLimitationCodes.filter((c) => c !== code);
    } else {
      next = [...currentLimitationCodes, code];
    }
    setValue('kiosk_queue_system.limitation_codes', next, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <Card data-testid="kiosk-queue-payment-legal-editor">
      <CardHeader
        title={t('kioskQueueForm.payment.title', '5. Pembayaran & Batasan Legal')}
        subheader={t(
          'kioskQueueForm.payment.subtitle',
          'Termin penagihan nominal deterministik, batasan klausul kontrak, dan hak kekayaan intelektual'
        )}
      />
      <CardContent>
        <Stack spacing={4}>
          {/* 1. Jadwal Pembayaran */}
          <Stack spacing={2.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={700}>
                {variant === 'government_mpp'
                  ? t('kioskQueueForm.payment.govScheduleTitle', 'Tahapan Pembayaran Pemerintah')
                  : t(
                      'kioskQueueForm.payment.privScheduleTitle',
                      'Jadwal & Termin Pembayaran Swasta'
                    )}
              </Typography>

              {variant === 'government_mpp' ? (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="solar:bill-check-bold" />}
                  onClick={() =>
                    appendGovPayment({
                      stage: '',
                      billing_basis: '',
                      nominal: 0,
                    })
                  }
                  disabled={disabled || govPaymentFields.length >= 60}
                  aria-label="Tambah termin pembayaran"
                  sx={{ minHeight: 44 }}
                >
                  {t('kioskQueueForm.payment.addStage', 'Tambah Termin')}
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="solar:bill-check-bold" />}
                  onClick={() =>
                    appendPrivPayment({
                      work_period: '',
                      terms: '',
                      invoice_date_label: '',
                      due_date_label: '',
                      nominal: 0,
                    })
                  }
                  disabled={disabled || privPaymentFields.length >= 60}
                  aria-label="Tambah termin pembayaran"
                  sx={{ minHeight: 44 }}
                >
                  {t('kioskQueueForm.payment.addStage', 'Tambah Termin')}
                </Button>
              )}
            </Stack>

            {/* Government Rows */}
            {variant === 'government_mpp' && (
              <Stack spacing={2}>
                {govPaymentFields.map((field, pIdx) => (
                  <Paper
                    key={field.id}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 1, bgcolor: 'background.paper' }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <RHFTextField
                          id={fieldId(
                            `kiosk_queue_system.government_payment_schedule.${pIdx}.stage`
                          )}
                          name={`kiosk_queue_system.government_payment_schedule.${pIdx}.stage`}
                          label={t('kioskQueueForm.payment.stage', 'Tahap Pembayaran')}
                          placeholder="contoh: Pembayaran Uang Muka 50%"
                          size="small"
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <RHFTextField
                          id={fieldId(
                            `kiosk_queue_system.government_payment_schedule.${pIdx}.billing_basis`
                          )}
                          name={`kiosk_queue_system.government_payment_schedule.${pIdx}.billing_basis`}
                          label={t('kioskQueueForm.payment.billingBasis', 'Dasar Penagihan')}
                          placeholder="contoh: Penandatanganan Kontrak & SPMK"
                          size="small"
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 10, sm: 3.5 }}>
                        <Box
                          id={fieldId(
                            `kiosk_queue_system.government_payment_schedule.${pIdx}.nominal`
                          )}
                        >
                          <RHFNumericField
                            name={`kiosk_queue_system.government_payment_schedule.${pIdx}.nominal`}
                            label={t('kioskQueueForm.payment.nominal', 'Nominal Pembayaran (IDR)')}
                            size="small"
                            disabled={disabled}
                          />
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 2, sm: 0.5 }}>
                        <Tooltip title={t('kioskQueueForm.payment.removeStage', 'Hapus')}>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeGovPayment(pIdx)}
                              disabled={disabled || govPaymentFields.length <= 1}
                              aria-label="Hapus termin pembayaran"
                              sx={{ minWidth: 44, minHeight: 44 }}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}

                <Box
                  id={fieldId('kiosk_queue_system.payment_due_days')}
                  sx={{ maxWidth: 300, pt: 1 }}
                >
                  <RHFNumericField
                    name="kiosk_queue_system.payment_due_days"
                    label={t('kioskQueueForm.payment.dueDays', 'Jatuh Tempo Pembayaran (Hari)')}
                    helperText={t(
                      'kioskQueueForm.payment.dueDaysHelper',
                      'Batas waktu pelunasan invoice pemerintah (default 14 hari)'
                    )}
                    size="small"
                    disabled={disabled}
                  />
                </Box>
              </Stack>
            )}

            {/* Private Rows */}
            {variant === 'private_food_court' && (
              <Stack spacing={2}>
                {privPaymentFields.map((field, pIdx) => (
                  <Paper
                    key={field.id}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 1, bgcolor: 'background.paper' }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <RHFTextField
                          id={fieldId(
                            `kiosk_queue_system.private_payment_schedule.${pIdx}.work_period`
                          )}
                          name={`kiosk_queue_system.private_payment_schedule.${pIdx}.work_period`}
                          label={t('kioskQueueForm.payment.workPeriod', 'Work Period / Tahap')}
                          placeholder="contoh: Termin 1"
                          size="small"
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 3 }}>
                        <RHFTextField
                          id={fieldId(`kiosk_queue_system.private_payment_schedule.${pIdx}.terms`)}
                          name={`kiosk_queue_system.private_payment_schedule.${pIdx}.terms`}
                          label={t('kioskQueueForm.payment.terms', 'Terms / Ketentuan')}
                          placeholder="contoh: DP Kick-off 50%"
                          size="small"
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 6, sm: 2 }}>
                        <RHFTextField
                          id={fieldId(
                            `kiosk_queue_system.private_payment_schedule.${pIdx}.invoice_date_label`
                          )}
                          name={`kiosk_queue_system.private_payment_schedule.${pIdx}.invoice_date_label`}
                          label={t('kioskQueueForm.payment.invoiceDate', 'Invoice Date')}
                          placeholder="contoh: Saat SPMK"
                          size="small"
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 6, sm: 1.5 }}>
                        <RHFTextField
                          id={fieldId(
                            `kiosk_queue_system.private_payment_schedule.${pIdx}.due_date_label`
                          )}
                          name={`kiosk_queue_system.private_payment_schedule.${pIdx}.due_date_label`}
                          label={t('kioskQueueForm.payment.dueDate', 'Due Date')}
                          placeholder="contoh: H+14"
                          size="small"
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 10, sm: 2 }}>
                        <Box
                          id={fieldId(
                            `kiosk_queue_system.private_payment_schedule.${pIdx}.nominal`
                          )}
                        >
                          <RHFNumericField
                            name={`kiosk_queue_system.private_payment_schedule.${pIdx}.nominal`}
                            label={t('kioskQueueForm.payment.nominal', 'Nominal (IDR)')}
                            size="small"
                            disabled={disabled}
                          />
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 2, sm: 0.5 }}>
                        <Tooltip title={t('kioskQueueForm.payment.removeStage', 'Hapus')}>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removePrivPayment(pIdx)}
                              disabled={disabled || privPaymentFields.length <= 1}
                              aria-label="Hapus termin pembayaran"
                              sx={{ minWidth: 44, minHeight: 44 }}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>

          {/* 2. Batasan dan Asumsi */}
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              {t('kioskQueueForm.limitations.title', 'Batasan dan Pengecualian Layanan')}
            </Typography>

            <Grid container spacing={1.5}>
              {KIOSK_QUEUE_LIMITATION_OPTIONS.map((opt) => {
                const isMandatoryGov =
                  opt.value === 'civil_electrical' && variant === 'government_mpp';
                const isMandatoryClientHw =
                  opt.value === 'client_hardware' && hardwareProvision === 'client_supplied';
                const isMandatory = isMandatoryGov || isMandatoryClientHw;
                const isChecked = isMandatory || currentLimitationCodes.includes(opt.value);

                return (
                  <Grid size={{ xs: 12, md: 6 }} key={opt.value}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: isMandatory ? 'action.hover' : 'background.paper',
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isChecked}
                            disabled={disabled || isMandatory}
                            onChange={() => handleToggleLimitation(opt.value)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight={isMandatory ? 600 : 400}>
                              {opt.label}
                            </Typography>
                            {isMandatory && (
                              <Typography variant="caption" color="text.secondary">
                                {t(
                                  'kioskQueueForm.limitations.mandatoryClause',
                                  'Klausul wajib tidak dapat dihapus.'
                                )}
                              </Typography>
                            )}
                          </Box>
                        }
                        sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
                      />
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            {/* Additional Limitations */}
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2">
                  {t(
                    'kioskQueueForm.limitations.additionalTitle',
                    'Batasan Tambahan Khusus (Opsional)'
                  )}
                </Typography>
                <Button
                  size="small"
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={handleAddAdditionalLimitation}
                  disabled={disabled || additionalLimitations.length >= 20}
                  aria-label="Tambah batasan tambahan"
                  sx={{ minHeight: 44 }}
                >
                  {t('kioskQueueForm.limitations.addAdditional', 'Tambah Batasan')}
                </Button>
              </Stack>

              {additionalLimitations.map((_, aIdx) => (
                <Stack key={aIdx} direction="row" spacing={1} alignItems="center">
                  <RHFTextField
                    id={fieldId(`kiosk_queue_system.additional_limitations.${aIdx}`)}
                    name={`kiosk_queue_system.additional_limitations.${aIdx}`}
                    placeholder="contoh: Akses ke ruang server harus didampingi teknisi klien"
                    size="small"
                    disabled={disabled}
                    fullWidth
                  />
                  <Tooltip title="Hapus Batasan">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveAdditionalLimitation(aIdx)}
                        disabled={disabled}
                        aria-label="Hapus batasan tambahan"
                        sx={{ minWidth: 44, minHeight: 44 }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              ))}
            </Stack>
          </Stack>

          {/* 3. Hak Cipta & Kekayaan Intelektual (Advanced Collapsed Section) */}
          <Accordion
            variant="outlined"
            sx={{
              borderRadius: 1.5,
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Iconify icon="solar:shield-keyhole-bold" width={22} sx={{ color: 'info.main' }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  {t(
                    'kioskQueueForm.rights.title',
                    'Klausul Hak Cipta & Kepemilikan Kode (Lanjutan / Khusus)'
                  )}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2.5}>
                <Alert severity="warning">
                  {t(
                    'kioskQueueForm.rights.warning',
                    'Pernyataan hak cipta bersifat mengikat secara hukum. Pastikan klausul telah disetujui manajemen legal sebelum quotation diterbitkan.'
                  )}
                </Alert>

                <Stack spacing={1.5}>
                  {rightsStatements.map((_, rIdx) => (
                    <Stack key={rIdx} direction="row" spacing={1} alignItems="center">
                      <RHFTextField
                        id={fieldId(`kiosk_queue_system.rights_statements.${rIdx}`)}
                        name={`kiosk_queue_system.rights_statements.${rIdx}`}
                        placeholder="contoh: Source code modul integrasi diserahkan secara non-eksklusif..."
                        size="small"
                        disabled={disabled}
                        fullWidth
                      />
                      <Tooltip title="Hapus Klausul Hak Cipta">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveRightsStatement(rIdx)}
                            disabled={disabled}
                            aria-label="Hapus klausul hak cipta"
                            sx={{ minWidth: 44, minHeight: 44 }}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  ))}

                  <Box>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Iconify icon="solar:add-circle-bold" />}
                      onClick={handleAddRightsStatement}
                      disabled={disabled || rightsStatements.length >= 20}
                      aria-label="Tambah pernyataan hak cipta"
                      sx={{ minHeight: 44 }}
                    >
                      {t('kioskQueueForm.rights.addStatement', 'Tambah Klausul Hak Cipta')}
                    </Button>
                  </Box>
                </Stack>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Stack>
      </CardContent>
    </Card>
  );
}
