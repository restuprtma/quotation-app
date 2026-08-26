import type { WBSModule, WBSFeature, WBSModulePriority } from '../types';

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
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  editMode: 'module' | 'feature' | 'criteria';
  moduleData: WBSModule | null;
  featureData: WBSFeature | null;
  criteriaText: string | null;
  criteriaIndex: number | null;
  targetModuleId?: string;
  targetFeatureId?: string;
  allModules: WBSModule[];
  allReferencesList?: string[];
  onClose: () => void;
  onSaveModule: (mod: WBSModule) => void;
  onSaveFeature: (moduleId: string, feat: WBSFeature) => void;
  onSaveCriteria: (
    moduleId: string,
    featureId: string,
    criteriaIndex: number | null,
    text: string
  ) => void;
  onDeleteModule?: (moduleId: string) => void;
  onDeleteFeature?: (moduleId: string, featureId: string) => void;
  onDeleteCriteria?: (moduleId: string, featureId: string, criteriaIndex: number) => void;
};

const PRIORITY_OPTIONS: {
  value: WBSModulePriority;
  label: string;
  color: 'error' | 'warning' | 'success';
}[] = [
  { value: 'high', label: 'High (Prioritas Utama)', color: 'error' },
  { value: 'medium', label: 'Medium (Prioritas Menengah)', color: 'warning' },
  { value: 'low', label: 'Low (Prioritas Rendah)', color: 'success' },
];

export function WBSEditDialog({
  open,
  editMode,
  moduleData,
  featureData,
  criteriaText,
  criteriaIndex,
  targetModuleId = '',
  targetFeatureId = '',
  allModules,
  allReferencesList = [],
  onClose,
  onSaveModule,
  onSaveFeature,
  onSaveCriteria,
  onDeleteModule,
  onDeleteFeature,
  onDeleteCriteria,
}: Props) {
  // 1. Module Form State
  const [moduleForm, setModuleForm] = useState<WBSModule>({
    id: '',
    name: '',
    description: '',
    priority: 'medium',
    dependencies: [],
    references: [],
    features: [],
  });

  // 2. Feature Form State
  const [featureForm, setFeatureForm] = useState<WBSFeature>({
    id: '',
    name: '',
    description: '',
    acceptance_criteria: [],
  });

  const [newCriteriaInput, setNewCriteriaInput] = useState('');

  // 3. Single Criteria Form State
  const [singleCriteriaForm, setSingleCriteriaForm] = useState('');

  // Sync state on open
  useEffect(() => {
    if (open) {
      if (editMode === 'module') {
        if (moduleData) {
          setModuleForm({
            ...moduleData,
            dependencies: [...moduleData.dependencies],
            references: [...moduleData.references],
          });
        } else {
          setModuleForm({
            id: `mod-${Date.now().toString(36)}`,
            name: '',
            description: '',
            priority: 'medium',
            dependencies: [],
            references: [],
            features: [],
          });
        }
      } else if (editMode === 'feature') {
        if (featureData) {
          setFeatureForm({
            ...featureData,
            acceptance_criteria: [...featureData.acceptance_criteria],
          });
        } else {
          setFeatureForm({
            id: `feat-${Date.now().toString(36)}`,
            name: '',
            description: '',
            acceptance_criteria: [],
          });
        }
        setNewCriteriaInput('');
      } else if (editMode === 'criteria') {
        setSingleCriteriaForm(criteriaText || '');
      }
    }
  }, [open, editMode, moduleData, featureData, criteriaText]);

  // Handlers for Module
  const handleSaveModuleSubmit = () => {
    if (!moduleForm.id.trim() || !moduleForm.name.trim()) return;
    onSaveModule(moduleForm);
    onClose();
  };

  // Handlers for Feature
  const handleAddCriteriaToFeature = () => {
    if (!newCriteriaInput.trim()) return;
    setFeatureForm((prev) => ({
      ...prev,
      acceptance_criteria: [...prev.acceptance_criteria, newCriteriaInput.trim()],
    }));
    setNewCriteriaInput('');
  };

  const handleRemoveCriteriaFromFeature = (idx: number) => {
    setFeatureForm((prev) => ({
      ...prev,
      acceptance_criteria: prev.acceptance_criteria.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveFeatureSubmit = () => {
    if (!featureForm.id.trim() || !featureForm.name.trim()) return;
    onSaveFeature(targetModuleId, featureForm);
    onClose();
  };

  // Handlers for Single Criteria
  const handleSaveCriteriaSubmit = () => {
    if (!singleCriteriaForm.trim()) return;
    onSaveCriteria(targetModuleId, targetFeatureId, criteriaIndex, singleCriteriaForm.trim());
    onClose();
  };

  const isEditingExisting =
    (editMode === 'module' && Boolean(moduleData)) ||
    (editMode === 'feature' && Boolean(featureData)) ||
    (editMode === 'criteria' && criteriaIndex !== null);

  const availableDepOptions = allModules.filter((m) => m.id !== moduleForm.id).map((m) => m.id);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Icon
            icon={
              editMode === 'module'
                ? 'solar:folder-with-files-bold'
                : editMode === 'feature'
                  ? 'solar:widget-add-bold'
                  : 'solar:check-circle-bold'
            }
            width={24}
          />
          <Typography variant="h6">
            {isEditingExisting ? 'Edit' : 'Tambah'}{' '}
            {editMode === 'module'
              ? 'WBS Module'
              : editMode === 'feature'
                ? 'WBS Feature'
                : 'Acceptance Criteria'}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2.5 }}>
        {/* MODE 1: MODULE FORM */}
        {editMode === 'module' && (
          <Stack spacing={2.5}>
            <TextField
              label="Module ID"
              size="small"
              fullWidth
              value={moduleForm.id}
              onChange={(e) => setModuleForm({ ...moduleForm, id: e.target.value })}
              helperText="ID unik modul (misal: mod-booking, mod-queue-core)"
              disabled={Boolean(moduleData)}
            />

            <TextField
              label="Nama Modul"
              size="small"
              fullWidth
              value={moduleForm.name}
              onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
              placeholder="e.g. Modul Pendaftaran & Reservasi Online"
              required
            />

            <TextField
              label="Deskripsi Modul"
              size="small"
              fullWidth
              multiline
              rows={3}
              value={moduleForm.description}
              onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
              placeholder="Deskripsi fungsional dan ruang lingkup modul..."
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Prioritas Modul</InputLabel>
              <Select
                value={moduleForm.priority}
                label="Prioritas Modul"
                onChange={(e) =>
                  setModuleForm({
                    ...moduleForm,
                    priority: e.target.value as WBSModulePriority,
                  })
                }
              >
                {PRIORITY_OPTIONS.map((opt) => (
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

            <Autocomplete
              multiple
              freeSolo
              options={availableDepOptions}
              value={moduleForm.dependencies}
              onChange={(_, newVal) => setModuleForm({ ...moduleForm, dependencies: newVal })}
              renderTags={(val, getTagProps) =>
                val.map((option, idx) => (
                  <Chip
                    {...getTagProps({ index: idx })}
                    key={option}
                    size="small"
                    label={option}
                    color="primary"
                    variant="outlined"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Dependensi Modul Prasyarat"
                  placeholder="Pilih ID modul prasyarat..."
                  helperText="Modul lain yang harus diselesaikan terlebih dahulu (wajib bebas siklus)"
                />
              )}
            />

            <Autocomplete
              multiple
              freeSolo
              options={allReferencesList}
              value={moduleForm.references}
              onChange={(_, newVal) => setModuleForm({ ...moduleForm, references: newVal })}
              renderTags={(val, getTagProps) =>
                val.map((option, idx) => (
                  <Chip
                    {...getTagProps({ index: idx })}
                    key={option}
                    size="small"
                    label={option}
                    color="info"
                    variant="soft"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Referensi Kanonikal"
                  placeholder="e.g. journey.activity.act-1, architecture.node.node-1"
                  helperText="Tautan keterhubungan ke journey activity, architecture node, atau state"
                />
              )}
            />
          </Stack>
        )}

        {/* MODE 2: FEATURE FORM */}
        {editMode === 'feature' && (
          <Stack spacing={2.5}>
            <TextField
              label="Feature ID"
              size="small"
              fullWidth
              value={featureForm.id}
              onChange={(e) => setFeatureForm({ ...featureForm, id: e.target.value })}
              helperText="ID unik fitur (misal: feat-slot-picker)"
              disabled={Boolean(featureData)}
            />

            <TextField
              label="Nama Fitur"
              size="small"
              fullWidth
              value={featureForm.name}
              onChange={(e) => setFeatureForm({ ...featureForm, name: e.target.value })}
              placeholder="e.g. Manajemen Kuota Slot Waktu"
              required
            />

            <TextField
              label="Deskripsi Fitur"
              size="small"
              fullWidth
              multiline
              rows={3}
              value={featureForm.description}
              onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
              placeholder="Rincian fungsional fitur yang akan diimplementasikan..."
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                Acceptance Criteria ({featureForm.acceptance_criteria.length})
              </Typography>
              <Stack spacing={1} sx={{ mb: 1.5 }}>
                {featureForm.acceptance_criteria.map((item, idx) => (
                  <Stack
                    key={idx}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: 'action.hover',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="flex-start"
                      sx={{ flex: 1, mr: 1 }}
                    >
                      <Icon
                        icon="solar:check-circle-bold"
                        width={18}
                        style={{ marginTop: 2, color: '#1877F2', flexShrink: 0 }}
                      />
                      <Typography variant="body2">{item}</Typography>
                    </Stack>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveCriteriaFromFeature(idx)}
                    >
                      <Icon icon="solar:trash-bin-minimalistic-bold" width={16} />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>

              <Stack direction="row" spacing={1}>
                <TextField
                  label="Tambah Kriteria Penerimaan"
                  size="small"
                  fullWidth
                  value={newCriteriaInput}
                  onChange={(e) => setNewCriteriaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCriteriaToFeature();
                    }
                  }}
                  placeholder="Ketik kriteria pengujian lalu tekan Enter..."
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddCriteriaToFeature}
                  startIcon={<Icon icon="solar:add-circle-bold" />}
                >
                  Tambah
                </Button>
              </Stack>
            </Box>
          </Stack>
        )}

        {/* MODE 3: SINGLE CRITERIA FORM */}
        {editMode === 'criteria' && (
          <Stack spacing={2.5}>
            <TextField
              label="Teks Acceptance Criteria"
              size="small"
              fullWidth
              multiline
              rows={3}
              value={singleCriteriaForm}
              onChange={(e) => setSingleCriteriaForm(e.target.value)}
              placeholder="Spesifikasi kriteria pengujian yang harus dipenuhi..."
              required
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Box>
          {isEditingExisting && (
            <Button
              color="error"
              variant="text"
              startIcon={<Icon icon="solar:trash-bin-minimalistic-bold" />}
              onClick={() => {
                if (editMode === 'module' && moduleData && onDeleteModule) {
                  onDeleteModule(moduleData.id);
                } else if (
                  editMode === 'feature' &&
                  featureData &&
                  onDeleteFeature &&
                  targetModuleId
                ) {
                  onDeleteFeature(targetModuleId, featureData.id);
                } else if (
                  editMode === 'criteria' &&
                  criteriaIndex !== null &&
                  onDeleteCriteria &&
                  targetModuleId &&
                  targetFeatureId
                ) {
                  onDeleteCriteria(targetModuleId, targetFeatureId, criteriaIndex);
                }
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
          <Button
            variant="contained"
            onClick={() => {
              if (editMode === 'module') handleSaveModuleSubmit();
              else if (editMode === 'feature') handleSaveFeatureSubmit();
              else if (editMode === 'criteria') handleSaveCriteriaSubmit();
            }}
          >
            Simpan
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
