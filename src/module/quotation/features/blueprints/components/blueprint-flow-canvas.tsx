import '@xyflow/react/dist/style.css';

import type { Node, Edge, OnConnect, NodeTypes, OnEdgesChange, OnNodesChange } from '@xyflow/react';

import { useMemo, useEffect } from 'react';
import {
  MiniMap,
  Controls,
  ReactFlow,
  Background,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
} from '@xyflow/react';

import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';

import {
  WorkflowStepNode,
  StateMachineNode,
  WorkflowLaneGroup,
  ArchitectureGroupNode,
  ArchitectureTypedNode,
} from './flow-nodes';

// ----------------------------------------------------------------------

export type BlueprintFlowCanvasProps = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onEdgeClick?: (event: React.MouseEvent, edge: Edge) => void;
  onPaneClick?: (event: React.MouseEvent) => void;
  focusTargetId?: string | null;
  readOnly?: boolean;
  fitView?: boolean;
  height?: number | string;
  minHeight?: number | string;
  showMiniMap?: boolean;
  showControls?: boolean;
  showBackground?: boolean;
  children?: React.ReactNode;
};

// ----------------------------------------------------------------------
// Custom Node Types Map
// ----------------------------------------------------------------------

export const defaultBlueprintNodeTypes: NodeTypes = {
  architectureTyped: ArchitectureTypedNode as any,
  architectureGroup: ArchitectureGroupNode as any,
  group: ArchitectureGroupNode as any,
  stateMachine: StateMachineNode as any,
  workflowLane: WorkflowLaneGroup as any,
  laneGroup: WorkflowLaneGroup as any,
  workflowStep: WorkflowStepNode as any,
  stepNode: WorkflowStepNode as any,
};

// ----------------------------------------------------------------------
// Inner Canvas with React Flow Hook bindings
// ----------------------------------------------------------------------

function InnerBlueprintFlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  focusTargetId,
  readOnly = false,
  fitView = true,
  height = 600,
  minHeight = 400,
  showMiniMap = true,
  showControls = true,
  showBackground = true,
  children,
}: BlueprintFlowCanvasProps) {
  const theme = useTheme();
  const reactFlowInstance = useReactFlow();

  // Apply highlight to target node or edge if focusTargetId matches
  const decoratedNodes = useMemo(() => {
    if (!focusTargetId) return nodes;

    return nodes.map((node) => {
      const isTarget =
        node.id === focusTargetId ||
        node.data?.id === focusTargetId ||
        node.data?.label === focusTargetId;

      return {
        ...node,
        data: {
          ...node.data,
          highlighted: isTarget,
        },
        selected: isTarget ? true : node.selected,
      };
    });
  }, [nodes, focusTargetId]);

  const decoratedEdges = useMemo(() => {
    if (!focusTargetId) return edges;

    return edges.map((edge) => {
      const isTarget =
        edge.id === focusTargetId ||
        edge.data?.id === focusTargetId ||
        edge.source === focusTargetId ||
        edge.target === focusTargetId;

      return {
        ...edge,
        selected: isTarget ? true : edge.selected,
        style: isTarget
          ? {
              ...edge.style,
              stroke: theme.palette.error.main,
              strokeWidth: 3,
            }
          : edge.style,
      };
    });
  }, [edges, focusTargetId, theme]);

  // Center/Fit view on target node when focusTargetId changes
  useEffect(() => {
    if (!focusTargetId || !reactFlowInstance) return;

    const targetNode = nodes.find(
      (n) =>
        n.id === focusTargetId || n.data?.id === focusTargetId || n.data?.label === focusTargetId
    );

    if (
      targetNode &&
      Number.isFinite(targetNode.position.x) &&
      Number.isFinite(targetNode.position.y)
    ) {
      if (typeof reactFlowInstance.setCenter === 'function') {
        reactFlowInstance.setCenter(targetNode.position.x + 100, targetNode.position.y + 40, {
          zoom: 1.2,
          duration: 600,
        });
      }
    }
  }, [focusTargetId, nodes, reactFlowInstance]);

  const neutralBg =
    (theme.palette.background as any)?.neutral || theme.palette.grey?.[100] || '#f4f6f8';

  return (
    <Card
      data-testid="blueprint-flow-canvas"
      sx={{
        width: '100%',
        height,
        minHeight,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: neutralBg,
      }}
    >
      <ReactFlow
        nodes={decoratedNodes}
        edges={decoratedEdges}
        nodeTypes={defaultBlueprintNodeTypes}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        fitView={fitView}
        attributionPosition="bottom-right"
      >
        {showBackground && <Background variant={BackgroundVariant.Dots} gap={16} size={1} />}
        {showControls && <Controls position="top-right" />}
        {showMiniMap && (
          <MiniMap
            position="bottom-right"
            nodeColor={(n) => {
              if (
                n.type === 'architectureGroup' ||
                n.type === 'workflowLane' ||
                n.type === 'laneGroup' ||
                n.type === 'group'
              ) {
                return theme.palette.grey?.[300] || '#ccc';
              }
              if (n.data?.type === 'start') return theme.palette.success.main;
              if (n.data?.type === 'end' || n.data?.type === 'exception')
                return theme.palette.error.main;
              if (n.data?.type === 'terminal') return theme.palette.success.main;
              if (n.data?.type === 'decision' || n.data?.isInitial)
                return theme.palette.warning.main;
              return theme.palette.primary.main;
            }}
            style={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 8,
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
        )}
        {children}
      </ReactFlow>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Exported BlueprintFlowCanvas Wrapped in Provider
// ----------------------------------------------------------------------

export function BlueprintFlowCanvas(props: BlueprintFlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <InnerBlueprintFlowCanvas {...props} />
    </ReactFlowProvider>
  );
}
