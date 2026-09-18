import type { BlueprintDetail, BlueprintStatus, ProviderSection } from '../types';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { useAuthContext } from 'src/module/core/features/auth/hooks';

import { getBlueprint, continueBlueprint, getBlueprintStatus, retryBlueprintSection } from '../api';

export type BlueprintRunnerState = 'idle' | 'running' | 'stopping' | 'recovery' | 'completed';

export interface UseBlueprintRunnerOptions {
  pollingInterval?: number; // Default: 2000 ms
  staleLeaseThresholdMs?: number; // Default: 5 * 60 * 1000 ms (5 minutes)
  enabled?: boolean; // Default: true
}

export interface UseBlueprintRunnerReturn {
  blueprintId: string | null | undefined;
  status: BlueprintStatus | undefined;
  detail: BlueprintDetail | undefined;
  runnerState: BlueprintRunnerState;
  isLoading: boolean;
  isFetching: boolean;
  isPolling: boolean;
  isStaleLease: boolean;
  error: Error | null;
  start: () => Promise<void>;
  stop: () => void;
  recover: () => Promise<void>;
  retrySection: (section: ProviderSection) => Promise<void>;
  refresh: () => Promise<void>;
}

const DEFAULT_POLLING_INTERVAL = 2000;
const DEFAULT_STALE_LEASE_THRESHOLD_MS = 5 * 60 * 1000;

export function useBlueprintRunner(
  blueprintId?: string | null,
  options: UseBlueprintRunnerOptions = {}
): UseBlueprintRunnerReturn {
  const {
    pollingInterval = DEFAULT_POLLING_INTERVAL,
    staleLeaseThresholdMs = DEFAULT_STALE_LEASE_THRESHOLD_MS,
    enabled = true,
  } = options;

  const { company } = useAuthContext();
  const companyId = company?.id ?? 'anonymous';
  const queryClient = useQueryClient();

  const [internalState, setInternalState] = useState<BlueprintRunnerState>('idle');
  const [error, setError] = useState<Error | null>(null);

  const isLoopRunningRef = useRef<boolean>(false);
  const inFlightRef = useRef<boolean>(false);
  const isStoppingRef = useRef<boolean>(false);
  const runIdentityRef = useRef<symbol | number>(0);
  const isUnmountedRef = useRef<boolean>(false);
  const companyRef = useRef<string>(companyId);

  companyRef.current = companyId;

  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      isLoopRunningRef.current = false;
      inFlightRef.current = false;
      isStoppingRef.current = false;
      runIdentityRef.current = Symbol('unmounted');
    };
  }, []);

  const statusQueryKey = useMemo(
    () => ['blueprints', companyId, 'status', blueprintId],
    [companyId, blueprintId]
  );

  const detailQueryKey = useMemo(
    () => ['blueprints', companyId, 'detail', blueprintId],
    [companyId, blueprintId]
  );

  const safeUpdateStatusCache = useCallback(
    (incoming: BlueprintStatus) => {
      if (!blueprintId) return;

      queryClient.setQueryData<BlueprintStatus>(statusQueryKey, (prev) => {
        if (!prev) return incoming;

        if (prev.revision_id === incoming.revision_id) {
          if (incoming.content_version < prev.content_version) {
            // Stale response with lower content_version: reject downgrade
            return prev;
          }
          return incoming;
        }

        // Different revision: refetch authoritative status and detail from server
        queryClient.invalidateQueries({ queryKey: detailQueryKey });
        return incoming;
      });
    },
    [blueprintId, queryClient, statusQueryKey, detailQueryKey]
  );

  const statusQuery = useQuery<BlueprintStatus, Error>({
    queryKey: statusQueryKey,
    queryFn: async ({ signal }) => {
      const incoming = await getBlueprintStatus(blueprintId!, signal);
      const prev = queryClient.getQueryData<BlueprintStatus>(statusQueryKey);
      if (
        prev &&
        prev.revision_id === incoming.revision_id &&
        incoming.content_version < prev.content_version
      ) {
        return prev;
      }
      return incoming;
    },
    enabled: Boolean(blueprintId) && enabled,
    refetchInterval: (query) => {
      const genStatus = query.state.data?.generation_status;
      if (genStatus === 'in_progress') {
        return pollingInterval;
      }
      return false;
    },
    staleTime: 0,
  });

  const detailQuery = useQuery<BlueprintDetail, Error>({
    queryKey: detailQueryKey,
    queryFn: ({ signal }) => getBlueprint(blueprintId!, signal),
    enabled: Boolean(blueprintId) && enabled,
    staleTime: 10000,
  });

  const status = statusQuery.data;
  const detail = detailQuery.data;

  const isTerminal =
    status?.generation_status === 'completed' ||
    status?.generation_status === 'failed' ||
    status?.generation_status === 'partial_failed';

  const isPolling = Boolean(
    enabled && blueprintId && status?.generation_status === 'in_progress' && !isTerminal
  );

  // Stale lease calculation (> 5 minutes on server updated_at timestamp)
  const isStaleLease = useMemo(() => {
    if (!status || status.generation_status !== 'in_progress') {
      return false;
    }
    const updatedAtMs = new Date(status.updated_at).getTime();
    if (Number.isNaN(updatedAtMs)) {
      return false;
    }
    return Date.now() - updatedAtMs >= staleLeaseThresholdMs;
  }, [status, staleLeaseThresholdMs]);

  // Derive active runnerState from authoritative status and internal lifecycle state
  const runnerState: BlueprintRunnerState = useMemo(() => {
    if (status?.generation_status === 'completed') {
      return 'completed';
    }
    if (internalState === 'running') {
      return 'running';
    }
    if (internalState === 'stopping') {
      return 'stopping';
    }
    if (internalState === 'recovery' || (isStaleLease && internalState === 'idle')) {
      return 'recovery';
    }
    return 'idle';
  }, [status?.generation_status, internalState, isStaleLease]);

  const start = useCallback(async () => {
    if (!blueprintId || isLoopRunningRef.current) {
      return;
    }

    const currentStatus = queryClient.getQueryData<BlueprintStatus>(statusQueryKey) ?? status;
    if (currentStatus?.generation_status === 'completed') {
      setInternalState('completed');
      return;
    }

    isLoopRunningRef.current = true;
    isStoppingRef.current = false;
    const runId = Symbol('runId');
    runIdentityRef.current = runId;
    setInternalState('running');
    setError(null);

    const currentCompanyId = companyId;

    try {
      while (true) {
        if (
          isUnmountedRef.current ||
          runIdentityRef.current !== runId ||
          companyRef.current !== currentCompanyId
        ) {
          break;
        }

        if (isStoppingRef.current) {
          setInternalState('idle');
          break;
        }

        const cur = queryClient.getQueryData<BlueprintStatus>(statusQueryKey);
        if (cur?.generation_status === 'completed') {
          setInternalState('completed');
          await queryClient.invalidateQueries({ queryKey: detailQueryKey });
          break;
        }
        if (cur?.generation_status === 'failed' || cur?.generation_status === 'partial_failed') {
          setInternalState('idle');
          break;
        }

        try {
          inFlightRef.current = true;
          const updated = await continueBlueprint(blueprintId);
          inFlightRef.current = false;

          if (
            isUnmountedRef.current ||
            runIdentityRef.current !== runId ||
            companyRef.current !== currentCompanyId
          ) {
            break;
          }

          safeUpdateStatusCache(updated);

          if (isStoppingRef.current) {
            setInternalState('idle');
            break;
          }

          if (updated.generation_status === 'completed') {
            setInternalState('completed');
            await queryClient.invalidateQueries({ queryKey: detailQueryKey });
            break;
          }

          if (
            updated.generation_status === 'failed' ||
            updated.generation_status === 'partial_failed'
          ) {
            setInternalState('idle');
            break;
          }
        } catch (err: any) {
          inFlightRef.current = false;
          if (
            isUnmountedRef.current ||
            runIdentityRef.current !== runId ||
            companyRef.current !== currentCompanyId
          ) {
            break;
          }

          // After error or timeout: GET status first, DO NOT retry mutation automatically
          try {
            const fetched = await getBlueprintStatus(blueprintId);
            safeUpdateStatusCache(fetched);
          } catch {
            // ignore status query failure
          }

          const errorStatus = err?.response?.status;
          const errorCode = err?.response?.data?.errors;

          if (errorStatus === 409 && errorCode === 'pipeline_busy') {
            setInternalState('idle');
            break;
          }

          if (errorCode === 'recovery_required' || errorCode === 'section_recovery_required') {
            setInternalState('recovery');
            break;
          }

          setError(err instanceof Error ? err : new Error(String(err)));
          setInternalState('idle');
          break;
        }
      }
    } finally {
      isLoopRunningRef.current = false;
      inFlightRef.current = false;
    }
  }, [
    blueprintId,
    companyId,
    queryClient,
    statusQueryKey,
    detailQueryKey,
    safeUpdateStatusCache,
    status,
  ]);

  const stop = useCallback(() => {
    if (isLoopRunningRef.current && inFlightRef.current) {
      isStoppingRef.current = true;
      setInternalState('stopping');
    } else {
      isStoppingRef.current = true;
      runIdentityRef.current = Symbol('stopped');
      isLoopRunningRef.current = false;
      setInternalState('idle');
    }
  }, []);

  const recover = useCallback(async () => {
    if (!blueprintId || inFlightRef.current) return;
    inFlightRef.current = true;
    setError(null);

    try {
      const updated = await continueBlueprint(blueprintId);
      safeUpdateStatusCache(updated);
      if (updated.generation_status === 'completed') {
        setInternalState('completed');
        await queryClient.invalidateQueries({ queryKey: detailQueryKey });
      } else {
        setInternalState('idle');
      }
    } catch (err: any) {
      // After error / recovery_required: refetch status & detail
      try {
        const latestStatus = await getBlueprintStatus(blueprintId);
        safeUpdateStatusCache(latestStatus);
        await queryClient.invalidateQueries({ queryKey: detailQueryKey });
      } catch {
        // ignore
      }
      setInternalState('recovery');
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      inFlightRef.current = false;
    }
  }, [blueprintId, queryClient, detailQueryKey, safeUpdateStatusCache]);

  const retrySection = useCallback(
    async (section: ProviderSection) => {
      if (!blueprintId || inFlightRef.current) return;
      inFlightRef.current = true;
      setError(null);

      try {
        const updated = await retryBlueprintSection(blueprintId, section);
        setInternalState('idle');
        safeUpdateStatusCache(updated);
        await queryClient.invalidateQueries({ queryKey: detailQueryKey });
      } catch (err: any) {
        try {
          const latestStatus = await getBlueprintStatus(blueprintId);
          safeUpdateStatusCache(latestStatus);
        } catch {
          // ignore
        }
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        inFlightRef.current = false;
      }
    },
    [blueprintId, queryClient, detailQueryKey, safeUpdateStatusCache]
  );

  const refresh = useCallback(async () => {
    if (!blueprintId) return;
    await Promise.all([statusQuery.refetch(), detailQuery.refetch()]);
  }, [blueprintId, statusQuery, detailQuery]);

  return {
    blueprintId,
    status,
    detail,
    runnerState,
    isLoading: statusQuery.isLoading || detailQuery.isLoading,
    isFetching: statusQuery.isFetching || detailQuery.isFetching,
    isPolling,
    isStaleLease,
    error: error || statusQuery.error || detailQuery.error || null,
    start,
    stop,
    recover,
    retrySection,
    refresh,
  };
}
