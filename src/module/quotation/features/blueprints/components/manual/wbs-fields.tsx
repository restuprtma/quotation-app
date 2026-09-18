import type {
  WBS,
  WBSModule,
  CrossReference,
  WBSModulePriority,
  CrossReferenceRelationType,
} from '../../types/bundle';

import React, { useState } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Alert,
  Button,
  Select,
  MenuItem,
  TextField,
  IconButton,
  InputLabel,
  Typography,
  CardContent,
  FormControl,
  FormHelperText,
} from '@mui/material';

import { Iconify } from 'src/shared/ui/iconify';

import { ReferenceSelect } from './reference-select';
import { newBlueprintItemId } from '../../validation/manual-payload';
import { checkReferencedItem, type ReferenceOption } from '../../validation/manual-section';

export const WBS_MODULE_PRIORITIES: { value: WBSModulePriority; label: string }[] = [
  { value: 'high', label: 'Tinggi / High (high)' },
  { value: 'medium', label: 'Sedang / Medium (medium)' },
  { value: 'low', label: 'Rendah / Low (low)' },
];

export const CROSS_REFERENCE_RELATION_TYPES: {
  value: CrossReferenceRelationType;
  label: string;
}[] = [
  { value: 'implements', label: 'Mengimplementasikan (implements)' },
  { value: 'transitions_on', label: 'Transisi Pada (transitions_on)' },
  { value: 'interacts_with', label: 'Berinteraksi Dengan (interacts_with)' },
  { value: 'deploys_to', label: 'Deploy Ke (deploys_to)' },
  { value: 'depends_on', label: 'Bergantung Pada (depends_on)' },
];

export interface WBSFieldsProps {
  referenceOptions?: ReferenceOption[];
}

interface AcceptanceCriteriaInputProps {
  moduleIndex: number;
  featureIndex: number;
  value?: string[];
  onChange: (val: string[]) => void;
  error?: boolean;
  helperText?: string;
}

function AcceptanceCriteriaInput({
  moduleIndex,
  featureIndex,
  value = [],
  onChange,
  error,
  helperText,
}: AcceptanceCriteriaInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onChange([...value, trimmed]);
      setInputValue('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, newVal: string) => {
    const updated = [...value];
    updated[index] = newVal;
    onChange(updated);
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Typography
        variant="caption"
        sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5, display: 'block' }}
      >
        Acceptance Criteria / Kriteria Keberterimaan
      </Typography>

      {value.length > 0 && (
        <Stack spacing={1.5} sx={{ mb: 1.5 }}>
          {value.map((criterion, cIdx) => (
            <Stack key={cIdx} direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                fullWidth
                label={`Kriteria ${cIdx + 1} Feature ${featureIndex + 1} Module ${moduleIndex + 1}`}
                value={criterion}
                onChange={(e) => handleUpdate(cIdx, e.target.value)}
              />
              <IconButton
                size="small"
                color="error"
                aria-label={`Hapus Kriteria ${cIdx + 1} Feature ${featureIndex + 1} Module ${moduleIndex + 1}`}
                onClick={() => handleRemove(cIdx)}
              >
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      )}

      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          size="small"
          fullWidth
          label={`Input Kriteria Feature ${featureIndex + 1} Module ${moduleIndex + 1}`}
          placeholder="Tulis kriteria keberterimaan (contoh: Sistem menolak jika kuota penuh)..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          error={error}
          helperText={helperText}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          aria-label={`Tambah Kriteria Feature ${featureIndex + 1} Module ${moduleIndex + 1}`}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Tambah
        </Button>
      </Stack>
    </Box>
  );
}

interface WBSFeatureItemFieldsProps {
  moduleIndex: number;
  featureIndex: number;
  onRemove: () => void;
}

function WBSFeatureItemFields({ moduleIndex, featureIndex, onRemove }: WBSFeatureItemFieldsProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<{ wbs: WBS; cross_references: CrossReference[] }>();

  const featError = errors?.wbs?.modules?.[moduleIndex]?.features?.[featureIndex];

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" color="primary">
            Feature #{featureIndex + 1}
          </Typography>
          <IconButton
            color="error"
            size="small"
            aria-label={`Hapus Feature ${featureIndex + 1} Module ${moduleIndex + 1}`}
            onClick={onRemove}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label={`Nama Feature ${featureIndex + 1} Module ${moduleIndex + 1}`}
              size="small"
              fullWidth
              placeholder="Nama fitur (contoh: Alokasi Nomor Tiket)"
              error={!!featError?.name}
              helperText={featError?.name?.message}
              {...register(`wbs.modules.${moduleIndex}.features.${featureIndex}.name`)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label={`Deskripsi Feature ${featureIndex + 1} Module ${moduleIndex + 1}`}
              size="small"
              fullWidth
              multiline
              rows={2}
              placeholder="Penjelasan detail fungsionalitas fitur"
              error={!!featError?.description}
              helperText={featError?.description?.message}
              {...register(`wbs.modules.${moduleIndex}.features.${featureIndex}.description`)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              control={control}
              name={`wbs.modules.${moduleIndex}.features.${featureIndex}.acceptance_criteria`}
              render={({ field: critField, fieldState }) => (
                <AcceptanceCriteriaInput
                  moduleIndex={moduleIndex}
                  featureIndex={featureIndex}
                  value={critField.value || []}
                  onChange={critField.onChange}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}

interface WBSModuleItemFieldsProps {
  moduleIndex: number;
  onRemove: () => void;
  referenceOptions: ReferenceOption[];
  watchedModules: WBSModule[];
}

function WBSModuleItemFields({
  moduleIndex,
  onRemove,
  referenceOptions,
  watchedModules,
}: WBSModuleItemFieldsProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<{ wbs: WBS; cross_references: CrossReference[] }>();

  const {
    fields: featureFields,
    append: appendFeature,
    remove: removeFeature,
  } = useFieldArray({
    control,
    name: `wbs.modules.${moduleIndex}.features`,
  });

  const modError = errors?.wbs?.modules?.[moduleIndex];
  const currentModuleId = watchedModules[moduleIndex]?.id;
  const availableDeps = watchedModules.filter((m) => m.id && m.id !== currentModuleId);

  const handleAddFeature = () => {
    appendFeature({
      id: newBlueprintItemId('feat'),
      name: '',
      description: '',
      acceptance_criteria: [],
    });
  };

  return (
    <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Stack spacing={3}>
        {/* Module Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" color="primary">
            Module #{moduleIndex + 1}
          </Typography>
          <IconButton
            color="error"
            aria-label={`Hapus Module ${moduleIndex + 1}`}
            onClick={onRemove}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Stack>

        {/* Module Info */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              label={`Nama Module ${moduleIndex + 1}`}
              size="small"
              fullWidth
              placeholder="Nama modul (contoh: Modul Core Queue Engine)"
              error={!!modError?.name}
              helperText={modError?.name?.message}
              {...register(`wbs.modules.${moduleIndex}.name`)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              control={control}
              name={`wbs.modules.${moduleIndex}.priority`}
              render={({ field: selectField, fieldState }) => (
                <FormControl fullWidth size="small" error={!!fieldState.error}>
                  <InputLabel id={`mod-priority-label-${moduleIndex}`}>
                    {`Prioritas Module ${moduleIndex + 1}`}
                  </InputLabel>
                  <Select
                    {...selectField}
                    value={selectField.value ?? 'medium'}
                    labelId={`mod-priority-label-${moduleIndex}`}
                    label={`Prioritas Module ${moduleIndex + 1}`}
                    inputProps={{
                      'aria-label': `Prioritas Module ${moduleIndex + 1}`,
                    }}
                  >
                    {WBS_MODULE_PRIORITIES.map((p) => (
                      <MenuItem key={p.value} value={p.value}>
                        {p.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              label={`Deskripsi Module ${moduleIndex + 1}`}
              size="small"
              fullWidth
              multiline
              rows={2}
              placeholder="Penjelasan arsitektur dan ruang lingkup modul"
              error={!!modError?.description}
              helperText={modError?.description?.message}
              {...register(`wbs.modules.${moduleIndex}.description`)}
            />
          </Grid>

          {/* Module Dependencies Multi-Select */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name={`wbs.modules.${moduleIndex}.dependencies`}
              render={({ field: depField, fieldState }) => (
                <FormControl fullWidth size="small" error={!!fieldState.error}>
                  <InputLabel id={`mod-dep-label-${moduleIndex}`}>
                    {`Dependencies Module ${moduleIndex + 1}`}
                  </InputLabel>
                  <Select
                    {...depField}
                    multiple
                    value={depField.value || []}
                    labelId={`mod-dep-label-${moduleIndex}`}
                    label={`Dependencies Module ${moduleIndex + 1}`}
                    inputProps={{
                      'aria-label': `Dependencies Module ${moduleIndex + 1}`,
                    }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((val) => {
                          const depMod = watchedModules.find((m) => m.id === val);
                          return <Chip key={val} label={depMod?.name || val} size="small" />;
                        })}
                      </Box>
                    )}
                  >
                    {availableDeps.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.name || m.id}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </Grid>

          {/* Module References (Canonical) */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name={`wbs.modules.${moduleIndex}.references`}
              render={({ field: refField, fieldState }) => (
                <ReferenceSelect
                  label={`Referensi Canonical Module #${moduleIndex + 1}`}
                  options={referenceOptions}
                  multiple
                  value={refField.value || []}
                  onChange={refField.onChange}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  placeholder="Pilih referensi canonical..."
                />
              )}
            />
          </Grid>
        </Grid>

        {/* Features Sub-section */}
        <Card variant="outlined">
          <CardContent>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Features (Fitur-fitur Modul)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Daftar fitur dalam modul beserta kriteria keberterimaannya (acceptance criteria).
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleAddFeature}
                aria-label={`Tambah Feature Module ${moduleIndex + 1}`}
              >
                Tambah Feature
              </Button>
            </Stack>

            {featureFields.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: 'italic', py: 1 }}
              >
                Belum ada Feature yang ditambahkan.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {featureFields.map((field, fIdx) => (
                  <WBSFeatureItemFields
                    key={field.id}
                    moduleIndex={moduleIndex}
                    featureIndex={fIdx}
                    onRemove={() => removeFeature(fIdx)}
                  />
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Card>
  );
}

interface WBSCrossReferenceItemFieldsProps {
  index: number;
  onRemove: () => void;
  referenceOptions: ReferenceOption[];
}

function WBSCrossReferenceItemFields({
  index,
  onRemove,
  referenceOptions,
}: WBSCrossReferenceItemFieldsProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<{ wbs: WBS; cross_references: CrossReference[] }>();

  const xrefError = errors?.cross_references?.[index];

  return (
    <Box
      sx={{
        p: 2.5,
        bgcolor: 'background.neutral',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" color="primary">
            Cross Reference #{index + 1}
          </Typography>
          <IconButton
            color="error"
            size="small"
            aria-label={`Hapus Cross Reference ${index + 1}`}
            onClick={onRemove}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Stack>

        <Grid container spacing={2}>
          {/* Source Ref */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name={`cross_references.${index}.source_ref`}
              render={({ field: refField, fieldState }) => (
                <ReferenceSelect
                  label={`Source Ref #${index + 1}`}
                  options={referenceOptions}
                  value={refField.value || ''}
                  onChange={refField.onChange}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  placeholder="Pilih canonical source..."
                />
              )}
            />
          </Grid>

          {/* Target Ref */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name={`cross_references.${index}.target_ref`}
              render={({ field: refField, fieldState }) => (
                <ReferenceSelect
                  label={`Target Ref #${index + 1}`}
                  options={referenceOptions}
                  value={refField.value || ''}
                  onChange={refField.onChange}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  placeholder="Pilih canonical target..."
                />
              )}
            />
          </Grid>

          {/* Relation Type */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name={`cross_references.${index}.relation_type`}
              render={({ field: selectField, fieldState }) => (
                <FormControl fullWidth size="small" error={!!fieldState.error}>
                  <InputLabel id={`xref-relation-label-${index}`}>
                    {`Tipe Relasi #${index + 1}`}
                  </InputLabel>
                  <Select
                    {...selectField}
                    value={selectField.value ?? 'implements'}
                    labelId={`xref-relation-label-${index}`}
                    label={`Tipe Relasi #${index + 1}`}
                    inputProps={{
                      'aria-label': `Tipe Relasi #${index + 1}`,
                    }}
                  >
                    {CROSS_REFERENCE_RELATION_TYPES.map((t) => (
                      <MenuItem key={t.value} value={t.value}>
                        {t.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </Grid>

          {/* Description */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={`Deskripsi Cross Reference ${index + 1}`}
              size="small"
              fullWidth
              multiline
              rows={1}
              placeholder="Penjelasan relasi antar elemen..."
              error={!!xrefError?.description}
              helperText={xrefError?.description?.message}
              {...register(`cross_references.${index}.description`)}
            />
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}

export function WBSFields({ referenceOptions = [] }: WBSFieldsProps) {
  const {
    control,
    watch,
    getValues,
    formState: { errors },
  } = useFormContext<{ wbs: WBS; cross_references: CrossReference[] }>();

  const [deletionError, setDeletionError] = useState<string | null>(null);

  const {
    fields: moduleFields,
    append: appendModule,
    remove: removeModule,
  } = useFieldArray({
    control,
    name: 'wbs.modules',
  });

  const {
    fields: crossRefFields,
    append: appendCrossRef,
    remove: removeCrossRef,
  } = useFieldArray({
    control,
    name: 'cross_references',
  });

  const watchedModules = watch('wbs.modules') || [];
  const isEmptySection = moduleFields.length === 0 && crossRefFields.length === 0;

  const wbsModulesError =
    (errors?.wbs?.modules as any)?.message ||
    (errors?.wbs?.modules as any)?.root?.message ||
    (errors?.wbs as any)?.message;

  const handleAddModule = () => {
    setDeletionError(null);
    appendModule({
      id: newBlueprintItemId('mod'),
      name: '',
      description: '',
      priority: 'medium',
      dependencies: [],
      references: [],
      features: [],
    });
  };

  const handleRemoveModule = (index: number) => {
    setDeletionError(null);
    const moduleId = getValues(`wbs.modules.${index}.id`);
    const currentWbs = getValues('wbs');
    const crossRefs = getValues('cross_references');
    const guard = checkReferencedItem(moduleId, 'module', currentWbs, {
      cross_references: crossRefs,
    });

    if (!guard.allowed) {
      setDeletionError(guard.reason || 'Module ini tidak dapat dihapus.');
      return;
    }

    removeModule(index);
  };

  const handleAddCrossRef = () => {
    setDeletionError(null);
    appendCrossRef({
      id: newBlueprintItemId('xref'),
      source_ref: '',
      target_ref: '',
      relation_type: 'implements',
      description: '',
    });
  };

  const handleRemoveCrossRef = (index: number) => {
    setDeletionError(null);
    removeCrossRef(index);
  };

  return (
    <Stack spacing={3}>
      {deletionError && (
        <Alert severity="error" onClose={() => setDeletionError(null)}>
          {deletionError}
        </Alert>
      )}

      {wbsModulesError && <Alert severity="error">{wbsModulesError}</Alert>}

      {isEmptySection && (
        <Alert severity="warning">
          <strong>WARN_EMPTY_SECTION:</strong> Bagian WBS & Cross References belum memiliki data.
          Tambahkan setidaknya satu Module WBS dan Cross Reference untuk melengkapi rincian struktur
          kerja.
        </Alert>
      )}

      {/* ============================================================ */}
      {/* 1. WBS MODULES */}
      {/* ============================================================ */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Work Breakdown Structure (Modul & Fitur WBS)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Struktur hierarkis modul kerja teknis, prioritas, dependensi antar modul, dan kriteria
            keberterimaan fitur.
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="medium"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={handleAddModule}
        >
          Tambah Module
        </Button>
      </Stack>

      {moduleFields.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
              Belum ada Module yang ditambahkan.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        moduleFields.map((field, index) => (
          <WBSModuleItemFields
            key={field.id}
            moduleIndex={index}
            onRemove={() => handleRemoveModule(index)}
            referenceOptions={referenceOptions}
            watchedModules={watchedModules}
          />
        ))
      )}

      {/* ============================================================ */}
      {/* 2. CROSS REFERENCES */}
      {/* ============================================================ */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Cross-References / Pemetaan Lintas Blueprint
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Relasi keterhubungan eksplisit antara elemen WBS, Arsitektur, Workflow, State
                Machine, atau User Journey.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleAddCrossRef}
            >
              Tambah Cross Reference
            </Button>
          </Stack>

          {crossRefFields.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
              Belum ada Cross Reference yang ditambahkan.
            </Typography>
          ) : (
            <Stack spacing={2.5}>
              {crossRefFields.map((field, index) => (
                <WBSCrossReferenceItemFields
                  key={field.id}
                  index={index}
                  onRemove={() => handleRemoveCrossRef(index)}
                  referenceOptions={referenceOptions}
                />
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
