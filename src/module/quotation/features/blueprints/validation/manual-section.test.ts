import { it, expect, describe } from 'vitest';

import queueBundle from '../testdata/queue-bundle.json';
import {
  wbsSectionSchema,
  checkReferencedItem,
  journeySectionSchema,
  buildReferenceOptions,
  workflowSectionSchema,
  architectureSectionSchema,
  stateMachineSectionSchema,
} from './manual-section';

describe('manual-section validation and reference helpers', () => {
  describe('Zod section schema validations with complex approved fixture', () => {
    it('validates queue bundle Journey section successfully', () => {
      const result = journeySectionSchema.safeParse({ journey: queueBundle.journey });
      expect(result.success).toBe(true);
    });

    it('rejects journey with unknown phase_id in activity', () => {
      const invalidJourney = {
        journey: {
          ...queueBundle.journey,
          activities: [
            {
              id: 'act-test-1',
              phase_id: 'phase-non-existent',
              actor_id: queueBundle.journey.actors[0].id,
              label: 'Test Activity',
              description: 'Desc',
              touchpoints: [],
              references: [],
            },
          ],
        },
      };
      const result = journeySectionSchema.safeParse(invalidJourney);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('phase-non-existent');
      }
    });

    it('validates queue bundle Architecture section successfully', () => {
      const result = architectureSectionSchema.safeParse({
        architecture: queueBundle.architecture,
      });
      expect(result.success).toBe(true);
    });

    it('rejects architecture with dangling node group_id or edge source', () => {
      const invalidArch = {
        architecture: {
          groups: queueBundle.architecture.groups,
          nodes: [
            {
              id: 'node-test',
              group_id: 'grp-missing',
              type: 'service',
              label: 'Test Node',
              description: '',
              layout: { x: 0, y: 0 },
            },
          ],
          edges: [
            {
              id: 'edge-test',
              source: 'node-test',
              target: 'node-non-existent',
              label: 'Edge',
              type: 'sync',
            },
          ],
        },
      };
      const result = architectureSectionSchema.safeParse(invalidArch);
      expect(result.success).toBe(false);
      if (!result.success) {
        const msgs = result.error.issues.map((i) => i.message);
        expect(msgs.some((m) => m.includes('grp-missing'))).toBe(true);
        expect(msgs.some((m) => m.includes('node-non-existent'))).toBe(true);
      }
    });

    it('validates queue bundle State Machine section successfully', () => {
      const result = stateMachineSectionSchema.safeParse({
        state_machine: queueBundle.state_machine,
      });
      expect(result.success).toBe(true);
    });

    it('rejects state machine with non-existent initial_state or transition state', () => {
      const invalidSM = {
        state_machine: {
          entity: 'Test Entity',
          initial_state: 'state-unknown',
          states: [{ id: 'state-1', label: 'State 1', type: 'normal', layout: { x: 0, y: 0 } }],
          transitions: [
            {
              id: 'trans-1',
              source: 'state-1',
              target: 'state-missing',
              event: 'Click',
              actor: 'User',
              guard: '',
              actions: [],
            },
          ],
        },
      };
      const result = stateMachineSectionSchema.safeParse(invalidSM);
      expect(result.success).toBe(false);
      if (!result.success) {
        const msgs = result.error.issues.map((i) => i.message);
        expect(msgs.some((m) => m.includes('state-unknown'))).toBe(true);
        expect(msgs.some((m) => m.includes('state-missing'))).toBe(true);
      }
    });

    it('validates queue bundle Workflows section successfully', () => {
      const result = workflowSectionSchema.safeParse({ workflows: queueBundle.workflows });
      expect(result.success).toBe(true);
    });

    it('validates queue bundle WBS and Cross References section successfully', () => {
      const result = wbsSectionSchema.safeParse({
        wbs: queueBundle.wbs,
        cross_references: queueBundle.cross_references,
      });
      expect(result.success).toBe(true);
    });

    it('rejects WBS with cyclic dependency or self dependency', () => {
      const cyclicWBS = {
        wbs: {
          modules: [
            {
              id: 'mod-a',
              name: 'Mod A',
              description: '',
              priority: 'high',
              dependencies: ['mod-b'],
              references: [],
              features: [],
            },
            {
              id: 'mod-b',
              name: 'Mod B',
              description: '',
              priority: 'medium',
              dependencies: ['mod-a'],
              references: [],
              features: [],
            },
          ],
        },
        cross_references: [],
      };
      const result = wbsSectionSchema.safeParse(cyclicWBS);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('cyclic dependency'))).toBe(true);
      }
    });
  });

  describe('buildReferenceOptions indexing', () => {
    it('builds canonical reference options across all sections from full bundle', () => {
      const options = buildReferenceOptions(queueBundle as any);
      expect(options.length).toBeGreaterThan(20);

      // Verify presence of canonical formats matching cross validator index
      const values = options.map((o) => o.value);
      expect(values).toContain('journey.phase.phase-pendaftaran-reservasi');
      expect(values).toContain('journey.actor.actor-pemohon-layanan');
      expect(values).toContain('journey.activity.act-buat-reservasi-online');
      expect(values).toContain('architecture.group.grp-client-tier');
      expect(values).toContain('architecture.node.node-web-portal');
      expect(values).toContain('architecture.edge.edge-web-to-gateway');
      expect(values).toContain('state.Tiket Antrean Layanan.state-booked');
      expect(values).toContain('workflow.wf-pendaftaran-reservasi-online');
      expect(values).toContain('workflow.wf-pendaftaran-reservasi-online.lane.lane-pemohon-web');
      expect(values).toContain(
        'workflow.wf-pendaftaran-reservasi-online.step.wnode-start-reservasi'
      );
      expect(values).toContain('wbs.module.mod-core-queue-engine');
      expect(values).toContain('cross_references.xref-wbs-to-arch-redis');
    });
  });

  describe('checkReferencedItem deletion guards', () => {
    it('blocks deleting journey phase when used in an activity', () => {
      const guard = checkReferencedItem('phase-pendaftaran-reservasi', 'phase', {
        journey: queueBundle.journey,
      });
      expect(guard.allowed).toBe(false);
      expect(guard.reason).toContain('masih digunakan oleh satu atau lebih Activity');
    });

    it('blocks deleting journey actor when used in an activity', () => {
      const guard = checkReferencedItem('actor-pemohon-layanan', 'actor', {
        journey: queueBundle.journey,
      });
      expect(guard.allowed).toBe(false);
      expect(guard.reason).toContain('masih digunakan oleh satu atau lebih Activity');
    });

    it('blocks deleting architecture group when containing nodes', () => {
      const guard = checkReferencedItem('grp-client-tier', 'group', {
        architecture: queueBundle.architecture,
      });
      expect(guard.allowed).toBe(false);
      expect(guard.reason).toContain('masih memiliki Node');
    });

    it('blocks deleting architecture node when connected to edges', () => {
      const guard = checkReferencedItem('node-web-portal', 'node', {
        architecture: queueBundle.architecture,
      });
      expect(guard.allowed).toBe(false);
      expect(guard.reason).toContain('terhubung dengan Edge');
    });

    it('blocks deleting state when initial_state or used in transitions', () => {
      const guardInitial = checkReferencedItem('state-booked', 'state', {
        state_machine: queueBundle.state_machine,
      });
      expect(guardInitial.allowed).toBe(false);
      expect(guardInitial.reason).toContain('Initial State');

      const guardTransition = checkReferencedItem('state-waiting', 'state', {
        state_machine: queueBundle.state_machine,
      });
      expect(guardTransition.allowed).toBe(false);
      expect(guardTransition.reason).toContain('Transition');
    });

    it('allows deleting unreferenced items', () => {
      const guard = checkReferencedItem('phase-unreferenced', 'phase', {
        journey: {
          phases: [{ id: 'phase-unreferenced' }],
          actors: [],
          activities: [],
        },
      });
      expect(guard.allowed).toBe(true);
    });
  });
});
