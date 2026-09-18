import type { Workflow, WorkflowNodeType } from '../../types/bundle';

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

export const WORKFLOW_NODE_TYPES: { value: WorkflowNodeType; label: string }[] = [
  { value: 'start', label: 'Start / Mulai (start)' },
  { value: 'action', label: 'User Action / Tindakan Pemohon (action)' },
  { value: 'system_action', label: 'System Action / Proses Sistem (system_action)' },
  { value: 'decision', label: 'Decision / Percabangan (decision)' },
  { value: 'wait', label: 'Wait / Menunggu (wait)' },
  { value: 'end', label: 'End / Selesai (end)' },
];

export interface WorkflowFieldsProps {
  referenceOptions?: ReferenceOption[];
}

interface WorkflowItemFieldsProps {
  workflowIndex: number;
  onRemove: () => void;
  setDeletionError: (error: string | null) => void;
}

function WorkflowItemFields({
  workflowIndex,
  onRemove,
  setDeletionError,
}: WorkflowItemFieldsProps) {
  const {
    control,
    register,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<{ workflows: Workflow[] }>();

  const {
    fields: laneFields,
    append: appendLane,
    remove: removeLane,
  } = useFieldArray({
    control,
    name: `workflows.${workflowIndex}.lanes`,
  });

  const {
    fields: nodeFields,
    append: appendNode,
    remove: removeNode,
  } = useFieldArray({
    control,
    name: `workflows.${workflowIndex}.nodes`,
  });

  const {
    fields: edgeFields,
    append: appendEdge,
    remove: removeEdge,
  } = useFieldArray({
    control,
    name: `workflows.${workflowIndex}.edges`,
  });

  const watchedLanes = watch(`workflows.${workflowIndex}.lanes`) || [];
  const watchedNodes = watch(`workflows.${workflowIndex}.nodes`) || [];

  const wfError = errors?.workflows?.[workflowIndex];

  const handleAddLane = () => {
    setDeletionError(null);
    appendLane({
      id: newBlueprintItemId('lane'),
      label: '',
      order: laneFields.length + 1,
    });
  };

  const handleRemoveLane = (laneIndex: number) => {
    setDeletionError(null);
    const currentWorkflow = getValues(`workflows.${workflowIndex}`);
    const laneId = getValues(`workflows.${workflowIndex}.lanes.${laneIndex}.id`);
    const guard = checkReferencedItem(laneId, 'lane', currentWorkflow);

    if (!guard.allowed) {
      setDeletionError(guard.reason || 'Lane ini tidak dapat dihapus.');
      return;
    }

    removeLane(laneIndex);
    const updatedLanes = getValues(`workflows.${workflowIndex}.lanes`) || [];
    updatedLanes.forEach((_, idx) => {
      setValue(`workflows.${workflowIndex}.lanes.${idx}.order`, idx + 1);
    });
  };

  const handleAddNode = () => {
    setDeletionError(null);
    appendNode({
      id: newBlueprintItemId('wnode'),
      lane_id: watchedLanes[0]?.id || '',
      type: 'action',
      label: '',
      description: '',
      layout: { x: 0, y: 0 },
    });
  };

  const handleRemoveNode = (nodeIndex: number) => {
    setDeletionError(null);
    const currentWorkflow = getValues(`workflows.${workflowIndex}`);
    const nodeId = getValues(`workflows.${workflowIndex}.nodes.${nodeIndex}.id`);
    const guard = checkReferencedItem(nodeId, 'wnode', currentWorkflow);

    if (!guard.allowed) {
      setDeletionError(guard.reason || 'Node ini tidak dapat dihapus.');
      return;
    }

    removeNode(nodeIndex);
  };

  const handleAddEdge = () => {
    setDeletionError(null);
    appendEdge({
      id: newBlueprintItemId('wedge'),
      source: watchedNodes[0]?.id || '',
      target: watchedNodes[1]?.id || watchedNodes[0]?.id || '',
      label: '',
    });
  };

  const handleRemoveEdge = (edgeIndex: number) => {
    setDeletionError(null);
    removeEdge(edgeIndex);
  };

  return (
    <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Stack spacing={3}>
        {/* Header Workflow */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" color="primary">
            Workflow #{workflowIndex + 1}
          </Typography>
          <IconButton
            color="error"
            aria-label={`Hapus Workflow ${workflowIndex + 1}`}
            onClick={onRemove}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Stack>

        {/* Workflow Info */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={`Nama Workflow ${workflowIndex + 1}`}
              size="small"
              fullWidth
              placeholder="Nama alur proses (contoh: Alur Pendaftaran Online)"
              error={!!wfError?.name}
              helperText={wfError?.name?.message}
              {...register(`workflows.${workflowIndex}.name`)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={`Deskripsi Workflow ${workflowIndex + 1}`}
              size="small"
              fullWidth
              multiline
              rows={1}
              placeholder="Penjelasan ringkas alur kerja"
              error={!!wfError?.description}
              helperText={wfError?.description?.message}
              {...register(`workflows.${workflowIndex}.description`)}
            />
          </Grid>
        </Grid>

        {/* 1. LANES */}
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
                  Swimlanes (Jalur Peran / Sistem)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Jalur partisi horizontal untuk memisahkan tanggung jawab aktor atau komponen
                  sistem.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleAddLane}
                aria-label={`Tambah Lane Workflow ${workflowIndex + 1}`}
              >
                Tambah Lane
              </Button>
            </Stack>

            {laneFields.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: 'italic', py: 1 }}
              >
                Belum ada Lane yang ditambahkan.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {laneFields.map((field, lIdx) => {
                  const laneError = wfError?.lanes?.[lIdx];
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
                            {...register(`workflows.${workflowIndex}.lanes.${lIdx}.order`, {
                              valueAsNumber: true,
                            })}
                          />
                        </Grid>
                        <Grid size={{ xs: 8, sm: 9 }}>
                          <TextField
                            label={`Label Lane ${lIdx + 1} Workflow ${workflowIndex + 1}`}
                            size="small"
                            fullWidth
                            placeholder="Nama swimlane (contoh: Pemohon Layanan, Petugas Loket)"
                            error={!!laneError?.label}
                            helperText={laneError?.label?.message}
                            {...register(`workflows.${workflowIndex}.lanes.${lIdx}.label`)}
                          />
                        </Grid>
                        <Grid size={{ xs: 2, sm: 2 }} sx={{ textAlign: 'right' }}>
                          <IconButton
                            color="error"
                            aria-label={`Hapus Lane ${lIdx + 1} Workflow ${workflowIndex + 1}`}
                            onClick={() => handleRemoveLane(lIdx)}
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

        {/* 2. NODES */}
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
                  Nodes / Steps (Langkah Alur Kerja)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Titik langkah, keputusan, proses, atau status akhir pada diagram alur kerja.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleAddNode}
                disabled={watchedLanes.length === 0}
                aria-label={`Tambah Node Workflow ${workflowIndex + 1}`}
              >
                Tambah Node
              </Button>
            </Stack>

            {watchedLanes.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Tambahkan setidaknya satu Lane sebelum membuat Node.
              </Alert>
            ) : null}

            {nodeFields.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: 'italic', py: 1 }}
              >
                Belum ada Node yang ditambahkan.
              </Typography>
            ) : (
              <Stack spacing={2.5}>
                {nodeFields.map((field, nIdx) => {
                  const nodeError = wfError?.nodes?.[nIdx];
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
                            Node #{nIdx + 1}
                          </Typography>
                          <IconButton
                            color="error"
                            size="small"
                            aria-label={`Hapus Node ${nIdx + 1} Workflow ${workflowIndex + 1}`}
                            onClick={() => handleRemoveNode(nIdx)}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        </Stack>

                        <Grid container spacing={2}>
                          {/* Lane Select */}
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                              control={control}
                              name={`workflows.${workflowIndex}.nodes.${nIdx}.lane_id`}
                              render={({ field: selectField, fieldState }) => (
                                <FormControl fullWidth size="small" error={!!fieldState.error}>
                                  <InputLabel id={`node-lane-label-${workflowIndex}-${nIdx}`}>
                                    {`Pilih Lane Node ${nIdx + 1} Workflow ${workflowIndex + 1}`}
                                  </InputLabel>
                                  <Select
                                    {...selectField}
                                    value={selectField.value ?? ''}
                                    labelId={`node-lane-label-${workflowIndex}-${nIdx}`}
                                    label={`Pilih Lane Node ${nIdx + 1} Workflow ${workflowIndex + 1}`}
                                    inputProps={{
                                      'aria-label': `Pilih Lane Node ${nIdx + 1} Workflow ${workflowIndex + 1}`,
                                    }}
                                  >
                                    {watchedLanes.map((l) => (
                                      <MenuItem key={l.id} value={l.id}>
                                        {l.label || l.id}
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
                              name={`workflows.${workflowIndex}.nodes.${nIdx}.type`}
                              render={({ field: selectField, fieldState }) => (
                                <FormControl fullWidth size="small" error={!!fieldState.error}>
                                  <InputLabel id={`node-type-label-${workflowIndex}-${nIdx}`}>
                                    {`Tipe Node ${nIdx + 1} Workflow ${workflowIndex + 1}`}
                                  </InputLabel>
                                  <Select
                                    {...selectField}
                                    value={selectField.value ?? 'action'}
                                    labelId={`node-type-label-${workflowIndex}-${nIdx}`}
                                    label={`Tipe Node ${nIdx + 1} Workflow ${workflowIndex + 1}`}
                                    inputProps={{
                                      'aria-label': `Tipe Node ${nIdx + 1} Workflow ${workflowIndex + 1}`,
                                    }}
                                  >
                                    {WORKFLOW_NODE_TYPES.map((t) => (
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
                              label={`Label Node ${nIdx + 1} Workflow ${workflowIndex + 1}`}
                              size="small"
                              fullWidth
                              placeholder="Nama langkah alur kerja (contoh: Pilih Kategori Layanan)"
                              error={!!nodeError?.label}
                              helperText={nodeError?.label?.message}
                              {...register(`workflows.${workflowIndex}.nodes.${nIdx}.label`)}
                            />
                          </Grid>

                          {/* Node Description */}
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              label={`Deskripsi Node ${nIdx + 1} Workflow ${workflowIndex + 1}`}
                              size="small"
                              fullWidth
                              multiline
                              rows={2}
                              placeholder="Penjelasan detail langkah pada alur kerja"
                              error={!!nodeError?.description}
                              helperText={nodeError?.description?.message}
                              {...register(`workflows.${workflowIndex}.nodes.${nIdx}.description`)}
                            />
                          </Grid>

                          {/* Layout Coordinates */}
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <TextField
                              label={`Posisi X Node ${nIdx + 1}`}
                              size="small"
                              type="number"
                              fullWidth
                              error={!!nodeError?.layout?.x}
                              helperText={nodeError?.layout?.x?.message}
                              {...register(`workflows.${workflowIndex}.nodes.${nIdx}.layout.x`, {
                                valueAsNumber: true,
                              })}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <TextField
                              label={`Posisi Y Node ${nIdx + 1}`}
                              size="small"
                              type="number"
                              fullWidth
                              error={!!nodeError?.layout?.y}
                              helperText={nodeError?.layout?.y?.message}
                              {...register(`workflows.${workflowIndex}.nodes.${nIdx}.layout.y`, {
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

        {/* 3. EDGES */}
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
                  Edges / Connectors (Garis Penghubung Antar Langkah)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Garis transisi alur dari satu Node ke Node lain beserta kondisi/keterangannya.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleAddEdge}
                disabled={watchedNodes.length === 0}
                aria-label={`Tambah Edge Workflow ${workflowIndex + 1}`}
              >
                Tambah Edge
              </Button>
            </Stack>

            {watchedNodes.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Tambahkan setidaknya satu Node sebelum membuat Edge.
              </Alert>
            ) : null}

            {edgeFields.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: 'italic', py: 1 }}
              >
                Belum ada Edge yang ditambahkan.
              </Typography>
            ) : (
              <Stack spacing={2.5}>
                {edgeFields.map((field, eIdx) => {
                  const edgeError = wfError?.edges?.[eIdx];
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
                            Edge #{eIdx + 1}
                          </Typography>
                          <IconButton
                            color="error"
                            size="small"
                            aria-label={`Hapus Edge ${eIdx + 1} Workflow ${workflowIndex + 1}`}
                            onClick={() => handleRemoveEdge(eIdx)}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        </Stack>

                        <Grid container spacing={2}>
                          {/* Source Node Select */}
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                              control={control}
                              name={`workflows.${workflowIndex}.edges.${eIdx}.source`}
                              render={({ field: selectField, fieldState }) => (
                                <FormControl fullWidth size="small" error={!!fieldState.error}>
                                  <InputLabel id={`edge-source-label-${workflowIndex}-${eIdx}`}>
                                    {`Source Node Edge ${eIdx + 1} Workflow ${workflowIndex + 1}`}
                                  </InputLabel>
                                  <Select
                                    {...selectField}
                                    value={selectField.value ?? ''}
                                    labelId={`edge-source-label-${workflowIndex}-${eIdx}`}
                                    label={`Source Node Edge ${eIdx + 1} Workflow ${workflowIndex + 1}`}
                                    inputProps={{
                                      'aria-label': `Source Node Edge ${eIdx + 1} Workflow ${workflowIndex + 1}`,
                                    }}
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
                              name={`workflows.${workflowIndex}.edges.${eIdx}.target`}
                              render={({ field: selectField, fieldState }) => (
                                <FormControl fullWidth size="small" error={!!fieldState.error}>
                                  <InputLabel id={`edge-target-label-${workflowIndex}-${eIdx}`}>
                                    {`Target Node Edge ${eIdx + 1} Workflow ${workflowIndex + 1}`}
                                  </InputLabel>
                                  <Select
                                    {...selectField}
                                    value={selectField.value ?? ''}
                                    labelId={`edge-target-label-${workflowIndex}-${eIdx}`}
                                    label={`Target Node Edge ${eIdx + 1} Workflow ${workflowIndex + 1}`}
                                    inputProps={{
                                      'aria-label': `Target Node Edge ${eIdx + 1} Workflow ${workflowIndex + 1}`,
                                    }}
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
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              label={`Label Edge ${eIdx + 1} Workflow ${workflowIndex + 1}`}
                              size="small"
                              fullWidth
                              placeholder="Keterangan alur / kondisi (contoh: Submit Form, Slot Tersedia)"
                              error={!!edgeError?.label}
                              helperText={edgeError?.label?.message}
                              {...register(`workflows.${workflowIndex}.edges.${eIdx}.label`)}
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
    </Card>
  );
}

export function WorkflowFields({ referenceOptions = [] }: WorkflowFieldsProps) {
  void referenceOptions;
  const { control } = useFormContext<{ workflows: Workflow[] }>();

  const [deletionError, setDeletionError] = useState<string | null>(null);

  const {
    fields: workflowFields,
    append: appendWorkflow,
    remove: removeWorkflow,
  } = useFieldArray({
    control,
    name: 'workflows',
  });

  const isEmptySection = workflowFields.length === 0;

  const handleAddWorkflow = () => {
    setDeletionError(null);
    appendWorkflow({
      id: newBlueprintItemId('wf'),
      name: '',
      description: '',
      lanes: [],
      nodes: [],
      edges: [],
    });
  };

  const handleRemoveWorkflow = (index: number) => {
    setDeletionError(null);
    removeWorkflow(index);
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
          <strong>WARN_EMPTY_SECTION:</strong> Bagian Workflow belum memiliki baris data. Tambahkan
          setidaknya satu Workflow beserta Lane, Node, dan Edge untuk mendefinisikan diagram alur
          kerja.
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Workflow Diagrams (Diagram Alur Kerja & Swimlane)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Definisikan satu atau lebih alur kerja proses bisnis lengkap dengan pembagian swimlane,
            langkah node, dan transisi edge.
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="medium"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={handleAddWorkflow}
        >
          Tambah Workflow
        </Button>
      </Stack>

      {workflowFields.map((field, index) => (
        <WorkflowItemFields
          key={field.id}
          workflowIndex={index}
          onRemove={() => handleRemoveWorkflow(index)}
          setDeletionError={setDeletionError}
        />
      ))}
    </Stack>
  );
}
