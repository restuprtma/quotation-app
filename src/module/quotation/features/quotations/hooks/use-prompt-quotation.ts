import type { ClientSummary } from '../types';
import type {
  DraftIssue,
  MeetingDraftInput,
  MeetingDraftResponse,
  MeetingGenerationPhase,
  PendingMeetingDraftResponse,
} from '../types/prompt-first';

import { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getClients, createClientOrganization } from '../api/generation';
import { getPromptIssues, createMeetingDraft, processMeetingDraft } from '../api/prompt-first';

type PipelineDraft = PendingMeetingDraftResponse & { idempotencyKey: string };

function createIdempotencyKey() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `prompt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function usePromptClients() {
  return useQuery<ClientSummary[]>({
    queryKey: ['quotation', 'clients'],
    queryFn: getClients,
    staleTime: 60_000,
  });
}

export function useCreatePromptClient() {
  const queryClient = useQueryClient();
  return useMutation<ClientSummary, Error, string>({
    mutationFn: (name: string) => createClientOrganization(name),
    onSuccess: (newClient) => {
      queryClient.setQueryData<ClientSummary[]>(['quotation', 'clients'], (old = []) => {
        if (!old) return [newClient];
        if (old.some((c) => c.id === newClient.id)) return old;
        return [...old, newClient];
      });
      queryClient.invalidateQueries({ queryKey: ['quotation', 'clients'] });
    },
  });
}

export function usePromptQuotation() {
  const controllerRef = useRef<AbortController | null>(null);
  const idempotencyRef = useRef<{ fingerprint: string; key: string } | null>(null);
  const [issues, setIssues] = useState<DraftIssue[]>([]);
  const [quotationId, setQuotationId] = useState<string | null>(null);
  const [phase, setPhase] = useState<MeetingGenerationPhase>('idle');
  const mutation = useMutation<MeetingDraftResponse, Error, MeetingDraftInput>({
    mutationFn: async (payload) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const fingerprint = JSON.stringify(payload);
      if (!idempotencyRef.current || idempotencyRef.current.fingerprint !== fingerprint) {
        idempotencyRef.current = { fingerprint, key: createIdempotencyKey() };
        setQuotationId(null);
      }
      setPhase('creating_draft');
      const pending = await createMeetingDraft(
        { ...payload, idempotency_key: idempotencyRef.current.key },
        controller.signal
      );
      setQuotationId(pending.quotation_id);
      setPhase('extracting_meeting');
      const result = await processMeetingDraft(pending.quotation_id, controller.signal);
      setPhase('finalizing_draft');
      setIssues(result.issues ?? []);
      setPhase('completed');
      return result;
    },
    onError: (error) => {
      setPhase('failed');
      setIssues(getPromptIssues(error));
    },
  });

  const retryMutation = useMutation<MeetingDraftResponse, Error, void>({
    mutationFn: async () => {
      if (!quotationId) throw new Error('generation_failed');
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setPhase('extracting_meeting');
      const result = await processMeetingDraft(quotationId, controller.signal);
      setPhase('completed');
      setIssues(result.issues ?? []);
      return result;
    },
    onError: (error) => {
      setPhase('failed');
      setIssues(getPromptIssues(error));
    },
  });

  const pipelineDraftMutation = useMutation<PipelineDraft, Error, MeetingDraftInput>({
    mutationFn: async (payload) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const fingerprint = JSON.stringify(payload);
      if (!idempotencyRef.current || idempotencyRef.current.fingerprint !== fingerprint) {
        idempotencyRef.current = { fingerprint, key: createIdempotencyKey() };
      }
      const draft = await createMeetingDraft(
        { ...payload, idempotency_key: idempotencyRef.current.key },
        controller.signal
      );
      return { ...draft, idempotencyKey: idempotencyRef.current.key };
    },
  });

  const reset = () => {
    controllerRef.current?.abort();
    idempotencyRef.current = null;
    setQuotationId(null);
    setIssues([]);
    setPhase('idle');
    mutation.reset();
    retryMutation.reset();
  };

  useEffect(() => () => controllerRef.current?.abort(), []);

  return {
    ...mutation,
    issues,
    phase,
    quotationId,
    error: mutation.error ?? retryMutation.error,
    isPending: mutation.isPending || retryMutation.isPending,
    canRetry: Boolean(quotationId) && phase === 'failed',
    submitMeeting: mutation.mutateAsync,
    retryProcessing: retryMutation.mutateAsync,
    createPipelineDraft: pipelineDraftMutation.mutateAsync,
    reset,
  };
}
