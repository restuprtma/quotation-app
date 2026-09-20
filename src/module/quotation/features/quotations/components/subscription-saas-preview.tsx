import type {
  SubscriptionDocumentSection,
  SubscriptionPaymentRowInput,
  ResolvedSubscriptionSaaSProfile,
  SubscriptionSaaSPreviewResponse,
  SubscriptionPricePeriodCalculation,
} from '../types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function formatSubscriptionCurrency(value: number) {
  return currencyFormatter.format(Number(value) || 0);
}

export type SubscriptionPreviewViewModel = {
  recurringTotal: number;
  oneTimeTotal: number;
  totalContract: number;
  payments: SubscriptionPaymentRowInput[];
  pricePeriods: SubscriptionPricePeriodCalculation[];
  hasRightsSection: boolean;
  hasFeaturesSection: boolean;
  visibleSections: SubscriptionDocumentSection[];
  sectionTitles: string[];
  resolvedProfile: ResolvedSubscriptionSaaSProfile;
};

export function toSubscriptionPreviewViewModel(
  preview: SubscriptionSaaSPreviewResponse
): SubscriptionPreviewViewModel {
  const hasRightsSection = preview.visible_sections.some(
    (s) => s.code === 'rights' || s.title.toLowerCase().includes('hak para pihak')
  );
  const hasFeaturesSection = preview.visible_sections.some(
    (s) => s.code === 'features' || s.title.toLowerCase().includes('list features')
  );

  return {
    recurringTotal: preview.calculation.recurring_total,
    oneTimeTotal: preview.calculation.one_time_total,
    totalContract: preview.calculation.total_contract,
    payments: preview.calculation.payments,
    pricePeriods: preview.calculation.price_periods,
    hasRightsSection,
    hasFeaturesSection,
    visibleSections: preview.visible_sections,
    sectionTitles: preview.visible_sections.map((s) => s.title),
    resolvedProfile: preview.resolved_profile,
  };
}

export function toSubscriptionPreviewRows(preview: SubscriptionSaaSPreviewResponse) {
  return toSubscriptionPreviewViewModel(preview);
}

type Props = {
  preview?: SubscriptionSaaSPreviewResponse;
  isLoading?: boolean;
  isDebouncing?: boolean;
  error?: Error | null;
};

function Amount({ value, strong = false }: { value: number; strong?: boolean }) {
  return (
    <Typography variant="body2" fontWeight={strong ? 700 : 500} textAlign="right">
      {formatSubscriptionCurrency(value)}
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

export function SubscriptionSaaSPreview({
  preview,
  isLoading = false,
  isDebouncing = false,
  error = null,
}: Props) {
  const { t } = useTranslate('quotation');

  const vm = preview ? toSubscriptionPreviewViewModel(preview) : null;

  return (
    <Card variant="outlined" data-testid="subscription-saas-preview">
      <Stack spacing={2.5} sx={{ p: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {t('subscriptionSaaSForm.previewTitle')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('subscriptionSaaSForm.previewSubtitle')}
          </Typography>
        </Box>

        <Box aria-live="polite">
          {(isLoading || isDebouncing) && (
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {t('subscriptionSaaSForm.previewLoading')}
              </Typography>
            </Stack>
          )}

          {error && !isLoading && !isDebouncing && (
            <Alert severity="error">
              {error.message || t('subscriptionSaaSForm.previewError')}
            </Alert>
          )}
        </Box>

        {vm && !error && (
          <>
            {/* Effective Configuration */}
            <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                {t('subscriptionSaaSForm.preview.resolvedConfig')}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 1.5 }}>
                <Chip
                  size="small"
                  label={`Layout: ${
                    vm.resolvedProfile.section_layout === 'subscription_development'
                      ? 'Subscription & Development'
                      : 'Development & Maintenance'
                  }`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={`Siklus: ${vm.resolvedProfile.billing_cycle}`}
                  variant="outlined"
                />
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
                />
                <Chip
                  size="small"
                  label={
                    vm.resolvedProfile.rights_clause_code
                      ? 'Hak Cipta: Milik Venturo'
                      : 'Hak Cipta: Tidak Dicantumkan'
                  }
                  color={vm.resolvedProfile.rights_clause_code ? 'info' : 'default'}
                  variant="outlined"
                />
                {vm.resolvedProfile.income_sharing_text && (
                  <Chip
                    size="small"
                    label="Kemitraan (Bagi Hasil)"
                    color="success"
                    variant="outlined"
                  />
                )}
              </Stack>

              {vm.resolvedProfile.rights_clause_text && (
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Klausul Hak Cipta:</strong> {vm.resolvedProfile.rights_clause_text}
                </Typography>
              )}
              {vm.resolvedProfile.income_sharing_text && (
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Bagi Hasil:</strong> {vm.resolvedProfile.income_sharing_text}
                </Typography>
              )}
              {vm.resolvedProfile.auto_renewal_text && (
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Perpanjangan:</strong> {vm.resolvedProfile.auto_renewal_text}
                </Typography>
              )}

              <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 1 }}>
                {t('subscriptionSaaSForm.preview.sections')}{' '}
                {vm.visibleSections.map((s) => `${s.number}. ${s.title}`).join(' · ')}
              </Typography>
            </Box>

            {/* Price Calculations */}
            <Stack spacing={1}>
              <PreviewAmountRow
                label={t('subscriptionSaaSForm.preview.recurringTotal')}
                value={vm.recurringTotal}
              />
              {vm.oneTimeTotal > 0 && (
                <PreviewAmountRow
                  label={t('subscriptionSaaSForm.preview.oneTimeTotal')}
                  value={vm.oneTimeTotal}
                />
              )}
              <Divider sx={{ my: 0.5 }} />
              <PreviewAmountRow
                label={t('subscriptionSaaSForm.preview.totalContract')}
                value={vm.totalContract}
                strong
              />
            </Stack>

            {/* Payments Table */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                {t('subscriptionSaaSForm.preview.payments')}
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('subscriptionSaaSForm.payment.workPeriod')}</TableCell>
                      <TableCell align="center">
                        {t('subscriptionSaaSForm.payment.coveredMonths')}
                      </TableCell>
                      <TableCell>{t('subscriptionSaaSForm.payment.invoiceDate')}</TableCell>
                      <TableCell>{t('subscriptionSaaSForm.payment.dueDate')}</TableCell>
                      <TableCell align="right">
                        {t('subscriptionSaaSForm.payment.nominal')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vm.payments.map((row, index) => (
                      <TableRow key={`${row.work_period}-${index}`}>
                        <TableCell>{row.work_period}</TableCell>
                        <TableCell align="center">{row.covered_months} bln</TableCell>
                        <TableCell>{row.invoice_date_label || '-'}</TableCell>
                        <TableCell>{row.due_date_label || '-'}</TableCell>
                        <TableCell align="right">
                          <Amount value={row.nominal} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </>
        )}
      </Stack>
    </Card>
  );
}
