import type { CrossReference, CrossReferenceRelationType } from '../types';

import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  xrefData: CrossReference | null;
  onClose: () => void;
  onSave: (xref: CrossReference) => void;
  onDelete?: (xrefId: string) => void;
};

const RELATION_OPTIONS: { value: CrossReferenceRelationType; label: string; desc: string }[] = [
  {
    value: 'implements',
    label: 'implements (Mengimplementasikan)',
    desc: 'Misal: Activity diimplementasikan oleh Architecture Node / Service',
  },
  {
    value: 'transitions_on',
    label: 'transitions_on (Memicu Transisi State)',
    desc: 'Misal: Activity memicu perpindahan status State Machine',
  },
  {
    value: 'interacts_with',
    label: 'interacts_with (Berinteraksi Dengan)',
    desc: 'Misal: Node arsitektur berkomunikasi dengan node eksternal',
  },
  {
    value: 'deploys_to',
    label: 'deploys_to (Dideploy Pada)',
    desc: 'Misal: Service dideploy ke Container/Infrastructure node',
  },
  {
    value: 'depends_on',
    label: 'depends_on (Bergantung Pada)',
    desc: 'Misal: Hardware device bergantung pada software service',
  },
];

export function CrossReferenceDialog({ open, xrefData, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<CrossReference>({
    id: '',
    source_ref: '',
    target_ref: '',
    relation_type: 'implements',
    description: '',
  });

  useEffect(() => {
    if (open) {
      if (xrefData) {
        setForm({ ...xrefData });
      } else {
        setForm({
          id: `xref-${Date.now().toString(36)}`,
          source_ref: '',
          target_ref: '',
          relation_type: 'implements',
          description: '',
        });
      }
    }
  }, [open, xrefData]);

  const handleSave = () => {
    if (!form.id.trim() || !form.source_ref.trim() || !form.target_ref.trim()) return;
    onSave(form);
    onClose();
  };

  const isEditing = Boolean(xrefData);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Icon icon="solar:link-circle-bold" width={24} />
          <Typography variant="h6">
            {isEditing ? 'Edit Cross Reference' : 'Tambah Cross Reference'}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2.5 }}>
        <Stack spacing={2.5}>
          <TextField
            label="ID Cross Reference"
            size="small"
            fullWidth
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            helperText="ID unik (misal: xref-booking-to-arch)"
            disabled={isEditing}
          />

          <TextField
            label="Source Reference (Entitas Asal)"
            size="small"
            fullWidth
            value={form.source_ref}
            onChange={(e) => setForm({ ...form, source_ref: e.target.value })}
            placeholder="e.g. journey.activity.act-online-booking"
            helperText="Format: seksi.entitas.id (misal journey.activity.act-1, architecture.node.node-1)"
            required
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Tipe Relasi (Relation Type)</InputLabel>
            <Select
              value={form.relation_type}
              label="Tipe Relasi (Relation Type)"
              onChange={(e) =>
                setForm({
                  ...form,
                  relation_type: e.target.value as CrossReferenceRelationType,
                })
              }
            >
              {RELATION_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {opt.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {opt.desc}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Target Reference (Entitas Tujuan)"
            size="small"
            fullWidth
            value={form.target_ref}
            onChange={(e) => setForm({ ...form, target_ref: e.target.value })}
            placeholder="e.g. architecture.node.node-booking-service"
            helperText="Format: seksi.entitas.id (misal state.state-called, wbs.module.mod-queue-core)"
            required
          />

          <TextField
            label="Deskripsi Relasi"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Penjelasan konteks keterhubungan antara kedua entitas..."
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Box>
          {isEditing && onDelete && (
            <Button
              color="error"
              variant="text"
              startIcon={<Icon icon="solar:trash-bin-minimalistic-bold" />}
              onClick={() => {
                onDelete(form.id);
                onClose();
              }}
            >
              Hapus
            </Button>
          )}
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            Batal
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Simpan
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
