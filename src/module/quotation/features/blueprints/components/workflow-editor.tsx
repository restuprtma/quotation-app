import type { Edge, Node, Connection, EdgeChange, NodeChange } from '@xyflow/react';
import type { CanonicalIssue } from '../types';
import type { LayoutDirection } from '../utils/dagre-layout';
import type { ReferenceOption } from '../validation/manual-section';
import type {
  Workflow,
  WorkflowEdge,
  WorkflowLane,
  WorkflowNode,
  WorkflowNodeType,
} from '../types/bundle';

import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
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

import { BlueprintFlowCanvas } from './blueprint-flow-canvas';
import { WORKFLOW_NODE_TYPES } from './manual/workflow-fields';
import { newBlueprintItemId } from '../validation/manual-payload';
import { checkReferencedItem } from '../validation/manual-section';
import {
  workflowToReactFlow,
  reactFlowToWorkflow,
  applyWorkflowAutoLayout,
} from '../validation/flow-adapter';

// ----------------------------------------------------------------------

export interface WorkflowEditorProps {
  workflows: Workflow[];
  onChange: (updatedWorkflows: Workflow[]) => void;
  referenceOptions?: ReferenceOption[];
  issues?: CanonicalIssue[];
  focusTargetId?: string | null;
  readOnly?: boolean;
}

interface DeleteNodeConfirmationState {
  node: WorkflowNode;
  affectedEdges: WorkflowEdge[];
}

// ----------------------------------------------------------------------

export function WorkflowEditor({
  workflows = [],
  onChange,
  referenceOptions = [],
  issues = [],
  focusTargetId = null,
  readOnly = false,
}: WorkflowEditorProps) {
  // Active workflow index state
  const [activeWfIndex, setActiveWfIndex] = useState<number>(0);

  // Layout direction state
  const [layoutDir, setLayoutDir] = useState<LayoutDirection>('LR');

  // Deletion and validation errors
  const [deletionAlert, setDeletionAlert] = useState<string | null>(null);

  // Auto-switch active workflow tab if focusTargetId belongs to a specific workflow
  useEffect(() => {
    if (!focusTargetId || workflows.length === 0) return;

    for (let i = 0; i < workflows.length; i++) {
      const wf = workflows[i];
      const hasNode = (wf.nodes || []).some(
        (n) => n.id === focusTargetId || n.label === focusTargetId
      );
      const hasEdge = (wf.edges || []).some(
        (e) =>
          e.id === focusTargetId ||
          e.source === focusTargetId ||
          e.target === focusTargetId ||
          e.label === focusTargetId
      );
      const hasLane = (wf.lanes || []).some(
        (l) => l.id === focusTargetId || l.label === focusTargetId
      );

      if (hasNode || hasEdge || hasLane || wf.id === focusTargetId) {
        if (activeWfIndex !== i) {
          setActiveWfIndex(i);
        }
        break;
      }
    }
  }, [focusTargetId, workflows, activeWfIndex]);

  // Ensure active index is within range
  const safeActiveIndex = Math.min(Math.max(0, activeWfIndex), Math.max(0, workflows.length - 1));
  const activeWorkflow: Workflow = useMemo(() => {
    if (workflows.length > 0 && workflows[safeActiveIndex]) {
      return workflows[safeActiveIndex];
    }
    return {
      id: 'wf-default',
      name: 'Workflow Baru',
      description: '',
      lanes: [],
      nodes: [],
      edges: [],
    };
  }, [workflows, safeActiveIndex]);

  // React Flow state synchronized with activeWorkflow
  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  const [rfEdges, setRfEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (activeWorkflow) {
      const { nodes, edges } = workflowToReactFlow(activeWorkflow);
      setRfNodes(nodes);
      setRfEdges(edges);
    }
  }, [activeWorkflow]);

  // Dialog states
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [editingWorkflowMeta, setEditingWorkflowMeta] = useState<boolean>(false);
  const [workflowForm, setWorkflowForm] = useState<{ name: string; description: string }>({
    name: '',
    description: '',
  });

  const [deleteWorkflowConfirmationOpen, setDeleteWorkflowConfirmationOpen] = useState(false);

  const [laneDialogOpen, setLaneDialogOpen] = useState(false);
  const [editingLane, setEditingLane] = useState<WorkflowLane | null>(null);
  const [laneForm, setLaneForm] = useState<{ label: string }>({ label: '' });

  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null);
  const [nodeForm, setNodeForm] = useState<{
    lane_id: string;
    type: WorkflowNodeType;
    label: string;
    description: string;
    layout: { x: number; y: number };
  }>({
    lane_id: '',
    type: 'action',
    label: '',
    description: '',
    layout: { x: 0, y: 0 },
  });

  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [editingEdge, setEditingEdge] = useState<WorkflowEdge | null>(null);
  const [edgeForm, setEdgeForm] = useState<{
    source: string;
    target: string;
    label: string;
  }>({
    source: '',
    target: '',
    label: '',
  });

  const [deleteNodeConfirmation, setDeleteNodeConfirmation] =
    useState<DeleteNodeConfirmationState | null>(null);

  const lanes = useMemo(() => activeWorkflow.lanes || [], [activeWorkflow.lanes]);
  const nodes = useMemo(() => activeWorkflow.nodes || [], [activeWorkflow.nodes]);
  const edges = useMemo(() => activeWorkflow.edges || [], [activeWorkflow.edges]);

  // Helper to update active workflow within workflows array
  const updateCurrentWorkflow = useCallback(
    (updatedWf: Workflow) => {
      const updatedList = workflows.map((wf, idx) => (idx === safeActiveIndex ? updatedWf : wf));
      onChange(updatedList);
    },
    [workflows, safeActiveIndex, onChange]
  );

  // ----------------------------------------------------------------------
  // React Flow Handlers
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
          const updatedWf = reactFlowToWorkflow(nextNodes, rfEdges, {
            id: activeWorkflow.id,
            name: activeWorkflow.name,
            description: activeWorkflow.description,
          });
          updateCurrentWorkflow(updatedWf);
        }
        return nextNodes;
      });
    },
    [readOnly, rfEdges, activeWorkflow, updateCurrentWorkflow]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (readOnly) return;
      setRfEdges((prevEdges) => {
        const nextEdges = applyEdgeChanges(changes, prevEdges);
        const hasRemoval = changes.some((c) => c.type === 'remove');
        if (hasRemoval) {
          const updatedWf = reactFlowToWorkflow(rfNodes, nextEdges, {
            id: activeWorkflow.id,
            name: activeWorkflow.name,
            description: activeWorkflow.description,
          });
          updateCurrentWorkflow(updatedWf);
        }
        return nextEdges;
      });
    },
    [readOnly, rfNodes, activeWorkflow, updateCurrentWorkflow]
  );

  const handleConnect = useCallback(
    (params: Connection) => {
      if (readOnly || !params.source || !params.target) return;
      const newEdgeId = newBlueprintItemId('wedge');
      const newEdge: WorkflowEdge = {
        id: newEdgeId,
        source: params.source,
        target: params.target,
        label: '',
      };
      const updatedEdges = [...edges, newEdge];
      updateCurrentWorkflow({
        ...activeWorkflow,
        edges: updatedEdges,
      });
    },
    [readOnly, activeWorkflow, edges, updateCurrentWorkflow]
  );

  // ----------------------------------------------------------------------
  // Workflow Tab & Lifecycle Handlers
  // ----------------------------------------------------------------------

  const handleOpenAddWorkflow = () => {
    if (readOnly) return;
    setEditingWorkflowMeta(false);
    setWorkflowForm({ name: '', description: '' });
    setWorkflowDialogOpen(true);
  };

  const handleOpenEditWorkflowMeta = () => {
    if (readOnly) return;
    setEditingWorkflowMeta(true);
    setWorkflowForm({
      name: activeWorkflow.name,
      description: activeWorkflow.description || '',
    });
    setWorkflowDialogOpen(true);
  };

  const handleSaveWorkflowDialog = () => {
    if (readOnly || !workflowForm.name.trim()) return;

    if (editingWorkflowMeta) {
      const updatedWf: Workflow = {
        ...activeWorkflow,
        name: workflowForm.name.trim(),
        description: workflowForm.description.trim(),
      };
      updateCurrentWorkflow(updatedWf);
    } else {
      const newWfId = newBlueprintItemId('wf');
      const newWf: Workflow = {
        id: newWfId,
        name: workflowForm.name.trim(),
        description: workflowForm.description.trim(),
        lanes: [],
        nodes: [],
        edges: [],
      };
      const updatedList = [...workflows, newWf];
      onChange(updatedList);
      setActiveWfIndex(updatedList.length - 1);
    }

    setWorkflowDialogOpen(false);
  };

  const handleDeleteWorkflow = () => {
    if (readOnly || workflows.length <= 1) return;
    const updatedList = workflows.filter((_, idx) => idx !== safeActiveIndex);
    onChange(updatedList);
    setActiveWfIndex(Math.max(0, safeActiveIndex - 1));
    setDeleteWorkflowConfirmationOpen(false);
  };

  // ----------------------------------------------------------------------
  // Lane CRUD Handlers
  // ----------------------------------------------------------------------

  const handleOpenAddLane = () => {
    if (readOnly) return;
    setEditingLane(null);
    setLaneForm({ label: '' });
    setLaneDialogOpen(true);
  };

  const handleOpenEditLane = (lane: WorkflowLane) => {
    if (readOnly) return;
    setEditingLane(lane);
    setLaneForm({ label: lane.label });
    setLaneDialogOpen(true);
  };

  const handleSaveLaneDialog = () => {
    if (readOnly || !laneForm.label.trim()) return;

    if (editingLane) {
      const updatedLanes = lanes.map((l) =>
        l.id === editingLane.id ? { ...l, label: laneForm.label.trim() } : l
      );
      updateCurrentWorkflow({
        ...activeWorkflow,
        lanes: updatedLanes,
      });
    } else {
      const newLaneId = newBlueprintItemId('lane');
      const newLane: WorkflowLane = {
        id: newLaneId,
        label: laneForm.label.trim(),
        order: lanes.length + 1,
      };
      updateCurrentWorkflow({
        ...activeWorkflow,
        lanes: [...lanes, newLane],
      });
    }

    setLaneDialogOpen(false);
  };

  const handleRequestDeleteLane = (lane: WorkflowLane) => {
    if (readOnly) return;
    setDeletionAlert(null);
    const guard = checkReferencedItem(lane.id, 'lane', activeWorkflow);
    if (!guard.allowed) {
      setDeletionAlert(guard.reason || 'Lane ini masih digunakan oleh node.');
      return;
    }

    const updatedLanes = lanes
      .filter((l) => l.id !== lane.id)
      .map((l, idx) => ({ ...l, order: idx + 1 }));

    updateCurrentWorkflow({
      ...activeWorkflow,
      lanes: updatedLanes,
    });
  };

  const handleMoveLane = (index: number, direction: 'up' | 'down') => {
    if (readOnly) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lanes.length) return;

    const reordered = [...lanes];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const reindexed = reordered.map((l, idx) => ({ ...l, order: idx + 1 }));
    updateCurrentWorkflow({
      ...activeWorkflow,
      lanes: reindexed,
    });
  };

  // ----------------------------------------------------------------------
  // Node CRUD Handlers
  // ----------------------------------------------------------------------

  const handleOpenAddNode = () => {
    if (readOnly || lanes.length === 0) return;
    setEditingNode(null);
    setNodeForm({
      lane_id: lanes[0]?.id || '',
      type: 'action',
      label: '',
      description: '',
      layout: {
        x: 100 + (nodes.length % 4) * 240,
        y: 60,
      },
    });
    setNodeDialogOpen(true);
  };

  const handleOpenEditNode = (node: WorkflowNode) => {
    if (readOnly) return;
    setEditingNode(node);
    setNodeForm({
      lane_id: node.lane_id,
      type: node.type,
      label: node.label,
      description: node.description || '',
      layout: {
        x: node.layout?.x ?? 0,
        y: node.layout?.y ?? 0,
      },
    });
    setNodeDialogOpen(true);
  };

  const handleSaveNodeDialog = () => {
    if (readOnly || !nodeForm.label.trim()) return;

    if (editingNode) {
      const updatedNodes = nodes.map((n) =>
        n.id === editingNode.id
          ? {
              ...n,
              lane_id: nodeForm.lane_id,
              type: nodeForm.type,
              label: nodeForm.label.trim(),
              description: nodeForm.description.trim(),
              layout: nodeForm.layout,
            }
          : n
      );
      updateCurrentWorkflow({
        ...activeWorkflow,
        nodes: updatedNodes,
      });
    } else {
      const newNodeId = newBlueprintItemId('wnode');
      const newNode: WorkflowNode = {
        id: newNodeId,
        lane_id: nodeForm.lane_id,
        type: nodeForm.type,
        label: nodeForm.label.trim(),
        description: nodeForm.description.trim(),
        layout: nodeForm.layout,
      };
      updateCurrentWorkflow({
        ...activeWorkflow,
        nodes: [...nodes, newNode],
      });
    }

    setNodeDialogOpen(false);
  };

  const handleRequestDeleteNode = (node: WorkflowNode) => {
    if (readOnly) return;
    const affected = edges.filter((e) => e.source === node.id || e.target === node.id);
    if (affected.length > 0) {
      setDeleteNodeConfirmation({
        node,
        affectedEdges: affected,
      });
    } else {
      executeDeleteNode(node.id);
    }
  };

  const executeDeleteNode = (nodeId: string) => {
    const updatedNodes = nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);

    updateCurrentWorkflow({
      ...activeWorkflow,
      nodes: updatedNodes,
      edges: updatedEdges,
    });
    setDeleteNodeConfirmation(null);
  };

  // ----------------------------------------------------------------------
  // Edge CRUD Handlers
  // ----------------------------------------------------------------------

  const handleOpenAddEdge = () => {
    if (readOnly || nodes.length === 0) return;
    setEditingEdge(null);
    setEdgeForm({
      source: nodes[0]?.id || '',
      target: nodes[1]?.id || nodes[0]?.id || '',
      label: '',
    });
    setEdgeDialogOpen(true);
  };

  const handleOpenEditEdge = (edge: WorkflowEdge) => {
    if (readOnly) return;
    setEditingEdge(edge);
    setEdgeForm({
      source: edge.source,
      target: edge.target,
      label: edge.label || '',
    });
    setEdgeDialogOpen(true);
  };

  const handleSaveEdgeDialog = () => {
    if (readOnly || !edgeForm.source || !edgeForm.target) return;

    if (editingEdge) {
      const updatedEdges = edges.map((e) =>
        e.id === editingEdge.id
          ? {
              ...e,
              source: edgeForm.source,
              target: edgeForm.target,
              label: edgeForm.label.trim(),
            }
          : e
      );
      updateCurrentWorkflow({
        ...activeWorkflow,
        edges: updatedEdges,
      });
    } else {
      const newEdgeId = newBlueprintItemId('wedge');
      const newEdge: WorkflowEdge = {
        id: newEdgeId,
        source: edgeForm.source,
        target: edgeForm.target,
        label: edgeForm.label.trim(),
      };
      updateCurrentWorkflow({
        ...activeWorkflow,
        edges: [...edges, newEdge],
      });
    }

    setEdgeDialogOpen(false);
  };

  const handleDeleteEdge = (edgeId: string) => {
    if (readOnly) return;
    updateCurrentWorkflow({
      ...activeWorkflow,
      edges: edges.filter((e) => e.id !== edgeId),
    });
  };

  // ----------------------------------------------------------------------
  // Auto-Layout Handler
  // ----------------------------------------------------------------------

  const handleAutoLayout = (dir?: LayoutDirection) => {
    if (readOnly) return;
    const targetDir = dir || layoutDir;
    setLayoutDir(targetDir);
    const layouted = applyWorkflowAutoLayout(activeWorkflow, targetDir);
    updateCurrentWorkflow(layouted);
  };

  // ----------------------------------------------------------------------
  // React Flow Click Handlers
  // ----------------------------------------------------------------------

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    if (readOnly) return;
    if (node.type === 'workflowLane' || node.type === 'laneGroup') {
      const matchedLane = lanes.find((l) => l.id === node.id);
      if (matchedLane) {
        handleOpenEditLane(matchedLane);
      }
      return;
    }
    const matchedNode = nodes.find((n) => n.id === node.id);
    if (matchedNode) {
      handleOpenEditNode(matchedNode);
    }
  };

  const handleEdgeClick = (_: React.MouseEvent, edge: Edge) => {
    if (readOnly) return;
    const matchedEdge = edges.find((e) => e.id === edge.id);
    if (matchedEdge) {
      handleOpenEditEdge(matchedEdge);
    }
  };

  return (
    <Box data-testid="workflow-editor" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {deletionAlert && (
        <Alert severity="error" onClose={() => setDeletionAlert(null)}>
          {deletionAlert}
        </Alert>
      )}

      {/* 1. Workflow Plural Switcher Header */}
      <Card variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Pilih Workflow ({workflows.length}):
              </Typography>
              <Chip
                size="small"
                label={`ID: ${activeWorkflow.id}`}
                variant="outlined"
                color="info"
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            </Stack>

            <Tabs
              value={safeActiveIndex}
              onChange={(_: React.SyntheticEvent, newValue: number) => {
                setActiveWfIndex(newValue);
                setDeletionAlert(null);
              }}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ minHeight: 40 }}
            >
              {workflows.map((wf, idx) => (
                <Tab
                  key={wf.id || idx}
                  label={wf.name || `Workflow ${idx + 1}`}
                  sx={{ minHeight: 40, py: 1 }}
                />
              ))}
            </Tabs>
          </Box>

          <Stack direction="row" spacing={1} flexShrink={0}>
            <Button
              variant="contained"
              size="small"
              color="primary"
              disabled={readOnly}
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleOpenAddWorkflow}
            >
              Tambah Workflow
            </Button>
            <Button
              variant="outlined"
              size="small"
              disabled={readOnly}
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={handleOpenEditWorkflowMeta}
            >
              Edit Info Workflow
            </Button>
            {workflows.length > 1 && !readOnly && (
              <IconButton
                size="small"
                color="error"
                aria-label={`Hapus Workflow ${activeWorkflow.name}`}
                onClick={() => setDeleteWorkflowConfirmationOpen(true)}
              >
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            )}
          </Stack>
        </Stack>

        {activeWorkflow.description && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            {activeWorkflow.description}
          </Typography>
        )}
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
              onClick={handleOpenAddLane}
            >
              Tambah Lane
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="primary"
              disabled={readOnly || lanes.length === 0}
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleOpenAddNode}
            >
              Tambah Node
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="primary"
              disabled={readOnly || nodes.length === 0}
              startIcon={<Iconify icon="solar:round-transfer-horizontal-bold" />}
              onClick={handleOpenAddEdge}
            >
              Tambah Edge
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

            <Chip size="small" label={`${lanes.length} Lanes`} color="info" variant="soft" />
            <Chip size="small" label={`${nodes.length} Nodes`} color="primary" variant="soft" />
            <Chip size="small" label={`${edges.length} Edges`} color="secondary" variant="soft" />
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

      {/* 4. Tabular Lists for Lanes, Nodes, and Edges */}
      <Grid container spacing={2}>
        {/* Swimlanes List */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1.5 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Swimlanes ({lanes.length})
                </Typography>
                <Button
                  size="small"
                  disabled={readOnly}
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={handleOpenAddLane}
                >
                  Tambah
                </Button>
              </Stack>

              {lanes.length === 0 ? (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  Belum ada swimlane pada workflow ini.
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {lanes.map((lane, idx) => (
                    <Box
                      key={lane.id}
                      sx={{
                        p: 1.25,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.neutral',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          size="small"
                          label={`#${lane.order}`}
                          color="info"
                          sx={{ height: 20, fontSize: '0.625rem', fontWeight: 700 }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {lane.label || lane.id}
                        </Typography>
                      </Box>

                      {!readOnly && (
                        <Stack direction="row" spacing={0.25} alignItems="center">
                          <IconButton
                            size="small"
                            disabled={idx === 0}
                            aria-label={`Naikkan Lane ${lane.label || lane.id}`}
                            onClick={() => handleMoveLane(idx, 'up')}
                          >
                            <Iconify icon="solar:arrow-up-bold" width={14} />
                          </IconButton>
                          <IconButton
                            size="small"
                            disabled={idx === lanes.length - 1}
                            aria-label={`Turunkan Lane ${lane.label || lane.id}`}
                            onClick={() => handleMoveLane(idx, 'down')}
                          >
                            <Iconify icon="solar:arrow-down-bold" width={14} />
                          </IconButton>
                          <IconButton
                            size="small"
                            aria-label={`Edit Lane ${lane.label || lane.id}`}
                            onClick={() => handleOpenEditLane(lane)}
                          >
                            <Iconify icon="solar:pen-bold" width={14} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            aria-label={`Hapus Lane ${lane.label || lane.id}`}
                            onClick={() => handleRequestDeleteLane(lane)}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={14} />
                          </IconButton>
                        </Stack>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Nodes List */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1.5 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Nodes / Steps ({nodes.length})
                </Typography>
                <Button
                  size="small"
                  disabled={readOnly || lanes.length === 0}
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={handleOpenAddNode}
                >
                  Tambah
                </Button>
              </Stack>

              {nodes.length === 0 ? (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  Belum ada node pada workflow ini.
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {nodes.map((node) => {
                    const parentLane = lanes.find((l) => l.id === node.lane_id);
                    const outgoingCount = edges.filter((e) => e.source === node.id).length;
                    const isDecisionUnderbranched = node.type === 'decision' && outgoingCount < 2;

                    return (
                      <Box
                        key={node.id}
                        sx={{
                          p: 1.25,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: isDecisionUnderbranched ? 'error.main' : 'divider',
                          bgcolor: isDecisionUnderbranched ? 'error.lighter' : 'background.neutral',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box sx={{ minWidth: 0, mr: 1 }}>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                            sx={{ mb: 0.25 }}
                          >
                            <Chip
                              size="small"
                              label={node.type}
                              color={
                                node.type === 'start'
                                  ? 'success'
                                  : node.type === 'end'
                                    ? 'error'
                                    : node.type === 'decision'
                                      ? 'warning'
                                      : 'primary'
                              }
                              sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700 }}
                            />
                            {parentLane && (
                              <Typography variant="caption" color="text.secondary" noWrap>
                                ({parentLane.label})
                              </Typography>
                            )}
                          </Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                            {node.label || node.id}
                          </Typography>
                        </Box>

                        {!readOnly && (
                          <Stack direction="row" spacing={0.25}>
                            <IconButton
                              size="small"
                              aria-label={`Edit Node ${node.label || node.id}`}
                              onClick={() => handleOpenEditNode(node)}
                            >
                              <Iconify icon="solar:pen-bold" width={14} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              aria-label={`Hapus Node ${node.label || node.id}`}
                              onClick={() => handleRequestDeleteNode(node)}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={14} />
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

        {/* Edges List */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1.5 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Edges & Branches ({edges.length})
                </Typography>
                <Button
                  size="small"
                  disabled={readOnly || nodes.length === 0}
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={handleOpenAddEdge}
                >
                  Tambah
                </Button>
              </Stack>

              {edges.length === 0 ? (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  Belum ada edge penghubung antar node.
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {edges.map((edge) => {
                    const srcNode = nodes.find((n) => n.id === edge.source);
                    const tgtNode = nodes.find((n) => n.id === edge.target);

                    return (
                      <Box
                        key={edge.id}
                        sx={{
                          p: 1.25,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.neutral',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box sx={{ minWidth: 0, mr: 1 }}>
                          {edge.label ? (
                            <Chip
                              size="small"
                              label={edge.label}
                              color="secondary"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.625rem', mb: 0.25 }}
                            />
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.disabled"
                              sx={{ display: 'block', mb: 0.25 }}
                            >
                              (Tanpa label cabang)
                            </Typography>
                          )}
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            sx={{ display: 'block' }}
                          >
                            {srcNode?.label || edge.source} &rarr; {tgtNode?.label || edge.target}
                          </Typography>
                        </Box>

                        {!readOnly && (
                          <Stack direction="row" spacing={0.25}>
                            <IconButton
                              size="small"
                              aria-label={`Edit Edge ${edge.label || edge.id}`}
                              onClick={() => handleOpenEditEdge(edge)}
                            >
                              <Iconify icon="solar:pen-bold" width={14} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              aria-label={`Hapus Edge ${edge.label || edge.id}`}
                              onClick={() => handleDeleteEdge(edge.id)}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={14} />
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
      </Grid>

      {/* Dialog: Add/Edit Workflow Meta */}
      <Dialog
        open={workflowDialogOpen}
        onClose={() => setWorkflowDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingWorkflowMeta ? 'Edit Info Workflow' : 'Tambah Workflow Baru'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nama Workflow"
              size="small"
              fullWidth
              autoFocus
              value={workflowForm.name}
              onChange={(e) => setWorkflowForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Contoh: Alur Pendaftaran dan Reservasi Online"
            />
            <TextField
              label="Deskripsi Workflow"
              size="small"
              fullWidth
              multiline
              rows={3}
              value={workflowForm.description}
              onChange={(e) =>
                setWorkflowForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Penjelasan ringkas proses bisnis yang dimodelkan pada workflow ini"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkflowDialogOpen(false)} color="inherit">
            Batal
          </Button>
          <Button
            onClick={handleSaveWorkflowDialog}
            variant="contained"
            disabled={!workflowForm.name.trim()}
          >
            Simpan Workflow
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Confirm Delete Workflow */}
      <Dialog
        open={deleteWorkflowConfirmationOpen}
        onClose={() => setDeleteWorkflowConfirmationOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>Hapus Workflow</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Apakah Anda yakin ingin menghapus seluruh workflow{' '}
            <strong>&quot;{activeWorkflow.name}&quot;</strong> beserta semua swimlane, node, dan
            edge di dalamnya?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteWorkflowConfirmationOpen(false)} color="inherit">
            Batal
          </Button>
          <Button onClick={handleDeleteWorkflow} color="error" variant="contained">
            Hapus Workflow
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Add/Edit Swimlane */}
      <Dialog
        open={laneDialogOpen}
        onClose={() => setLaneDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{editingLane ? 'Edit Swimlane' : 'Tambah Swimlane Baru'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Label Lane"
              size="small"
              fullWidth
              autoFocus
              value={laneForm.label}
              onChange={(e) => setLaneForm({ label: e.target.value })}
              placeholder="Contoh: Pemohon Layanan, Petugas Loket, Sistem Gateway"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLaneDialogOpen(false)} color="inherit">
            Batal
          </Button>
          <Button
            onClick={handleSaveLaneDialog}
            variant="contained"
            disabled={!laneForm.label.trim()}
          >
            Simpan Lane
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Add/Edit Node */}
      <Dialog
        open={nodeDialogOpen}
        onClose={() => setNodeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingNode ? 'Edit Node Workflow' : 'Tambah Node Workflow Baru'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="node-dialog-lane-label">Pilih Swimlane</InputLabel>
              <Select
                labelId="node-dialog-lane-label"
                label="Pilih Swimlane"
                value={nodeForm.lane_id}
                onChange={(e) => setNodeForm((prev) => ({ ...prev, lane_id: e.target.value }))}
                inputProps={{ 'aria-label': 'Pilih Swimlane' }}
              >
                {lanes.map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.label || l.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="node-dialog-type-label">Tipe Node</InputLabel>
              <Select
                labelId="node-dialog-type-label"
                label="Tipe Node"
                value={nodeForm.type}
                onChange={(e) =>
                  setNodeForm((prev) => ({ ...prev, type: e.target.value as WorkflowNodeType }))
                }
                inputProps={{ 'aria-label': 'Tipe Node' }}
              >
                {WORKFLOW_NODE_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Label Node"
              size="small"
              fullWidth
              autoFocus
              value={nodeForm.label}
              onChange={(e) => setNodeForm((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="Contoh: Pilih Jadwal Layanan, Cek Kuota Database"
            />

            <TextField
              label="Deskripsi Node"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={nodeForm.description}
              onChange={(e) => setNodeForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Penjelasan ringkas fungsi atau peran langkah ini"
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Posisi X"
                  size="small"
                  type="number"
                  fullWidth
                  value={nodeForm.layout.x}
                  onChange={(e) =>
                    setNodeForm((prev) => ({
                      ...prev,
                      layout: { ...prev.layout, x: Number(e.target.value) || 0 },
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Posisi Y"
                  size="small"
                  type="number"
                  fullWidth
                  value={nodeForm.layout.y}
                  onChange={(e) =>
                    setNodeForm((prev) => ({
                      ...prev,
                      layout: { ...prev.layout, y: Number(e.target.value) || 0 },
                    }))
                  }
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNodeDialogOpen(false)} color="inherit">
            Batal
          </Button>
          <Button
            onClick={handleSaveNodeDialog}
            variant="contained"
            disabled={!nodeForm.label.trim() || !nodeForm.lane_id}
          >
            Simpan Node
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Add/Edit Edge */}
      <Dialog
        open={edgeDialogOpen}
        onClose={() => setEdgeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingEdge ? 'Edit Edge & Cabang' : 'Tambah Edge Penghubung'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="edge-dialog-source-label">Source Node</InputLabel>
              <Select
                labelId="edge-dialog-source-label"
                label="Source Node"
                value={edgeForm.source}
                onChange={(e) => setEdgeForm((prev) => ({ ...prev, source: e.target.value }))}
                inputProps={{ 'aria-label': 'Source Node' }}
              >
                {nodes.map((n) => (
                  <MenuItem key={n.id} value={n.id}>
                    {n.label || n.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="edge-dialog-target-label">Target Node</InputLabel>
              <Select
                labelId="edge-dialog-target-label"
                label="Target Node"
                value={edgeForm.target}
                onChange={(e) => setEdgeForm((prev) => ({ ...prev, target: e.target.value }))}
                inputProps={{ 'aria-label': 'Target Node' }}
              >
                {nodes.map((n) => (
                  <MenuItem key={n.id} value={n.id}>
                    {n.label || n.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Label Edge / Kondisi Cabang"
              size="small"
              fullWidth
              value={edgeForm.label}
              onChange={(e) => setEdgeForm((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="Contoh: Ya / Tidak, Slot Tersedia / Penuh, Submit Form"
              helperText="Label kondisi percabangan yang tampil pada garis alur"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEdgeDialogOpen(false)} color="inherit">
            Batal
          </Button>
          <Button
            onClick={handleSaveEdgeDialog}
            variant="contained"
            disabled={!edgeForm.source || !edgeForm.target}
          >
            Simpan Edge
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Delete Node Confirmation with Impacted Edges */}
      <Dialog
        open={Boolean(deleteNodeConfirmation)}
        onClose={() => setDeleteNodeConfirmation(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>Konfirmasi Hapus Node</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Menghapus node <strong>&quot;{deleteNodeConfirmation?.node.label}&quot;</strong> akan
            otomatis menghapus <strong>{deleteNodeConfirmation?.affectedEdges.length} edge</strong>{' '}
            yang terhubung dengannya:
          </Typography>
          <Stack spacing={1} sx={{ mb: 1 }}>
            {deleteNodeConfirmation?.affectedEdges.map((e) => (
              <Box
                key={e.id}
                sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: 'background.neutral',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Iconify icon="solar:round-transfer-horizontal-bold" width={16} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {e.label || '(Tanpa label)'}: {e.source} &rarr; {e.target}
                </Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteNodeConfirmation(null)} color="inherit">
            Batal
          </Button>
          <Button
            onClick={() =>
              deleteNodeConfirmation && executeDeleteNode(deleteNodeConfirmation.node.id)
            }
            color="error"
            variant="contained"
          >
            Hapus Node beserta Edge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
