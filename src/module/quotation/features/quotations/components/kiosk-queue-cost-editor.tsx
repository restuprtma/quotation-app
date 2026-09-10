import type { Control } from 'react-hook-form';
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
import MenuItem from '@mui/material/MenuItem';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { RHFSelect, RHFCheckbox, RHFTextField, RHFNumericField } from 'src/shared/ui/hook-form';

import {
  kioskQuarterLineTotal,
  kioskHardwareLineTotal,
  calculateKioskQueueLocal,
} from '../constants/kiosk-queue-system';

// ----------------------------------------------------------------------
// Quarter conversions & formatting helpers
// ----------------------------------------------------------------------

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function formatIDR(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return idrFormatter.format(Number(value) || 0);
}

export function quartersToDisplayMonths(quarters: number): number {
  if (!Number.isSafeInteger(quarters) || quarters < 0) return 0;
  return quarters / 4;
}

export function displayMonthsToQuarters(months: number): number {
  if (typeof months !== 'number' || Number.isNaN(months) || months < 0) return 0;
  return Math.round(months * 4);
}

export const QUARTER_OPTIONS = [
  { value: 1, label: '0,25 bln (1 minggu)' },
  { value: 2, label: '0,5 bln (2 minggu)' },
  { value: 3, label: '0,75 bln (3 minggu)' },
  { value: 4, label: '1 bln' },
  { value: 8, label: '2 bln' },
  { value: 12, label: '3 bln' },
  { value: 16, label: '4 bln' },
  { value: 20, label: '5 bln' },
  { value: 24, label: '6 bln' },
  { value: 32, label: '8 bln' },
  { value: 48, label: '12 bln (1 tahun)' },
] as const;

export type PaymentReconciliationResult = {
  matches: boolean;
  severity: 'success' | 'error';
  delta: number;
  formattedDelta: string;
};

export function calculatePaymentReconciliation(
  targetTotal: number,
  paymentTotal: number
): PaymentReconciliationResult {
  const delta = Math.abs(targetTotal - paymentTotal);
  const matches = delta === 0 && targetTotal > 0;
  return {
    matches,
    severity: matches ? 'success' : 'error',
    delta,
    formattedDelta: formatIDR(delta),
  };
}

// ----------------------------------------------------------------------
// Service Group Items Sub-Component
// ----------------------------------------------------------------------

type ServiceGroupItemsProps = {
  groupIndex: number;
  control: Control<KioskQueueFormValues>;
  disabled?: boolean;
};

function ServiceGroupItems({ groupIndex, control, disabled }: ServiceGroupItemsProps) {
  const { t } = useTranslate('quotation');
  const path = `kiosk_queue_system.service_groups.${groupIndex}.items` as const;

  const { fields, append, remove } = useFieldArray({
    control,
    name: path,
  });

  const groupItems =
    useWatch({
      control,
      name: path,
    }) || [];

  return (
    <Stack spacing={2} sx={{ mt: 1.5 }}>
      {fields.map((field, iIdx) => {
        const item = groupItems[iIdx] || {
          name: '',
          monthly_rate: 0,
          headcount: 1,
          period_quarters: 4,
        };
        const lineTotal = kioskQuarterLineTotal(
          item.monthly_rate || 0,
          item.headcount || 1,
          item.period_quarters || 4
        );

        return (
          <Paper
            key={field.id}
            variant="outlined"
            sx={{ p: 2, borderRadius: 1, bgcolor: 'background.paper' }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <RHFTextField
                  name={`${path}.${iIdx}.name`}
                  label={t('kioskQueueForm.cost.itemName', 'Nama Item / Posisi Jasa')}
                  placeholder="contoh: Senior Software Engineer"
                  size="small"
                  disabled={disabled}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <RHFNumericField
                  name={`${path}.${iIdx}.monthly_rate`}
                  label={t('kioskQueueForm.cost.monthlyRate', 'Tarif Bulanan (IDR)')}
                  size="small"
                  disabled={disabled}
                />
              </Grid>

              <Grid size={{ xs: 6, sm: 1.5 }}>
                <RHFNumericField
                  name={`${path}.${iIdx}.headcount`}
                  label={t('kioskQueueForm.cost.headcount', 'Personel')}
                  size="small"
                  disabled={disabled}
                />
              </Grid>

              <Grid size={{ xs: 6, sm: 2 }}>
                <RHFSelect
                  name={`${path}.${iIdx}.period_quarters`}
                  label={t('kioskQueueForm.cost.period', 'Periode')}
                  size="small"
                  disabled={disabled}
                >
                  {QUARTER_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </RHFSelect>
              </Grid>

              <Grid size={{ xs: 10, sm: 1.5 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t('kioskQueueForm.cost.lineTotal', 'Total')}
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {formatIDR(lineTotal)}
                </Typography>
              </Grid>

              <Grid size={{ xs: 2, sm: 0.5 }}>
                <Tooltip title={t('kioskQueueForm.cost.removeItem', 'Hapus Item')}>
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => remove(iIdx)}
                      disabled={disabled || fields.length <= 1}
                      aria-label="Hapus item jasa"
                      sx={{ minWidth: 44, minHeight: 44 }}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Grid>
            </Grid>
          </Paper>
        );
      })}

      <Box>
        <Button
          size="small"
          variant="text"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() =>
            append({
              name: '',
              monthly_rate: 0,
              headcount: 1,
              period_quarters: 4,
            })
          }
          disabled={disabled || fields.length >= 100}
          aria-label="Tambah item jasa"
          sx={{ minHeight: 44 }}
        >
          {t('kioskQueueForm.cost.addItem', 'Tambah Item Jasa')}
        </Button>
      </Box>
    </Stack>
  );
}

// ----------------------------------------------------------------------
// Main Cost Editor Component
// ----------------------------------------------------------------------

type Props = {
  disabled?: boolean;
};

export function KioskQueueCostEditor({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control } = useFormContext<KioskQueueFormValues>();

  const currentKiosk = useWatch({
    control,
    name: 'kiosk_queue_system',
  });

  const variant = currentKiosk?.variant || 'government_mpp';
  const hardwareProvision = currentKiosk?.hardware_provision || 'client_supplied';
  const showDiscount = Boolean(currentKiosk?.show_service_discount_row);

  // Service groups field array
  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({
    control,
    name: 'kiosk_queue_system.service_groups',
  });

  // Hardware items field array (Venturo-supplied only)
  const {
    fields: hardwareFields,
    append: appendHardware,
    remove: removeHardware,
  } = useFieldArray({
    control,
    name: 'kiosk_queue_system.hardware_items',
  });

  // Maintenance items field array (Private only)
  const {
    fields: maintenanceFields,
    append: appendMaintenance,
    remove: removeMaintenance,
  } = useFieldArray({
    control,
    name: 'kiosk_queue_system.maintenance_items',
  });

  // Local calculation totals
  const totals = calculateKioskQueueLocal(currentKiosk || {});
  const reconciliation = calculatePaymentReconciliation(
    totals.paymentTargetTotal,
    totals.paymentTotal
  );

  return (
    <Card data-testid="kiosk-queue-cost-editor">
      <CardHeader
        title={t('kioskQueueForm.cost.title', '4. Biaya & Anggaran')}
        subheader={t(
          'kioskQueueForm.cost.subtitle',
          'Rincian biaya jasa pengembangan, pengadaan hardware kondisional, diskon, dan kalkulasi PPN'
        )}
      />
      <CardContent>
        <Stack spacing={4}>
          {/* Section 1: Kelompok Biaya Jasa */}
          <Stack spacing={2.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={700}>
                {t('kioskQueueForm.cost.serviceGroupsTitle', 'Kelompok Biaya Jasa')}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:folder-with-files-bold" />}
                onClick={() =>
                  appendGroup({
                    title: '',
                    items: [{ name: '', monthly_rate: 0, headcount: 1, period_quarters: 4 }],
                  })
                }
                disabled={disabled || groupFields.length >= 30}
                aria-label="Tambah kelompok jasa"
                sx={{ minHeight: 44 }}
              >
                {t('kioskQueueForm.cost.addGroup', 'Tambah Kelompok')}
              </Button>
            </Stack>

            {groupFields.map((group, gIdx) => (
              <Paper
                key={group.id}
                variant="outlined"
                sx={{ p: 2.5, borderRadius: 1.5, bgcolor: 'background.neutral' }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <RHFTextField
                      name={`kiosk_queue_system.service_groups.${gIdx}.title`}
                      label={t('kioskQueueForm.cost.groupTitleLabel', `Judul Kelompok ${gIdx + 1}`)}
                      placeholder="contoh: Pengembangan Modul Dispenser Antrian"
                      disabled={disabled}
                      fullWidth
                    />
                    <Tooltip title={t('kioskQueueForm.cost.removeGroup', 'Hapus Kelompok')}>
                      <span>
                        <IconButton
                          color="error"
                          onClick={() => removeGroup(gIdx)}
                          disabled={disabled || groupFields.length <= 1}
                          aria-label="Hapus kelompok jasa"
                          sx={{ minWidth: 44, minHeight: 44 }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>

                  <ServiceGroupItems groupIndex={gIdx} control={control} disabled={disabled} />
                </Stack>
              </Paper>
            ))}
          </Stack>

          {/* Section 2: Diskon Jasa */}
          <Stack spacing={1.5} sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.neutral' }}>
            <RHFCheckbox
              name="kiosk_queue_system.show_service_discount_row"
              label={t('kioskQueueForm.cost.showDiscount', 'Tampilkan baris diskon biaya jasa')}
              disabled={disabled}
            />

            {showDiscount && (
              <Box sx={{ maxWidth: 360, pt: 1 }}>
                <RHFNumericField
                  name="kiosk_queue_system.service_discount_amount"
                  label={t('kioskQueueForm.cost.discountAmount', 'Nominal Diskon Jasa (IDR)')}
                  disabled={disabled}
                  size="small"
                />
              </Box>
            )}
          </Stack>

          {/* Section 3: Hardware Items (Venturo-supplied only) */}
          {variant === 'government_mpp' && hardwareProvision === 'venturo_supplied' && (
            <Stack spacing={2.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight={700}>
                  {t(
                    'kioskQueueForm.cost.hardwareTitle',
                    'Pengadaan Perangkat Keras (Hardware Venturo)'
                  )}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="solar:devices-bold" />}
                  onClick={() =>
                    appendHardware({
                      name: '',
                      unit_price: 0,
                      quantity: 1,
                    })
                  }
                  disabled={disabled || hardwareFields.length >= 100}
                  aria-label="Tambah item hardware"
                  sx={{ minHeight: 44 }}
                >
                  {t('kioskQueueForm.cost.addHardware', 'Tambah Perangkat')}
                </Button>
              </Stack>

              {hardwareFields.map((hw, hIdx) => {
                const currentHw = currentKiosk?.hardware_items?.[hIdx] || {
                  name: '',
                  unit_price: 0,
                  quantity: 1,
                };
                const lineTotal = kioskHardwareLineTotal(
                  currentHw.unit_price || 0,
                  currentHw.quantity || 1
                );

                return (
                  <Paper
                    key={hw.id}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 1, bgcolor: 'background.paper' }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 5 }}>
                        <RHFTextField
                          name={`kiosk_queue_system.hardware_items.${hIdx}.name`}
                          label={t('kioskQueueForm.cost.hardwareName', 'Nama Perangkat')}
                          placeholder="contoh: Thermal Ticket Printer 80mm Autocutter"
                          size="small"
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 3 }}>
                        <RHFNumericField
                          name={`kiosk_queue_system.hardware_items.${hIdx}.unit_price`}
                          label={t('kioskQueueForm.cost.unitPrice', 'Harga Satuan (IDR)')}
                          size="small"
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 6, sm: 1.5 }}>
                        <RHFNumericField
                          name={`kiosk_queue_system.hardware_items.${hIdx}.quantity`}
                          label={t('kioskQueueForm.cost.quantity', 'Jumlah (Unit)')}
                          size="small"
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 6, sm: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {t('kioskQueueForm.cost.total', 'Total')}
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {formatIDR(lineTotal)}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 0.5 }}>
                        <Tooltip title={t('kioskQueueForm.cost.removeHardware', 'Hapus')}>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeHardware(hIdx)}
                              disabled={disabled || hardwareFields.length <= 1}
                              aria-label="Hapus perangkat keras"
                              sx={{ minWidth: 44, minHeight: 44 }}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })}
            </Stack>
          )}

          {/* Section 4: Maintenance Items (Private variant only) */}
          {variant === 'private_food_court' && (
            <Stack spacing={2.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight={700}>
                  {t(
                    'kioskQueueForm.cost.maintenanceTitle',
                    'Item Pemeliharaan / Maintenance (Opsional)'
                  )}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="solar:wrench-bold" />}
                  onClick={() =>
                    appendMaintenance({
                      name: '',
                      monthly_rate: 0,
                      headcount: 1,
                      period_quarters: 4,
                    })
                  }
                  disabled={disabled || maintenanceFields.length >= 50}
                  aria-label="Tambah item maintenance"
                  sx={{ minHeight: 44 }}
                >
                  {t('kioskQueueForm.cost.addMaintenance', 'Tambah Maintenance')}
                </Button>
              </Stack>

              {maintenanceFields.map((m, mIdx) => {
                const currentM = currentKiosk?.maintenance_items?.[mIdx] || {
                  name: '',
                  monthly_rate: 0,
                  headcount: 1,
                  period_quarters: 4,
                };
                const lineTotal = kioskQuarterLineTotal(
                  currentM.monthly_rate || 0,
                  currentM.headcount || 1,
                  currentM.period_quarters || 4
                );

                return (
                  <Paper
                    key={m.id}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 1, bgcolor: 'background.paper' }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <RHFTextField
                          name={`kiosk_queue_system.maintenance_items.${mIdx}.name`}
                          label={t('kioskQueueForm.cost.maintenanceName', 'Item Maintenance')}
                          placeholder="contoh: Maintenance Support & Monitoring"
                          size="small"
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 3 }}>
                        <RHFNumericField
                          name={`kiosk_queue_system.maintenance_items.${mIdx}.monthly_rate`}
                          label={t('kioskQueueForm.cost.monthlyRate', 'Tarif Bulanan (IDR)')}
                          size="small"
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 6, sm: 1.5 }}>
                        <RHFNumericField
                          name={`kiosk_queue_system.maintenance_items.${mIdx}.headcount`}
                          label={t('kioskQueueForm.cost.headcount', 'Personel')}
                          size="small"
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 6, sm: 2 }}>
                        <RHFSelect
                          name={`kiosk_queue_system.maintenance_items.${mIdx}.period_quarters`}
                          label={t('kioskQueueForm.cost.period', 'Periode')}
                          size="small"
                          disabled={disabled}
                        >
                          {QUARTER_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </RHFSelect>
                      </Grid>

                      <Grid size={{ xs: 10, sm: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {t('kioskQueueForm.cost.total', 'Total')}
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {formatIDR(lineTotal)}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 2, sm: 0.5 }}>
                        <Tooltip title={t('kioskQueueForm.cost.removeMaintenance', 'Hapus')}>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeMaintenance(mIdx)}
                              disabled={disabled}
                              aria-label="Hapus item maintenance"
                              sx={{ minWidth: 44, minHeight: 44 }}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })}
            </Stack>
          )}

          {/* Section 5: Status Kalkulasi Rekonsiliasi Pembayaran */}
          <Alert severity={reconciliation.severity} aria-live="polite">
            {reconciliation.matches
              ? t('kioskQueueForm.payment.reconciled', 'Total pembayaran sesuai')
              : t('kioskQueueForm.payment.mismatch', {
                  defaultValue: `Selisih pembayaran ${reconciliation.formattedDelta}`,
                  delta: reconciliation.formattedDelta,
                })}
          </Alert>
        </Stack>
      </CardContent>
    </Card>
  );
}
