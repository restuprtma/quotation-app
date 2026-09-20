import type { Edge, Node } from '@xyflow/react';

import dagre from '@dagrejs/dagre';

// ----------------------------------------------------------------------
// Constants & Types
// ----------------------------------------------------------------------

export type LayoutDirection = 'LR' | 'TB';

const ARCH_NODE_WIDTH = 220;
const ARCH_NODE_HEIGHT = 80;
const ARCH_GROUP_PADDING = 30;

const SM_NODE_WIDTH = 200;
const SM_NODE_HEIGHT = 80;

const WF_NODE_WIDTH = 220;
const WF_NODE_HEIGHT = 80;
const WF_LANE_MIN_HEIGHT = 160;
const WF_LANE_MIN_WIDTH = 300;

// ----------------------------------------------------------------------
// 1. Architecture Dagre Layout
// ----------------------------------------------------------------------

export function layoutArchitectureNodes(
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = 'LR'
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph({ compound: true });
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 40,
    ranksep: 80,
    marginx: 40,
    marginy: 40,
  });

  const groupNodes = nodes.filter((n) => n.type === 'architectureGroup' || n.type === 'group');
  const regularNodes = nodes.filter((n) => n.type !== 'architectureGroup' && n.type !== 'group');

  groupNodes.forEach((group) => {
    dagreGraph.setNode(group.id, {
      label: group.data?.label || group.id,
      clusterNode: true,
    });
  });

  regularNodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: (node.measured?.width as number) || ARCH_NODE_WIDTH,
      height: (node.measured?.height as number) || ARCH_NODE_HEIGHT,
    });

    const parentId = node.parentId || (node.data?.group_id as string);
    if (parentId && groupNodes.some((g) => g.id === parentId)) {
      dagreGraph.setParent(node.id, parentId);
    }
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedRegularNodes = regularNodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = (node.measured?.width as number) || ARCH_NODE_WIDTH;
    const height = (node.measured?.height as number) || ARCH_NODE_HEIGHT;

    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition ? Math.round(nodeWithPosition.x - width / 2) : node.position.x,
        y: nodeWithPosition ? Math.round(nodeWithPosition.y - height / 2) : node.position.y,
      },
    } as Node;
  });

  const layoutedGroupNodes = groupNodes.map((group) => {
    const children = layoutedRegularNodes.filter(
      (n) => n.parentId === group.id || n.data?.group_id === group.id
    );

    if (children.length === 0) {
      const gPos = dagreGraph.node(group.id);
      return {
        ...group,
        position: {
          x: gPos ? Math.round(gPos.x - 150) : group.position.x || 0,
          y: gPos ? Math.round(gPos.y - 100) : group.position.y || 0,
        },
        style: {
          width: 300,
          height: 200,
          ...group.style,
        },
      } as Node;
    }

    const minX = Math.min(...children.map((c) => c.position.x)) - ARCH_GROUP_PADDING;
    const minY = Math.min(...children.map((c) => c.position.y)) - ARCH_GROUP_PADDING - 20;
    const maxX =
      Math.max(
        ...children.map((c) => c.position.x + ((c.measured?.width as number) || ARCH_NODE_WIDTH))
      ) + ARCH_GROUP_PADDING;
    const maxY =
      Math.max(
        ...children.map((c) => c.position.y + ((c.measured?.height as number) || ARCH_NODE_HEIGHT))
      ) + ARCH_GROUP_PADDING;

    return {
      ...group,
      position: { x: Math.round(minX), y: Math.round(minY) },
      style: {
        width: Math.max(Math.round(maxX - minX), 260),
        height: Math.max(Math.round(maxY - minY), 140),
        ...group.style,
      },
    } as Node;
  });

  return {
    nodes: [...layoutedGroupNodes, ...layoutedRegularNodes],
    edges,
  };
}

// ----------------------------------------------------------------------
// 2. State Machine Dagre Layout
// ----------------------------------------------------------------------

export function layoutStateMachineNodes(
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = 'LR'
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 110,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: (node.measured?.width as number) || SM_NODE_WIDTH,
      height: (node.measured?.height as number) || SM_NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = (node.measured?.width as number) || SM_NODE_WIDTH;
    const height = (node.measured?.height as number) || SM_NODE_HEIGHT;

    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition ? Math.round(nodeWithPosition.x - width / 2) : node.position.x,
        y: nodeWithPosition ? Math.round(nodeWithPosition.y - height / 2) : node.position.y,
      },
    } as Node;
  });

  return { nodes: layoutedNodes, edges };
}

// ----------------------------------------------------------------------
// 3. Workflow (Lane-Aware) Dagre Layout
// ----------------------------------------------------------------------

export function layoutWorkflowNodes(
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = 'LR'
): { nodes: Node[]; edges: Edge[] } {
  const laneNodes = nodes.filter((n) => n.type === 'workflowLane' || n.type === 'laneGroup');
  const stepNodes = nodes.filter((n) => n.type !== 'workflowLane' && n.type !== 'laneGroup');

  const isHorizontal = direction === 'LR';

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 50,
    ranksep: 90,
    marginx: 40,
    marginy: 40,
  });

  stepNodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: (node.measured?.width as number) || WF_NODE_WIDTH,
      height: (node.measured?.height as number) || WF_NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const sortedLanes = [...laneNodes].sort(
    (a, b) => (Number(a.data?.order) || 0) - (Number(b.data?.order) || 0)
  );

  const laneIndexMap = new Map<string, number>();
  sortedLanes.forEach((lane, idx) => {
    laneIndexMap.set(lane.id, idx);
  });

  const initialStepPositions = stepNodes.map((node) => {
    const dPos = dagreGraph.node(node.id);
    const width = (node.measured?.width as number) || WF_NODE_WIDTH;
    const height = (node.measured?.height as number) || WF_NODE_HEIGHT;

    const laneId = (node.data?.lane_id as string) || '';
    const laneIdx = laneIndexMap.get(laneId) ?? 0;

    let posX = dPos ? dPos.x - width / 2 : node.position.x;
    let posY = dPos ? dPos.y - height / 2 : node.position.y;

    if (isHorizontal) {
      posY = laneIdx * WF_LANE_MIN_HEIGHT + (WF_LANE_MIN_HEIGHT - height) / 2;
    } else {
      posX = laneIdx * WF_LANE_MIN_WIDTH + (WF_LANE_MIN_WIDTH - width) / 2;
    }

    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: Math.round(posX),
        y: Math.round(posY),
      },
    } as Node;
  });

  const allX = initialStepPositions.map((n) => n.position.x);
  const minX = allX.length > 0 ? Math.min(...allX) - 60 : 0;
  const maxX =
    allX.length > 0
      ? Math.max(...initialStepPositions.map((n) => n.position.x + WF_NODE_WIDTH)) + 60
      : 800;
  const totalSpanWidth = Math.max(maxX - minX, 800);

  const allY = initialStepPositions.map((n) => n.position.y);
  const minY = allY.length > 0 ? Math.min(...allY) - 60 : 0;
  const maxY =
    allY.length > 0
      ? Math.max(...initialStepPositions.map((n) => n.position.y + WF_NODE_HEIGHT)) + 60
      : 600;
  const totalSpanHeight = Math.max(maxY - minY, 600);

  const layoutedLaneNodes = sortedLanes.map((lane, idx) => {
    if (isHorizontal) {
      return {
        ...lane,
        position: {
          x: Math.round(minX),
          y: Math.round(idx * WF_LANE_MIN_HEIGHT),
        },
        style: {
          width: Math.round(totalSpanWidth),
          height: WF_LANE_MIN_HEIGHT,
          zIndex: -1,
          ...lane.style,
        },
      } as Node;
    }

    return {
      ...lane,
      position: {
        x: Math.round(idx * WF_LANE_MIN_WIDTH),
        y: Math.round(minY),
      },
      style: {
        width: WF_LANE_MIN_WIDTH,
        height: Math.round(totalSpanHeight),
        zIndex: -1,
        ...lane.style,
      },
    } as Node;
  });

  return {
    nodes: [...layoutedLaneNodes, ...initialStepPositions],
    edges,
  };
}
