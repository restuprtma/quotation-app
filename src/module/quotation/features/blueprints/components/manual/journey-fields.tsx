import type { Journey } from '../../types/bundle';

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

export interface JourneyFieldsProps {
  referenceOptions?: ReferenceOption[];
}

export function JourneyFields({ referenceOptions = [] }: JourneyFieldsProps) {
  const {
    control,
    register,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<{ journey: Journey }>();

  const [deletionError, setDeletionError] = useState<string | null>(null);

  const {
    fields: phaseFields,
    append: appendPhase,
    remove: removePhase,
  } = useFieldArray({
    control,
    name: 'journey.phases',
  });

  const {
    fields: actorFields,
    append: appendActor,
    remove: removeActor,
  } = useFieldArray({
    control,
    name: 'journey.actors',
  });

  const {
    fields: activityFields,
    append: appendActivity,
    remove: removeActivity,
  } = useFieldArray({
    control,
    name: 'journey.activities',
  });

  const watchedPhases = watch('journey.phases') || [];
  const watchedActors = watch('journey.actors') || [];

  const isEmptySection =
    phaseFields.length === 0 && actorFields.length === 0 && activityFields.length === 0;

  const handleAddPhase = () => {
    setDeletionError(null);
    appendPhase({
      id: newBlueprintItemId('phase'),
      label: '',
      order: phaseFields.length + 1,
    });
  };

  const handleRemovePhase = (index: number) => {
    setDeletionError(null);
    const phaseId = getValues(`journey.phases.${index}.id`);
    const currentJourney = getValues('journey');
    const guard = checkReferencedItem(phaseId, 'phase', currentJourney);

    if (!guard.allowed) {
      setDeletionError(guard.reason || 'Phase ini tidak dapat dihapus.');
      return;
    }

    removePhase(index);
    // Re-index orders
    const updatedPhases = getValues('journey.phases') || [];
    updatedPhases.forEach((_, idx) => {
      setValue(`journey.phases.${idx}.order`, idx + 1);
    });
  };

  const handleAddActor = () => {
    setDeletionError(null);
    appendActor({
      id: newBlueprintItemId('actor'),
      label: '',
      order: actorFields.length + 1,
    });
  };

  const handleRemoveActor = (index: number) => {
    setDeletionError(null);
    const actorId = getValues(`journey.actors.${index}.id`);
    const currentJourney = getValues('journey');
    const guard = checkReferencedItem(actorId, 'actor', currentJourney);

    if (!guard.allowed) {
      setDeletionError(guard.reason || 'Actor ini tidak dapat dihapus.');
      return;
    }

    removeActor(index);
    const updatedActors = getValues('journey.actors') || [];
    updatedActors.forEach((_, idx) => {
      setValue(`journey.actors.${idx}.order`, idx + 1);
    });
  };

  const handleAddActivity = () => {
    setDeletionError(null);
    const phases = getValues('journey.phases') || [];
    const actors = getValues('journey.actors') || [];
    appendActivity({
      id: newBlueprintItemId('act'),
      phase_id: phases[0]?.id || '',
      actor_id: actors[0]?.id || '',
      label: '',
      description: '',
      touchpoints: [],
      references: [],
    });
  };

  return (
    <Stack spacing={3}>
      {deletionError && (
        <Alert severity="error" onClose={() => setDeletionError(null)}>
          {deletionError}
        </Alert>
      )}

      {isEmptySection && (
        <Alert severity="warning">
          <strong>WARN_EMPTY_SECTION:</strong> Bagian Journey belum memiliki baris data. Tambahkan
          setidaknya satu Phase, Actor, dan Activity untuk menyusun alur perjalanan pengguna.
        </Alert>
      )}

      {/* ============================================================ */}
      {/* 1. PHASES */}
      {/* ============================================================ */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                1. Chronological Phases (Tahapan Perjalanan)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tahapan waktu berurutan dalam user journey (contoh: Pendaftaran, Pemanggilan,
                Pelayanan).
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleAddPhase}
            >
              Tambah Phase
            </Button>
          </Stack>

          {phaseFields.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
              Belum ada Phase yang ditambahkan.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {phaseFields.map((field, index) => {
                const phaseError = errors?.journey?.phases?.[index];
                return (
                  <Box
                    key={field.id}
                    sx={{
                      p: 2,
                      bgcolor: 'background.neutral',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 2, sm: 1 }}>
                        <TextField
                          label="No"
                          size="small"
                          type="number"
                          fullWidth
                          disabled
                          {...register(`journey.phases.${index}.order`, { valueAsNumber: true })}
                        />
                      </Grid>
                      <Grid size={{ xs: 8, sm: 9 }}>
                        <TextField
                          label={`Label Phase ${index + 1}`}
                          size="small"
                          fullWidth
                          placeholder="Nama tahapan (contoh: Pendaftaran & Reservasi)"
                          error={!!phaseError?.label}
                          helperText={phaseError?.label?.message}
                          {...register(`journey.phases.${index}.label`)}
                        />
                      </Grid>
                      <Grid size={{ xs: 2, sm: 2 }} sx={{ textAlign: 'right' }}>
                        <IconButton
                          color="error"
                          aria-label={`Hapus Phase ${index + 1}`}
                          onClick={() => handleRemovePhase(index)}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 2. ACTORS */}
      {/* ============================================================ */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                2. Actors & Roles (Pelaku & Peran)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Entitas pengguna atau sistem yang berinteraksi (contoh: Pemohon Layanan, Petugas
                Loket).
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleAddActor}
            >
              Tambah Actor
            </Button>
          </Stack>

          {actorFields.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
              Belum ada Actor yang ditambahkan.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {actorFields.map((field, index) => {
                const actorError = errors?.journey?.actors?.[index];
                return (
                  <Box
                    key={field.id}
                    sx={{
                      p: 2,
                      bgcolor: 'background.neutral',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 2, sm: 1 }}>
                        <TextField
                          label="No"
                          size="small"
                          type="number"
                          fullWidth
                          disabled
                          {...register(`journey.actors.${index}.order`, { valueAsNumber: true })}
                        />
                      </Grid>
                      <Grid size={{ xs: 8, sm: 9 }}>
                        <TextField
                          label={`Label Actor ${index + 1}`}
                          size="small"
                          fullWidth
                          placeholder="Nama atau peran aktor (contoh: Pemohon Layanan)"
                          error={!!actorError?.label}
                          helperText={actorError?.label?.message}
                          {...register(`journey.actors.${index}.label`)}
                        />
                      </Grid>
                      <Grid size={{ xs: 2, sm: 2 }} sx={{ textAlign: 'right' }}>
                        <IconButton
                          color="error"
                          aria-label={`Hapus Actor ${index + 1}`}
                          onClick={() => handleRemoveActor(index)}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 3. ACTIVITIES */}
      {/* ============================================================ */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                3. Journey Activities & Touchpoints (Aktivitas & Titik Sentuh)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Interaksi terperinci yang menghubungkan Phase dan Actor dengan kanal sistem.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleAddActivity}
              disabled={watchedPhases.length === 0 || watchedActors.length === 0}
            >
              Tambah Activity
            </Button>
          </Stack>

          {watchedPhases.length === 0 || watchedActors.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Tambahkan setidaknya satu Phase dan satu Actor sebelum membuat Activity.
            </Alert>
          ) : null}

          {activityFields.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
              Belum ada Activity yang ditambahkan.
            </Typography>
          ) : (
            <Stack spacing={2.5}>
              {activityFields.map((field, index) => {
                const actError = errors?.journey?.activities?.[index];
                return (
                  <Box
                    key={field.id}
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
                          Activity #{index + 1}
                        </Typography>
                        <IconButton
                          color="error"
                          size="small"
                          aria-label={`Hapus Activity ${index + 1}`}
                          onClick={() => removeActivity(index)}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Stack>

                      <Grid container spacing={2}>
                        {/* Phase Select */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Controller
                            control={control}
                            name={`journey.activities.${index}.phase_id`}
                            render={({ field: selectField, fieldState }) => (
                              <FormControl fullWidth size="small" error={!!fieldState.error}>
                                <InputLabel id={`act-phase-label-${index}`}>
                                  Pilih Phase {index + 1}
                                </InputLabel>
                                <Select
                                  {...selectField}
                                  labelId={`act-phase-label-${index}`}
                                  label={`Pilih Phase ${index + 1}`}
                                  inputProps={{ 'aria-label': `Pilih Phase ${index + 1}` }}
                                >
                                  {watchedPhases.map((p) => (
                                    <MenuItem key={p.id} value={p.id}>
                                      {p.label || p.id}
                                    </MenuItem>
                                  ))}
                                </Select>
                                {fieldState.error && (
                                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                                )}
                              </FormControl>
                            )}
                          />
                        </Grid>

                        {/* Actor Select */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Controller
                            control={control}
                            name={`journey.activities.${index}.actor_id`}
                            render={({ field: selectField, fieldState }) => (
                              <FormControl fullWidth size="small" error={!!fieldState.error}>
                                <InputLabel id={`act-actor-label-${index}`}>
                                  Pilih Actor {index + 1}
                                </InputLabel>
                                <Select
                                  {...selectField}
                                  labelId={`act-actor-label-${index}`}
                                  label={`Pilih Actor ${index + 1}`}
                                  inputProps={{ 'aria-label': `Pilih Actor ${index + 1}` }}
                                >
                                  {watchedActors.map((a) => (
                                    <MenuItem key={a.id} value={a.id}>
                                      {a.label || a.id}
                                    </MenuItem>
                                  ))}
                                </Select>

                                {fieldState.error && (
                                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                                )}
                              </FormControl>
                            )}
                          />
                        </Grid>

                        {/* Label */}
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label={`Label Activity ${index + 1}`}
                            size="small"
                            fullWidth
                            placeholder="Nama aktivitas (contoh: Memanggil Nomor Antrean Loket)"
                            error={!!actError?.label}
                            helperText={actError?.label?.message}
                            {...register(`journey.activities.${index}.label`)}
                          />
                        </Grid>

                        {/* Description */}
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label={`Deskripsi Activity ${index + 1}`}
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Penjelasan detail langkah dan interaksi pemohon/petugas"
                            error={!!actError?.description}
                            helperText={actError?.description?.message}
                            {...register(`journey.activities.${index}.description`)}
                          />
                        </Grid>

                        {/* Touchpoints (string array) */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Controller
                            control={control}
                            name={`journey.activities.${index}.touchpoints`}
                            render={({ field: tpField }) => {
                              const touchpoints = tpField.value || [];
                              return (
                                <Box>
                                  <TextField
                                    label={`Touchpoints / Saluran #${index + 1}`}
                                    size="small"
                                    fullWidth
                                    placeholder="Ketik saluran & tekan Enter (contoh: Web Portal, Kiosk)"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const target = e.target as HTMLInputElement;
                                        const val = target.value.trim();
                                        if (val && !touchpoints.includes(val)) {
                                          tpField.onChange([...touchpoints, val]);
                                          target.value = '';
                                        }
                                      }
                                    }}
                                  />
                                  <Stack
                                    direction="row"
                                    spacing={0.5}
                                    flexWrap="wrap"
                                    sx={{ mt: 1 }}
                                  >
                                    {touchpoints.map((tp, tpIdx) => (
                                      <Chip
                                        key={tpIdx}
                                        label={tp}
                                        size="small"
                                        onDelete={() => {
                                          tpField.onChange(
                                            touchpoints.filter((_, i) => i !== tpIdx)
                                          );
                                        }}
                                        sx={{ mr: 0.5, mb: 0.5 }}
                                      />
                                    ))}
                                  </Stack>
                                </Box>
                              );
                            }}
                          />
                        </Grid>

                        {/* Cross References */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Controller
                            control={control}
                            name={`journey.activities.${index}.references`}
                            render={({ field: refField, fieldState }) => (
                              <ReferenceSelect
                                label={`Referensi Cross-Section #${index + 1}`}
                                options={referenceOptions}
                                multiple
                                value={refField.value || []}
                                onChange={refField.onChange}
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                placeholder="Pilih elemen terkait (WBS, Workflow, dll)..."
                              />
                            )}
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
