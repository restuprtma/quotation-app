import '@xyflow/react/dist/style.css';

import type { ArchEdge, ArchNode, ArchGroup, ArchEdgeType, ArchitectureSection } from '../types';

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
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { NodeEditDialog } from './node-edit-dialog';
import { ArchitectureGroupNode } from './nodes/architecture-group-node';
import { ArchitectureTypedNode } from './nodes/architecture-typed-node';
import { getLayoutedElements, type LayoutDirection } from '../utils/dagre-layout';

// ----------------------------------------------------------------------

type Props = {
  architecture: ArchitectureSection;
  onChange: (updatedArchitecture: ArchitectureSection) => void;
};

const EDGE_TYPE_STYLES: Record<
  ArchEdgeType,
  { strokeDasharray?: string; animated?: boolean; strokeWidth?: number }
> = {
  sync: { strokeWidth: 2 },
  async: { strokeDasharray: '5,5', strokeWidth: 2 },
  data_flow: { strokeDasharray: '2,3', strokeWidth: 2 },
  event: { strokeDasharray: '6,4', animated: true, strokeWidth: 2 },
};

export function ArchitectureLab({ architecture, onChange }: Props) {
  const theme = useTheme();

  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>('LR');

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'node' | 'edge'>('node');
  const [selectedNodeData, setSelectedNodeData] = useState<ArchNode | null>(null);
  const [selectedEdgeData, setSelectedEdgeData] = useState<ArchEdge | null>(null);

  // Custom Node Types Registration
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      group: ArchitectureGroupNode as any,
      typed: ArchitectureTypedNode as any,
    }),
    []
  );

  // Convert ArchitectureSection to React Flow Nodes & Edges
  const initialRfElements = useMemo(() => {
    // 1. Group Nodes
    const groupRfNodes: Node[] = architecture.groups.map((group) => ({
      id: group.id,
      type: 'group',
      data: {
        id: group.id,
        label: group.label,
        order: group.order,
      },
      position: { x: 0, y: 0 },
      style: {
        width: 280,
        height: 200,
        zIndex: -1,
      },
    }));

    // 2. Typed Regular Nodes
    const typedRfNodes: Node[] = architecture.nodes.map((node) => ({
      id: node.id,
      type: 'typed',
      parentId: node.group_id,
      extent: 'parent',
      data: {
        id: node.id,
        type: node.type,
        label: node.label,
        description: node.description,
        group_id: node.group_id,
      },
      position: { x: node.layout.x, y: node.layout.y },
    }));

    // 3. Edges
    const rfEdges: Edge[] = architecture.edges.map((edge) => {
      const styleConfig = EDGE_TYPE_STYLES[edge.type] || EDGE_TYPE_STYLES.sync;
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'smoothstep',
        animated: styleConfig.animated,
        style: {
          stroke: theme.palette.primary.main,
          strokeWidth: styleConfig.strokeWidth,
          strokeDasharray: styleConfig.strokeDasharray,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: theme.palette.primary.main,
        },
        data: edge,
      };
    });

    return {
      nodes: [...groupRfNodes, ...typedRfNodes],
      edges: rfEdges,
    };
  }, [architecture, theme]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialRfElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialRfElements.edges);

  useEffect(() => {
    setNodes(initialRfElements.nodes);
    setEdges(initialRfElements.edges);
  }, [initialRfElements, setNodes, setEdges]);

  // Dagre Auto-Layout Handler
  const handleAutoLayout = useCallback(
    (direction: LayoutDirection = layoutDirection) => {
      const layouted = getLayoutedElements(nodes, edges, direction);
      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);

      // Sync back node positions to architecture state
      const updatedNodes = architecture.nodes.map((node) => {
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

      onChange({
        ...architecture,
        nodes: updatedNodes,
      });
    },
    [nodes, edges, layoutDirection, architecture, onChange, setNodes, setEdges]
  );

  // React Flow Connect Edge Handler
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      const newEdge: ArchEdge = {
        id: `edge-${Date.now().toString(36)}`,
        source: params.source,
        target: params.target,
        label: 'Sync Call',
        type: 'sync',
      };

      onChange({
        ...architecture,
        edges: [...architecture.edges, newEdge],
      });
    },
    [architecture, onChange]
  );

  // Click on Node to Edit
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'typed') {
        const targetNode = architecture.nodes.find((n) => n.id === node.id);
        if (targetNode) {
          setSelectedNodeData(targetNode);
          setSelectedEdgeData(null);
          setEditMode('node');
          setDialogOpen(true);
        }
      }
    },
    [architecture.nodes]
  );

  // Click on Edge to Edit
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const targetEdge = architecture.edges.find((e) => e.id === edge.id);
      if (targetEdge) {
        setSelectedEdgeData(targetEdge);
        setSelectedNodeData(null);
        setEditMode('edge');
        setDialogOpen(true);
      }
    },
    [architecture.edges]
  );

  const handleOpenAddNode = () => {
    setSelectedNodeData(null);
    setSelectedEdgeData(null);
    setEditMode('node');
    setDialogOpen(true);
  };

  const handleOpenAddEdge = () => {
    setSelectedNodeData(null);
    setSelectedEdgeData(null);
    setEditMode('edge');
    setDialogOpen(true);
  };

  const handleAddGroup = () => {
    const nextOrder = architecture.groups.length + 1;
    const newGroup: ArchGroup = {
      id: `grp-${Date.now().toString(36)}`,
      label: `Tier ${nextOrder} Layer`,
      order: nextOrder,
    };
    onChange({
      ...architecture,
      groups: [...architecture.groups, newGroup],
    });
  };

  const handleSaveNode = (savedNode: ArchNode) => {
    const exists = architecture.nodes.some((n) => n.id === savedNode.id);
    const updatedNodes = exists
      ? architecture.nodes.map((n) => (n.id === savedNode.id ? savedNode : n))
      : [...architecture.nodes, savedNode];

    onChange({
      ...architecture,
      nodes: updatedNodes,
    });
  };

  const handleSaveEdge = (savedEdge: ArchEdge) => {
    const exists = architecture.edges.some((e) => e.id === savedEdge.id);
    const updatedEdges = exists
      ? architecture.edges.map((e) => (e.id === savedEdge.id ? savedEdge : e))
      : [...architecture.edges, savedEdge];

    onChange({
      ...architecture,
      edges: updatedEdges,
    });
  };

  return (
    <Box sx={{ width: '100%' }}>
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
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            System Architecture Diagram Canvas
          </Typography>
          <Chip
            label={`${architecture.groups.length} Tiers`}
            size="small"
            color="primary"
            variant="soft"
          />
          <Chip
            label={`${architecture.nodes.length} Nodes`}
            size="small"
            color="info"
            variant="soft"
          />
          <Chip
            label={`${architecture.edges.length} Edges`}
            size="small"
            color="secondary"
            variant="soft"
          />
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
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
            onClick={handleAddGroup}
          >
            + Tier
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Icon icon="solar:link-round-bold" />}
            onClick={handleOpenAddEdge}
          >
            + Edge
          </Button>

          <Button
            variant="contained"
            size="small"
            color="primary"
            startIcon={<Icon icon="solar:add-circle-bold" />}
            onClick={handleOpenAddNode}
          >
            + Node
          </Button>
        </Stack>
      </Card>

      {/* Canvas Container */}
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
              if (n.type === 'group') return theme.palette.grey[300];
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

      {/* Node / Edge Edit Modal Dialog */}
      <NodeEditDialog
        open={dialogOpen}
        editMode={editMode}
        nodeData={selectedNodeData}
        edgeData={selectedEdgeData}
        groups={architecture.groups}
        allNodes={architecture.nodes}
        onClose={() => setDialogOpen(false)}
        onSaveNode={handleSaveNode}
        onSaveEdge={handleSaveEdge}
      />
    </Box>
  );
}
