import type {
  BlueprintDetail,
  BlueprintStatus,
  ProviderSection,
  BlueprintRunnerError,
} from '../types';

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
  needsLeaseRecovery: boolean;
  hasFailedSection: boolean;
  error: BlueprintRunnerError | null;
  start: () => Promise<void>;
  stop: () => void;
  recover: () => Promise<void>;
  retrySection: (section: ProviderSection) => Promise<void>;
  refresh: () => Promise<void>;
}

export function normalizeBlueprintRunnerError(
  err: unknown,
  fallbackSection: ProviderSection | null = null
): BlueprintRunnerError {
  if (!err) {
    return {
      code: null,
      httpStatus: null,
      section: fallbackSection,
      message: 'Unknown error occurred',
    };
  }

  const anyErr = err as any;

  if (
    typeof anyErr === 'object' &&
    'code' in anyErr &&
    'httpStatus' in anyErr &&
    'section' in anyErr &&
    'message' in anyErr
  ) {
    return anyErr as BlueprintRunnerError;
  }

  const response = anyErr?.response;
  const httpStatus = typeof response?.status === 'number' ? response.status : null;

  let code: string | null = null;
  const dataErrors = response?.data?.errors;
  const dataErrorCode = response?.data?.error_code;
  const dataCode = response?.data?.code;

  if (typeof dataErrors === 'string' && dataErrors.trim().length > 0) {
    code = dataErrors.trim();
  } else if (typeof dataErrorCode === 'string' && dataErrorCode.trim().length > 0) {
    code = dataErrorCode.trim();
  } else if (typeof dataCode === 'string' && dataCode.trim().length > 0) {
    code = dataCode.trim();
  } else if (typeof anyErr?.code === 'string' && anyErr.code && !anyErr.code.startsWith('ERR_')) {
    code = anyErr.code;
  }

  let section: ProviderSection | null = fallbackSection;
  const dataSection = response?.data?.section || anyErr?.section;
  if (
    dataSection === 'journey' ||
    dataSection === 'architecture' ||
    dataSection === 'state_machine' ||
    dataSection === 'workflow' ||
    dataSection === 'wbs'
  ) {
    section = dataSection;
  }

  let message = 'Terjadi kesalahan saat memproses blueprint.';
  if (typeof response?.data?.message === 'string' && response.data.message.trim().length > 0) {
    message = response.data.message.trim();
  } else if (typeof anyErr?.message === 'string' && anyErr.message.trim().length > 0) {
    message = anyErr.message.trim();
  }

  return {
    code,
    httpStatus,
    section,
    message,
  };
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
  const [error, setError] = useState<BlueprintRunnerError | null>(null);

  const isLoopRunningRef = useRef<boolean>(false);
  const inFlightRef = useRef<boolean>(false);
  const isStoppingRef = useRef<boolean>(false);
  const runIdentityRef = useRef<symbol | number>(0);
  const isUnmountedRef = useRef<boolean>(false);
  const companyRef = useRef<string>(companyId);

  companyRef.current = companyId;

  // Reset errors and internal lifecycle state on tenant/blueprint identity change
  const prevIdentityRef = useRef<{ companyId: string; blueprintId?: string | null }>({
    companyId,
    blueprintId,
  });

  useEffect(() => {
    if (
      prevIdentityRef.current.companyId !== companyId ||
      prevIdentityRef.current.blueprintId !== blueprintId
    ) {
      prevIdentityRef.current = { companyId, blueprintId };
      setError(null);
      setInternalState('idle');
    }
  }, [companyId, blueprintId]);

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

  // Stale error clearance when incoming authoritative state proves resolution
  const prevStatusRef = useRef<BlueprintStatus | undefined>(status);

  useEffect(() => {
    if (!status) return;
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (!error) return;

    // Revision changed -> clear error
    if (prev && prev.revision_id !== status.revision_id) {
      setError(null);
      return;
    }

    // Specific failed section is now validated or completed -> clear error
    if (error.section) {
      const sec = status.sections?.find((s) => s.type === error.section);
      if (sec && (sec.status === 'validated' || sec.status === 'completed')) {
        setError(null);
        return;
      }
    }

    // Pipeline reached completed state -> clear error
    if (status.generation_status === 'completed') {
      setError(null);
      return;
    }

    // Content version increased
    if (prev && status.content_version > prev.content_version) {
      if (error.section) {
        const sec = status.sections?.find((s) => s.type === error.section);
        if (sec && sec.status !== 'failed') {
          setError(null);
          return;
        }
      } else {
        const hasFailedSection = status.sections?.some((s) => s.status === 'failed');
        if (
          !hasFailedSection &&
          status.generation_status !== 'failed' &&
          status.generation_status !== 'partial_failed'
        ) {
          setError(null);
          return;
        }
      }
    }
  }, [status, error]);

  const isTerminal =
    status?.generation_status === 'completed' ||
    status?.generation_status === 'failed' ||
    status?.generation_status === 'partial_failed';

  const isPolling = Boolean(
    enabled && blueprintId && status?.generation_status === 'in_progress' && !isTerminal
  );

  // Stale lease calculation (> 5 minutes on active generating section timestamp or server updated_at timestamp)
  const isStaleLease = useMemo(() => {
    if (!status || status.generation_status !== 'in_progress') {
      return false;
    }
    const activeGeneratingSection = status.sections?.find((s) => s.status === 'in_progress');
    const timestampStr =
      activeGeneratingSection?.updated_at ||
      activeGeneratingSection?.started_at ||
      status.updated_at;

    if (!timestampStr) {
      return false;
    }
    const timestampMs = new Date(timestampStr).getTime();
    if (Number.isNaN(timestampMs)) {
      return false;
    }
    return Date.now() - timestampMs >= staleLeaseThresholdMs;
  }, [status, staleLeaseThresholdMs]);

  const hasFailedSection = useMemo(() => {
    if (!status) return false;
    const hasFailedSec = Boolean(
      status.sections?.some((s) => s.status === 'failed' || (s.status as string) === 'interrupted')
    );
    return (
      hasFailedSec ||
      status.generation_status === 'failed' ||
      status.generation_status === 'partial_failed'
    );
  }, [status]);

  const needsLeaseRecovery = useMemo(() => {
    if (internalState === 'recovery') {
      return true;
    }
    if (error?.code === 'recovery_required' || error?.code === 'section_recovery_required') {
      return true;
    }
    return isStaleLease;
  }, [internalState, error?.code, isStaleLease]);

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
    if (internalState === 'recovery' || (needsLeaseRecovery && internalState === 'idle')) {
      return 'recovery';
    }
    return 'idle';
  }, [status?.generation_status, internalState, needsLeaseRecovery]);

  const start = useCallback(async () => {
    if (!blueprintId || isLoopRunningRef.current) {
      return;
    }

    const currentStatus = queryClient.getQueryData<BlueprintStatus>(statusQueryKey) ?? status;
    if (currentStatus?.generation_status === 'completed') {
      setInternalState('completed');
      return;
    }

    if (
      currentStatus?.generation_status === 'failed' ||
      currentStatus?.generation_status === 'partial_failed' ||
      currentStatus?.sections?.some(
        (s) => s.status === 'failed' || (s.status as string) === 'interrupted'
      )
    ) {
      setInternalState('idle');
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
        if (
          cur?.generation_status === 'failed' ||
          cur?.generation_status === 'partial_failed' ||
          cur?.sections?.some(
            (s) => s.status === 'failed' || (s.status as string) === 'interrupted'
          )
        ) {
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
            updated.generation_status === 'partial_failed' ||
            updated.sections?.some(
              (s) => s.status === 'failed' || (s.status as string) === 'interrupted'
            )
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

          let latestStatus: BlueprintStatus | undefined;
          // After error or timeout: GET status first, DO NOT retry mutation automatically
          try {
            latestStatus = await getBlueprintStatus(blueprintId);
            safeUpdateStatusCache(latestStatus);
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

          const failedSec = (
            latestStatus ?? queryClient.getQueryData<BlueprintStatus>(statusQueryKey)
          )?.sections?.find((s) => s.status === 'failed' || (s.status as string) === 'interrupted');
          const section: ProviderSection | null =
            failedSec && failedSec.type !== 'context' && failedSec.type !== 'cross_validation'
              ? (failedSec.type as ProviderSection)
              : null;

          setError(normalizeBlueprintRunnerError(err, section));
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
      await queryClient.invalidateQueries({ queryKey: detailQueryKey });
      if (updated.generation_status === 'completed') {
        setInternalState('completed');
      } else {
        setInternalState('idle');
      }
      setError(null);
    } catch (err: any) {
      // After error / recovery_required: refetch status & detail
      try {
        const latestStatus = await getBlueprintStatus(blueprintId);
        safeUpdateStatusCache(latestStatus);
        await queryClient.invalidateQueries({ queryKey: detailQueryKey });
      } catch {
        // ignore
      }
      const errorCode = err?.response?.data?.errors;
      if (errorCode === 'recovery_required' || errorCode === 'section_recovery_required') {
        setInternalState('recovery');
      } else {
        setInternalState('idle');
      }
      setError(normalizeBlueprintRunnerError(err, null));
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
        setError(null);
      } catch (err: any) {
        try {
          const latestStatus = await getBlueprintStatus(blueprintId);
          safeUpdateStatusCache(latestStatus);
        } catch {
          // ignore
        }
        setError(normalizeBlueprintRunnerError(err, section));
      } finally {
        inFlightRef.current = false;
      }
    },
    [blueprintId, queryClient, detailQueryKey, safeUpdateStatusCache]
  );

  const refresh = useCallback(async () => {
    if (!blueprintId) return;
    try {
      const [statusRes, detailRes] = await Promise.all([
        statusQuery.refetch(),
        detailQuery.refetch(),
      ]);
      if (statusRes.isSuccess && detailRes.isSuccess) {
        setError(null);
      }
    } catch {
      // Keep existing error if refresh fails
    }
  }, [blueprintId, statusQuery, detailQuery]);

  const activeError = useMemo(() => {
    if (!error) {
      const queryError = statusQuery.error || detailQuery.error;
      return queryError ? normalizeBlueprintRunnerError(queryError, null) : null;
    }

    // Check if current status proves error is resolved
    if (status) {
      if (error.section) {
        const sec = status.sections?.find((s) => s.type === error.section);
        if (sec && (sec.status === 'validated' || sec.status === 'completed')) {
          return null;
        }
      }
      if (status.generation_status === 'completed') {
        return null;
      }
      if (prevStatusRef.current && status.content_version > prevStatusRef.current.content_version) {
        if (error.section) {
          const sec = status.sections?.find((s) => s.type === error.section);
          if (sec && sec.status !== 'failed') {
            return null;
          }
        }
      }
    }

    return error;
  }, [error, status, statusQuery.error, detailQuery.error]);

  return {
    blueprintId,
    status,
    detail,
    runnerState,
    isLoading: statusQuery.isLoading || detailQuery.isLoading,
    isFetching: statusQuery.isFetching || detailQuery.isFetching,
    isPolling,
    isStaleLease,
    needsLeaseRecovery,
    hasFailedSection,
    error: activeError,
    start,
    stop,
    recover,
    retrySection,
    refresh,
  };
}
