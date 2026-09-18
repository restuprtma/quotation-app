import type {
  SectionType,
  ManualRequest,
  BlueprintDetail,
  BlueprintStatus,
  ProviderSection,
} from '../types';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import React, { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AlertTitle from '@mui/material/AlertTitle';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { useAuthContext } from 'src/module/core/features/auth/hooks';

import { WBSFields } from './manual/wbs-fields';
import { JourneyFields } from './manual/journey-fields';
import { WorkflowFields } from './manual/workflow-fields';
import { ArchitectureFields } from './manual/architecture-fields';
import { StateMachineFields } from './manual/state-machine-fields';
import { toManualPayload, fromManualPayload } from '../validation/manual-payload';
import { getBlueprint, getBlueprintStatus, completeBlueprintSection } from '../api';
import {
  wbsSectionSchema,
  journeySectionSchema,
  workflowSectionSchema,
  buildReferenceOptions,
  architectureSectionSchema,
  stateMachineSectionSchema,
} from '../validation/manual-section';

export const CANONICAL_SECTION_ORDER: SectionType[] = [
  'context',
  'journey',
  'architecture',
  'state_machine',
  'workflow',
  'wbs',
  'cross_validation',
];

export const SECTION_TITLES: Record<ProviderSection, string> = {
  journey: 'User Journey',
  architecture: 'Arsitektur Sistem',
  state_machine: 'State Machine',
  workflow: 'Workflow Bisnis',
  wbs: 'Work Breakdown Structure (WBS)',
};

export const SECTION_SCHEMAS: Record<ProviderSection, any> = {
  journey: journeySectionSchema,
  architecture: architectureSectionSchema,
  state_machine: stateMachineSectionSchema,
  workflow: workflowSectionSchema,
  wbs: wbsSectionSchema,
};

export function getDownstreamSections(section: ProviderSection): SectionType[] {
  const idx = CANONICAL_SECTION_ORDER.indexOf(section);
  if (idx === -1) return [];
  return CANONICAL_SECTION_ORDER.slice(idx + 1);
}

export interface ServerIssue {
  field?: string;
  message: string;
  code?: string;
}

export interface ManualCompletionDialogProps {
  open: boolean;
  onClose: () => void;
  blueprintId: string;
  section: ProviderSection | null;
  detail?: BlueprintDetail | null;
  status?: BlueprintStatus | null;
  onSuccess?: (updatedStatus?: BlueprintStatus) => void;
  onContinue?: () => void;
  isBusy?: boolean;
}

function getDefaultSectionValues(section: ProviderSection, detail?: BlueprintDetail | null): any {
  const content = detail?.content_json;
  if (!content) {
    switch (section) {
      case 'journey':
        return { journey: { phases: [], actors: [], activities: [] } };
      case 'architecture':
        return { architecture: { groups: [], nodes: [], edges: [] } };
      case 'state_machine':
        return { state_machine: { entity: '', initial_state: '', states: [], transitions: [] } };
      case 'workflow':
        return { workflows: [] };
      case 'wbs':
        return { wbs: { modules: [] }, cross_references: [] };
      default:
        return {};
    }
  }

  switch (section) {
    case 'journey':
      return content.journey
        ? fromManualPayload('journey', { journey: content.journey })
        : { journey: { phases: [], actors: [], activities: [] } };
    case 'architecture':
      return content.architecture
        ? fromManualPayload('architecture', { architecture: content.architecture })
        : { architecture: { groups: [], nodes: [], edges: [] } };
    case 'state_machine':
      return content.state_machine
        ? fromManualPayload('state_machine', { state_machine: content.state_machine })
        : { state_machine: { entity: '', initial_state: '', states: [], transitions: [] } };
    case 'workflow':
      return content.workflows
        ? fromManualPayload('workflow', { workflows: content.workflows })
        : { workflows: [] };
    case 'wbs':
      return content.wbs || content.cross_references
        ? fromManualPayload('wbs', {
            wbs: content.wbs || { modules: [] },
            cross_references: content.cross_references || [],
          })
        : { wbs: { modules: [] }, cross_references: [] };
    default:
      return {};
  }
}

function isSectionEmpty(section: ProviderSection, values: any): boolean {
  if (!values) return true;
  switch (section) {
    case 'journey': {
      const j = values.journey;
      return (
        !j ||
        ((j.phases?.length ?? 0) === 0 &&
          (j.actors?.length ?? 0) === 0 &&
          (j.activities?.length ?? 0) === 0)
      );
    }
    case 'architecture': {
      const a = values.architecture;
      return (
        !a ||
        ((a.groups?.length ?? 0) === 0 &&
          (a.nodes?.length ?? 0) === 0 &&
          (a.edges?.length ?? 0) === 0)
      );
    }
    case 'state_machine': {
      const sm = values.state_machine;
      return (
        !sm ||
        (!sm.entity &&
          !sm.initial_state &&
          (sm.states?.length ?? 0) === 0 &&
          (sm.transitions?.length ?? 0) === 0)
      );
    }
    case 'workflow': {
      const wf = values.workflows;
      return !wf || (Array.isArray(wf) && wf.length === 0);
    }
    case 'wbs': {
      const w = values.wbs;
      const xrefs = values.cross_references;
      return (!w || (w.modules?.length ?? 0) === 0) && (!xrefs || xrefs.length === 0);
    }
    default:
      return true;
  }
}

interface ManualCompletionFormContentProps {
  blueprintId: string;
  section: ProviderSection;
  detail?: BlueprintDetail | null;
  status?: BlueprintStatus | null;
  onSuccess?: (updatedStatus?: BlueprintStatus) => void;
  onClose: () => void;
  isBusy?: boolean;
  initialRevisionId: string;
  initialVersion: number;
}

function ManualCompletionFormContent({
  blueprintId,
  section,
  detail,
  status,
  onSuccess,
  onClose,
  isBusy = false,
  initialRevisionId,
  initialVersion,
}: ManualCompletionFormContentProps) {
  const { company } = useAuthContext();
  const companyId = company?.id ?? 'anonymous';
  const queryClient = useQueryClient();

  const [capturedRevisionId, setCapturedRevisionId] = useState<string>(initialRevisionId);
  const [capturedVersion, setCapturedVersion] = useState<number>(initialVersion);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<ServerIssue[]>([]);
  const [conflictError, setConflictError] = useState<{
    message: string;
    serverVersion?: number;
    serverStatus?: BlueprintStatus;
    serverDetail?: BlueprintDetail;
  } | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showReloadConfirm, setShowReloadConfirm] = useState(false);
  const [isReloadingLatest, setIsReloadingLatest] = useState(false);
  const [downstreamConfirmed, setDownstreamConfirmed] = useState(false);
  const [clientValidationFailed, setClientValidationFailed] = useState(false);

  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const clientSummaryRef = useRef<HTMLDivElement>(null);
  const dialogTitleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => dialogTitleRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!clientValidationFailed) return undefined;
    const frame = requestAnimationFrame(() => clientSummaryRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [clientValidationFailed]);

  const schema = SECTION_SCHEMAS[section];

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: getDefaultSectionValues(section, detail),
    mode: 'onChange',
    shouldFocusError: false,
  });

  const {
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, errors },
  } = methods;

  const currentValues = watch();
  const empty = isSectionEmpty(section, currentValues);

  const hasLocalChanges = useMemo(() => {
    if (isDirty) return true;
    try {
      const initial = getDefaultSectionValues(section, detail);
      return (
        JSON.stringify(toManualPayload(section, currentValues)) !==
        JSON.stringify(toManualPayload(section, initial))
      );
    } catch {
      return false;
    }
  }, [isDirty, section, detail, currentValues]);

  const isStableSection = useMemo(() => {
    const effectiveStatus = status || detail?.status;
    const secStatus = effectiveStatus?.sections?.find((s) => s.type === section);
    return secStatus?.status === 'completed';
  }, [section, status, detail]);

  const downstreamSections = useMemo(() => getDownstreamSections(section), [section]);

  const referenceOptions = useMemo(
    () => buildReferenceOptions(detail?.content_json, currentValues),
    [detail?.content_json, currentValues]
  );

  const handleRequestClose = () => {
    if (hasLocalChanges) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    onClose();
  };

  const onSubmit = async (formData: any) => {
    if (!section || !blueprintId || !capturedRevisionId || capturedVersion === null) {
      return;
    }

    if (isStableSection && !downstreamConfirmed) {
      return;
    }

    setIsSubmitting(true);
    setClientValidationFailed(false);
    setServerErrors([]);
    setConflictError(null);

    try {
      const payloadContent = toManualPayload(section, formData);
      const requestEnvelope: ManualRequest<typeof payloadContent> = {
        revision_id: capturedRevisionId,
        content_version: capturedVersion,
        content: payloadContent,
      };

      const updatedStatus = await completeBlueprintSection(blueprintId, section, requestEnvelope);

      queryClient.invalidateQueries({
        queryKey: ['blueprints', companyId, 'status', blueprintId],
      });
      queryClient.invalidateQueries({
        queryKey: ['blueprints', companyId, 'detail', blueprintId],
      });

      toast.success(
        `Tahap "${SECTION_TITLES[section]}" berhasil disimpan dan divalidasi oleh sistem.`
      );

      if (onSuccess) {
        onSuccess(updatedStatus);
      }
      onClose();
    } catch (err: any) {
      const httpStatus = err?.response?.status;
      const errorData = err?.response?.data;

      if (httpStatus === 422) {
        const rawErrors = errorData?.errors || [];
        const issues: ServerIssue[] = [];

        if (Array.isArray(rawErrors)) {
          rawErrors.forEach((e: any) => {
            if (typeof e === 'string') {
              issues.push({ message: e });
            } else if (typeof e === 'object' && e !== null) {
              issues.push({
                field: e.field || e.path,
                message: e.message || e.detail || JSON.stringify(e),
                code: e.code,
              });
            }
          });
        } else if (typeof rawErrors === 'string') {
          issues.push({ message: rawErrors });
        } else if (errorData?.message) {
          issues.push({ message: errorData.message });
        }

        setServerErrors(issues);
        setTimeout(() => {
          errorSummaryRef.current?.focus();
        }, 50);
      } else if (httpStatus === 409) {
        try {
          const [latestStat, latestDet] = await Promise.all([
            getBlueprintStatus(blueprintId),
            getBlueprint(blueprintId),
          ]);
          setConflictError({
            message:
              errorData?.message || 'Versi blueprint di server telah diperbarui oleh proses lain.',
            serverVersion: latestStat.content_version,
            serverStatus: latestStat,
            serverDetail: latestDet,
          });
        } catch {
          setConflictError({
            message:
              errorData?.message || 'Versi blueprint di server telah diperbarui oleh proses lain.',
          });
        }
      } else {
        toast.error(
          err?.message || errorData?.message || 'Gagal menyimpan tahap manual blueprint.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReloadLatest = async () => {
    if (!section || !blueprintId) return;
    setIsReloadingLatest(true);

    try {
      let latestStat = conflictError?.serverStatus;
      let latestDet = conflictError?.serverDetail;

      if (!latestStat || !latestDet) {
        [latestStat, latestDet] = await Promise.all([
          getBlueprintStatus(blueprintId),
          getBlueprint(blueprintId),
        ]);
      }

      setCapturedRevisionId(latestStat.revision_id);
      setCapturedVersion(latestStat.content_version);

      const refreshedValues = getDefaultSectionValues(section, latestDet);
      reset(refreshedValues);

      setConflictError(null);
      setServerErrors([]);
      setShowReloadConfirm(false);
      toast.success(
        `Data versi terbaru (v${latestStat.content_version}) berhasil dimuat dari server.`
      );
    } catch (err: any) {
      toast.error('Gagal memuat data terbaru dari server: ' + (err.message || 'Error'));
    } finally {
      setIsReloadingLatest(false);
    }
  };

  return (
    <>
      <DialogTitle ref={dialogTitleRef} tabIndex={-1} sx={{ pb: 1.5 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Box>
            <Typography variant="h5">Lengkapi Manual: {SECTION_TITLES[section]}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
              <Chip size="small" label={`Revisi: ${capturedRevisionId}`} variant="outlined" />
              <Chip
                size="small"
                label={`Versi Konten saat buka: v${capturedVersion}`}
                color="primary"
                variant="outlined"
              />
              {isStableSection && (
                <Chip
                  size="small"
                  label="Tahap Sudah Selesai (Koreksi)"
                  color="warning"
                  variant="soft"
                />
              )}
            </Stack>
          </Box>

          <IconButton onClick={handleRequestClose} size="small" disabled={isSubmitting}>
            <Iconify icon="solar:close-circle-bold" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 2.5 }}>
        <Stack spacing={2.5}>
          {/* 409 Conflict Banner */}
          {conflictError && (
            <Alert
              severity="warning"
              action={
                <Button
                  color="inherit"
                  size="small"
                  variant="outlined"
                  onClick={() => setShowReloadConfirm(true)}
                >
                  Muat Versi Terbaru
                </Button>
              }
            >
              <AlertTitle>Konflik Versi Terdeteksi (409)</AlertTitle>
              Versi blueprint di server telah diperbarui (v
              {conflictError.serverVersion ?? capturedVersion + 1}). Data input lokal Anda tetap
              aman tersimpan. Anda dapat memilih &quot;Muat Versi Terbaru&quot; untuk menyelaraskan
              dengan server (akan membuang perubahan lokal).
            </Alert>
          )}

          {/* 422 Server Errors Summary */}
          {serverErrors.length > 0 && (
            <Alert severity="error" tabIndex={-1} ref={errorSummaryRef} sx={{ outline: 'none' }}>
              <AlertTitle>Validasi Server Gagal (422)</AlertTitle>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Terdapat ketidaksesuaian data dengan standar validasi blueprint:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {serverErrors.map((err, idx) => (
                  <li key={idx}>
                    <Typography variant="caption" fontWeight={600}>
                      {err.field ? `[${err.field}] ` : ''}
                    </Typography>
                    <Typography variant="caption">{err.message}</Typography>
                  </li>
                ))}
              </Box>
            </Alert>
          )}

          {/* Client-side form validation error summary */}
          {(clientValidationFailed || Object.keys(errors).length > 0) && (
            <Alert severity="error" tabIndex={-1} ref={clientSummaryRef}>
              <AlertTitle>Validasi Form Gagal</AlertTitle>
              Silakan periksa kembali field yang bertanda merah sebelum menyimpan.
            </Alert>
          )}

          {/* Empty section warning */}
          {empty && (
            <Alert severity="info" icon={<Iconify icon="solar:info-circle-bold" />}>
              <AlertTitle>Section Masih Kosong</AlertTitle>
              Bagian {SECTION_TITLES[section]} saat ini masih kosong. Silakan tambahkan baris data
              bisnis agar dapat tervalidasi oleh pipeline.
            </Alert>
          )}

          {/* Downstream Invalidation Warning Banner for Stable Section */}
          {isStableSection && (
            <Alert severity="warning" icon={<Iconify icon="solar:danger-triangle-bold" />}>
              <AlertTitle>Peringatan: Mengubah tahap yang sudah selesai</AlertTitle>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Menyimpan perubahan pada tahap ini akan membatalkan status validasi dan mengulang
                tahap-tahap hilir (downstream) berikut:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                {downstreamSections.map((sec) => (
                  <Chip
                    key={sec}
                    size="small"
                    label={
                      sec === 'cross_validation'
                        ? 'Validasi Silang'
                        : sec === 'context'
                          ? 'Konteks'
                          : SECTION_TITLES[sec as ProviderSection]
                    }
                    color="warning"
                    variant="outlined"
                  />
                ))}
              </Stack>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={downstreamConfirmed}
                    onChange={(e) => setDownstreamConfirmed(e.target.checked)}
                    color="warning"
                  />
                }
                label="Saya mengonfirmasi bahwa perubahan ini akan mengulang tahap-tahap hilir terkait"
              />
            </Alert>
          )}

          {/* Form Fields wrapped in FormProvider */}
          <FormProvider {...methods}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              {section === 'journey' && <JourneyFields referenceOptions={referenceOptions} />}
              {section === 'architecture' && (
                <ArchitectureFields referenceOptions={referenceOptions} />
              )}
              {section === 'state_machine' && (
                <StateMachineFields referenceOptions={referenceOptions} />
              )}
              {section === 'workflow' && <WorkflowFields referenceOptions={referenceOptions} />}
              {section === 'wbs' && <WBSFields referenceOptions={referenceOptions} />}
            </Box>
          </FormProvider>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleRequestClose} color="inherit" disabled={isSubmitting}>
          Batal
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={isSubmitting || isBusy || (isStableSection && !downstreamConfirmed)}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Iconify icon="solar:disk-bold" />
            )
          }
          onClick={handleSubmit(onSubmit, () => {
            setClientValidationFailed(true);
          })}
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan & Validasi'}
        </Button>
      </DialogActions>

      {/* Discard Changes Confirmation Dialog */}
      <Dialog open={showDiscardConfirm} onClose={() => setShowDiscardConfirm(false)}>
        <DialogTitle>Tutup Form Pengisian?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Perubahan belum disimpan. Yakin ingin menutup dialog ini dan membuang perubahan?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDiscardConfirm(false)} color="inherit">
            Kembali ke Form
          </Button>
          <Button onClick={handleConfirmDiscard} color="error" variant="contained">
            Buang Perubahan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Discard & Reload Latest Version Dialog */}
      <Dialog open={showReloadConfirm} onClose={() => setShowReloadConfirm(false)}>
        <DialogTitle>Konfirmasi Muat Versi Terbaru</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Tindakan ini akan membuang perubahan lokal yang belum tersimpan dan memuat data versi
            terbaru dari server. Lanjutkan?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowReloadConfirm(false)}
            color="inherit"
            disabled={isReloadingLatest}
          >
            Batal
          </Button>
          <Button
            onClick={handleReloadLatest}
            color="warning"
            variant="contained"
            disabled={isReloadingLatest}
            startIcon={
              isReloadingLatest ? <CircularProgress size={14} color="inherit" /> : undefined
            }
          >
            Konfirmasi Muat Terbaru
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function ManualCompletionDialog({
  open,
  onClose,
  blueprintId,
  section,
  detail,
  status,
  onSuccess,
  isBusy = false,
}: ManualCompletionDialogProps) {
  const effectiveStatus = status || detail?.status;
  const currentRevisionId = effectiveStatus?.revision_id ?? null;
  const currentVersion = effectiveStatus?.content_version ?? null;

  const [capturedState, setCapturedState] = useState<{
    revisionId: string;
    version: number;
    section: ProviderSection;
  } | null>(null);

  useEffect(() => {
    if (open && section && currentRevisionId && currentVersion !== null) {
      setCapturedState((prev) => {
        if (!prev || prev.section !== section) {
          return {
            revisionId: currentRevisionId,
            version: currentVersion,
            section,
          };
        }
        return prev;
      });
    } else if (!open) {
      setCapturedState(null);
    }
  }, [open, section, currentRevisionId, currentVersion]);

  if (!open) return null;

  // Guard: if detail and status are not yet loaded, show loading guard and do NOT guess version 1!
  if (!effectiveStatus || !section || !capturedState) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CircularProgress size={20} />
            <Typography variant="h6">Memuat data blueprint...</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Menyiapkan informasi versi dan konten terkini dari server...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Batal
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth disableEscapeKeyDown>
      <ManualCompletionFormContent
        key={section}
        blueprintId={blueprintId}
        section={section}
        detail={detail}
        status={status}
        onSuccess={onSuccess}
        onClose={onClose}
        isBusy={isBusy}
        initialRevisionId={capturedState.revisionId}
        initialVersion={capturedState.version}
      />
    </Dialog>
  );
}
