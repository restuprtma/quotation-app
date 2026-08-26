import '@xyflow/react/dist/style.css';

import type {
  WorkflowEdge,
  WorkflowLane,
  WorkflowNode,
  WorkflowProcess,
  WorkflowSection,
} from '../types';

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
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';

import { WorkflowEditDialog } from './workflow-edit-dialog';
import { WorkflowStepNode } from './nodes/workflow-step-node';
import { WorkflowLaneGroup } from './nodes/workflow-lane-group';
import { layoutWorkflow, type LayoutDirection } from '../utils/dagre-layout';

// ----------------------------------------------------------------------

type Props = {
  workflows: WorkflowSection;
  onChange: (updatedWorkflows: WorkflowSection) => void;
};

export function FlowLab({ workflows, onChange }: Props) {
  const theme = useTheme();

  // Active workflow selection
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>(
    workflows[0]?.id || 'wf-default'
  );

  useEffect(() => {
    if (workflows.length > 0 && !workflows.some((w) => w.id === activeWorkflowId)) {
      setActiveWorkflowId(workflows[0].id);
    }
  }, [workflows, activeWorkflowId]);

  const activeWorkflow: WorkflowProcess = useMemo(
    () =>
      workflows.find((w) => w.id === activeWorkflowId) ||
      workflows[0] || {
        id: 'wf-default',
        name: 'Default Workflow Process',
        description: 'Belum ada alur kerja.',
        lanes: [],
        nodes: [],
        edges: [],
      },
    [workflows, activeWorkflowId]
  );

  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>('LR');

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'node' | 'edge' | 'lane' | 'workflow'>('node');
  const [selectedNodeData, setSelectedNodeData] = useState<WorkflowNode | null>(null);
  const [selectedEdgeData, setSelectedEdgeData] = useState<WorkflowEdge | null>(null);
  const [selectedLaneData, setSelectedLaneData] = useState<WorkflowLane | null>(null);
  const [selectedWorkflowData, setSelectedWorkflowData] = useState<WorkflowProcess | null>(null);

  // Custom Node Types Registration
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      laneGroup: WorkflowLaneGroup as any,
      stepNode: WorkflowStepNode as any,
    }),
    []
  );

  // Convert current WorkflowProcess to React Flow Nodes & Edges
  const initialRfElements = useMemo(() => {
    // 1. Lane Group Nodes
    const laneNodes: Node[] = activeWorkflow.lanes.map((lane) => ({
      id: lane.id,
      type: 'laneGroup',
      data: {
        id: lane.id,
        label: lane.label,
        order: lane.order,
      },
      position: { x: 0, y: 0 },
      style: {
        width: 800,
        height: 160,
        zIndex: -1,
      },
    }));

    // Calculate outgoing edges per node for validation
    const outgoingCountMap = new Map<string, number>();
    activeWorkflow.edges.forEach((edge) => {
      outgoingCountMap.set(edge.source, (outgoingCountMap.get(edge.source) || 0) + 1);
    });

    // 2. Step Nodes
    const stepNodes: Node[] = activeWorkflow.nodes.map((node) => {
      const parentLane = activeWorkflow.lanes.find((l) => l.id === node.lane_id);
      return {
        id: node.id,
        type: 'stepNode',
        data: {
          id: node.id,
          label: node.label,
          description: node.description,
          type: node.type,
          lane_id: node.lane_id,
          lane_label: parentLane?.label,
          outgoingEdgesCount: outgoingCountMap.get(node.id) || 0,
        },
        position: { x: node.layout.x, y: node.layout.y },
      };
    });

    // 3. Edges
    const rfEdges: Edge[] = activeWorkflow.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
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
      data: edge,
    }));

    return {
      nodes: [...laneNodes, ...stepNodes],
      edges: rfEdges,
    };
  }, [activeWorkflow, theme]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialRfElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialRfElements.edges);

  useEffect(() => {
    setNodes(initialRfElements.nodes);
    setEdges(initialRfElements.edges);
  }, [initialRfElements, setNodes, setEdges]);

  // Update current active workflow in the workflows list
  const updateCurrentWorkflow = useCallback(
    (updatedWorkflow: WorkflowProcess) => {
      const updatedList = workflows.map((w) => (w.id === updatedWorkflow.id ? updatedWorkflow : w));
      onChange(updatedList);
    },
    [workflows, onChange]
  );

  // Dagre Auto-Layout Handler
  const handleAutoLayout = useCallback(
    (direction: LayoutDirection = layoutDirection) => {
      const layouted = layoutWorkflow(nodes, edges, direction);
      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);

      // Sync back step positions
      const updatedNodes = activeWorkflow.nodes.map((node) => {
        const layoutedNode = layouted.nodes.find((n) => n.id === node.id);
        if (layoutedNode) {
          return {
            ...node,
            layout: {
              x: Math.round(layoutedNode.position.x),
              y: Math.round(layoutedNode.position.y),
            },
          };
        }
        return node;
      });

      updateCurrentWorkflow({
        ...activeWorkflow,
        nodes: updatedNodes,
      });
    },
    [nodes, edges, layoutDirection, activeWorkflow, updateCurrentWorkflow, setNodes, setEdges]
  );

  // Connect handler
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      const newEdge: WorkflowEdge = {
        id: `wedge-${Date.now().toString(36)}`,
        source: params.source,
        target: params.target,
        label: '',
      };

      updateCurrentWorkflow({
        ...activeWorkflow,
        edges: [...activeWorkflow.edges, newEdge],
      });
    },
    [activeWorkflow, updateCurrentWorkflow]
  );

  // Click on Node
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'stepNode') {
        const targetStep = activeWorkflow.nodes.find((n) => n.id === node.id);
        if (targetStep) {
          setSelectedNodeData(targetStep);
          setSelectedEdgeData(null);
          setSelectedLaneData(null);
          setSelectedWorkflowData(null);
          setEditMode('node');
          setDialogOpen(true);
        }
      } else if (node.type === 'laneGroup') {
        const targetLane = activeWorkflow.lanes.find((l) => l.id === node.id);
        if (targetLane) {
          setSelectedLaneData(targetLane);
          setSelectedNodeData(null);
          setSelectedEdgeData(null);
          setSelectedWorkflowData(null);
          setEditMode('lane');
          setDialogOpen(true);
        }
      }
    },
    [activeWorkflow]
  );

  // Click on Edge
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const targetEdge = activeWorkflow.edges.find((e) => e.id === edge.id);
      if (targetEdge) {
        setSelectedEdgeData(targetEdge);
        setSelectedNodeData(null);
        setSelectedLaneData(null);
        setSelectedWorkflowData(null);
        setEditMode('edge');
        setDialogOpen(true);
      }
    },
    [activeWorkflow.edges]
  );

  // Handlers for Add buttons
  const handleOpenAddNode = () => {
    setSelectedNodeData(null);
    setSelectedEdgeData(null);
    setSelectedLaneData(null);
    setSelectedWorkflowData(null);
    setEditMode('node');
    setDialogOpen(true);
  };

  const handleOpenAddEdge = () => {
    setSelectedNodeData(null);
    setSelectedEdgeData(null);
    setSelectedLaneData(null);
    setSelectedWorkflowData(null);
    setEditMode('edge');
    setDialogOpen(true);
  };

  const handleOpenAddLane = () => {
    setSelectedNodeData(null);
    setSelectedEdgeData(null);
    setSelectedLaneData(null);
    setSelectedWorkflowData(null);
    setEditMode('lane');
    setDialogOpen(true);
  };

  const handleOpenCreateWorkflow = () => {
    setSelectedNodeData(null);
    setSelectedEdgeData(null);
    setSelectedLaneData(null);
    setSelectedWorkflowData(null);
    setEditMode('workflow');
    setDialogOpen(true);
  };

  const handleOpenEditWorkflow = () => {
    setSelectedWorkflowData(activeWorkflow);
    setSelectedNodeData(null);
    setSelectedEdgeData(null);
    setSelectedLaneData(null);
    setEditMode('workflow');
    setDialogOpen(true);
  };

  const handleDeleteActiveWorkflow = () => {
    if (workflows.length <= 1) return;
    const remaining = workflows.filter((w) => w.id !== activeWorkflow.id);
    onChange(remaining);
    setActiveWorkflowId(remaining[0]?.id || '');
  };

  // Save Handlers
  const handleSaveNode = (savedNode: WorkflowNode) => {
    const exists = activeWorkflow.nodes.some((n) => n.id === savedNode.id);
    const updatedNodes = exists
      ? activeWorkflow.nodes.map((n) => (n.id === savedNode.id ? savedNode : n))
      : [...activeWorkflow.nodes, savedNode];

    updateCurrentWorkflow({
      ...activeWorkflow,
      nodes: updatedNodes,
    });
  };

  const handleDeleteNode = (nodeId: string) => {
    const updatedNodes = activeWorkflow.nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = activeWorkflow.edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );

    updateCurrentWorkflow({
      ...activeWorkflow,
      nodes: updatedNodes,
      edges: updatedEdges,
    });
  };

  const handleSaveEdge = (savedEdge: WorkflowEdge) => {
    const exists = activeWorkflow.edges.some((e) => e.id === savedEdge.id);
    const updatedEdges = exists
      ? activeWorkflow.edges.map((e) => (e.id === savedEdge.id ? savedEdge : e))
      : [...activeWorkflow.edges, savedEdge];

    updateCurrentWorkflow({
      ...activeWorkflow,
      edges: updatedEdges,
    });
  };

  const handleDeleteEdge = (edgeId: string) => {
    const updatedEdges = activeWorkflow.edges.filter((e) => e.id !== edgeId);
    updateCurrentWorkflow({
      ...activeWorkflow,
      edges: updatedEdges,
    });
  };

  const handleSaveLane = (savedLane: WorkflowLane) => {
    const exists = activeWorkflow.lanes.some((l) => l.id === savedLane.id);
    const updatedLanes = exists
      ? activeWorkflow.lanes.map((l) => (l.id === savedLane.id ? savedLane : l))
      : [...activeWorkflow.lanes, savedLane];

    updateCurrentWorkflow({
      ...activeWorkflow,
      lanes: updatedLanes,
    });
  };

  const handleDeleteLane = (laneId: string) => {
    const updatedLanes = activeWorkflow.lanes.filter((l) => l.id !== laneId);
    // Assign orphan nodes to first lane if available
    const updatedNodes = activeWorkflow.nodes.map((n) =>
      n.lane_id === laneId ? { ...n, lane_id: updatedLanes[0]?.id || '' } : n
    );

    updateCurrentWorkflow({
      ...activeWorkflow,
      lanes: updatedLanes,
      nodes: updatedNodes,
    });
  };

  const handleSaveWorkflow = (savedWf: WorkflowProcess) => {
    const exists = workflows.some((w) => w.id === savedWf.id);
    if (exists) {
      const updatedList = workflows.map((w) => (w.id === savedWf.id ? savedWf : w));
      onChange(updatedList);
    } else {
      const updatedList = [...workflows, savedWf];
      onChange(updatedList);
      setActiveWorkflowId(savedWf.id);
    }
  };

  const decisionNodes = activeWorkflow.nodes.filter((n) => n.type === 'decision');
  const underbranchedDecisions = decisionNodes.filter((d) => {
    const count = activeWorkflow.edges.filter((e) => e.source === d.id).length;
    return count < 2;
  });

  return (
    <Box sx={{ width: '100%' }}>
      {/* Multi-Workflow Switcher Banner */}
      <Card
        sx={{
          p: 2.5,
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.75 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Pilih Alur Kerja (Business Process):
            </Typography>
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <Select
                value={activeWorkflow.id}
                onChange={(e) => setActiveWorkflowId(e.target.value)}
                sx={{ fontWeight: 700 }}
              >
                {workflows.map((wf) => (
                  <MenuItem key={wf.id} value={wf.id}>
                    {wf.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
            {activeWorkflow.description || 'Tidak ada deskripsi workflow.'}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={<Icon icon="solar:pen-bold" />}
            onClick={handleOpenEditWorkflow}
          >
            Edit Info Alur
          </Button>

          <Button
            variant="contained"
            size="small"
            color="primary"
            startIcon={<Icon icon="solar:add-circle-bold" />}
            onClick={handleOpenCreateWorkflow}
          >
            + Buat Alur Baru
          </Button>

          {workflows.length > 1 && (
            <IconButton
              size="small"
              color="error"
              title="Hapus alur kerja ini"
              onClick={handleDeleteActiveWorkflow}
            >
              <Icon icon="solar:trash-bin-trash-bold" width={20} />
            </IconButton>
          )}
        </Stack>
      </Card>

      {/* Toolbar & Action Header */}
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
            Workflow Canvas
          </Typography>
          <Chip
            label={`${activeWorkflow.lanes.length} Lanes`}
            size="small"
            color="info"
            variant="soft"
          />
          <Chip
            label={`${activeWorkflow.nodes.length} Steps`}
            size="small"
            color="primary"
            variant="soft"
          />
          <Chip
            label={`${activeWorkflow.edges.length} Edges`}
            size="small"
            color="secondary"
            variant="soft"
          />
          {underbranchedDecisions.length > 0 && (
            <Chip
              icon={<Icon icon="solar:danger-triangle-bold" />}
              label={`${underbranchedDecisions.length} Decision Cabang < 2`}
              size="small"
              color="error"
              variant="filled"
              sx={{ fontWeight: 700 }}
            />
          )}
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
            startIcon={<Icon icon="solar:layers-bold" />}
            onClick={handleOpenAddLane}
          >
            + Jalur / Lane
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Icon icon="solar:link-round-bold" />}
            onClick={handleOpenAddEdge}
          >
            + Koneksi
          </Button>

          <Button
            variant="contained"
            size="small"
            color="primary"
            startIcon={<Icon icon="solar:add-circle-bold" />}
            onClick={handleOpenAddNode}
          >
            + Langkah
          </Button>
        </Stack>
      </Card>

      {/* Canvas */}
      <Card
        sx={{
          height: 650,
          width: '100%',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
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
              if (n.type === 'laneGroup') return theme.palette.grey[300];
              if (n.data?.type === 'start') return theme.palette.success.main;
              if (n.data?.type === 'end') return theme.palette.error.main;
              if (n.data?.type === 'decision') return theme.palette.warning.main;
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

      {/* Edit Dialog */}
      <WorkflowEditDialog
        open={dialogOpen}
        editMode={editMode}
        nodeData={selectedNodeData}
        edgeData={selectedEdgeData}
        laneData={selectedLaneData}
        workflowData={selectedWorkflowData}
        lanes={activeWorkflow.lanes}
        allNodes={activeWorkflow.nodes}
        onClose={() => setDialogOpen(false)}
        onSaveNode={handleSaveNode}
        onSaveEdge={handleSaveEdge}
        onSaveLane={handleSaveLane}
        onSaveWorkflow={handleSaveWorkflow}
        onDeleteNode={handleDeleteNode}
        onDeleteEdge={handleDeleteEdge}
        onDeleteLane={handleDeleteLane}
      />
    </Box>
  );
}
