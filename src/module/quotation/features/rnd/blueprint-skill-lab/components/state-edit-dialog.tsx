import type { StateNode, StateType, StateTransition } from '../types';

import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  editMode: 'state' | 'transition';
  stateData: StateNode | null;
  transitionData: StateTransition | null;
  isInitialState?: boolean;
  allStates: StateNode[];
  onClose: () => void;
  onSaveState: (state: StateNode, isInitial: boolean) => void;
  onSaveTransition: (transition: StateTransition) => void;
  onDeleteState?: (stateId: string) => void;
  onDeleteTransition?: (transitionId: string) => void;
};

const STATE_TYPES: { value: StateType; label: string }[] = [
  { value: 'normal', label: 'Normal State (Transisi Aktif)' },
  { value: 'terminal', label: 'Terminal State (State Akhir/Selesai)' },
  { value: 'exception', label: 'Exception State (Kegagalan/Dilewati/Batal)' },
];

export function StateEditDialog({
  open,
  editMode,
  stateData,
  transitionData,
  isInitialState = false,
  allStates,
  onClose,
  onSaveState,
  onSaveTransition,
  onDeleteState,
  onDeleteTransition,
}: Props) {
  // State form
  const [stateForm, setStateForm] = useState<StateNode>({
    id: '',
    label: '',
    type: 'normal',
    layout: { x: 100, y: 100 },
  });
  const [isInitial, setIsInitial] = useState(false);

  // Transition form
  const [transitionForm, setTransitionForm] = useState<StateTransition>({
    id: '',
    source: '',
    target: '',
    event: '',
    actor: '',
    guard: '',
    actions: [],
  });
  const [actionInput, setActionInput] = useState('');

  useEffect(() => {
    if (editMode === 'state') {
      if (stateData) {
        setStateForm(stateData);
        setIsInitial(isInitialState);
      } else {
        setStateForm({
          id: `state-${Date.now().toString(36)}`,
          label: '',
          type: 'normal',
          layout: { x: 100, y: 100 },
        });
        setIsInitial(allStates.length === 0);
      }
    } else if (transitionData) {
      setTransitionForm(transitionData);
      setActionInput('');
    } else {
      setTransitionForm({
        id: `trans-${Date.now().toString(36)}`,
        source: allStates[0]?.id || '',
        target: allStates[1]?.id || allStates[0]?.id || '',
        event: '',
        actor: '',
        guard: '',
        actions: [],
      });
      setActionInput('');
    }
  }, [editMode, stateData, transitionData, isInitialState, allStates, open]);

  const handleAddAction = () => {
    if (actionInput.trim()) {
      setTransitionForm((prev) => ({
        ...prev,
        actions: [...prev.actions, actionInput.trim()],
      }));
      setActionInput('');
    }
  };

  const handleRemoveAction = (index: number) => {
    setTransitionForm((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    if (editMode === 'state') {
      if (!stateForm.label.trim()) return;
      onSaveState(stateForm, isInitial);
    } else {
      if (!transitionForm.event.trim() || !transitionForm.source || !transitionForm.target) return;
      onSaveTransition(transitionForm);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          {editMode === 'state'
            ? stateData
              ? 'Edit State'
              : 'Tambah State Baru'
            : transitionData
              ? 'Edit State Transition'
              : 'Tambah State Transition'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Icon icon="solar:close-circle-bold" width={24} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {editMode === 'state' ? (
            <>
              <TextField
                label="State ID"
                value={stateForm.id}
                disabled
                size="small"
                helperText="Kanonikal identifier unik (^state-[a-z0-9-]+$)"
              />

              <TextField
                label="State Label / Name"
                value={stateForm.label}
                onChange={(e) =>
                  setStateForm((prev) => ({ ...prev, label: e.target.value.toUpperCase() }))
                }
                required
                fullWidth
                placeholder="e.g. BOOKED, WAITING, SERVING, COMPLETED"
                helperText="Nama state (biasanya format uppercase)"
              />

              <FormControl fullWidth size="small">
                <InputLabel>State Type</InputLabel>
                <Select
                  value={stateForm.type}
                  label="State Type"
                  onChange={(e) =>
                    setStateForm((prev) => ({
                      ...prev,
                      type: e.target.value as StateType,
                    }))
                  }
                >
                  {STATE_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={isInitial}
                    onChange={(e) => setIsInitial(e.target.checked)}
                    color="warning"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Jadikan Initial State
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      State awal tempat lifecycle entitas pertama kali dimulai
                    </Typography>
                  </Box>
                }
              />
            </>
          ) : (
            <>
              <TextField
                label="Transition ID"
                value={transitionForm.id}
                disabled
                size="small"
                helperText="Kanonikal identifier unik (^trans-[a-z0-9-]+$)"
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Source State (Dari)</InputLabel>
                  <Select
                    value={transitionForm.source}
                    label="Source State (Dari)"
                    onChange={(e) =>
                      setTransitionForm((prev) => ({ ...prev, source: e.target.value }))
                    }
                  >
                    {allStates.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.label} ({s.id})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Target State (Menuju)</InputLabel>
                  <Select
                    value={transitionForm.target}
                    label="Target State (Menuju)"
                    onChange={(e) =>
                      setTransitionForm((prev) => ({ ...prev, target: e.target.value }))
                    }
                  >
                    {allStates.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.label} ({s.id})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TextField
                label="Trigger Event"
                value={transitionForm.event}
                onChange={(e) =>
                  setTransitionForm((prev) => ({ ...prev, event: e.target.value.toUpperCase() }))
                }
                required
                fullWidth
                placeholder="e.g. CALL_NEXT, SCAN_QR, FINISH_SERVICE"
                helperText="Nama event / trigger perpindahan state (format UPPER_CASE)"
              />

              <TextField
                label="Actor / Role Pemicu"
                value={transitionForm.actor}
                onChange={(e) => setTransitionForm((prev) => ({ ...prev, actor: e.target.value }))}
                fullWidth
                placeholder="e.g. Petugas Loket, Pemohon Layanan, Sistem Otomasi"
              />

              <TextField
                label="Guard Condition (Prasyarat)"
                value={transitionForm.guard}
                onChange={(e) => setTransitionForm((prev) => ({ ...prev, guard: e.target.value }))}
                fullWidth
                placeholder="e.g. Counter is idle, CallCount >= 3, Verification passed"
                helperText="Kondisi logika yang wajib terpenuhi sebelum transisi dieksekusi"
              />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Side Effects / Actions
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Tambah aksi (misal: Trigger TTS announcement)"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAction();
                      }
                    }}
                  />
                  <Button variant="outlined" size="small" onClick={handleAddAction}>
                    Tambah
                  </Button>
                </Stack>

                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {transitionForm.actions.map((act, index) => (
                    <Chip
                      key={index}
                      label={act}
                      size="small"
                      color="primary"
                      variant="soft"
                      onDelete={() => handleRemoveAction(index)}
                    />
                  ))}
                  {transitionForm.actions.length === 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Belum ada aksi sampingan yang didefinisikan.
                    </Typography>
                  )}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Box>
          {editMode === 'state' && stateData && onDeleteState && (
            <Button
              color="error"
              size="small"
              startIcon={<Icon icon="solar:trash-bin-trash-bold" />}
              onClick={() => {
                onDeleteState(stateData.id);
                onClose();
              }}
            >
              Hapus State
            </Button>
          )}
          {editMode === 'transition' && transitionData && onDeleteTransition && (
            <Button
              color="error"
              size="small"
              startIcon={<Icon icon="solar:trash-bin-trash-bold" />}
              onClick={() => {
                onDeleteTransition(transitionData.id);
                onClose();
              }}
            >
              Hapus Transisi
            </Button>
          )}
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button onClick={onClose} color="inherit">
            Batal
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={
              editMode === 'state'
                ? !stateForm.label.trim()
                : !transitionForm.event.trim() || !transitionForm.source || !transitionForm.target
            }
          >
            Simpan Perubahan
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
