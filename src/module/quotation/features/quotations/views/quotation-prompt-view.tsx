import type { GenerateQuotationPayload } from '../types';
import type { DraftIssue, MeetingQuotationPayload } from '../types/prompt-first';

import { useState, useEffect, useRef } from 'react';
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
import {
  GENERATION_STAGES,
  MEETING_GENERATION_STAGES,
  GenerationProgressCard,
} from '../components/generation-progress-card';
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

const INVALID_EXTRACTION_PREFIX = 'invalid_extraction.';

const NO_BUSINESS_SIGNAL_MESSAGE =
  'Catatan belum memuat informasi kebutuhan yang dapat dikenali. Tambahkan scope, durasi, tim, skema layanan, atau pola pembayaran.';

const EXTRACTION_RETRY_EXHAUSTED_MESSAGE =
  'Respons AI belum dapat diproses setelah dicoba ulang. Silakan coba kembali atau periksa konfigurasi provider AI.';

const INVALID_EXTRACTION_REASON_MESSAGES: Record<string, string> = {
  malformed_json: 'Respons AI belum dapat dibaca dalam format yang diperlukan. Coba buat draf lagi.',
  trailing_content: 'Respons AI belum dapat dibaca dalam format yang diperlukan. Coba buat draf lagi.',
  missing_required_field:
    'Informasi penting dari catatan meeting belum lengkap untuk membuat draf. Lengkapi catatan lalu coba lagi.',
  unknown_field: 'Respons AI memuat format yang belum didukung. Coba buat draf lagi.',
  schema_version: 'Versi format ekstraksi belum sesuai. Coba buat draf lagi.',
  unsupported_evidence:
    'Sebagian informasi hasil AI tidak dapat dicocokkan dengan catatan meeting. Periksa penulisan nama, durasi, tim, dan skema layanan; lalu coba lagi.',
  state_validation:
    'Hasil ekstraksi tidak memenuhi validasi struktur draf. Periksa catatan meeting lalu coba lagi.',
};

function mapDraftIssue(issue: DraftIssue): DraftIssue {
  if (issue.code === 'invalid_extraction') {
    return { ...issue, code: '', message: INVALID_EXTRACTION_MESSAGE };
  }
  if (issue.code.startsWith(INVALID_EXTRACTION_PREFIX)) {
    const reason = issue.code.slice(INVALID_EXTRACTION_PREFIX.length);
    const message = INVALID_EXTRACTION_REASON_MESSAGES[reason] ?? INVALID_EXTRACTION_MESSAGE;
    return { ...issue, code: '', message };
  }
  return issue;
}

type ProgressMode = 'advanced' | 'meeting';

function getGenerationError(err: any) {
  const responseData = err.response?.data;
  let code = 'generation_failed';
  let message = err?.message || 'Failed to generate quotation draft';

  if (Array.isArray(responseData?.errors?.detail) && responseData.errors.detail.length > 0) {
    [code] = responseData.errors.detail;
  } else if (typeof responseData?.errors === 'string') {
    code = responseData.errors;
  } else if (responseData?.message) {
    message = responseData.message;
  } else {
    const extractedCode = err?.message?.includes(':') ? err.message.split(':')[0].trim() : null;
    if (extractedCode) code = extractedCode;
  }

  return { code, message };
}

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
  const [progressMode, setProgressMode] = useState<ProgressMode>('advanced');
  const [lastSubmittedPayload, setLastSubmittedPayload] = useState<GenerateQuotationPayload | null>(
    null
  );
  const [lastMeetingPayload, setLastMeetingPayload] = useState<
    Omit<MeetingQuotationPayload, 'idempotency_key'> | null
  >(null);
  const progressTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearProgressTimers = () => {
    progressTimersRef.current.forEach(clearTimeout);
    progressTimersRef.current = [];
  };

  const scheduleProgress = (indexes: number[]) => {
    clearProgressTimers();
    progressTimersRef.current = indexes.map((index, offset) =>
      setTimeout(() => setActiveStageIndex(index), 400 + offset * 800)
    );
  };

  // URL cleanup when scheme is invalid
  useEffect(() => {
    if (view === 'advanced' && schemeParam && !VALID_SCHEMES.includes(schemeParam)) {
      navigate(paths.dashboard.quotation.advanced, { replace: true });
    }
  }, [view, schemeParam, navigate]);

  useEffect(() => clearProgressTimers, []);

  // Submit Handler for Advanced Scheme Forms
  const handleFormSubmit = async (payload: GenerateQuotationPayload) => {
    setProgressMode('advanced');
    setLastSubmittedPayload(payload);
    setIsProgressOpen(true);
    setActiveStageIndex(0);
    setGenerationError(null);
    setGeneratedQuotationId(null);

    scheduleProgress([1, 2, 3, 4, 5]);

    try {
      const response = await generateMutation.mutateAsync(payload);
      clearProgressTimers();

      setActiveStageIndex(GENERATION_STAGES.length - 1); // Completed
      setGeneratedQuotationId(response.quotation_id);
      clear();

      toast.success('Quotation draft generated successfully!');

      // Auto-navigate to editor after short delay
      progressTimersRef.current = [setTimeout(() => {
        navigate(paths.dashboard.quotation.edit(response.quotation_id));
      }, 1200)];
    } catch (err: any) {
      clearProgressTimers();
      const { code: errCode, message: defaultMessage } = getGenerationError(err);
      let errMessage = defaultMessage;

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
    setProgressMode('meeting');
    setLastMeetingPayload(payload);
    setIsProgressOpen(true);
    setActiveStageIndex(0);
    setGenerationError(null);
    setGeneratedQuotationId(null);
    scheduleProgress([1, 2, 3, 4, 5]);

    try {
      const response = await promptMutation.mutateAsync(payload);
      clearProgressTimers();
      setActiveStageIndex(MEETING_GENERATION_STAGES.length - 1);
      setGeneratedQuotationId(response.quotation_id);
      clear();
      toast.success('Quotation draft generated successfully!');
      progressTimersRef.current = [setTimeout(() => {
        navigate(paths.dashboard.quotation.edit(response.quotation_id));
      }, 1200)];
    } catch (err: any) {
      clearProgressTimers();
      const { code, message: defaultMessage } = getGenerationError(err);
      const message =
        code === 'meeting_notes_no_business_signal'
          ? NO_BUSINESS_SIGNAL_MESSAGE
          : code === 'invalid_extraction' || code.startsWith(INVALID_EXTRACTION_PREFIX)
            ? EXTRACTION_RETRY_EXHAUSTED_MESSAGE
            : defaultMessage;
      setActiveStageIndex(2);
      setGenerationError({ code, message });
    }
  };

  const handleMeetingRetry = () => {
    if (lastMeetingPayload) {
      handleMeetingSubmit(lastMeetingPayload);
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
            issues={promptMutation.issues.map(mapDraftIssue)}
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
        stages={progressMode === 'meeting' ? MEETING_GENERATION_STAGES : GENERATION_STAGES}
        showRetry={generationError?.code !== 'meeting_notes_no_business_signal'}
        onRetry={progressMode === 'meeting' ? handleMeetingRetry : handleRetry}
        onClose={() => setIsProgressOpen(false)}
        onOpenEditor={(id) => navigate(paths.dashboard.quotation.edit(id))}
      />
    </DashboardContent>
  );
}
