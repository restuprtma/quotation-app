import type { StateType, StateMachine } from '../../types/bundle';

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

import { newBlueprintItemId } from '../../validation/manual-payload';
import { checkReferencedItem, type ReferenceOption } from '../../validation/manual-section';

export const STATE_TYPES: { value: StateType; label: string }[] = [
  { value: 'normal', label: 'Normal (normal)' },
  { value: 'terminal', label: 'Terminal / Selesai (terminal)' },
  { value: 'exception', label: 'Exception / Batal (exception)' },
];

export interface StateMachineFieldsProps {
  referenceOptions?: ReferenceOption[];
}

function ActionInputArray({
  label,
  value = [],
  onChange,
  error,
  helperText,
}: {
  label: string;
  value: string[];
  onChange: (val: string[]) => void;
  error?: boolean;
  helperText?: string;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      if (!value.includes(trimmed)) {
        onChange([...value, trimmed]);
      }
      setInputValue('');
    }
  };

  return (
    <Box>
      <TextField
        label={label}
        size="small"
        fullWidth
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Ketik action & tekan Enter (contoh: Catat log, Kirim notifikasi)"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
          }
        }}
        error={error}
        helperText={helperText}
        InputProps={{
          endAdornment: (
            <IconButton
              size="small"
              onClick={handleAdd}
              disabled={!inputValue.trim()}
              aria-label="Tambah item action"
            >
              <Iconify icon="solar:add-circle-bold" />
            </IconButton>
          ),
        }}
      />
      <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
        {value.map((act, actIdx) => (
          <Chip
            key={actIdx}
            label={act}
            size="small"
            onDelete={() => {
              onChange(value.filter((_, i) => i !== actIdx));
            }}
            sx={{ mr: 0.5, mb: 0.5 }}
          />
        ))}
      </Stack>
    </Box>
  );
}

export function StateMachineFields({ referenceOptions = [] }: StateMachineFieldsProps) {
  const {
    control,
    register,
    watch,
    getValues,
    formState: { errors },
  } = useFormContext<{ state_machine: StateMachine }>();

  const [deletionError, setDeletionError] = useState<string | null>(null);

  const {
    fields: stateFields,
    append: appendState,
    remove: removeState,
  } = useFieldArray({
    control,
    name: 'state_machine.states',
  });

  const {
    fields: transitionFields,
    append: appendTransition,
    remove: removeTransition,
  } = useFieldArray({
    control,
    name: 'state_machine.transitions',
  });

  const watchedEntity = watch('state_machine.entity') || '';
  const watchedStates = watch('state_machine.states') || [];

  const isEmptySection =
    !watchedEntity.trim() && stateFields.length === 0 && transitionFields.length === 0;

  const handleAddState = () => {
    setDeletionError(null);
    appendState({
      id: newBlueprintItemId('state'),
      label: '',
      type: 'normal',
      layout: { x: 0, y: 0 },
    });
  };

  const handleRemoveState = (index: number) => {
    setDeletionError(null);
    const stateId = getValues(`state_machine.states.${index}.id`);
    const currentStateMachine = getValues('state_machine');
    const guard = checkReferencedItem(stateId, 'state', currentStateMachine);

    if (!guard.allowed) {
      setDeletionError(guard.reason || 'State ini tidak dapat dihapus.');
      return;
    }

    removeState(index);
  };

  const handleAddTransition = () => {
    setDeletionError(null);
    appendTransition({
      id: newBlueprintItemId('trans'),
      source: watchedStates[0]?.id || '',
      target: watchedStates[1]?.id || watchedStates[0]?.id || '',
      event: '',
      actor: '',
      guard: '',
      actions: [],
    });
  };

  const handleRemoveTransition = (index: number) => {
    setDeletionError(null);
    removeTransition(index);
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
          <strong>WARN_EMPTY_SECTION:</strong> Bagian State Machine belum memiliki data. Tentukan
          Nama Entity, setidaknya satu State, dan Transition untuk mendefinisikan siklus hidup
          entitas.
        </Alert>
      )}

      {/* ============================================================ */}
      {/* 1. ENTITY CONFIGURATION & INITIAL STATE */}
      {/* ============================================================ */}
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              1. Entity & Initial State (Konfigurasi Entitas & Status Awal)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tentukan entitas bisnis yang memiliki siklus status dan pilih status awal siklus
              hidupnya.
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {/* Entity Name */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Nama Entity"
                size="small"
                fullWidth
                placeholder="Nama entitas (contoh: Tiket Antrean Layanan)"
                error={!!errors?.state_machine?.entity}
                helperText={errors?.state_machine?.entity?.message}
                {...register('state_machine.entity')}
              />
            </Grid>

            {/* Initial State Select */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={control}
                name="state_machine.initial_state"
                render={({ field: selectField, fieldState }) => (
                  <FormControl fullWidth size="small" error={!!fieldState.error}>
                    <InputLabel id="state-machine-initial-state-label">Initial State</InputLabel>
                    <Select
                      {...selectField}
                      value={selectField.value ?? ''}
                      labelId="state-machine-initial-state-label"
                      label="Initial State"
                      inputProps={{ 'aria-label': 'Initial State' }}
                    >
                      {watchedStates.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.label || s.id}
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
          </Grid>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 2. STATES */}
      {/* ============================================================ */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                2. States / Status Entitas
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Daftar seluruh state atau status siklus hidup entitas (normal, terminal, exception).
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleAddState}
            >
              Tambah State
            </Button>
          </Stack>

          {stateFields.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
              Belum ada State yang ditambahkan.
            </Typography>
          ) : (
            <Stack spacing={2.5}>
              {stateFields.map((field, index) => {
                const stateError = errors?.state_machine?.states?.[index];
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
                          State #{index + 1}
                        </Typography>
                        <IconButton
                          color="error"
                          size="small"
                          aria-label={`Hapus State ${index + 1}`}
                          onClick={() => handleRemoveState(index)}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Stack>

                      <Grid container spacing={2}>
                        {/* State Label */}
                        <Grid size={{ xs: 12, sm: 7 }}>
                          <TextField
                            label={`Label State ${index + 1}`}
                            size="small"
                            fullWidth
                            placeholder="Nama state (contoh: Telah Dipesan / Booked)"
                            error={!!stateError?.label}
                            helperText={stateError?.label?.message}
                            {...register(`state_machine.states.${index}.label`)}
                          />
                        </Grid>

                        {/* State Type Select */}
                        <Grid size={{ xs: 12, sm: 5 }}>
                          <Controller
                            control={control}
                            name={`state_machine.states.${index}.type`}
                            render={({ field: selectField, fieldState }) => (
                              <FormControl fullWidth size="small" error={!!fieldState.error}>
                                <InputLabel id={`state-type-label-${index}`}>
                                  Tipe State {index + 1}
                                </InputLabel>
                                <Select
                                  {...selectField}
                                  value={selectField.value ?? 'normal'}
                                  labelId={`state-type-label-${index}`}
                                  label={`Tipe State ${index + 1}`}
                                  inputProps={{ 'aria-label': `Tipe State ${index + 1}` }}
                                >
                                  {STATE_TYPES.map((t) => (
                                    <MenuItem key={t.value} value={t.value}>
                                      {t.label}
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

                        {/* Layout Coordinates */}
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            label={`Posisi X State ${index + 1}`}
                            size="small"
                            type="number"
                            fullWidth
                            error={!!stateError?.layout?.x}
                            helperText={stateError?.layout?.x?.message}
                            {...register(`state_machine.states.${index}.layout.x`, {
                              valueAsNumber: true,
                            })}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            label={`Posisi Y State ${index + 1}`}
                            size="small"
                            type="number"
                            fullWidth
                            error={!!stateError?.layout?.y}
                            helperText={stateError?.layout?.y?.message}
                            {...register(`state_machine.states.${index}.layout.y`, {
                              valueAsNumber: true,
                            })}
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

      {/* ============================================================ */}
      {/* 3. TRANSITIONS */}
      {/* ============================================================ */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                3. Transitions / Perpindahan Status
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Aturan transisi dari satu state ke state lain beserta event pemicu, aktor, kondisi
                guard, dan actions.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleAddTransition}
              disabled={watchedStates.length === 0}
            >
              Tambah Transition
            </Button>
          </Stack>

          {watchedStates.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Tambahkan setidaknya satu State sebelum membuat Transition.
            </Alert>
          ) : null}

          {transitionFields.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
              Belum ada Transition yang ditambahkan.
            </Typography>
          ) : (
            <Stack spacing={2.5}>
              {transitionFields.map((field, index) => {
                const transError = errors?.state_machine?.transitions?.[index];
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
                          Transition #{index + 1}
                        </Typography>
                        <IconButton
                          color="error"
                          size="small"
                          aria-label={`Hapus Transition ${index + 1}`}
                          onClick={() => handleRemoveTransition(index)}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Stack>

                      <Grid container spacing={2}>
                        {/* Source State Select */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Controller
                            control={control}
                            name={`state_machine.transitions.${index}.source`}
                            render={({ field: selectField, fieldState }) => (
                              <FormControl fullWidth size="small" error={!!fieldState.error}>
                                <InputLabel id={`trans-source-label-${index}`}>
                                  Source State {index + 1}
                                </InputLabel>
                                <Select
                                  {...selectField}
                                  value={selectField.value ?? ''}
                                  labelId={`trans-source-label-${index}`}
                                  label={`Source State ${index + 1}`}
                                  inputProps={{ 'aria-label': `Source State ${index + 1}` }}
                                >
                                  {watchedStates.map((s) => (
                                    <MenuItem key={s.id} value={s.id}>
                                      {s.label || s.id}
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

                        {/* Target State Select */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Controller
                            control={control}
                            name={`state_machine.transitions.${index}.target`}
                            render={({ field: selectField, fieldState }) => (
                              <FormControl fullWidth size="small" error={!!fieldState.error}>
                                <InputLabel id={`trans-target-label-${index}`}>
                                  Target State {index + 1}
                                </InputLabel>
                                <Select
                                  {...selectField}
                                  value={selectField.value ?? ''}
                                  labelId={`trans-target-label-${index}`}
                                  label={`Target State ${index + 1}`}
                                  inputProps={{ 'aria-label': `Target State ${index + 1}` }}
                                >
                                  {watchedStates.map((s) => (
                                    <MenuItem key={s.id} value={s.id}>
                                      {s.label || s.id}
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

                        {/* Event */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label={`Event Transition ${index + 1}`}
                            size="small"
                            fullWidth
                            placeholder="Nama aksi/event pemicu (contoh: Check-in Kiosk / Scan QR)"
                            error={!!transError?.event}
                            helperText={transError?.event?.message}
                            {...register(`state_machine.transitions.${index}.event`)}
                          />
                        </Grid>

                        {/* Actor (free string) */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label={`Actor Transition ${index + 1}`}
                            size="small"
                            fullWidth
                            placeholder="Aktor pelaksana (contoh: Pemohon Layanan, Petugas Loket)"
                            error={!!transError?.actor}
                            helperText={transError?.actor?.message}
                            {...register(`state_machine.transitions.${index}.actor`)}
                          />
                        </Grid>

                        {/* Guard */}
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label={`Guard Transition ${index + 1}`}
                            size="small"
                            fullWidth
                            placeholder="Syarat/kondisi transisi diizinkan (contoh: Tiket reservasi valid)"
                            error={!!transError?.guard}
                            helperText={transError?.guard?.message}
                            {...register(`state_machine.transitions.${index}.guard`)}
                          />
                        </Grid>

                        {/* Actions (string array) */}
                        <Grid size={{ xs: 12 }}>
                          <Controller
                            control={control}
                            name={`state_machine.transitions.${index}.actions`}
                            render={({ field: actionsField, fieldState }) => (
                              <ActionInputArray
                                label={`Actions Transition ${index + 1}`}
                                value={actionsField.value || []}
                                onChange={actionsField.onChange}
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
              })}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
