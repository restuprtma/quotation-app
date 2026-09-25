import { it, expect, describe, beforeEach } from 'vitest';

import {
  EMPTY_QUOTATION_ENTRY,
  QUOTATION_ENTRY_STORAGE_KEY,
  type QuotationEntryState,
  type QuotationEntryIdentity,
} from '../types/quotation-entry';
import {
  loadQuotationEntryState,
  saveQuotationEntryState,
  clearQuotationEntryState,
  mergeEntryIdentity,
  applyEntryIdentityToSchemeDefaults,
} from './quotation-entry-state';

describe('quotation-entry-state utils', () => {
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

  describe('EMPTY_QUOTATION_ENTRY & constants', () => {
    it('has the expected default empty state', () => {
      expect(EMPTY_QUOTATION_ENTRY).toEqual({
        version: 1,
        project_name: '',
        client_id: '',
        client_company_name: '',
        pic_name: '',
        meeting_notes: '',
      });
      expect(QUOTATION_ENTRY_STORAGE_KEY).toBe('quotation-entry:v1');
    });
  });

  describe('loadQuotationEntryState', () => {
    it('returns EMPTY_QUOTATION_ENTRY when storage is empty', () => {
      expect(loadQuotationEntryState(mockStorage)).toEqual(EMPTY_QUOTATION_ENTRY);
    });

    it('returns EMPTY_QUOTATION_ENTRY when storage contains corrupted JSON', () => {
      mockStorage.setItem(QUOTATION_ENTRY_STORAGE_KEY, '{invalid json');
      expect(loadQuotationEntryState(mockStorage)).toEqual(EMPTY_QUOTATION_ENTRY);
    });

    it('returns EMPTY_QUOTATION_ENTRY when storage contains invalid version or non-object', () => {
      mockStorage.setItem(QUOTATION_ENTRY_STORAGE_KEY, JSON.stringify({ version: 2, project_name: 'Test' }));
      expect(loadQuotationEntryState(mockStorage)).toEqual(EMPTY_QUOTATION_ENTRY);

      mockStorage.setItem(QUOTATION_ENTRY_STORAGE_KEY, JSON.stringify('plain string'));
      expect(loadQuotationEntryState(mockStorage)).toEqual(EMPTY_QUOTATION_ENTRY);

      mockStorage.setItem(QUOTATION_ENTRY_STORAGE_KEY, JSON.stringify(null));
      expect(loadQuotationEntryState(mockStorage)).toEqual(EMPTY_QUOTATION_ENTRY);
    });

    it('returns parsed QuotationEntryState when valid state is present', () => {
      const validState: QuotationEntryState = {
        version: 1,
        project_name: 'Portal Vendor',
        client_id: 'org-1',
        client_company_name: 'PT Acme',
        pic_name: 'Rani',
        meeting_notes: 'Meeting notes content',
      };
      mockStorage.setItem(QUOTATION_ENTRY_STORAGE_KEY, JSON.stringify(validState));
      expect(loadQuotationEntryState(mockStorage)).toEqual(validState);
    });

    it('sanitizes missing or non-string fields to empty strings while preserving valid version', () => {
      mockStorage.setItem(
        QUOTATION_ENTRY_STORAGE_KEY,
        JSON.stringify({
          version: 1,
          project_name: 'Project X',
        })
      );
      expect(loadQuotationEntryState(mockStorage)).toEqual({
        version: 1,
        project_name: 'Project X',
        client_id: '',
        client_company_name: '',
        pic_name: '',
        meeting_notes: '',
      });
    });

    it('handles null / undefined storage safely', () => {
      expect(loadQuotationEntryState(undefined)).toBeDefined();
    });
  });

  describe('saveQuotationEntryState', () => {
    it('persists entry state to storage under QUOTATION_ENTRY_STORAGE_KEY', () => {
      const state: QuotationEntryState = {
        version: 1,
        project_name: 'ERP System',
        client_id: 'org-99',
        client_company_name: 'PT Mega',
        pic_name: 'Budi',
        meeting_notes: 'Scope discussion',
      };
      saveQuotationEntryState(state, mockStorage);
      expect(mockStorage.getItem(QUOTATION_ENTRY_STORAGE_KEY)).toBe(JSON.stringify(state));
    });

    it('does not throw when storage is undefined or throws an error', () => {
      const brokenStorage: Storage = {
        ...mockStorage,
        setItem: () => {
          throw new Error('Quota exceeded');
        },
      };
      expect(() => saveQuotationEntryState(EMPTY_QUOTATION_ENTRY, brokenStorage)).not.toThrow();
      expect(() => saveQuotationEntryState(EMPTY_QUOTATION_ENTRY, undefined)).not.toThrow();
    });
  });

  describe('clearQuotationEntryState', () => {
    it('removes the key from storage', () => {
      mockStorage.setItem(QUOTATION_ENTRY_STORAGE_KEY, JSON.stringify(EMPTY_QUOTATION_ENTRY));
      expect(mockStorage.getItem(QUOTATION_ENTRY_STORAGE_KEY)).not.toBeNull();

      clearQuotationEntryState(mockStorage);
      expect(mockStorage.getItem(QUOTATION_ENTRY_STORAGE_KEY)).toBeNull();
    });

    it('does not throw when storage is undefined', () => {
      expect(() => clearQuotationEntryState(undefined)).not.toThrow();
    });
  });

  describe('mergeEntryIdentity', () => {
    it('merges identity fields without losing meeting_notes and version', () => {
      const initial: QuotationEntryState = {
        version: 1,
        project_name: 'Initial Project',
        client_id: 'client-1',
        client_company_name: 'PT Lama',
        pic_name: 'Andi',
        meeting_notes: 'Catatan meeting penting yang tidak boleh hilang.',
      };

      const patch: Partial<QuotationEntryIdentity> = {
        project_name: 'Updated Project',
        pic_name: 'Rani',
      };

      const merged = mergeEntryIdentity(initial, patch);

      expect(merged).toEqual({
        version: 1,
        project_name: 'Updated Project',
        client_id: 'client-1',
        client_company_name: 'PT Lama',
        pic_name: 'Rani',
        meeting_notes: 'Catatan meeting penting yang tidak boleh hilang.',
      });
    });

    it('leaves undefined patch properties intact', () => {
      const initial: QuotationEntryState = {
        version: 1,
        project_name: 'Alpha',
        client_id: 'id-alpha',
        client_company_name: 'PT Alpha',
        pic_name: 'Alice',
        meeting_notes: 'Notes',
      };

      const merged = mergeEntryIdentity(initial, {});
      expect(merged).toEqual(initial);
    });
  });

  describe('applyEntryIdentityToSchemeDefaults', () => {
    it('maps entry identity fields to scheme defaults correctly', () => {
      const defaults = {
        subject: '',
        client_id: '',
        client_company_name: '',
        client_name: '',
        rate_card_id: 'rc-1',
        duration_months: 6,
      };

      const entry: QuotationEntryState = {
        version: 1,
        project_name: 'Portal Vendor',
        client_id: 'org-1',
        client_company_name: 'PT Acme',
        pic_name: 'Rani',
        meeting_notes: 'Catatan meeting yang tetap disimpan.',
      };

      const mapped = applyEntryIdentityToSchemeDefaults(defaults, entry);

      expect(mapped).toMatchObject({
        subject: 'Portal Vendor',
        client_id: 'org-1',
        client_company_name: 'PT Acme',
        client_name: 'Rani',
        rate_card_id: 'rc-1',
        duration_months: 6,
      });
    });

    it('accepts QuotationEntryIdentity as entry parameter', () => {
      const defaults = {
        subject: '',
        client_id: '',
        client_company_name: '',
        client_name: '',
      };

      const identity: QuotationEntryIdentity = {
        project_name: 'Mobile App',
        client_id: 'org-2',
        client_company_name: 'PT Beta',
        pic_name: 'Doni',
      };

      const mapped = applyEntryIdentityToSchemeDefaults(defaults, identity);

      expect(mapped).toEqual({
        subject: 'Mobile App',
        client_id: 'org-2',
        client_company_name: 'PT Beta',
        client_name: 'Doni',
      });
    });

    it('only overrides existing keys in defaults and preserves extra default keys', () => {
      const defaultsWithoutClientName = {
        subject: 'Default Subject',
        client_id: 'default-org',
        client_company_name: 'Default Org',
        custom_field: 'keep-me',
      };

      const entry: QuotationEntryIdentity = {
        project_name: 'New Subject',
        client_id: 'org-3',
        client_company_name: 'PT Gamma',
        pic_name: 'Eka',
      };

      const mapped = applyEntryIdentityToSchemeDefaults(defaultsWithoutClientName, entry);

      expect(mapped).toEqual({
        subject: 'New Subject',
        client_id: 'org-3',
        client_company_name: 'PT Gamma',
        custom_field: 'keep-me',
      });
      expect(mapped).not.toHaveProperty('client_name');
    });
  });
});
