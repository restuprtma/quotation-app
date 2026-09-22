import type { WBSModule } from '../types/bundle';

// ----------------------------------------------------------------------

export type WBSCycleResult = {
  hasCycle: boolean;
  cycleModules: string[];
  topologicalOrder: string[];
  cyclePath?: string;
  message?: string;
};

/**
 * Kahn's Algorithm & DFS for Topological Sort & Cycle Detection on WBS Modules
 * Rule: ERR_WBS_DEPENDENCY_CYCLE
 * Each module must not have cyclic prerequisites (e.g. A -> B -> A).
 */
export function detectWBSCycles(modules: WBSModule[]): WBSCycleResult {
  if (!modules || modules.length === 0) {
    return {
      hasCycle: false,
      cycleModules: [],
      topologicalOrder: [],
    };
  }

  const moduleIds = new Set(modules.map((m) => m.id));
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  // Initialize
  modules.forEach((m) => {
    inDegree.set(m.id, 0);
    adjList.set(m.id, []);
  });

  // Build Graph: if module M depends on D, edge is D -> M (D must precede M)
  modules.forEach((m) => {
    const validDeps = (m.dependencies || []).filter((depId) => moduleIds.has(depId));
    inDegree.set(m.id, validDeps.length);

    validDeps.forEach((depId) => {
      const dependents = adjList.get(depId) || [];
      dependents.push(m.id);
      adjList.set(depId, dependents);
    });
  });

  // Queue nodes with in-degree 0 (no prerequisites)
  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) {
      queue.push(id);
    }
  });

  const topologicalOrder: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    topologicalOrder.push(current);

    const dependents = adjList.get(current) || [];
    dependents.forEach((depId) => {
      const currentDeg = (inDegree.get(depId) ?? 1) - 1;
      inDegree.set(depId, currentDeg);
      if (currentDeg === 0) {
        queue.push(depId);
      }
    });
  }

  // If all modules were visited, no cycle exists
  if (topologicalOrder.length === modules.length) {
    return {
      hasCycle: false,
      cycleModules: [],
      topologicalOrder,
    };
  }

  // Nodes with remaining in-degree > 0 or not in topological order are in the cycle
  const cycleModules = modules.map((m) => m.id).filter((id) => !topologicalOrder.includes(id));

  return {
    hasCycle: true,
    cycleModules,
    topologicalOrder,
    cyclePath: cycleModules.join(' -> '),
    message: `Terdeteksi siklus dependensi pada modul: ${cycleModules.join(', ')}`,
  };
}
