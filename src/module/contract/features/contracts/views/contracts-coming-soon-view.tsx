import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { PageHeader } from 'src/shared/ui/page-header';
import { DashboardContent } from 'src/layouts/dashboard';

export function ContractsComingSoonView() {
  const { t } = useTranslate('contract');

  return (
    <DashboardContent maxWidth="md">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <Card sx={{ p: { xs: 3, md: 6 }, textAlign: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <Iconify icon="solar:file-bold-duotone" width={64} sx={{ color: 'primary.main' }} />
          <Typography variant="h4">{t('status')}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520 }}>
            {t('description')}
          </Typography>
          <Button component={RouterLink} href={paths.dashboard.quotation.root} variant="contained" startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}>
            {t('backToQuotation')}
          </Button>
        </Stack>
      </Card>
    </DashboardContent>
  );
}
