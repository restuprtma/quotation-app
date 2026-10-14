import type { JSONContent } from '@tiptap/core';
import type {
  CatalogRoleOption,
  PromptPatchResponse,
  PromptQuotationState,
} from '../types/prompt-first';

import { toast } from 'sonner';
import { useNavigate, useBeforeUnload } from 'react-router';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { DashboardContent } from 'src/layouts/dashboard';

import { HistoryPanel } from '../components/HistoryPanel';
import { PublishDialog } from '../components/PublishDialog';
import { DocumentCanvas } from '../components/document-canvas';
import { QuotationEditor } from '../components/quotation-editor';
import { useQuotationDraft } from '../hooks/use-quotation-draft';
import { RegenerateDialog } from '../components/regenerate-dialog';
import { usePromptWorkspace } from '../hooks/use-prompt-workspace';
import { LegalUnlockDialog } from '../components/legal-unlock-dialog';
import { QuotationReadiness } from '../components/quotation-readiness';
import { PromptCommercialLock } from '../components/prompt-commercial-lock';
import { publishQuotation, createQuotationRevision } from '../api/lifecycle';
import { useSaveDraft, useRegenerateQuotation } from '../hooks/use-draft-save';
import { PromptRevisionBox, type PromptRevisionBoxCopy } from '../components/prompt-revision-box';
import {
  PromptWorkspacePanel,
  type PromptWorkspaceCopy,
} from '../components/prompt-workspace-panel';
import {
  type PromptEditorSession,
  createPromptEditorSession,
  promptEditorSessionReducer,
} from '../utils/prompt-editor-session';

type Props = {
  id?: string;
};

type SessionState = {
  quotationId: string;
  contentHtml: string;
  canonicalVersion: number;
  revisionId: string;
  isUnlocked: boolean;
  isDirty: boolean;
  isConflict: boolean;
  legalModified: boolean;
  commercialModified: boolean;
  promptState?: PromptQuotationState;
  promptStateVersion: number;
  promptCalculation?: PromptPatchResponse['calculation'];
  catalogRoles: CatalogRoleOption[];
};

function coreSession(session: SessionState | null): PromptEditorSession {
  if (!session) return createPromptEditorSession();
  return {
    quotationId: session.quotationId,
    revisionId: session.revisionId,
    contentHtml: session.contentHtml,
    contentVersion: session.canonicalVersion,
    isDirty: session.isDirty,
    isConflict: session.isConflict,
  };
}

function withCore(session: SessionState, core: PromptEditorSession): SessionState {
  return {
    ...session,
    quotationId: core.quotationId,
    revisionId: core.revisionId,
    contentHtml: core.contentHtml,
    canonicalVersion: core.contentVersion,
    isDirty: core.isDirty,
    isConflict: core.isConflict,
  };
}

function PromptEditorWorkspace({
  session,
  isReadOnly,
  onServerUpdate,
  onConflict,
}: {
  session: SessionState;
  isReadOnly?: boolean;
  onServerUpdate: (response: PromptPatchResponse) => void;
  onConflict: () => void;
}) {
  const { t } = useTranslate('quotation');
  const { patch, revise, isPending } = usePromptWorkspace({
    quotationId: session.quotationId,
    revisionId: session.revisionId,
    contentVersion: session.canonicalVersion,
    stateVersion: session.promptStateVersion,
    onResponse: onServerUpdate,
    onConflict,
  });
  const copy: PromptWorkspaceCopy = {
    title: t('editor.workspace.title'),
    open: t('editor.workspace.open'),
    close: t('editor.workspace.close'),
    facts: t('editor.workspace.facts'),
    issues: t('editor.workspace.issues'),
    blocking: t('editor.workspace.blocking'),
    warning: t('editor.workspace.warning'),
    duration: t('editor.workspace.duration'),
    team: t('editor.workspace.team'),
    role: t('editor.workspace.role'),
    seniority: t('editor.workspace.seniority'),
    headcount: t('editor.workspace.headcount'),
    payment: t('editor.workspace.payment'),
    discount: t('editor.workspace.discount'),
    initialTotal: t('editor.workspace.initialTotal'),
    discountedTotal: t('editor.workspace.discountedTotal'),
    priceUnavailable: t('editor.workspace.priceUnavailable'),
    subscriptionDetails: t('editor.workspace.subscriptionDetails'),
    subscriptionProduct: t('editor.workspace.subscriptionProduct'),
    subscriptionTerm: t('editor.workspace.subscriptionTerm'),
    subscriptionBilling: t('editor.workspace.subscriptionBilling'),
    subscriptionFeatures: t('editor.workspace.subscriptionFeatures'),
    totalContract: t('editor.workspace.totalContract'),
    whiteLabelDetails: t('editor.workspace.whiteLabelDetails'),
    whiteLabelProduct: t('editor.workspace.whiteLabelProduct'),
    whiteLabelLicenses: t('editor.workspace.whiteLabelLicenses'),
    whiteLabelMaintenance: t('editor.workspace.whiteLabelMaintenance'),
    whiteLabelHosting: t('editor.workspace.whiteLabelHosting'),
    whiteLabelRights: t('editor.workspace.whiteLabelRights'),
    maintenanceDetails: t('editor.workspace.maintenanceDetails'),
    maintenanceSystem: t('editor.workspace.maintenanceSystem'),
    maintenanceMode: t('editor.workspace.maintenanceMode'),
    maintenanceRetainerItems: t('editor.workspace.maintenanceRetainerItems'),
    maintenanceHourlyItems: t('editor.workspace.maintenanceHourlyItems'),
    maintenanceDefects: t('editor.workspace.maintenanceDefects'),
    maintenanceTasks: t('editor.workspace.maintenanceTasks'),
    maintenanceRights: t('editor.workspace.maintenanceRights'),
    totalInvestment: t('editor.workspace.totalInvestment'),
    reload: t('editor.workspace.reload'),
    compare: t('editor.workspace.compare'),
  };
  const revisionCopy: PromptRevisionBoxCopy = {
    title: t('editor.revision.title'),
    instruction: t('editor.revision.instruction'),
    target: t('editor.revision.target'),
    scope: t('editor.revision.scope'),
    timeline: t('editor.revision.timeline'),
    narrative: t('editor.revision.narrative'),
    preview: t('editor.revision.preview'),
    commercialPreview: t('editor.revision.commercialPreview'),
    submit: t('editor.revision.submit'),
    submitting: t('editor.revision.submitting'),
    required: t('editor.revision.required'),
  };

  return (
    <Stack spacing={2} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
      <PromptRevisionBox
        copy={revisionCopy}
        pending={isPending || Boolean(isReadOnly)}
        onSubmit={(instruction, target) => {
          if (isReadOnly) return Promise.resolve();
          return revise(instruction, target);
        }}
      />
      <PromptWorkspacePanel
        state={session.promptState!}
        calculation={session.promptCalculation}
        catalogRoles={session.catalogRoles}
        pending={isPending || Boolean(isReadOnly)}
        copy={copy}
        onPatch={(operations) => {
          if (isReadOnly) return;
          void patch(operations).catch(() => undefined);
        }}
        conflict={session.isConflict}
        onCompare={() => document.querySelector<HTMLElement>('[contenteditable="true"]')?.focus()}
        onReload={() => window.location.reload()}
      />
    </Stack>
  );
}

export function QuotationEditorView({ id = '' }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslate('quotation');

  const { data, isLoading, error, refetch } = useQuotationDraft(id);
  const saveMutation = useSaveDraft(id);
  const regenerateMutation = useRegenerateQuotation(id);

  const [session, setSession] = useState<SessionState | null>(null);
  const sessionRef = useRef<SessionState | null>(null);
  const [currentHtml, setCurrentHtml] = useState<string>('');
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState(false);
  const [isBlueprintWarningOpen, setIsBlueprintWarningOpen] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCreatingRevision, setIsCreatingRevision] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const isReadOnly = Boolean(
    data?.status === 'published' ||
    data?.status === 'signed' ||
    (data as any)?.publication_status === 'published' ||
    (data as any)?.publication_status === 'superseded'
  );

  sessionRef.current = session;

  // Initialize session state once data is loaded
  useEffect(() => {
    if (data) {
      const loaded = {
        type: 'serverLoaded' as const,
        quotationId: id,
        revisionId: data.revision_id || '',
        contentHtml: data.content_html || '',
        contentVersion: data.content_version || 1,
      };
      const nextCore = promptEditorSessionReducer(coreSession(sessionRef.current), loaded);
      setSession((previous) => {
        if (previous) {
          return {
            ...withCore(previous, promptEditorSessionReducer(coreSession(previous), loaded)),
            catalogRoles: data.catalog_roles ?? [],
          };
        }
        return {
          quotationId: id,
          contentHtml: nextCore.contentHtml,
          canonicalVersion: nextCore.contentVersion,
          revisionId: nextCore.revisionId,
          isUnlocked: false,
          isDirty: nextCore.isDirty,
          isConflict: nextCore.isConflict,
          legalModified: data.legal_content_modified ?? false,
          commercialModified: data.commercial_content_modified ?? false,
          promptState: data.prompt_state,
          promptStateVersion: data.prompt_state_version ?? 0,
          promptCalculation: undefined,
          catalogRoles: data.catalog_roles ?? [],
        };
      });
      setCurrentHtml(nextCore.contentHtml);
    }
  }, [data, id]);

  // Browser beforeunload guard when dirty
  useBeforeUnload(
    useCallback(
      (event) => {
        if (session?.isDirty) {
          event.preventDefault();
        }
      },
      [session?.isDirty]
    )
  );

  const handleEditorChange = useCallback(({ html }: { html: string; json: JSONContent }) => {
    setCurrentHtml(html);
    setSession((prev) => {
      if (!prev) return prev;
      return withCore(
        prev,
        promptEditorSessionReducer(coreSession(prev), { type: 'localChanged', contentHtml: html })
      );
    });
  }, []);

  const handlePromptServerUpdate = useCallback((response: PromptPatchResponse) => {
    setCurrentHtml(response.content_html);
    setSession((previous) => {
      if (!previous) return previous;
      const next = promptEditorSessionReducer(coreSession(previous), {
        type: 'saveSucceeded',
        contentHtml: response.content_html,
        contentVersion: response.content_version,
      });
      return {
        ...withCore(previous, next),
        revisionId: response.revision_id,
        promptState: response.prompt_state,
        promptStateVersion: response.state_version,
        promptCalculation: response.calculation,
        catalogRoles: response.catalog_roles ?? previous.catalogRoles,
      };
    });
  }, []);

  const handlePromptConflict = useCallback(() => {
    setSession((previous) => {
      if (!previous) return previous;
      return {
        ...withCore(
          previous,
          promptEditorSessionReducer(coreSession(previous), { type: 'versionConflict' })
        ),
        isUnlocked: false,
      };
    });
    toast.error(t('editor.dialog.conflictTitle'));
  }, [t]);

  // Save Draft Action
  const handleSaveDraft = async () => {
    if (!session || session.isConflict || saveMutation.isPending) return;

    try {
      const result = await saveMutation.mutateAsync({
        revision_id: session.revisionId,
        content_html: currentHtml,
        content_version: session.canonicalVersion,
      });

      setSession((prev) => {
        if (!prev) return prev;
        const next = promptEditorSessionReducer(coreSession(prev), {
          type: 'saveSucceeded',
          contentHtml: result.content_html,
          contentVersion: result.content_version,
        });
        return {
          ...withCore(prev, next),
          legalModified: result.legal_content_modified,
          commercialModified: result.commercial_content_modified,
        };
      });

      toast.success(t('editor.saved'));
    } catch (err: any) {
      if (err.status === 409 || err.message?.includes('409') || err.message?.includes('conflict')) {
        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...withCore(
              prev,
              promptEditorSessionReducer(coreSession(prev), { type: 'versionConflict' })
            ),
            isUnlocked: false,
          };
        });
        toast.error(t('editor.dialog.conflictTitle'));
      } else {
        toast.error(err.message || t('editor.saveFailed'));
      }
    }
  };

  // Unlock Legal Dialog Confirmation
  const handleConfirmUnlock = () => {
    setSession((prev) => (prev ? { ...prev, isUnlocked: true } : prev));
    toast.info(t('editor.legalUnlocked'));
  };

  // Toggle Legal Lock
  const handleToggleUnlock = () => {
    if (!session) return;
    if (session.isUnlocked) {
      setSession((prev) => (prev ? { ...prev, isUnlocked: false } : prev));
      toast.info(t('editor.legalLocked'));
    } else {
      setIsUnlockDialogOpen(true);
    }
  };

  // Restore Official Template Action
  const handleRestoreOfficial = () => {
    if (!data || !session) return;

    let snapshotHtml = '';
    const snapshot = data.legal_template_snapshot;
    if (typeof snapshot === 'string') {
      try {
        const parsed = JSON.parse(snapshot);
        snapshotHtml = parsed.content_html || snapshot;
      } catch {
        snapshotHtml = snapshot;
      }
    } else if (snapshot && typeof snapshot === 'object' && 'content_html' in snapshot) {
      snapshotHtml = (snapshot as { content_html?: string }).content_html || '';
    }

    if (!snapshotHtml) {
      toast.error(t('editor.restoreFailed'));
      return;
    }

    // Replace legal section in HTML
    const legalBlockRegex =
      /<section\s+[^>]*data-block-type=["']legal["'][^>]*>[\s\S]*?<\/section>/i;
    let newHtml = currentHtml;
    if (legalBlockRegex.test(newHtml)) {
      newHtml = newHtml.replace(legalBlockRegex, snapshotHtml.trim());
    } else {
      // Append if not found
      newHtml = `${newHtml}\n${snapshotHtml.trim()}`;
    }

    setCurrentHtml(newHtml);
    setSession((prev) => (prev ? { ...prev, isDirty: true } : prev));
    toast.success(t('editor.restoreSuccess'));
  };

  // Regenerate Confirmation
  const handleConfirmRegenerate = async () => {
    if (!id || regenerateMutation.isPending) return;

    try {
      const result = await regenerateMutation.mutateAsync();
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          contentHtml: result.content_html,
          canonicalVersion: result.content_version,
          legalModified: false,
          commercialModified: false,
          isUnlocked: false,
          isDirty: false,
          isConflict: false,
        };
      });
      setCurrentHtml(result.content_html);
      setIsRegenerateDialogOpen(false);
      toast.success(t('generationProgress.titleSuccess'));
    } catch (err: any) {
      toast.error(err.message || 'Regeneration failed');
    }
  };

  // In-app navigation guard
  const handleBackToPrompt = () => {
    if (session?.isDirty) {
      setIsUnsavedDialogOpen(true);
    } else {
      navigate(paths.dashboard.quotation.root);
    }
  };

  // Create Blueprint from currently viewed revision
  const handleCreateBlueprint = () => {
    if (!session || !id) return;
    if (session.isDirty) {
      setIsBlueprintWarningOpen(true);
    } else {
      navigate(
        `${paths.dashboard.blueprint.root}?quotation_id=${id}&revision_id=${session.revisionId}`
      );
    }
  };

  // Publish quotation draft
  const handlePublish = async (flags: {
    confirmLegalModified: boolean;
    confirmCommercialModified: boolean;
  }) => {
    if (!session) return;
    try {
      setIsPublishing(true);
      await publishQuotation(session.quotationId, {
        revision_id: session.revisionId,
        content_version: session.canonicalVersion,
        confirm_legal_modified: flags.confirmLegalModified,
        confirm_commercial_modified: flags.confirmCommercialModified,
      });
      toast.success('Quotation berhasil dipublikasikan!');
      setIsPublishDialogOpen(false);
      await refetch();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mempublikasikan quotation');
    } finally {
      setIsPublishing(false);
    }
  };

  // Create new revision from published quotation
  const handleCreateRevision = async () => {
    if (!session || isCreatingRevision) return;
    try {
      setIsCreatingRevision(true);
      await createQuotationRevision(session.quotationId);
      toast.success('Revisi baru berhasil dibuat');
      await refetch();
      navigate(paths.dashboard.quotation.edit(session.quotationId));
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat revisi baru');
    } finally {
      setIsCreatingRevision(false);
    }
  };

  const publicUrl = data?.public_token
    ? `${window.location.origin}${paths.public.quotation(data.public_token)}`
    : '';

  const handleCopyPublicLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success(t('editor.publicLinkCopied'));
    } catch {
      toast.error(t('editor.copyFailed', 'Gagal menyalin link'));
    }
  };

  const handleOpenPublicLink = () => {
    if (!publicUrl) return;
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={3}>
        {/* Header toolbar */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
              onClick={handleBackToPrompt}
            >
              {t('editor.backToPrompt')}
            </Button>
            <Typography variant="h4">{data?.subject || 'Quotation Editor'}</Typography>
          </Stack>

          {data && session && (
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              {isReadOnly && (
                <Chip
                  size="small"
                  label={t(
                    'read_only_notice',
                    'Revisi ini sudah dipublikasikan/usang dan bersifat read-only.'
                  )}
                  color="info"
                  variant="soft"
                  icon={<Iconify icon="solar:lock-bold" />}
                />
              )}
              {session.legalModified && (
                <Chip
                  size="small"
                  label={t('editor.legalModifiedBadge')}
                  color="warning"
                  variant="soft"
                  icon={<Iconify icon="eva:alert-circle-fill" />}
                />
              )}
              {session.commercialModified && (
                <Chip
                  size="small"
                  label={t('editor.commercialModifiedBadge')}
                  color="info"
                  variant="soft"
                />
              )}
              {session.isDirty && (
                <Chip
                  size="small"
                  label={t('editor.dirty')}
                  color="default"
                  variant="outlined"
                  sx={{ borderStyle: 'dashed' }}
                />
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
                <strong>{data.quotation_number}</strong> (v{session.canonicalVersion})
              </Typography>

              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="solar:history-bold" />}
                onClick={() => setIsHistoryOpen(true)}
              >
                {t('history', 'Riwayat')}
              </Button>

              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="solar:restart-bold" />}
                onClick={() => setIsRegenerateDialogOpen(true)}
                disabled={session.isConflict || regenerateMutation.isPending || isReadOnly}
              >
                {t('editor.regenerate')}
              </Button>

              <Button
                variant="outlined"
                color="primary"
                startIcon={<Iconify icon="solar:file-check-bold-duotone" />}
                onClick={handleCreateBlueprint}
                disabled={session.isConflict || !session.revisionId}
              >
                Buat Blueprint
              </Button>

              <Button
                variant="contained"
                color="primary"
                startIcon={
                  saveMutation.isPending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Iconify icon="eva:save-fill" />
                  )
                }
                onClick={handleSaveDraft}
                disabled={
                  isReadOnly ||
                  session.isConflict ||
                  !session.isDirty ||
                  saveMutation.isPending ||
                  regenerateMutation.isPending
                }
              >
                {saveMutation.isPending ? t('editor.saving') : t('editor.saveDraft')}
              </Button>

              {isReadOnly ? (
                <Stack direction="row" spacing={1}>
                  {Boolean(data?.public_token) && (
                    <>
                      <Button
                        variant="outlined"
                        color="inherit"
                        startIcon={<Iconify icon="eva:link-2-fill" />}
                        onClick={handleCopyPublicLink}
                      >
                        {t('editor.copyPublicLink')}
                      </Button>
                      <Button
                        variant="outlined"
                        color="info"
                        startIcon={<Iconify icon="eva:external-link-fill" />}
                        onClick={handleOpenPublicLink}
                      >
                        {t('editor.openPublicLink')}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={
                      isCreatingRevision ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <Iconify icon="solar:restart-bold" />
                      )
                    }
                    onClick={handleCreateRevision}
                    disabled={isCreatingRevision}
                  >
                    Buat Revisi Baru
                  </Button>
                </Stack>
              ) : (
                <Tooltip
                  title={
                    session.isDirty ? 'Simpan draft terlebih dahulu sebelum mempublikasikan' : ''
                  }
                >
                  <span>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={
                        isPublishing ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <Iconify icon="solar:check-circle-bold" />
                        )
                      }
                      onClick={() => setIsPublishDialogOpen(true)}
                      disabled={
                        session.isConflict ||
                        session.isDirty ||
                        saveMutation.isPending ||
                        isPublishing ||
                        isCreatingRevision
                      }
                    >
                      Publikasikan
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Stack>
          )}
        </Stack>

        {/* Content Body */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error" variant="subtitle1" sx={{ mb: 2 }}>
              Failed to load draft: {error.message}
            </Typography>
            <Button variant="outlined" onClick={() => refetch()}>
              Retry Load
            </Button>
          </Card>
        ) : session ? (
          <>
            {session.promptState && (
              <Stack spacing={1}>
                <QuotationReadiness readiness={session.promptState.readiness} />
                <PromptCommercialLock
                  message={t('editor.commercialLockHint')}
                  focusLabel={t('editor.focusEditor')}
                  onFocusEditor={() =>
                    document.querySelector<HTMLElement>('[contenteditable="true"]')?.focus()
                  }
                />
              </Stack>
            )}
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="stretch">
              <Box sx={{ minWidth: 0, flex: 1 }}>
                {isReadOnly ? (
                  <DocumentCanvas>
                    <Box
                      className="ProseMirror"
                      dangerouslySetInnerHTML={{ __html: session.contentHtml }}
                    />
                  </DocumentCanvas>
                ) : (
                  <QuotationEditor
                    content={currentHtml}
                    isUnlocked={session.isUnlocked}
                    disabled={session.isConflict || isReadOnly}
                    onToggleUnlock={handleToggleUnlock}
                    onRestoreOfficial={handleRestoreOfficial}
                    onChange={handleEditorChange}
                  />
                )}
              </Box>
              {session.promptState && (
                <PromptEditorWorkspace
                  session={session}
                  isReadOnly={isReadOnly}
                  onServerUpdate={handlePromptServerUpdate}
                  onConflict={handlePromptConflict}
                />
              )}
            </Stack>
          </>
        ) : null}
      </Stack>

      {/* Legal Block Unlock Confirmation Modal */}
      <LegalUnlockDialog
        open={isUnlockDialogOpen}
        onClose={() => setIsUnlockDialogOpen(false)}
        onConfirm={handleConfirmUnlock}
      />

      {/* Regenerate Confirmation Modal */}
      <RegenerateDialog
        open={isRegenerateDialogOpen}
        loading={regenerateMutation.isPending}
        onClose={() => setIsRegenerateDialogOpen(false)}
        onConfirm={handleConfirmRegenerate}
      />

      {/* Publish Confirmation Modal */}
      <PublishDialog
        open={isPublishDialogOpen}
        onClose={() => setIsPublishDialogOpen(false)}
        onPublish={handlePublish}
        isSubmitting={isPublishing}
        legalModified={session?.legalModified}
        commercialModified={session?.commercialModified}
        revisionNumber={session?.canonicalVersion}
      />

      {/* 409 Conflict Modal */}
      <Dialog open={Boolean(session?.isConflict)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="eva:alert-triangle-fill" width={24} sx={{ color: 'error.main' }} />
            <Typography variant="h6">{t('editor.dialog.conflictTitle')}</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText color="text.secondary" sx={{ typography: 'body2' }}>
            {t('editor.dialog.conflictMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => document.querySelector<HTMLElement>('[contenteditable="true"]')?.focus()}
          >
            {t('editor.dialog.conflictCompare')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="solar:restart-bold" />}
            onClick={() => window.location.reload()}
          >
            {t('editor.dialog.conflictReload')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unsaved Changes Navigation Confirmation Modal */}
      <Dialog
        open={isUnsavedDialogOpen}
        onClose={() => setIsUnsavedDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('editor.dialog.unsavedTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ typography: 'body2' }}>
            {t('editor.dialog.unsavedMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={() => setIsUnsavedDialogOpen(false)}>
            {t('editor.dialog.unsavedStay')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setIsUnsavedDialogOpen(false);
              navigate(paths.dashboard.quotation.root);
            }}
          >
            {t('editor.dialog.unsavedLeave')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Blueprint Unsaved Warning Modal */}
      <Dialog
        open={isBlueprintWarningOpen}
        onClose={() => setIsBlueprintWarningOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Buat Blueprint dari Revisi Tersimpan?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ typography: 'body2' }}>
            Perubahan pada editor draft belum disimpan. Pembuatan Blueprint akan menggunakan revisi
            tersimpan saat ini (v{session?.canonicalVersion}). Simpan draft terlebih dahulu jika
            Anda ingin menyertakan perubahan terbaru ke dalam Blueprint.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setIsBlueprintWarningOpen(false)}
          >
            Batal
          </Button>
          <Button
            variant="outlined"
            color="warning"
            onClick={() => {
              setIsBlueprintWarningOpen(false);
              navigate(
                `${paths.dashboard.blueprint.root}?quotation_id=${id}&revision_id=${session?.revisionId}`
              );
            }}
          >
            Lanjutkan Tanpa Simpan
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              setIsBlueprintWarningOpen(false);
              await handleSaveDraft();
              navigate(
                `${paths.dashboard.blueprint.root}?quotation_id=${id}&revision_id=${session?.revisionId}`
              );
            }}
          >
            Simpan &amp; Lanjutkan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revision History Drawer */}
      <HistoryPanel
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        quotationId={id}
        activePublishedRevisionId={(data as any)?.active_published_revision_id}
        currentRevisionId={session?.revisionId}
      />
    </DashboardContent>
  );
}
