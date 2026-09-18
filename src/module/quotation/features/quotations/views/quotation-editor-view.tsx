import type { JSONContent } from '@tiptap/core';

import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useBeforeUnload } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
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

import { QuotationEditor } from '../components/quotation-editor';
import { useQuotationDraft } from '../hooks/use-quotation-draft';
import { RegenerateDialog } from '../components/regenerate-dialog';
import { LegalUnlockDialog } from '../components/legal-unlock-dialog';
import { useSaveDraft, useRegenerateQuotation } from '../hooks/use-draft-save';

type Props = {
  id?: string;
};

type SessionState = {
  contentHtml: string;
  canonicalVersion: number;
  revisionId: string;
  isUnlocked: boolean;
  isDirty: boolean;
  isConflict: boolean;
  legalModified: boolean;
  commercialModified: boolean;
};

export function QuotationEditorView({ id = '' }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslate('quotation');

  const { data, isLoading, error, refetch } = useQuotationDraft(id);
  const saveMutation = useSaveDraft(id);
  const regenerateMutation = useRegenerateQuotation(id);

  const [session, setSession] = useState<SessionState | null>(null);
  const [currentHtml, setCurrentHtml] = useState<string>('');
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState(false);
  const [isBlueprintWarningOpen, setIsBlueprintWarningOpen] = useState(false);

  // Initialize session state once data is loaded
  useEffect(() => {
    if (data) {
      setSession({
        contentHtml: data.content_html || '',
        canonicalVersion: data.content_version || 1,
        revisionId: data.revision_id || '',
        isUnlocked: false,
        isDirty: false,
        isConflict: false,
        legalModified: data.legal_content_modified ?? false,
        commercialModified: data.commercial_content_modified ?? false,
      });
      setCurrentHtml(data.content_html || '');
    }
  }, [data]);

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
      const dirty = html !== prev.contentHtml;
      return { ...prev, isDirty: dirty };
    });
  }, []);

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
        return {
          ...prev,
          contentHtml: result.content_html,
          canonicalVersion: result.content_version,
          legalModified: result.legal_content_modified,
          commercialModified: result.commercial_content_modified,
          isDirty: false,
        };
      });

      toast.success(t('editor.saved'));
    } catch (err: any) {
      if (err.status === 409 || err.message?.includes('409') || err.message?.includes('conflict')) {
        setSession((prev) => (prev ? { ...prev, isConflict: true, isUnlocked: false } : prev));
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
    const legalBlockRegex = /<section\s+[^>]*data-block-type=["']legal["'][^>]*>[\s\S]*?<\/section>/i;
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
                startIcon={<Iconify icon="solar:restart-bold" />}
                onClick={() => setIsRegenerateDialogOpen(true)}
                disabled={session.isConflict || regenerateMutation.isPending}
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
                  session.isConflict ||
                  !session.isDirty ||
                  saveMutation.isPending ||
                  regenerateMutation.isPending
                }
              >
                {saveMutation.isPending ? t('editor.saving') : t('editor.saveDraft')}
              </Button>
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
          <QuotationEditor
            content={currentHtml}
            isUnlocked={session.isUnlocked}
            disabled={session.isConflict}
            onToggleUnlock={handleToggleUnlock}
            onRestoreOfficial={handleRestoreOfficial}
            onChange={handleEditorChange}
          />
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
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setIsUnsavedDialogOpen(false)}
          >
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
            tersimpan saat ini (v{session?.canonicalVersion}). Simpan draft terlebih dahulu jika Anda
            ingin menyertakan perubahan terbaru ke dalam Blueprint.
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
    </DashboardContent>
  );
}
