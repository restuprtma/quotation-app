// @vitest-environment happy-dom

import { renderHook, act } from '@testing-library/react';
import { it, expect, describe, beforeEach } from 'vitest';

import {
  EMPTY_QUOTATION_ENTRY,
  QUOTATION_ENTRY_STORAGE_KEY,
  type QuotationEntryState,
} from '../types/quotation-entry';
import { useQuotationEntryState } from './use-quotation-entry-state';

describe('useQuotationEntryState hook', () => {
  let mockStorage: Storage;
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    mockStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      length: 0,
    };
  });

  it('initializes with empty state when storage is empty', () => {
    const { result } = renderHook(() => useQuotationEntryState(mockStorage));

    expect(result.current.entry).toEqual(EMPTY_QUOTATION_ENTRY);
  });

  it('loads initial state from storage if present', () => {
    const savedState: QuotationEntryState = {
      version: 1,
      project_name: 'Existing Project',
      client_id: 'org-1',
      client_company_name: 'PT Acme',
      pic_name: 'Rani',
      meeting_notes: 'Initial meeting notes',
    };
    mockStorage.setItem(QUOTATION_ENTRY_STORAGE_KEY, JSON.stringify(savedState));

    const { result } = renderHook(() => useQuotationEntryState(mockStorage));

    expect(result.current.entry).toEqual(savedState);
  });

  it('setEntry updates entry and persists to storage', () => {
    const { result } = renderHook(() => useQuotationEntryState(mockStorage));

    const newState: QuotationEntryState = {
      version: 1,
      project_name: 'Updated Project',
      client_id: 'org-2',
      client_company_name: 'PT Beta',
      pic_name: 'Budi',
      meeting_notes: 'Discussion notes',
    };

    act(() => {
      result.current.setEntry(newState);
    });

    expect(result.current.entry).toEqual(newState);
    expect(mockStorage.getItem(QUOTATION_ENTRY_STORAGE_KEY)).toBe(JSON.stringify(newState));
  });

  it('setEntry supports functional state updater', () => {
    const { result } = renderHook(() => useQuotationEntryState(mockStorage));

    act(() => {
      result.current.setEntry((prev) => ({
        ...prev,
        project_name: 'Functionally Updated',
      }));
    });

    expect(result.current.entry.project_name).toBe('Functionally Updated');
    expect(JSON.parse(mockStorage.getItem(QUOTATION_ENTRY_STORAGE_KEY) || '{}')).toMatchObject({
      project_name: 'Functionally Updated',
    });
  });

  it('patchIdentity updates identity fields, keeps meeting_notes, and persists to storage', () => {
    const { result } = renderHook(() => useQuotationEntryState(mockStorage));

    act(() => {
      result.current.setMeetingNotes('Important meeting notes to keep');
    });

    act(() => {
      result.current.patchIdentity({
        project_name: 'Patched Name',
        client_id: 'org-patched',
        client_company_name: 'PT Patched',
        pic_name: 'PIC Person',
      });
    });

    expect(result.current.entry).toEqual({
      version: 1,
      project_name: 'Patched Name',
      client_id: 'org-patched',
      client_company_name: 'PT Patched',
      pic_name: 'PIC Person',
      meeting_notes: 'Important meeting notes to keep',
    });
    expect(JSON.parse(mockStorage.getItem(QUOTATION_ENTRY_STORAGE_KEY) || '{}')).toEqual({
      version: 1,
      project_name: 'Patched Name',
      client_id: 'org-patched',
      client_company_name: 'PT Patched',
      pic_name: 'PIC Person',
      meeting_notes: 'Important meeting notes to keep',
    });
  });

  it('setMeetingNotes updates meeting_notes, keeps identity fields, and persists to storage', () => {
    const { result } = renderHook(() => useQuotationEntryState(mockStorage));

    act(() => {
      result.current.patchIdentity({
        project_name: 'Project Alpha',
        client_id: 'org-alpha',
      });
    });

    act(() => {
      result.current.setMeetingNotes('New meeting notes line');
    });

    expect(result.current.entry.meeting_notes).toBe('New meeting notes line');
    expect(result.current.entry.project_name).toBe('Project Alpha');
    expect(result.current.entry.client_id).toBe('org-alpha');
    expect(JSON.parse(mockStorage.getItem(QUOTATION_ENTRY_STORAGE_KEY) || '{}')).toMatchObject({
      project_name: 'Project Alpha',
      client_id: 'org-alpha',
      meeting_notes: 'New meeting notes line',
    });
  });

  it('clear resets entry in memory to EMPTY_QUOTATION_ENTRY and removes key from storage', () => {
    const { result } = renderHook(() => useQuotationEntryState(mockStorage));

    act(() => {
      result.current.setEntry({
        version: 1,
        project_name: 'Project to Clear',
        client_id: 'org-clear',
        client_company_name: 'PT Clear',
        pic_name: 'Clear PIC',
        meeting_notes: 'Clear notes',
      });
    });

    expect(mockStorage.getItem(QUOTATION_ENTRY_STORAGE_KEY)).not.toBeNull();

    act(() => {
      result.current.clear();
    });

    expect(result.current.entry).toEqual(EMPTY_QUOTATION_ENTRY);
    expect(mockStorage.getItem(QUOTATION_ENTRY_STORAGE_KEY)).toBeNull();
  });
});
