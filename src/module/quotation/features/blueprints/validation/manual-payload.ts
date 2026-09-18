import type { ManualContentMap } from '../types/bundle';

export function newBlueprintItemId(prefix: string): string {
  const cleanPrefix = prefix.replace(/-+$/, '');
  return `${cleanPrefix}-${crypto.randomUUID()}`;
}

export function toManualPayload<S extends keyof ManualContentMap>(
  section: S,
  value: ManualContentMap[S]
): ManualContentMap[S] {
  switch (section) {
    case 'journey': {
      const v = value as ManualContentMap['journey'];
      const payload: ManualContentMap['journey'] = {
        journey: {
          phases: (v.journey?.phases || []).map((p) => ({
            id: p.id,
            label: p.label,
            order: Number(p.order),
          })),
          actors: (v.journey?.actors || []).map((a) => ({
            id: a.id,
            label: a.label,
            order: Number(a.order),
          })),
          activities: (v.journey?.activities || []).map((act) => ({
            id: act.id,
            phase_id: act.phase_id,
            actor_id: act.actor_id,
            label: act.label,
            description: act.description ?? '',
            touchpoints: Array.isArray(act.touchpoints) ? [...act.touchpoints] : [],
            references: Array.isArray(act.references) ? [...act.references] : [],
          })),
        },
      };
      return payload as ManualContentMap[S];
    }
    case 'architecture': {
      const v = value as ManualContentMap['architecture'];
      const payload: ManualContentMap['architecture'] = {
        architecture: {
          groups: (v.architecture?.groups || []).map((g) => ({
            id: g.id,
            label: g.label,
            order: Number(g.order),
          })),
          nodes: (v.architecture?.nodes || []).map((n) => ({
            id: n.id,
            group_id: n.group_id,
            type: n.type,
            label: n.label,
            description: n.description ?? '',
            layout: n.layout
              ? { x: Number(n.layout.x ?? 0), y: Number(n.layout.y ?? 0) }
              : { x: 0, y: 0 },
          })),
          edges: (v.architecture?.edges || []).map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label ?? '',
            type: e.type,
          })),
        },
      };
      return payload as ManualContentMap[S];
    }
    case 'state_machine': {
      const v = value as ManualContentMap['state_machine'];
      const payload: ManualContentMap['state_machine'] = {
        state_machine: {
          entity: v.state_machine?.entity ?? '',
          initial_state: v.state_machine?.initial_state ?? '',
          states: (v.state_machine?.states || []).map((s) => ({
            id: s.id,
            label: s.label,
            type: s.type,
            layout: s.layout
              ? { x: Number(s.layout.x ?? 0), y: Number(s.layout.y ?? 0) }
              : { x: 0, y: 0 },
          })),
          transitions: (v.state_machine?.transitions || []).map((t) => ({
            id: t.id,
            source: t.source,
            target: t.target,
            event: t.event,
            actor: t.actor ?? '',
            guard: t.guard ?? '',
            actions: Array.isArray(t.actions) ? [...t.actions] : [],
          })),
        },
      };
      return payload as ManualContentMap[S];
    }
    case 'workflow': {
      const v = value as ManualContentMap['workflow'];
      const payload: ManualContentMap['workflow'] = {
        workflows: (v.workflows || []).map((wf) => ({
          id: wf.id,
          name: wf.name,
          description: wf.description ?? '',
          lanes: (wf.lanes || []).map((l) => ({
            id: l.id,
            label: l.label,
            order: Number(l.order),
          })),
          nodes: (wf.nodes || []).map((n) => ({
            id: n.id,
            lane_id: n.lane_id,
            type: n.type,
            label: n.label,
            description: n.description ?? '',
            layout: n.layout
              ? { x: Number(n.layout.x ?? 0), y: Number(n.layout.y ?? 0) }
              : { x: 0, y: 0 },
          })),
          edges: (wf.edges || []).map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label ?? '',
          })),
        })),
      };
      return payload as ManualContentMap[S];
    }
    case 'wbs': {
      const v = value as ManualContentMap['wbs'];
      const payload: ManualContentMap['wbs'] = {
        wbs: {
          modules: (v.wbs?.modules || []).map((m) => ({
            id: m.id,
            name: m.name,
            description: m.description ?? '',
            priority: m.priority,
            dependencies: Array.isArray(m.dependencies) ? [...m.dependencies] : [],
            references: Array.isArray(m.references) ? [...m.references] : [],
            features: (m.features || []).map((f) => ({
              id: f.id,
              name: f.name,
              description: f.description ?? '',
              acceptance_criteria: Array.isArray(f.acceptance_criteria)
                ? [...f.acceptance_criteria]
                : [],
            })),
          })),
        },
        cross_references: (v.cross_references || []).map((xr) => ({
          id: xr.id,
          source_ref: xr.source_ref,
          target_ref: xr.target_ref,
          relation_type: xr.relation_type,
          description: xr.description ?? '',
        })),
      };
      return payload as ManualContentMap[S];
    }
    default:
      return structuredClone(value);
  }
}

export function fromManualPayload<S extends keyof ManualContentMap>(
  section: S,
  value: ManualContentMap[S]
): ManualContentMap[S] {
  void section;
  return structuredClone(value);
}
