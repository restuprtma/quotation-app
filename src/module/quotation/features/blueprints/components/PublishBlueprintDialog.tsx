import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

export interface SectionSummaryItem {
  type: string;
  status: string;
  title?: string;
}

export interface PublishBlueprintDialogProps {
  open: boolean;
  onClose: () => void;
  onPublish: (req: { confirmPartial: boolean; warningCodes: string[] }) => Promise<void> | void;
  isSubmitting?: boolean;
  completenessStatus?: 'complete' | 'partial' | string;
  sections?: SectionSummaryItem[];
  warningCodes?: string[];
  revisionNumber?: number;
}

export const CANONICAL_BLUEPRINT_SECTIONS = [
  { key: 'journey', label: 'User Journey' },
  { key: 'architecture', label: 'Architecture' },
  { key: 'state_machine', label: 'State Machine' },
  { key: 'workflow', label: 'Business Workflow' },
  { key: 'wbs', label: 'WBS' },
];

export function PublishBlueprintDialog({
  open,
  onClose,
  onPublish,
  isSubmitting = false,
  completenessStatus,
  sections = [],
  warningCodes = [],
  revisionNumber,
}: PublishBlueprintDialogProps) {
  const [confirmPartial, setConfirmPartial] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmPartial(false);
    }
  }, [open]);

  const hasIncompleteSection = CANONICAL_BLUEPRINT_SECTIONS.some((sec) => {
    const item = sections.find((s) => s.type === sec.key);
    return !item || (item.status !== 'completed' && item.status !== 'validated');
  });

  const isPartial =
    completenessStatus === 'partial' ||
    (completenessStatus !== 'complete' && (completenessStatus === 'incomplete' || hasIncompleteSection));

  const isPublishDisabled = Boolean(isSubmitting || (isPartial && !confirmPartial));

  const handlePublish = async () => {
    await onPublish({
      confirmPartial,
      warningCodes,
    });
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Publikasikan Blueprint</DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {revisionNumber !== undefined && (
            <Typography variant="body2" color="text.secondary">
              Revisi #{revisionNumber}
            </Typography>
          )}

          {/* Completeness Matrix */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Matriks Kelengkapan Section
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
              <Table size="small" aria-label="completeness matrix">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Section</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {CANONICAL_BLUEPRINT_SECTIONS.map((sec) => {
                    const item = sections.find((s) => s.type === sec.key);
                    const isDone = item?.status === 'completed' || item?.status === 'validated';
                    const isFailed = item?.status === 'failed';

                    return (
                      <TableRow key={sec.key}>
                        <TableCell>{item?.title || sec.label}</TableCell>
                        <TableCell align="right">
                          {isDone ? (
                            <Chip size="small" color="success" variant="soft" label="Selesai" />
                          ) : isFailed ? (
                            <Chip size="small" color="error" variant="soft" label="Gagal" />
                          ) : (
                            <Chip size="small" color="warning" variant="soft" label="Belum Selesai" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Warnings List */}
          {warningCodes.length > 0 && (
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Catatan / Warning ({warningCodes.length}):
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {warningCodes.map((code) => (
                  <Chip key={code} label={code} size="small" color="warning" variant="outlined" />
                ))}
              </Stack>
            </Stack>
          )}

          {/* Alert & Partial Checkbox */}
          {isPartial ? (
            <Stack spacing={1.5}>
              <Alert severity="warning">
                Blueprint belum lengkap (status: Parsial). Beberapa section belum selesai atau memiliki warning.
              </Alert>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={confirmPartial}
                    onChange={(e) => setConfirmPartial(e.target.checked)}
                    disabled={isSubmitting}
                  />
                }
                label="Saya mengonfirmasi publikasi blueprint parsial dan menerima seluruh catatan/warning terkait."
              />
            </Stack>
          ) : (
            <Alert severity="info">
              Seluruh section telah lengkap dan tervalidasi. Dokumen blueprint yang dipublikasikan akan bersifat resmi dan immutable.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={isSubmitting}>
          Batal
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handlePublish}
          disabled={isPublishDisabled}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Publikasikan
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PublishBlueprintDialog;
