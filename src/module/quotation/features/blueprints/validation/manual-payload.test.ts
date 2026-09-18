import { it, expect, describe } from 'vitest';

import queueBundle from '../testdata/queue-bundle.json';
import { toManualPayload, fromManualPayload, newBlueprintItemId } from './manual-payload';

describe('manual transport envelopes and conversions', () => {
  it('keeps workflows plural and clones local draft', () => {
    const draft = { workflows: [] };
    const payload = toManualPayload('workflow', draft);
    expect(payload).toEqual({ workflows: [] });
    expect(payload).not.toBe(draft);
    expect(payload.workflows).not.toBe(draft.workflows);
    expect(fromManualPayload('workflow', payload)).toEqual(draft);
  });

  it('keeps WBS and cross references in the same content envelope', () => {
    const payload = toManualPayload('wbs', {
      wbs: { modules: [] },
      cross_references: [],
    });
    expect(Object.keys(payload).sort()).toEqual(['cross_references', 'wbs']);
    expect(payload).not.toHaveProperty('workflow');
  });

  it('generates unique IDs with proper schema prefixes', () => {
    const phaseId = newBlueprintItemId('phase');
    const actorId = newBlueprintItemId('actor');
    const actId = newBlueprintItemId('act');
    const grpId = newBlueprintItemId('grp');
    const nodeId = newBlueprintItemId('node');
    const edgeId = newBlueprintItemId('edge');
    const stateId = newBlueprintItemId('state');
    const transId = newBlueprintItemId('trans');
    const wfId = newBlueprintItemId('wf');
    const laneId = newBlueprintItemId('lane');
    const wnodeId = newBlueprintItemId('wnode');
    const wedgeId = newBlueprintItemId('wedge');
    const modId = newBlueprintItemId('mod');
    const featId = newBlueprintItemId('feat');
    const xrefId = newBlueprintItemId('xref');

    expect(phaseId).toMatch(/^phase-[0-9a-f-]+$/);
    expect(actorId).toMatch(/^actor-[0-9a-f-]+$/);
    expect(actId).toMatch(/^act-[0-9a-f-]+$/);
    expect(grpId).toMatch(/^grp-[0-9a-f-]+$/);
    expect(nodeId).toMatch(/^node-[0-9a-f-]+$/);
    expect(edgeId).toMatch(/^edge-[0-9a-f-]+$/);
    expect(stateId).toMatch(/^state-[0-9a-f-]+$/);
    expect(transId).toMatch(/^trans-[0-9a-f-]+$/);
    expect(wfId).toMatch(/^wf-[0-9a-f-]+$/);
    expect(laneId).toMatch(/^lane-[0-9a-f-]+$/);
    expect(wnodeId).toMatch(/^wnode-[0-9a-f-]+$/);
    expect(wedgeId).toMatch(/^wedge-[0-9a-f-]+$/);
    expect(modId).toMatch(/^mod-[0-9a-f-]+$/);
    expect(featId).toMatch(/^feat-[0-9a-f-]+$/);
    expect(xrefId).toMatch(/^xref-[0-9a-f-]+$/);
  });

  describe('parameterized round-trip tests using approved complex fixture', () => {
    it('round-trips Journey fixture perfectly preserving IDs and order', () => {
      const draft = { journey: queueBundle.journey };
      const payload = toManualPayload('journey', draft as any);
      expect(payload).toEqual(draft);
      expect(payload).not.toBe(draft);
      expect(fromManualPayload('journey', payload)).toEqual(draft);
      expect(payload.journey.phases.length).toBe(queueBundle.journey.phases.length);
      expect(payload.journey.activities[0].id).toBe(queueBundle.journey.activities[0].id);
    });

    it('round-trips Architecture fixture preserving layout and node types', () => {
      const draft = { architecture: queueBundle.architecture };
      const payload = toManualPayload('architecture', draft as any);
      expect(payload).toEqual(draft);
      expect(payload).not.toBe(draft);
      expect(fromManualPayload('architecture', payload)).toEqual(draft);
      expect(payload.architecture.nodes[0].layout).toEqual(
        queueBundle.architecture.nodes[0].layout
      );
    });

    it('round-trips State Machine fixture preserving initial_state and transitions', () => {
      const draft = { state_machine: queueBundle.state_machine };
      const payload = toManualPayload('state_machine', draft as any);
      expect(payload).toEqual(draft);
      expect(payload).not.toBe(draft);
      expect(fromManualPayload('state_machine', payload)).toEqual(draft);
      expect(payload.state_machine.initial_state).toBe(queueBundle.state_machine.initial_state);
    });

    it('round-trips Workflows plural fixture preserving nested lanes, nodes, and edges', () => {
      const draft = { workflows: queueBundle.workflows };
      const payload = toManualPayload('workflow', draft as any);
      expect(payload).toEqual(draft);
      expect(payload).not.toBe(draft);
      expect(fromManualPayload('workflow', payload)).toEqual(draft);
      expect(payload.workflows.length).toBe(queueBundle.workflows.length);
      expect(payload.workflows[0].nodes[0].layout).toEqual(
        queueBundle.workflows[0].nodes[0].layout
      );
    });

    it('round-trips WBS and Cross References fixture preserving features and relations', () => {
      const draft = {
        wbs: queueBundle.wbs,
        cross_references: queueBundle.cross_references,
      };
      const payload = toManualPayload('wbs', draft as any);
      expect(payload).toEqual(draft);
      expect(payload).not.toBe(draft);
      expect(fromManualPayload('wbs', payload)).toEqual(draft);
      expect(payload.wbs.modules.length).toBe(queueBundle.wbs.modules.length);
      expect(payload.cross_references.length).toBe(queueBundle.cross_references.length);
    });
  });
});
