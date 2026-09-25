import type { GenerateQuotationPayload } from '../types';
import type { MeetingQuotationPayload } from '../types/prompt-first';

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { DashboardContent } from 'src/layouts/dashboard';

import { MeetingNotesForm } from '../components/meeting-notes-form';
import { useGenerateQuotation } from '../hooks/use-quotation-generation';
import { useQuotationEntryState } from '../hooks/use-quotation-entry-state';
import { QuotationGenerationForm } from '../components/quotation-generation-form';
import { WhiteLabelGenerationForm } from '../components/white-label-generation-form';
import { KioskQueueGenerationForm } from '../components/kiosk-queue-generation-form';
import { SubscriptionSaaSGenerationForm } from '../components/subscription-saas-generation-form';
import { GENERATION_STAGES, GenerationProgressCard } from '../components/generation-progress-card';
import { CustomDevelopmentGenerationForm } from '../components/custom-development-generation-form';
import { TalentOutsourcingGenerationForm } from '../components/talent-outsourcing-generation-form';
import { CloudInfrastructureGenerationForm } from '../components/cloud-infrastructure-generation-form';
import { StandaloneMaintenanceGenerationForm } from '../components/standalone-maintenance-generation-form';
import {
  usePromptClients,
  usePromptQuotation,
  useCreatePromptClient,
} from '../hooks/use-prompt-quotation';
import {
  CommercialSchemeSelector,
  type CommercialSchemeType,
} from '../components/commercial-scheme-selector';

// ----------------------------------------------------------------------

const VALID_SCHEMES: CommercialSchemeType[] = [
  'dedicated_squad',
  'subscription_saas',
  'white_label',
  'standalone_maintenance',
  'custom_development',
  'kiosk_queue_system',
  'talent_outsourcing',
  'cloud_infrastructure',
];

const INVALID_EXTRACTION_MESSAGE =
  'Catatan belum dapat diproses menjadi draf. Lengkapi kebutuhan, durasi, tim, dan skema layanan; lalu coba lagi.';

export function QuotationPromptView() {
  const { t } = useTranslate('quotation');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { entry, setEntry, patchIdentity, clear } = useQuotationEntryState();
  const clientsQuery = usePromptClients();
  const createClientMutation = useCreatePromptClient();
  const promptMutation = usePromptQuotation();
  const generateMutation = useGenerateQuotation();

  const view = searchParams.get('view');
  const schemeParam = searchParams.get('scheme') as CommercialSchemeType | null;

  // Generation state machine
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [generationError, setGenerationError] = useState<{
    code?: string;
    message?: string;
  } | null>(null);
  const [generatedQuotationId, setGeneratedQuotationId] = useState<string | null>(null);
  const [lastSubmittedPayload, setLastSubmittedPayload] = useState<GenerateQuotationPayload | null>(
    null
  );

  // URL cleanup when scheme is invalid
  useEffect(() => {
    if (view === 'advanced' && schemeParam && !VALID_SCHEMES.includes(schemeParam)) {
      navigate(paths.dashboard.quotation.advanced, { replace: true });
    }
  }, [view, schemeParam, navigate]);

  // Submit Handler for Advanced Scheme Forms
  const handleFormSubmit = async (payload: GenerateQuotationPayload) => {
    setLastSubmittedPayload(payload);
    setIsProgressOpen(true);
    setActiveStageIndex(0);
    setGenerationError(null);
    setGeneratedQuotationId(null);

    // Step progression animation ticker
    const timer1 = setTimeout(() => setActiveStageIndex(1), 400);
    const timer2 = setTimeout(() => setActiveStageIndex(2), 1200);
    const timer3 = setTimeout(() => setActiveStageIndex(3), 2200);
    const timer4 = setTimeout(() => setActiveStageIndex(4), 3200);
    const timer5 = setTimeout(() => setActiveStageIndex(5), 4200);

    try {
      const response = await generateMutation.mutateAsync(payload);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);

      setActiveStageIndex(GENERATION_STAGES.length - 1); // Completed
      setGeneratedQuotationId(response.quotation_id);
      clear();

      toast.success('Quotation draft generated successfully!');

      // Auto-navigate to editor after short delay
      setTimeout(() => {
        navigate(paths.dashboard.quotation.edit(response.quotation_id));
      }, 1200);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);

      const responseData = err.response?.data;
      let errCode = 'generation_failed';
      let errMessage = err?.message || 'Failed to generate quotation draft';

      if (
        responseData?.errors?.detail &&
        Array.isArray(responseData.errors.detail) &&
        responseData.errors.detail.length > 0
      ) {
        errCode = responseData.errors.detail[0];
      } else if (typeof responseData?.errors === 'string') {
        errCode = responseData.errors;
      } else if (responseData?.message) {
        errMessage = responseData.message;
      } else {
        const extractedCode = err?.message?.includes(':') ? err.message.split(':')[0].trim() : null;
        if (extractedCode) errCode = extractedCode;
      }

      const errorMap: Record<string, string> = {
        invalid_extraction: INVALID_EXTRACTION_MESSAGE,
        invalid_rate_card:
          'Rate card tidak valid atau belum memiliki role (kosong). Silakan periksa Rate Card di AI Settings.',
        rate_item_missing:
          'Rate card yang dipilih tidak memiliki item tarif untuk role/senioritas yang dibutuhkan. Silakan periksa Rate Card di AI Settings.',
        settings_incomplete: 'Pengaturan AI tidak lengkap (Model atau API Key salah/belum diatur).',
        budget_unfeasible:
          'Budget maksimum yang Anda tentukan tidak mencukupi untuk memenuhi ekspektasi durasi dan scope yang diminta.',
        allocation_invalid: 'Alokasi sumber daya AI tidak memenuhi batasan mandatory scope.',
        settings_invalid: 'Pengaturan AI tidak valid, pastikan model dan provider sesuai.',
      };

      if (errorMap[errCode]) {
        errMessage = errorMap[errCode];
      }

      setGenerationError({
        code: errCode,
        message: errMessage,
      });
    }
  };

  const handleRetry = () => {
    if (lastSubmittedPayload) {
      handleFormSubmit(lastSubmittedPayload);
    }
  };

  const handleMeetingSubmit = async (payload: Omit<MeetingQuotationPayload, 'idempotency_key'>) => {
    try {
      const response = await promptMutation.mutateAsync(payload);
      clear();
      navigate(paths.dashboard.quotation.edit(response.quotation_id));
    } catch {
      // The mutation exposes a safe, mapped issue through promptMutation.issues.
    }
  };

  const renderSchemeForm = (scheme: CommercialSchemeType) => {
    switch (scheme) {
      case 'dedicated_squad':
        return (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={() => navigate(paths.dashboard.quotation.advanced)}
              >
                {t('prompt.backToSchemes')}
              </Button>
              <Typography variant="h5" fontWeight={700}>
                {t('dedicatedSquadForm.title')}
              </Typography>
            </Stack>

            <QuotationGenerationForm
              entryIdentity={entry}
              onEntryIdentityChange={patchIdentity}
              isSubmitting={generateMutation.isPending}
              onSubmit={handleFormSubmit}
              onCancel={() => navigate(paths.dashboard.quotation.advanced)}
            />
          </Box>
        );

      case 'subscription_saas':
        return (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={() => navigate(paths.dashboard.quotation.advanced)}
              >
                {t('prompt.backToSchemes')}
              </Button>
              <Typography variant="h5" fontWeight={700}>
                {t('subscriptionSaaSForm.title')}
              </Typography>
            </Stack>

            <SubscriptionSaaSGenerationForm
              entryIdentity={entry}
              onEntryIdentityChange={patchIdentity}
              isSubmitting={generateMutation.isPending}
              onSubmit={handleFormSubmit}
              onCancel={() => navigate(paths.dashboard.quotation.advanced)}
            />
          </Box>
        );

      case 'white_label':
        return (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={() => navigate(paths.dashboard.quotation.advanced)}
              >
                {t('prompt.backToSchemes')}
              </Button>
              <Typography variant="h5" fontWeight={700}>
                {t('whiteLabelForm.title')}
              </Typography>
            </Stack>

            <WhiteLabelGenerationForm
              entryIdentity={entry}
              onEntryIdentityChange={patchIdentity}
              isSubmitting={generateMutation.isPending}
              onSubmit={handleFormSubmit}
              onCancel={() => navigate(paths.dashboard.quotation.advanced)}
            />
          </Box>
        );

      case 'standalone_maintenance':
        return (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={() => navigate(paths.dashboard.quotation.advanced)}
              >
                {t('prompt.backToSchemes')}
              </Button>
              <Typography variant="h5" fontWeight={700}>
                {t('standaloneMaintenanceForm.title')}
              </Typography>
            </Stack>

            <StandaloneMaintenanceGenerationForm
              entryIdentity={entry}
              onEntryIdentityChange={patchIdentity}
              isSubmitting={generateMutation.isPending}
              onSubmit={handleFormSubmit}
              onCancel={() => navigate(paths.dashboard.quotation.advanced)}
            />
          </Box>
        );

      case 'custom_development':
        return (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={() => navigate(paths.dashboard.quotation.advanced)}
              >
                {t('prompt.backToSchemes')}
              </Button>
              <Typography variant="h5" fontWeight={700}>
                {t('customDevelopmentForm.title')}
              </Typography>
            </Stack>

            <CustomDevelopmentGenerationForm
              entryIdentity={entry}
              onEntryIdentityChange={patchIdentity}
              isSubmitting={generateMutation.isPending}
              onSubmit={handleFormSubmit}
              onCancel={() => navigate(paths.dashboard.quotation.advanced)}
            />
          </Box>
        );

      case 'kiosk_queue_system':
        return (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={() => navigate(paths.dashboard.quotation.advanced)}
              >
                {t('prompt.backToSchemes')}
              </Button>
              <Typography variant="h5" fontWeight={700}>
                {t('kioskQueueForm.title', 'Buat Quotation Kiosk & Sistem Perangkat Keras')}
              </Typography>
            </Stack>

            <KioskQueueGenerationForm
              entryIdentity={entry}
              onEntryIdentityChange={patchIdentity}
              isSubmitting={generateMutation.isPending}
              onSubmit={handleFormSubmit}
              onCancel={() => navigate(paths.dashboard.quotation.advanced)}
            />
          </Box>
        );

      case 'talent_outsourcing':
        return (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={() => navigate(paths.dashboard.quotation.advanced)}
              >
                {t('prompt.backToSchemes')}
              </Button>
              <Typography variant="h5" fontWeight={700}>
                {t('talentOutsourcingForm.title')}
              </Typography>
            </Stack>

            <TalentOutsourcingGenerationForm
              entryIdentity={entry}
              onEntryIdentityChange={patchIdentity}
              isSubmitting={generateMutation.isPending}
              onSubmit={handleFormSubmit}
              onCancel={() => navigate(paths.dashboard.quotation.advanced)}
            />
          </Box>
        );

      case 'cloud_infrastructure':
        return (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={() => navigate(paths.dashboard.quotation.advanced)}
              >
                {t('prompt.backToSchemes')}
              </Button>
              <Typography variant="h5" fontWeight={700}>
                {t('cloudInfrastructure.title')}
              </Typography>
            </Stack>

            <CloudInfrastructureGenerationForm
              entryIdentity={entry}
              onEntryIdentityChange={patchIdentity}
              isSubmitting={generateMutation.isPending}
              onSubmit={handleFormSubmit}
              onCancel={() => navigate(paths.dashboard.quotation.advanced)}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  const isAdvancedView = view === 'advanced';
  const isSchemeSelected = Boolean(schemeParam && VALID_SCHEMES.includes(schemeParam));

  return (
    <DashboardContent maxWidth="lg">
      <Stack spacing={4} sx={{ py: { xs: 2, md: 4 } }}>
        {isAdvancedView ? (
          isSchemeSelected && schemeParam ? (
            renderSchemeForm(schemeParam)
          ) : (
            <CommercialSchemeSelector
              onSelectScheme={(scheme) =>
                navigate(paths.dashboard.quotation.advancedScheme(scheme))
              }
              onBack={() => navigate(paths.dashboard.quotation.prompt)}
            />
          )
        ) : (
          <MeetingNotesForm
            value={entry}
            onChange={setEntry}
            clients={clientsQuery.data ?? []}
            isLoadingClients={clientsQuery.isLoading}
            loadClientsError={clientsQuery.error}
            onCreateClient={(name) => createClientMutation.mutateAsync(name)}
            isCreatingClient={createClientMutation.isPending}
            createClientError={createClientMutation.error}
            issues={promptMutation.issues.map((issue) =>
              issue.code === 'invalid_extraction'
                ? { ...issue, code: '', message: INVALID_EXTRACTION_MESSAGE }
                : issue
            )}
            isSubmitting={promptMutation.isPending}
            onSubmit={handleMeetingSubmit}
            onOpenAdvanced={() => navigate(paths.dashboard.quotation.advanced)}
          />
        )}
      </Stack>

      {/* Generation Progress State UI Modal */}
      <GenerationProgressCard
        open={isProgressOpen}
        activeStageIndex={activeStageIndex}
        isError={Boolean(generationError)}
        errorCode={generationError?.code}
        errorMessage={generationError?.message}
        quotationId={generatedQuotationId}
        onRetry={handleRetry}
        onClose={() => setIsProgressOpen(false)}
        onOpenEditor={(id) => navigate(paths.dashboard.quotation.edit(id))}
      />
    </DashboardContent>
  );
}
