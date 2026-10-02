import {
  EMPTY_QUOTATION_ENTRY,
  type QuotationEntryState,
  QUOTATION_ENTRY_STORAGE_KEY,
  type QuotationEntryIdentity,
} from '../types/quotation-entry';

function getSessionStorage(storage?: Storage): Storage | undefined {
  if (storage) return storage;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage;
  }
  return undefined;
}

export function loadQuotationEntryState(storage?: Storage): QuotationEntryState {
  const s = getSessionStorage(storage);
  if (!s) return EMPTY_QUOTATION_ENTRY;

  try {
    const raw = s.getItem(QUOTATION_ENTRY_STORAGE_KEY);
    if (!raw) return EMPTY_QUOTATION_ENTRY;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) {
      return EMPTY_QUOTATION_ENTRY;
    }

    const persistedState = {
      version: 1 as const,
      project_name: typeof parsed.project_name === 'string' ? parsed.project_name : '',
      client_id: typeof parsed.client_id === 'string' ? parsed.client_id : '',
      client_company_name:
        typeof parsed.client_company_name === 'string' ? parsed.client_company_name : '',
      pic_name: typeof parsed.pic_name === 'string' ? parsed.pic_name : '',
    };

    if ('meeting_notes' in parsed) {
      try {
        s.setItem(QUOTATION_ENTRY_STORAGE_KEY, JSON.stringify(persistedState));
      } catch {
        // Ignore storage write failures while still returning the safe in-memory state.
      }
    }

    return { ...persistedState, meeting_notes: '' };
  } catch {
    return EMPTY_QUOTATION_ENTRY;
  }
}

export function saveQuotationEntryState(state: QuotationEntryState, storage?: Storage): void {
  const s = getSessionStorage(storage);
  if (!s) return;

  try {
    const { meeting_notes: _meetingNotes, ...persistedState } = state;
    s.setItem(QUOTATION_ENTRY_STORAGE_KEY, JSON.stringify(persistedState));
  } catch {
    // Ignore storage write failures (e.g. quota exceeded or disabled storage)
  }
}

export function clearQuotationEntryState(storage?: Storage): void {
  const s = getSessionStorage(storage);
  if (!s) return;

  try {
    s.removeItem(QUOTATION_ENTRY_STORAGE_KEY);
  } catch {
    // Ignore storage remove failures
  }
}

export function mergeEntryIdentity(
  current: QuotationEntryState,
  patch: Partial<QuotationEntryIdentity>
): QuotationEntryState {
  return {
    version: 1,
    project_name: patch.project_name ?? current.project_name,
    client_id: patch.client_id ?? current.client_id,
    client_company_name: patch.client_company_name ?? current.client_company_name,
    pic_name: patch.pic_name ?? current.pic_name,
    meeting_notes: current.meeting_notes,
  };
}

export function applyEntryIdentityToSchemeDefaults<T extends Record<string, any>>(
  defaults: T,
  entry: QuotationEntryState | QuotationEntryIdentity
): T {
  const next = { ...defaults };
  if ('subject' in defaults) {
    (next as any).subject = entry.project_name ?? defaults.subject;
  }
  if ('client_id' in defaults) {
    (next as any).client_id = entry.client_id ?? defaults.client_id;
  }
  if ('client_company_name' in defaults) {
    (next as any).client_company_name = entry.client_company_name ?? defaults.client_company_name;
  }
  if ('client_name' in defaults) {
    (next as any).client_name = entry.pic_name ?? defaults.client_name;
  }
  return next;
}
