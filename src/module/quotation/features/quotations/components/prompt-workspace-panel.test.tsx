// @vitest-environment happy-dom

import type { CatalogRoleOption, PromptQuotationState } from '../types/prompt-first';

import { it, vi, expect, describe, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { PromptWorkspacePanel } from './prompt-workspace-panel';

const copy = {
  title: 'Quotation workspace',
  open: 'Open quotation workspace',
  close: 'Close workspace',
  facts: 'Facts and assumptions',
  issues: 'Needs attention',
  blocking: 'Blocking',
  warning: 'Warning',
  duration: 'Duration (months)',
  team: 'Team',
  role: 'Role from catalog',
  seniority: 'Seniority',
  headcount: 'Headcount',
  payment: 'Payment pattern',
  discount: 'Additional discount (%)',
  initialTotal: 'Initial total',
  discountedTotal: 'Discounted total',
  priceUnavailable: 'Harga belum tersedia',
  subscriptionDetails: 'Subscription details',
  subscriptionProduct: 'Product',
  subscriptionTerm: 'Initial term (months)',
  subscriptionBilling: 'Billing cycle',
  subscriptionFeatures: 'Included features',
  totalContract: 'Total contract',
  whiteLabelDetails: 'White-label details',
  whiteLabelProduct: 'Licensed product',
  whiteLabelLicenses: 'License items',
  whiteLabelMaintenance: 'Maintenance items',
  whiteLabelHosting: 'Hosting items',
  whiteLabelRights: 'Rights and scope',
  maintenanceDetails: 'Maintenance details',
  maintenanceSystem: 'Target system',
  maintenanceMode: 'Maintenance mode',
  maintenanceRetainerItems: 'Retainer items',
  maintenanceHourlyItems: 'Hourly items',
  maintenanceDefects: 'Defects',
  maintenanceTasks: 'Hourly tasks',
  maintenanceRights: 'Rights and scope',
  totalInvestment: 'Total investment',
  reload: 'Reload',
  compare: 'Compare local changes',
};

const catalogRoles: CatalogRoleOption[] = [
  {
    rate_item_id: 'catalog-programmer-intermediate',
    role: 'backend_programmer',
    display_name: 'Backend Programmer',
    seniority: 'intermediate',
    term_type: 'long_term',
  },
];

function state(overrides: Partial<PromptQuotationState> = {}): PromptQuotationState {
  return {
    schema_version: 'prompt_quotation_v1',
    meeting_notes: 'Need an inventory application.',
    client_name: { value: 'Nadia', source: 'meeting', evidence: 'Nadia', confirmed: false },
    client_company: { value: 'PT Arunika', source: 'catalog', confirmed: false },
    project_name: { value: 'Arunika Inventory', source: 'suggestion', confirmed: false },
    payment_pattern: { value: '50:50', source: 'user', confirmed: true },
    scope: [],
    duration_months: { value: 3, source: 'meeting', evidence: 'three months', confirmed: false },
    team: [
      {
        requested_role: 'unknown programmer',
        seniority: 'intermediate',
        headcount_quarters: 8,
        period_quarters: 12,
        source: 'meeting',
        evidence: 'two programmers',
        confirmed: false,
      },
    ],
    issues: [
      {
        code: 'team.rate_unresolved',
        field: 'team[0]',
        message: 'Select a catalog role.',
        severity: 'blocking',
      },
      {
        code: 'scope.empty',
        field: 'scope',
        message: 'Scope is an assumption.',
        severity: 'warning',
      },
    ],
    readiness: 'incomplete',
    ...overrides,
  };
}

describe('PromptWorkspacePanel', () => {
  afterEach(cleanup);

  it('shows provenance, blocking and warning issues, and hides price while incomplete', () => {
    render(
      <PromptWorkspacePanel
        state={state()}
        calculation={undefined}
        catalogRoles={catalogRoles}
        pending={false}
        copy={copy}
        onPatch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: copy.open }));

    expect(screen.getAllByText('meeting').length).toBeGreaterThan(0);
    expect(screen.getByText('catalog')).toBeTruthy();
    expect(screen.getByText('suggestion')).toBeTruthy();
    expect(screen.getByText('user')).toBeTruthy();
    expect(screen.getByText('Blocking')).toBeTruthy();
    expect(screen.getByText('Warning')).toBeTruthy();
    expect(screen.getByText('Harga belum tersedia')).toBeTruthy();
    expect(
      screen.getByRole('spinbutton', { name: /additional discount/i }).hasAttribute('disabled')
    ).toBe(true);
  });

  it('shows initial and discounted server totals and confirms a selected catalog role as user input', () => {
    const onPatch = vi.fn();
    const priceableState = state({ issues: [], readiness: 'priceable' });
    priceableState.team.push({
      requested_role: 'business_analyst',
      resolved_rate_item_id: 'catalog-ba',
      seniority: 'senior',
      headcount_quarters: 4,
      period_quarters: 12,
      source: 'catalog',
      confirmed: false,
    });
    render(
      <PromptWorkspacePanel
        state={priceableState}
        calculation={{
          total_before_discount: 10_000_000,
          additional_discount: 500_000,
          total_investment: 9_500_000,
          discount: 0,
          payments: [],
        }}
        catalogRoles={catalogRoles}
        pending={false}
        copy={copy}
        onPatch={onPatch}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: copy.open }));

    expect(screen.getByText(/Initial total/i).parentElement?.textContent).toMatch(/10\.000\.000/);
    expect(screen.getByText(/Discounted total/i).parentElement?.textContent).toMatch(/9\.500\.000/);

    fireEvent.mouseDown(screen.getAllByRole('combobox', { name: /role from catalog/i })[0]);
    fireEvent.click(screen.getByRole('option', { name: 'Backend Programmer' }));

    expect(onPatch).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'set_team',
        team: [
          expect.objectContaining({
            requested_role: 'backend_programmer',
            resolved_rate_item_id: 'catalog-programmer-intermediate',
            source: 'user',
            confirmed: true,
          }),
          expect.objectContaining({ requested_role: 'business_analyst' }),
        ],
      }),
    ]);
  });

  it('offers compare and reload actions after a conflict without changing local state', () => {
    const onCompare = vi.fn();
    const onReload = vi.fn();
    render(
      <PromptWorkspacePanel
        state={state()}
        calculation={undefined}
        catalogRoles={catalogRoles}
        pending={false}
        copy={copy}
        onPatch={vi.fn()}
        conflict
        onCompare={onCompare}
        onReload={onReload}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: copy.open }));
    fireEvent.click(screen.getByRole('button', { name: copy.compare }));
    fireEvent.click(screen.getByRole('button', { name: copy.reload }));

    expect(onCompare).toHaveBeenCalledOnce();
    expect(onReload).toHaveBeenCalledOnce();
  });

  it('shows SaaS facts without rendering dedicated-team controls and keeps generic issues visible', () => {
    render(
      <PromptWorkspacePanel
        state={state({
          commercial_scheme: {
            value: 'subscription_saas',
            source: 'meeting',
            evidence: 'subscription',
            confirmed: false,
          },
          team: [],
          service_input: {
            kind: 'subscription_saas_v1',
            product_name: {
              value: 'Venturo Print',
              source: 'meeting',
              evidence: 'Venturo Print',
              confirmed: false,
            },
            initial_term_months: {
              value: 12,
              source: 'meeting',
              evidence: '12 months',
              confirmed: false,
            },
            billing_cycle: {
              value: 'quarterly',
              source: 'meeting',
              evidence: 'quarterly',
              confirmed: false,
            },
            feature_groups: [
              {
                name: { value: 'Core', source: 'meeting', evidence: 'Core', confirmed: false },
                features: [
                  {
                    value: 'Order management',
                    source: 'meeting',
                    evidence: 'Order management',
                    confirmed: false,
                  },
                ],
              },
            ],
          },
          issues: [
            {
              code: 'subscription.monthly_rate.unavailable',
              field: 'price_periods[0].monthly_rate',
              message: 'price is not available',
              severity: 'blocking',
            },
          ],
        })}
        calculation={undefined}
        catalogRoles={catalogRoles}
        pending={false}
        copy={copy}
        onPatch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: copy.open }));

    expect((screen.getByLabelText(copy.subscriptionProduct) as HTMLInputElement).value).toBe(
      'Venturo Print'
    );
    expect((screen.getByLabelText(copy.subscriptionTerm) as HTMLInputElement).value).toBe('12');
    expect((screen.getByLabelText(copy.subscriptionBilling) as HTMLInputElement).value).toBe(
      'quarterly'
    );
    expect(screen.getByText('Order management')).toBeTruthy();
    expect(screen.queryByLabelText(copy.duration)).toBeNull();
    expect(screen.queryByLabelText(copy.role)).toBeNull();
    expect(screen.getByText('Blocking')).toBeTruthy();
    expect(screen.getByText(copy.priceUnavailable)).toBeTruthy();
  });

  it('shows white-label license and rights facts without dedicated-team controls', () => {
    render(
      <PromptWorkspacePanel
        state={state({
          commercial_scheme: {
            value: 'white_label',
            source: 'meeting',
            evidence: 'white label',
            confirmed: false,
          },
          team: [],
          service_input: {
            kind: 'white_label_v1',
            product_name: {
              value: 'POS Mini Market',
              source: 'meeting',
              evidence: 'POS Mini Market',
              confirmed: false,
            },
            license_items: [
              {
                name: {
                  value: 'POS license',
                  source: 'meeting',
                  evidence: 'POS license',
                  confirmed: false,
                },
                quantity: { value: 1, source: 'meeting', evidence: 'one', confirmed: false },
              },
            ],
            maintenance_items: [
              {
                name: { value: 'Support squad', source: 'catalog', confirmed: false },
                fte_quarters: { value: 4, source: 'catalog', confirmed: false },
                period_months: {
                  value: 3,
                  source: 'meeting',
                  evidence: 'three months',
                  confirmed: false,
                },
              },
            ],
            hosting_items: [
              {
                name: { value: 'Managed hosting', source: 'user', confirmed: true },
                quantity: { value: 1, source: 'user', confirmed: true },
                period_months: {
                  value: 3,
                  source: 'meeting',
                  evidence: 'three months',
                  confirmed: false,
                },
              },
            ],
            rights_statements: [
              {
                value: 'Client may rebrand.',
                source: 'meeting',
                evidence: 'rebrand',
                confirmed: false,
              },
            ],
          },
          issues: [
            {
              code: 'white_label.license_unit_rate.unavailable',
              field: 'license_items[0].unit_rate',
              message: 'price is not available',
              severity: 'blocking',
            },
          ],
        })}
        calculation={undefined}
        catalogRoles={catalogRoles}
        pending={false}
        copy={copy}
        onPatch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: copy.open }));

    expect((screen.getByLabelText(copy.whiteLabelProduct) as HTMLInputElement).value).toBe(
      'POS Mini Market'
    );
    expect(screen.getByText('POS license')).toBeTruthy();
    expect(screen.getByText('Support squad')).toBeTruthy();
    expect(screen.getByText('Managed hosting')).toBeTruthy();
    expect(screen.getByText('Client may rebrand.')).toBeTruthy();
    expect(screen.queryByLabelText(copy.duration)).toBeNull();
    expect(screen.queryByLabelText(copy.role)).toBeNull();
    expect(screen.getByText(copy.priceUnavailable)).toBeTruthy();
  });

  it('shows standalone maintenance retainer facts and defect items without dedicated-team controls', () => {
    render(
      <PromptWorkspacePanel
        state={state({
          commercial_scheme: {
            value: 'standalone_maintenance',
            source: 'meeting',
            evidence: 'maintenance',
            confirmed: false,
          },
          team: [],
          service_input: {
            kind: 'standalone_maintenance_v1',
            system_name: {
              value: 'Aplikasi Nex Health',
              source: 'meeting',
              evidence: 'Nex Health',
              confirmed: false,
            },
            mode: { value: 'retainer', source: 'meeting', evidence: 'retainer', confirmed: false },
            tax_treatment: {
              value: 'exclusive_ppn',
              source: 'meeting',
              evidence: 'exclusive',
              confirmed: false,
            },
            retainer_items: [
              {
                name: {
                  value: 'Senior Web Programmer',
                  source: 'meeting',
                  evidence: 'Web Programmer',
                  confirmed: false,
                },
                fte_quarters: { value: 4, source: 'meeting', evidence: '1 FTE', confirmed: false },
                period_months: {
                  value: 1,
                  source: 'meeting',
                  evidence: '1 bulan',
                  confirmed: false,
                },
              },
            ],
            defect_groups: [
              {
                title: {
                  value: '1. Detail Pasien',
                  source: 'meeting',
                  evidence: 'Detail Pasien',
                  confirmed: false,
                },
                items: [
                  {
                    item_number: {
                      value: '1.1',
                      source: 'meeting',
                      evidence: '1.1',
                      confirmed: false,
                    },
                    priority: { value: 'P0', source: 'meeting', evidence: 'P0', confirmed: false },
                    function: {
                      value: 'Lihat Medical History',
                      source: 'meeting',
                      evidence: 'Medical History',
                      confirmed: false,
                    },
                    screen_flow: {
                      value: 'Pasien > Detail',
                      source: 'meeting',
                      evidence: 'flow',
                      confirmed: false,
                    },
                    existing: {
                      value: 'Registrasi awal',
                      source: 'meeting',
                      evidence: 'existing',
                      confirmed: false,
                    },
                    improvement: {
                      value: 'Riwayat SOAP lengkap',
                      source: 'meeting',
                      evidence: 'improvement',
                      confirmed: false,
                    },
                  },
                ],
              },
            ],
          },
          issues: [
            {
              code: 'standalone_maintenance.retainer_monthly_rate.unavailable',
              field: 'retainer_items[0].monthly_rate',
              message: 'price is not available',
              severity: 'blocking',
            },
          ],
        })}
        calculation={undefined}
        catalogRoles={catalogRoles}
        pending={false}
        copy={copy}
        onPatch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: copy.open }));

    expect((screen.getByLabelText(copy.maintenanceSystem) as HTMLInputElement).value).toBe(
      'Aplikasi Nex Health'
    );
    expect((screen.getByLabelText(copy.maintenanceMode) as HTMLInputElement).value).toBe(
      'retainer'
    );
    expect(screen.getByText(/Senior Web Programmer/)).toBeTruthy();
    expect(screen.getByText(/1\.1 \[P0\] Lihat Medical History/)).toBeTruthy();
    expect(screen.queryByLabelText(copy.duration)).toBeNull();
    expect(screen.queryByLabelText(copy.role)).toBeNull();
    expect(screen.getByText(copy.priceUnavailable)).toBeTruthy();
  });

  it('shows standalone maintenance hourly tasks and resources without calculating prices from hours alone', () => {
    render(
      <PromptWorkspacePanel
        state={state({
          commercial_scheme: {
            value: 'standalone_maintenance',
            source: 'meeting',
            evidence: 'maintenance hourly',
            confirmed: false,
          },
          team: [],
          service_input: {
            kind: 'standalone_maintenance_v1',
            system_name: {
              value: 'Portal Berita Liputan6',
              source: 'meeting',
              evidence: 'Liputan6',
              confirmed: false,
            },
            mode: { value: 'hourly_task', source: 'meeting', evidence: 'hourly', confirmed: false },
            tax_treatment: { value: 'not_stated', source: 'suggestion', confirmed: false },
            hourly_cost_items: [
              {
                name: {
                  value: 'Senior Mobile Programmer',
                  source: 'meeting',
                  evidence: 'Mobile Programmer',
                  confirmed: false,
                },
                headcount: { value: 1, source: 'meeting', evidence: '1 person', confirmed: false },
                hours_half_units: {
                  value: 16,
                  source: 'meeting',
                  evidence: '8 jam',
                  confirmed: false,
                },
              },
            ],
            hourly_tasks: [
              {
                description: {
                  value: 'Perbaikan crash login',
                  source: 'meeting',
                  evidence: 'crash login',
                  confirmed: false,
                },
                platform: {
                  value: 'Android',
                  source: 'meeting',
                  evidence: 'Android',
                  confirmed: false,
                },
                hours_half_units: {
                  value: 16,
                  source: 'meeting',
                  evidence: '8 jam',
                  confirmed: false,
                },
              },
            ],
            rights_statements: [
              {
                value: 'Source code milik bersama.',
                source: 'meeting',
                evidence: 'milik bersama',
                confirmed: false,
              },
            ],
          },
          issues: [
            {
              code: 'standalone_maintenance.hourly_quoted_total.unavailable',
              field: 'hourly_cost_items[0].quoted_line_total',
              message: 'price is not available',
              severity: 'blocking',
            },
          ],
        })}
        calculation={undefined}
        catalogRoles={catalogRoles}
        pending={false}
        copy={copy}
        onPatch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: copy.open }));

    expect((screen.getByLabelText(copy.maintenanceSystem) as HTMLInputElement).value).toBe(
      'Portal Berita Liputan6'
    );
    expect((screen.getByLabelText(copy.maintenanceMode) as HTMLInputElement).value).toBe(
      'hourly_task'
    );
    expect(screen.getByText(/Senior Mobile Programmer \(8 jam\)/)).toBeTruthy();
    expect(screen.getByText(/Perbaikan crash login \(Android, 8 jam\)/)).toBeTruthy();
    expect(screen.getByText('Source code milik bersama.')).toBeTruthy();
    expect(screen.queryByLabelText(copy.duration)).toBeNull();
    expect(screen.queryByLabelText(copy.role)).toBeNull();
    expect(screen.getByText(copy.priceUnavailable)).toBeTruthy();
  });

  it('shows custom development mode, cost groups with explicit and included items, and hides price when incomplete', () => {
    render(
      <PromptWorkspacePanel
        state={state({
          commercial_scheme: {
            value: 'custom_development',
            source: 'meeting',
            evidence: 'custom dev',
            confirmed: false,
          },
          team: [],
          service_input: {
            kind: 'custom_development_v1',
            system_name: {
              value: 'Company Profile Ecoflow',
              source: 'meeting',
              evidence: 'Ecoflow',
              confirmed: false,
            },
            development_table_mode: {
              value: 'fixed_days',
              source: 'meeting',
              evidence: 'fixed days',
              confirmed: false,
            },
            tax_treatment: {
              value: 'exclusive_ppn',
              source: 'meeting',
              evidence: 'exclusive',
              confirmed: false,
            },
            development_groups: [
              {
                title: {
                  value: 'Website 1: Landing Page & Katalog',
                  source: 'meeting',
                  evidence: 'Website 1',
                  confirmed: false,
                },
                items: [
                  {
                    name: {
                      value: 'Frontend & Backend Developer',
                      source: 'meeting',
                      evidence: 'Developer',
                      confirmed: false,
                    },
                    headcount: { value: 1, source: 'meeting', evidence: '1', confirmed: false },
                    period_label: {
                      value: '15 Hari',
                      source: 'meeting',
                      evidence: '15 Hari',
                      confirmed: false,
                    },
                    pricing_status: 'explicit',
                  },
                  {
                    name: {
                      value: 'QA Tester (Included)',
                      source: 'meeting',
                      evidence: 'QA',
                      confirmed: false,
                    },
                    headcount: { value: 1, source: 'meeting', evidence: '1', confirmed: false },
                    period_label: {
                      value: '15 Hari',
                      source: 'meeting',
                      evidence: '15 Hari',
                      confirmed: false,
                    },
                    pricing_status: 'included',
                  },
                ],
              },
            ],
            module_groups: [
              {
                name: {
                  value: 'Fitur Landing Page',
                  source: 'meeting',
                  evidence: 'Fitur',
                  confirmed: false,
                },
                features: [
                  {
                    value: 'Katalog Produk',
                    source: 'meeting',
                    evidence: 'Katalog',
                    confirmed: false,
                  },
                ],
              },
            ],
            timeline_rows: [
              {
                description: {
                  value: 'Pengerjaan Website',
                  source: 'meeting',
                  evidence: 'Pengerjaan',
                  confirmed: false,
                },
                timeline: {
                  value: '25 Hari Kerja',
                  source: 'meeting',
                  evidence: '25 Hari',
                  confirmed: false,
                },
              },
            ],
            payment_schedule: [],
            limitation_codes: [
              {
                value: 'out_of_pocket',
                source: 'meeting',
                evidence: 'out of pocket',
                confirmed: false,
              },
            ],
          },
          issues: [
            {
              code: 'custom_development.quoted_line_total.unavailable',
              field: 'development_groups[0].items[0].quoted_line_total',
              message: 'price is not available',
              severity: 'blocking',
            },
          ],
        })}
        calculation={undefined}
        catalogRoles={catalogRoles}
        pending={false}
        copy={copy}
        onPatch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: copy.open }));

    expect((screen.getByLabelText('System name') as HTMLInputElement).value).toBe(
      'Company Profile Ecoflow'
    );
    expect((screen.getByLabelText('Table mode') as HTMLInputElement).value).toBe('fixed_days');
    expect(screen.getByText(/Frontend & Backend Developer \(15 Hari, 1 SDM\)/)).toBeTruthy();
    expect(
      screen.getByText(/QA Tester \(Included\) \(15 Hari, 1 SDM\) - Termasuk dalam biaya/)
    ).toBeTruthy();
    expect(screen.getByText(/Fitur Landing Page \(1 fitur\)/)).toBeTruthy();
    expect(screen.getByText(/Pengerjaan Website: 25 Hari Kerja/)).toBeTruthy();
    expect(screen.queryByLabelText(copy.duration)).toBeNull();
    expect(screen.queryByLabelText(copy.role)).toBeNull();
    expect(screen.getByText(copy.priceUnavailable)).toBeTruthy();
  });

  it('shows kiosk queue details (variant, hardware, service groups) and hides price when incomplete', () => {
    render(
      <PromptWorkspacePanel
        state={state({
          commercial_scheme: {
            value: 'kiosk_queue_system',
            source: 'meeting',
            evidence: 'kiosk queue',
            confirmed: false,
          },
          team: [],
          service_input: {
            kind: 'kiosk_queue_system_v1',
            variant: {
              value: 'government_mpp',
              source: 'meeting',
              evidence: 'MPP',
              confirmed: false,
            },
            system_name: {
              value: 'Sistem Antrian Terpadu MPP',
              source: 'meeting',
              evidence: 'Antrian MPP',
              confirmed: false,
            },
            hardware_provision: {
              value: 'venturo_supplied',
              source: 'meeting',
              evidence: 'pengadaan hardware',
              confirmed: false,
            },
            tax_treatment: {
              value: 'inclusive_ppn_11',
              source: 'meeting',
              evidence: 'inclusive',
              confirmed: false,
            },
            service_groups: [
              {
                title: {
                  value: 'Requirement, Design & Development',
                  source: 'meeting',
                  evidence: 'Development',
                  confirmed: false,
                },
                items: [
                  {
                    name: {
                      value: 'Senior Programmer',
                      source: 'meeting',
                      evidence: 'Senior Programmer',
                      confirmed: false,
                    },
                    headcount: { value: 1, source: 'meeting', evidence: '1', confirmed: false },
                    period_quarters: {
                      value: 4,
                      source: 'meeting',
                      evidence: '1 bulan',
                      confirmed: false,
                    },
                  },
                ],
              },
            ],
            hardware_items: [
              {
                name: {
                  value: 'Mesin Kiosk Touchscreen 21.5 inch',
                  source: 'meeting',
                  evidence: 'Mesin Kiosk',
                  confirmed: false,
                },
                quantity: { value: 1, source: 'meeting', evidence: '1', confirmed: false },
              },
            ],
            limitation_codes: [
              { value: 'civil_electrical', source: 'meeting', evidence: 'civil', confirmed: false },
            ],
          },
          issues: [
            {
              code: 'kiosk_queue.hardware_unit_price.unavailable',
              field: 'hardware_items[0].unit_price',
              message: 'price is not available',
              severity: 'blocking',
            },
          ],
        })}
        calculation={undefined}
        catalogRoles={catalogRoles}
        pending={false}
        copy={copy}
        onPatch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: copy.open }));

    expect((screen.getByLabelText('System name') as HTMLInputElement).value).toBe(
      'Sistem Antrian Terpadu MPP'
    );
    expect((screen.getByLabelText('Variant') as HTMLInputElement).value).toBe('government_mpp');
    expect((screen.getByLabelText('Hardware provision') as HTMLInputElement).value).toBe(
      'venturo_supplied'
    );
    expect(screen.getByText(/Senior Programmer \(1 bln, 1 SDM\)/)).toBeTruthy();
    expect(screen.getByText(/Mesin Kiosk Touchscreen 21.5 inch \(1x\)/)).toBeTruthy();
    expect(screen.queryByLabelText(copy.duration)).toBeNull();
    expect(screen.queryByLabelText(copy.role)).toBeNull();
    expect(screen.getByText(copy.priceUnavailable)).toBeTruthy();
  });
  it('shows talent outsourcing manpower details (cost groups, scope) and hides price when incomplete', () => {
    render(
      <PromptWorkspacePanel
        state={state({
          commercial_scheme: {
            value: 'talent_outsourcing',
            source: 'meeting',
            evidence: 'talent_outsourcing',
            confirmed: false,
          },
          team: [],
          service_input: {
            kind: 'talent_outsourcing_v1',
            engagement_mode: {
              value: 'manpower_supply',
              source: 'meeting',
              evidence: 'manpower',
              confirmed: false,
            },
            document_number: { value: 'DOC-001', source: 'suggestion', confirmed: false },
            service_name: {
              value: 'Backend Dev',
              source: 'meeting',
              evidence: 'Backend',
              confirmed: false,
            },
            tax_treatment: {
              value: 'bpjs_dpp_ppn_12',
              source: 'meeting',
              evidence: 'tax',
              confirmed: false,
            },
            cost_groups: [
              {
                category: 'personnel',
                title: { value: 'Tim Personil', source: 'suggestion', confirmed: false },
                items: [
                  {
                    name: {
                      value: 'Programmer',
                      source: 'meeting',
                      evidence: 'Prog',
                      confirmed: false,
                    },
                    quantity: { value: 2, source: 'meeting', evidence: '2', confirmed: false },
                    quantity_unit: {
                      value: 'Orang',
                      source: 'meeting',
                      evidence: 'org',
                      confirmed: false,
                    },
                    period_count: {
                      value: 10,
                      source: 'meeting',
                      evidence: '10',
                      confirmed: false,
                    },
                    period_unit: 'workday',
                    unit_rate: { amount: undefined, source: 'meeting' },
                  },
                ],
              },
            ],
            scope_blocks: [
              { title: { value: 'Lingkup', source: 'meeting', evidence: 'L', confirmed: false } },
            ],
            payment_schedule: [],
            payment_due_days: { value: 14, source: 'meeting', evidence: '14', confirmed: false },
            limitation_codes: [
              { value: 'out_of_pocket', source: 'meeting', evidence: 'oop', confirmed: false },
            ],
          },
          issues: [
            {
              code: 'talent_outsourcing.cost_item.unit_rate.unavailable',
              field: 'cost_groups[0].items[0].unit_rate',
              message: 'price is not available',
              severity: 'blocking',
            },
          ],
        })}
        calculation={undefined}
        catalogRoles={catalogRoles}
        pending={false}
        copy={copy}
        onPatch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: copy.open }));

    expect((screen.getByLabelText('Tax Treatment') as HTMLInputElement).value).toBe(
      'bpjs_dpp_ppn_12'
    );
    expect(screen.getByText('Manpower Supply')).toBeTruthy();
    expect(screen.getByText(/Programmer \(2 Orang, 10 workday\)/)).toBeTruthy();
    expect(screen.queryByLabelText(copy.duration)).toBeNull();
    expect(screen.queryByLabelText(copy.role)).toBeNull();
    expect(screen.getByText(copy.priceUnavailable)).toBeTruthy();
  });

  it('shows cloud infrastructure details (category, packages, setup, scope, payment) and hides price when incomplete', () => {
    render(
      <PromptWorkspacePanel
        state={state({
          commercial_scheme: {
            value: 'cloud_infrastructure',
            source: 'meeting',
            evidence: 'cloud',
            confirmed: false,
          },
          team: [],
          service_input: {
            kind: 'cloud_infrastructure_v1',
            document_number: { value: 'DOC-CLOUD-001', source: 'suggestion', confirmed: false },
            service_name: {
              value: 'VPS Production Hosting',
              source: 'meeting',
              evidence: 'VPS',
              confirmed: false,
            },
            tax_treatment: {
              value: 'exclusive_ppn_11',
              source: 'meeting',
              evidence: 'tax',
              confirmed: false,
            },
            package_items: [
              {
                category: { value: 'vps', source: 'meeting', evidence: 'vps', confirmed: false },
                name: {
                  value: 'VPS 4 Core 8GB',
                  source: 'meeting',
                  evidence: '4C 8G',
                  confirmed: false,
                },
                vcpu: { value: 4, source: 'meeting', evidence: '4', confirmed: false },
                ram_gb: { value: 8, source: 'meeting', evidence: '8', confirmed: false },
                storage_gb: { value: 160, source: 'meeting', evidence: '160', confirmed: false },
                unit_rate: { amount: undefined, source: 'meeting' },
              },
            ],
            setup_items: [
              {
                name: {
                  value: 'Setup & Hardening OS',
                  source: 'meeting',
                  evidence: 'Setup',
                  confirmed: false,
                },
                amount: { amount: 1500000, source: 'meeting' },
              },
            ],
            scope_rows: [
              {
                sections: [
                  {
                    title: {
                      value: 'Implementasi',
                      source: 'meeting',
                      evidence: 'Imp',
                      confirmed: false,
                    },
                    activities: [
                      { value: 'OS Setup', source: 'meeting', evidence: 'os', confirmed: false },
                    ],
                  },
                ],
                timeline: {
                  value: 'Minggu 1',
                  source: 'meeting',
                  evidence: 'w1',
                  confirmed: false,
                },
              },
            ],
            payment_schedule: [
              {
                work_period: {
                  value: 'Setup Fee',
                  source: 'meeting',
                  evidence: 'setup',
                  confirmed: false,
                },
                terms: {
                  value: '100% di awal',
                  source: 'meeting',
                  evidence: '100',
                  confirmed: false,
                },
                invoice_date_label: { value: 'Saat invoice', source: 'meeting', confirmed: false },
                due_date_label: { value: '14 hari', source: 'meeting', confirmed: false },
                component: 'setup',
                nominal: { amount: 1500000, source: 'meeting' },
              },
            ],
            limitation_codes: [
              {
                value: 'Tidak termasuk lisensi 3rd party',
                source: 'meeting',
                evidence: '3rd party',
                confirmed: false,
              },
            ],
          },
          issues: [
            {
              code: 'cloud_infrastructure.package.unit_rate.unavailable',
              field: 'package_items[0].unit_rate',
              message: 'price is not available',
              severity: 'blocking',
            },
          ],
        })}
        calculation={undefined}
        catalogRoles={catalogRoles}
        pending={false}
        copy={copy}
        onPatch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: copy.open }));

    expect((screen.getByLabelText('Tax Treatment') as HTMLInputElement).value).toBe(
      'exclusive_ppn_11'
    );
    expect(screen.getByText('VPS')).toBeTruthy();
    expect(screen.getByText('VPS Production Hosting')).toBeTruthy();
    expect(screen.getByText(/VPS 4 Core 8GB \(4 vCPU, 8 GB RAM, 160 GB\)/)).toBeTruthy();
    expect(screen.getByText('Setup & Hardening OS')).toBeTruthy();
    expect(screen.getByText(/• OS Setup/)).toBeTruthy();
    expect(screen.getByText(/Timeline: Minggu 1/)).toBeTruthy();
    expect(screen.getByText(/Setup Fee: 100% di awal/)).toBeTruthy();
    expect(screen.getByText('Tidak termasuk lisensi 3rd party')).toBeTruthy();
    expect(screen.queryByLabelText(copy.duration)).toBeNull();
    expect(screen.queryByLabelText(copy.role)).toBeNull();
    expect(screen.getByText(copy.priceUnavailable)).toBeTruthy();
  });
});
