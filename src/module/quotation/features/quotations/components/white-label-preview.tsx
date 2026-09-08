import type {
  WhiteLabelDocumentSection,
  WhiteLabelPreviewResponse,
  ResolvedWhiteLabelProfile,
  WhiteLabelHostingLineCalculation,
  WhiteLabelLicenseLineCalculation,
  WhiteLabelMaintenanceLineCalculation,
} from '../types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
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

export function formatWhiteLabelCurrency(value: number) {
  return currencyFormatter.format(Number(value) || 0);
}

export type WhiteLabelPreviewViewModel = {
  licenseSubtotal: number;
  maintenanceSubtotal: number;
  hostingSubtotal: number;
  maintenanceHostingSubtotal: number;
  totalInvestment: number;
  licensePaymentTotal: number;
  maintenanceHostingPaymentTotal: number;
  paymentTotal: number;
  licenseItems: WhiteLabelLicenseLineCalculation[];
  maintenanceItems: WhiteLabelMaintenanceLineCalculation[];
  hostingItems: WhiteLabelHostingLineCalculation[];
  showMaintenanceHosting: boolean;
  showScopeTimeline: boolean;
  showRights: boolean;
  visibleSections: WhiteLabelDocumentSection[];
  sectionTitles: string[];
  resolvedProfile: ResolvedWhiteLabelProfile;
};

export function toWhiteLabelPreviewViewModel(
  preview: WhiteLabelPreviewResponse
): WhiteLabelPreviewViewModel {
  return {
    licenseSubtotal: preview.calculation.license_subtotal,
    maintenanceSubtotal: preview.calculation.maintenance_subtotal,
    hostingSubtotal: preview.calculation.hosting_subtotal,
    maintenanceHostingSubtotal: preview.calculation.maintenance_hosting_subtotal,
    totalInvestment: preview.calculation.total_investment,
    licensePaymentTotal: preview.calculation.license_payment_total,
    maintenanceHostingPaymentTotal: preview.calculation.maintenance_hosting_payment_total,
    paymentTotal: preview.calculation.payment_total,
    licenseItems: preview.calculation.license || [],
    maintenanceItems: preview.calculation.maintenance || [],
    hostingItems: preview.calculation.hosting || [],
    showMaintenanceHosting: preview.resolved_profile.show_maintenance_hosting,
    showScopeTimeline: preview.resolved_profile.show_scope_timeline,
    showRights: preview.resolved_profile.show_rights,
    visibleSections: preview.resolved_profile.sections || [],
    sectionTitles: (preview.resolved_profile.sections || []).map((s) => s.title),
    resolvedProfile: preview.resolved_profile,
  };
}

export function toWhiteLabelPreviewRows(preview: WhiteLabelPreviewResponse) {
  return toWhiteLabelPreviewViewModel(preview);
}

type Props = {
  preview?: WhiteLabelPreviewResponse;
  isLoading?: boolean;
  isDebouncing?: boolean;
  error?: Error | null;
};

function Amount({ value, strong = false }: { value: number; strong?: boolean }) {
  return (
    <Typography variant="body2" fontWeight={strong ? 700 : 500} textAlign="right">
      {formatWhiteLabelCurrency(value)}
    </Typography>
  );
}

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
      <Amount value={value} strong={strong} />
    </Stack>
  );
}

export function WhiteLabelPreview({
  preview,
  isLoading = false,
  isDebouncing = false,
  error = null,
}: Props) {
  const { t } = useTranslate('quotation');

  const vm = preview ? toWhiteLabelPreviewViewModel(preview) : null;

  return (
    <Card variant="outlined" data-testid="white-label-preview">
      <Stack spacing={2.5} sx={{ p: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {t('whiteLabelForm.previewTitle')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('whiteLabelForm.previewSubtitle')}
          </Typography>
        </Box>

        <Box aria-live="polite">
          {(isLoading || isDebouncing) && (
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {t('whiteLabelForm.previewLoading')}
              </Typography>
            </Stack>
          )}

          {error && !isLoading && !isDebouncing && (
            <Alert severity="error">{error.message || t('whiteLabelForm.previewError')}</Alert>
          )}
        </Box>

        {vm && !error && (
          <>
            {/* Effective Configuration */}
            <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                {t('whiteLabelForm.preview.resolvedConfig')}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 1.5 }}>
                <Chip
                  size="small"
                  label={`Pajak: ${
                    vm.resolvedProfile.tax_treatment === 'exclusive_ppn'
                      ? 'Belum PPN'
                      : vm.resolvedProfile.tax_treatment === 'inclusive_ppn'
                        ? 'Sudah PPN'
                        : 'Tidak Dicantumkan'
                  }`}
                  variant="outlined"
                  color={vm.resolvedProfile.tax_treatment !== 'not_stated' ? 'info' : 'default'}
                />
                <Chip
                  size="small"
                  label={`Maintenance & Hosting: ${
                    vm.showMaintenanceHosting ? 'Aktif' : 'Tidak Ada'
                  }`}
                  color={vm.showMaintenanceHosting ? 'primary' : 'default'}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={`Modul & Timeline: ${vm.showScopeTimeline ? 'Aktif' : 'Tidak Ada'}`}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={vm.showRights ? 'Hak Lisensi: Dicantumkan' : 'Hak Lisensi: Default'}
                  color={vm.showRights ? 'success' : 'default'}
                  variant="outlined"
                />
              </Stack>

              {vm.resolvedProfile.tax_clause_text && (
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>{t('whiteLabelForm.preview.taxClause')}</strong>{' '}
                  {vm.resolvedProfile.tax_clause_text}
                </Typography>
              )}

              <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 1 }}>
                {t('whiteLabelForm.preview.sections')}{' '}
                {vm.visibleSections.map((s) => `${s.number}. ${s.title}`).join(' · ')}
              </Typography>
            </Box>

            {/* Price Calculations */}
            <Stack spacing={1}>
              <PreviewAmountRow
                label={t('whiteLabelForm.preview.licenseSubtotal')}
                value={vm.licenseSubtotal}
              />
              {vm.showMaintenanceHosting && (
                <>
                  {vm.maintenanceSubtotal > 0 && (
                    <PreviewAmountRow
                      label={t('whiteLabelForm.preview.maintenanceSubtotal')}
                      value={vm.maintenanceSubtotal}
                      muted
                    />
                  )}
                  {vm.hostingSubtotal > 0 && (
                    <PreviewAmountRow
                      label={t('whiteLabelForm.preview.hostingSubtotal')}
                      value={vm.hostingSubtotal}
                      muted
                    />
                  )}
                  <PreviewAmountRow
                    label={t('whiteLabelForm.preview.maintenanceHostingSubtotal')}
                    value={vm.maintenanceHostingSubtotal}
                  />
                </>
              )}
              <Divider sx={{ my: 0.5 }} />
              <PreviewAmountRow
                label={t('whiteLabelForm.preview.totalInvestment')}
                value={vm.totalInvestment}
                strong
              />
            </Stack>
          </>
        )}
      </Stack>
    </Card>
  );
}
