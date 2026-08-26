import type { OpenQuestion, OpenQuestionStatus, OpenQuestionSectionTarget } from '../types';

import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
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
  questionData: OpenQuestion | null;
  onClose: () => void;
  onSave: (question: OpenQuestion) => void;
  onDelete?: (questionId: string) => void;
};

const SECTION_OPTIONS: { value: OpenQuestionSectionTarget; label: string }[] = [
  { value: 'general', label: 'General / Seluruh Sistem' },
  { value: 'journey', label: '1. User Journey' },
  { value: 'architecture', label: '2. System Architecture' },
  { value: 'state_machine', label: '3. State Machine' },
  { value: 'workflow', label: '4. Business Workflows' },
  { value: 'wbs', label: '5. WBS Hierarchy' },
];

const STATUS_OPTIONS: {
  value: OpenQuestionStatus;
  label: string;
  color: 'warning' | 'success' | 'default';
}[] = [
  { value: 'open', label: 'Open (Menunggu Keputusan)', color: 'warning' },
  { value: 'answered', label: 'Answered (Telah Terjawab/Diputuskan)', color: 'success' },
  { value: 'deferred', label: 'Deferred (Ditunda ke Fase Lanjutan)', color: 'default' },
];

export function OpenQuestionDialog({ open, questionData, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<OpenQuestion>({
    id: '',
    question: '',
    target_section: 'general',
    impact: '',
    status: 'open',
  });

  useEffect(() => {
    if (open) {
      if (questionData) {
        setForm({ ...questionData });
      } else {
        setForm({
          id: `oq-${Date.now().toString(36)}`,
          question: '',
          target_section: 'general',
          impact: '',
          status: 'open',
        });
      }
    }
  }, [open, questionData]);

  const handleSave = () => {
    if (!form.id.trim() || !form.question.trim()) return;
    onSave(form);
    onClose();
  };

  const isEditing = Boolean(questionData);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Icon icon="solar:question-circle-bold" width={24} />
          <Typography variant="h6">
            {isEditing ? 'Edit Pertanyaan Terbuka' : 'Tambah Open Question'}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2.5 }}>
        <Stack spacing={2.5}>
          <TextField
            label="ID Pertanyaan"
            size="small"
            fullWidth
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            helperText="ID unik (misal: oq-tts-hardware)"
            disabled={isEditing}
          />

          <TextField
            label="Pertanyaan / Keraguan Desain"
            size="small"
            fullWidth
            multiline
            rows={3}
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            placeholder="Apa pertanyaan arsitektural atau fungsional yang memerlukan konfirmasi stakeholder?"
            required
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Target Seksi Terkait</InputLabel>
            <Select
              value={form.target_section}
              label="Target Seksi Terkait"
              onChange={(e) =>
                setForm({
                  ...form,
                  target_section: e.target.value as OpenQuestionSectionTarget,
                })
              }
            >
              {SECTION_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Dampak Teknis / Risiko (Impact)"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={form.impact}
            onChange={(e) => setForm({ ...form, impact: e.target.value })}
            placeholder="Bagaimana pertanyaan ini mempengaruhi arsitektur, SLA, atau alur kerja?"
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Status Resolusi</InputLabel>
            <Select
              value={form.status}
              label="Status Resolusi"
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as OpenQuestionStatus,
                })
              }
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={opt.value.toUpperCase()}
                      size="small"
                      color={opt.color}
                      sx={{ height: 20 }}
                    />
                    <span>{opt.label}</span>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
