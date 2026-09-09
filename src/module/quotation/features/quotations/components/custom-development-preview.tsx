import type { CustomDevelopmentDraftTotals } from '../constants/custom-development';
import type {
  CustomDevelopmentSectionConfig,
  ResolvedCustomDevelopmentProfile,
  CustomDevelopmentPreviewResponse,
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

export function formatCustomDevelopmentCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '-';
  }
  return currencyFormatter.format(Number(value) || 0);
}

export type CustomDevelopmentPreviewViewModel = {
  developmentSubtotal: number;
  discountAmount: number;
  totalInvestment: number;
  monthlyTotal: number;
  developmentPaymentTotal: number;
  monthlyPaymentRows: number;
  developmentDelta: number;
  isBalanced: boolean;
  developmentLines: Array<{
    group_index: number;
    item_index: number;
    name: string;
    display_rate: number | null;
    headcount: number;
    period_label: string;
    quoted_line_total: number | null;
  }>;
  monthlyLines: Array<{
    name: string;
    specification: string;
    unit_rate: number;
    quantity: number;
    line_total: number;
  }>;
  showMonthly: boolean;
  showRights: boolean;
  visibleSections: CustomDevelopmentSectionConfig[];
  sectionTitles: string[];
  resolvedProfile: ResolvedCustomDevelopmentProfile;
  rateHeader: string;
  periodHeader: string;
  showRateColumn: boolean;
  taxDisclaimer: string;
};

export function toCustomDevelopmentPreviewViewModel(
  preview: CustomDevelopmentPreviewResponse
): CustomDevelopmentPreviewViewModel {
  const { calculation, resolved_profile } = preview;
  const developmentDelta = calculation.total_investment - calculation.development_payment_total;
  const isBalanced = developmentDelta === 0;

  return {
    developmentSubtotal: calculation.development_subtotal,
    discountAmount: calculation.discount_amount,
    totalInvestment: calculation.total_investment,
    monthlyTotal: calculation.monthly_total,
    developmentPaymentTotal: calculation.development_payment_total,
    monthlyPaymentRows: calculation.monthly_payment_rows,
    developmentDelta,
    isBalanced,
    developmentLines: calculation.development_lines || [],
    monthlyLines: calculation.monthly_lines || [],
    showMonthly: resolved_profile.show_monthly,
    showRights: resolved_profile.show_rights,
    visibleSections: resolved_profile.sections || [],
    sectionTitles: (resolved_profile.sections || []).map((s) => s.title),
    resolvedProfile: resolved_profile,
    rateHeader: resolved_profile.rate_header,
    periodHeader: resolved_profile.period_header,
    showRateColumn: resolved_profile.show_rate_column,
    taxDisclaimer: resolved_profile.tax_disclaimer,
  };
}

export function toCustomDevelopmentPreviewRows(preview: CustomDevelopmentPreviewResponse) {
  return toCustomDevelopmentPreviewViewModel(preview);
}

export function isCustomDevelopmentSubmitReady(params: {
  isValid: boolean;
  isDebouncing: boolean;
  isFetching: boolean;
  error: any;
  preview: CustomDevelopmentPreviewResponse | undefined;
  draftTotals: CustomDevelopmentDraftTotals | null;
}): boolean {
  if (!params.isValid) return false;
  if (params.isDebouncing || params.isFetching || Boolean(params.error)) return false;
  if (!params.preview || !params.draftTotals) return false;

  const { calculation } = params.preview;

  if (calculation.development_subtotal !== params.draftTotals.development_subtotal) return false;
  if (calculation.discount_amount !== params.draftTotals.discount_amount) return false;
  if (calculation.total_investment !== params.draftTotals.total_investment) return false;
  if (calculation.monthly_total !== params.draftTotals.monthly_total) return false;
  if (calculation.development_payment_total !== params.draftTotals.development_payment_total) {
    return false;
  }

  // Development payment total must equal total investment
  if (calculation.development_payment_total !== calculation.total_investment) return false;
  if (params.draftTotals.development_delta !== 0) return false;
  if (!params.draftTotals.monthly_rows_valid) return false;
  if (!params.draftTotals.is_balanced) return false;

  return true;
}

type Props = {
  preview?: CustomDevelopmentPreviewResponse;
  isLoading?: boolean;
  isDebouncing?: boolean;
  error?: Error | null;
  moduleCount?: number;
  timelineCount?: number;
};

function Amount({ value, strong = false }: { value: number; strong?: boolean }) {
  return (
    <Typography variant="body2" fontWeight={strong ? 700 : 500} textAlign="right">
      {formatCustomDevelopmentCurrency(value)}
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

export function CustomDevelopmentPreview({
  preview,
  isLoading = false,
  isDebouncing = false,
  error = null,
  moduleCount,
  timelineCount,
}: Props) {
  const { t } = useTranslate('quotation');

  const vm = preview ? toCustomDevelopmentPreviewViewModel(preview) : null;

  return (
    <Card variant="outlined" data-testid="custom-development-preview">
      <Stack spacing={2.5} sx={{ p: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {t('customDevelopmentForm.previewTitle')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('customDevelopmentForm.previewSubtitle')}
          </Typography>
        </Box>

        <Box aria-live="polite">
          {(isLoading || isDebouncing) && (
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {t('customDevelopmentForm.previewLoading')}
              </Typography>
            </Stack>
          )}

          {error && !isLoading && !isDebouncing && (
            <Alert severity="error">
              {error.message || t('customDevelopmentForm.previewError')}
            </Alert>
          )}
        </Box>

        {vm && !error && (
          <>
            {/* Configuration Badges */}
            <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                {t('customDevelopmentForm.preview.resolvedConfig')}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 1.5 }}>
                <Chip
                  size="small"
                  label={
                    vm.showMonthly
                      ? t('customDevelopmentForm.monthly.enableSwitch')
                      : 'Biaya Bulanan: Tidak Ada'
                  }
                  color={vm.showMonthly ? 'info' : 'default'}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={
                    vm.showRights
                      ? t('customDevelopmentForm.preview.rightsActive')
                      : t('customDevelopmentForm.preview.rightsInactive')
                  }
                  color={vm.showRights ? 'success' : 'default'}
                  variant="outlined"
                />
                {typeof moduleCount === 'number' && (
                  <Chip size="small" label={`${moduleCount} Kelompok Modul`} variant="outlined" />
                )}
                {typeof timelineCount === 'number' && (
                  <Chip size="small" label={`${timelineCount} Baris Timeline`} variant="outlined" />
                )}
              </Stack>

              {vm.taxDisclaimer && (
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>{t('customDevelopmentForm.preview.taxDisclaimer')}</strong>{' '}
                  {vm.taxDisclaimer}
                </Typography>
              )}

              <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 1 }}>
                {t('customDevelopmentForm.preview.sections')}{' '}
                {vm.visibleSections.map((s) => `${s.number}. ${s.title}`).join(' · ')}
              </Typography>
            </Box>

            {/* Development Cost Lines */}
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t('customDevelopmentForm.preview.lineTotals')}
              </Typography>

              {vm.developmentLines.map((line, idx) => {
                const lineTotalFormatted =
                  line.quoted_line_total !== null
                    ? formatCustomDevelopmentCurrency(line.quoted_line_total)
                    : t('customDevelopmentForm.cost.includedResource');

                const ratePart =
                  vm.showRateColumn && line.display_rate !== null
                    ? ` · @${formatCustomDevelopmentCurrency(line.display_rate)}`
                    : '';

                return (
                  <Stack
                    key={`${line.name}-${idx}`}
                    direction="row"
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {line.name} ({line.headcount} {t('customDevelopmentForm.preview.headcount')},{' '}
                      {line.period_label}
                      {ratePart})
                    </Typography>
                    <Typography variant="body2" fontWeight={500} textAlign="right">
                      {lineTotalFormatted}
                    </Typography>
                  </Stack>
                );
              })}

              <Divider sx={{ my: 0.5 }} />

              <PreviewAmountRow
                label={t('customDevelopmentForm.preview.subtotal')}
                value={vm.developmentSubtotal}
              />

              {vm.discountAmount > 0 && (
                <PreviewAmountRow
                  label={t('customDevelopmentForm.preview.discount')}
                  value={vm.discountAmount}
                  muted
                />
              )}

              <PreviewAmountRow
                label={t('customDevelopmentForm.preview.totalInvestment')}
                value={vm.totalInvestment}
                strong
              />
            </Stack>

            {/* Monthly Operational Cost Lines (if enabled) */}
            {vm.showMonthly && vm.monthlyLines.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t('customDevelopmentForm.preview.monthlyLineTotals')}
                  </Typography>

                  {vm.monthlyLines.map((mLine, mIdx) => (
                    <Stack
                      key={`${mLine.name}-${mIdx}`}
                      direction="row"
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {mLine.name} ({mLine.quantity}x @
                        {formatCustomDevelopmentCurrency(mLine.unit_rate)})
                      </Typography>
                      <Amount value={mLine.line_total} />
                    </Stack>
                  ))}

                  <Divider sx={{ my: 0.5 }} />

                  <PreviewAmountRow
                    label={t('customDevelopmentForm.preview.monthlyTotal')}
                    value={vm.monthlyTotal}
                    strong
                  />
                </Stack>
              </>
            )}

            {/* Payment Schedule Status */}
            <Divider sx={{ my: 1 }} />
            <Stack spacing={1}>
              <PreviewAmountRow
                label={t('customDevelopmentForm.preview.paymentTotal')}
                value={vm.developmentPaymentTotal}
              />

              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={vm.isBalanced ? 'success.main' : 'error.main'}
                >
                  {t('customDevelopmentForm.preview.paymentDelta')}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color={vm.isBalanced ? 'success.main' : 'error.main'}
                >
                  {formatCustomDevelopmentCurrency(vm.developmentDelta)}
                </Typography>
              </Stack>
            </Stack>
          </>
        )}
      </Stack>
    </Card>
  );
}
