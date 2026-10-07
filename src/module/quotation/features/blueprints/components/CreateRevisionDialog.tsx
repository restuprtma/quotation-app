import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import RadioGroup from '@mui/material/RadioGroup';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

export interface QuotationRevisionSelectOption {
  id: string;
  version_number: number;
  status: string;
}

export interface CreateRevisionDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateRevision: (req: {
    mode: 'clone' | 'regenerate_from_source';
    sourceQuotationRevId?: string;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
  quotationRevisions?: QuotationRevisionSelectOption[];
  currentSourceQuotationRevId?: string;
}

export function CreateRevisionDialog({
  open,
  onClose,
  onCreateRevision,
  isSubmitting = false,
  quotationRevisions = [],
  currentSourceQuotationRevId,
}: CreateRevisionDialogProps) {
  const [mode, setMode] = useState<'clone' | 'regenerate_from_source'>('clone');
  const [selectedSourceRevId, setSelectedSourceRevId] = useState<string>('');

  useEffect(() => {
    if (open) {
      setMode('clone');
      if (quotationRevisions.length > 0) {
        const defaultRev =
          (currentSourceQuotationRevId &&
            quotationRevisions.find((r) => r.id === currentSourceQuotationRevId)) ||
          [...quotationRevisions].sort((a, b) => b.version_number - a.version_number)[0];
        setSelectedSourceRevId(defaultRev?.id ?? quotationRevisions[0].id);
      } else {
        setSelectedSourceRevId('');
      }
    }
  }, [open, currentSourceQuotationRevId, quotationRevisions]);

  const handleCreate = async () => {
    await onCreateRevision({
      mode,
      sourceQuotationRevId:
        mode === 'regenerate_from_source' ? selectedSourceRevId || undefined : undefined,
    });
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Buat Revisi Blueprint</DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Pilih metode pembuatan revisi draft baru untuk blueprint ini:
          </Typography>

          <RadioGroup
            value={mode}
            onChange={(e) => setMode(e.target.value as 'clone' | 'regenerate_from_source')}
          >
            <FormControlLabel
              value="clone"
              control={<Radio disabled={isSubmitting} />}
              label={
                <Box sx={{ my: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Klon Revisi Aktif
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Salin data dan section dari revisi aktif yang sudah dipublikasikan untuk diedit
                    manual.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', mb: 1.5 }}
            />

            <FormControlLabel
              value="regenerate_from_source"
              control={<Radio disabled={isSubmitting} />}
              label={
                <Box sx={{ my: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Generate Ulang dari Quotation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Buat draft baru berdasarkan quotation revision terbaru.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start' }}
            />
          </RadioGroup>

          {mode === 'regenerate_from_source' && quotationRevisions.length > 0 && (
            <FormControl fullWidth size="small" sx={{ mt: 1, pl: 4 }}>
              <InputLabel id="select-quotation-rev-label">Revisi Quotation Sumber</InputLabel>
              <Select
                native
                labelId="select-quotation-rev-label"
                id="select-quotation-rev"
                value={selectedSourceRevId}
                label="Revisi Quotation Sumber"
                onChange={(e) => setSelectedSourceRevId(e.target.value)}
                disabled={isSubmitting}
                inputProps={{ 'aria-label': 'Revisi Quotation Sumber' }}
              >
                {quotationRevisions.map((rev) => (
                  <option key={rev.id} value={rev.id}>
                    Revisi #{rev.version_number} ({rev.status})
                  </option>
                ))}
              </Select>
            </FormControl>
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
          onClick={handleCreate}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Buat Revisi
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateRevisionDialog;
