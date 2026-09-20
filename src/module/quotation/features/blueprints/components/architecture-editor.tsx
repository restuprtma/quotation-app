import type { Edge, Node, Connection, EdgeChange, NodeChange } from '@xyflow/react';
import type { CanonicalIssue } from '../types';
import type { LayoutDirection } from '../utils/dagre-layout';
import type { ReferenceOption } from '../validation/manual-section';
import type {
  Architecture,
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureGroup,
  ArchitectureEdgeType,
  ArchitectureNodeType,
} from '../types/bundle';

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
import { useTheme } from '@mui/material/styles';
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
import { newBlueprintItemId } from '../validation/manual-payload';
import { ARCHITECTURE_NODE_TYPES, ARCHITECTURE_EDGE_TYPES } from './manual/architecture-fields';
import {
  architectureToReactFlow,
  reactFlowToArchitecture,
  applyArchitectureAutoLayout,
} from '../validation/flow-adapter';

// ----------------------------------------------------------------------

export interface ArchitectureEditorProps {
  architecture: Architecture;
  onChange: (updatedArchitecture: Architecture) => void;
  referenceOptions?: ReferenceOption[];
  issues?: CanonicalIssue[];
  focusTargetId?: string | null;
  readOnly?: boolean;
}

interface DeleteNodeConfirmationState {
  node: ArchitectureNode;
  affectedEdges: ArchitectureEdge[];
}

interface DeleteGroupConfirmationState {
  group: ArchitectureGroup;
  affectedNodes: ArchitectureNode[];
  affectedEdges: ArchitectureEdge[];
}

// ----------------------------------------------------------------------

export function ArchitectureEditor({
  architecture,
  onChange,
  referenceOptions = [],
  issues = [],
  focusTargetId = null,
  readOnly = false,
}: ArchitectureEditorProps) {
  const theme = useTheme();

  // Layout direction state
  const [layoutDir, setLayoutDir] = useState<LayoutDirection>('LR');

  // React Flow state synchronized with architecture prop
  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  const [rfEdges, setRfEdges] = useState<Edge[]>([]);

  useEffect(() => {
    const { nodes, edges } = architectureToReactFlow(architecture);
    setRfNodes(nodes);
    setRfEdges(edges);
  }, [architecture]);

  // Dialog states
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ArchitectureGroup | null>(null);
  const [groupLabelInput, setGroupLabelInput] = useState('');

  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<ArchitectureNode | null>(null);
  const [nodeForm, setNodeForm] = useState<{
    label: string;
    group_id: string;
    type: ArchitectureNodeType;
    description: string;
  }>({
    label: '',
    group_id: '',
    type: 'application',
    description: '',
  });

  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [editingEdge, setEditingEdge] = useState<ArchitectureEdge | null>(null);
  const [edgeForm, setEdgeForm] = useState<{
    source: string;
    target: string;
    type: ArchitectureEdgeType;
    label: string;
  }>({
    source: '',
    target: '',
    type: 'sync',
    label: '',
  });

  const [deleteNodeConfirmation, setDeleteNodeConfirmation] =
    useState<DeleteNodeConfirmationState | null>(null);
  const [deleteGroupConfirmation, setDeleteGroupConfirmation] =
    useState<DeleteGroupConfirmationState | null>(null);

  const groups = useMemo(() => architecture.groups || [], [architecture.groups]);
  const nodes = useMemo(() => architecture.nodes || [], [architecture.nodes]);
  const edges = useMemo(() => architecture.edges || [], [architecture.edges]);

  // ----------------------------------------------------------------------
  // React Flow Node & Edge Handlers
  // ----------------------------------------------------------------------

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (readOnly) return;
      setRfNodes((prevNodes) => {
        const nextNodes = applyNodeChanges(changes, prevNodes);
        // Only trigger onChange when a node position has been moved (e.g. drag ended)
        const hasPositionChange = changes.some(
          (c) => c.type === 'position' && (c as any).dragging === false
        );
        if (hasPositionChange) {
          const updatedArch = reactFlowToArchitecture(nextNodes, rfEdges);
          onChange(updatedArch);
        }
        return nextNodes;
      });
    },
    [readOnly, rfEdges, onChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (readOnly) return;
      setRfEdges((prevEdges) => {
        const nextEdges = applyEdgeChanges(changes, prevEdges);
        const hasRemoval = changes.some((c) => c.type === 'remove');
        if (hasRemoval) {
          const updatedArch = reactFlowToArchitecture(rfNodes, nextEdges);
          onChange(updatedArch);
        }
        return nextEdges;
      });
    },
    [readOnly, rfNodes, onChange]
  );

  const handleConnect = useCallback(
    (params: Connection) => {
      if (readOnly || !params.source || !params.target) return;
      const newEdgeId = newBlueprintItemId('edge');
      const newEdge: ArchitectureEdge = {
        id: newEdgeId,
        source: params.source,
        target: params.target,
        type: 'sync',
        label: '',
      };
      const updatedEdges = [...edges, newEdge];
      onChange({
        ...architecture,
        edges: updatedEdges,
      });
    },
    [readOnly, architecture, edges, onChange]
  );

  // ----------------------------------------------------------------------
  // Group CRUD Handlers
  // ----------------------------------------------------------------------

  const handleOpenAddGroup = () => {
    if (readOnly) return;
    setEditingGroup(null);
    setGroupLabelInput('');
    setGroupDialogOpen(true);
  };

  const handleOpenEditGroup = (group: ArchitectureGroup) => {
    if (readOnly) return;
    setEditingGroup(group);
    setGroupLabelInput(group.label);
    setGroupDialogOpen(true);
  };

  const handleSaveGroup = () => {
    if (readOnly || !groupLabelInput.trim()) return;

    if (editingGroup) {
      // Edit existing group
      const updatedGroups = groups.map((g) =>
        g.id === editingGroup.id ? { ...g, label: groupLabelInput.trim() } : g
      );
      onChange({
        ...architecture,
        groups: updatedGroups,
      });
    } else {
      // Add new group
      const nextOrder = groups.length + 1;
      const newGroup: ArchitectureGroup = {
        id: newBlueprintItemId('grp'),
        label: groupLabelInput.trim(),
        order: nextOrder,
      };
      onChange({
        ...architecture,
        groups: [...groups, newGroup],
      });
    }
    setGroupDialogOpen(false);
  };

  const handleDeleteGroup = (group: ArchitectureGroup) => {
    if (readOnly) return;
    const memberNodes = nodes.filter((n) => n.group_id === group.id);
    const memberNodeIds = new Set(memberNodes.map((n) => n.id));
    const attachedEdges = edges.filter(
      (e) => memberNodeIds.has(e.source) || memberNodeIds.has(e.target)
    );

    if (memberNodes.length > 0) {
      setDeleteGroupConfirmation({
        group,
        affectedNodes: memberNodes,
        affectedEdges: attachedEdges,
      });
      return;
    }

    // Empty group -> delete directly and re-index orders
    const remainingGroups = groups
      .filter((g) => g.id !== group.id)
      .map((g, idx) => ({ ...g, order: idx + 1 }));

    onChange({
      ...architecture,
      groups: remainingGroups,
    });
  };

  const handleConfirmDeleteGroup = () => {
    if (!deleteGroupConfirmation || readOnly) return;
    const { group } = deleteGroupConfirmation;

    const remainingGroups = groups
      .filter((g) => g.id !== group.id)
      .map((g, idx) => ({ ...g, order: idx + 1 }));

    const remainingNodes = nodes.filter((n) => n.group_id !== group.id);
    const remainingNodeIds = new Set(remainingNodes.map((n) => n.id));
    const remainingEdges = edges.filter(
      (e) => remainingNodeIds.has(e.source) && remainingNodeIds.has(e.target)
    );

    onChange({
      groups: remainingGroups,
      nodes: remainingNodes,
      edges: remainingEdges,
    });
    setDeleteGroupConfirmation(null);
  };

  // ----------------------------------------------------------------------
  // Node CRUD Handlers
  // ----------------------------------------------------------------------

  const handleOpenAddNode = () => {
    if (readOnly) return;
    setEditingNode(null);
    setNodeForm({
      label: '',
      group_id: groups[0]?.id || '',
      type: 'application',
      description: '',
    });
    setNodeDialogOpen(true);
  };

  const handleOpenEditNode = (node: ArchitectureNode) => {
    if (readOnly) return;
    setEditingNode(node);
    setNodeForm({
      label: node.label,
      group_id: node.group_id,
      type: node.type,
      description: node.description || '',
    });
    setNodeDialogOpen(true);
  };

  const handleSaveNode = () => {
    if (readOnly || !nodeForm.label.trim()) return;

    if (editingNode) {
      // Edit existing node
      const updatedNodes = nodes.map((n) =>
        n.id === editingNode.id
          ? {
              ...n,
              label: nodeForm.label.trim(),
              group_id: nodeForm.group_id || groups[0]?.id || '',
              type: nodeForm.type,
              description: nodeForm.description.trim(),
            }
          : n
      );
      onChange({
        ...architecture,
        nodes: updatedNodes,
      });
    } else {
      // Add new node
      const newNode: ArchitectureNode = {
        id: newBlueprintItemId('node'),
        group_id: nodeForm.group_id || groups[0]?.id || '',
        type: nodeForm.type,
        label: nodeForm.label.trim(),
        description: nodeForm.description.trim(),
        layout: { x: 100, y: 100 },
      };
      onChange({
        ...architecture,
        nodes: [...nodes, newNode],
      });
    }
    setNodeDialogOpen(false);
  };

  const handleDeleteNode = (node: ArchitectureNode) => {
    if (readOnly) return;
    const connectedEdges = edges.filter((e) => e.source === node.id || e.target === node.id);

    if (connectedEdges.length > 0) {
      setDeleteNodeConfirmation({
        node,
        affectedEdges: connectedEdges,
      });
      return;
    }

    // No connected edges -> delete directly
    onChange({
      ...architecture,
      nodes: nodes.filter((n) => n.id !== node.id),
    });
  };

  const handleConfirmDeleteNode = () => {
    if (!deleteNodeConfirmation || readOnly) return;
    const { node } = deleteNodeConfirmation;

    const remainingNodes = nodes.filter((n) => n.id !== node.id);
    const remainingEdges = edges.filter((e) => e.source !== node.id && e.target !== node.id);

    onChange({
      ...architecture,
      nodes: remainingNodes,
      edges: remainingEdges,
    });
    setDeleteNodeConfirmation(null);
  };

  // ----------------------------------------------------------------------
  // Edge CRUD Handlers
  // ----------------------------------------------------------------------

  const handleOpenAddEdge = () => {
    if (readOnly) return;
    setEditingEdge(null);
    setEdgeForm({
      source: nodes[0]?.id || '',
      target: nodes[1]?.id || nodes[0]?.id || '',
      type: 'sync',
      label: '',
    });
    setEdgeDialogOpen(true);
  };

  const handleOpenEditEdge = (edge: ArchitectureEdge) => {
    if (readOnly) return;
    setEditingEdge(edge);
    setEdgeForm({
      source: edge.source,
      target: edge.target,
      type: edge.type,
      label: edge.label || '',
    });
    setEdgeDialogOpen(true);
  };

  const handleSaveEdge = () => {
    if (readOnly) return;

    if (editingEdge) {
      // Edit existing edge
      const updatedEdges = edges.map((e) =>
        e.id === editingEdge.id
          ? {
              ...e,
              source: edgeForm.source,
              target: edgeForm.target,
              type: edgeForm.type,
              label: edgeForm.label.trim(),
            }
          : e
      );
      onChange({
        ...architecture,
        edges: updatedEdges,
      });
    } else {
      // Add new edge
      const newEdge: ArchitectureEdge = {
        id: newBlueprintItemId('edge'),
        source: edgeForm.source || nodes[0]?.id || '',
        target: edgeForm.target || nodes[1]?.id || nodes[0]?.id || '',
        type: edgeForm.type,
        label: edgeForm.label.trim(),
      };
      onChange({
        ...architecture,
        edges: [...edges, newEdge],
      });
    }
    setEdgeDialogOpen(false);
  };

  const handleDeleteEdge = (edge: ArchitectureEdge) => {
    if (readOnly) return;
    onChange({
      ...architecture,
      edges: edges.filter((e) => e.id !== edge.id),
    });
  };

  // ----------------------------------------------------------------------
  // Auto-Layout Action
  // ----------------------------------------------------------------------

  const handleAutoLayout = () => {
    if (readOnly) return;
    const layoutedArch = applyArchitectureAutoLayout(architecture, layoutDir);
    onChange(layoutedArch);
  };

  // ----------------------------------------------------------------------

  return (
    <Stack spacing={3} data-testid="architecture-editor">
      {/* Read-Only Guidance Alert */}
      {readOnly && (
        <Alert severity="info" variant="outlined">
          <strong>Mode Baca Arsitektur:</strong> Modifikasi diagram dinonaktifkan pada tampilan ini.
        </Alert>
      )}

      {/* Editor Controls & Toolbar Header */}
      <Card variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          {/* Metadata Statistics */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mr: 1 }}>
              Visual Architecture Editor
            </Typography>
            <Chip
              size="small"
              label={`${groups.length} Tiers/Groups`}
              color="primary"
              variant="soft"
            />
            <Chip size="small" label={`${nodes.length} Components`} color="info" variant="soft" />
            <Chip
              size="small"
              label={`${edges.length} Connections`}
              color="secondary"
              variant="soft"
            />
          </Stack>

          {/* Action Buttons Toolbar */}
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <ButtonGroup size="small" variant="outlined" disabled={readOnly}>
              <Button
                variant={layoutDir === 'LR' ? 'contained' : 'outlined'}
                onClick={() => setLayoutDir('LR')}
                title="Arah Layout Horizontal (Kiri ke Kanan)"
              >
                LR
              </Button>
              <Button
                variant={layoutDir === 'TB' ? 'contained' : 'outlined'}
                onClick={() => setLayoutDir('TB')}
                title="Arah Layout Vertikal (Atas ke Bawah)"
              >
                TB
              </Button>
            </ButtonGroup>

            <Button
              variant="outlined"
              color="secondary"
              size="small"
              disabled={readOnly}
              startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
              onClick={handleAutoLayout}
            >
              Auto-Layout
            </Button>

            <Button
              variant="outlined"
              color="primary"
              size="small"
              disabled={readOnly}
              startIcon={<Iconify icon="solar:folder-plus-bold" />}
              onClick={handleOpenAddGroup}
            >
              Tambah Group
            </Button>

            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={readOnly || groups.length === 0}
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleOpenAddNode}
            >
              Tambah Node
            </Button>

            <Button
              variant="outlined"
              color="info"
              size="small"
              disabled={readOnly || nodes.length < 2}
              startIcon={<Iconify icon="solar:link-broken-minimalistic-bold" />}
              onClick={handleOpenAddEdge}
            >
              Tambah Relasi
            </Button>
          </Stack>
        </Stack>
      </Card>

      {/* Main ReactFlow Canvas */}
      <BlueprintFlowCanvas
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        focusTargetId={focusTargetId}
        readOnly={readOnly}
        height={580}
        onEdgeClick={(_, edge) => {
          const matched = edges.find((e) => e.id === edge.id);
          if (matched) handleOpenEditEdge(matched);
        }}
      />

      {/* Tiers & Groups Overview Cards */}
      <Card variant="outlined">
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Daftar Architectural Tiers / Groups
            </Typography>
            {!readOnly && (
              <Button
                size="small"
                variant="text"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleOpenAddGroup}
              >
                Tambah Tier
              </Button>
            )}
          </Stack>

          <Grid container spacing={2}>
            {groups.map((grp) => {
              const groupNodeCount = nodes.filter((n) => n.group_id === grp.id).length;
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={grp.id}>
                  <Box
                    sx={{
                      p: 1.5,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1.5,
                      bgcolor: 'background.neutral',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ minWidth: 0, pr: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          label={`Tier ${grp.order}`}
                          color="primary"
                          variant="filled"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600 }}
                          noWrap
                          title={grp.label}
                        >
                          {grp.label}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {groupNodeCount} komponen terdaftar
                      </Typography>
                    </Box>

                    {!readOnly && (
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          aria-label={`Edit group ${grp.label}`}
                          onClick={() => handleOpenEditGroup(grp)}
                        >
                          <Iconify icon="solar:pen-bold" width={16} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={`Hapus group ${grp.label}`}
                          onClick={() => handleDeleteGroup(grp)}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                        </IconButton>
                      </Stack>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Components & Nodes Quick Management */}
      <Card variant="outlined">
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Daftar Komponen & Nodes Arsitektur
            </Typography>
            {!readOnly && (
              <Button
                size="small"
                variant="text"
                disabled={groups.length === 0}
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleOpenAddNode}
              >
                Tambah Komponen
              </Button>
            )}
          </Stack>

          <Grid container spacing={2}>
            {nodes.map((node) => {
              const groupName = groups.find((g) => g.id === node.group_id)?.label || node.group_id;
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={node.id}>
                  <Box
                    sx={{
                      p: 1.5,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1.5,
                      bgcolor: 'background.paper',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                    }}
                  >
                    <Box sx={{ mb: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Chip
                          size="small"
                          label={node.type}
                          color="info"
                          variant="soft"
                          sx={{ height: 20, fontSize: '0.7rem', textTransform: 'capitalize' }}
                        />
                        {!readOnly && (
                          <Stack direction="row" spacing={0.5}>
                            <IconButton
                              size="small"
                              aria-label={`Edit node ${node.label}`}
                              onClick={() => handleOpenEditNode(node)}
                            >
                              <Iconify icon="solar:pen-bold" width={16} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              aria-label={`Hapus node ${node.label}`}
                              onClick={() => handleDeleteNode(node)}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                            </IconButton>
                          </Stack>
                        )}
                      </Stack>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                        {node.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Tier: {groupName}
                      </Typography>
                      {node.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          {node.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Connections & Edges Quick Management */}
      <Card variant="outlined">
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Daftar Relasi & Connections Arsitektur
            </Typography>
            {!readOnly && (
              <Button
                size="small"
                variant="text"
                disabled={nodes.length < 2}
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleOpenAddEdge}
              >
                Tambah Relasi
              </Button>
            )}
          </Stack>

          <Grid container spacing={2}>
            {edges.map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.source)?.label || edge.source;
              const targetNode = nodes.find((n) => n.id === edge.target)?.label || edge.target;
              return (
                <Grid size={{ xs: 12, sm: 6 }} key={edge.id}>
                  <Box
                    sx={{
                      p: 1.5,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1.5,
                      bgcolor: 'background.paper',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ minWidth: 0, pr: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          label={edge.type}
                          color="secondary"
                          variant="soft"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                          {edge.label || 'Relasi'}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {sourceNode} → {targetNode}
                      </Typography>
                    </Box>

                    {!readOnly && (
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          aria-label={`Edit relasi ${edge.label || edge.id}`}
                          onClick={() => handleOpenEditEdge(edge)}
                        >
                          <Iconify icon="solar:pen-bold" width={16} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={`Hapus relasi ${edge.label || edge.id}`}
                          onClick={() => handleDeleteEdge(edge)}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                        </IconButton>
                      </Stack>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 1. Group Dialog */}
      {/* ============================================================ */}
      <Dialog
        open={groupDialogOpen}
        onClose={() => setGroupDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {editingGroup ? 'Edit Group Arsitektur' : 'Tambah Group Arsitektur'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="Label Group"
              fullWidth
              size="small"
              value={groupLabelInput}
              onChange={(e) => setGroupLabelInput(e.target.value)}
              placeholder="Contoh: Application & Service Tier"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupDialogOpen(false)} color="inherit">
            Batal
          </Button>
          <Button
            onClick={handleSaveGroup}
            variant="contained"
            color="primary"
            disabled={!groupLabelInput.trim()}
          >
            Simpan Group
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================ */}
      {/* 2. Node Dialog */}
      {/* ============================================================ */}
      <Dialog
        open={nodeDialogOpen}
        onClose={() => setNodeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingNode ? 'Edit Node Arsitektur' : 'Tambah Node Arsitektur'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Label Node"
              fullWidth
              size="small"
              value={nodeForm.label}
              onChange={(e) => setNodeForm({ ...nodeForm, label: e.target.value })}
              placeholder="Contoh: Web Portal Pemohon"
              autoFocus
            />

            <FormControl fullWidth size="small">
              <InputLabel id="node-group-select-label">Group / Tier</InputLabel>
              <Select
                labelId="node-group-select-label"
                label="Group / Tier"
                value={nodeForm.group_id}
                onChange={(e) => setNodeForm({ ...nodeForm, group_id: e.target.value })}
              >
                {groups.map((grp) => (
                  <MenuItem key={grp.id} value={grp.id}>
                    Tier {grp.order}: {grp.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="node-type-select-label">Tipe Komponen</InputLabel>
              <Select
                labelId="node-type-select-label"
                label="Tipe Komponen"
                value={nodeForm.type}
                onChange={(e) =>
                  setNodeForm({ ...nodeForm, type: e.target.value as ArchitectureNodeType })
                }
              >
                {ARCHITECTURE_NODE_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Deskripsi Node"
              fullWidth
              multiline
              rows={2}
              size="small"
              value={nodeForm.description}
              onChange={(e) => setNodeForm({ ...nodeForm, description: e.target.value })}
              placeholder="Deskripsi peran dan tanggung jawab komponen arsitektur ini"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNodeDialogOpen(false)} color="inherit">
            Batal
          </Button>
          <Button
            onClick={handleSaveNode}
            variant="contained"
            color="primary"
            disabled={!nodeForm.label.trim() || !nodeForm.group_id}
          >
            Simpan Node
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================ */}
      {/* 3. Edge Dialog */}
      {/* ============================================================ */}
      <Dialog
        open={edgeDialogOpen}
        onClose={() => setEdgeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingEdge ? 'Edit Relasi Arsitektur' : 'Tambah Relasi Arsitektur'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="edge-source-select-label">Node Asal (Source)</InputLabel>
              <Select
                labelId="edge-source-select-label"
                label="Node Asal (Source)"
                value={edgeForm.source}
                onChange={(e) => setEdgeForm({ ...edgeForm, source: e.target.value })}
              >
                {nodes.map((n) => (
                  <MenuItem key={n.id} value={n.id}>
                    {n.label} ({n.id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="edge-target-select-label">Node Tujuan (Target)</InputLabel>
              <Select
                labelId="edge-target-select-label"
                label="Node Tujuan (Target)"
                value={edgeForm.target}
                onChange={(e) => setEdgeForm({ ...edgeForm, target: e.target.value })}
              >
                {nodes.map((n) => (
                  <MenuItem key={n.id} value={n.id}>
                    {n.label} ({n.id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="edge-type-select-label">Tipe Relasi</InputLabel>
              <Select
                labelId="edge-type-select-label"
                label="Tipe Relasi"
                value={edgeForm.type}
                onChange={(e) =>
                  setEdgeForm({ ...edgeForm, type: e.target.value as ArchitectureEdgeType })
                }
              >
                {ARCHITECTURE_EDGE_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Label Relasi"
              fullWidth
              size="small"
              value={edgeForm.label}
              onChange={(e) => setEdgeForm({ ...edgeForm, label: e.target.value })}
              placeholder="Contoh: HTTPS REST / JSON atau gRPC"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEdgeDialogOpen(false)} color="inherit">
            Batal
          </Button>
          <Button
            onClick={handleSaveEdge}
            variant="contained"
            color="primary"
            disabled={!edgeForm.source || !edgeForm.target}
          >
            Simpan Relasi
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================ */}
      {/* 4. Delete Node Confirmation Dialog */}
      {/* ============================================================ */}
      <Dialog
        open={Boolean(deleteNodeConfirmation)}
        onClose={() => setDeleteNodeConfirmation(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="solar:danger-triangle-bold" />
          Konfirmasi Hapus Node
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Apakah Anda yakin ingin menghapus node{' '}
            <strong>{deleteNodeConfirmation?.node.label}</strong>? Node ini terhubung dengan relasi
            berikut yang juga akan dihapus:
          </Typography>
          <Stack spacing={1} sx={{ pl: 2, mb: 1 }}>
            {deleteNodeConfirmation?.affectedEdges.map((e) => (
              <Typography key={e.id} variant="caption" color="text.secondary" display="block">
                • <strong>{e.label || e.id}</strong> ({e.type}): {e.source} → {e.target}
              </Typography>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteNodeConfirmation(null)} color="inherit">
            Batal
          </Button>
          <Button onClick={handleConfirmDeleteNode} color="error" variant="contained">
            Hapus Node beserta Relasi
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================ */}
      {/* 5. Delete Group Confirmation Dialog */}
      {/* ============================================================ */}
      <Dialog
        open={Boolean(deleteGroupConfirmation)}
        onClose={() => setDeleteGroupConfirmation(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="solar:danger-triangle-bold" />
          Konfirmasi Hapus Group
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Apakah Anda yakin ingin menghapus group{' '}
            <strong>{deleteGroupConfirmation?.group.label}</strong>? Group ini masih berisi komponen
            berikut yang juga akan dihapus:
          </Typography>
          <Stack spacing={1} sx={{ pl: 2, mb: 1 }}>
            {deleteGroupConfirmation?.affectedNodes.map((n) => (
              <Typography key={n.id} variant="caption" color="text.secondary" display="block">
                • <strong>{n.label}</strong> ({n.type}) [{n.id}]
              </Typography>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteGroupConfirmation(null)} color="inherit">
            Batal
          </Button>
          <Button onClick={handleConfirmDeleteGroup} color="error" variant="contained">
            Hapus Group beserta Node
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
