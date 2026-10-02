import type { GenerateQuotationPayload } from '../types';
import type {
  DraftIssue,
  MeetingGenerationPhase,
  MeetingQuotationPayload,
} from '../types/prompt-first';
import type { MeetingExtractionServiceScheme, MeetingExtractionStatus } from '../types/meeting-extraction';

import { useRef, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { CONFIG } from 'src/shared/config';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { DashboardContent } from 'src/layouts/dashboard';

import { MeetingNotesForm } from '../components/meeting-notes-form';
import { MeetingExtractionProgressCard } from '../components/meeting-extraction-progress-card';
import { useGenerateQuotation } from '../hooks/use-quotation-generation';
import { useQuotationEntryState } from '../hooks/use-quotation-entry-state';
import { QuotationGenerationForm } from '../components/quotation-generation-form';
import { WhiteLabelGenerationForm } from '../components/white-label-generation-form';
import { KioskQueueGenerationForm } from '../components/kiosk-queue-generation-form';
import { SubscriptionSaaSGenerationForm } from '../components/subscription-saas-generation-form';
import { CustomDevelopmentGenerationForm } from '../components/custom-development-generation-form';
import { TalentOutsourcingGenerationForm } from '../components/talent-outsourcing-generation-form';
import { CloudInfrastructureGenerationForm } from '../components/cloud-infrastructure-generation-form';
import { StandaloneMaintenanceGenerationForm } from '../components/standalone-maintenance-generation-form';
import {
  usePromptClients,
  usePromptQuotation,
  useCreatePromptClient,
} from '../hooks/use-prompt-quotation';
import { useMeetingExtraction } from '../hooks/use-meeting-extraction';
import {
  CommercialSchemeSelector,
  type CommercialSchemeType,
} from '../components/commercial-scheme-selector';
import {
  GENERATION_STAGES,
  GenerationProgressCard,
  MEETING_GENERATION_STAGES,
} from '../components/generation-progress-card';

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

const INVALID_EXTRACTION_REASON_MESSAGES: Record<string, string> = {
  malformed_json:
    'Respons AI belum dapat dibaca dalam format yang diperlukan. Coba buat draf lagi.',
  trailing_content:
    'Respons AI belum dapat dibaca dalam format yang diperlukan. Coba buat draf lagi.',
  missing_required_field:
    'Informasi penting dari catatan meeting belum lengkap untuk membuat draf. Lengkapi catatan lalu coba lagi.',
  unknown_field: 'Respons AI memuat format yang belum didukung. Coba buat draf lagi.',
  schema_version: 'Versi format ekstraksi belum sesuai. Coba buat draf lagi.',
  unsupported_evidence:
    'Sebagian informasi hasil AI tidak dapat dicocokkan dengan catatan meeting. Periksa penulisan nama, durasi, tim, dan skema layanan; lalu coba lagi.',
  'unsupported_evidence.client_company':
    'AI belum dapat mencocokkan nama perusahaan klien dengan catatan meeting. Pastikan nama perusahaan ditulis jelas, lalu coba lagi.',
  'unsupported_evidence.project_name':
    'AI belum dapat mencocokkan nama proyek dengan catatan meeting. Pastikan nama proyek ditulis jelas, lalu coba lagi.',
  'unsupported_evidence.duration_months':
    'AI belum dapat mencocokkan durasi proyek dengan catatan meeting. Pastikan durasi ditulis jelas, lalu coba lagi.',
  'unsupported_evidence.team':
    'AI belum dapat mencocokkan informasi tim dengan catatan meeting. Pastikan peran, jumlah, dan durasi tim ditulis jelas, lalu coba lagi.',
  'unsupported_evidence.scope':
    'AI belum dapat mencocokkan ruang lingkup pekerjaan dengan catatan meeting. Perjelas daftar fitur atau kebutuhan, lalu coba lagi.',
  'unsupported_evidence.payment_pattern':
    'AI belum dapat mencocokkan pola pembayaran dengan catatan meeting. Pastikan tahapan atau persentase pembayaran ditulis jelas, lalu coba lagi.',
  'unsupported_evidence.commercial_scheme':
    'AI belum dapat mencocokkan skema layanan dengan catatan meeting. Pastikan jenis layanan yang dibutuhkan ditulis jelas, lalu coba lagi.',
  'unsupported_evidence.service_input':
    'AI belum dapat mencocokkan detail layanan dengan catatan meeting. Perjelas kebutuhan layanan, lalu coba lagi.',
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

const meetingStageByPhase: Record<MeetingGenerationPhase, number> = {
  idle: 0,
  creating_draft: 1,
  extracting_meeting: 2,
  finalizing_draft: 5,
  completed: MEETING_GENERATION_STAGES.length - 1,
  failed: 2,
};

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

function meetingExtractionErrorMessage(code: string, fallback: string) {
  if (code === 'invalid_extraction') return INVALID_EXTRACTION_MESSAGE;
  if (!code.startsWith(INVALID_EXTRACTION_PREFIX)) return fallback;
  const reason = code.slice(INVALID_EXTRACTION_PREFIX.length);
  return INVALID_EXTRACTION_REASON_MESSAGES[reason] ?? INVALID_EXTRACTION_MESSAGE;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isOpaqueId = (value: string | null): value is string => Boolean(value && UUID_PATTERN.test(value));

function pendingPipelineStatus(quotationId: string, runId: string): MeetingExtractionStatus {
  return {
    quotation_id: quotationId,
    run_id: runId,
    status: 'queued',
    current_phase: null,
    progress: { completed: 0, total: 0 },
    phases: [],
    failed_phase: null,
    error: null,
    needs_input: [],
    warnings: [],
  };
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
  const pipelineEnabled = CONFIG.meetingExtraction.pipelineEnabled;
  const queryQuotationId = searchParams.get('quotationId');
  const queryRunId = searchParams.get('runId');
  const recoveredQuotationId = isOpaqueId(queryQuotationId) && isOpaqueId(queryRunId) ? queryQuotationId : undefined;
  const recoveredRunId = isOpaqueId(queryQuotationId) && isOpaqueId(queryRunId) ? queryRunId : undefined;
  const meetingExtraction = useMeetingExtraction({
    quotationId: pipelineEnabled ? recoveredQuotationId : undefined,
    runId: pipelineEnabled ? recoveredRunId : undefined,
  });

  // Generation state machine
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [generationError, setGenerationError] = useState<{
    code?: string;
    message?: string;
  } | null>(null);
  const [generatedQuotationId, setGeneratedQuotationId] = useState<string | null>(null);
  const [progressMode, setProgressMode] = useState<ProgressMode>('advanced');
  const [pipelineActive, setPipelineActive] = useState(Boolean(recoveredQuotationId && recoveredRunId));
  const [lastSubmittedPayload, setLastSubmittedPayload] = useState<GenerateQuotationPayload | null>(
    null
  );
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

  useEffect(() => {
    if (!pipelineEnabled || !pipelineActive || !meetingExtraction.ids) return;
    const { quotationId, runId } = meetingExtraction.ids;
    if (queryQuotationId === quotationId && queryRunId === runId) return;
    navigate({ search: `?quotationId=${encodeURIComponent(quotationId)}&runId=${encodeURIComponent(runId)}` }, { replace: true });
  }, [meetingExtraction.ids, navigate, pipelineActive, pipelineEnabled, queryQuotationId, queryRunId]);

  useEffect(() => {
    if (!pipelineEnabled || meetingExtraction.status?.status !== 'completed' || !meetingExtraction.ids) return;
    clear();
    navigate(paths.dashboard.quotation.edit(meetingExtraction.ids.quotationId));
  }, [clear, meetingExtraction.ids, meetingExtraction.status?.status, navigate, pipelineEnabled]);

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
      progressTimersRef.current = [
        setTimeout(() => {
          navigate(paths.dashboard.quotation.edit(response.quotation_id));
        }, 1200),
      ];
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

  const handleMeetingSubmit = async (
    payload: Omit<MeetingQuotationPayload, 'idempotency_key'> & {
      service_scheme?: MeetingExtractionServiceScheme;
    }
  ) => {
    setProgressMode('meeting');
    setIsProgressOpen(true);
    setGenerationError(null);
    setGeneratedQuotationId(null);

    if (pipelineEnabled) {
      setPipelineActive(true);
      try {
        const draft = await promptMutation.createPipelineDraft(payload);
        const started = await meetingExtraction.start({
          quotationId: draft.quotation_id,
          meetingNotes: payload.meeting_notes,
          serviceScheme: payload.service_scheme ?? 'auto',
          idempotencyKey: draft.idempotencyKey,
        });
        navigate(
          { search: `?quotationId=${encodeURIComponent(started.quotation_id)}&runId=${encodeURIComponent(started.run_id)}` },
          { replace: true }
        );
      } catch {
        setGenerationError({ code: 'INTERNAL_ERROR', message: 'Quotation belum dapat diproses. Coba lagi.' });
      }
      return;
    }

    try {
      const response = await promptMutation.submitMeeting(payload);
      setGeneratedQuotationId(response.quotation_id);
      clear();
      toast.success('Quotation draft generated successfully!');
      progressTimersRef.current = [
        setTimeout(() => {
          navigate(paths.dashboard.quotation.edit(response.quotation_id));
        }, 1200),
      ];
    } catch (err: any) {
      const { code, message: defaultMessage } = getGenerationError(err);
      const message =
        code === 'meeting_notes_no_business_signal'
          ? NO_BUSINESS_SIGNAL_MESSAGE
          : meetingExtractionErrorMessage(code, defaultMessage);
      setGenerationError({ code, message });
    }
  };

  const handleMeetingRetry = async () => {
    setProgressMode('meeting');
    setIsProgressOpen(true);
    setGenerationError(null);
    try {
      const response = await promptMutation.retryProcessing();
      setGeneratedQuotationId(response.quotation_id);
      clear();
      toast.success('Quotation draft generated successfully!');
      progressTimersRef.current = [
        setTimeout(() => {
          navigate(paths.dashboard.quotation.edit(response.quotation_id));
        }, 1200),
      ];
    } catch (err: any) {
      const { code, message: defaultMessage } = getGenerationError(err);
      const message =
        code === 'meeting_notes_no_business_signal'
          ? NO_BUSINESS_SIGNAL_MESSAGE
          : meetingExtractionErrorMessage(code, defaultMessage);
      setGenerationError({ code, message });
    }
  };

  const handlePipelineStartNew = () => {
    setPipelineActive(false);
    setGenerationError(null);
    navigate({ search: '' }, { replace: true });
  };

  const pipelineStatus = meetingExtraction.status ??
    (meetingExtraction.ids
      ? pendingPipelineStatus(meetingExtraction.ids.quotationId, meetingExtraction.ids.runId)
      : null);

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
            issues={isProgressOpen ? [] : promptMutation.issues.map(mapDraftIssue)}
            isSubmitting={promptMutation.isPending}
            onSubmit={handleMeetingSubmit}
            onOpenAdvanced={() => navigate(paths.dashboard.quotation.advanced)}
            pipelineEnabled={pipelineEnabled}
          />
        )}
      </Stack>

      {pipelineEnabled && pipelineActive && pipelineStatus ? (
        <>
          <MeetingExtractionProgressCard
            status={pipelineStatus}
            onRetry={() => void meetingExtraction.retry()}
            onStartNew={handlePipelineStartNew}
            onOpenEditor={() => {
              if (meetingExtraction.ids) navigate(paths.dashboard.quotation.edit(meetingExtraction.ids.quotationId));
            }}
            isRetrying={meetingExtraction.isPolling}
          />
          {pipelineStatus.status === 'failed' && pipelineStatus.error?.code === 'MEETING_NOTES_CHANGED' && (
            <Button onClick={handlePipelineStartNew}>Buat ulang</Button>
          )}
        </>
      ) : (
      <GenerationProgressCard
        open={isProgressOpen}
        activeStageIndex={
          progressMode === 'meeting'
            ? meetingStageByPhase[promptMutation.phase]
            : activeStageIndex
        }
        isError={Boolean(generationError)}
        errorCode={generationError?.code}
        errorMessage={generationError?.message}
        quotationId={generatedQuotationId ?? promptMutation.quotationId}
        stages={progressMode === 'meeting' ? MEETING_GENERATION_STAGES : GENERATION_STAGES}
        showRetry={generationError?.code !== 'meeting_notes_no_business_signal'}
        onRetry={progressMode === 'meeting' ? handleMeetingRetry : handleRetry}
        onClose={() => setIsProgressOpen(false)}
        onOpenEditor={(id) => navigate(paths.dashboard.quotation.edit(id))}
      />
      )}
    </DashboardContent>
  );
}
