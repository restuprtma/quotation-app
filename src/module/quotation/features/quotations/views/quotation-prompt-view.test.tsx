// @vitest-environment happy-dom

import { vi, it, expect, describe, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import idQuotation from 'src/locales/langs/id/quotation.json';
import { paths } from 'src/routes/paths';
import { QuotationPromptView } from './quotation-prompt-view';
import * as promptFirstApi from '../api/prompt-first';
import * as generationApi from '../api/generation';
import { QUOTATION_ENTRY_STORAGE_KEY } from '../types/quotation-entry';

// ----------------------------------------------------------------------

const { mockClients, mockGenerateQuotation, mockCreateQuotationFromMeeting, mockGetClients } =
  vi.hoisted(() => ({
    mockClients: [
      { id: 'client-1', name: 'PT Alpha Digital', pic_name: 'Bpk. Budi' },
      { id: 'client-2', name: 'CV Beta Solusi', pic_name: 'Ibu Siti' },
    ],
    mockGenerateQuotation: vi.fn(),
    mockCreateQuotationFromMeeting: vi.fn(),
    mockGetClients: vi.fn(),
  }));

vi.mock('../api', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    generateQuotation: mockGenerateQuotation,
    createQuotationFromMeeting: mockCreateQuotationFromMeeting,
    getClients: mockGetClients,
  };
});

vi.mock('../api/prompt-first', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    createQuotationFromMeeting: mockCreateQuotationFromMeeting,
  };
});

vi.mock('../api/generation', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    generateQuotation: mockGenerateQuotation,
    getClients: mockGetClients,
  };
});

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

vi.mock('../hooks/use-active-skills', () => ({
  useActiveSkills: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('../hooks/use-active-rate-cards', () => ({
  useActiveRateCards: () => ({
    data: [
      {
        id: 'rc-1',
        code: 'DEFAULT',
        name: 'Standard Rate Card',
        currency: 'IDR',
        is_active: true,
        roles: [{ role: 'frontend_programmer', seniority: 'intermediate', daily_rate: 1000000 }],
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('../../rate-cards/hooks/use-rate-cards', () => ({
  useRateCardDetail: () => ({
    data: {
      id: 'rc-1',
      name: 'Standard Rate Card',
      currency: 'IDR',
      roles: [{ role: 'frontend_programmer', seniority: 'intermediate', daily_rate: 1000000 }],
    },
    isLoading: false,
  }),
}));

vi.mock('../hooks/use-quotation-generation', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useDedicatedSquadPreview: () => ({
      data: {
        calculation: {
          preparation: { gross: 0, discount: 0, total: 0 },
          development: { gross: 10_000_000, discount: 0, total: 10_000_000 },
          maintenance: { gross: 0, discount: 0, total: 0 },
          gross_total: 10_000_000,
          discount_total: 0,
          subtotal: 10_000_000,
          total_investment: 10_000_000,
          tax_amount: 1_100_000,
          grand_total: 11_100_000,
          discount_amount: 0,
          net_subtotal: 10_000_000,
          maintenance_subtotal: 0,
          payments: [
            {
              invoice_date: '2026-10-01',
              work_period: 'Bulan 1',
              percentage: 100,
              amount: 11_100_000,
              terms: 'DP 100%',
              status: 'pending',
              is_overdue: false,
              notes: '',
            },
          ],
        },
        resolved_profile: {
          document_options: {
            letter_prefix: 'CTH',
            tax_treatment: 'exclusive_ppn',
          },
        },
        visible_sections: [{ number: '1', title: 'Scope' }],
      },
      isLoading: false,
      isFetching: false,
      isDebouncing: false,
      error: null,
    }),
    useKioskQueuePreview: () => ({ data: undefined, isLoading: false, isError: false }),
    useCloudInfrastructurePreview: () => ({ data: undefined, isLoading: false, isError: false }),
  };
});

function createTestI18n() {
  const instance = i18n.createInstance();
  instance.use(initReactI18next).init({
    lng: 'id',
    fallbackLng: 'id',
    ns: ['quotation'],
    defaultNS: 'quotation',
    resources: {
      id: { quotation: idQuotation },
    },
    interpolation: { escapeValue: false },
  });
  return instance;
}

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-display">{`${location.pathname}${location.search}`}</div>;
}

function renderView(initialEntries: string[] = ['/quotation']) {
  const i18nInstance = createTestI18n();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  queryClient.setQueryData(['quotation', 'clients'], mockClients);
  queryClient.setQueryData(['clients', 'list'], mockClients);

  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18nInstance}>
        <ThemeProvider theme={createTheme()}>
          <MemoryRouter initialEntries={initialEntries}>
            <LocationDisplay />
            <Routes>
              <Route path="/quotation" element={<QuotationPromptView />} />
              <Route path="/quotation/:id/edit" element={<div>Editor Page</div>} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

describe('QuotationPromptView URL orchestration and Prompt First', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    mockGetClients.mockResolvedValue(mockClients);
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it('renders MeetingNotesForm on default route /quotation without slash command launcher or quick skill chips', () => {
    renderView(['/quotation']);

    // Should render MeetingNotesForm fields
    expect(screen.getByRole('textbox', { name: /Judul Proyek \/ Subjek Proposal/i })).toBeDefined();
    expect(screen.getByRole('combobox', { name: /Perusahaan \/ Organisasi Klien/i })).toBeDefined();
    expect(screen.getByRole('textbox', { name: /Catatan Meeting/i })).toBeDefined();

    // Obsolete slash command launcher & chips elements should NOT be present
    expect(screen.queryByPlaceholderText(/Ketik \/ untuk memilih AI Skill/i)).toBeNull();
    expect(screen.queryByText('/quotation — Quotation Generator')).toBeNull();
    expect(screen.queryByText('/blueprint — System Blueprint')).toBeNull();
  });

  it('navigates to /quotation?view=advanced and renders CommercialSchemeSelector when clicking Pengaturan Lanjutan', async () => {
    renderView(['/quotation']);

    const advancedBtn = screen.getByRole('button', { name: /Pengaturan Lanjutan/i });
    await userEvent.click(advancedBtn);

    expect(screen.getByTestId('location-display').textContent).toBe('/quotation?view=advanced');
    expect(screen.getByRole('heading', { name: /Pilih Skema Layanan/i })).toBeDefined();
  });

  it('navigates back to /quotation from CommercialSchemeSelector and preserves entered meeting notes identity', async () => {
    renderView(['/quotation']);

    // Fill in some fields
    const projectInput = screen.getByRole('textbox', { name: /Judul Proyek \/ Subjek Proposal/i });
    fireEvent.change(projectInput, { target: { value: 'Sistem Payroll Enterprise' } });

    // Click advanced
    const advancedBtn = screen.getByRole('button', { name: /Pengaturan Lanjutan/i });
    await userEvent.click(advancedBtn);
    expect(screen.getByTestId('location-display').textContent).toBe('/quotation?view=advanced');

    // Click back to prompt
    const backBtn = screen.getByRole('button', { name: /Kembali ke Prompt/i });
    await userEvent.click(backBtn);

    expect(screen.getByTestId('location-display').textContent).toBe('/quotation');
    expect(screen.getByDisplayValue('Sistem Payroll Enterprise')).toBeDefined();
  });

  it('navigates to specific scheme form when selecting a commercial scheme in selector and prefills identity', async () => {
    // Save entry state into sessionStorage beforehand
    sessionStorage.setItem(
      QUOTATION_ENTRY_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        project_name: 'Migrasi Cloud AWS',
        client_id: 'client-1',
        client_company_name: 'PT Alpha Digital',
        pic_name: 'Bpk. Budi',
        meeting_notes: 'Kebutuhan migrasi 20 server ke AWS.',
      })
    );

    renderView(['/quotation?view=advanced']);

    const schemeCard = screen.getByRole('button', { name: /Infrastruktur Cloud/i });
    await userEvent.click(schemeCard);

    expect(screen.getByTestId('location-display').textContent).toBe(
      paths.dashboard.quotation.advancedScheme('cloud_infrastructure')
    );
    expect(screen.getByRole('heading', { name: /Infrastruktur Cloud/i })).toBeDefined();

    // Identity should be prefilled
    expect(screen.getByDisplayValue('Migrasi Cloud AWS')).toBeDefined();
  });

  it('navigates back to /quotation?view=advanced when cancelling or clicking back in scheme form', async () => {
    renderView(['/quotation?view=advanced&scheme=dedicated_squad']);

    expect(screen.getByRole('heading', { name: /Inisiasi Proposal Dedicated Squad/i })).toBeDefined();

    const backBtn = screen.getByRole('button', { name: /Ganti Skema Layanan/i });
    await userEvent.click(backBtn);

    expect(screen.getByTestId('location-display').textContent).toBe('/quotation?view=advanced');
    expect(screen.getByRole('heading', { name: /Pilih Skema Layanan/i })).toBeDefined();
  });

  it('replaces invalid scheme parameter with ?view=advanced and displays CommercialSchemeSelector', async () => {
    renderView(['/quotation?view=advanced&scheme=invalid_scheme_xyz']);

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/quotation?view=advanced');
    });
    expect(screen.getByRole('heading', { name: /Pilih Skema Layanan/i })).toBeDefined();
  });

  it('submits MeetingNotesForm, navigates to quotation edit page, and clears entry session', async () => {
    const mockResponse = {
      quotation_id: 'quotation-uuid-101',
      issues: [],
    };
    mockCreateQuotationFromMeeting.mockResolvedValue(mockResponse as any);

    // Seed session state
    sessionStorage.setItem(
      QUOTATION_ENTRY_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        project_name: 'Aplikasi ERP Logistik',
        client_id: 'client-1',
        client_company_name: 'PT Alpha Digital',
        pic_name: 'Bpk. Budi',
        meeting_notes: 'Meeting kick-off mengenai modul inventori dan tracking armada pengiriman.',
      })
    );

    renderView(['/quotation']);

    const submitBtn = screen.getByRole('button', { name: /Buat Draf/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateQuotationFromMeeting).toHaveBeenCalledWith(
        expect.objectContaining({
          project_name: 'Aplikasi ERP Logistik',
          client_id: 'client-1',
          client_company_name: 'PT Alpha Digital',
          meeting_notes: 'Meeting kick-off mengenai modul inventori dan tracking armada pengiriman.',
        }),
        expect.anything()
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/quotation/quotation-uuid-101/edit');
    });

    // Session storage should be cleared
    const stored = sessionStorage.getItem(QUOTATION_ENTRY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.project_name).toBe('');
      expect(parsed.meeting_notes).toBe('');
    }
  });

  it('submits advanced scheme generation form, navigates to quotation edit page, and clears entry session', async () => {
    const mockGenerateResponse = {
      quotation_id: 'gen-uuid-202',
      status: 'success',
      data: {} as any,
    };
    mockGenerateQuotation.mockResolvedValue(mockGenerateResponse as any);

    // Save entry state beforehand
    sessionStorage.setItem(
      QUOTATION_ENTRY_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        project_name: 'Squad E-Commerce Portal',
        client_id: 'client-1',
        client_company_name: 'PT Alpha Digital',
        pic_name: 'Bpk. Budi',
        meeting_notes: '',
      })
    );

    renderView(['/quotation?view=advanced&scheme=dedicated_squad']);

    expect(screen.getByRole('heading', { name: /Inisiasi Proposal Dedicated Squad/i })).toBeDefined();

    // Fill requirement text
    const reqInput = screen.getByPlaceholderText(/Jelaskan kebutuhan, tujuan bisnis/i);
    fireEvent.change(reqInput, { target: { value: 'Kebutuhan squad programmer dedicated frontend dan backend.' } });

    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockGenerateQuotation).toHaveBeenCalledWith(
        expect.objectContaining({
          commercial_scheme: 'dedicated_squad',
          subject: 'Squad E-Commerce Portal',
        })
      );
    });

    await waitFor(
      () => {
        expect(screen.getByTestId('location-display').textContent).toBe('/quotation/gen-uuid-202/edit');
      },
      { timeout: 5000 }
    );

    // Session storage should be cleared
    const stored = sessionStorage.getItem(QUOTATION_ENTRY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.project_name).toBe('');
    }
  });
});
