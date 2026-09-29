import type {
  PromptPatchPayload,
  PromptPatchResponse,
  PromptPatchOperation,
  PromptNarrativeTarget,
  PromptRevisionPayload,
} from '../types/prompt-first';

import { useRef, useState } from 'react';

import { patchPromptQuotation, revisePromptQuotationSection } from '../api/prompt-first';

type QueueConfig = {
  quotationId: string;
  revisionId: string;
  contentVersion: number;
  stateVersion: number;
  mutate: (quotationId: string, payload: PromptPatchPayload) => Promise<PromptPatchResponse>;
  revise: (quotationId: string, payload: PromptRevisionPayload) => Promise<PromptPatchResponse>;
  onResponse: (response: PromptPatchResponse) => void;
  onConflict: (error: unknown) => void;
};

type QueueVersions = {
  contentVersion: number;
  stateVersion: number;
};

function isConflict(error: unknown) {
  const candidate = error as { status?: number; response?: { status?: number } };
  return candidate.status === 409 || candidate.response?.status === 409;
}

/**
 * Serializes commercial state writes so every PATCH carries the versions that
 * the previous authoritative response returned. It is intentionally separate
 * from React so the concurrency contract has deterministic unit coverage.
 */
export function createPromptWorkspaceMutationQueue(config: QueueConfig) {
  let versions: QueueVersions = {
    contentVersion: config.contentVersion,
    stateVersion: config.stateVersion,
  };
  let tail: Promise<void> = Promise.resolve();

  const applyResponse = (response: PromptPatchResponse) => {
    if (
      response.content_version < versions.contentVersion ||
      response.state_version < versions.stateVersion
    ) {
      return false;
    }
    versions = {
      contentVersion: response.content_version,
      stateVersion: response.state_version,
    };
    config.onResponse(response);
    return true;
  };

  return {
    enqueue(operations: PromptPatchOperation[]) {
      const run = async () => {
        const response = await config.mutate(config.quotationId, {
          revision_id: config.revisionId,
          content_version: versions.contentVersion,
          state_version: versions.stateVersion,
          operations,
        });
        applyResponse(response);
        return response;
      };
      const next = tail.then(run, run);
      tail = next.then(
        () => undefined,
        (error) => {
          if (isConflict(error)) config.onConflict(error);
        }
      );
      return next;
    },
    enqueueRevision(instruction: string, targetSection: PromptNarrativeTarget) {
      const run = async () => {
        const response = await config.revise(config.quotationId, {
          revision_id: config.revisionId,
          content_version: versions.contentVersion,
          state_version: versions.stateVersion,
          instruction,
          target_section: targetSection,
        });
        applyResponse(response);
        return response;
      };
      const next = tail.then(run, run);
      tail = next.then(
        () => undefined,
        (error) => {
          if (isConflict(error)) config.onConflict(error);
        }
      );
      return next;
    },
    applyResponse,
    versions: () => ({ ...versions }),
    sync(next: QueueVersions) {
      versions = {
        contentVersion: Math.max(versions.contentVersion, next.contentVersion),
        stateVersion: Math.max(versions.stateVersion, next.stateVersion),
      };
    },
  };
}

type UsePromptWorkspaceParams = Omit<QueueConfig, 'mutate' | 'revise'>;

export function usePromptWorkspace({
  quotationId,
  revisionId,
  contentVersion,
  stateVersion,
  onResponse,
  onConflict,
}: UsePromptWorkspaceParams) {
  const queueRef = useRef<ReturnType<typeof createPromptWorkspaceMutationQueue> | null>(null);
  const identityRef = useRef('');
  const [pendingCount, setPendingCount] = useState(0);
  const identity = `${quotationId}:${revisionId}`;

  if (!queueRef.current || identityRef.current !== identity) {
    identityRef.current = identity;
    queueRef.current = createPromptWorkspaceMutationQueue({
      quotationId,
      revisionId,
      contentVersion,
      stateVersion,
      mutate: patchPromptQuotation,
      revise: revisePromptQuotationSection,
      onResponse,
      onConflict,
    });
  } else {
    queueRef.current.sync({ contentVersion, stateVersion });
  }

  const queue = queueRef.current;
  return {
    isPending: pendingCount > 0,
    patch: async (operations: PromptPatchOperation[]) => {
      setPendingCount((count) => count + 1);
      try {
        return await queue.enqueue(operations);
      } finally {
        setPendingCount((count) => Math.max(0, count - 1));
      }
    },
    revise: async (instruction: string, targetSection: PromptNarrativeTarget) => {
      setPendingCount((count) => count + 1);
      try {
        return await queue.enqueueRevision(instruction, targetSection);
      } finally {
        setPendingCount((count) => Math.max(0, count - 1));
      }
    },
  };
}
