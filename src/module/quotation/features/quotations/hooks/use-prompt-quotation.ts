import type { ClientSummary } from '../types';
import type {
  DraftIssue,
  MeetingDraftResponse,
  MeetingQuotationPayload,
} from '../types/prompt-first';

import { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getClients, createClientOrganization } from '../api/generation';
import { getPromptIssues, createQuotationFromMeeting } from '../api/prompt-first';

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
  const mutation = useMutation<
    MeetingDraftResponse,
    Error,
    Omit<MeetingQuotationPayload, 'idempotency_key'>
  >({
    mutationFn: async (payload) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const fingerprint = JSON.stringify(payload);
      if (!idempotencyRef.current || idempotencyRef.current.fingerprint !== fingerprint) {
        idempotencyRef.current = { fingerprint, key: createIdempotencyKey() };
      }
      const result = await createQuotationFromMeeting(
        { ...payload, idempotency_key: idempotencyRef.current.key },
        controller.signal
      );
      setIssues(result.issues ?? []);
      return result;
    },
    onError: (error) => setIssues(getPromptIssues(error)),
  });

  useEffect(() => () => controllerRef.current?.abort(), []);

  return { ...mutation, issues };
}
