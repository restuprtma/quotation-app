import '@xyflow/react/dist/style.css';

import type { StateNode, StateTransition, StateMachineSection } from '../types';

import { Icon } from '@iconify/react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  MiniMap,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  Background,
  MarkerType,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  type OnConnect,
  type Connection,
  BackgroundVariant,
} from '@xyflow/react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { StateEditDialog } from './state-edit-dialog';
import { StateMachineNode } from './nodes/state-machine-node';
import { layoutStateMachine, type LayoutDirection } from '../utils/dagre-layout';

// ----------------------------------------------------------------------

type Props = {
  stateMachine: StateMachineSection;
  onChange: (updatedStateMachine: StateMachineSection) => void;
};

export function StateMachineLab({ stateMachine, onChange }: Props) {
  const theme = useTheme();

  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>('LR');

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'state' | 'transition'>('state');
  const [selectedStateData, setSelectedStateData] = useState<StateNode | null>(null);
  const [selectedTransitionData, setSelectedTransitionData] = useState<StateTransition | null>(
    null
  );

  // Entity edit dialog state
  const [entityDialogOpen, setEntityDialogOpen] = useState(false);
  const [entityNameInput, setEntityNameInput] = useState(stateMachine.entity);

  // Custom Node Types Registration
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      stateNode: StateMachineNode as any,
    }),
    []
  );

  // Convert StateMachineSection to React Flow Nodes & Edges
  const initialRfElements = useMemo(() => {
    // 1. State Nodes
    const rfNodes: Node[] = stateMachine.states.map((state) => ({
      id: state.id,
      type: 'stateNode',
      data: {
        id: state.id,
        label: state.label,
        type: state.type,
        isInitial: state.id === stateMachine.initial_state,
        entity: stateMachine.entity,
      },
      position: { x: state.layout.x, y: state.layout.y },
    }));

    // 2. Transition Edges
    const rfEdges: Edge[] = stateMachine.transitions.map((trans) => {
      // Format label: event [guard] / actions
      let labelText = trans.event;
      if (trans.guard) {
        labelText += ` [${trans.guard}]`;
      }
      if (trans.actions && trans.actions.length > 0) {
        labelText += ` / ${trans.actions.join(', ')}`;
      }

      return {
        id: trans.id,
        source: trans.source,
        target: trans.target,
        label: labelText,
        type: 'smoothstep',
        style: {
          stroke: theme.palette.primary.main,
          strokeWidth: 2,
        },
        labelStyle: {
          fontSize: 11,
          fontWeight: 600,
          fill: theme.palette.text.primary,
        },
        labelBgStyle: {
          fill: theme.palette.background.paper,
          fillOpacity: 0.92,
          rx: 4,
          ry: 4,
        },
        labelBgPadding: [6, 4] as [number, number],
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: theme.palette.primary.main,
        },
        data: trans,
      };
    });

    return {
      nodes: rfNodes,
      edges: rfEdges,
    };
  }, [stateMachine, theme]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialRfElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialRfElements.edges);

  useEffect(() => {
    setNodes(initialRfElements.nodes);
    setEdges(initialRfElements.edges);
  }, [initialRfElements, setNodes, setEdges]);

  // Dagre Auto-Layout Handler
  const handleAutoLayout = useCallback(
    (direction: LayoutDirection = layoutDirection) => {
      const layouted = layoutStateMachine(nodes, edges, direction);
      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);

      // Sync back positions to state_machine states
      const updatedStates = stateMachine.states.map((state) => {
        const layoutedNode = layouted.nodes.find((n) => n.id === state.id);
        if (layoutedNode) {
          return {
            ...state,
            layout: {
              x: Math.round(layoutedNode.position.x),
              y: Math.round(layoutedNode.position.y),
            },
          };
        }
        return state;
      });

      onChange({
        ...stateMachine,
        states: updatedStates,
      });
    },
    [nodes, edges, layoutDirection, stateMachine, onChange, setNodes, setEdges]
  );

  // React Flow Connect Edge Handler
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      const newTrans: StateTransition = {
        id: `trans-${Date.now().toString(36)}`,
        source: params.source,
        target: params.target,
        event: 'TRIGGER_EVENT',
        actor: 'Petugas / Sistem',
        guard: '',
        actions: [],
      };

      onChange({
        ...stateMachine,
        transitions: [...stateMachine.transitions, newTrans],
      });
    },
    [stateMachine, onChange]
  );

  // Click on Node to Edit
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const targetState = stateMachine.states.find((s) => s.id === node.id);
      if (targetState) {
        setSelectedStateData(targetState);
        setSelectedTransitionData(null);
        setEditMode('state');
        setDialogOpen(true);
      }
    },
    [stateMachine.states]
  );

  // Click on Edge to Edit
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const targetTrans = stateMachine.transitions.find((t) => t.id === edge.id);
      if (targetTrans) {
        setSelectedTransitionData(targetTrans);
        setSelectedStateData(null);
        setEditMode('transition');
        setDialogOpen(true);
      }
    },
    [stateMachine.transitions]
  );

  const handleOpenAddState = () => {
    setSelectedStateData(null);
    setSelectedTransitionData(null);
    setEditMode('state');
    setDialogOpen(true);
  };

  const handleOpenAddTransition = () => {
    setSelectedStateData(null);
    setSelectedTransitionData(null);
    setEditMode('transition');
    setDialogOpen(true);
  };

  const handleSaveState = (savedState: StateNode, isInitial: boolean) => {
    const exists = stateMachine.states.some((s) => s.id === savedState.id);
    const updatedStates = exists
      ? stateMachine.states.map((s) => (s.id === savedState.id ? savedState : s))
      : [...stateMachine.states, savedState];

    const updatedInitial = isInitial ? savedState.id : stateMachine.initial_state;

    onChange({
      ...stateMachine,
      initial_state: updatedInitial,
      states: updatedStates,
    });
  };

  const handleDeleteState = (stateId: string) => {
    const updatedStates = stateMachine.states.filter((s) => s.id !== stateId);
    const updatedTransitions = stateMachine.transitions.filter(
      (t) => t.source !== stateId && t.target !== stateId
    );
    const updatedInitial =
      stateMachine.initial_state === stateId
        ? updatedStates[0]?.id || ''
        : stateMachine.initial_state;

    onChange({
      ...stateMachine,
      initial_state: updatedInitial,
      states: updatedStates,
      transitions: updatedTransitions,
    });
  };

  const handleSaveTransition = (savedTrans: StateTransition) => {
    const exists = stateMachine.transitions.some((t) => t.id === savedTrans.id);
    const updatedTransitions = exists
      ? stateMachine.transitions.map((t) => (t.id === savedTrans.id ? savedTrans : t))
      : [...stateMachine.transitions, savedTrans];

    onChange({
      ...stateMachine,
      transitions: updatedTransitions,
    });
  };

  const handleDeleteTransition = (transitionId: string) => {
    const updatedTransitions = stateMachine.transitions.filter((t) => t.id !== transitionId);
    onChange({
      ...stateMachine,
      transitions: updatedTransitions,
    });
  };

  const handleSaveEntity = () => {
    if (entityNameInput.trim()) {
      onChange({
        ...stateMachine,
        entity: entityNameInput.trim(),
      });
      setEntityDialogOpen(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Toolbar & Header */}
      <Card
        sx={{
          p: 2,
          mb: 3,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            State Machine Visual Canvas
          </Typography>
          <Chip
            icon={<Icon icon="solar:box-minimalistic-bold" />}
            label={`Entity: ${stateMachine.entity}`}
            size="small"
            color="primary"
            variant="soft"
            onClick={() => {
              setEntityNameInput(stateMachine.entity);
              setEntityDialogOpen(true);
            }}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            icon={<Icon icon="solar:play-circle-bold" />}
            label={`Initial: ${
              stateMachine.states.find((s) => s.id === stateMachine.initial_state)?.label ||
              stateMachine.initial_state
            }`}
            size="small"
            color="warning"
            variant="soft"
          />
          <Chip
            label={`${stateMachine.states.length} States`}
            size="small"
            color="info"
            variant="soft"
          />
          <Chip
            label={`${stateMachine.transitions.length} Transitions`}
            size="small"
            color="secondary"
            variant="soft"
          />
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Button
            variant="outlined"
            size="small"
            color="info"
            startIcon={<Icon icon="solar:sort-horizontal-bold" />}
            onClick={() => {
              const newDir: LayoutDirection = layoutDirection === 'LR' ? 'TB' : 'LR';
              setLayoutDirection(newDir);
              handleAutoLayout(newDir);
            }}
          >
            {layoutDirection === 'LR' ? 'Horizontal (L→R)' : 'Vertical (T↓B)'}
          </Button>

          <Button
            variant="contained"
            size="small"
            color="secondary"
            startIcon={<Icon icon="solar:magic-stick-3-bold" />}
            onClick={() => handleAutoLayout()}
          >
            Auto-Layout (Dagre)
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Icon icon="solar:link-round-bold" />}
            onClick={handleOpenAddTransition}
          >
            + Transisi
          </Button>

          <Button
            variant="contained"
            size="small"
            color="primary"
            startIcon={<Icon icon="solar:add-circle-bold" />}
            onClick={handleOpenAddState}
          >
            + State
          </Button>
        </Stack>
      </Card>

      {/* Canvas */}
      <Card
        sx={{
          height: 600,
          width: '100%',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
          mb: 3,
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          fitView
          attributionPosition="bottom-right"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls position="top-right" />
          <MiniMap
            position="bottom-right"
            nodeColor={(n) => {
              if (n.data?.isInitial) return theme.palette.warning.main;
              if (n.data?.type === 'terminal') return theme.palette.success.main;
              if (n.data?.type === 'exception') return theme.palette.error.main;
              return theme.palette.primary.main;
            }}
            style={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 8,
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
        </ReactFlow>
      </Card>

      {/* Transition Summary Table */}
      <Card sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Tabel Matriks Transisi State ({stateMachine.entity})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Daftar seluruh kemungkinan transisi lifecycle entitas, kondisi prasyarat (*guard*),
              dan aksi sampingan (*actions*).
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<Icon icon="solar:add-circle-bold" />}
            onClick={handleOpenAddTransition}
          >
            Tambah Transisi
          </Button>
        </Stack>

        <TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5 }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: theme.palette.background.neutral }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Source State</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trigger Event</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Guard Condition</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions / Side-Effects</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Target State</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actor</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Aksi
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stateMachine.transitions.map((trans) => {
                const srcState = stateMachine.states.find((s) => s.id === trans.source);
                const tgtState = stateMachine.states.find((s) => s.id === trans.target);

                return (
                  <TableRow key={trans.id} hover>
                    <TableCell>
                      <Chip
                        label={srcState?.label || trans.source}
                        size="small"
                        color={trans.source === stateMachine.initial_state ? 'warning' : 'default'}
                        variant={
                          trans.source === stateMachine.initial_state ? 'filled' : 'outlined'
                        }
                        sx={{ fontWeight: 700, fontFamily: 'monospace' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: 'primary.main', fontFamily: 'monospace' }}
                      >
                        {trans.event}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {trans.guard ? (
                        <Typography
                          variant="caption"
                          sx={{ fontStyle: 'italic', color: 'text.secondary' }}
                        >
                          [{trans.guard}]
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {trans.actions && trans.actions.length > 0 ? (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {trans.actions.map((act, idx) => (
                            <Chip
                              key={idx}
                              label={act}
                              size="small"
                              variant="soft"
                              color="info"
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tgtState?.label || trans.target}
                        size="small"
                        color={
                          tgtState?.type === 'terminal'
                            ? 'success'
                            : tgtState?.type === 'exception'
                              ? 'error'
                              : 'primary'
                        }
                        variant="soft"
                        sx={{ fontWeight: 700, fontFamily: 'monospace' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', fontWeight: 600 }}
                      >
                        {trans.actor || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedTransitionData(trans);
                          setSelectedStateData(null);
                          setEditMode('transition');
                          setDialogOpen(true);
                        }}
                      >
                        <Icon icon="solar:pen-bold" width={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteTransition(trans.id)}
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {stateMachine.transitions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    Belum ada transisi yang dibuat. Klik &quot;+ Transisi&quot; untuk menambahkan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* State & Transition Edit Modal Dialog */}
      <StateEditDialog
        open={dialogOpen}
        editMode={editMode}
        stateData={selectedStateData}
        transitionData={selectedTransitionData}
        isInitialState={selectedStateData?.id === stateMachine.initial_state}
        allStates={stateMachine.states}
        onClose={() => setDialogOpen(false)}
        onSaveState={handleSaveState}
        onSaveTransition={handleSaveTransition}
        onDeleteState={handleDeleteState}
        onDeleteTransition={handleDeleteTransition}
      />

      {/* Entity Name Edit Dialog */}
      <Dialog
        open={entityDialogOpen}
        onClose={() => setEntityDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Edit Nama Entitas State Machine</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Entity Name"
            value={entityNameInput}
            onChange={(e) => setEntityNameInput(e.target.value)}
            fullWidth
            required
            sx={{ mt: 1 }}
            placeholder="e.g. QueueTicket, Invoice, Order"
            helperText="Nama domain entitas yang lifecycle-nya diatur oleh state machine ini"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEntityDialogOpen(false)} color="inherit">
            Batal
          </Button>
          <Button onClick={handleSaveEntity} variant="contained" color="primary">
            Simpan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
