import type { Edge, Node } from '@xyflow/react';
import type { LayoutDirection } from '../utils/dagre-layout';
import type {
  State,
  Workflow,
  Transition,
  Architecture,
  StateMachine,
  WorkflowEdge,
  WorkflowLane,
  WorkflowNode,
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureGroup,
} from '../types/bundle';

import {
  layoutWorkflowNodes,
  layoutArchitectureNodes,
  layoutStateMachineNodes,
} from '../utils/dagre-layout';

// ----------------------------------------------------------------------
// 1. Architecture Flow Adapter
// ----------------------------------------------------------------------

export function architectureToReactFlow(architecture: Architecture): {
  nodes: Node[];
  edges: Edge[];
} {
  const groups = architecture.groups || [];
  const nodes = architecture.nodes || [];
  const edges = architecture.edges || [];

  // Group Nodes
  const groupNodes: Node[] = groups.map((grp) => ({
    id: grp.id,
    type: 'architectureGroup',
    data: {
      id: grp.id,
      label: grp.label,
      order: grp.order,
    },
    position: { x: 0, y: 0 },
    style: {
      width: 300,
      height: 200,
      zIndex: -1,
    },
  }));

  // Regular Typed Nodes
  const regularNodes: Node[] = nodes.map((n) => ({
    id: n.id,
    type: 'architectureTyped',
    parentId: n.group_id,
    data: {
      id: n.id,
      group_id: n.group_id,
      type: n.type,
      label: n.label,
      description: n.description,
    },
    position: {
      x: n.layout?.x ?? 0,
      y: n.layout?.y ?? 0,
    },
  }));

  // Architecture Edges
  const rfEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    type: 'smoothstep',
    data: {
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      type: e.type,
    },
  }));

  return {
    nodes: [...groupNodes, ...regularNodes],
    edges: rfEdges,
  };
}

export function reactFlowToArchitecture(nodes: Node[], edges: Edge[]): Architecture {
  const groupNodes = nodes.filter((n) => n.type === 'architectureGroup' || n.type === 'group');
  const regularNodes = nodes.filter(
    (n) => n.type === 'architectureTyped' || (n.type !== 'architectureGroup' && n.type !== 'group')
  );

  const groups: ArchitectureGroup[] = groupNodes.map((g) => ({
    id: g.id,
    label: (g.data?.label as string) || g.id,
    order: Number(g.data?.order) || 1,
  }));

  const archNodes: ArchitectureNode[] = regularNodes.map((n) => ({
    id: n.id,
    group_id: (n.parentId || n.data?.group_id || '') as string,
    type: (n.data?.type || 'service') as any,
    label: (n.data?.label || n.id) as string,
    description: (n.data?.description || '') as string,
    layout: {
      x: Math.round(n.position?.x ?? 0),
      y: Math.round(n.position?.y ?? 0),
    },
  }));

  const archEdges: ArchitectureEdge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: (e.label as string) || (e.data?.label as string) || '',
    type: (e.data?.type || 'sync') as any,
  }));

  return {
    groups,
    nodes: archNodes,
    edges: archEdges,
  };
}

export function applyArchitectureAutoLayout(
  architecture: Architecture,
  direction: LayoutDirection = 'LR'
): Architecture {
  const { nodes, edges } = architectureToReactFlow(architecture);
  const layouted = layoutArchitectureNodes(nodes, edges, direction);
  return reactFlowToArchitecture(layouted.nodes, layouted.edges);
}

// ----------------------------------------------------------------------
// 2. State Machine Flow Adapter
// ----------------------------------------------------------------------

export function stateMachineToReactFlow(stateMachine: StateMachine): {
  nodes: Node[];
  edges: Edge[];
} {
  const states = stateMachine.states || [];
  const transitions = stateMachine.transitions || [];

  const rfNodes: Node[] = states.map((s) => ({
    id: s.id,
    type: 'stateMachine',
    data: {
      id: s.id,
      label: s.label,
      type: s.type,
      isInitial: s.id === stateMachine.initial_state,
      entity: stateMachine.entity,
    },
    position: {
      x: s.layout?.x ?? 0,
      y: s.layout?.y ?? 0,
    },
  }));

  const rfEdges: Edge[] = transitions.map((t) => ({
    id: t.id,
    source: t.source,
    target: t.target,
    label: t.event || t.id,
    type: 'smoothstep',
    data: {
      id: t.id,
      source: t.source,
      target: t.target,
      event: t.event,
      actor: t.actor,
      guard: t.guard,
      actions: t.actions || [],
    },
  }));

  return {
    nodes: rfNodes,
    edges: rfEdges,
  };
}

export function reactFlowToStateMachine(
  nodes: Node[],
  edges: Edge[],
  entity: string = '',
  initial_state: string = ''
): StateMachine {
  const states: State[] = nodes
    .filter((n) => n.type === 'stateMachine' || !n.type)
    .map((n) => ({
      id: n.id,
      label: (n.data?.label as string) || n.id,
      type: (n.data?.type || 'normal') as any,
      layout: {
        x: Math.round(n.position?.x ?? 0),
        y: Math.round(n.position?.y ?? 0),
      },
    }));

  const transitions: Transition[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    event: (e.data?.event as string) || (e.label as string) || '',
    actor: (e.data?.actor as string) || '',
    guard: (e.data?.guard as string) || '',
    actions: Array.isArray(e.data?.actions) ? e.data.actions : [],
  }));

  return {
    entity: entity || (nodes[0]?.data?.entity as string) || '',
    initial_state:
      initial_state || (nodes.find((n) => n.data?.isInitial)?.id as string) || states[0]?.id || '',
    states,
    transitions,
  };
}

export function applyStateMachineAutoLayout(
  stateMachine: StateMachine,
  direction: LayoutDirection = 'LR'
): StateMachine {
  const { nodes, edges } = stateMachineToReactFlow(stateMachine);
  const layouted = layoutStateMachineNodes(nodes, edges, direction);
  return reactFlowToStateMachine(
    layouted.nodes,
    layouted.edges,
    stateMachine.entity,
    stateMachine.initial_state
  );
}

// ----------------------------------------------------------------------
// 3. Workflow Flow Adapter
// ----------------------------------------------------------------------

export function workflowToReactFlow(workflow: Workflow): {
  nodes: Node[];
  edges: Edge[];
} {
  const lanes = workflow.lanes || [];
  const nodes = workflow.nodes || [];
  const edges = workflow.edges || [];

  const laneNodes: Node[] = lanes.map((lane) => ({
    id: lane.id,
    type: 'workflowLane',
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

  const outgoingCountMap = new Map<string, number>();
  edges.forEach((edge) => {
    outgoingCountMap.set(edge.source, (outgoingCountMap.get(edge.source) || 0) + 1);
  });

  const stepNodes: Node[] = nodes.map((node) => {
    const parentLane = lanes.find((l) => l.id === node.lane_id);
    return {
      id: node.id,
      type: 'workflowStep',
      data: {
        id: node.id,
        lane_id: node.lane_id,
        type: node.type,
        label: node.label,
        description: node.description,
        lane_label: parentLane?.label,
        outgoingEdgesCount: outgoingCountMap.get(node.id) || 0,
      },
      position: {
        x: node.layout?.x ?? 0,
        y: node.layout?.y ?? 0,
      },
    };
  });

  const rfEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    type: 'smoothstep',
    data: {
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
    },
  }));

  return {
    nodes: [...laneNodes, ...stepNodes],
    edges: rfEdges,
  };
}

export function reactFlowToWorkflow(
  nodes: Node[],
  edges: Edge[],
  meta?: { id: string; name: string; description: string }
): Workflow {
  const laneNodes = nodes.filter((n) => n.type === 'workflowLane' || n.type === 'laneGroup');
  const stepNodes = nodes.filter(
    (n) => n.type === 'workflowStep' || (n.type !== 'workflowLane' && n.type !== 'laneGroup')
  );

  const lanes: WorkflowLane[] = laneNodes.map((l) => ({
    id: l.id,
    label: (l.data?.label as string) || l.id,
    order: Number(l.data?.order) || 1,
  }));

  const wfNodes: WorkflowNode[] = stepNodes.map((n) => ({
    id: n.id,
    lane_id: (n.data?.lane_id || '') as string,
    type: (n.data?.type || 'action') as any,
    label: (n.data?.label || n.id) as string,
    description: (n.data?.description || '') as string,
    layout: {
      x: Math.round(n.position?.x ?? 0),
      y: Math.round(n.position?.y ?? 0),
    },
  }));

  const wfEdges: WorkflowEdge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: (e.label as string) || (e.data?.label as string) || '',
  }));

  return {
    id: meta?.id || 'wf-default',
    name: meta?.name || 'Default Workflow',
    description: meta?.description || '',
    lanes,
    nodes: wfNodes,
    edges: wfEdges,
  };
}

export function applyWorkflowAutoLayout(
  workflow: Workflow,
  direction: LayoutDirection = 'LR'
): Workflow {
  const { nodes, edges } = workflowToReactFlow(workflow);
  const layouted = layoutWorkflowNodes(nodes, edges, direction);
  return reactFlowToWorkflow(layouted.nodes, layouted.edges, {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
  });
}

// ----------------------------------------------------------------------
// 4. Issue Target Focusing Helper
// ----------------------------------------------------------------------

export type FindTargetResult = {
  found: boolean;
  type?: 'node' | 'edge';
  node?: Node;
  edge?: Edge;
};

export function findTargetNodeOrEdge(
  targetId: string,
  nodes: Node[],
  edges: Edge[]
): FindTargetResult {
  if (!targetId) {
    return { found: false };
  }

  const matchingNode = nodes.find(
    (n) => n.id === targetId || n.data?.id === targetId || n.data?.label === targetId
  );
  if (matchingNode) {
    return { found: true, type: 'node', node: matchingNode };
  }

  const matchingEdge = edges.find(
    (e) =>
      e.id === targetId || e.data?.id === targetId || e.source === targetId || e.target === targetId
  );
  if (matchingEdge) {
    return { found: true, type: 'edge', edge: matchingEdge };
  }

  return { found: false };
}
