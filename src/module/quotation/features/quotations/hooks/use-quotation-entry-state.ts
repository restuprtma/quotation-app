import { useState, useCallback } from 'react';

import {
  EMPTY_QUOTATION_ENTRY,
  type QuotationEntryState,
  type QuotationEntryIdentity,
} from '../types/quotation-entry';
import {
  mergeEntryIdentity,
  loadQuotationEntryState,
  saveQuotationEntryState,
  clearQuotationEntryState,
} from '../utils/quotation-entry-state';

export function useQuotationEntryState(storage?: Storage) {
  const [entry, setEntryState] = useState<QuotationEntryState>(() =>
    loadQuotationEntryState(storage)
  );

  const setEntry = useCallback(
    (next: QuotationEntryState | ((prev: QuotationEntryState) => QuotationEntryState)) => {
      setEntryState((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        saveQuotationEntryState(resolved, storage);
        return resolved;
      });
    },
    [storage]
  );

  const patchIdentity = useCallback(
    (patch: Partial<QuotationEntryIdentity>) => {
      setEntryState((prev) => {
        const next = mergeEntryIdentity(prev, patch);
        saveQuotationEntryState(next, storage);
        return next;
      });
    },
    [storage]
  );

  const setMeetingNotes = useCallback(
    (notes: string) => {
      setEntryState((prev) => {
        const next: QuotationEntryState = { ...prev, meeting_notes: notes };
        saveQuotationEntryState(next, storage);
        return next;
      });
    },
    [storage]
  );

  const clear = useCallback(() => {
    clearQuotationEntryState(storage);
    setEntryState(EMPTY_QUOTATION_ENTRY);
  }, [storage]);

  return {
    entry,
    setEntry,
    patchIdentity,
    setMeetingNotes,
    clear,
  };
}
