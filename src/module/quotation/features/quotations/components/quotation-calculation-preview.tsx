import type { DedicatedSquadPreviewResponse } from '../types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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

export function formatDedicatedSquadCurrency(value: number) {
  return currencyFormatter.format(Number(value) || 0);
}

type Props = {
  preview?: DedicatedSquadPreviewResponse;
  isLoading?: boolean;
  isDebouncing?: boolean;
  error?: Error | null;
};

function Amount({ value, strong = false }: { value: number; strong?: boolean }) {
  return (
    <Typography variant="body2" fontWeight={strong ? 700 : 500} textAlign="right">
      {formatDedicatedSquadCurrency(value)}
    </Typography>
  );
}

export function QuotationCalculationPreview({
  preview,
  isLoading = false,
  isDebouncing = false,
  error = null,
}: Props) {
  const { t } = useTranslate('quotation');

  return (
    <Card variant="outlined" data-testid="quotation-calculation-preview">
      <Stack spacing={2} sx={{ p: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {t('dedicatedSquadForm.preview.title')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('dedicatedSquadForm.preview.subtitle')}
          </Typography>
        </Box>

        {(isLoading || isDebouncing) && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              {t('dedicatedSquadForm.preview.calculating')}
            </Typography>
          </Stack>
        )}

        {error && !isLoading && !isDebouncing && (
          <Alert severity="error">{error.message || t('dedicatedSquadForm.preview.error')}</Alert>
        )}

        {preview && !error && (
          <>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Konfigurasi efektif</Typography>
              <Typography variant="body2" color="text.secondary">
                Persiapan: {preview.resolved_profile.preparation_kind || preview.resolved_profile.preparation_mode || 'preset'}
                {' · '}Maintenance: {preview.resolved_profile.maintenance_mode || 'preset'}
                {' · '}Timeline: {preview.resolved_profile.scope_timeline_mode || 'preset'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Prefix: {preview.resolved_profile.document_options?.letter_prefix || 'CTH'}
                {' · '}Pajak: {preview.resolved_profile.document_options?.tax_treatment || 'exclusive_ppn'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Seksi: {preview.visible_sections.map((section) => `${section.number}. ${section.title}`).join(' · ')}
              </Typography>
            </Box>
            <Stack spacing={1}>
              <PreviewAmountRow
                label={t('dedicatedSquadForm.preview.grossPreparation')}
                value={preview.calculation.preparation.gross}
              />
              <PreviewAmountRow
                label={t('dedicatedSquadForm.preview.preparationDiscount')}
                value={-preview.calculation.preparation.discount}
                muted
              />
              <PreviewAmountRow
                label={t('dedicatedSquadForm.preview.development')}
                value={preview.calculation.development_subtotal}
              />
              {preview.calculation.maintenance_subtotal > 0 && (
                <PreviewAmountRow
                  label={t('dedicatedSquadForm.preview.maintenance')}
                  value={preview.calculation.maintenance_subtotal}
                />
              )}
              <Divider sx={{ my: 0.5 }} />
              <PreviewAmountRow
                label={t('dedicatedSquadForm.preview.totalInvestment')}
                value={preview.calculation.total_investment}
                strong
              />
            </Stack>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('dedicatedSquadForm.preview.payments')}
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('dedicatedSquadForm.preview.workPeriod')}</TableCell>
                      <TableCell>{t('dedicatedSquadForm.preview.terms')}</TableCell>
                      <TableCell>{t('dedicatedSquadForm.preview.invoiceDate')}</TableCell>
                      <TableCell>{t('dedicatedSquadForm.preview.dueDate')}</TableCell>
                      <TableCell align="right">{t('dedicatedSquadForm.preview.nominal')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.calculation.payments.map((payment, index) => (
                      <TableRow key={`${payment.invoice_date}-${index}`}>
                        <TableCell>{payment.work_period}</TableCell>
                        <TableCell>{payment.terms}</TableCell>
                        <TableCell>{formatDate(payment.invoice_date)}</TableCell>
                        <TableCell>{formatDate(payment.due_date)}</TableCell>
                        <TableCell align="right">
                          <Amount value={payment.nominal} />
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
