import { useState, useEffect } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

export interface PublishDialogProps {
  open: boolean;
  onClose: () => void;
  onPublish: (flags: {
    confirmLegalModified: boolean;
    confirmCommercialModified: boolean;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
  legalModified?: boolean;
  commercialModified?: boolean;
  revisionNumber?: number;
}

export function PublishDialog({
  open,
  onClose,
  onPublish,
  isSubmitting = false,
  legalModified = false,
  commercialModified = false,
  revisionNumber,
}: PublishDialogProps) {
  const [confirmLegalModified, setConfirmLegalModified] = useState(false);
  const [confirmCommercialModified, setConfirmCommercialModified] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmLegalModified(false);
      setConfirmCommercialModified(false);
    }
  }, [open]);

  const isPublishDisabled = Boolean(
    isSubmitting ||
      (legalModified && !confirmLegalModified) ||
      (commercialModified && !confirmCommercialModified)
  );

  const handlePublish = async () => {
    await onPublish({
      confirmLegalModified,
      confirmCommercialModified,
    });
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Publikasikan Quotation</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {revisionNumber !== undefined && (
            <Typography variant="body2" color="text.secondary">
              Revisi #{revisionNumber}
            </Typography>
          )}

          {legalModified && (
            <Stack spacing={1}>
              <Alert severity="warning">
                Perubahan klausul legal terdeteksi. Harap konfirmasi sebelum mempublikasikan.
              </Alert>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={confirmLegalModified}
                    onChange={(e) => setConfirmLegalModified(e.target.checked)}
                    disabled={isSubmitting}
                  />
                }
                label="Saya mengonfirmasi perubahan pada klausul legal / pasal khusus."
              />
            </Stack>
          )}

          {commercialModified && (
            <Stack spacing={1}>
              <Alert severity="warning">
                Perubahan komersial / harga manual terdeteksi. BA bertanggung jawab penuh atas perubahan harga ini.
              </Alert>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={confirmCommercialModified}
                    onChange={(e) => setConfirmCommercialModified(e.target.checked)}
                    disabled={isSubmitting}
                  />
                }
                label="Saya mengonfirmasi perubahan nilai komersial / harga manual."
              />
            </Stack>
          )}

          {!legalModified && !commercialModified && (
            <Alert severity="info">
              Quotation yang dipublikasikan bersifat resmi dan immutable (tidak dapat diubah lagi). Perubahan selanjutnya harus melalui revisi baru.
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

export default PublishDialog;
