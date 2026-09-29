import type { GenerationProgressStage } from '../types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/shared/ui/iconify';

export type GenerationProgressStep = {
  id: GenerationProgressStage;
  label: string;
  description: string;
};

export const GENERATION_STAGES: GenerationProgressStep[] = [
  {
    id: 'validating_input',
    label: 'Validating input',
    description: 'Checking project scope, duration, and milestone payment terms',
  },
  {
    id: 'creating_draft',
    label: 'Creating draft',
    description: 'Initializing aggregate and creating draft revision in database',
  },
  {
    id: 'preparing_allocation',
    label: 'Preparing allocation',
    description: 'AI model proposing squad roles, seniority, and duration',
  },
  {
    id: 'checking_rate_card',
    label: 'Checking rate card and budget',
    description: 'Deterministic rate calculation and budget feasibility verification',
  },
  {
    id: 'composing_quotation',
    label: 'Composing quotation',
    description: 'Synthesizing executive narrative, scope details, and legal blocks',
  },
  {
    id: 'sanitizing_document',
    label: 'Sanitizing document',
    description: 'Enforcing strict DOM safety, HTML allowlist, and structure validation',
  },
  {
    id: 'completed',
    label: 'Completed',
    description: 'Quotation draft ready for visual editing and review',
  },
];

export const MEETING_GENERATION_STAGES: GenerationProgressStep[] = [
  {
    id: 'validating_input',
    label: 'Memvalidasi catatan meeting',
    description: 'Memeriksa identitas proyek dan batas catatan meeting',
  },
  {
    id: 'extracting_meeting',
    label: 'Mengekstrak kebutuhan dengan AI',
    description: 'Membaca scope, tim, durasi, skema layanan, dan pembayaran',
  },
  {
    id: 'validating_extraction',
    label: 'Memvalidasi hasil ekstraksi',
    description: 'Memeriksa JSON, struktur data, dan evidence dari catatan',
  },
  {
    id: 'matching_catalog',
    label: 'Mencocokkan skema dan katalog',
    description: 'Mencocokkan layanan dan role tanpa mengarang harga',
  },
  {
    id: 'composing_quotation',
    label: 'Menyusun draf quotation',
    description: 'Menyiapkan struktur dokumen, readiness, dan issue',
  },
  {
    id: 'saving_draft',
    label: 'Menyimpan draf',
    description: 'Menyimpan quotation setelah validasi kebutuhan berhasil',
  },
  {
    id: 'completed',
    label: 'Selesai',
    description: 'Draf quotation siap dibuka dan ditinjau',
  },
];

type Props = {
  open: boolean;
  activeStageIndex: number;
  isError: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
  quotationId?: string | null;
  stages?: GenerationProgressStep[];
  showRetry?: boolean;
  onRetry?: () => void;
  onClose?: () => void;
  onOpenEditor?: (id: string) => void;
};

export function GenerationProgressCard({
  open,
  activeStageIndex,
  isError,
  errorCode,
  errorMessage,
  quotationId,
  stages = GENERATION_STAGES,
  showRetry = true,
  onRetry,
  onClose,
  onOpenEditor,
}: Props) {
  const isCompleted = activeStageIndex >= stages.length - 1 && !isError;
  const progressPercent = Math.min(Math.round(((activeStageIndex + 1) / stages.length) * 100), 100);

  const getSafeErrorMessage = (code?: string | null, rawMsg?: string | null) => {
    switch (code) {
      case 'settings_incomplete':
        return 'AI provider is not configured or missing credentials. Please configure AI Settings first.';
      case 'budget_unfeasible':
        return 'Budget Maximum is insufficient to cover mandatory scope with standard rate card rates. Please adjust budget or scope.';
      case 'invalid_rate_card':
      case 'rate_item_missing':
        return 'Selected rate card does not contain required resource roles. Please select a complete rate card.';
      case 'provider_timeout':
        return 'AI Provider timed out. Draft has been saved safely and can be regenerated.';
      case 'provider_rate_limited':
        return 'AI provider rate limit reached. Please wait a moment before retrying.';
      case 'unsafe_html':
        return 'Document security validation failed. Raw response contained invalid markup.';
      case 'allocation_invalid':
        return 'AI resource allocation did not satisfy mandatory scope constraints.';
      default:
        return (
          rawMsg || 'Quotation generation encountered an issue. Your input form has been preserved.'
        );
    }
  };

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="sm"
      disableEscapeKeyDown={!isError && !isCompleted}
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(4px)', bgcolor: 'rgba(0, 0, 0, 0.45)' },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1.5,
              bgcolor: isError
                ? 'error.lighter'
                : isCompleted
                  ? 'success.lighter'
                  : 'primary.lighter',
              color: isError ? 'error.main' : isCompleted ? 'success.main' : 'primary.main',
              display: 'flex',
            }}
          >
            <Iconify
              icon={
                isError
                  ? 'solar:file-corrupted-bold-duotone'
                  : isCompleted
                    ? 'solar:file-check-bold-duotone'
                    : 'solar:atom-bold-duotone'
              }
              width={24}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700}>
              {isError
                ? 'Generation Failed'
                : isCompleted
                  ? 'Quotation Draft Generated!'
                  : 'Generating Quotation with AI'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isError
                ? 'Issue during pipeline processing'
                : isCompleted
                  ? 'All deterministic and AI checks passed'
                  : 'Processing AI-assisted structured document'}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Stack spacing={2.5}>
          {/* Progress Bar */}
          {!isError && (
            <Box sx={{ width: '100%' }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  Step {Math.min(activeStageIndex + 1, stages.length)} of {stages.length}
                </Typography>
                <Typography variant="caption" fontWeight={700} color="primary.main">
                  {progressPercent}%
                </Typography>
              </Stack>
              <LinearProgress
                variant={isCompleted ? 'determinate' : 'determinate'}
                value={progressPercent}
                sx={{
                  height: 8,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 1,
                    transition: 'transform 0.4s ease',
                  },
                }}
              />
            </Box>
          )}

          {/* Error Banner */}
          {isError && (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                Generation Error
              </Typography>
              <Typography variant="body2">
                {getSafeErrorMessage(errorCode, errorMessage)}
              </Typography>
            </Alert>
          )}

          {/* Stages List */}
          <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1.5 }}>
            <Stack spacing={1.5}>
              {stages.map((stage, idx) => {
                const isPast = idx < activeStageIndex;
                const isCurrent = idx === activeStageIndex;
                const isPending = idx > activeStageIndex;

                let iconColor = 'text.disabled';
                let iconName: any = 'eva:radio-button-off-fill';

                if (isPast || (isCompleted && idx === activeStageIndex)) {
                  iconColor = 'success.main';
                  iconName = 'solar:check-circle-bold';
                } else if (isCurrent) {
                  if (isError) {
                    iconColor = 'error.main';
                    iconName = 'solar:close-circle-bold';
                  } else {
                    iconColor = 'primary.main';
                  }
                }

                return (
                  <Stack
                    key={stage.id}
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{
                      opacity: isPending ? 0.45 : 1,
                      transition: 'opacity 0.3s ease',
                    }}
                  >
                    <Box sx={{ width: 22, display: 'flex', justifyContent: 'center' }}>
                      {isCurrent && !isError && !isCompleted ? (
                        <CircularProgress size={16} thickness={5} color="primary" />
                      ) : (
                        <Iconify icon={iconName} width={20} sx={{ color: iconColor }} />
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        fontWeight={isCurrent ? 700 : isPast ? 600 : 400}
                        color={
                          isCurrent
                            ? isError
                              ? 'error.main'
                              : 'text.primary'
                            : isPast
                              ? 'text.primary'
                              : 'text.secondary'
                        }
                      >
                        {stage.label}
                      </Typography>
                      {isCurrent && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          {stage.description}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          </Card>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        {isError ? (
          <>
            <Button variant="outlined" color="inherit" onClick={onClose}>
              Back to Form
            </Button>
            {showRetry && onRetry && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Iconify icon="solar:restart-bold" />}
                onClick={onRetry}
              >
                Retry Generation
              </Button>
            )}
          </>
        ) : isCompleted ? (
          <Button
            variant="contained"
            color="success"
            size="large"
            fullWidth
            endIcon={<Iconify icon="eva:arrow-forward-fill" />}
            onClick={() => quotationId && onOpenEditor?.(quotationId)}
          >
            Open Quotation Editor
          </Button>
        ) : (
          <Typography variant="caption" color="text.disabled" sx={{ mx: 'auto' }}>
            Please wait while the AI generates and validates the draft...
          </Typography>
        )}
      </DialogActions>
    </Dialog>
  );
}
