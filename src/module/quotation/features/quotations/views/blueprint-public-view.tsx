import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

import { getPublicBlueprint } from '../utils/fallback';
import { useBlueprintPublic } from '../hooks/use-blueprint-public';
import { BlueprintRenderer } from '../components/blueprint-renderer';

const DEMO_TOKEN = 'demo-quotation-token';

export function BlueprintPublicView() {
  const { t } = useTranslate('quotation');
  const { t: tCommon } = useTranslate('common');
  const { token = '' } = useParams();
  const { data: remoteData, loading, error } = useBlueprintPublic(token);

  const isDemo = token === DEMO_TOKEN;
  const response = remoteData ?? (isDemo && error ? getPublicBlueprint(token) : null);

  if (loading && !response) return <PublicLoading />;

  if (!response) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 5, md: 10 } }}>
        <Alert severity="error" icon={<Iconify icon="solar:danger-triangle-bold" />}>
          {error || t('public.notFound')}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ py: { xs: 2, md: 6 } }}>
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          }}
        >
          <Box
            sx={{ p: { xs: 3, md: 6 }, bgcolor: 'primary.darker', color: 'primary.contrastText' }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="space-between">
              <Box>
                <Typography variant="overline" sx={{ opacity: 0.75 }}>
                  {t('blueprint.title')}
                </Typography>
                <Typography variant="h3" sx={{ mt: 1, fontWeight: 700 }}>
                  {response.quotation_number}
                </Typography>
              </Box>
              <Box sx={{ textAlign: { sm: 'right' } }}>
                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                  {t('public.preparedFor')}
                </Typography>
                <Typography variant="h6">
                  {response.client_name || tCommon('state.emptyDash')}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Stack spacing={5} sx={{ p: { xs: 3, md: 6 } }}>
            <Box>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {response.blueprint_data?.title || t('blueprint.title')}
              </Typography>
              <BlueprintRenderer blueprint={response.blueprint_data} />
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

function PublicLoading() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 7 } }}>
      <Paper sx={{ p: { xs: 3, md: 6 } }}>
        <Stack spacing={2}>
          <Skeleton height={80} />
          <Skeleton height={40} />
          <Skeleton height={180} />
          <Skeleton height={240} />
        </Stack>
      </Paper>
    </Container>
  );
}
