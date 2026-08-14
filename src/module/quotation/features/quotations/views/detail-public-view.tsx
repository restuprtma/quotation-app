import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

import { getPublicDetail } from '../utils/fallback';
import { useDetailPublic } from '../hooks/use-detail-public';

const DEMO_TOKEN = 'demo-quotation-token';

export function DetailPublicView() {
  const { t } = useTranslate('quotation');
  const { t: tCommon } = useTranslate('common');
  const { token = '' } = useParams();
  const { data: remoteData, loading, error } = useDetailPublic(token);

  const isDemo = token === DEMO_TOKEN;
  const response = remoteData ?? (isDemo && error ? getPublicDetail(token) : null);

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

  const detailData = response.product_detail_data;
  const isProduct = detailData?.mode === 'product';

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
                  {t('detail.title')}
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
            {response.narrative_data?.introduction && (
              <Box>
                <Typography variant="h5" sx={{ mb: 1.5 }}>
                  {t('detail.introduction')}
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {response.narrative_data.introduction}
                </Typography>
              </Box>
            )}

            {isProduct ? (
              <Box>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  {t('detail.modules')}
                </Typography>
                <Stack spacing={2}>
                  {detailData?.modules?.map((mod, idx) => (
                    <Card key={idx} variant="outlined" sx={{ p: 2.5 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        {mod.name}
                      </Typography>
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        {mod.features.map((feat, fIdx) => (
                          <Typography component="li" variant="body2" key={fIdx}>
                            {feat}
                          </Typography>
                        ))}
                      </Box>
                    </Card>
                  ))}
                  {(!detailData?.modules || detailData.modules.length === 0) && (
                    <Typography variant="body2" color="text.secondary">
                      {tCommon('state.emptyDash')}
                    </Typography>
                  )}
                </Stack>
              </Box>
            ) : (
              <Box>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  {t('detail.goals')}
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 4 }}>
                  {detailData?.goals?.map((goal, idx) => (
                    <Typography component="li" variant="body1" key={idx} sx={{ mb: 1 }}>
                      {goal}
                    </Typography>
                  ))}
                </Box>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  {t('detail.deliverables')}
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  {detailData?.deliverables?.map((del, idx) => (
                    <Typography component="li" variant="body1" key={idx} sx={{ mb: 1 }}>
                      {del}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}
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
