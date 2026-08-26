import type { BlueprintBundle } from '../types';

import { detectWBSCycles } from './wbs-cycle-detector';

// ----------------------------------------------------------------------

export type ValidationSeverity = 'blocking' | 'warning';

export type ValidationSection =
  | 'journey'
  | 'architecture'
  | 'state_machine'
  | 'workflow'
  | 'wbs'
  | 'cross_section';

export type ValidationIssue = {
  id: string;
  code: string;
  severity: ValidationSeverity;
  section: ValidationSection;
  title: string;
  message: string;
  affectedEntityIds?: string[];
  suggestion?: string;
};

export type SectionLifecycleStatus = 'completed' | 'partial' | 'empty';

export type SectionStatus = {
  key: 'journey' | 'architecture' | 'state_machine' | 'workflows' | 'wbs';
  name: string;
  lifecycleStatus: SectionLifecycleStatus;
  entityCount: number;
  blockingCount: number;
  warningCount: number;
  tabIndex: number;
};

export type PublicationReadiness = {
  status: 'full_ready' | 'partial_ready' | 'blocked';
  label: string;
  description: string;
  color: 'success' | 'info' | 'error';
};

export type ValidationReport = {
  issues: ValidationIssue[];
  blockingCount: number;
  warningCount: number;
  sectionStatuses: SectionStatus[];
  readiness: PublicationReadiness;
};

// ----------------------------------------------------------------------

function resolveCanonicalId(ref: string): string {
  if (ref.includes('.')) {
    const parts = ref.split('.');
    return parts[parts.length - 1];
  }
  return ref;
}

export function validateBlueprintBundle(bundle: BlueprintBundle): ValidationReport {
  const issues: ValidationIssue[] = [];

  // 1. Gather all entity IDs for cross-checking & duplicate detection
  const journeyPhaseIds = new Set(bundle.journey.phases.map((p) => p.id));
  const journeyActorIds = new Set(bundle.journey.actors.map((a) => a.id));
  const journeyActivityIds = new Set(bundle.journey.activities.map((a) => a.id));

  const archGroupIds = new Set(bundle.architecture.groups.map((g) => g.id));
  const archNodeIds = new Set(bundle.architecture.nodes.map((n) => n.id));
  const archEdgeIds = new Set(bundle.architecture.edges.map((e) => e.id));

  const stateIds = new Set(bundle.state_machine.states.map((s) => s.id));
  const transitionIds = new Set(bundle.state_machine.transitions.map((t) => t.id));

  const workflowProcessIds = new Set(bundle.workflows.map((w) => w.id));
  const workflowLaneIds = new Set(bundle.workflows.flatMap((w) => w.lanes.map((l) => l.id)));
  const workflowNodeIds = new Set(bundle.workflows.flatMap((w) => w.nodes.map((n) => n.id)));
  const workflowEdgeIds = new Set(bundle.workflows.flatMap((w) => w.edges.map((e) => e.id)));

  const wbsModuleIds = new Set(bundle.wbs.modules.map((m) => m.id));
  const wbsFeatureIds = new Set(bundle.wbs.modules.flatMap((m) => m.features.map((f) => f.id)));

  const allKnownIds = new Set([
    ...journeyPhaseIds,
    ...journeyActorIds,
    ...journeyActivityIds,
    ...archGroupIds,
    ...archNodeIds,
    ...archEdgeIds,
    ...stateIds,
    ...transitionIds,
    ...workflowProcessIds,
    ...workflowLaneIds,
    ...workflowNodeIds,
    ...workflowEdgeIds,
    ...wbsModuleIds,
    ...wbsFeatureIds,
  ]);

  // Check Duplicate IDs per collection
  const checkDuplicateIds = (
    items: { id: string }[],
    section: ValidationSection,
    entityName: string
  ) => {
    const seen = new Set<string>();
    items.forEach((item) => {
      if (item.id) {
        if (seen.has(item.id)) {
          issues.push({
            id: `dup-${item.id}-${Math.random().toString(36).substring(2, 6)}`,
            code: 'ERR_DUPLICATE_ID',
            severity: 'blocking',
            section,
            title: `ID Duplikat pada ${entityName}`,
            message: `ID '${item.id}' digunakan lebih dari satu kali dalam ${entityName}.`,
            affectedEntityIds: [item.id],
            suggestion: 'Gunakan ID yang unik untuk setiap elemen.',
          });
        }
        seen.add(item.id);
      }
    });
  };

  checkDuplicateIds(bundle.journey.phases, 'journey', 'Fase Journey');
  checkDuplicateIds(bundle.journey.actors, 'journey', 'Aktor Journey');
  checkDuplicateIds(bundle.journey.activities, 'journey', 'Aktivitas Journey');
  checkDuplicateIds(bundle.architecture.groups, 'architecture', 'Group Arsitektur');
  checkDuplicateIds(bundle.architecture.nodes, 'architecture', 'Node Arsitektur');
  checkDuplicateIds(bundle.architecture.edges, 'architecture', 'Edge Arsitektur');
  checkDuplicateIds(bundle.state_machine.states, 'state_machine', 'State Node');
  checkDuplicateIds(bundle.state_machine.transitions, 'state_machine', 'State Transition');
  bundle.workflows.forEach((wf) => {
    checkDuplicateIds(wf.lanes, 'workflow', `Lane Workflow (${wf.name})`);
    checkDuplicateIds(wf.nodes, 'workflow', `Node Workflow (${wf.name})`);
    checkDuplicateIds(wf.edges, 'workflow', `Edge Workflow (${wf.name})`);
  });
  checkDuplicateIds(bundle.wbs.modules, 'wbs', 'Modul WBS');
  checkDuplicateIds(
    bundle.wbs.modules.flatMap((m) => m.features),
    'wbs',
    'Fitur WBS'
  );

  // 2. Journey Section Validation
  bundle.journey.activities.forEach((act) => {
    if (act.phase_id && !journeyPhaseIds.has(act.phase_id)) {
      issues.push({
        id: `dang-act-phase-${act.id}`,
        code: 'ERR_DANGLING_REFERENCE',
        severity: 'blocking',
        section: 'journey',
        title: 'Referensi Fase Tidak Ditemukan',
        message: `Aktivitas '${act.label}' merujuk ke phase_id '${act.phase_id}' yang tidak terdaftar.`,
        affectedEntityIds: [act.id, act.phase_id],
        suggestion: 'Pilih fase yang valid dari daftar fase journey.',
      });
    }
    if (act.actor_id && !journeyActorIds.has(act.actor_id)) {
      issues.push({
        id: `dang-act-actor-${act.id}`,
        code: 'ERR_DANGLING_REFERENCE',
        severity: 'blocking',
        section: 'journey',
        title: 'Referensi Aktor Tidak Ditemukan',
        message: `Aktivitas '${act.label}' merujuk ke actor_id '${act.actor_id}' yang tidak terdaftar.`,
        affectedEntityIds: [act.id, act.actor_id],
        suggestion: 'Pilih aktor yang valid dari daftar aktor journey.',
      });
    }

    // Semantic warning: activity without any technical reference
    if (!act.references || act.references.length === 0) {
      issues.push({
        id: `warn-act-no-ref-${act.id}`,
        code: 'WARN_JOURNEY_NO_WORKFLOW_OR_ARCH',
        severity: 'warning',
        section: 'journey',
        title: 'Aktivitas Tanpa Referensi Teknis',
        message: `Aktivitas '${act.label}' belum terhubung ke node arsitektur, state, atau WBS modul.`,
        affectedEntityIds: [act.id],
        suggestion: 'Tambahkan referensi ke modul arsitektur atau state terkait.',
      });
    }
  });

  // 3. Architecture Section Validation
  bundle.architecture.nodes.forEach((node) => {
    if (node.group_id && !archGroupIds.has(node.group_id)) {
      issues.push({
        id: `dang-node-group-${node.id}`,
        code: 'ERR_DANGLING_REFERENCE',
        severity: 'blocking',
        section: 'architecture',
        title: 'Group Arsitektur Tidak Ditemukan',
        message: `Node '${node.label}' berada pada group_id '${node.group_id}' yang tidak terdaftar.`,
        affectedEntityIds: [node.id, node.group_id],
        suggestion: 'Pindahkan node ke group arsitektur yang valid.',
      });
    }
  });

  bundle.architecture.edges.forEach((edge) => {
    if (!archNodeIds.has(edge.source) || !archNodeIds.has(edge.target)) {
      issues.push({
        id: `dang-arch-edge-${edge.id}`,
        code: 'ERR_DANGLING_REFERENCE',
        severity: 'blocking',
        section: 'architecture',
        title: 'Koneksi Arsitektur Terputus (Dangling Edge)',
        message: `Edge '${edge.label || edge.id}' merujuk ke source '${edge.source}' atau target '${edge.target}' yang tidak ada.`,
        affectedEntityIds: [edge.id, edge.source, edge.target],
        suggestion: 'Pastikan source dan target node terdaftar dalam arsitektur.',
      });
    }
  });

  // 4. State Machine Validation
  if (
    bundle.state_machine.states.length > 0 &&
    bundle.state_machine.initial_state &&
    !stateIds.has(bundle.state_machine.initial_state)
  ) {
    issues.push({
      id: `err-sm-initial-${bundle.state_machine.initial_state}`,
      code: 'ERR_INITIAL_STATE_NOT_FOUND',
      severity: 'blocking',
      section: 'state_machine',
      title: 'Initial State Tidak Valid',
      message: `Initial state '${bundle.state_machine.initial_state}' tidak ditemukan pada daftar state node.`,
      affectedEntityIds: [bundle.state_machine.initial_state],
      suggestion: 'Set initial_state ke salah satu id state yang valid.',
    });
  }

  bundle.state_machine.transitions.forEach((trans) => {
    if (!stateIds.has(trans.source) || !stateIds.has(trans.target)) {
      issues.push({
        id: `dang-trans-${trans.id}`,
        code: 'ERR_DANGLING_REFERENCE',
        severity: 'blocking',
        section: 'state_machine',
        title: 'Transisi State Tidak Valid',
        message: `Transisi '${trans.event || trans.id}' merujuk source '${trans.source}' atau target '${trans.target}' yang tidak ada.`,
        affectedEntityIds: [trans.id, trans.source, trans.target],
        suggestion: 'Periksa source dan target state dari transisi ini.',
      });
    }
  });

  // 5. Workflows Validation
  bundle.workflows.forEach((wf) => {
    const processLaneIds = new Set(wf.lanes.map((l) => l.id));
    const processNodeIds = new Set(wf.nodes.map((n) => n.id));

    wf.nodes.forEach((node) => {
      if (node.lane_id && !processLaneIds.has(node.lane_id)) {
        issues.push({
          id: `dang-wf-node-lane-${node.id}`,
          code: 'ERR_DANGLING_REFERENCE',
          severity: 'blocking',
          section: 'workflow',
          title: 'Lane Workflow Tidak Ditemukan',
          message: `Node '${node.label}' pada workflow '${wf.name}' merujuk lane_id '${node.lane_id}' yang tidak terdaftar.`,
          affectedEntityIds: [node.id, node.lane_id],
          suggestion: 'Pilih lane yang valid untuk node workflow ini.',
        });
      }

      // Check Decision Node out-degree >= 2
      if (node.type === 'decision') {
        const outEdges = wf.edges.filter((e) => e.source === node.id);
        if (outEdges.length < 2) {
          issues.push({
            id: `err-wf-decision-deg-${node.id}`,
            code: 'ERR_DECISION_OUT_DEGREE',
            severity: 'blocking',
            section: 'workflow',
            title: 'Decision Node Kurang Percabangan',
            message: `Decision node '${node.label}' pada workflow '${wf.name}' hanya memiliki ${outEdges.length} jalur keluar (minimal 2 cabang: Ya/Tidak).`,
            affectedEntityIds: [node.id],
            suggestion: 'Tambahkan minimal 2 koneksi keluar dari decision node ini.',
          });
        }
      }
    });

    wf.edges.forEach((edge) => {
      if (!processNodeIds.has(edge.source) || !processNodeIds.has(edge.target)) {
        issues.push({
          id: `dang-wf-edge-${edge.id}`,
          code: 'ERR_DANGLING_REFERENCE',
          severity: 'blocking',
          section: 'workflow',
          title: 'Koneksi Workflow Terputus',
          message: `Edge '${edge.label || edge.id}' pada workflow '${wf.name}' merujuk source '${edge.source}' atau target '${edge.target}' yang tidak ada.`,
          affectedEntityIds: [edge.id, edge.source, edge.target],
          suggestion: 'Hubungkan edge ke node workflow yang valid.',
        });
      }
    });
  });

  // 6. WBS Validation & Cycle Detection
  const cycleResult = detectWBSCycles(bundle.wbs.modules);
  if (cycleResult.hasCycle) {
    issues.push({
      id: 'err-wbs-cycle',
      code: 'ERR_WBS_DEPENDENCY_CYCLE',
      severity: 'blocking',
      section: 'wbs',
      title: 'Siklus Dependensi WBS Terdeteksi (Cycle)',
      message:
        cycleResult.message ||
        `Terdapat siklus dependensi antar modul: ${cycleResult.cycleModules.join(', ')}.`,
      affectedEntityIds: cycleResult.cycleModules,
      suggestion: 'Ubah dependensi agar membentuk Directed Acyclic Graph (DAG) tanpa loop.',
    });
  }

  bundle.wbs.modules.forEach((mod) => {
    mod.dependencies.forEach((depId) => {
      if (!wbsModuleIds.has(depId)) {
        issues.push({
          id: `dang-wbs-dep-${mod.id}-${depId}`,
          code: 'ERR_DANGLING_REFERENCE',
          severity: 'blocking',
          section: 'wbs',
          title: 'Dependensi Modul WBS Tidak Ditemukan',
          message: `Modul '${mod.name}' bergantung pada modul '${depId}' yang tidak terdaftar di WBS.`,
          affectedEntityIds: [mod.id, depId],
          suggestion: 'Hapus atau perbaiki id modul dependensi.',
        });
      }
    });
  });

  // 7. Canonical References & Cross References Checking
  const allCanonicalRefs: string[] = [
    ...bundle.journey.activities.flatMap((a) => a.references || []),
    ...bundle.wbs.modules.flatMap((m) => m.references || []),
  ];

  allCanonicalRefs.forEach((ref) => {
    const rawId = resolveCanonicalId(ref);
    if (!allKnownIds.has(rawId)) {
      issues.push({
        id: `dang-canon-ref-${ref}`,
        code: 'ERR_DANGLING_REFERENCE',
        severity: 'blocking',
        section: 'cross_section',
        title: 'Referensi Silang Kanonikal Tidak Ditemukan',
        message: `Referensi '${ref}' merujuk entitas '${rawId}' yang tidak terdaftar pada seksi manapun.`,
        affectedEntityIds: [ref],
        suggestion: 'Periksa kembali ejaan referensi atau tambahkan entitas terkait.',
      });
    }
  });

  bundle.cross_references.forEach((xref) => {
    const sourceId = resolveCanonicalId(xref.source_ref);
    const targetId = resolveCanonicalId(xref.target_ref);

    if (!allKnownIds.has(sourceId) || !allKnownIds.has(targetId)) {
      issues.push({
        id: `dang-xref-${xref.id}`,
        code: 'ERR_DANGLING_REFERENCE',
        severity: 'blocking',
        section: 'cross_section',
        title: 'Cross Reference Tidak Valid',
        message: `Cross reference '${xref.description || xref.id}' (${xref.source_ref} -> ${xref.target_ref}) merujuk entitas yang tidak ada.`,
        affectedEntityIds: [xref.id, xref.source_ref, xref.target_ref],
        suggestion: 'Pastikan source_ref dan target_ref menunjuk ke entitas yang valid.',
      });
    }
  });

  // 8. Architecture Node Coverage Warning (WARN_ARCH_NODE_NO_WBS_REF)
  const referencedArchNodes = new Set<string>();
  allCanonicalRefs.forEach((ref) => {
    if (ref.includes('architecture.node.')) {
      referencedArchNodes.add(resolveCanonicalId(ref));
    }
  });
  bundle.cross_references.forEach((xref) => {
    if (xref.source_ref.includes('architecture.node.')) {
      referencedArchNodes.add(resolveCanonicalId(xref.source_ref));
    }
    if (xref.target_ref.includes('architecture.node.')) {
      referencedArchNodes.add(resolveCanonicalId(xref.target_ref));
    }
  });

  bundle.architecture.nodes.forEach((node) => {
    if (
      (node.type === 'application' || node.type === 'service') &&
      !referencedArchNodes.has(node.id)
    ) {
      issues.push({
        id: `warn-arch-no-wbs-${node.id}`,
        code: 'WARN_ARCH_NODE_NO_WBS_REF',
        severity: 'warning',
        section: 'architecture',
        title: 'Node Layanan Tanpa Referensi WBS / Xref',
        message: `Node arsitektur '${node.label}' (${node.type}) belum terhubung ke modul WBS atau journey activity manapun.`,
        affectedEntityIds: [node.id],
        suggestion: 'Tambahkan referensi implementasi pada modul WBS atau aktivitas user journey.',
      });
    }
  });

  // 9. Open Questions Unresolved Warning
  const openQuestionsCount = bundle.open_questions.filter((q) => q.status === 'open').length;
  if (openQuestionsCount > 0) {
    issues.push({
      id: 'warn-open-questions',
      code: 'WARN_OPEN_QUESTIONS_UNRESOLVED',
      severity: 'warning',
      section: 'cross_section',
      title: `${openQuestionsCount} Pertanyaan Terbuka Belum Terjawab`,
      message: `Terdapat ${openQuestionsCount} Open Questions berstatus 'open' yang membutuhkan klarifikasi atau keputusan stakeholder.`,
      affectedEntityIds: bundle.open_questions.filter((q) => q.status === 'open').map((q) => q.id),
      suggestion: 'Klarifikasi dan ubah status pertanyaan menjadi answered atau deferred.',
    });
  }

  // 10. Empty Section Warnings & Status Calculation
  const journeyCount =
    bundle.journey.phases.length + bundle.journey.actors.length + bundle.journey.activities.length;
  const archCount =
    bundle.architecture.groups.length +
    bundle.architecture.nodes.length +
    bundle.architecture.edges.length;
  const smCount = bundle.state_machine.states.length + bundle.state_machine.transitions.length;
  const wfCount =
    bundle.workflows.length +
    bundle.workflows.flatMap((w) => w.nodes).length +
    bundle.workflows.flatMap((w) => w.edges).length;
  const wbsCount = bundle.wbs.modules.length + bundle.wbs.modules.flatMap((m) => m.features).length;

  const countIssues = (sec: ValidationSection) => {
    const secIssues = issues.filter((i) => i.section === sec);
    return {
      blocking: secIssues.filter((i) => i.severity === 'blocking').length,
      warning: secIssues.filter((i) => i.severity === 'warning').length,
    };
  };

  const getLifecycle = (count: number, blocking: number): SectionLifecycleStatus => {
    if (count === 0) return 'empty';
    if (blocking > 0) return 'partial';
    return 'completed';
  };

  const journeyIssues = countIssues('journey');
  const archIssues = countIssues('architecture');
  const smIssues = countIssues('state_machine');
  const wfIssues = countIssues('workflow');
  const wbsIssues = countIssues('wbs');

  const sectionStatuses: SectionStatus[] = [
    {
      key: 'journey',
      name: 'User Journey & Blueprint',
      lifecycleStatus: getLifecycle(journeyCount, journeyIssues.blocking),
      entityCount: journeyCount,
      blockingCount: journeyIssues.blocking,
      warningCount: journeyIssues.warning,
      tabIndex: 0,
    },
    {
      key: 'architecture',
      name: 'System Architecture',
      lifecycleStatus: getLifecycle(archCount, archIssues.blocking),
      entityCount: archCount,
      blockingCount: archIssues.blocking,
      warningCount: archIssues.warning,
      tabIndex: 1,
    },
    {
      key: 'state_machine',
      name: 'State Machine',
      lifecycleStatus: getLifecycle(smCount, smIssues.blocking),
      entityCount: smCount,
      blockingCount: smIssues.blocking,
      warningCount: smIssues.warning,
      tabIndex: 2,
    },
    {
      key: 'workflows',
      name: 'Business Workflows',
      lifecycleStatus: getLifecycle(wfCount, wfIssues.blocking),
      entityCount: wfCount,
      blockingCount: wfIssues.blocking,
      warningCount: wfIssues.warning,
      tabIndex: 3,
    },
    {
      key: 'wbs',
      name: 'WBS Hierarchy',
      lifecycleStatus: getLifecycle(wbsCount, wbsIssues.blocking),
      entityCount: wbsCount,
      blockingCount: wbsIssues.blocking,
      warningCount: wbsIssues.warning,
      tabIndex: 4,
    },
  ];

  sectionStatuses.forEach((sec) => {
    if (sec.entityCount === 0) {
      issues.push({
        id: `warn-empty-sec-${sec.key}`,
        code: 'WARN_EMPTY_SECTION',
        severity: 'warning',
        section: (sec.key === 'workflows' ? 'workflow' : sec.key) as ValidationSection,
        title: `Seksi '${sec.name}' Masih Kosong`,
        message: `Seksi ${sec.name} belum memiliki entitas data yang terdefinisi.`,
        suggestion: 'Lengkapi data pada tab terkait sebelum publikasi penuh.',
      });
    }
  });

  const blockingCount = issues.filter((i) => i.severity === 'blocking').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  // Determine Publication Readiness
  let readiness: PublicationReadiness;
  if (blockingCount > 0) {
    readiness = {
      status: 'blocked',
      label: 'Validation Blocked',
      description: `Terdapat ${blockingCount} blocking error yang harus diperbaiki sebelum publikasi.`,
      color: 'error',
    };
  } else {
    const allSectionsCompleted = sectionStatuses.every((s) => s.entityCount > 0);
    if (allSectionsCompleted) {
      readiness = {
        status: 'full_ready',
        label: 'Full Publish Ready',
        description:
          'Seluruh 5 seksi blueprint terisi lengkap dan lolos validasi tanpa blocking error.',
        color: 'success',
      };
    } else {
      readiness = {
        status: 'partial_ready',
        label: 'Ready for Partial Publish',
        description:
          'Seksi yang selesai valid tanpa blocking error. Seksi yang belum selesai dapat dipublikasikan dengan placeholder parsial.',
        color: 'info',
      };
    }
  }

  return {
    issues,
    blockingCount,
    warningCount,
    sectionStatuses,
    readiness,
  };
}
