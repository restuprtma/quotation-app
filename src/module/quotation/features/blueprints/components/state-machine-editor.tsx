import type { Edge, Node, Connection, EdgeChange, NodeChange } from '@xyflow/react';
import type { CanonicalIssue } from '../types';
import type { LayoutDirection } from '../utils/dagre-layout';
import type { ReferenceOption } from '../validation/manual-section';
import type { State, StateType, Transition, StateMachine } from '../types/bundle';

import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import ButtonGroup from '@mui/material/ButtonGroup';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/shared/ui/iconify';

import { STATE_TYPES } from './manual/state-machine-fields';
import { BlueprintFlowCanvas } from './blueprint-flow-canvas';
import { newBlueprintItemId } from '../validation/manual-payload';
import {
  stateMachineToReactFlow,
  reactFlowToStateMachine,
  applyStateMachineAutoLayout,
} from '../validation/flow-adapter';

// ----------------------------------------------------------------------

export interface StateMachineEditorProps {
  stateMachine: StateMachine;
  onChange: (updatedStateMachine: StateMachine) => void;
  referenceOptions?: ReferenceOption[];
  issues?: CanonicalIssue[];
  focusTargetId?: string | null;
  readOnly?: boolean;
}

interface DeleteStateConfirmationState {
  state: State;
  affectedTransitions: Transition[];
}

// Helper component for managing actions array in transitions
function ActionInputArray({
  label,
  value = [],
  onChange,
  disabled,
}: {
  label: string;
  value: string[];
  onChange: (val: string[]) => void;
  disabled?: boolean;
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
        disabled={disabled}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Ketik action & tekan Enter (contoh: Kirim notifikasi, Catat audit log)"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
          }
        }}
        InputProps={{
          endAdornment: (
            <IconButton
              size="small"
              onClick={handleAdd}
              disabled={disabled || !inputValue.trim()}
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
            onDelete={
              disabled
                ? undefined
                : () => {
                    onChange(value.filter((_, i) => i !== actIdx));
                  }
            }
            sx={{ mr: 0.5, mb: 0.5 }}
          />
        ))}
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function StateMachineEditor({
  stateMachine,
  onChange,
  referenceOptions = [],
  issues = [],
  focusTargetId = null,
  readOnly = false,
}: StateMachineEditorProps) {
  // Layout direction state
  const [layoutDir, setLayoutDir] = useState<LayoutDirection>('LR');

  // React Flow state synchronized with stateMachine prop
  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  const [rfEdges, setRfEdges] = useState<Edge[]>([]);

  useEffect(() => {
    const { nodes, edges } = stateMachineToReactFlow(stateMachine);
    setRfNodes(nodes);
    setRfEdges(edges);
  }, [stateMachine]);

  // Dialog states
  const [stateDialogOpen, setStateDialogOpen] = useState(false);
  const [editingState, setEditingState] = useState<State | null>(null);
  const [stateForm, setStateForm] = useState<{
    label: string;
    type: StateType;
    isInitial: boolean;
  }>({
    label: '',
    type: 'normal',
    isInitial: false,
  });

  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [editingTransition, setEditingTransition] = useState<Transition | null>(null);
  const [transitionForm, setTransitionForm] = useState<{
    source: string;
    target: string;
    event: string;
    actor: string;
    guard: string;
    actions: string[];
  }>({
    source: '',
    target: '',
    event: '',
    actor: '',
    guard: '',
    actions: [],
  });

  const [deleteStateConfirmation, setDeleteStateConfirmation] =
    useState<DeleteStateConfirmationState | null>(null);

  const states = useMemo(() => stateMachine.states || [], [stateMachine.states]);
  const transitions = useMemo(() => stateMachine.transitions || [], [stateMachine.transitions]);

  // ----------------------------------------------------------------------
  // React Flow Node & Edge Handlers
  // ----------------------------------------------------------------------

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (readOnly) return;
      setRfNodes((prevNodes) => {
        const nextNodes = applyNodeChanges(changes, prevNodes);
        const hasPositionChange = changes.some(
          (c) => c.type === 'position' && (c as any).dragging === false
        );
        if (hasPositionChange) {
          const updatedSm = reactFlowToStateMachine(
            nextNodes,
            rfEdges,
            stateMachine.entity,
            stateMachine.initial_state
          );
          onChange(updatedSm);
        }
        return nextNodes;
      });
    },
    [readOnly, rfEdges, stateMachine.entity, stateMachine.initial_state, onChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (readOnly) return;
      setRfEdges((prevEdges) => {
        const nextEdges = applyEdgeChanges(changes, prevEdges);
        const hasRemoval = changes.some((c) => c.type === 'remove');
        if (hasRemoval) {
          const updatedSm = reactFlowToStateMachine(
            rfNodes,
            nextEdges,
            stateMachine.entity,
            stateMachine.initial_state
          );
          onChange(updatedSm);
        }
        return nextEdges;
      });
    },
    [readOnly, rfNodes, stateMachine.entity, stateMachine.initial_state, onChange]
  );

  const handleConnect = useCallback(
    (params: Connection) => {
      if (readOnly || !params.source || !params.target) return;
      const newTransId = newBlueprintItemId('trans');
      const newTrans: Transition = {
        id: newTransId,
        source: params.source,
        target: params.target,
        event: 'Event Baru',
        actor: 'User / System',
        guard: '',
        actions: [],
      };
      const updatedTransitions = [...transitions, newTrans];
      onChange({
        ...stateMachine,
        transitions: updatedTransitions,
      });
    },
    [readOnly, stateMachine, transitions, onChange]
  );

  // ----------------------------------------------------------------------
  // Entity & Initial State Handlers
  // ----------------------------------------------------------------------

  const handleEntityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    onChange({
      ...stateMachine,
      entity: e.target.value,
    });
  };

  const handleInitialStateChange = (newInitialId: string) => {
    if (readOnly) return;
    onChange({
      ...stateMachine,
      initial_state: newInitialId,
    });
  };

  // ----------------------------------------------------------------------
  // State CRUD Handlers
  // ----------------------------------------------------------------------

  const handleOpenAddState = () => {
    if (readOnly) return;
    setEditingState(null);
    setStateForm({
      label: '',
      type: 'normal',
      isInitial: states.length === 0,
    });
    setStateDialogOpen(true);
  };

  const handleOpenEditState = (state: State) => {
    if (readOnly) return;
    setEditingState(state);
    setStateForm({
      label: state.label,
      type: state.type,
      isInitial: stateMachine.initial_state === state.id,
    });
    setStateDialogOpen(true);
  };

  const handleSaveStateDialog = () => {
    if (readOnly || !stateForm.label.trim()) return;

    if (editingState) {
      // Edit existing state
      const updatedStates = states.map((s) =>
        s.id === editingState.id
          ? {
              ...s,
              label: stateForm.label.trim(),
              type: stateForm.type,
            }
          : s
      );

      let updatedInitial = stateMachine.initial_state;
      if (stateForm.isInitial) {
        updatedInitial = editingState.id;
      } else if (stateMachine.initial_state === editingState.id) {
        updatedInitial = updatedStates.find((s) => s.id !== editingState.id)?.id || '';
      }

      onChange({
        ...stateMachine,
        initial_state: updatedInitial,
        states: updatedStates,
      });
    } else {
      // Create new state with stable ID
      const newStateId = newBlueprintItemId('state');
      const newState: State = {
        id: newStateId,
        label: stateForm.label.trim(),
        type: stateForm.type,
        layout: {
          x: 100 + (states.length % 5) * 180,
          y: 100 + Math.floor(states.length / 5) * 120,
        },
      };

      const updatedStates = [...states, newState];
      const updatedInitial =
        stateForm.isInitial || !stateMachine.initial_state
          ? newStateId
          : stateMachine.initial_state;

      onChange({
        ...stateMachine,
        initial_state: updatedInitial,
        states: updatedStates,
      });
    }

    setStateDialogOpen(false);
  };

  const handleRequestDeleteState = (state: State) => {
    if (readOnly) return;
    const affected = transitions.filter((t) => t.source === state.id || t.target === state.id);
    if (affected.length > 0) {
      setDeleteStateConfirmation({
        state,
        affectedTransitions: affected,
      });
    } else {
      executeDeleteState(state.id);
    }
  };

  const executeDeleteState = (stateId: string) => {
    const updatedStates = states.filter((s) => s.id !== stateId);
    const updatedTransitions = transitions.filter(
      (t) => t.source !== stateId && t.target !== stateId
    );

    let updatedInitial = stateMachine.initial_state;
    if (stateMachine.initial_state === stateId) {
      updatedInitial = updatedStates[0]?.id || '';
    }

    onChange({
      ...stateMachine,
      initial_state: updatedInitial,
      states: updatedStates,
      transitions: updatedTransitions,
    });
    setDeleteStateConfirmation(null);
  };

  // ----------------------------------------------------------------------
  // Transition CRUD Handlers
  // ----------------------------------------------------------------------

  const handleOpenAddTransition = () => {
    if (readOnly || states.length === 0) return;
    setEditingTransition(null);
    setTransitionForm({
      source: states[0]?.id || '',
      target: states[1]?.id || states[0]?.id || '',
      event: '',
      actor: '',
      guard: '',
      actions: [],
    });
    setTransitionDialogOpen(true);
  };

  const handleOpenEditTransition = (trans: Transition) => {
    if (readOnly) return;
    setEditingTransition(trans);
    setTransitionForm({
      source: trans.source,
      target: trans.target,
      event: trans.event,
      actor: trans.actor,
      guard: trans.guard || '',
      actions: trans.actions || [],
    });
    setTransitionDialogOpen(true);
  };

  const handleSaveTransitionDialog = () => {
    if (readOnly || !transitionForm.event.trim()) return;

    if (editingTransition) {
      const updatedTransitions = transitions.map((t) =>
        t.id === editingTransition.id
          ? {
              ...t,
              source: transitionForm.source,
              target: transitionForm.target,
              event: transitionForm.event.trim(),
              actor: transitionForm.actor.trim(),
              guard: transitionForm.guard.trim(),
              actions: transitionForm.actions,
            }
          : t
      );
      onChange({
        ...stateMachine,
        transitions: updatedTransitions,
      });
    } else {
      const newTransId = newBlueprintItemId('trans');
      const newTrans: Transition = {
        id: newTransId,
        source: transitionForm.source,
        target: transitionForm.target,
        event: transitionForm.event.trim(),
        actor: transitionForm.actor.trim(),
        guard: transitionForm.guard.trim(),
        actions: transitionForm.actions,
      };
      onChange({
        ...stateMachine,
        transitions: [...transitions, newTrans],
      });
    }

    setTransitionDialogOpen(false);
  };

  const handleDeleteTransition = (transId: string) => {
    if (readOnly) return;
    onChange({
      ...stateMachine,
      transitions: transitions.filter((t) => t.id !== transId),
    });
  };

  // ----------------------------------------------------------------------
  // Auto-Layout Handler
  // ----------------------------------------------------------------------

  const handleAutoLayout = (dir?: LayoutDirection) => {
    if (readOnly) return;
    const targetDir = dir || layoutDir;
    setLayoutDir(targetDir);
    const layouted = applyStateMachineAutoLayout(stateMachine, targetDir);
    onChange(layouted);
  };

  // ----------------------------------------------------------------------
  // React Flow Click Handlers
  // ----------------------------------------------------------------------

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    if (readOnly) return;
    const matchedState = states.find((s) => s.id === node.id);
    if (matchedState) {
      handleOpenEditState(matchedState);
    }
  };

  const handleEdgeClick = (_: React.MouseEvent, edge: Edge) => {
    if (readOnly) return;
    const matchedTrans = transitions.find((t) => t.id === edge.id);
    if (matchedTrans) {
      handleOpenEditTransition(matchedTrans);
    }
  };

  return (
    <Box
      data-testid="state-machine-editor"
      sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
    >
      {/* 1. Entity and Initial State Controls Card */}
      <Card variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Nama Entity"
              size="small"
              fullWidth
              disabled={readOnly}
              value={stateMachine.entity || ''}
              onChange={handleEntityChange}
              placeholder="Contoh: Tiket Antrean Layanan, Permohonan Dokumen"
              helperText="Entitas bisnis utama yang status siklus hidupnya didefinisikan"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small" disabled={readOnly}>
              <InputLabel id="sm-initial-state-label">Initial State</InputLabel>
              <Select
                labelId="sm-initial-state-label"
                label="Initial State"
                value={stateMachine.initial_state || ''}
                onChange={(e) => handleInitialStateChange(e.target.value)}
                inputProps={{ 'aria-label': 'Initial State' }}
              >
                {states.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        size="small"
                        label={s.type}
                        color={
                          s.type === 'terminal'
                            ? 'success'
                            : s.type === 'exception'
                              ? 'error'
                              : 'primary'
                        }
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                      <span>{s.label || s.id}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* 2. Toolbar & Metrics */}
      <Card variant="outlined" sx={{ p: 1.5 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1.5}
        >
          {/* Action Buttons */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="contained"
              size="small"
              color="primary"
              disabled={readOnly}
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleOpenAddState}
            >
              Tambah State
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="primary"
              disabled={readOnly || states.length === 0}
              startIcon={<Iconify icon="solar:round-transfer-horizontal-bold" />}
              onClick={handleOpenAddTransition}
            >
              Tambah Transition
            </Button>
          </Stack>

          {/* Auto-Layout Controls & Counters */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ButtonGroup variant="outlined" size="small" disabled={readOnly}>
              <Button
                variant={layoutDir === 'LR' ? 'contained' : 'outlined'}
                onClick={() => handleAutoLayout('LR')}
                startIcon={<Iconify icon="solar:align-left-bold" />}
              >
                Auto-Layout (LR)
              </Button>
              <Button
                variant={layoutDir === 'TB' ? 'contained' : 'outlined'}
                onClick={() => handleAutoLayout('TB')}
                startIcon={<Iconify icon="solar:align-top-bold" />}
              >
                TB
              </Button>
            </ButtonGroup>

            <Chip size="small" label={`${states.length} States`} color="primary" variant="soft" />
            <Chip
              size="small"
              label={`${transitions.length} Transitions`}
              color="info"
              variant="soft"
            />
          </Stack>
        </Stack>
      </Card>

      {/* 3. Interactive Flow Canvas */}
      <Card variant="outlined" sx={{ overflow: 'hidden' }}>
        <BlueprintFlowCanvas
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          focusTargetId={focusTargetId}
          readOnly={readOnly}
          height={550}
        />
      </Card>

      {/* 4. Tabular / List Detail View for States & Transitions */}
      <Grid container spacing={2}>
        {/* States List */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1.5 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Daftar States ({states.length})
                </Typography>
                <Button
                  size="small"
                  disabled={readOnly}
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={handleOpenAddState}
                >
                  Tambah
                </Button>
              </Stack>

              {states.length === 0 ? (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  Belum ada state. Klik tombol Tambah State untuk mulai menyusun.
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {states.map((st) => {
                    const isInitial = stateMachine.initial_state === st.id;
                    return (
                      <Box
                        key={st.id}
                        sx={{
                          p: 1.25,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: isInitial ? 'warning.main' : 'divider',
                          bgcolor: isInitial ? 'warning.lighter' : 'background.neutral',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {isInitial && (
                            <Chip
                              size="small"
                              label="INITIAL"
                              color="warning"
                              sx={{ height: 20, fontSize: '0.625rem', fontWeight: 700 }}
                            />
                          )}
                          <Chip
                            size="small"
                            label={st.type}
                            color={
                              st.type === 'terminal'
                                ? 'success'
                                : st.type === 'exception'
                                  ? 'error'
                                  : 'default'
                            }
                            sx={{ height: 20, fontSize: '0.625rem' }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {st.label || st.id}
                          </Typography>
                        </Box>

                        {!readOnly && (
                          <Stack direction="row" spacing={0.5}>
                            <IconButton
                              size="small"
                              aria-label={`Edit State ${st.label || st.id}`}
                              onClick={() => handleOpenEditState(st)}
                            >
                              <Iconify icon="solar:pen-bold" width={16} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              aria-label={`Hapus State ${st.label || st.id}`}
                              onClick={() => handleRequestDeleteState(st)}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                            </IconButton>
                          </Stack>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Transitions List */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1.5 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Daftar Transitions ({transitions.length})
                </Typography>
                <Button
                  size="small"
                  disabled={readOnly || states.length === 0}
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={handleOpenAddTransition}
                >
                  Tambah
                </Button>
              </Stack>

              {transitions.length === 0 ? (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  Belum ada transition antar state.
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {transitions.map((tr) => {
                    const srcState = states.find((s) => s.id === tr.source);
                    const tgtState = states.find((s) => s.id === tr.target);
                    return (
                      <Box
                        key={tr.id}
                        sx={{
                          p: 1.25,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.neutral',
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {tr.event || tr.id}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {srcState?.label || tr.source} &rarr; {tgtState?.label || tr.target}
                            </Typography>
                          </Box>

                          {!readOnly && (
                            <Stack direction="row" spacing={0.5}>
                              <IconButton
                                size="small"
                                aria-label={`Edit Transition ${tr.event || tr.id}`}
                                onClick={() => handleOpenEditTransition(tr)}
                              >
                                <Iconify icon="solar:pen-bold" width={16} />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                aria-label={`Hapus Transition ${tr.event || tr.id}`}
                                onClick={() => handleDeleteTransition(tr.id)}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                              </IconButton>
                            </Stack>
                          )}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ============================================================ */}
      {/* 5. DIALOGS */}
      {/* ============================================================ */}

      {/* State Dialog (Add / Edit) */}
      <Dialog
        open={stateDialogOpen}
        onClose={() => setStateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingState ? 'Edit State Siklus Hidup' : 'Tambah State Baru'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Label State"
              size="small"
              fullWidth
              autoFocus
              value={stateForm.label}
              onChange={(e) => setStateForm((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="Contoh: Menunggu Verifikasi, Dalam Pelayanan, Selesai"
            />

            <FormControl fullWidth size="small">
              <InputLabel id="state-type-select-label">Tipe State</InputLabel>
              <Select
                labelId="state-type-select-label"
                label="Tipe State"
                value={stateForm.type}
                onChange={(e) =>
                  setStateForm((prev) => ({ ...prev, type: e.target.value as StateType }))
                }
              >
                {STATE_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStateDialogOpen(false)}>Batal</Button>
          <Button
            variant="contained"
            onClick={handleSaveStateDialog}
            disabled={!stateForm.label.trim()}
          >
            Simpan State
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transition Dialog (Add / Edit) */}
      <Dialog
        open={transitionDialogOpen}
        onClose={() => setTransitionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingTransition ? 'Edit Transition' : 'Tambah Transition Baru'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="trans-source-label">Source State</InputLabel>
                  <Select
                    labelId="trans-source-label"
                    label="Source State"
                    value={transitionForm.source}
                    onChange={(e) =>
                      setTransitionForm((prev) => ({ ...prev, source: e.target.value }))
                    }
                  >
                    {states.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.label || s.id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="trans-target-label">Target State</InputLabel>
                  <Select
                    labelId="trans-target-label"
                    label="Target State"
                    value={transitionForm.target}
                    onChange={(e) =>
                      setTransitionForm((prev) => ({ ...prev, target: e.target.value }))
                    }
                  >
                    {states.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.label || s.id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              label="Event Transition"
              size="small"
              fullWidth
              value={transitionForm.event}
              onChange={(e) => setTransitionForm((prev) => ({ ...prev, event: e.target.value }))}
              placeholder="Nama event / pemicu (contoh: Panggil Nomor Antrean)"
            />

            <TextField
              label="Actor Transition"
              size="small"
              fullWidth
              value={transitionForm.actor}
              onChange={(e) => setTransitionForm((prev) => ({ ...prev, actor: e.target.value }))}
              placeholder="Pelaksana transisi (contoh: Petugas Loket, Pemohon)"
            />

            <TextField
              label="Guard Transition"
              size="small"
              fullWidth
              value={transitionForm.guard}
              onChange={(e) => setTransitionForm((prev) => ({ ...prev, guard: e.target.value }))}
              placeholder="Syarat/kondisi (contoh: Loket dalam status aktif)"
            />

            <ActionInputArray
              label="Actions Transition"
              value={transitionForm.actions}
              onChange={(acts) => setTransitionForm((prev) => ({ ...prev, actions: acts }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransitionDialogOpen(false)}>Batal</Button>
          <Button
            variant="contained"
            onClick={handleSaveTransitionDialog}
            disabled={
              !transitionForm.event.trim() || !transitionForm.source || !transitionForm.target
            }
          >
            Simpan Transition
          </Button>
        </DialogActions>
      </Dialog>

      {/* Safety Confirmation Dialog for Deleting State with Affected Transitions */}
      <Dialog
        open={Boolean(deleteStateConfirmation)}
        onClose={() => setDeleteStateConfirmation(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="solar:danger-triangle-bold" />
          Konfirmasi Hapus State
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Menghapus state{' '}
            <strong>
              &quot;{deleteStateConfirmation?.state.label || deleteStateConfirmation?.state.id}
              &quot;
            </strong>{' '}
            akan otomatis menghapus{' '}
            <strong>{deleteStateConfirmation?.affectedTransitions.length} transition</strong> yang
            terhubung:
          </Typography>

          <Stack
            spacing={0.75}
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'background.neutral',
              border: '1px solid',
              borderColor: 'divider',
              maxHeight: 180,
              overflowY: 'auto',
            }}
          >
            {deleteStateConfirmation?.affectedTransitions.map((t) => (
              <Typography key={t.id} variant="caption" sx={{ fontFamily: 'monospace' }}>
                &bull; {t.id}: {t.source} &rarr; {t.target} ({t.event || 'Tanpa event'})
              </Typography>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteStateConfirmation(null)}>Batal</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              deleteStateConfirmation && executeDeleteState(deleteStateConfirmation.state.id)
            }
          >
            Hapus State beserta Transition
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
