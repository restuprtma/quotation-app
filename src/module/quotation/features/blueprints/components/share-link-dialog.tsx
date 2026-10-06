import type { CreateShareLinkPayload, CreateShareLinkResponse } from '../types/share-links';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';

import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';

export interface ShareLinkDialogProps {
  open: boolean;
  onClose: () => void;
  revisions: Array<{ id: string; revision_number: number; publication_status: string }>;
  onCreate: (payload: CreateShareLinkPayload) => Promise<CreateShareLinkResponse>;
}

export function ShareLinkDialog({ open, onClose, revisions, onCreate }: ShareLinkDialogProps) {
  const eligibleRevisions = revisions.filter(
    (r) => r.publication_status === 'published' || r.publication_status === 'superseded'
  );

  const [selectedRevId, setSelectedRevId] = useState<string>(eligibleRevisions[0]?.id || '');
  const [label, setLabel] = useState(() =>
    eligibleRevisions[0]
      ? `Programmer - Revisi ${eligibleRevisions[0].revision_number}`
      : 'Programmer Access'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState<CreateShareLinkResponse | null>(null);

  useEffect(() => {
    if (eligibleRevisions.length > 0) {
      if (!selectedRevId || !eligibleRevisions.some((r) => r.id === selectedRevId)) {
        const first = eligibleRevisions[0];
        setSelectedRevId(first.id);
        setLabel(`Programmer - Revisi ${first.revision_number}`);
      }
    }
  }, [eligibleRevisions, selectedRevId]);

  const handleRevisionChange = (newRevId: string) => {
    setSelectedRevId(newRevId);
    const rev = eligibleRevisions.find((r) => r.id === newRevId);
    if (rev && (!label || label.startsWith('Programmer - Revisi ') || label === 'Programmer Access')) {
      setLabel(`Programmer - Revisi ${rev.revision_number}`);
    }
  };

  const handleCreate = async () => {
    if (!selectedRevId || !label.trim()) return;
    try {
      setIsSubmitting(true);
      const res = await onCreate({
        blueprint_revision_id: selectedRevId,
        label: label.trim(),
      });
      setCreatedResult(res);
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat tautan berbagi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!createdResult?.url) return;
    navigator.clipboard.writeText(createdResult.url);
    toast.success('Tautan berhasil disalin ke clipboard');
  };

  const handleClose = () => {
    setCreatedResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Bagikan Blueprint</DialogTitle>
      <DialogContent>
        {createdResult ? (
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Alert severity="warning">
              URL ini hanya ditampilkan satu kali. Harap salin dan simpan dengan aman sekarang.
            </Alert>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'background.neutral',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                wordBreak: 'break-all',
              }}
            >
              {createdResult.url}
            </Box>
            <TextField
              label="Public Share URL"
              value={createdResult.url}
              fullWidth
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleCopy}
                      startIcon={<Iconify icon="solar:copy-bold" />}
                    >
                      Salin
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        ) : (
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Pilih revisi yang telah dipublikasikan dan berikan label untuk tautan berbagi programmer.
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Pilih Revisi</InputLabel>
              <Select
                value={selectedRevId}
                label="Pilih Revisi"
                onChange={(e) => handleRevisionChange(e.target.value)}
              >
                {eligibleRevisions.map((rev) => (
                  <MenuItem key={rev.id} value={rev.id}>
                    Revisi {rev.revision_number} ({rev.publication_status})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Label Tautan"
              size="small"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="mis. Backend Team - Revisi 2"
              fullWidth
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          {createdResult ? 'Selesai' : 'Batal'}
        </Button>
        {!createdResult && (
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={isSubmitting || !selectedRevId || !label.trim()}
          >
            {isSubmitting ? 'Membuat...' : 'Buat Tautan'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
