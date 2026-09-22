import type { SyntheticEvent } from 'react';
import type { ProviderSection } from '../types';

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import AlertTitle from '@mui/material/AlertTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { DashboardContent } from 'src/layouts/dashboard';
import { LoadingScreen } from 'src/shared/ui/loading-screen';

import { useBlueprintRunner } from '../hooks/use-blueprint-runner';
import { SectionStatusList } from '../components/section-status-list';
import { BlueprintResultPreview } from '../components/blueprint-result-preview';
import { ManualCompletionDialog } from '../components/manual-completion-dialog';
import { presentBlueprintError } from '../utils/blueprint-error-presentation';
import { ValidationPanel, mapToProviderSection } from '../components/validation-panel';

export interface BlueprintProgressViewProps {
  blueprintId?: string;
  onOpenManual?: (section: ProviderSection) => void;
}

export function BlueprintProgressView({
  blueprintId: propBlueprintId,
  onOpenManual: propOnOpenManual,
}: BlueprintProgressViewProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const params = useParams<{ id: string }>();
  const blueprintId = propBlueprintId || params.id;

  const [activeTab, setActiveTab] = useState<'preview' | 'validation'>('preview');
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [selectedManualSection, setSelectedManualSection] = useState<ProviderSection | null>(null);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);

  const {
    status,
    detail,
    runnerState,
    isLoading,
    isFetching,
    isStaleLease,
    error,
    start,
    stop,
    recover,
    retrySection,
    refresh,
  } = useBlueprintRunner(blueprintId);

  const handleOpenManual = (section: ProviderSection) => {
    if (isCompact) return;
    if (propOnOpenManual) {
      propOnOpenManual(section);
    } else {
      setSelectedManualSection(section);
      setManualDialogOpen(true);
    }
  };

  const handleManualSuccess = () => {
    setShowContinuePrompt(true);
    refresh();
  };

  const handleStart = async () => {
    try {
      await start();
    } catch (err: any) {
      toast.error('Gagal menjalankan runner: ' + (err.message || 'Error'));
    }
  };

  const handleRecover = async () => {
    try {
      await recover();
      toast.success('Pemeriksaan dan pemulihan status pipeline berhasil dijalankan.');
    } catch (err: any) {
      toast.error('Gagal memulihkan pipeline: ' + (err.message || 'Error'));
    }
  };

  const handleRetrySection = async (section: ProviderSection) => {
    try {
      await retrySection(section);
      toast.success(`Percobaan ulang tahap "${section}" berhasil dijadwalkan.`);
    } catch (err: any) {
      toast.error(`Gagal mencoba ulang section "${section}": ` + (err.message || 'Error'));
    }
  };

  const handleRefresh = async () => {
    try {
      await refresh();
      toast.success('Data blueprint berhasil diperbarui.');
    } catch (err: any) {
      toast.error('Gagal menyegarkan data: ' + (err.message || 'Error'));
    }
  };

  // Loading state
  if (isLoading && !status) {
    return <LoadingScreen />;
  }

  // Error / 404 / Foreign Blueprint view
  if (error && !status) {
    return (
      <DashboardContent maxWidth="xl">
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
          <Card sx={{ maxWidth: 500, p: 4, textAlign: 'center' }}>
            <Iconify
              icon="solar:shield-warning-bold"
              width={64}
              sx={{ color: 'error.main', mx: 'auto', mb: 2 }}
            />
            <Typography variant="h5" gutterBottom>
              Blueprint Tidak Ditemukan
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Blueprint dengan ID ini tidak ditemukan atau Anda tidak memiliki akses ke data tenant
              ini.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:arrow-left-bold" />}
              onClick={() => navigate(paths.dashboard.blueprint.root)}
            >
              Kembali ke Generator
            </Button>
          </Card>
        </Box>
      </DashboardContent>
    );
  }

  const isRunning = runnerState === 'running';
  const isStopping = runnerState === 'stopping';
  const isCompleted = status?.generation_status === 'completed';
  const isFailed =
    status?.generation_status === 'failed' || status?.generation_status === 'partial_failed';
  const needsRecovery = isStaleLease || runnerState === 'recovery' || isFailed;

  const failedSection = status?.sections?.find((s) => s.status === 'failed');
  const failedProviderSection: ProviderSection | null =
    failedSection &&
    (failedSection.type === 'journey' ||
      failedSection.type === 'architecture' ||
      failedSection.type === 'state_machine' ||
      failedSection.type === 'workflow' ||
      failedSection.type === 'wbs')
      ? (failedSection.type as ProviderSection)
      : null;

  const canRetryFailedSection = failedProviderSection && (failedSection?.attempts ?? 0) < 3;
  const canManualFailedSection = Boolean(failedProviderSection);

  const errorCode =
    error?.code ||
    (failedSection as any)?.safe_error_code ||
    failedSection?.error_code ||
    (typeof error?.message === 'string' && !error.message.includes(' ') ? error.message : null);

  const activeErrorPresentation = presentBlueprintError(errorCode);

  const getStatusChip = () => {
    if (isCompleted) {
      return (
        <Chip
          icon={<Iconify icon="solar:check-circle-bold" width={16} />}
          label="Generasi Selesai"
          color="success"
          variant="soft"
        />
      );
    }
    if (isRunning) {
      return (
        <Chip
          icon={<CircularProgress size={14} color="inherit" />}
          label="Sedang Berjalan"
          color="info"
          variant="soft"
        />
      );
    }
    if (isStopping) {
      return (
        <Chip
          icon={<CircularProgress size={14} color="inherit" />}
          label="Menghentikan..."
          color="warning"
          variant="soft"
        />
      );
    }
    if (needsRecovery) {
      return (
        <Chip
          icon={<Iconify icon="solar:danger-triangle-bold" width={16} />}
          label="Perlu Pemulihan"
          color="warning"
          variant="soft"
        />
      );
    }
    return <Chip label="Menunggu" color="default" variant="soft" />;
  };

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={4}>
        {/* Mobile Read-only Notice / Desktop Guidance */}
        <Alert
          severity="info"
          variant="outlined"
          sx={{ display: { xs: 'flex', md: 'none' } }}
          icon={<Iconify icon="solar:laptop-minimalistic-bold" />}
        >
          <AlertTitle>Petunjuk Tampilan Desktop</AlertTitle>
          Formulir pengisian manual dan penyusunan arsitektur blueprint dioptimalkan untuk layar
          desktop. Pada perangkat seluler, data disajikan dalam mode ringkasan read-only.
        </Alert>

        {/* Active Error Presentation Banner */}
        {activeErrorPresentation && (
          <Alert
            severity="error"
            action={
              activeErrorPresentation.action === 'settings' ? (
                <Button
                  color="inherit"
                  size="small"
                  variant="outlined"
                  onClick={() => navigate(paths.dashboard.quotation.aiSettings)}
                >
                  Buka Pengaturan
                </Button>
              ) : activeErrorPresentation.action === 'retry' && canRetryFailedSection ? (
                !isCompact ? (
                  <Button
                    color="inherit"
                    size="small"
                    variant="outlined"
                    onClick={() => handleRetrySection(failedProviderSection!)}
                  >
                    Coba Lagi
                  </Button>
                ) : undefined
              ) : activeErrorPresentation.action === 'manual' && canManualFailedSection ? (
                !isCompact ? (
                  <Button
                    color="inherit"
                    size="small"
                    variant="outlined"
                    onClick={() => handleOpenManual(failedProviderSection!)}
                  >
                    Lengkapi Manual
                  </Button>
                ) : undefined
              ) : activeErrorPresentation.action === 'refresh' ? (
                !isCompact ? (
                  <Button
                    color="inherit"
                    size="small"
                    variant="outlined"
                    onClick={handleRefresh}
                  >
                    Segarkan
                  </Button>
                ) : undefined
              ) : undefined
            }
          >
            <AlertTitle>{activeErrorPresentation.title}</AlertTitle>
            {activeErrorPresentation.message}
          </Alert>
        )}

        {/* Header Bar */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          aria-live="polite"
          aria-atomic="false"
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => navigate(paths.dashboard.blueprint.root)}
                sx={{ mr: 0.5 }}
                aria-label="Kembali ke Generator"
              >
                <Iconify icon="solar:arrow-left-bold" />
              </IconButton>
              <Typography variant="h4">{status?.title || 'Detail Blueprint Arsitektur'}</Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
              {getStatusChip()}
              <Chip
                size="small"
                label={`Revisi: ${status?.revision_id ?? '-'}`}
                variant="outlined"
              />
              <Chip
                size="small"
                label={`Versi Konten: v${status?.content_version ?? 1}`}
                variant="outlined"
              />
              <Chip
                size="small"
                label={status?.publication_status || 'Draft'}
                color={status?.publication_status === 'published' ? 'success' : 'default'}
                variant="soft"
              />
            </Stack>
          </Box>

          {/* Action Control Buttons */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            {/* Visual Editor button */}
            {blueprintId && !isRunning && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Iconify icon="solar:pen-new-square-bold" />}
                onClick={() => navigate(paths.dashboard.blueprint.edit(blueprintId))}
                sx={{ minHeight: 44 }}
                aria-label="Buka Visual Editor"
              >
                Editor Visual
              </Button>
            )}

            {/* Refresh button */}
            <Tooltip title="Segarkan Data dari Server">
              <span>
                <Button
                  variant="outlined"
                  color="inherit"
                  disabled={isFetching || isRunning}
                  startIcon={
                    isFetching ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Iconify icon="solar:refresh-bold" />
                    )
                  }
                  onClick={handleRefresh}
                  sx={{ minHeight: 44 }}
                  aria-label="Segarkan Data dari Server"
                >
                  Segarkan
                </Button>
              </span>
            </Tooltip>

            {/* Stop button */}
            {isRunning && (
              <Button
                variant="outlined"
                color="error"
                disabled={isStopping}
                startIcon={<Iconify icon="solar:stop-bold" />}
                onClick={stop}
                sx={{ minHeight: 44 }}
                aria-label="Hentikan Proses Generasi"
              >
                {isStopping ? 'Menghentikan...' : 'Hentikan'}
              </Button>
            )}

            {/* Recover button */}
            {needsRecovery && !isRunning && (
              <Button
                variant="contained"
                color="warning"
                startIcon={<Iconify icon="solar:shield-warning-bold" />}
                onClick={handleRecover}
                sx={{ minHeight: 44 }}
                aria-label="Periksa & Pulihkan"
              >
                Periksa & Pulihkan
              </Button>
            )}

            {/* Start / Continue button */}
            {!isCompleted && !isRunning && !needsRecovery && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Iconify icon="solar:play-bold" />}
                onClick={handleStart}
                sx={{ minHeight: 44 }}
                aria-label={
                  status?.generation_status === 'pending' ? 'Mulai Generasi' : 'Lanjutkan Generasi'
                }
              >
                {status?.generation_status === 'pending' ? 'Mulai Generasi' : 'Lanjutkan Generasi'}
              </Button>
            )}
          </Stack>
        </Stack>

        {/* Stale Lease Warning Banner */}
        {isStaleLease && (
          <Alert
            severity="warning"
            action={
              !isCompact ? (
                <Button
                  color="inherit"
                  size="small"
                  variant="outlined"
                  onClick={handleRecover}
                  sx={{ minHeight: 40 }}
                >
                  Pulihkan Pipeline
                </Button>
              ) : undefined
            }
          >
            <AlertTitle>Stale Lease Terdeteksi</AlertTitle>
            Pipeline tidak menerima pembaruan selama lebih dari 5 menit. Kunci eksekusi mungkin
            telah kadaluarsa.
          </Alert>
        )}

        {/* Runtime Error Banner */}
        {error && !activeErrorPresentation && (
          <Alert severity="error">
            <AlertTitle>Terjadi Kesalahan</AlertTitle>
            {error.message || 'Gagal memproses tahapan blueprint.'}
          </Alert>
        )}

        {/* Pipeline Canonical Section Status List */}
        <SectionStatusList
          sections={status?.sections}
          onRetry={isCompact ? undefined : handleRetrySection}
          onOpenManual={isCompact ? undefined : handleOpenManual}
          onOpenEditor={
            isCompact || !blueprintId
              ? undefined
              : (sec) =>
                  navigate(
                    paths.dashboard.blueprint.edit(blueprintId) + (sec ? `?section=${sec}` : '')
                  )
          }
          isRetrying={isFetching}
          disabled={isRunning || isCompact}
        />

        {/* Manual completion success prompt offering explicit Continue */}
        {showContinuePrompt && !isRunning && !isCompleted && (
          <Alert
            severity="success"
            action={
              !isCompact ? (
                <Button
                  color="inherit"
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="solar:play-bold" />}
                  onClick={() => {
                    setShowContinuePrompt(false);
                    handleStart();
                  }}
                  sx={{ minHeight: 40 }}
                >
                  Lanjutkan Generasi
                </Button>
              ) : undefined
            }
          >
            <AlertTitle>Tahap Berhasil Dilengkapi</AlertTitle>
            Data section telah disimpan dan tervalidasi. Klik &quot;Lanjutkan Generasi&quot; untuk
            meneruskan pembuatan blueprint ke tahap berikutnya.
          </Alert>
        )}

        {/* Tabs: Result Preview vs Validation Panel */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_: SyntheticEvent, v: 'preview' | 'validation') => setActiveTab(v)}
            >
              <Tab
                value="preview"
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon="solar:document-text-bold" width={18} />
                    <span>Preview Hasil Generasi</span>
                  </Stack>
                }
              />
              <Tab
                value="validation"
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon="solar:shield-check-bold" width={18} />
                    <span>Panel Validasi & Konsistensi</span>
                  </Stack>
                }
              />
            </Tabs>
          </Box>
          <CardContent sx={{ p: 2 }}>
            {activeTab === 'preview' ? (
              <BlueprintResultPreview contentJson={detail?.content_json} />
            ) : (
              <ValidationPanel
                validationResult={detail?.validation_result}
                crossValidationResult={detail?.cross_validation_result}
                onOpenManual={isCompact ? undefined : handleOpenManual}
                onFocusIssue={
                  isCompact || !blueprintId
                    ? undefined
                    : (issue) => {
                        const sec = mapToProviderSection(issue.section);
                        if (sec) {
                          navigate(paths.dashboard.blueprint.edit(blueprintId) + `?section=${sec}`);
                        }
                      }
                }
              />
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* Manual Completion Dialog for 5 sections */}
      <ManualCompletionDialog
        open={!isCompact && manualDialogOpen}
        onClose={() => setManualDialogOpen(false)}
        blueprintId={blueprintId || ''}
        section={selectedManualSection}
        detail={detail}
        status={status}
        onSuccess={handleManualSuccess}
        isBusy={isRunning}
      />
    </DashboardContent>
  );
}
