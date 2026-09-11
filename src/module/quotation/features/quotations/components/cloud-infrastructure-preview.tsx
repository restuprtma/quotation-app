import type { CloudInfrastructurePreviewResponse } from '../types';

import { Card, Alert, Stack, Divider, CardHeader, Typography, CardContent } from '@mui/material';

import { useTranslate } from 'src/locales';

export function CloudInfrastructurePreview({
  data,
  isLoading,
  error,
  isStale,
}: {
  data?: CloudInfrastructurePreviewResponse;
  isLoading: boolean;
  error?: Error | null;
  isStale?: boolean;
}) {
  const { t } = useTranslate('quotation');
  const money = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n);
  return (
    <Card aria-live="polite">
      <CardHeader title={t('cloudInfrastructure.preview.title')} />
      <CardContent>
        {isLoading && <Typography>{t('cloudInfrastructure.preview.loading')}</Typography>}
        {error && <Alert severity="error">{error.message}</Alert>}
        {isStale && !isLoading && (
          <Alert severity="warning">{t('cloudInfrastructure.preview.stale')}</Alert>
        )}
        {data && (
          <Stack spacing={1}>
            {data.calculation.packages.map((p, i) => (
              <Stack direction="row" justifyContent="space-between" key={`${p.name}-${i}`}>
                <Typography>{p.name}</Typography>
                <Typography>{money(p.line_total)}</Typography>
              </Stack>
            ))}
            <Divider />
            <Typography>
              {t('cloudInfrastructure.preview.monthlySubtotal')}:{' '}
              {money(data.calculation.monthly_subtotal)}
            </Typography>
            {data.calculation.setup_subtotal > 0 && (
              <Typography>
                {t('cloudInfrastructure.preview.setupSubtotal')}:{' '}
                {money(data.calculation.setup_subtotal)}
              </Typography>
            )}
            <Typography>
              {t('cloudInfrastructure.preview.scheduledRecurringTotal')}:{' '}
              {money(data.calculation.scheduled_recurring_total)}
            </Typography>
            <Typography variant="caption">
              {t('cloudInfrastructure.scheduledRecurringExplanation')}
            </Typography>
            <Typography>
              {data.resolved_profile.sections.map((s) => `${s.number}. ${s.title}`).join(' · ')}
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
