import type {
  MeetingExtractionStatus,
  MeetingExtractionSafeError,
  MeetingExtractionServiceScheme,
} from '../types/meeting-extraction';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  retryMeetingExtraction,
  startMeetingExtraction,
  getMeetingExtractionStatus,
} from '../api/meeting-extraction';

const TERMINAL = new Set(['completed', 'failed', 'needs_input', 'needs_review']);

const isActiveBrowser = () =>
  typeof document === 'undefined' || (!document.hidden && navigator.onLine);

const createIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random % 4) + 8;
    return value.toString(16);
  });
};

type MeetingExtractionIds = {
  quotationId: string;
  runId: string;
};

type StartInput = {
  quotationId: string;
  meetingNotes: string;
  serviceScheme: MeetingExtractionServiceScheme;
  idempotencyKey?: string;
};

type UseMeetingExtractionOptions = {
  quotationId?: string;
  runId?: string;
};

export function useMeetingExtraction({ quotationId, runId }: UseMeetingExtractionOptions) {
  const queryClient = useQueryClient();
  const [ids, setIds] = useState<MeetingExtractionIds | null>(
    quotationId && runId ? { quotationId, runId } : null
  );
  const [browserActive, setBrowserActive] = useState(isActiveBrowser);
  const [status, setStatus] = useState<MeetingExtractionStatus | null>(null);
  const etagRef = useRef<string | null>(null);

  useEffect(() => {
    setIds(quotationId && runId ? { quotationId, runId } : null);
    setStatus(null);
    etagRef.current = null;
  }, [quotationId, runId]);

  const refreshBrowserState = useCallback(() => {
    const active = isActiveBrowser();
    setBrowserActive(active);
    if (active && ids) {
      void queryClient.invalidateQueries({
        queryKey: ['meeting-extraction', ids.quotationId, ids.runId],
      });
    }
  }, [ids, queryClient]);

  useEffect(() => {
    window.addEventListener('visibilitychange', refreshBrowserState);
    window.addEventListener('online', refreshBrowserState);
    window.addEventListener('offline', refreshBrowserState);

    return () => {
      window.removeEventListener('visibilitychange', refreshBrowserState);
      window.removeEventListener('online', refreshBrowserState);
      window.removeEventListener('offline', refreshBrowserState);
    };
  }, [refreshBrowserState]);

  const isTerminal = Boolean(status && TERMINAL.has(status.status));
  const canPoll = Boolean(ids && browserActive && !isTerminal);

  const query = useQuery({
    queryKey: ['meeting-extraction', ids?.quotationId, ids?.runId],
    enabled: canPoll,
    queryFn: async () => {
      if (!ids) throw new Error('Meeting extraction IDs are required');

      const next = await getMeetingExtractionStatus(
        ids.quotationId,
        ids.runId,
        etagRef.current ?? undefined
      );
      if (!next.notModified) {
        etagRef.current = next.etag;
        setStatus(next.data);
      }
      return next;
    },
    refetchInterval: (currentQuery) => (currentQuery.state.dataUpdateCount <= 1 ? 2_000 : 5_000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: false,
  });

  const startMutation = useMutation({
    mutationFn: async ({ quotationId: durableQuotationId, meetingNotes, serviceScheme, idempotencyKey }: StartInput) =>
      startMeetingExtraction(durableQuotationId, {
        meeting_notes: meetingNotes,
        service_scheme: serviceScheme,
        pipeline_version: 'meeting-extraction-v1',
        idempotency_key: idempotencyKey ?? createIdempotencyKey(),
      }),
    onSuccess: (next) => {
      etagRef.current = null;
      setStatus(null);
      setIds({ quotationId: next.quotation_id, runId: next.run_id });
    },
  });

  const retryMutation = useMutation({
    mutationFn: async () => {
      if (!ids) throw new Error('Meeting extraction IDs are required');
      return retryMeetingExtraction(ids.quotationId, ids.runId);
    },
    onSuccess: () => {
      etagRef.current = null;
      setStatus(null);
      if (ids) {
        void queryClient.invalidateQueries({
          queryKey: ['meeting-extraction', ids.quotationId, ids.runId],
        });
      }
    },
  });

  const resume = useCallback((nextQuotationId: string, nextRunId: string) => {
    etagRef.current = null;
    setStatus(null);
    setIds({ quotationId: nextQuotationId, runId: nextRunId });
  }, []);

  const safeError = (query.error ?? startMutation.error ?? retryMutation.error ?? null) as
    | MeetingExtractionSafeError
    | null;

  return {
    start: startMutation.mutateAsync,
    retry: retryMutation.mutateAsync,
    resume,
    status,
    ids,
    isPolling: canPoll && query.fetchStatus === 'fetching',
    isTerminal,
    safeError,
  };
}
