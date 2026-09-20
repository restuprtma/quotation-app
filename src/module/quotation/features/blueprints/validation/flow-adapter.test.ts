import type { Edge, Node } from '@xyflow/react';
import type { Workflow, Architecture, StateMachine } from '../types/bundle';

import { it, expect, describe } from 'vitest';

import {
  workflowToReactFlow,
  reactFlowToWorkflow,
  findTargetNodeOrEdge,
  stateMachineToReactFlow,
  reactFlowToArchitecture,
  architectureToReactFlow,
  reactFlowToStateMachine,
  applyWorkflowAutoLayout,
  applyArchitectureAutoLayout,
  applyStateMachineAutoLayout,
} from './flow-adapter';

// ----------------------------------------------------------------------
// Sample Fixtures
// ----------------------------------------------------------------------

const sampleArchitecture: Architecture = {
  groups: [
    { id: 'grp-client', label: 'Client Tier', order: 1 },
    { id: 'grp-backend', label: 'Backend Tier', order: 2 },
  ],
  nodes: [
    {
      id: 'node-web',
      group_id: 'grp-client',
      type: 'application',
      label: 'Web Portal',
      description: 'Customer facing portal',
      layout: { x: 100, y: 150 },
    },
    {
      id: 'node-api',
      group_id: 'grp-backend',
      type: 'service',
      label: 'API Gateway',
      description: 'Main REST API service',
      layout: { x: 400, y: 150 },
    },
    {
      id: 'node-db',
      group_id: 'grp-backend',
      type: 'database',
      label: 'PostgreSQL DB',
      description: 'Primary database cluster',
      layout: { x: 700, y: 200 },
    },
  ],
  edges: [
    {
      id: 'edge-web-api',
      source: 'node-web',
      target: 'node-api',
      label: 'HTTPS / JSON',
      type: 'sync',
    },
    {
      id: 'edge-api-db',
      source: 'node-api',
      target: 'node-db',
      label: 'SQL Query',
      type: 'data_flow',
    },
  ],
};

const sampleStateMachine: StateMachine = {
  entity: 'QuotationTicket',
  initial_state: 'state-draft',
  states: [
    {
      id: 'state-draft',
      label: 'Draft',
      type: 'normal',
      layout: { x: 50, y: 100 },
    },
    {
      id: 'state-submitted',
      label: 'Submitted',
      type: 'normal',
      layout: { x: 300, y: 100 },
    },
    {
      id: 'state-approved',
      label: 'Approved',
      type: 'terminal',
      layout: { x: 550, y: 100 },
    },
    {
      id: 'state-rejected',
      label: 'Rejected',
      type: 'exception',
      layout: { x: 300, y: 300 },
    },
  ],
  transitions: [
    {
      id: 'trans-submit',
      source: 'state-draft',
      target: 'state-submitted',
      event: 'SUBMIT',
      actor: 'Petugas',
      guard: 'isValid()',
      actions: ['notifyReviewer()'],
    },
    {
      id: 'trans-approve',
      source: 'state-submitted',
      target: 'state-approved',
      event: 'APPROVE',
      actor: 'Supervisor',
      guard: 'hasPermission()',
      actions: ['generateCertificate()'],
    },
    {
      id: 'trans-reject',
      source: 'state-submitted',
      target: 'state-rejected',
      event: 'REJECT',
      actor: 'Supervisor',
      guard: 'reasonProvided()',
      actions: ['notifyApplicant()'],
    },
  ],
};

const sampleWorkflow: Workflow = {
  id: 'wf-approval',
  name: 'Approval Workflow',
  description: 'Document review and approval process',
  lanes: [
    { id: 'lane-applicant', label: 'Applicant', order: 1 },
    { id: 'lane-officer', label: 'Officer', order: 2 },
    { id: 'lane-system', label: 'System Automation', order: 3 },
  ],
  nodes: [
    {
      id: 'step-start',
      lane_id: 'lane-applicant',
      type: 'start',
      label: 'Start Application',
      description: 'User starts the request',
      layout: { x: 50, y: 40 },
    },
    {
      id: 'step-review',
      lane_id: 'lane-officer',
      type: 'action',
      label: 'Review Documents',
      description: 'Officer validates uploaded files',
      layout: { x: 250, y: 160 },
    },
    {
      id: 'step-decision',
      lane_id: 'lane-officer',
      type: 'decision',
      label: 'Is Complete?',
      description: 'Check document completeness',
      layout: { x: 450, y: 160 },
    },
    {
      id: 'step-notify',
      lane_id: 'lane-system',
      type: 'system_action',
      label: 'Send Email',
      description: 'System dispatches confirmation email',
      layout: { x: 650, y: 280 },
    },
    {
      id: 'step-end',
      lane_id: 'lane-applicant',
      type: 'end',
      label: 'Completed',
      description: 'Process ends',
      layout: { x: 850, y: 40 },
    },
  ],
  edges: [
    { id: 'we-1', source: 'step-start', target: 'step-review', label: 'Submit' },
    { id: 'we-2', source: 'step-review', target: 'step-decision', label: 'Next' },
    { id: 'we-3', source: 'step-decision', target: 'step-notify', label: 'Yes' },
    { id: 'we-4', source: 'step-decision', target: 'step-start', label: 'No' },
    { id: 'we-5', source: 'step-notify', target: 'step-end', label: 'Done' },
  ],
};

// ----------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------

describe('Shared Flow Adapter (Blueprint ↔ React Flow Round-Trip)', () => {
  describe('1. Architecture Flow Adapter', () => {
    it('converts Architecture domain model to React Flow nodes and edges with stable IDs and coordinates', () => {
      const { nodes, edges } = architectureToReactFlow(sampleArchitecture);

      // Verify group nodes
      const groupNodes = nodes.filter((n) => n.type === 'architectureGroup');
      expect(groupNodes).toHaveLength(2);
      expect(groupNodes[0].id).toBe('grp-client');
      expect(groupNodes[0].data.label).toBe('Client Tier');
      expect(groupNodes[0].data.order).toBe(1);

      // Verify regular nodes
      const regularNodes = nodes.filter((n) => n.type === 'architectureTyped');
      expect(regularNodes).toHaveLength(3);
      expect(regularNodes[0].id).toBe('node-web');
      expect(regularNodes[0].parentId).toBe('grp-client');
      expect(regularNodes[0].position).toEqual({ x: 100, y: 150 });
      expect(regularNodes[0].data.type).toBe('application');
      expect(regularNodes[0].data.label).toBe('Web Portal');

      // Verify edges
      expect(edges).toHaveLength(2);
      expect(edges[0].id).toBe('edge-web-api');
      expect(edges[0].source).toBe('node-web');
      expect(edges[0].target).toBe('node-api');
      expect(edges[0].label).toBe('HTTPS / JSON');
    });

    it('performs round-trip conversion without data loss or ID mutation', () => {
      const { nodes, edges } = architectureToReactFlow(sampleArchitecture);
      const restoredArchitecture = reactFlowToArchitecture(nodes, edges);

      expect(restoredArchitecture.groups).toEqual(sampleArchitecture.groups);
      expect(restoredArchitecture.nodes).toEqual(sampleArchitecture.nodes);
      expect(restoredArchitecture.edges).toEqual(sampleArchitecture.edges);
    });

    it('strictly excludes React Flow internal and viewport properties from restored Architecture JSON', () => {
      const { nodes, edges } = architectureToReactFlow(sampleArchitecture);

      // Simulate React Flow mutating nodes during runtime (selection, dragging, measured bounds, etc.)
      const dirtyNodes: Node[] = nodes.map((n) => ({
        ...n,
        selected: true,
        dragging: false,
        resizing: false,
        measured: { width: 220, height: 80 },
        internals: { userHandles: [] },
        positionAbsolute: { x: 150, y: 200 },
      })) as Node[];

      const dirtyEdges: Edge[] = edges.map((e) => ({
        ...e,
        selected: true,
        animated: true,
      })) as Edge[];

      const restored = reactFlowToArchitecture(dirtyNodes, dirtyEdges);

      // Verify restored objects do NOT have React Flow internal fields leaked
      restored.nodes.forEach((node) => {
        expect((node as any).selected).toBeUndefined();
        expect((node as any).dragging).toBeUndefined();
        expect((node as any).measured).toBeUndefined();
        expect((node as any).internals).toBeUndefined();
        expect((node as any).positionAbsolute).toBeUndefined();
        expect((node as any).parentId).toBeUndefined();
        expect(node.layout).toBeDefined();
        expect(typeof node.layout.x).toBe('number');
        expect(typeof node.layout.y).toBe('number');
      });

      restored.edges.forEach((edge) => {
        expect((edge as any).selected).toBeUndefined();
        expect((edge as any).animated).toBeUndefined();
      });

      // Pure domain content equality
      expect(restored).toEqual(sampleArchitecture);
    });

    it('auto-layout updates layout coordinates only and preserves all IDs, types, groups, and edges', () => {
      const layouted = applyArchitectureAutoLayout(sampleArchitecture, 'LR');

      expect(layouted.groups).toEqual(sampleArchitecture.groups);
      expect(layouted.edges).toEqual(sampleArchitecture.edges);
      expect(layouted.nodes).toHaveLength(sampleArchitecture.nodes.length);

      // Verify IDs, groups, labels, descriptions, and types are identical
      layouted.nodes.forEach((node, index) => {
        const original = sampleArchitecture.nodes[index];
        expect(node.id).toBe(original.id);
        expect(node.group_id).toBe(original.group_id);
        expect(node.type).toBe(original.type);
        expect(node.label).toBe(original.label);
        expect(node.description).toBe(original.description);
        // Layout coordinates are finite numbers
        expect(Number.isFinite(node.layout.x)).toBe(true);
        expect(Number.isFinite(node.layout.y)).toBe(true);
      });
    });
  });

  describe('2. State Machine Flow Adapter', () => {
    it('converts State Machine domain model to React Flow with initial state indicator and transitions', () => {
      const { nodes, edges } = stateMachineToReactFlow(sampleStateMachine);

      expect(nodes).toHaveLength(4);
      const draftNode = nodes.find((n) => n.id === 'state-draft');
      expect(draftNode).toBeDefined();
      expect(draftNode?.data.isInitial).toBe(true);
      expect(draftNode?.data.type).toBe('normal');
      expect(draftNode?.position).toEqual({ x: 50, y: 100 });

      const approvedNode = nodes.find((n) => n.id === 'state-approved');
      expect(approvedNode?.data.isInitial).toBe(false);
      expect(approvedNode?.data.type).toBe('terminal');

      expect(edges).toHaveLength(3);
      expect(edges[0].id).toBe('trans-submit');
      expect(edges[0].source).toBe('state-draft');
      expect(edges[0].target).toBe('state-submitted');
      expect(edges[0].label).toBe('SUBMIT');
      expect(edges[0].data?.actor).toBe('Petugas');
      expect(edges[0].data?.guard).toBe('isValid()');
      expect(edges[0].data?.actions).toEqual(['notifyReviewer()']);
    });

    it('performs round-trip conversion without losing transitions, entity or initial_state', () => {
      const { nodes, edges } = stateMachineToReactFlow(sampleStateMachine);
      const restored = reactFlowToStateMachine(
        nodes,
        edges,
        sampleStateMachine.entity,
        sampleStateMachine.initial_state
      );

      expect(restored.entity).toBe(sampleStateMachine.entity);
      expect(restored.initial_state).toBe(sampleStateMachine.initial_state);
      expect(restored.states).toEqual(sampleStateMachine.states);
      expect(restored.transitions).toEqual(sampleStateMachine.transitions);
    });

    it('strictly excludes React Flow internal and viewport properties from restored StateMachine JSON', () => {
      const { nodes, edges } = stateMachineToReactFlow(sampleStateMachine);

      const dirtyNodes = nodes.map((n) => ({
        ...n,
        selected: true,
        measured: { width: 200, height: 76 },
        dragging: false,
      })) as Node[];

      const dirtyEdges = edges.map((e) => ({
        ...e,
        selected: true,
      })) as Edge[];

      const restored = reactFlowToStateMachine(
        dirtyNodes,
        dirtyEdges,
        sampleStateMachine.entity,
        sampleStateMachine.initial_state
      );

      restored.states.forEach((state) => {
        expect((state as any).selected).toBeUndefined();
        expect((state as any).measured).toBeUndefined();
        expect((state as any).isInitial).toBeUndefined();
        expect(state.layout).toBeDefined();
      });

      expect(restored).toEqual(sampleStateMachine);
    });

    it('auto-layout updates layout coordinates only and preserves entity, initial_state, and transition details', () => {
      const layouted = applyStateMachineAutoLayout(sampleStateMachine, 'LR');

      expect(layouted.entity).toBe(sampleStateMachine.entity);
      expect(layouted.initial_state).toBe(sampleStateMachine.initial_state);
      expect(layouted.transitions).toEqual(sampleStateMachine.transitions);
      expect(layouted.states).toHaveLength(sampleStateMachine.states.length);

      layouted.states.forEach((state, idx) => {
        const orig = sampleStateMachine.states[idx];
        expect(state.id).toBe(orig.id);
        expect(state.label).toBe(orig.label);
        expect(state.type).toBe(orig.type);
        expect(Number.isFinite(state.layout.x)).toBe(true);
        expect(Number.isFinite(state.layout.y)).toBe(true);
      });
    });
  });

  describe('3. Workflow Flow Adapter', () => {
    it('converts Workflow domain model to React Flow with lane groups, steps, and outgoing edge counts', () => {
      const { nodes, edges } = workflowToReactFlow(sampleWorkflow);

      const laneNodes = nodes.filter((n) => n.type === 'workflowLane');
      expect(laneNodes).toHaveLength(3);
      expect(laneNodes[0].id).toBe('lane-applicant');
      expect(laneNodes[0].data.label).toBe('Applicant');
      expect(laneNodes[0].data.order).toBe(1);

      const stepNodes = nodes.filter((n) => n.type === 'workflowStep');
      expect(stepNodes).toHaveLength(5);
      expect(stepNodes[0].id).toBe('step-start');
      expect(stepNodes[0].data.lane_id).toBe('lane-applicant');
      expect(stepNodes[0].data.type).toBe('start');
      expect(stepNodes[0].position).toEqual({ x: 50, y: 40 });

      // Decision node outgoing edge count
      const decisionNode = stepNodes.find((n) => n.id === 'step-decision');
      expect(decisionNode?.data.outgoingEdgesCount).toBe(2);

      expect(edges).toHaveLength(5);
      expect(edges[0].id).toBe('we-1');
      expect(edges[0].source).toBe('step-start');
      expect(edges[0].target).toBe('step-review');
      expect(edges[0].label).toBe('Submit');
    });

    it('performs round-trip conversion without losing lanes, steps, or edges', () => {
      const { nodes, edges } = workflowToReactFlow(sampleWorkflow);
      const restored = reactFlowToWorkflow(nodes, edges, {
        id: sampleWorkflow.id,
        name: sampleWorkflow.name,
        description: sampleWorkflow.description,
      });

      expect(restored.id).toBe(sampleWorkflow.id);
      expect(restored.name).toBe(sampleWorkflow.name);
      expect(restored.description).toBe(sampleWorkflow.description);
      expect(restored.lanes).toEqual(sampleWorkflow.lanes);
      expect(restored.nodes).toEqual(sampleWorkflow.nodes);
      expect(restored.edges).toEqual(sampleWorkflow.edges);
    });

    it('strictly excludes React Flow internal and viewport properties from restored Workflow JSON', () => {
      const { nodes, edges } = workflowToReactFlow(sampleWorkflow);

      const dirtyNodes = nodes.map((n) => ({
        ...n,
        selected: true,
        measured: { width: 220, height: 76 },
        dragging: false,
      })) as Node[];

      const dirtyEdges = edges.map((e) => ({
        ...e,
        selected: true,
      })) as Edge[];

      const restored = reactFlowToWorkflow(dirtyNodes, dirtyEdges, {
        id: sampleWorkflow.id,
        name: sampleWorkflow.name,
        description: sampleWorkflow.description,
      });

      restored.nodes.forEach((node) => {
        expect((node as any).selected).toBeUndefined();
        expect((node as any).measured).toBeUndefined();
        expect((node as any).outgoingEdgesCount).toBeUndefined();
        expect(node.layout).toBeDefined();
      });

      restored.lanes.forEach((lane) => {
        expect((lane as any).selected).toBeUndefined();
        expect((lane as any).style).toBeUndefined();
      });

      expect(restored).toEqual(sampleWorkflow);
    });

    it('auto-layout updates step and lane layout positions only, keeping lanes, steps, and edges intact', () => {
      const layouted = applyWorkflowAutoLayout(sampleWorkflow, 'LR');

      expect(layouted.id).toBe(sampleWorkflow.id);
      expect(layouted.name).toBe(sampleWorkflow.name);
      expect(layouted.description).toBe(sampleWorkflow.description);
      expect(layouted.lanes).toEqual(sampleWorkflow.lanes);
      expect(layouted.edges).toEqual(sampleWorkflow.edges);
      expect(layouted.nodes).toHaveLength(sampleWorkflow.nodes.length);

      layouted.nodes.forEach((step, idx) => {
        const orig = sampleWorkflow.nodes[idx];
        expect(step.id).toBe(orig.id);
        expect(step.lane_id).toBe(orig.lane_id);
        expect(step.type).toBe(orig.type);
        expect(step.label).toBe(orig.label);
        expect(step.description).toBe(orig.description);
        expect(Number.isFinite(step.layout.x)).toBe(true);
        expect(Number.isFinite(step.layout.y)).toBe(true);
      });
    });
  });

  describe('4. Issue Target Focusing Helper', () => {
    it('finds and selects the target node matching target_id', () => {
      const { nodes, edges } = architectureToReactFlow(sampleArchitecture);

      const result = findTargetNodeOrEdge('node-api', nodes, edges);
      expect(result.found).toBe(true);
      expect(result.type).toBe('node');
      expect(result.node?.id).toBe('node-api');
    });

    it('finds and selects the target edge matching target_id', () => {
      const { nodes, edges } = architectureToReactFlow(sampleArchitecture);

      const result = findTargetNodeOrEdge('edge-web-api', nodes, edges);
      expect(result.found).toBe(true);
      expect(result.type).toBe('edge');
      expect(result.edge?.id).toBe('edge-web-api');
    });

    it('returns found: false when target_id does not exist', () => {
      const { nodes, edges } = architectureToReactFlow(sampleArchitecture);

      const result = findTargetNodeOrEdge('unknown-id', nodes, edges);
      expect(result.found).toBe(false);
      expect(result.node).toBeUndefined();
      expect(result.edge).toBeUndefined();
    });
  });
});
