import type { PublicQuotation } from '../types';

import { useState } from 'react';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { ErrorDialog } from 'src/shared/ui/error-dialog';

import { signPublicQuotation } from '../api';
import { getPublicQuotation } from '../utils/fallback';
import { formatDate, formatCurrency } from '../utils/format';
import { SignatureCanvas } from '../components/signature-canvas';
import { useQuotationPublic } from '../hooks/use-quotation-public';

const DEMO_TOKEN = 'demo-quotation-token';

export function QuotationPublicView() {
  const { t } = useTranslate('quotation');
  const { t: tCommon } = useTranslate('common');
  const { token = '' } = useParams();
  const { data: remoteQuotation, loading, error } = useQuotationPublic(token);
  const isDemo = token === DEMO_TOKEN;
  const quotation = remoteQuotation ?? (isDemo && error ? getPublicQuotation(token) : null);
  const [signature, setSignature] = useState<string | null>(null);
  const [signedQuotation, setSignedQuotation] = useState<PublicQuotation | null>(null);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  const displayedQuotation = signedQuotation ?? quotation;
  const revision = displayedQuotation?.revision;
  const isSigned = displayedQuotation?.status === 'signed' || !!revision?.signed_at;

  const handleApprove = async () => {
    if (!signature || signing) return;
    if (isDemo) {
      setSignedQuotation({ ...getPublicQuotation(token), status: 'signed' });
      return;
    }

    setSigning(true);
    setSignError(null);
    try {
      const result = await signPublicQuotation(token, { signature_image: signature });
      setSignedQuotation(result);
    } catch (reason: unknown) {
      setSignError(reason instanceof Error ? reason.message : t('public.signFailed'));
    } finally {
      setSigning(false);
    }
  };

  if (loading && !displayedQuotation) return <PublicLoading />;

  if (!displayedQuotation) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 5, md: 10 } }}>
        <Alert severity="error" icon={<Iconify icon="solar:danger-triangle-bold" />}>
          {error || t('public.notFound')}
        </Alert>
      </Container>
    );
  }

  return (
    <>
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
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={3}
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="overline" sx={{ opacity: 0.75 }}>
                    {t('title')}
                  </Typography>
                  <Typography variant="h3" sx={{ mt: 1, fontWeight: 700 }}>
                    {displayedQuotation.quotation_number}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: { sm: 'right' } }}>
                  <Typography variant="body2" sx={{ opacity: 0.75 }}>
                    {t('public.preparedFor')}
                  </Typography>
                  <Typography variant="h6">
                    {displayedQuotation.client_name || tCommon('state.emptyDash')}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.75 }}>
                    {t('public.quotationDate')}: {formatDate(displayedQuotation.created_at)}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Stack spacing={5} sx={{ p: { xs: 3, md: 6 } }}>
              {isDemo && (
                <Alert severity="info" icon={<Iconify icon="solar:info-circle-bold" />}>
                  {t('public.demoNotice')}
                </Alert>
              )}
              <Section title={t('public.projectOverview')}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {revision?.project_description || tCommon('state.emptyDash')}
                </Typography>
              </Section>
              <Section title={t('public.scope')}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {revision?.scope_of_work || tCommon('state.emptyDash')}
                </Typography>
              </Section>
              <Card
                variant="outlined"
                sx={{ p: { xs: 2.5, md: 3.5 }, bgcolor: 'background.neutral' }}
              >
                <Typography variant="overline" color="text.secondary">
                  {t('public.investment')}
                </Typography>
                <Typography variant="h3" sx={{ mt: 1, color: 'primary.main' }}>
                  {formatCurrency(revision?.budget ?? 0)}
                </Typography>
              </Card>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <InfoCard
                  title={t('public.maintenance')}
                  value={revision?.maintenance_info}
                  empty={tCommon('state.emptyDash')}
                />
                <InfoCard
                  title={t('public.hosting')}
                  value={revision?.hosting_info}
                  empty={tCommon('state.emptyDash')}
                />
              </Stack>
              <Section title={t('public.notes')}>
                <Typography variant="body2" color="text.secondary">
                  {revision?.notes || tCommon('state.emptyDash')}
                </Typography>
              </Section>
              <Divider />
              <Box>
                <Typography variant="h5" sx={{ mb: 1 }}>
                  {t('public.approval')}
                </Typography>
                {isSigned ? (
                  <Alert severity="success">{t('public.signatureSuccess')}</Alert>
                ) : (
                  <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      {t('public.signatureHint')}
                    </Typography>
                    <SignatureCanvas onChange={setSignature} disabled={signing} />
                    {!signature && (
                      <Typography variant="caption" color="error.main">
                        {t('public.signatureRequired')}
                      </Typography>
                    )}
                    <Button
                      variant="contained"
                      size="large"
                      disabled={!signature || signing}
                      loading={signing}
                      onClick={handleApprove}
                      startIcon={<Iconify icon="solar:check-circle-bold" />}
                    >
                      {t('buttons.submitSignature')}
                    </Button>
                  </Stack>
                )}
              </Box>
            </Stack>
          </Paper>
        </Container>
      </Box>
      <ErrorDialog
        open={!!signError}
        message={signError ?? ''}
        onClose={() => setSignError(null)}
      />
    </>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function InfoCard({
  title,
  value,
  empty,
}: {
  title: string;
  value?: string | null;
  empty: string;
}) {
  return (
    <Card variant="outlined" sx={{ flex: 1, p: 2.5 }}>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        {value || empty}
      </Typography>
    </Card>
  );
}
