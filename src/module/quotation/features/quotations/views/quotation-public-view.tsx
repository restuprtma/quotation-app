import type { SignPublicQuotationPayload } from '../types/public';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { fDateTime } from 'src/shared/utils/format-time';

import { SignatureForm } from '../components/signature-form';
import { DocumentCanvas } from '../components/document-canvas';
import { usePublicQuotation, useSignPublicQuotation } from '../hooks/use-quotation-public';

export function QuotationPublicView({ token }: { token: string }) {
  const { t } = useTranslate('quotation');
  const { data: quotation, isLoading, isError } = usePublicQuotation(token);
  const signMutation = useSignPublicQuotation(token);

  // 1. Loading State
  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }} data-testid="quotation-public-loading">
        <Stack spacing={3}>
          <Skeleton variant="rounded" height={60} />
          <Skeleton variant="rounded" height={520} />
        </Stack>
      </Container>
    );
  }

  // 2. Invalid / Not Found State
  if (isError || !quotation) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Iconify
            icon="solar:shield-warning-bold-duotone"
            width={64}
            sx={{ color: 'warning.main', mx: 'auto', mb: 2 }}
          />
          <Typography variant="h5" sx={{ mb: 1.5 }}>
            {t('public.notFound')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('public.genericError')}
          </Typography>
        </Card>
      </Container>
    );
  }

  const handleSign = async (payload: SignPublicQuotationPayload) => {
    await signMutation.mutateAsync(payload);
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={4}>
        {/* Header Summary Card */}
        <Card sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {quotation.quotation_number}
              </Typography>
              {quotation.subject && (
                <Typography variant="body1" color="text.secondary">
                  {quotation.subject}
                </Typography>
              )}
              <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                {quotation.client.company_name} • Rev #{quotation.revision_number}
              </Typography>
            </Box>

            {quotation.signed ? (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  bgcolor: 'success.lighter',
                  color: 'success.darker',
                }}
              >
                <Iconify icon="solar:check-circle-bold" width={24} />
                <Typography variant="subtitle2">{t('public.signedConfirmation')}</Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  bgcolor: 'warning.lighter',
                  color: 'warning.darker',
                }}
              >
                <Iconify icon="solar:clock-circle-bold" width={24} />
                <Typography variant="subtitle2">{t('public.approval')}</Typography>
              </Box>
            )}
          </Stack>
        </Card>

        {/* Signed Success Confirmation Banner */}
        {quotation.signed && (
          <Alert severity="success" icon={<Iconify icon="solar:verified-check-bold" />}>
            <Typography variant="subtitle2">{t('public.signedConfirmation')}</Typography>
            <Typography variant="body2">
              {t('public.signedBy')}: <strong>{quotation.signer_name}</strong>
              {quotation.signed_at &&
                ` • ${t('public.signedOn')} ${fDateTime(quotation.signed_at)}`}
            </Typography>
          </Alert>
        )}

        {/* Shared Document Canvas Renderer */}
        <DocumentCanvas>
          <Box
            className="ProseMirror"
            dangerouslySetInnerHTML={{ __html: quotation.content_html }}
          />
        </DocumentCanvas>

        {/* Signature & Consent Section (Only shown when unsigned) */}
        {!quotation.signed && (
          <Card sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('public.approval')}
            </Typography>
            <SignatureForm onSubmit={handleSign} isSubmitting={signMutation.isPending} />
          </Card>
        )}
      </Stack>
    </Container>
  );
}
