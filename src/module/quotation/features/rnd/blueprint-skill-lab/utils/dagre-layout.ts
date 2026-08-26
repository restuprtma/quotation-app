import type { Edge, Node } from '@xyflow/react';

import dagre from '@dagrejs/dagre';

// ----------------------------------------------------------------------

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;
const GROUP_PADDING = 30;

export type LayoutDirection = 'LR' | 'TB';

export function getLayoutedElements(
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

  // Separate group nodes from child nodes
  const groupNodes = nodes.filter((n) => n.type === 'group');
  const regularNodes = nodes.filter((n) => n.type !== 'group');

  // Register groups in dagre
  groupNodes.forEach((group) => {
    dagreGraph.setNode(group.id, {
      label: group.data?.label || group.id,
      clusterNode: true,
    });
  });

  // Register regular nodes and their parent relationships
  regularNodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: (node.measured?.width as number) || NODE_WIDTH,
      height: (node.measured?.height as number) || NODE_HEIGHT,
    });

    if (node.parentId) {
      dagreGraph.setParent(node.id, node.parentId);
    }
  });

  // Register edges
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Execute Dagre layout calculation
  dagre.layout(dagreGraph);

  // Map positions back to regular nodes
  const layoutedRegularNodes = regularNodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = (node.measured?.width as number) || NODE_WIDTH;
    const height = (node.measured?.height as number) || NODE_HEIGHT;

    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    } as Node;
  });

  // Calculate bounding boxes for group nodes based on their children
  const layoutedGroupNodes = groupNodes.map((group) => {
    const children = layoutedRegularNodes.filter((n) => n.parentId === group.id);

    if (children.length === 0) {
      const gPos = dagreGraph.node(group.id);
      return {
        ...group,
        position: {
          x: gPos ? gPos.x - 150 : 0,
          y: gPos ? gPos.y - 100 : 0,
        },
        style: {
          width: 300,
          height: 200,
          ...group.style,
        },
      } as Node;
    }

    const minX = Math.min(...children.map((c) => c.position.x)) - GROUP_PADDING;
    const minY = Math.min(...children.map((c) => c.position.y)) - GROUP_PADDING - 20;
    const maxX =
      Math.max(
        ...children.map((c) => c.position.x + ((c.measured?.width as number) || NODE_WIDTH))
      ) + GROUP_PADDING;
    const maxY =
      Math.max(
        ...children.map((c) => c.position.y + ((c.measured?.height as number) || NODE_HEIGHT))
      ) + GROUP_PADDING;

    return {
      ...group,
      position: { x: minX, y: minY },
      style: {
        width: Math.max(maxX - minX, 260),
        height: Math.max(maxY - minY, 140),
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
// State Machine Layout
// ----------------------------------------------------------------------

export function layoutStateMachine(
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
      width: (node.measured?.width as number) || 200,
      height: (node.measured?.height as number) || 90,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = (node.measured?.width as number) || 200;
    const height = (node.measured?.height as number) || 90;

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
// Business Process Workflow (Lane-Aware) Layout
// ----------------------------------------------------------------------

const WORKFLOW_NODE_WIDTH = 220;
const WORKFLOW_NODE_HEIGHT = 80;
const LANE_MIN_HEIGHT = 160;
const LANE_MIN_WIDTH = 300;

export function layoutWorkflow(
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = 'LR'
): { nodes: Node[]; edges: Edge[] } {
  const laneNodes = nodes.filter((n) => n.type === 'laneGroup');
  const stepNodes = nodes.filter((n) => n.type !== 'laneGroup');

  const isHorizontal = direction === 'LR';

  // 1. Compute node ranks and X/Y order via Dagre on step nodes
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
      width: (node.measured?.width as number) || WORKFLOW_NODE_WIDTH,
      height: (node.measured?.height as number) || WORKFLOW_NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  // 2. Sort lanes by order
  const sortedLanes = [...laneNodes].sort(
    (a, b) => (Number(a.data?.order) || 0) - (Number(b.data?.order) || 0)
  );

  // Lane index mapping
  const laneIndexMap = new Map<string, number>();
  sortedLanes.forEach((lane, idx) => {
    laneIndexMap.set(lane.id, idx);
  });

  // Calculate Dagre X & Y
  const initialStepPositions = stepNodes.map((node) => {
    const dPos = dagreGraph.node(node.id);
    const width = (node.measured?.width as number) || WORKFLOW_NODE_WIDTH;
    const height = (node.measured?.height as number) || WORKFLOW_NODE_HEIGHT;

    const laneId = (node.data?.lane_id as string) || '';
    const laneIdx = laneIndexMap.get(laneId) ?? 0;

    let posX = dPos ? dPos.x - width / 2 : node.position.x;
    let posY = dPos ? dPos.y - height / 2 : node.position.y;

    if (isHorizontal) {
      // In horizontal layout, lane defines the Y band, Dagre defines X progression
      posY = laneIdx * LANE_MIN_HEIGHT + (LANE_MIN_HEIGHT - height) / 2;
    } else {
      // In vertical layout, lane defines the X band, Dagre defines Y progression
      posX = laneIdx * LANE_MIN_WIDTH + (LANE_MIN_WIDTH - width) / 2;
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

  // 3. Compute Lane Group bounding boxes to enclose all steps in each lane (and span full diagram)
  const allX = initialStepPositions.map((n) => n.position.x);
  const minX = allX.length > 0 ? Math.min(...allX) - 60 : 0;
  const maxX =
    allX.length > 0
      ? Math.max(...initialStepPositions.map((n) => n.position.x + WORKFLOW_NODE_WIDTH)) + 60
      : 800;
  const totalSpanWidth = Math.max(maxX - minX, 800);

  const allY = initialStepPositions.map((n) => n.position.y);
  const minY = allY.length > 0 ? Math.min(...allY) - 60 : 0;
  const maxY =
    allY.length > 0
      ? Math.max(...initialStepPositions.map((n) => n.position.y + WORKFLOW_NODE_HEIGHT)) + 60
      : 600;
  const totalSpanHeight = Math.max(maxY - minY, 600);

  const layoutedLaneNodes = sortedLanes.map((lane, idx) => {
    if (isHorizontal) {
      return {
        ...lane,
        position: {
          x: minX,
          y: idx * LANE_MIN_HEIGHT,
        },
        style: {
          width: totalSpanWidth,
          height: LANE_MIN_HEIGHT,
          zIndex: -1,
          ...lane.style,
        },
      } as Node;
    }

    return {
      ...lane,
      position: {
        x: idx * LANE_MIN_WIDTH,
        y: minY,
      },
      style: {
        width: LANE_MIN_WIDTH,
        height: totalSpanHeight,
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
