import type {
  KioskQueueDocumentSection,
  KioskQueuePreviewResponse,
  ResolvedKioskQueueProfile,
} from '../types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function formatKioskQueueCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '-';
  }
  return currencyFormatter.format(Number(value) || 0);
}

export type KioskQueuePreviewViewModel = {
  isGovernment: boolean;
  serviceSubtotal: number;
  serviceDiscountAmount: number;
  serviceTaxAmount: number;
  serviceTotal: number;
  hardwareSubtotal: number;
  hardwareTaxAmount: number;
  hardwareTotal: number;
  maintenanceTotal: number;
  paymentTargetTotal: number;
  paymentTotal: number;
  paymentDelta: number;
  isBalanced: boolean;
  showHardware: boolean;
  showMaintenance: boolean;
  showRights: boolean;
  taxClauseText: string;
  visibleSections: KioskQueueDocumentSection[];
  resolvedProfile: ResolvedKioskQueueProfile;
};

export function toKioskQueuePreviewViewModel(
  preview: KioskQueuePreviewResponse
): KioskQueuePreviewViewModel {
  const { calculation, resolved_profile } = preview;
  const isGovernment = calculation.variant === 'government_mpp';
  const paymentDelta = calculation.payment_target_total - calculation.payment_total;
  const isBalanced = paymentDelta === 0 && calculation.payment_target_total > 0;

  return {
    isGovernment,
    serviceSubtotal: calculation.service_subtotal,
    serviceDiscountAmount: calculation.service_discount_amount,
    serviceTaxAmount: calculation.service_tax_amount,
    serviceTotal: calculation.service_total,
    hardwareSubtotal: calculation.hardware_subtotal,
    hardwareTaxAmount: calculation.hardware_tax_amount,
    hardwareTotal: calculation.hardware_total,
    maintenanceTotal: calculation.maintenance_total,
    paymentTargetTotal: calculation.payment_target_total,
    paymentTotal: calculation.payment_total,
    paymentDelta,
    isBalanced,
    showHardware: resolved_profile.show_hardware,
    showMaintenance: resolved_profile.show_maintenance,
    showRights: resolved_profile.show_rights,
    taxClauseText: resolved_profile.tax_clause_text,
    visibleSections: resolved_profile.sections || [],
    resolvedProfile: resolved_profile,
  };
}

export function isKioskQueueSubmitReady(params: {
  isValid: boolean;
  isDebouncing: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isSubmitting?: boolean;
  error: any;
  preview: KioskQueuePreviewResponse | undefined;
  previewPayloadHash: string;
  currentNormalizedPayloadHash: string;
}): boolean {
  if (!params.isValid) return false;
  if (params.isSubmitting) return false;
  if (params.isDebouncing || params.isFetching || Boolean(params.error) || !params.isSuccess) {
    return false;
  }
  if (!params.preview) return false;
  if (params.previewPayloadHash !== params.currentNormalizedPayloadHash) return false;

  const { calculation } = params.preview;
  if (calculation.payment_total !== calculation.payment_target_total) return false;

  return true;
}

// ----------------------------------------------------------------------

type Props = {
  preview?: KioskQueuePreviewResponse;
  isLoading?: boolean;
  isDebouncing?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  previewReady?: boolean;
};

function PreviewAmountRow({
  label,
  value,
  muted = false,
  strong = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography
        variant="body2"
        color={muted ? 'text.secondary' : 'text.primary'}
        fontWeight={strong ? 700 : 400}
      >
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={strong ? 700 : 500} textAlign="right">
        {formatKioskQueueCurrency(value)}
      </Typography>
    </Stack>
  );
}

export function KioskQueuePreview({
  preview,
  isLoading = false,
  isDebouncing = false,
  error = null,
  onRetry,
}: Props) {
  const { t } = useTranslate('quotation');

  const vm = preview ? toKioskQueuePreviewViewModel(preview) : null;

  return (
    <Card variant="outlined" data-testid="kiosk-queue-preview">
      <Stack spacing={2.5} sx={{ p: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {t('kioskQueueForm.preview.title', 'Pratinjau Quotation & Kalkulasi')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t(
              'kioskQueueForm.preview.subtitle',
              'Kalkulasi server-authoritative deterministik untuk review sebelum dokumen dibuat'
            )}
          </Typography>
        </Box>

        <Box aria-live="polite">
          {(isLoading || isDebouncing) && (
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {t('kioskQueueForm.preview.loading', 'Menghitung kalkulasi resmi di backend...')}
              </Typography>
            </Stack>
          )}

          {error && !isLoading && !isDebouncing && (
            <Alert
              severity="error"
              action={
                onRetry ? (
                  <Button color="inherit" size="small" onClick={onRetry}>
                    {t('kioskQueueForm.preview.retry', 'Coba lagi')}
                  </Button>
                ) : undefined
              }
            >
              {error.message ||
                t('kioskQueueForm.preview.error', 'Gagal memuat pratinjau kalkulasi')}
            </Alert>
          )}
        </Box>

        {vm && !error && (
          <>
            {/* Configuration Badges */}
            <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                {t('kioskQueueForm.preview.resolvedConfig', 'Konfigurasi Sistem:')}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 1.5 }}>
                <Chip
                  size="small"
                  label={
                    vm.isGovernment
                      ? t('kioskQueueForm.variant.government', 'Instansi Pemerintah / MPP')
                      : t('kioskQueueForm.variant.private', 'Korporasi Swasta / Food Court')
                  }
                  color={vm.isGovernment ? 'primary' : 'secondary'}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={
                    vm.showHardware
                      ? t('kioskQueueForm.hardware.venturo', 'Perangkat disediakan Venturo')
                      : t('kioskQueueForm.hardware.client', 'Perangkat disediakan klien')
                  }
                  color={vm.showHardware ? 'warning' : 'default'}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={
                    vm.isGovernment
                      ? t('kioskQueueForm.tax.inclusive', 'Termasuk PPN 11%')
                      : t('kioskQueueForm.tax.exclusive', 'Belum Termasuk PPN')
                  }
                  color="info"
                  variant="outlined"
                />
                {vm.showMaintenance && (
                  <Chip
                    size="small"
                    label={t('kioskQueueForm.preview.hasMaintenance', 'Termasuk Maintenance')}
                    color="success"
                    variant="outlined"
                  />
                )}
              </Stack>

              {vm.taxClauseText && (
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>{t('kioskQueueForm.preview.taxClause', 'Klausul Pajak:')}</strong>{' '}
                  {vm.taxClauseText}
                </Typography>
              )}

              <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 1 }}>
                {t('kioskQueueForm.preview.sections', 'Bagian Dokumen:')}{' '}
                {vm.visibleSections.map((s) => `${s.number}. ${s.title}`).join(' · ')}
              </Typography>
            </Box>

            {/* Financial Summary */}
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t('kioskQueueForm.preview.financialSummary', 'Ringkasan Anggaran')}
              </Typography>

              {vm.isGovernment ? (
                <>
                  <PreviewAmountRow
                    label={t('kioskQueueForm.preview.serviceSubtotal', 'Subtotal Jasa')}
                    value={vm.serviceSubtotal}
                  />

                  {vm.serviceDiscountAmount > 0 && (
                    <PreviewAmountRow
                      label={t('kioskQueueForm.preview.discount', 'Diskon Jasa')}
                      value={-vm.serviceDiscountAmount}
                      muted
                    />
                  )}

                  <PreviewAmountRow
                    label={t('kioskQueueForm.preview.serviceTax', 'PPN 11% Jasa')}
                    value={vm.serviceTaxAmount}
                    muted
                  />

                  <PreviewAmountRow
                    label={t('kioskQueueForm.preview.serviceTotal', 'Total Jasa (Termasuk PPN)')}
                    value={vm.serviceTotal}
                    strong
                  />

                  {vm.showHardware && (
                    <>
                      <Divider sx={{ my: 0.5 }} />
                      <PreviewAmountRow
                        label={t(
                          'kioskQueueForm.preview.hardwareSubtotal',
                          'Subtotal Perangkat Keras'
                        )}
                        value={vm.hardwareSubtotal}
                      />
                      <PreviewAmountRow
                        label={t('kioskQueueForm.preview.hardwareTax', 'PPN 11% Perangkat')}
                        value={vm.hardwareTaxAmount}
                        muted
                      />
                      <PreviewAmountRow
                        label={t(
                          'kioskQueueForm.preview.hardwareTotal',
                          'Total Perangkat (Termasuk PPN)'
                        )}
                        value={vm.hardwareTotal}
                        strong
                      />
                    </>
                  )}

                  <Divider sx={{ my: 1 }} />

                  <PreviewAmountRow
                    label={t('kioskQueueForm.preview.paymentTarget', 'Target Total Pembayaran')}
                    value={vm.paymentTargetTotal}
                    strong
                  />

                  <PreviewAmountRow
                    label={t('kioskQueueForm.preview.paymentTotal', 'Total Termin Dijadwalkan')}
                    value={vm.paymentTotal}
                  />
                </>
              ) : (
                <>
                  <PreviewAmountRow
                    label={t('kioskQueueForm.preview.devSubtotal', 'Total Investasi Software')}
                    value={vm.serviceTotal}
                    strong
                  />

                  {vm.showMaintenance && (
                    <PreviewAmountRow
                      label={t('kioskQueueForm.preview.maintenanceTotal', 'Biaya Pemeliharaan')}
                      value={vm.maintenanceTotal}
                    />
                  )}

                  <Divider sx={{ my: 1 }} />

                  <PreviewAmountRow
                    label={t('kioskQueueForm.preview.paymentTarget', 'Target Pembayaran Software')}
                    value={vm.paymentTargetTotal}
                    strong
                  />

                  <PreviewAmountRow
                    label={t('kioskQueueForm.preview.paymentTotal', 'Total Termin Dijadwalkan')}
                    value={vm.paymentTotal}
                  />
                </>
              )}

              {/* Balance Alert */}
              <Alert severity={vm.isBalanced ? 'success' : 'error'} sx={{ mt: 1 }}>
                {vm.isBalanced
                  ? t('kioskQueueForm.payment.reconciled', 'Total pembayaran sesuai')
                  : t('kioskQueueForm.payment.mismatch', {
                      defaultValue: `Selisih pembayaran ${formatKioskQueueCurrency(Math.abs(vm.paymentDelta))}`,
                      delta: formatKioskQueueCurrency(Math.abs(vm.paymentDelta)),
                    })}
              </Alert>
            </Stack>
          </>
        )}
      </Stack>
    </Card>
  );
}
