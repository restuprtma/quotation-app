import type { BundlePartial } from '../types/bundle';

import { z } from 'zod';

// Pattern Regexes
export const CANONICAL_REF_REGEX =
  /^(journey|architecture|state|state_machine|workflow|wbs|open_questions|cross_references)(\.[a-z0-9_-]+)+$/;
export const PHASE_ID_REGEX = /^phase-[a-z0-9-]+$/;
export const ACTOR_ID_REGEX = /^actor-[a-z0-9-]+$/;
export const ACTIVITY_ID_REGEX = /^act-[a-z0-9-]+$/;
export const GROUP_ID_REGEX = /^grp-[a-z0-9-]+$/;
export const NODE_ID_REGEX = /^node-[a-z0-9-]+$/;
export const EDGE_ID_REGEX = /^edge-[a-z0-9-]+$/;
export const STATE_ID_REGEX = /^state-[a-z0-9-]+$/;
export const TRANSITION_ID_REGEX = /^trans-[a-z0-9-]+$/;
export const WORKFLOW_ID_REGEX = /^wf-[a-z0-9-]+$/;
export const LANE_ID_REGEX = /^lane-[a-z0-9-]+$/;
export const WNODE_ID_REGEX = /^wnode-[a-z0-9-]+$/;
export const WEDGE_ID_REGEX = /^wedge-[a-z0-9-]+$/;
export const MODULE_ID_REGEX = /^mod-[a-z0-9-]+$/;
export const FEATURE_ID_REGEX = /^feat-[a-z0-9-]+$/;
export const XREF_ID_REGEX = /^xref-[a-z0-9-]+$/;

const nonEmptyString = z.string().trim().min(1, 'Field tidak boleh kosong');

export const layoutCoordinateSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// ==========================================
// 1. User Journey Schema
// ==========================================

export const journeyPhaseSchema = z.object({
  id: z.string().regex(PHASE_ID_REGEX, 'Format ID Phase tidak valid (harus diawali phase-)'),
  label: nonEmptyString,
  order: z.number().int().min(1, 'Order minimal 1'),
});

export const journeyActorSchema = z.object({
  id: z.string().regex(ACTOR_ID_REGEX, 'Format ID Actor tidak valid (harus diawali actor-)'),
  label: nonEmptyString,
  order: z.number().int().min(1, 'Order minimal 1'),
});

export const journeyActivitySchema = z.object({
  id: z.string().regex(ACTIVITY_ID_REGEX, 'Format ID Activity tidak valid (harus diawali act-)'),
  phase_id: z.string().regex(PHASE_ID_REGEX, 'Phase ID wajib dipilih'),
  actor_id: z.string().regex(ACTOR_ID_REGEX, 'Actor ID wajib dipilih'),
  label: nonEmptyString,
  description: z.string().default(''),
  touchpoints: z.array(z.string()).default([]),
  references: z
    .array(z.string().regex(CANONICAL_REF_REGEX, 'Format canonical reference tidak valid'))
    .default([]),
});

export const journeySectionSchema = z.object({
  journey: z
    .object({
      phases: z.array(journeyPhaseSchema),
      actors: z.array(journeyActorSchema),
      activities: z.array(journeyActivitySchema),
    })
    .superRefine((data, ctx) => {
      const phaseIds = new Set(data.phases.map((p) => p.id));
      const actorIds = new Set(data.actors.map((a) => a.id));

      data.activities.forEach((act, idx) => {
        if (!phaseIds.has(act.phase_id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Phase ID "${act.phase_id}" tidak ditemukan dalam daftar Phase`,
            path: ['activities', idx, 'phase_id'],
          });
        }
        if (!actorIds.has(act.actor_id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Actor ID "${act.actor_id}" tidak ditemukan dalam daftar Actor`,
            path: ['activities', idx, 'actor_id'],
          });
        }
      });
    }),
});

// ==========================================
// 2. Architecture Schema
// ==========================================

export const architectureGroupSchema = z.object({
  id: z.string().regex(GROUP_ID_REGEX, 'Format ID Group tidak valid (harus diawali grp-)'),
  label: nonEmptyString,
  order: z.number().int().min(1, 'Order minimal 1'),
});

export const architectureNodeSchema = z.object({
  id: z.string().regex(NODE_ID_REGEX, 'Format ID Node tidak valid (harus diawali node-)'),
  group_id: z.string().regex(GROUP_ID_REGEX, 'Group ID wajib dipilih'),
  type: z.enum([
    'channel',
    'application',
    'service',
    'database',
    'cache',
    'storage',
    'integration',
    'device',
  ] as const),
  label: nonEmptyString,
  description: z.string().default(''),
  layout: layoutCoordinateSchema.default({ x: 0, y: 0 }),
});

export const architectureEdgeSchema = z.object({
  id: z.string().regex(EDGE_ID_REGEX, 'Format ID Edge tidak valid (harus diawali edge-)'),
  source: z.string().regex(NODE_ID_REGEX, 'Source Node wajib dipilih'),
  target: z.string().regex(NODE_ID_REGEX, 'Target Node wajib dipilih'),
  label: z.string().default(''),
  type: z.enum(['sync', 'async', 'data_flow', 'event'] as const),
});

export const architectureSectionSchema = z.object({
  architecture: z
    .object({
      groups: z.array(architectureGroupSchema),
      nodes: z.array(architectureNodeSchema),
      edges: z.array(architectureEdgeSchema),
    })
    .superRefine((data, ctx) => {
      const groupIds = new Set(data.groups.map((g) => g.id));
      const nodeIds = new Set(data.nodes.map((n) => n.id));

      data.nodes.forEach((node, idx) => {
        if (!groupIds.has(node.group_id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Group ID "${node.group_id}" tidak ditemukan dalam daftar Groups`,
            path: ['nodes', idx, 'group_id'],
          });
        }
      });

      data.edges.forEach((edge, idx) => {
        if (!nodeIds.has(edge.source)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Source Node "${edge.source}" tidak ditemukan`,
            path: ['edges', idx, 'source'],
          });
        }
        if (!nodeIds.has(edge.target)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Target Node "${edge.target}" tidak ditemukan`,
            path: ['edges', idx, 'target'],
          });
        }
      });
    }),
});

// ==========================================
// 3. State Machine Schema
// ==========================================

export const stateSchema = z.object({
  id: z.string().regex(STATE_ID_REGEX, 'Format ID State tidak valid (harus diawali state-)'),
  label: nonEmptyString,
  type: z.enum(['normal', 'terminal', 'exception'] as const),
  layout: layoutCoordinateSchema.default({ x: 0, y: 0 }),
});

export const transitionSchema = z.object({
  id: z
    .string()
    .regex(TRANSITION_ID_REGEX, 'Format ID Transition tidak valid (harus diawali trans-)'),
  source: z.string().regex(STATE_ID_REGEX, 'Source State wajib dipilih'),
  target: z.string().regex(STATE_ID_REGEX, 'Target State wajib dipilih'),
  event: nonEmptyString,
  actor: nonEmptyString,
  guard: z.string().default(''),
  actions: z.array(z.string()).default([]),
});

export const stateMachineSectionSchema = z.object({
  state_machine: z
    .object({
      entity: nonEmptyString,
      initial_state: z.string().regex(STATE_ID_REGEX, 'Initial State wajib dipilih'),
      states: z.array(stateSchema),
      transitions: z.array(transitionSchema),
    })
    .superRefine((data, ctx) => {
      const stateIds = new Set(data.states.map((s) => s.id));

      if (data.initial_state && !stateIds.has(data.initial_state)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Initial State "${data.initial_state}" tidak ditemukan dalam daftar States`,
          path: ['initial_state'],
        });
      }

      data.transitions.forEach((trans, idx) => {
        if (!stateIds.has(trans.source)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Source State "${trans.source}" tidak ditemukan`,
            path: ['transitions', idx, 'source'],
          });
        }
        if (!stateIds.has(trans.target)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Target State "${trans.target}" tidak ditemukan`,
            path: ['transitions', idx, 'target'],
          });
        }
      });
    }),
});

// ==========================================
// 4. Workflow Schema
// ==========================================

export const workflowLaneSchema = z.object({
  id: z.string().regex(LANE_ID_REGEX, 'Format ID Lane tidak valid (harus diawali lane-)'),
  label: nonEmptyString,
  order: z.number().int().min(1, 'Order minimal 1'),
});

export const workflowNodeSchema = z.object({
  id: z.string().regex(WNODE_ID_REGEX, 'Format ID Node tidak valid (harus diawali wnode-)'),
  lane_id: z.string().regex(LANE_ID_REGEX, 'Lane ID wajib dipilih'),
  type: z.enum(['start', 'action', 'system_action', 'decision', 'wait', 'end'] as const),
  label: nonEmptyString,
  description: z.string().default(''),
  layout: layoutCoordinateSchema.default({ x: 0, y: 0 }),
});

export const workflowEdgeSchema = z.object({
  id: z.string().regex(WEDGE_ID_REGEX, 'Format ID Edge tidak valid (harus diawali wedge-)'),
  source: z.string().regex(WNODE_ID_REGEX, 'Source Node wajib dipilih'),
  target: z.string().regex(WNODE_ID_REGEX, 'Target Node wajib dipilih'),
  label: z.string().default(''),
});

export const workflowItemSchema = z
  .object({
    id: z.string().regex(WORKFLOW_ID_REGEX, 'Format ID Workflow tidak valid (harus diawali wf-)'),
    name: nonEmptyString,
    description: z.string().default(''),
    lanes: z.array(workflowLaneSchema),
    nodes: z.array(workflowNodeSchema),
    edges: z.array(workflowEdgeSchema),
  })
  .superRefine((wf, ctx) => {
    const laneIds = new Set(wf.lanes.map((l) => l.id));
    const nodeIds = new Set(wf.nodes.map((n) => n.id));

    wf.nodes.forEach((node, idx) => {
      if (!laneIds.has(node.lane_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Lane ID "${node.lane_id}" tidak ditemukan dalam workflow "${wf.name}"`,
          path: ['nodes', idx, 'lane_id'],
        });
      }
    });

    wf.edges.forEach((edge, idx) => {
      if (!nodeIds.has(edge.source)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Source Node "${edge.source}" tidak ditemukan`,
          path: ['edges', idx, 'source'],
        });
      }
      if (!nodeIds.has(edge.target)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Target Node "${edge.target}" tidak ditemukan`,
          path: ['edges', idx, 'target'],
        });
      }
    });
  });

export const workflowSectionSchema = z.object({
  workflows: z.array(workflowItemSchema),
});

// ==========================================
// 5. WBS Schema
// ==========================================

export const wbsFeatureSchema = z.object({
  id: z.string().regex(FEATURE_ID_REGEX, 'Format ID Feature tidak valid (harus diawali feat-)'),
  name: nonEmptyString,
  description: z.string().default(''),
  acceptance_criteria: z.array(z.string()).default([]),
});

export const wbsModuleSchema = z.object({
  id: z.string().regex(MODULE_ID_REGEX, 'Format ID Module tidak valid (harus diawali mod-)'),
  name: nonEmptyString,
  description: z.string().default(''),
  priority: z.enum(['high', 'medium', 'low'] as const),
  dependencies: z
    .array(z.string().regex(MODULE_ID_REGEX, 'Dependency ID harus diawali mod-'))
    .default([]),
  references: z
    .array(z.string().regex(CANONICAL_REF_REGEX, 'Format canonical reference tidak valid'))
    .default([]),
  features: z.array(wbsFeatureSchema),
});

export const crossReferenceSchema = z.object({
  id: z
    .string()
    .regex(XREF_ID_REGEX, 'Format ID Cross Reference tidak valid (harus diawali xref-)'),
  source_ref: z.string().regex(CANONICAL_REF_REGEX, 'Source Ref format tidak valid'),
  target_ref: z.string().regex(CANONICAL_REF_REGEX, 'Target Ref format tidak valid'),
  relation_type: z.enum([
    'implements',
    'transitions_on',
    'interacts_with',
    'deploys_to',
    'depends_on',
  ] as const),
  description: z.string().default(''),
});

export const wbsSectionSchema = z.object({
  wbs: z
    .object({
      modules: z.array(wbsModuleSchema),
    })
    .superRefine((data, ctx) => {
      const modIds = new Set(data.modules.map((m) => m.id));

      data.modules.forEach((mod, idx) => {
        // Self-dependency
        if (mod.dependencies.includes(mod.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Module "${mod.name}" tidak boleh bergantung pada dirinya sendiri`,
            path: ['modules', idx, 'dependencies'],
          });
        }

        // Non-existing dependency
        mod.dependencies.forEach((dep) => {
          if (!modIds.has(dep)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Dependency Module "${dep}" tidak ditemukan dalam daftar Module`,
              path: ['modules', idx, 'dependencies'],
            });
          }
        });
      });

      // Cycle detection in module dependencies
      const visited = new Set<string>();
      const recStack = new Set<string>();

      const hasCycle = (modId: string): boolean => {
        visited.add(modId);
        recStack.add(modId);

        const targetMod = data.modules.find((m) => m.id === modId);
        if (targetMod) {
          for (const dep of targetMod.dependencies) {
            if (!visited.has(dep) && hasCycle(dep)) {
              return true;
            }
            if (recStack.has(dep)) {
              return true;
            }
          }
        }

        recStack.delete(modId);
        return false;
      };

      for (const mod of data.modules) {
        if (!visited.has(mod.id)) {
          if (hasCycle(mod.id)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Ditemukan cyclic dependency pada Module WBS: ${mod.name}`,
              path: ['modules'],
            });
            break;
          }
        }
      }
    }),
  cross_references: z.array(crossReferenceSchema),
});

// ==========================================
// Canonical Reference Index & Helper
// ==========================================

export type ReferenceOption = {
  value: string;
  label: string;
  section:
    | 'journey'
    | 'architecture'
    | 'state_machine'
    | 'workflow'
    | 'wbs'
    | 'open_questions'
    | 'cross_references';
  id: string;
};

export function buildReferenceOptions(
  bundle?: BundlePartial | null,
  draft?: Partial<BundlePartial> | null
): ReferenceOption[] {
  const merged: BundlePartial = {
    ...bundle,
    ...draft,
    journey: draft?.journey ?? bundle?.journey,
    architecture: draft?.architecture ?? bundle?.architecture,
    state_machine: draft?.state_machine ?? bundle?.state_machine,
    workflows: draft?.workflows ?? bundle?.workflows,
    wbs: draft?.wbs ?? bundle?.wbs,
    cross_references: draft?.cross_references ?? bundle?.cross_references,
    open_questions: draft?.open_questions ?? bundle?.open_questions,
  };

  const options: ReferenceOption[] = [];

  // 1. Journey
  if (merged.journey) {
    (merged.journey.phases || []).forEach((p) => {
      if (p.id) {
        options.push({
          value: `journey.phase.${p.id}`,
          label: `[Journey Phase] ${p.label || p.id} (${p.id})`,
          section: 'journey',
          id: p.id,
        });
      }
    });
    (merged.journey.actors || []).forEach((a) => {
      if (a.id) {
        options.push({
          value: `journey.actor.${a.id}`,
          label: `[Journey Actor] ${a.label || a.id} (${a.id})`,
          section: 'journey',
          id: a.id,
        });
      }
    });
    (merged.journey.activities || []).forEach((act) => {
      if (act.id) {
        options.push({
          value: `journey.activity.${act.id}`,
          label: `[Journey Activity] ${act.label || act.id} (${act.id})`,
          section: 'journey',
          id: act.id,
        });
      }
    });
  }

  // 2. Architecture
  if (merged.architecture) {
    (merged.architecture.groups || []).forEach((g) => {
      if (g.id) {
        options.push({
          value: `architecture.group.${g.id}`,
          label: `[Architecture Group] ${g.label || g.id} (${g.id})`,
          section: 'architecture',
          id: g.id,
        });
      }
    });
    (merged.architecture.nodes || []).forEach((n) => {
      if (n.id) {
        options.push({
          value: `architecture.node.${n.id}`,
          label: `[Architecture Node] ${n.label || n.id} (${n.id})`,
          section: 'architecture',
          id: n.id,
        });
      }
    });
    (merged.architecture.edges || []).forEach((e) => {
      if (e.id) {
        options.push({
          value: `architecture.edge.${e.id}`,
          label: `[Architecture Edge] ${e.label || e.id} (${e.id})`,
          section: 'architecture',
          id: e.id,
        });
      }
    });
  }

  // 3. State Machine
  if (merged.state_machine) {
    const entity = (merged.state_machine.entity || '').trim();
    (merged.state_machine.states || []).forEach((s) => {
      if (s.id) {
        const value = entity ? `state.${entity}.${s.id}` : `state.${s.id}`;
        options.push({
          value,
          label: `[State] ${s.label || s.id} (${s.id})`,
          section: 'state_machine',
          id: s.id,
        });
      }
    });
    (merged.state_machine.transitions || []).forEach((t) => {
      if (t.id) {
        const value = entity ? `state.${entity}.transition.${t.id}` : `state.transition.${t.id}`;
        options.push({
          value,
          label: `[Transition] ${t.event || t.id} (${t.id})`,
          section: 'state_machine',
          id: t.id,
        });
      }
    });
  }

  // 4. Workflows
  if (merged.workflows) {
    merged.workflows.forEach((wf) => {
      if (wf.id) {
        options.push({
          value: `workflow.${wf.id}`,
          label: `[Workflow] ${wf.name || wf.id} (${wf.id})`,
          section: 'workflow',
          id: wf.id,
        });

        (wf.lanes || []).forEach((l) => {
          if (l.id) {
            options.push({
              value: `workflow.${wf.id}.lane.${l.id}`,
              label: `[Workflow Lane] ${wf.name}: ${l.label || l.id} (${l.id})`,
              section: 'workflow',
              id: l.id,
            });
          }
        });

        (wf.nodes || []).forEach((n) => {
          if (n.id) {
            options.push({
              value: `workflow.${wf.id}.step.${n.id}`,
              label: `[Workflow Step] ${wf.name}: ${n.label || n.id} (${n.id})`,
              section: 'workflow',
              id: n.id,
            });
          }
        });

        (wf.edges || []).forEach((e) => {
          if (e.id) {
            options.push({
              value: `workflow.${wf.id}.edge.${e.id}`,
              label: `[Workflow Edge] ${wf.name}: ${e.label || e.id} (${e.id})`,
              section: 'workflow',
              id: e.id,
            });
          }
        });
      }
    });
  }

  // 5. WBS
  if (merged.wbs) {
    (merged.wbs.modules || []).forEach((m) => {
      if (m.id) {
        options.push({
          value: `wbs.module.${m.id}`,
          label: `[WBS Module] ${m.name || m.id} (${m.id})`,
          section: 'wbs',
          id: m.id,
        });

        (m.features || []).forEach((f) => {
          if (f.id) {
            options.push({
              value: `wbs.module.${m.id}.feature.${f.id}`,
              label: `[WBS Feature] ${m.name}: ${f.name || f.id} (${f.id})`,
              section: 'wbs',
              id: f.id,
            });
          }
        });
      }
    });
  }

  // 6. Open Questions
  if (merged.open_questions) {
    merged.open_questions.forEach((oq) => {
      if (oq.id) {
        options.push({
          value: `open_questions.${oq.id}`,
          label: `[Open Question] ${oq.question} (${oq.id})`,
          section: 'open_questions',
          id: oq.id,
        });
      }
    });
  }

  // 7. Cross References
  if (merged.cross_references) {
    merged.cross_references.forEach((xr) => {
      if (xr.id) {
        options.push({
          value: `cross_references.${xr.id}`,
          label: `[Cross Ref] ${xr.relation_type}: ${xr.source_ref} -> ${xr.target_ref} (${xr.id})`,
          section: 'cross_references',
          id: xr.id,
        });
      }
    });
  }

  return options;
}

export type DeletionGuardResult = {
  allowed: boolean;
  reason?: string;
};

export function checkReferencedItem(
  elementId: string,
  elementType: 'phase' | 'actor' | 'group' | 'node' | 'state' | 'lane' | 'wnode' | 'module',
  currentContent: any,
  bundleContext?: BundlePartial | null
): DeletionGuardResult {
  if (!elementId) return { allowed: true };

  // 1. Journey Phase
  if (elementType === 'phase') {
    const activities = currentContent?.journey?.activities || currentContent?.activities || [];
    const usedInActivity = activities.some((act: any) => act.phase_id === elementId);
    if (usedInActivity) {
      return {
        allowed: false,
        reason: `Phase "${elementId}" tidak dapat dihapus karena masih digunakan oleh satu atau lebih Activity.`,
      };
    }
  }

  // 2. Journey Actor
  if (elementType === 'actor') {
    const activities = currentContent?.journey?.activities || currentContent?.activities || [];
    const usedInActivity = activities.some((act: any) => act.actor_id === elementId);
    if (usedInActivity) {
      return {
        allowed: false,
        reason: `Actor "${elementId}" tidak dapat dihapus karena masih digunakan oleh satu atau lebih Activity.`,
      };
    }
  }

  // 3. Architecture Group
  if (elementType === 'group') {
    const nodes = currentContent?.architecture?.nodes || currentContent?.nodes || [];
    const usedInNode = nodes.some((n: any) => n.group_id === elementId);
    if (usedInNode) {
      return {
        allowed: false,
        reason: `Group "${elementId}" tidak dapat dihapus karena masih memiliki Node di dalamnya.`,
      };
    }
  }

  // 4. Architecture Node
  if (elementType === 'node') {
    const edges = currentContent?.architecture?.edges || currentContent?.edges || [];
    const usedInEdge = edges.some((e: any) => e.source === elementId || e.target === elementId);
    if (usedInEdge) {
      return {
        allowed: false,
        reason: `Node "${elementId}" tidak dapat dihapus karena terhubung dengan Edge arsitektur.`,
      };
    }
  }

  // 5. State Machine State
  if (elementType === 'state') {
    const initialState =
      currentContent?.state_machine?.initial_state || currentContent?.initial_state;
    if (initialState === elementId) {
      return {
        allowed: false,
        reason: `State "${elementId}" adalah Initial State dan tidak dapat dihapus.`,
      };
    }
    const transitions =
      currentContent?.state_machine?.transitions || currentContent?.transitions || [];
    const usedInTrans = transitions.some(
      (t: any) => t.source === elementId || t.target === elementId
    );
    if (usedInTrans) {
      return {
        allowed: false,
        reason: `State "${elementId}" tidak dapat dihapus karena digunakan dalam Transition.`,
      };
    }
  }

  // 6. Workflow Lane
  if (elementType === 'lane') {
    const nodes = currentContent?.nodes || [];
    const usedInNode = nodes.some((n: any) => n.lane_id === elementId);
    if (usedInNode) {
      return {
        allowed: false,
        reason: `Lane "${elementId}" tidak dapat dihapus karena masih berisi Node.`,
      };
    }
  }

  // 7. Workflow Node
  if (elementType === 'wnode') {
    const edges = currentContent?.edges || [];
    const usedInEdge = edges.some((e: any) => e.source === elementId || e.target === elementId);
    if (usedInEdge) {
      return {
        allowed: false,
        reason: `Node "${elementId}" tidak dapat dihapus karena terhubung dengan Edge workflow.`,
      };
    }
  }

  // 8. WBS Module
  if (elementType === 'module') {
    const modules = currentContent?.wbs?.modules || currentContent?.modules || [];
    const usedAsDep = modules.some((m: any) => (m.dependencies || []).includes(elementId));
    if (usedAsDep) {
      return {
        allowed: false,
        reason: `Module "${elementId}" tidak dapat dihapus karena menjadi dependency bagi module lain.`,
      };
    }
  }

  // Also check if any CrossReference points to this element's canonical ref
  const crossRefs = bundleContext?.cross_references || [];
  for (const xr of crossRefs) {
    if (xr.source_ref.endsWith(`.${elementId}`) || xr.target_ref.endsWith(`.${elementId}`)) {
      return {
        allowed: false,
        reason: `Elemen "${elementId}" sedang dirujuk oleh Cross Reference (${xr.id}).`,
      };
    }
  }

  return { allowed: true };
}
