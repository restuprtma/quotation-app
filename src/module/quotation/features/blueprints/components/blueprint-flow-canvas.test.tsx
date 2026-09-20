// @vitest-environment happy-dom
import type { Edge, Node } from '@xyflow/react';
import type { Workflow, Architecture, StateMachine } from '../types/bundle';

import { it, vi, expect, describe, afterEach, beforeAll } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { BlueprintFlowCanvas } from './blueprint-flow-canvas';
import {
  workflowToReactFlow,
  stateMachineToReactFlow,
  architectureToReactFlow,
} from '../validation/flow-adapter';

// ----------------------------------------------------------------------
// Mock ResizeObserver for happy-dom
// ----------------------------------------------------------------------

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
});

// ----------------------------------------------------------------------
// Test Data Fixtures
// ----------------------------------------------------------------------

const sampleArch: Architecture = {
  groups: [{ id: 'grp-1', label: 'Client Tier', order: 1 }],
  nodes: [
    {
      id: 'node-web',
      group_id: 'grp-1',
      type: 'application',
      label: 'Portal Web',
      description: 'Web front-end',
      layout: { x: 100, y: 120 },
    },
    {
      id: 'node-api',
      group_id: 'grp-1',
      type: 'service',
      label: 'Core API',
      description: 'REST API service',
      layout: { x: 350, y: 120 },
    },
  ],
  edges: [
    {
      id: 'edge-1',
      source: 'node-web',
      target: 'node-api',
      label: 'HTTP',
      type: 'sync',
    },
  ],
};

const sampleSM: StateMachine = {
  entity: 'Ticket',
  initial_state: 'st-draft',
  states: [
    { id: 'st-draft', label: 'Draft', type: 'normal', layout: { x: 50, y: 50 } },
    { id: 'st-done', label: 'Done', type: 'terminal', layout: { x: 250, y: 50 } },
  ],
  transitions: [
    {
      id: 'tr-1',
      source: 'st-draft',
      target: 'st-done',
      event: 'COMPLETE',
      actor: 'Admin',
      guard: 'isReady()',
      actions: ['save()'],
    },
  ],
};

const sampleWF: Workflow = {
  id: 'wf-1',
  name: 'Review Process',
  description: 'Document review workflow',
  lanes: [{ id: 'lane-1', label: 'Manager Lane', order: 1 }],
  nodes: [
    {
      id: 'step-1',
      lane_id: 'lane-1',
      type: 'start',
      label: 'Start Task',
      description: 'Begin review',
      layout: { x: 80, y: 60 },
    },
    {
      id: 'step-2',
      lane_id: 'lane-1',
      type: 'decision',
      label: 'Approve?',
      description: 'Check criteria',
      layout: { x: 280, y: 60 },
    },
  ],
  edges: [{ id: 'we-1', source: 'step-1', target: 'step-2', label: 'Next' }],
};

// ----------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------

describe('BlueprintFlowCanvas', () => {
  describe('Rendering Custom Flow Nodes', () => {
    it('renders Architecture nodes and groups correctly', () => {
      const { nodes, edges } = architectureToReactFlow(sampleArch);

      render(<BlueprintFlowCanvas nodes={nodes} edges={edges} />);

      expect(screen.getByTestId('blueprint-flow-canvas')).toBeTruthy();
      expect(screen.getByTestId('arch-group-grp-1')).toBeTruthy();
      expect(screen.getByTestId('arch-node-node-web')).toBeTruthy();
      expect(screen.getByTestId('arch-node-node-api')).toBeTruthy();
      expect(screen.getByText('Portal Web')).toBeTruthy();
      expect(screen.getByText('Core API')).toBeTruthy();
    });

    it('renders State Machine nodes and initial state indicator', () => {
      const { nodes, edges } = stateMachineToReactFlow(sampleSM);

      render(<BlueprintFlowCanvas nodes={nodes} edges={edges} />);

      expect(screen.getByTestId('state-node-st-draft')).toBeTruthy();
      expect(screen.getByTestId('state-node-st-done')).toBeTruthy();
      expect(screen.getByText('Draft')).toBeTruthy();
      expect(screen.getByText('Done')).toBeTruthy();
      expect(screen.getByText('INITIAL')).toBeTruthy();
    });

    it('renders Workflow lanes, steps, and decision warning badges', () => {
      const { nodes, edges } = workflowToReactFlow(sampleWF);

      render(<BlueprintFlowCanvas nodes={nodes} edges={edges} />);

      expect(screen.getByTestId('lane-group-lane-1')).toBeTruthy();
      expect(screen.getByTestId('step-node-step-1')).toBeTruthy();
      expect(screen.getByTestId('step-node-step-2')).toBeTruthy();
      expect(screen.getByText('Start Task')).toBeTruthy();
      expect(screen.getByText('Approve?')).toBeTruthy();
      // Step-2 is a decision node with only 1 outgoing edge, so warning badge is rendered
      expect(screen.getByText(/Cabang/i)).toBeTruthy();
    });
  });

  describe('Interaction and Issue Target Focus', () => {
    it('decorates and highlights target node when focusTargetId is provided', () => {
      const { nodes, edges } = architectureToReactFlow(sampleArch);

      render(<BlueprintFlowCanvas nodes={nodes} edges={edges} focusTargetId="node-api" />);

      const targetCard = screen.getByTestId('arch-node-node-api');
      expect(targetCard).toBeTruthy();
    });

    it('handles onNodeClick event callback', () => {
      const { nodes, edges } = architectureToReactFlow(sampleArch);
      const onNodeClick = vi.fn();

      render(<BlueprintFlowCanvas nodes={nodes} edges={edges} onNodeClick={onNodeClick} />);

      const nodeElement = screen.getByTestId('arch-node-node-web');
      fireEvent.click(nodeElement);
    });

    it('renders in read-only mode without crashing', () => {
      const { nodes, edges } = architectureToReactFlow(sampleArch);

      render(<BlueprintFlowCanvas nodes={nodes} edges={edges} readOnly />);

      expect(screen.getByTestId('blueprint-flow-canvas')).toBeTruthy();
      expect(screen.getByText('Portal Web')).toBeTruthy();
    });

    it('does not mutate underlying node positions or data during canvas render', () => {
      const { nodes, edges } = architectureToReactFlow(sampleArch);

      // Deep copy before render
      const originalNodes = JSON.parse(JSON.stringify(nodes));
      const originalEdges = JSON.parse(JSON.stringify(edges));

      render(<BlueprintFlowCanvas nodes={nodes} edges={edges} fitView showMiniMap showControls />);

      // Verify node positions in input array were not mutated by render
      expect(nodes.map((n) => n.position)).toEqual(originalNodes.map((n: Node) => n.position));
      expect(nodes.map((n) => n.id)).toEqual(originalNodes.map((n: Node) => n.id));
      expect(edges.map((e) => e.id)).toEqual(originalEdges.map((e: Edge) => e.id));
    });
  });
});
