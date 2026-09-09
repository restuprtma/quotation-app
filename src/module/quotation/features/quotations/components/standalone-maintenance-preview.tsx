import type {
  HourlyLineCalculation,
  RetainerLineCalculation,
  ResolvedStandaloneMaintenanceProfile,
  StandaloneMaintenancePreviewResponse,
  StandaloneMaintenanceDocumentSection,
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

import { formatHalfHours } from '../constants/standalone-maintenance';

// ----------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function formatStandaloneMaintenanceCurrency(value: number) {
  return currencyFormatter.format(Number(value) || 0);
}

export type StandaloneMaintenancePreviewViewModel = {
  mode: 'retainer' | 'hourly_task';
  subtotal: number;
  discountAmount: number;
  totalInvestment: number;
  paymentTotal: number;
  paymentDelta: number;
  isBalanced: boolean;
  retainerItems: RetainerLineCalculation[];
  hourlyItems: HourlyLineCalculation[];
  showDiscountRow: boolean;
  showRights: boolean;
  visibleSections: StandaloneMaintenanceDocumentSection[];
  sectionTitles: string[];
  resolvedProfile: ResolvedStandaloneMaintenanceProfile;
};

export function toStandaloneMaintenancePreviewViewModel(
  preview: StandaloneMaintenancePreviewResponse
): StandaloneMaintenancePreviewViewModel {
  const isRetainer = preview.calculation.mode === 'retainer';
  const paymentDelta = preview.calculation.total_investment - preview.calculation.payment_total;

  return {
    mode: preview.calculation.mode,
    subtotal: preview.calculation.subtotal,
    discountAmount: preview.calculation.discount_amount,
    totalInvestment: preview.calculation.total_investment,
    paymentTotal: preview.calculation.payment_total,
    paymentDelta,
    isBalanced: paymentDelta === 0,
    retainerItems: isRetainer ? preview.calculation.retainer || [] : [],
    hourlyItems: !isRetainer ? preview.calculation.hourly || [] : [],
    showDiscountRow: preview.resolved_profile.show_discount_row,
    showRights: preview.resolved_profile.show_rights,
    visibleSections: preview.resolved_profile.sections || [],
    sectionTitles: (preview.resolved_profile.sections || []).map((s) => s.title),
    resolvedProfile: preview.resolved_profile,
  };
}

export function toStandaloneMaintenancePreviewRows(preview: StandaloneMaintenancePreviewResponse) {
  return toStandaloneMaintenancePreviewViewModel(preview);
}

type Props = {
  preview?: StandaloneMaintenancePreviewResponse;
  isLoading?: boolean;
  isDebouncing?: boolean;
  error?: Error | null;
  defectCount?: number;
  taskCount?: number;
};

function Amount({ value, strong = false }: { value: number; strong?: boolean }) {
  return (
    <Typography variant="body2" fontWeight={strong ? 700 : 500} textAlign="right">
      {formatStandaloneMaintenanceCurrency(value)}
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

export function StandaloneMaintenancePreview({
  preview,
  isLoading = false,
  isDebouncing = false,
  error = null,
  defectCount,
  taskCount,
}: Props) {
  const { t } = useTranslate('quotation');

  const vm = preview ? toStandaloneMaintenancePreviewViewModel(preview) : null;

  return (
    <Card variant="outlined" data-testid="standalone-maintenance-preview">
      <Stack spacing={2.5} sx={{ p: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {t('standaloneMaintenanceForm.previewTitle')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('standaloneMaintenanceForm.previewSubtitle')}
          </Typography>
        </Box>

        <Box aria-live="polite">
          {(isLoading || isDebouncing) && (
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {t('standaloneMaintenanceForm.previewLoading')}
              </Typography>
            </Stack>
          )}

          {error && !isLoading && !isDebouncing && (
            <Alert severity="error">
              {error.message || t('standaloneMaintenanceForm.previewError')}
            </Alert>
          )}
        </Box>

        {vm && !error && (
          <>
            {/* Effective Configuration */}
            <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                {t('standaloneMaintenanceForm.preview.resolvedConfig')}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 1.5 }}>
                <Chip
                  size="small"
                  label={
                    vm.mode === 'retainer'
                      ? t('standaloneMaintenanceForm.preview.modeRetainer')
                      : t('standaloneMaintenanceForm.preview.modeHourly')
                  }
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={
                    vm.resolvedProfile.tax_treatment === 'exclusive_ppn'
                      ? t('standaloneMaintenanceForm.preview.taxExclusive')
                      : vm.resolvedProfile.tax_treatment === 'inclusive_ppn'
                        ? t('standaloneMaintenanceForm.preview.taxInclusive')
                        : t('standaloneMaintenanceForm.preview.taxNotStated')
                  }
                  variant="outlined"
                  color={vm.resolvedProfile.tax_treatment !== 'not_stated' ? 'info' : 'default'}
                />
                {vm.mode === 'retainer' && typeof defectCount === 'number' && (
                  <Chip
                    size="small"
                    label={t('standaloneMaintenanceForm.preview.defectsCount', {
                      count: defectCount,
                    })}
                    variant="outlined"
                  />
                )}
                {vm.mode === 'hourly_task' && typeof taskCount === 'number' && (
                  <Chip
                    size="small"
                    label={t('standaloneMaintenanceForm.preview.tasksCount', { count: taskCount })}
                    variant="outlined"
                  />
                )}
                <Chip
                  size="small"
                  label={
                    vm.showRights
                      ? t('standaloneMaintenanceForm.preview.rightsActive')
                      : t('standaloneMaintenanceForm.preview.rightsInactive')
                  }
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
                  <strong>{t('standaloneMaintenanceForm.preview.taxClause')}</strong>{' '}
                  {vm.resolvedProfile.tax_clause_text}
                </Typography>
              )}

              <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 1 }}>
                {t('standaloneMaintenanceForm.preview.sections')}{' '}
                {vm.visibleSections.map((s) => `${s.number}. ${s.title}`).join(' · ')}
              </Typography>
            </Box>

            {/* Price Calculations */}
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t('standaloneMaintenanceForm.preview.lineTotals')}
              </Typography>

              {vm.mode === 'retainer' &&
                vm.retainerItems.map((item, idx) => (
                  <PreviewAmountRow
                    key={`${item.name}-${idx}`}
                    label={`${item.name} (${item.fte_quarters / 4} FTE, ${item.period_months} ${t('standaloneMaintenanceForm.preview.unitMonth')})`}
                    value={item.line_total}
                    muted
                  />
                ))}

              {vm.mode === 'hourly_task' &&
                vm.hourlyItems.map((item, idx) => (
                  <PreviewAmountRow
                    key={`${item.name}-${idx}`}
                    label={`${item.name} (${item.headcount} ${t('standaloneMaintenanceForm.preview.unitPerson')}, ${formatHalfHours(item.hours_half_units)} ${t('standaloneMaintenanceForm.preview.unitHour')})`}
                    value={item.line_total}
                    muted
                  />
                ))}

              <Divider sx={{ my: 0.5 }} />

              <PreviewAmountRow
                label={t('standaloneMaintenanceForm.preview.subtotal')}
                value={vm.subtotal}
              />

              {vm.showDiscountRow && vm.discountAmount > 0 && (
                <PreviewAmountRow
                  label={t('standaloneMaintenanceForm.preview.discount')}
                  value={vm.discountAmount}
                  muted
                />
              )}

              <PreviewAmountRow
                label={t('standaloneMaintenanceForm.preview.totalInvestment')}
                value={vm.totalInvestment}
                strong
              />

              <Divider sx={{ my: 0.5 }} />

              <PreviewAmountRow
                label={t('standaloneMaintenanceForm.preview.paymentTotal')}
                value={vm.paymentTotal}
              />

              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={vm.isBalanced ? 'success.main' : 'error.main'}
                >
                  {t('standaloneMaintenanceForm.preview.paymentDelta')}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color={vm.isBalanced ? 'success.main' : 'error.main'}
                >
                  {formatStandaloneMaintenanceCurrency(vm.paymentDelta)}
                </Typography>
              </Stack>
            </Stack>
          </>
        )}
      </Stack>
    </Card>
  );
}
