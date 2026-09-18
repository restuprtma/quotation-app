import type { Architecture, ArchitectureNodeType, ArchitectureEdgeType } from '../../types/bundle';

import React, { useState } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import {
  Box,
  Card,
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

export const ARCHITECTURE_NODE_TYPES: { value: ArchitectureNodeType; label: string }[] = [
  { value: 'channel', label: 'Channel / Client' },
  { value: 'application', label: 'Application' },
  { value: 'service', label: 'Service / Microservice' },
  { value: 'database', label: 'Database' },
  { value: 'cache', label: 'Cache' },
  { value: 'storage', label: 'Storage' },
  { value: 'integration', label: 'Integration / 3rd Party' },
  { value: 'device', label: 'Device / Hardware' },
];

export const ARCHITECTURE_EDGE_TYPES: { value: ArchitectureEdgeType; label: string }[] = [
  { value: 'sync', label: 'Synchronous (sync)' },
  { value: 'async', label: 'Asynchronous (async)' },
  { value: 'data_flow', label: 'Data Flow (data_flow)' },
  { value: 'event', label: 'Event / Message (event)' },
];

export interface ArchitectureFieldsProps {
  referenceOptions?: ReferenceOption[];
}

export function ArchitectureFields({ referenceOptions = [] }: ArchitectureFieldsProps) {
  const {
    control,
    register,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<{ architecture: Architecture }>();

  const [deletionError, setDeletionError] = useState<string | null>(null);

  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({
    control,
    name: 'architecture.groups',
  });

  const {
    fields: nodeFields,
    append: appendNode,
    remove: removeNode,
  } = useFieldArray({
    control,
    name: 'architecture.nodes',
  });

  const {
    fields: edgeFields,
    append: appendEdge,
    remove: removeEdge,
  } = useFieldArray({
    control,
    name: 'architecture.edges',
  });

  const watchedGroups = watch('architecture.groups') || [];
  const watchedNodes = watch('architecture.nodes') || [];

  const isEmptySection =
    groupFields.length === 0 && nodeFields.length === 0 && edgeFields.length === 0;

  const handleAddGroup = () => {
    setDeletionError(null);
    appendGroup({
      id: newBlueprintItemId('grp'),
      label: '',
      order: groupFields.length + 1,
    });
  };

  const handleRemoveGroup = (index: number) => {
    setDeletionError(null);
    const groupId = getValues(`architecture.groups.${index}.id`);
    const currentArchitecture = getValues('architecture');
    const guard = checkReferencedItem(groupId, 'group', currentArchitecture);

    if (!guard.allowed) {
      setDeletionError(guard.reason || 'Group ini tidak dapat dihapus.');
      return;
    }

    removeGroup(index);
    const updatedGroups = getValues('architecture.groups') || [];
    updatedGroups.forEach((_, idx) => {
      setValue(`architecture.groups.${idx}.order`, idx + 1);
    });
  };

  const handleAddNode = () => {
    setDeletionError(null);
    appendNode({
      id: newBlueprintItemId('node'),
      group_id: watchedGroups[0]?.id || '',
      type: 'application',
      label: '',
      description: '',
      layout: { x: 0, y: 0 },
    });
  };

  const handleRemoveNode = (index: number) => {
    setDeletionError(null);
    const nodeId = getValues(`architecture.nodes.${index}.id`);
    const currentArchitecture = getValues('architecture');
    const guard = checkReferencedItem(nodeId, 'node', currentArchitecture);

    if (!guard.allowed) {
      setDeletionError(guard.reason || 'Node ini tidak dapat dihapus.');
      return;
    }

    removeNode(index);
  };

  const handleAddEdge = () => {
    setDeletionError(null);
    appendEdge({
      id: newBlueprintItemId('edge'),
      source: watchedNodes[0]?.id || '',
      target: watchedNodes[1]?.id || watchedNodes[0]?.id || '',
      label: '',
      type: 'sync',
    });
  };

  const handleRemoveEdge = (index: number) => {
    setDeletionError(null);
    removeEdge(index);
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
          <strong>WARN_EMPTY_SECTION:</strong> Bagian Architecture belum memiliki baris data.
          Tambahkan setidaknya satu Group, Node, dan Edge untuk menyusun diagram arsitektur sistem.
        </Alert>
      )}

      {/* ============================================================ */}
      {/* 1. GROUPS / TIERS */}
      {/* ============================================================ */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                1. Architectural Groups / Tiers (Lapisan Arsitektur)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Kelompok layer atau boundary infrastruktur (contoh: Presentation Tier, Service Tier,
                Data Tier).
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleAddGroup}
            >
              Tambah Group
            </Button>
          </Stack>

          {groupFields.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
              Belum ada Group yang ditambahkan.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {groupFields.map((field, index) => {
                const groupError = errors?.architecture?.groups?.[index];
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
                          {...register(`architecture.groups.${index}.order`, {
                            valueAsNumber: true,
                          })}
                        />
                      </Grid>
                      <Grid size={{ xs: 8, sm: 9 }}>
                        <TextField
                          label={`Label Group ${index + 1}`}
                          size="small"
                          fullWidth
                          placeholder="Nama group/tier (contoh: Presentation & Channel Tier)"
                          error={!!groupError?.label}
                          helperText={groupError?.label?.message}
                          {...register(`architecture.groups.${index}.label`)}
                        />
                      </Grid>
                      <Grid size={{ xs: 2, sm: 2 }} sx={{ textAlign: 'right' }}>
                        <IconButton
                          color="error"
                          aria-label={`Hapus Group ${index + 1}`}
                          onClick={() => handleRemoveGroup(index)}
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
      {/* 2. NODES / COMPONENTS */}
      {/* ============================================================ */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                2. System Nodes / Components (Komponen Sistem)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Komponen, service, database, aplikasi, atau hardware dalam arsitektur.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleAddNode}
              disabled={watchedGroups.length === 0}
            >
              Tambah Node
            </Button>
          </Stack>

          {watchedGroups.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Tambahkan setidaknya satu Group sebelum membuat Node.
            </Alert>
          ) : null}

          {nodeFields.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
              Belum ada Node yang ditambahkan.
            </Typography>
          ) : (
            <Stack spacing={2.5}>
              {nodeFields.map((field, index) => {
                const nodeError = errors?.architecture?.nodes?.[index];
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
                          Node #{index + 1}
                        </Typography>
                        <IconButton
                          color="error"
                          size="small"
                          aria-label={`Hapus Node ${index + 1}`}
                          onClick={() => handleRemoveNode(index)}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Stack>

                      <Grid container spacing={2}>
                        {/* Group Select */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Controller
                            control={control}
                            name={`architecture.nodes.${index}.group_id`}
                            render={({ field: selectField, fieldState }) => (
                              <FormControl fullWidth size="small" error={!!fieldState.error}>
                                <InputLabel id={`node-group-label-${index}`}>
                                  Group {index + 1}
                                </InputLabel>
                                <Select
                                  {...selectField}
                                  labelId={`node-group-label-${index}`}
                                  label={`Group ${index + 1}`}
                                  inputProps={{ 'aria-label': `Group ${index + 1}` }}
                                >
                                  {watchedGroups.map((g) => (
                                    <MenuItem key={g.id} value={g.id}>
                                      {g.label || g.id}
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

                        {/* Node Type Select */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Controller
                            control={control}
                            name={`architecture.nodes.${index}.type`}
                            render={({ field: selectField, fieldState }) => (
                              <FormControl fullWidth size="small" error={!!fieldState.error}>
                                <InputLabel id={`node-type-label-${index}`}>
                                  Tipe Node {index + 1}
                                </InputLabel>
                                <Select
                                  {...selectField}
                                  labelId={`node-type-label-${index}`}
                                  label={`Tipe Node ${index + 1}`}
                                  inputProps={{ 'aria-label': `Tipe Node ${index + 1}` }}
                                >
                                  {ARCHITECTURE_NODE_TYPES.map((t) => (
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

                        {/* Node Label */}
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label={`Label Node ${index + 1}`}
                            size="small"
                            fullWidth
                            placeholder="Nama node (contoh: Web Portal Pemohon)"
                            error={!!nodeError?.label}
                            helperText={nodeError?.label?.message}
                            {...register(`architecture.nodes.${index}.label`)}
                          />
                        </Grid>

                        {/* Node Description */}
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label={`Deskripsi Node ${index + 1}`}
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Penjelasan fungsi dan peran komponen"
                            error={!!nodeError?.description}
                            helperText={nodeError?.description?.message}
                            {...register(`architecture.nodes.${index}.description`)}
                          />
                        </Grid>

                        {/* Layout Coordinates */}
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            label={`Posisi X Node ${index + 1}`}
                            size="small"
                            type="number"
                            fullWidth
                            error={!!nodeError?.layout?.x}
                            helperText={nodeError?.layout?.x?.message}
                            {...register(`architecture.nodes.${index}.layout.x`, {
                              valueAsNumber: true,
                            })}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            label={`Posisi Y Node ${index + 1}`}
                            size="small"
                            type="number"
                            fullWidth
                            error={!!nodeError?.layout?.y}
                            helperText={nodeError?.layout?.y?.message}
                            {...register(`architecture.nodes.${index}.layout.y`, {
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
      {/* 3. EDGES / CONNECTIONS */}
      {/* ============================================================ */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                3. Architecture Edges / Connections (Koneksi & Relasi)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Aliran data, panggilan protokol (REST/gRPC/WebSocket), atau event broker antar
                komponen.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleAddEdge}
              disabled={watchedNodes.length === 0}
            >
              Tambah Edge
            </Button>
          </Stack>

          {watchedNodes.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Tambahkan setidaknya satu Node sebelum membuat Edge koneksi.
            </Alert>
          ) : null}

          {edgeFields.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
              Belum ada Edge yang ditambahkan.
            </Typography>
          ) : (
            <Stack spacing={2.5}>
              {edgeFields.map((field, index) => {
                const edgeError = errors?.architecture?.edges?.[index];
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
                          Edge #{index + 1}
                        </Typography>
                        <IconButton
                          color="error"
                          size="small"
                          aria-label={`Hapus Edge ${index + 1}`}
                          onClick={() => handleRemoveEdge(index)}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Stack>

                      <Grid container spacing={2}>
                        {/* Source Node Select */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Controller
                            control={control}
                            name={`architecture.edges.${index}.source`}
                            render={({ field: selectField, fieldState }) => (
                              <FormControl fullWidth size="small" error={!!fieldState.error}>
                                <InputLabel id={`edge-source-label-${index}`}>
                                  Source Node {index + 1}
                                </InputLabel>
                                <Select
                                  {...selectField}
                                  labelId={`edge-source-label-${index}`}
                                  label={`Source Node ${index + 1}`}
                                  inputProps={{ 'aria-label': `Source Node ${index + 1}` }}
                                >
                                  {watchedNodes.map((n) => (
                                    <MenuItem key={n.id} value={n.id}>
                                      {n.label || n.id}
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

                        {/* Target Node Select */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Controller
                            control={control}
                            name={`architecture.edges.${index}.target`}
                            render={({ field: selectField, fieldState }) => (
                              <FormControl fullWidth size="small" error={!!fieldState.error}>
                                <InputLabel id={`edge-target-label-${index}`}>
                                  Target Node {index + 1}
                                </InputLabel>
                                <Select
                                  {...selectField}
                                  labelId={`edge-target-label-${index}`}
                                  label={`Target Node ${index + 1}`}
                                  inputProps={{ 'aria-label': `Target Node ${index + 1}` }}
                                >
                                  {watchedNodes.map((n) => (
                                    <MenuItem key={n.id} value={n.id}>
                                      {n.label || n.id}
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

                        {/* Edge Label */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label={`Label Edge ${index + 1}`}
                            size="small"
                            fullWidth
                            placeholder="Protokol / Deskripsi (contoh: HTTPS REST / JSON)"
                            error={!!edgeError?.label}
                            helperText={edgeError?.label?.message}
                            {...register(`architecture.edges.${index}.label`)}
                          />
                        </Grid>

                        {/* Edge Type Select */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Controller
                            control={control}
                            name={`architecture.edges.${index}.type`}
                            render={({ field: selectField, fieldState }) => (
                              <FormControl fullWidth size="small" error={!!fieldState.error}>
                                <InputLabel id={`edge-type-label-${index}`}>
                                  Tipe Edge {index + 1}
                                </InputLabel>
                                <Select
                                  {...selectField}
                                  labelId={`edge-type-label-${index}`}
                                  label={`Tipe Edge ${index + 1}`}
                                  inputProps={{ 'aria-label': `Tipe Edge ${index + 1}` }}
                                >
                                  {ARCHITECTURE_EDGE_TYPES.map((t) => (
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
