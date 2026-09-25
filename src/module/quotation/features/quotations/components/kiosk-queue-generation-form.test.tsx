// @vitest-environment happy-dom
import type { KioskQueuePreviewResponse } from '../types';

import { MemoryRouter } from 'react-router';
import userEvent from '@testing-library/user-event';
import { vi, it, expect, describe, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@mui/x-data-grid', () => ({
  gridClasses: {},
}));

vi.mock('src/layouts/dashboard', () => ({
  DashboardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('src/shared/ui/iconify', () => ({
  Iconify: ({
    icon,
    className,
    ...other
  }: {
    icon: string;
    className?: string;
    [key: string]: unknown;
  }) => <span className={className} data-icon={icon} {...other} />,
  iconifyClasses: { root: 'base-iconify' },
}));

vi.mock('../hooks/use-clients', () => ({
  useClients: () => ({
    data: [{ id: 'client-1', name: 'Dinas Penanaman Modal MPP', pic_name: 'Bpk. Ahmad' }],
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('../hooks/use-active-skills', () => ({
  useActiveSkills: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('src/locales', () => ({
  useTranslate: () => ({
    t: (key: string, optionsOrDefault?: string | { defaultValue?: string }) => {
      if (typeof optionsOrDefault === 'string') return optionsOrDefault;
      if (
        optionsOrDefault &&
        typeof optionsOrDefault === 'object' &&
        optionsOrDefault.defaultValue
      ) {
        return optionsOrDefault.defaultValue;
      }
      return key;
    },
    i18n: { resolvedLanguage: 'id', changeLanguage: vi.fn() },
    currentLang: { value: 'id', label: 'Bahasa Indonesia' },
    onChangeLang: vi.fn(),
    onResetLang: vi.fn(),
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../hooks/use-quotation-generation', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useKioskQueuePreview: vi.fn(() => ({
      data: undefined,
      isLoading: false,
      isError: false,
      isDebouncing: false,
    })),
    useGenerateQuotation: vi.fn(() => ({
      mutateAsync: vi.fn(),
      isPending: false,
    })),
  };
});

vi.mock('../api', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    previewKioskQueueSystem: vi.fn().mockResolvedValue(null),
    generateQuotation: vi.fn().mockResolvedValue(null),
  };
});

import { createTheme, ThemeProvider } from '@mui/material/styles';

import { I18nProvider } from 'src/locales';

import { QuotationPromptView } from '../views/quotation-prompt-view';
import { createDefaultKioskQueueValues } from '../constants/kiosk-queue-system';
import {
  fieldId,
  extractFieldErrors,
  makePrivateDefaults,
  makeGovernmentDefaults,
  isKioskQueueSubmitReady,
  KioskQueueGenerationForm,
  shouldPromptVariantSwitch,
} from './kiosk-queue-generation-form';

// ----------------------------------------------------------------------
// Test Providers & Helpers
// ----------------------------------------------------------------------

const theme = createTheme();

function createTestQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  queryClient.setQueryData(['ai-skills', 'active'], []);
  queryClient.setQueryData(
    ['clients', 'list'],
    [{ id: 'client-1', name: 'Dinas Penanaman Modal MPP', pic_name: 'Bpk. Ahmad' }]
  );
  return queryClient;
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider theme={theme}>
          <MemoryRouter>{ui}</MemoryRouter>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

function renderKioskForm(options: {
  variant: 'government_mpp' | 'private_food_court';
  dirty?: boolean;
}) {
  const initial =
    options.variant === 'government_mpp'
      ? makeGovernmentDefaults({
          client_name: 'Bpk. Ahmad Santoso',
          document_number: 'LANDA/MPP-Antrian/0926/001',
        })
      : makePrivateDefaults({
          client_name: 'Bpk. Ahmad Santoso',
        });

  if (options.dirty && options.variant === 'government_mpp') {
    initial.kiosk_queue_system.expert_requirements = [
      {
        role: 'Senior Programmer',
        headcount: 2,
        duration_label: '3 Bulan',
        minimum_qualification: 'S1 Informatika',
      },
    ];
  }

  return renderWithProviders(
    <KioskQueueGenerationForm initialValues={initial} onSubmit={() => {}} onCancel={() => {}} />
  );
}

// ----------------------------------------------------------------------

describe('kiosk-queue-generation-form RTL interaction and contract', () => {
  afterEach(() => {
    cleanup();
  });

  it('selects Sistem & Integrasi Perangkat Keras with keyboard', async () => {
    renderWithProviders(<QuotationPromptView />);
    await userEvent.click(screen.getByRole('button', { name: /advanced/i }));

    const card = await screen.findByRole('button', { name: /sistem.*integrasi perangkat keras/i });
    card.focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { name: /buat quotation kiosk/i })).toBeDefined();
  }, 15_000);

  it('pre-fills entryIdentity and triggers onEntryIdentityChange on input', async () => {
    const onEntryIdentityChange = vi.fn();
    renderWithProviders(
      <KioskQueueGenerationForm
        onSubmit={() => {}}
        onCancel={() => {}}
        entryIdentity={{
          project_name: 'Antrian MPP Kabupaten',
          client_id: 'client-uuid-mpp',
          client_company_name: 'Dinas Penanaman Modal',
          pic_name: 'Budi PPK',
        }}
        onEntryIdentityChange={onEntryIdentityChange}
      />
    );

    const subjectInput = screen.getByDisplayValue('Antrian MPP Kabupaten');
    expect(subjectInput).toBeDefined();

    fireEvent.change(subjectInput, { target: { value: 'Antrian MPP Terpadu 2026' } });
    await waitFor(() => {
      expect(onEntryIdentityChange).toHaveBeenCalledWith(
        expect.objectContaining({
          project_name: 'Antrian MPP Terpadu 2026',
        })
      );
    });
  });

  it('shows only government fields for government_mpp', () => {
    renderKioskForm({ variant: 'government_mpp' });
    expect(screen.getByText(/kebutuhan tenaga ahli/i)).toBeDefined();
    expect(screen.queryByText(/timeline swasta/i)).toBeNull();
  });

  it('asks for confirmation before a variant switch discards entered rows', async () => {
    renderKioskForm({ variant: 'government_mpp', dirty: true });
    await userEvent.click(screen.getByRole('radio', { name: /korporasi swasta/i }));
    expect(await screen.findByRole('dialog', { name: /ganti varian/i })).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: /batal/i }));
    expect(screen.getAllByDisplayValue('Senior Programmer').length).toBeGreaterThan(0);
  }, 15_000);

  it('switches variant and clears branch-only arrays when confirmed', async () => {
    renderKioskForm({ variant: 'government_mpp', dirty: true });
    await userEvent.click(screen.getByRole('radio', { name: /korporasi swasta/i }));
    expect(await screen.findByRole('dialog', { name: /ganti varian/i })).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: /lanjutkan ganti varian/i }));
    expect((await screen.findAllByText(/timeline swasta/i)).length).toBeGreaterThan(0);
    expect(screen.queryByText(/kebutuhan tenaga ahli/i)).toBeNull();
  }, 15_000);

  describe('contract helpers and calculation readiness', () => {
    const sampleShared = {
      client_id: 'client-uuid-123',
      client_name: 'Bpk. Ahmad Santoso',
      client_company_name: 'Dinas Penanaman Modal MPP',
      subject: 'Pengadaan Kiosk Antrian MPP Kab. Malang',
      solution_type: 'Sistem Antrian (Queue Management)',
      document_number: 'LANDA/MPP-Antrian/0926/001',
      system_name: 'Sistem Antrian Terpadu MPP',
      quotation_date: '2026-09-10',
    };

    it('shows only government fields for government_mpp in makeGovernmentDefaults', () => {
      const defaultGov = makeGovernmentDefaults();
      expect(defaultGov.solution_type).toBe('Sistem Antrian (Queue Management)');

      const gov = makeGovernmentDefaults(sampleShared);
      expect(gov.solution_type).toBe('Sistem Antrian (Queue Management)');

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
      const defaultPriv = makePrivateDefaults();
      expect(defaultPriv.solution_type).toBe('Kiosk Application');

      const priv = makePrivateDefaults(sampleShared);
      expect(priv.solution_type).toBe('Sistem Antrian (Queue Management)');

      const customPriv = makePrivateDefaults({
        ...sampleShared,
        solution_type: 'Custom Software Solution',
      });
      expect(customPriv.solution_type).toBe('Custom Software Solution');

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
});
