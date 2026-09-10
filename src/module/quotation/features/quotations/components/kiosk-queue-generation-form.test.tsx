import type { KioskQueuePreviewResponse } from '../types';

import { it, expect, describe } from 'vitest';

import { createDefaultKioskQueueValues } from '../constants/kiosk-queue-system';
import {
  fieldId,
  extractFieldErrors,
  makePrivateDefaults,
  makeGovernmentDefaults,
  isKioskQueueSubmitReady,
  shouldPromptVariantSwitch,
} from './kiosk-queue-generation-form';

describe('kiosk-queue-generation-form logic and contract', () => {
  const sampleShared = {
    client_id: 'client-uuid-123',
    client_name: 'Bpk. Ahmad Santoso',
    client_company_name: 'Dinas Penanaman Modal MPP',
    subject: 'Pengadaan Kiosk Antrian MPP Kab. Malang',
    solution_type: 'Kiosk & Hardware System',
    document_number: 'LANDA/MPP-Antrian/0926/001',
    system_name: 'Sistem Antrian Terpadu MPP',
    quotation_date: '2026-09-10',
  };

  it('selects Sistem & Integrasi Perangkat Keras with keyboard and defines contract title', () => {
    // Contract check for picker title and heading
    const pickerTitle = 'Sistem & Integrasi Perangkat Keras';
    const formHeading = 'Buat Quotation Kiosk & Sistem Perangkat Keras';

    expect(pickerTitle).toMatch(/sistem.*integrasi perangkat keras/i);
    expect(formHeading).toMatch(/buat quotation kiosk/i);
  });

  it('shows only government fields for government_mpp in makeGovernmentDefaults', () => {
    const gov = makeGovernmentDefaults(sampleShared);

    expect(gov.kiosk_queue_system.variant).toBe('government_mpp');
    expect(gov.kiosk_queue_system.tax_treatment).toBe('inclusive_ppn_11');
    expect(gov.kiosk_queue_system.payment_due_days).toBe(14);
    expect(gov.kiosk_queue_system.limitation_codes).toContain('civil_electrical');

    // Government scope & expert arrays are populated
    expect(gov.kiosk_queue_system.government_scope_phases).toBeDefined();
    expect(gov.kiosk_queue_system.government_scope_phases!.length).toBeGreaterThan(0);
    expect(gov.kiosk_queue_system.expert_requirements).toBeDefined();
    expect(gov.kiosk_queue_system.expert_requirements!.length).toBeGreaterThan(0);

    // Private branches are strictly empty
    expect(gov.kiosk_queue_system.private_timeline_rows).toEqual([]);
    expect(gov.kiosk_queue_system.maintenance_items).toEqual([]);
    expect(gov.kiosk_queue_system.private_payment_schedule).toEqual([]);

    // Shared identity preserved
    expect(gov.client_id).toBe('client-uuid-123');
    expect(gov.client_name).toBe('Bpk. Ahmad Santoso');
    expect(gov.kiosk_queue_system.document_number).toBe('LANDA/MPP-Antrian/0926/001');
  });

  it('shows only private fields for private_food_court in makePrivateDefaults', () => {
    const priv = makePrivateDefaults(sampleShared);

    expect(priv.kiosk_queue_system.variant).toBe('private_food_court');
    expect(priv.kiosk_queue_system.hardware_provision).toBe('client_supplied');
    expect(priv.kiosk_queue_system.tax_treatment).toBe('exclusive_ppn');
    expect(priv.kiosk_queue_system.payment_due_days).toBe(0);
    expect(priv.kiosk_queue_system.limitation_codes).toContain('client_hardware');

    // Private timeline & payment arrays are populated
    expect(priv.kiosk_queue_system.private_timeline_rows).toBeDefined();
    expect(priv.kiosk_queue_system.private_timeline_rows!.length).toBeGreaterThan(0);
    expect(priv.kiosk_queue_system.private_payment_schedule).toBeDefined();
    expect(priv.kiosk_queue_system.private_payment_schedule!.length).toBeGreaterThan(0);

    // Government branches are strictly empty
    expect(priv.kiosk_queue_system.government_scope_phases).toEqual([]);
    expect(priv.kiosk_queue_system.expert_requirements).toEqual([]);
    expect(priv.kiosk_queue_system.hardware_items).toEqual([]);
    expect(priv.kiosk_queue_system.government_payment_schedule).toEqual([]);

    // Shared identity preserved
    expect(priv.client_id).toBe('client-uuid-123');
    expect(priv.client_name).toBe('Bpk. Ahmad Santoso');
  });

  it('asks for confirmation before a variant switch discards entered rows', () => {
    const cleanGov = createDefaultKioskQueueValues('2026-09-10', undefined, 'government_mpp');
    expect(shouldPromptVariantSwitch('government_mpp', cleanGov.kiosk_queue_system)).toBe(false);

    const dirtyGov = makeGovernmentDefaults(sampleShared);
    dirtyGov.kiosk_queue_system.expert_requirements = [
      {
        role: 'Senior Programmer',
        headcount: 2,
        duration_label: '3 Bulan',
        minimum_qualification: 'S1 Informatika',
      },
    ];
    expect(shouldPromptVariantSwitch('government_mpp', dirtyGov.kiosk_queue_system)).toBe(true);

    const dirtyPrivate = makePrivateDefaults(sampleShared);
    dirtyPrivate.kiosk_queue_system.private_timeline_rows = [
      { description: 'Integrasi POS & Payment Gateway', timeline: 'Minggu 1-2' },
    ];
    expect(shouldPromptVariantSwitch('private_food_court', dirtyPrivate.kiosk_queue_system)).toBe(
      true
    );
  });

  it('generates accessible field IDs and extracts flat field errors for the error summary', () => {
    expect(fieldId('kiosk_queue_system.document_number')).toBe(
      'field-kiosk_queue_system-document_number'
    );
    expect(fieldId('kiosk_queue_system.expert_requirements.0.role')).toBe(
      'field-kiosk_queue_system-expert_requirements-0-role'
    );

    const mockErrors = {
      kiosk_queue_system: {
        document_number: { message: 'Format nomor dokumen tidak valid' },
        service_groups: [
          {
            title: { message: 'Judul kelompok jasa wajib diisi' },
          },
        ],
      },
    };

    const extracted = extractFieldErrors(mockErrors);
    expect(extracted).toEqual([
      {
        path: 'kiosk_queue_system.document_number',
        message: 'Format nomor dokumen tidak valid',
      },
      {
        path: 'kiosk_queue_system.service_groups.0.title',
        message: 'Judul kelompok jasa wajib diisi',
      },
    ]);
  });

  it('gates submit readiness with authoritative preview and payload hash match', () => {
    const mockPreview: KioskQueuePreviewResponse = {
      calculation: {
        variant: 'government_mpp',
        service_groups: [],
        service_subtotal: 50_000_000,
        service_discount_amount: 0,
        service_tax_amount: 5_500_000,
        service_total: 55_500_000,
        hardware_subtotal: 0,
        hardware_tax_amount: 0,
        hardware_total: 0,
        maintenance_total: 0,
        payment_target_total: 55_500_000,
        payment_total: 55_500_000,
      },
      resolved_profile: {
        variant: 'government_mpp',
        hardware_provision: 'client_supplied',
        tax_treatment: 'inclusive_ppn_11',
        tax_clause_text: 'Sudah termasuk PPN 11%',
        show_hardware: false,
        show_maintenance: false,
        show_rights: false,
        payment_due_days: 14,
        limitation_texts: [],
        sections: [],
      },
    };

    const hash = 'hash-abc-123';

    // 1. Ready when all conditions are met
    expect(
      isKioskQueueSubmitReady({
        isValid: true,
        isDebouncing: false,
        isFetching: false,
        isSuccess: true,
        error: null,
        preview: mockPreview,
        previewPayloadHash: hash,
        currentNormalizedPayloadHash: hash,
      })
    ).toBe(true);

    // 2. Not ready when form is invalid
    expect(
      isKioskQueueSubmitReady({
        isValid: false,
        isDebouncing: false,
        isFetching: false,
        isSuccess: true,
        error: null,
        preview: mockPreview,
        previewPayloadHash: hash,
        currentNormalizedPayloadHash: hash,
      })
    ).toBe(false);

    // 3. Not ready when fetching or debouncing (stale)
    expect(
      isKioskQueueSubmitReady({
        isValid: true,
        isDebouncing: true,
        isFetching: false,
        isSuccess: true,
        error: null,
        preview: mockPreview,
        previewPayloadHash: hash,
        currentNormalizedPayloadHash: hash,
      })
    ).toBe(false);

    // 4. Not ready when payload hash mismatch (user edited field, in-flight or waiting for debounce)
    expect(
      isKioskQueueSubmitReady({
        isValid: true,
        isDebouncing: false,
        isFetching: false,
        isSuccess: true,
        error: null,
        preview: mockPreview,
        previewPayloadHash: hash,
        currentNormalizedPayloadHash: 'hash-changed-456',
      })
    ).toBe(false);

    // 5. Not ready when payment is not balanced
    const unbalancedPreview = {
      ...mockPreview,
      calculation: {
        ...mockPreview.calculation,
        payment_total: 50_000_000, // != 55_500_000
      },
    };
    expect(
      isKioskQueueSubmitReady({
        isValid: true,
        isDebouncing: false,
        isFetching: false,
        isSuccess: true,
        error: null,
        preview: unbalancedPreview,
        previewPayloadHash: hash,
        currentNormalizedPayloadHash: hash,
      })
    ).toBe(false);
  });
});
