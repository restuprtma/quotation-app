import type { SyntheticEvent } from 'react';
import type { ProviderSection } from '../types';
import type { Journey, Architecture } from '../types/bundle';

import { useParams, useNavigate } from 'react-router';
import React, { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { useTheme } from '@mui/material/styles';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { DashboardContent } from 'src/layouts/dashboard';
import { LoadingScreen } from 'src/shared/ui/loading-screen';

import { JourneyEditor } from '../components/journey-editor';
import { ArchitectureEditor } from '../components/architecture-editor';
import { useBlueprintDraftSave } from '../hooks/use-blueprint-draft-save';
import {
  useBlueprintDetail,
  useBlueprintStatus,
  useCompleteBlueprintSection,
} from '../hooks/use-blueprint';
import {
  ValidationPanel,
  mapToProviderSection,
  type ValidationIssue,
} from '../components/validation-panel';
import {
  journeySectionSchema,
  buildReferenceOptions,
  architectureSectionSchema,
} from '../validation/manual-section';

// ----------------------------------------------------------------------

export interface BlueprintEditorViewProps {
  blueprintId?: string;
  initialSection?: ProviderSection;
}

export function BlueprintEditorView({
  blueprintId: propBlueprintId,
  initialSection = 'journey',
}: BlueprintEditorViewProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const params = useParams<{ id: string }>();
  const blueprintId = propBlueprintId || params.id;

  // Active section tab
  const [activeSection, setActiveSection] = useState<ProviderSection>(initialSection);
  const [activeTab, setActiveTab] = useState<'editor' | 'validation'>('editor');
  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);

  // Queries & Mutations
  const {
    data: detail,
    isLoading: isDetailLoading,
    error: detailError,
    refetch: refetchDetail,
  } = useBlueprintDetail(blueprintId);

  const { data: status } = useBlueprintStatus(blueprintId);
  const draftSaveMutation = useBlueprintDraftSave(blueprintId, activeSection);
  const completeMutation = useCompleteBlueprintSection();

  // Local editor content buffers
  const [localJourney, setLocalJourney] = useState<Journey | null>(null);
  const [initialServerJourneyJson, setInitialServerJourneyJson] = useState<string>('');

  const [localArchitecture, setLocalArchitecture] = useState<Architecture | null>(null);
  const [initialServerArchitectureJson, setInitialServerArchitectureJson] = useState<string>('');

  const [isDirty, setIsDirty] = useState<boolean>(false);
  const loadedVersionRef = useRef<number | null>(null);

  // Dialog states
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [unsavedLeaveModalOpen, setUnsavedLeaveModalOpen] = useState(false);
  const [completionValidationErrors, setCompletionValidationErrors] = useState<string[]>([]);
  const [completionValidationModalOpen, setCompletionValidationModalOpen] = useState(false);

  // Initialize / Sync local buffer from server detail
  useEffect(() => {
    if (!detail) return;
    const currentVersion = detail.status?.content_version ?? 1;

    if (loadedVersionRef.current !== currentVersion) {
      loadedVersionRef.current = currentVersion;

      const journeyData = detail.content_json?.journey || {
        phases: [],
        actors: [],
        activities: [],
      };
      setLocalJourney(journeyData);
      setInitialServerJourneyJson(JSON.stringify(journeyData));

      const archData = detail.content_json?.architecture || {
        groups: [],
        nodes: [],
        edges: [],
      };
      setLocalArchitecture(archData);
      setInitialServerArchitectureJson(JSON.stringify(archData));

      setIsDirty(false);
    }
  }, [detail]);

  // Handle local change from JourneyEditor
  const handleJourneyChange = useCallback(
    (updatedJourney: Journey) => {
      setLocalJourney(updatedJourney);
      const isChanged = JSON.stringify(updatedJourney) !== initialServerJourneyJson;
      setIsDirty(isChanged);
    },
    [initialServerJourneyJson]
  );

  // Handle local change from ArchitectureEditor
  const handleArchitectureChange = useCallback(
    (updatedArch: Architecture) => {
      setLocalArchitecture(updatedArch);
      const isChanged = JSON.stringify(updatedArch) !== initialServerArchitectureJson;
      setIsDirty(isChanged);
    },
    [initialServerArchitectureJson]
  );

  // Dirty navigation window warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Back button handler
  const handleBackToOverview = () => {
    if (isDirty) {
      setUnsavedLeaveModalOpen(true);
    } else {
      navigate(paths.dashboard.blueprint.detail(blueprintId || ''));
    }
  };

  const handleConfirmLeave = () => {
    setUnsavedLeaveModalOpen(false);
    navigate(paths.dashboard.blueprint.detail(blueprintId || ''));
  };

  // Save Draft Action (Separate from manual completion)
  const handleSaveDraft = async () => {
    if (!blueprintId || !detail || isCompact) return;

    try {
      const revisionId = detail.status?.revision_id || status?.revision_id || '';
      const contentVersion =
        loadedVersionRef.current ?? (detail.status?.content_version || status?.content_version || 1);

      let draftContent: any = {};
      if (activeSection === 'journey' && localJourney) {
        draftContent = { journey: localJourney };
      } else if (activeSection === 'architecture' && localArchitecture) {
        draftContent = { architecture: localArchitecture };
      }

      const updatedDetail = await draftSaveMutation.mutateAsync({
        revision_id: revisionId,
        content_version: contentVersion,
        content: draftContent,
      });

      // On 200 success: server detail returned, update version ref & clear dirty
      if (updatedDetail?.status?.content_version) {
        loadedVersionRef.current = updatedDetail.status.content_version;
      }

      if (activeSection === 'journey' && updatedDetail?.content_json?.journey) {
        setLocalJourney(updatedDetail.content_json.journey);
        setInitialServerJourneyJson(JSON.stringify(updatedDetail.content_json.journey));
      } else if (activeSection === 'architecture' && updatedDetail?.content_json?.architecture) {
        setLocalArchitecture(updatedDetail.content_json.architecture);
        setInitialServerArchitectureJson(JSON.stringify(updatedDetail.content_json.architecture));
      }
      setIsDirty(false);
      toast.success(
        `Draft ${activeSection === 'journey' ? 'User Journey' : 'Arsitektur'} berhasil disimpan.`
      );
    } catch (err: any) {
      const statusCode = err?.response?.status || err?.status;
      if (statusCode === 409) {
        // Version conflict: preserve local buffer, show conflict dialog
        setConflictModalOpen(true);
        toast.error('Konflik versi terdeteksi (409): Perubahan di server mendahului draft ini.');
      } else if (statusCode === 422) {
        // 422 schema/security rejection: preserve local buffer
        toast.error(
          'Gagal menyimpan draft (422): Struktur data tidak valid atau melanggar keamanan.'
        );
      } else {
        toast.error('Gagal menyimpan draft: ' + (err.message || 'Unknown error'));
      }
    }
  };

  // Reload Server Version on 409 conflict
  const handleReloadServerVersion = async () => {
    setConflictModalOpen(false);
    const result = await refetchDetail();
    if (result.data) {
      loadedVersionRef.current = result.data.status?.content_version ?? null;
      if (activeSection === 'journey' && result.data.content_json?.journey) {
        setLocalJourney(result.data.content_json.journey);
        setInitialServerJourneyJson(JSON.stringify(result.data.content_json.journey));
      } else if (activeSection === 'architecture' && result.data.content_json?.architecture) {
        setLocalArchitecture(result.data.content_json.architecture);
        setInitialServerArchitectureJson(JSON.stringify(result.data.content_json.architecture));
      }
      setIsDirty(false);
      toast.success('Data versi server berhasil dimuat.');
    }
  };

  // Manual Completion Action (Authoritative strict validation & sets validated)
  const handleCompleteSection = async () => {
    if (!blueprintId || !detail || isCompact) return;

    // 1. Client-side Zod validation
    let validation: any;
    let completePayload: any = {};

    if (activeSection === 'journey' && localJourney) {
      validation = journeySectionSchema.safeParse({ journey: localJourney });
      completePayload = { journey: localJourney };
    } else if (activeSection === 'architecture' && localArchitecture) {
      validation = architectureSectionSchema.safeParse({ architecture: localArchitecture });
      completePayload = { architecture: localArchitecture };
    }

    if (validation && !validation.success) {
      const errorMessages = validation.error.issues.map(
        (iss: any) => `${iss.path.join('.')}: ${iss.message}`
      );
      setCompletionValidationErrors(errorMessages);
      setCompletionValidationModalOpen(true);
      return;
    }

    // 2. Submit to authoritative manual completion endpoint
    try {
      const revisionId = detail.status?.revision_id || status?.revision_id || '';
      const contentVersion =
        loadedVersionRef.current ?? (detail.status?.content_version || status?.content_version || 1);

      await completeMutation.mutateAsync({
        id: blueprintId,
        section: activeSection,
        input: {
          revision_id: revisionId,
          content_version: contentVersion,
          content: completePayload,
        },
      });

      setIsDirty(false);
      toast.success(
        `Tahap ${
          activeSection === 'journey' ? 'User Journey' : 'Arsitektur Sistem'
        } berhasil diselesaikan dan divalidasi!`
      );
      await refetchDetail();
    } catch (err: any) {
      toast.error('Gagal menyelesaikan tahap: ' + (err.message || 'Error validasi backend'));
    }
  };

  // Issue Focus deep link handler
  const handleFocusIssue = (issue: ValidationIssue) => {
    const sec = mapToProviderSection(issue.section);
    if (sec) {
      setActiveSection(sec);
      setActiveTab('editor');
      if (issue.target_id) {
        setFocusTargetId(issue.target_id);
      }
    }
  };

  // Loading state
  if (isDetailLoading && !detail) {
    return <LoadingScreen />;
  }

  // Error / 404 state
  if (detailError && !detail) {
    return (
      <DashboardContent maxWidth="xl">
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
          <Card sx={{ maxWidth: 500, p: 4, textAlign: 'center' }}>
            <Iconify
              icon="solar:danger-triangle-bold"
              width={64}
              sx={{ color: 'error.main', mb: 2 }}
            />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Blueprint Tidak Ditemukan
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Data blueprint tidak dapat dimuat atau telah dihapus.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate(paths.dashboard.blueprint.root)}
              startIcon={<Iconify icon="solar:arrow-left-bold" />}
            >
              Kembali ke Daftar Blueprint
            </Button>
          </Card>
        </Box>
      </DashboardContent>
    );
  }

  const blueprintTitle = detail?.status?.title || status?.title || 'Blueprint Editor';
  const revisionId = detail?.status?.revision_id || status?.revision_id || '-';
  const contentVersion = detail?.status?.content_version || status?.content_version || 1;
  const sections = status?.sections || detail?.status?.sections || [];
  const currentSectionMeta = sections.find((s) => s.type === activeSection);
  const isCompleted =
    currentSectionMeta?.status === 'validated' || currentSectionMeta?.status === 'completed';

  const referenceOptions = buildReferenceOptions(detail?.content_json || {});
  const rawIssues = (detail?.validation_result?.issues || []) as any[];

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={3}>
        {/* Navigation Breadcrumb / Top Bar */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Button
            size="small"
            startIcon={<Iconify icon="solar:arrow-left-bold" />}
            onClick={handleBackToOverview}
          >
            Kembali ke Overview Blueprint
          </Button>

          {isDirty && (
            <Chip
              size="small"
              color="warning"
              variant="filled"
              icon={<Iconify icon="solar:pen-bold" />}
              label="Belum Disimpan"
            />
          )}
        </Stack>

        {/* Mobile Read-only Banner */}
        {isCompact && (
          <Alert severity="warning" variant="outlined">
            <AlertTitle>Tampilan Terbatas (Perangkat Mobile)</AlertTitle>
            Visual editor hanya mendukung pengeditan penuh pada desktop. Mode saat ini adalah
            read-only / peninjauan tanpa kemampuan modifikasi langsung.
          </Alert>
        )}

        {/* Section Failed Recovery Notice */}
        {currentSectionMeta?.status === 'failed' && (
          <Alert severity="error">
            <AlertTitle>Tahap Memerlukan Perbaikan</AlertTitle>
            Tahap ini gagal pada proses pembuatan otomatis. Anda dapat melengkapi dan menyusun
            struktur secara manual melalui Visual Editor di bawah, lalu klik{' '}
            <strong>Selesaikan Section</strong> untuk melanjutkan pipeline ke tahap berikutnya.
          </Alert>
        )}

        {/* Shell Header: Title & Meta Chips */}
        <Card sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                Visual Editor — {blueprintTitle}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  size="small"
                  label={`Revisi: ${revisionId}`}
                  color="default"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={`Versi Konten: v${contentVersion}`}
                  color="info"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={`Status Tahap: ${currentSectionMeta?.status || 'pending'}`}
                  color={
                    currentSectionMeta?.status === 'validated' ||
                    currentSectionMeta?.status === 'completed'
                      ? 'success'
                      : currentSectionMeta?.status === 'manual_edit'
                        ? 'warning'
                        : 'default'
                  }
                  variant="soft"
                />
              </Stack>
            </Box>

            {/* Action Buttons */}
            {!isCompact && (
              <Stack direction="row" spacing={1.5}>
                {/* Save Draft Button */}
                <Button
                  variant="outlined"
                  color="warning"
                  disabled={draftSaveMutation.isPending || isCompleted}
                  startIcon={
                    draftSaveMutation.isPending ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Iconify icon="solar:diskette-bold" />
                    )
                  }
                  onClick={handleSaveDraft}
                  aria-label="Simpan Draft"
                >
                  {draftSaveMutation.isPending ? 'Menyimpan...' : 'Simpan Draft'}
                </Button>

                {/* Mark Completed Button */}
                <Button
                  variant="contained"
                  color="primary"
                  disabled={completeMutation.isPending || isCompleted}
                  startIcon={
                    completeMutation.isPending ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Iconify icon="solar:check-circle-bold" />
                    )
                  }
                  onClick={handleCompleteSection}
                  aria-label="Selesaikan Section"
                >
                  {completeMutation.isPending ? 'Memvalidasi...' : 'Selesaikan Section'}
                </Button>
              </Stack>
            )}
          </Stack>
        </Card>

        {/* Section Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeSection}
            onChange={(_: SyntheticEvent, v: ProviderSection) => {
              setActiveSection(v);
              setFocusTargetId(null);
            }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab value="journey" label="1. User Journey" />
            <Tab value="architecture" label="2. Arsitektur Sistem" />
            <Tab value="state_machine" label="3. State Machine" disabled />
            <Tab value="workflow" label="4. Workflow Bisnis" disabled />
            <Tab value="wbs" label="5. WBS Deliverable" disabled />
          </Tabs>
        </Box>

        {/* View Mode Tabs: Visual Editor vs Validation Panel */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_: SyntheticEvent, v: 'editor' | 'validation') => setActiveTab(v)}
            >
              <Tab
                value="editor"
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon="solar:pen-new-square-bold" width={18} />
                    <span>Visual Matrix Editor</span>
                  </Stack>
                }
              />
              <Tab
                value="validation"
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon="solar:shield-check-bold" width={18} />
                    <span>Panel Validasi Server</span>
                  </Stack>
                }
              />
            </Tabs>
          </Box>

          <CardContent sx={{ p: 2 }}>
            {activeTab === 'editor' ? (
              activeSection === 'journey' ? (
                localJourney ? (
                  <JourneyEditor
                    journey={localJourney}
                    onChange={handleJourneyChange}
                    referenceOptions={referenceOptions}
                    issues={rawIssues}
                    readOnly={isCompact}
                  />
                ) : (
                  <LoadingScreen />
                )
              ) : activeSection === 'architecture' ? (
                localArchitecture ? (
                  <ArchitectureEditor
                    architecture={localArchitecture}
                    onChange={handleArchitectureChange}
                    referenceOptions={referenceOptions}
                    issues={rawIssues}
                    focusTargetId={focusTargetId}
                    readOnly={isCompact}
                  />
                ) : (
                  <LoadingScreen />
                )
              ) : (
                <Alert severity="info">Editor untuk tahap ini sedang dipersiapkan.</Alert>
              )
            ) : (
              <ValidationPanel
                validationResult={detail?.validation_result}
                crossValidationResult={detail?.cross_validation_result}
                onFocusIssue={handleFocusIssue}
              />
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* 409 Version Conflict Modal */}
      <Dialog
        open={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="solar:danger-triangle-bold" />
          Konflik Versi Terdeteksi (409)
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Data di server telah diperbarui oleh sesi atau proses lain. Perubahan lokal Anda tetap
            tersimpan di buffer editor saat ini.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pilih <strong>&quot;Muat Versi Server&quot;</strong> jika ingin menimpa buffer lokal
            dengan data terbaru server, atau pilih{' '}
            <strong>&quot;Pertahankan Perubahan Lokal&quot;</strong> untuk terus mengedit.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConflictModalOpen(false)} color="inherit">
            Pertahankan Perubahan Lokal
          </Button>
          <Button onClick={handleReloadServerVersion} color="warning" variant="contained">
            Muat Versi Server
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unsaved Leave Confirmation Dialog */}
      <Dialog
        open={unsavedLeaveModalOpen}
        onClose={() => setUnsavedLeaveModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Perubahan Belum Disimpan</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Anda memiliki perubahan pada draft yang belum disimpan. Yakin ingin keluar dan membuang
            perubahan lokal?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnsavedLeaveModalOpen(false)} color="inherit">
            Batal
          </Button>
          <Button onClick={handleConfirmLeave} color="error" variant="contained">
            Tinggalkan Halaman
          </Button>
        </DialogActions>
      </Dialog>

      {/* Completion Zod Validation Error Modal */}
      <Dialog
        open={completionValidationModalOpen}
        onClose={() => setCompletionValidationModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="solar:close-circle-bold" />
          Validasi Tahap Belum Lengkap
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Tahap ini belum memenuhi struktur validasi minimum untuk diselesaikan:
          </Typography>
          <Stack spacing={1}>
            {completionValidationErrors.map((errMsg, idx) => (
              <Alert severity="error" key={idx} sx={{ py: 0.5 }}>
                {errMsg}
              </Alert>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompletionValidationModalOpen(false)} variant="contained">
            Perbaiki
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
