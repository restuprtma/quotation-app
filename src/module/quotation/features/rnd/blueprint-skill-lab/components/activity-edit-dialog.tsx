import type { JourneyActor, JourneyPhase, JourneyActivity } from '../types';

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
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  activity: JourneyActivity | null;
  phases: JourneyPhase[];
  actors: JourneyActor[];
  onClose: () => void;
  onSave: (activity: JourneyActivity) => void;
};

export function ActivityEditDialog({ open, activity, phases, actors, onClose, onSave }: Props) {
  const [formData, setFormData] = useState<JourneyActivity>({
    id: '',
    phase_id: '',
    actor_id: '',
    label: '',
    description: '',
    touchpoints: [],
    references: [],
  });

  const [newTouchpoint, setNewTouchpoint] = useState('');
  const [newReference, setNewReference] = useState('');

  useEffect(() => {
    if (activity) {
      setFormData(activity);
    } else {
      setFormData({
        id: `act-${Date.now().toString(36)}`,
        phase_id: phases[0]?.id || '',
        actor_id: actors[0]?.id || '',
        label: '',
        description: '',
        touchpoints: [],
        references: [],
      });
    }
  }, [activity, phases, actors, open]);

  const handleAddTouchpoint = () => {
    if (newTouchpoint.trim() && !formData.touchpoints.includes(newTouchpoint.trim())) {
      setFormData((prev) => ({
        ...prev,
        touchpoints: [...prev.touchpoints, newTouchpoint.trim()],
      }));
      setNewTouchpoint('');
    }
  };

  const handleRemoveTouchpoint = (tp: string) => {
    setFormData((prev) => ({
      ...prev,
      touchpoints: prev.touchpoints.filter((item) => item !== tp),
    }));
  };

  const handleAddReference = () => {
    if (newReference.trim() && !formData.references.includes(newReference.trim())) {
      setFormData((prev) => ({
        ...prev,
        references: [...prev.references, newReference.trim()],
      }));
      setNewReference('');
    }
  };

  const handleRemoveReference = (ref: string) => {
    setFormData((prev) => ({
      ...prev,
      references: prev.references.filter((item) => item !== ref),
    }));
  };

  const handleSave = () => {
    if (!formData.label.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          {activity ? 'Edit Journey Activity' : 'Tambah Journey Activity'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Icon icon="solar:close-circle-bold" width={24} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField
            label="Activity ID"
            value={formData.id}
            disabled
            size="small"
            helperText="Kanonikal identifier unik (^act-[a-z0-9-]+$)"
          />

          <TextField
            label="Activity Label / Title"
            value={formData.label}
            onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
            required
            fullWidth
            placeholder="e.g. Reservasi Tiket Daring"
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Phase (Fase)</InputLabel>
              <Select
                value={formData.phase_id}
                label="Phase (Fase)"
                onChange={(e) => setFormData((prev) => ({ ...prev, phase_id: e.target.value }))}
              >
                {phases.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.order}. {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Actor (Aktor)</InputLabel>
              <Select
                value={formData.actor_id}
                label="Actor (Aktor)"
                onChange={(e) => setFormData((prev) => ({ ...prev, actor_id: e.target.value }))}
              >
                {actors.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.order}. {a.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            multiline
            rows={3}
            fullWidth
            placeholder="Deskripsi interaksi atau proses yang berlangsung..."
          />

          {/* Touchpoints */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Touchpoints / Channels
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="e.g. Mobile App, WhatsApp Bot"
                value={newTouchpoint}
                onChange={(e) => setNewTouchpoint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTouchpoint();
                  }
                }}
              />
              <Button
                variant="outlined"
                color="primary"
                onClick={handleAddTouchpoint}
                startIcon={<Icon icon="solar:add-circle-bold" />}
              >
                Add
              </Button>
            </Stack>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {formData.touchpoints.map((tp) => (
                <Chip
                  key={tp}
                  label={tp}
                  size="small"
                  color="info"
                  variant="soft"
                  onDelete={() => handleRemoveTouchpoint(tp)}
                />
              ))}
              {formData.touchpoints.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  Belum ada touchpoint terdaftar.
                </Typography>
              )}
            </Box>
          </Box>

          {/* Canonical Cross References */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Canonical Cross References
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="e.g. architecture.node.node-portal-web"
                value={newReference}
                onChange={(e) => setNewReference(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddReference();
                  }
                }}
              />
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleAddReference}
                startIcon={<Icon icon="solar:link-bold" />}
              >
                Link
              </Button>
            </Stack>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {formData.references.map((ref) => (
                <Chip
                  key={ref}
                  label={ref}
                  size="small"
                  color="secondary"
                  variant="soft"
                  onDelete={() => handleRemoveReference(ref)}
                />
              ))}
              {formData.references.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  Belum ada referensi kanonikal.
                </Typography>
              )}
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Batal
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={!formData.label.trim()}
        >
          Simpan Perubahan
        </Button>
      </DialogActions>
    </Dialog>
  );
}
