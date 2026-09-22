// @vitest-environment happy-dom
import type { ReactNode } from 'react';
import type { BlueprintDetail, BlueprintStatus } from '../types';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { it, vi, expect, describe, afterEach, beforeAll, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';

import * as api from '../api';
import { BlueprintEditorView } from './blueprint-editor-view';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  const origQuerySelectorAll = Element.prototype.querySelectorAll;
  Element.prototype.querySelectorAll = function polyfillQuerySelectorAll(selectors: string) {
    if (typeof selectors === 'string' && selectors.includes('[role="treeitem"]:not(')) {
      const match = selectors.match(/\*\[id="([^"]+)"\]/);
      const targetId = match ? match[1] : null;
      const allTreeItems = Array.from(
        origQuerySelectorAll.call(this, '[role="treeitem"]')
      ) as HTMLElement[];

      if (targetId) {
        return allTreeItems.filter((el) => {
          const parentItem = el.parentElement?.closest('[role="treeitem"]');
          return parentItem != null && parentItem.id === targetId;
        }) as any;
      }
      return allTreeItems.filter((el) => {
        const parentItem = el.parentElement?.closest('[role="treeitem"]');
        return parentItem == null;
      }) as any;
    }
    return origQuerySelectorAll.call(this, selectors);
  };
});

vi.mock('src/layouts/dashboard', () => ({
  DashboardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('src/module/core/features/auth/hooks', () => ({
  useAuthContext: () => ({
    company: { id: 'company-test-1', name: 'Test Company' },
  }),
}));

const mockNavigate = vi.fn();
const mockParams = { id: 'bp-123' };
let mockSearchParams = new URLSearchParams();
const mockSetSearchParams = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('BlueprintEditorView (Task 3.02 & 3.03 Tests)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();
    mockParams.id = 'bp-123';
  });

  afterEach(() => {
    cleanup();
  });

  const mockStatus: BlueprintStatus = {
    blueprint_id: 'bp-123',
    revision_id: 'rev-001',
    title: 'Sistem Antrian Pelayanan Publik',
    generation_status: 'in_progress',
    publication_status: 'draft',
    completeness_status: 'partial',
    content_version: 1,
    sections: [
      {
        type: 'journey',
        status: 'pending',
        attempts: 1,
        started_at: '2026-09-18T10:00:00Z',
        completed_at: null,
        updated_at: '2026-09-18T10:01:00Z',
      },
    ],
    created_at: '2026-09-18T10:00:00Z',
    updated_at: '2026-09-18T10:01:00Z',
  };

  const mockDetail: BlueprintDetail = {
    status: mockStatus,
    quotation_id: 'qtn-123',
    source_quotation_revision_id: 'rev-001',
    content_json: {
      journey: {
        phases: [
          { id: 'phase-1', label: 'Pendaftaran', order: 1 },
          { id: 'phase-2', label: 'Pelayanan', order: 2 },
        ],
        actors: [
          { id: 'actor-1', label: 'Pemohon', order: 1 },
          { id: 'actor-2', label: 'Petugas', order: 2 },
        ],
        activities: [
          {
            id: 'act-1',
            phase_id: 'phase-1',
            actor_id: 'actor-1',
            label: 'Ambil Tiket',
            description: 'Pemohon mengambil tiket',
            touchpoints: ['Kiosk'],
            references: [],
          },
        ],
      },
    },
    validation_result: {},
    cross_validation_result: {},
  };

  it('renders editor header, metadata chips, tabs, and Journey editor', async () => {
    vi.spyOn(api, 'getBlueprint').mockResolvedValue(mockDetail);
    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);

    render(<BlueprintEditorView blueprintId="bp-123" />, { wrapper: createWrapper() });

    expect(
      await screen.findByText(/Visual Editor — Sistem Antrian Pelayanan Publik/i)
    ).toBeTruthy();
    expect(screen.getByText('Revisi: rev-001')).toBeTruthy();
    expect(screen.getByText('Versi Konten: v1')).toBeTruthy();
    expect(screen.getByText('1. User Journey')).toBeTruthy();
    expect(screen.getByText('Pendaftaran')).toBeTruthy();
    expect(screen.getByText('Pemohon')).toBeTruthy();
    expect(screen.getByText('Ambil Tiket')).toBeTruthy();
    expect(screen.getByRole('button', { name: /simpan draft/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /selesaikan section/i })).toBeTruthy();
  });

  it('saves draft successfully and updates content_version from canonical response', async () => {
    vi.spyOn(api, 'getBlueprint').mockResolvedValue(mockDetail);
    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);

    const updatedDetail: BlueprintDetail = {
      ...mockDetail,
      status: {
        ...mockStatus,
        content_version: 2,
        sections: [{ ...mockStatus.sections[0], status: 'manual_edit' }],
      },
      content_json: {
        journey: {
          ...mockDetail.content_json!.journey!,
          phases: [
            ...mockDetail.content_json!.journey!.phases,
            { id: 'phase-3', label: 'Evaluasi', order: 3 },
          ],
        },
      },
    };

    const draftSaveSpy = vi
      .spyOn(api, 'saveBlueprintDraftSection')
      .mockResolvedValue(updatedDetail);

    render(<BlueprintEditorView blueprintId="bp-123" />, { wrapper: createWrapper() });

    await screen.findByText('Pendaftaran');

    // Add phase to make it dirty
    const addPhaseBtn = screen.getByRole('button', { name: /tambah fase/i });
    fireEvent.click(addPhaseBtn);

    expect(screen.getByText('Belum Disimpan')).toBeTruthy();

    // Click Save Draft
    const saveDraftBtn = screen.getByRole('button', { name: /simpan draft/i });
    fireEvent.click(saveDraftBtn);

    await waitFor(() => {
      expect(draftSaveSpy).toHaveBeenCalledTimes(1);
    });

    expect(draftSaveSpy).toHaveBeenCalledWith(
      'bp-123',
      'journey',
      expect.objectContaining({
        revision_id: 'rev-001',
        content_version: 1,
        content: expect.objectContaining({
          journey: expect.objectContaining({
            phases: expect.arrayContaining([expect.objectContaining({ id: 'phase-1' })]),
          }),
        }),
      })
    );

    // After success, dirty badge disappears and version updates
    await waitFor(() => {
      expect(screen.queryByText('Belum Disimpan')).toBeNull();
    });
  });

  it('handles 409 conflict during draft save: preserves local buffer and displays conflict modal', async () => {
    vi.spyOn(api, 'getBlueprint').mockResolvedValue(mockDetail);
    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);

    const conflictError: any = new Error('Execution conflict');
    conflictError.response = { status: 409, data: { error_code: 'execution_conflict' } };
    conflictError.status = 409;
    vi.spyOn(api, 'saveBlueprintDraftSection').mockRejectedValue(conflictError);

    render(<BlueprintEditorView blueprintId="bp-123" />, { wrapper: createWrapper() });

    await screen.findByText('Pendaftaran');

    // Add a phase to make dirty
    fireEvent.click(screen.getByRole('button', { name: /tambah fase/i }));
    expect(screen.getByText('Belum Disimpan')).toBeTruthy();

    // Trigger Save Draft -> 409 conflict
    fireEvent.click(screen.getByRole('button', { name: /simpan draft/i }));

    // Expect conflict modal to appear
    expect(await screen.findByText(/konflik versi terdeteksi \(409\)/i)).toBeTruthy();

    // Dismiss modal to retain local buffer
    fireEvent.click(screen.getByRole('button', { name: /pertahankan perubahan lokal/i }));

    // Local buffer remains dirty and user edits are preserved!
    expect(screen.getByText('Belum Disimpan')).toBeTruthy();
  });

  it('handles 422 schema error during draft save without wiping local buffer', async () => {
    vi.spyOn(api, 'getBlueprint').mockResolvedValue(mockDetail);
    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);

    const validationError: any = new Error('Invalid schema');
    validationError.response = { status: 422, data: { error_code: 'invalid_schema' } };
    validationError.status = 422;
    vi.spyOn(api, 'saveBlueprintDraftSection').mockRejectedValue(validationError);

    render(<BlueprintEditorView blueprintId="bp-123" />, { wrapper: createWrapper() });

    await screen.findByText('Pendaftaran');

    // Make local change
    fireEvent.click(screen.getByRole('button', { name: /tambah fase/i }));
    expect(screen.getByText('Belum Disimpan')).toBeTruthy();

    // Trigger Save Draft
    fireEvent.click(screen.getByRole('button', { name: /simpan draft/i }));

    // Local buffer remains dirty and is not wiped
    await waitFor(() => {
      expect(screen.getByText('Belum Disimpan')).toBeTruthy();
    });
  });

  it('completes section via authoritative manual endpoint after validating', async () => {
    vi.spyOn(api, 'getBlueprint').mockResolvedValue(mockDetail);
    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);

    const completeSpy = vi.spyOn(api, 'completeBlueprintSection').mockResolvedValue({
      ...mockStatus,
      sections: [{ ...mockStatus.sections[0], status: 'validated' }],
    });

    render(<BlueprintEditorView blueprintId="bp-123" />, { wrapper: createWrapper() });

    await screen.findByText('Pendaftaran');

    const completeBtn = screen.getByRole('button', { name: /selesaikan section/i });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(completeSpy).toHaveBeenCalledTimes(1);
    });

    expect(completeSpy).toHaveBeenCalledWith(
      'bp-123',
      'journey',
      expect.objectContaining({
        revision_id: 'rev-001',
        content_version: 1,
        content: expect.objectContaining({
          journey: expect.any(Object),
        }),
      })
    );
  });

  it('guards dirty navigation when user clicks back button', async () => {
    vi.spyOn(api, 'getBlueprint').mockResolvedValue(mockDetail);
    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);

    render(<BlueprintEditorView blueprintId="bp-123" />, { wrapper: createWrapper() });

    await screen.findByText('Pendaftaran');

    // Make dirty
    fireEvent.click(screen.getByRole('button', { name: /tambah fase/i }));

    // Click back button
    const backBtn = screen.getByRole('button', { name: /kembali ke overview/i });
    fireEvent.click(backBtn);

    // Unsaved changes confirmation dialog opens
    expect(await screen.findByText(/perubahan belum disimpan/i)).toBeTruthy();

    // User confirms leaving
    const leaveBtn = screen.getByRole('button', { name: /tinggalkan halaman/i });
    fireEvent.click(leaveBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/blueprint/bp-123');
  });

  it('displays failed section recovery guidance when section is failed', async () => {
    const failedStatus: BlueprintStatus = {
      ...mockStatus,
      sections: [
        {
          type: 'journey',
          status: 'failed',
          attempts: 1,
          started_at: '2026-09-18T10:00:00Z',
          completed_at: null,
          updated_at: '2026-09-18T10:01:00Z',
        },
      ],
    };

    vi.spyOn(api, 'getBlueprint').mockResolvedValue(mockDetail);
    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(failedStatus);

    render(<BlueprintEditorView blueprintId="bp-123" />, { wrapper: createWrapper() });

    expect(await screen.findByText(/tahap memerlukan perbaikan/i)).toBeTruthy();
  });

  it('switches to Architecture tab, renders Architecture editor, and saves Architecture draft', async () => {
    const mockDetailWithArch: BlueprintDetail = {
      ...mockDetail,
      content_json: {
        ...mockDetail.content_json,
        architecture: {
          groups: [{ id: 'grp-1', label: 'Presentation Tier', order: 1 }],
          nodes: [
            {
              id: 'node-web',
              group_id: 'grp-1',
              type: 'application',
              label: 'Web Portal Client',
              description: 'Frontend client',
              layout: { x: 100, y: 100 },
            },
            {
              id: 'node-api',
              group_id: 'grp-1',
              type: 'service',
              label: 'Core REST Service',
              description: 'Backend service',
              layout: { x: 400, y: 100 },
            },
          ],
          edges: [
            {
              id: 'edge-1',
              source: 'node-web',
              target: 'node-api',
              label: 'HTTPS REST',
              type: 'sync',
            },
          ],
        },
      },
    };

    vi.spyOn(api, 'getBlueprint').mockResolvedValue(mockDetailWithArch);
    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);

    const updatedDetail: BlueprintDetail = {
      ...mockDetailWithArch,
      status: {
        ...mockStatus,
        content_version: 2,
        sections: [
          {
            type: 'architecture',
            status: 'manual_edit',
            attempts: 1,
            started_at: '',
            completed_at: null,
            updated_at: '',
          },
        ],
      },
      content_json: {
        ...mockDetailWithArch.content_json,
        architecture: {
          ...mockDetailWithArch.content_json!.architecture!,
          groups: [
            ...mockDetailWithArch.content_json!.architecture!.groups,
            { id: 'grp-2', label: 'Data Tier', order: 2 },
          ],
        },
      },
    };

    const draftSaveSpy = vi
      .spyOn(api, 'saveBlueprintDraftSection')
      .mockResolvedValue(updatedDetail);

    render(<BlueprintEditorView blueprintId="bp-123" initialSection="architecture" />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByTestId('blueprint-flow-canvas')).toBeTruthy();
    expect(screen.getAllByText('Presentation Tier').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Web Portal Client').length).toBeGreaterThan(0);

    // Add group in Architecture
    const addGroupBtn = screen.getAllByRole('button', { name: /tambah group/i })[0];
    fireEvent.click(addGroupBtn);

    const labelInput = screen.getByLabelText(/label group/i);
    fireEvent.change(labelInput, { target: { value: 'Data Tier' } });

    const saveGroupBtn = screen.getByRole('button', { name: /simpan group/i });
    fireEvent.click(saveGroupBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    expect(screen.getByText('Belum Disimpan')).toBeTruthy();

    // Click Save Draft
    const saveDraftBtn = screen.getByRole('button', { name: /simpan draft/i });
    fireEvent.click(saveDraftBtn);

    await waitFor(() => {
      expect(draftSaveSpy).toHaveBeenCalledTimes(1);
    });

    expect(draftSaveSpy).toHaveBeenCalledWith(
      'bp-123',
      'architecture',
      expect.objectContaining({
        revision_id: 'rev-001',
        content_version: 1,
        content: expect.objectContaining({
          architecture: expect.objectContaining({
            groups: expect.arrayContaining([expect.objectContaining({ id: 'grp-1' })]),
          }),
        }),
      })
    );
  });

  it('switches to State Machine tab, renders State Machine editor, and saves State Machine draft', async () => {
    const mockDetailWithSm: BlueprintDetail = {
      ...mockDetail,
      content_json: {
        ...mockDetail.content_json,
        state_machine: {
          entity: 'Tiket Antrean',
          initial_state: 'state-1',
          states: [
            {
              id: 'state-1',
              label: 'Menunggu',
              type: 'normal',
              layout: { x: 100, y: 100 },
            },
            {
              id: 'state-2',
              label: 'Selesai',
              type: 'terminal',
              layout: { x: 400, y: 100 },
            },
          ],
          transitions: [
            {
              id: 'trans-1',
              source: 'state-1',
              target: 'state-2',
              event: 'Selesaikan Antrean',
              actor: 'Petugas',
              guard: '',
              actions: [],
            },
          ],
        },
      },
    };

    vi.spyOn(api, 'getBlueprint').mockResolvedValue(mockDetailWithSm);
    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);

    const updatedDetail: BlueprintDetail = {
      ...mockDetailWithSm,
      status: {
        ...mockStatus,
        content_version: 2,
        sections: [
          {
            type: 'state_machine',
            status: 'manual_edit',
            attempts: 1,
            started_at: '',
            completed_at: null,
            updated_at: '',
          },
        ],
      },
      content_json: {
        ...mockDetailWithSm.content_json,
        state_machine: {
          ...mockDetailWithSm.content_json!.state_machine!,
          entity: 'Tiket Antrean Updated',
        },
      },
    };

    const draftSaveSpy = vi
      .spyOn(api, 'saveBlueprintDraftSection')
      .mockResolvedValue(updatedDetail);

    render(<BlueprintEditorView blueprintId="bp-123" initialSection="state_machine" />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByTestId('blueprint-flow-canvas')).toBeTruthy();
    expect(screen.getAllByText('Menunggu').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Selesai').length).toBeGreaterThan(0);

    // Edit entity name
    const entityInput = screen.getByLabelText(/nama entity/i);
    fireEvent.change(entityInput, { target: { value: 'Tiket Antrean Updated' } });

    expect(screen.getByText('Belum Disimpan')).toBeTruthy();

    // Click Save Draft
    const saveDraftBtn = screen.getByRole('button', { name: /simpan draft/i });
    fireEvent.click(saveDraftBtn);

    await waitFor(() => {
      expect(draftSaveSpy).toHaveBeenCalledTimes(1);
    });

    expect(draftSaveSpy).toHaveBeenCalledWith(
      'bp-123',
      'state_machine',
      expect.objectContaining({
        revision_id: 'rev-001',
        content_version: 1,
        content: expect.objectContaining({
          state_machine: expect.objectContaining({
            entity: 'Tiket Antrean Updated',
            initial_state: 'state-1',
          }),
        }),
      })
    );
  });

  it('switches to Workflow tab, renders Workflow editor, and saves Workflow draft', async () => {
    const mockDetailWithWf: BlueprintDetail = {
      ...mockDetail,
      content_json: {
        ...mockDetail.content_json,
        workflows: [
          {
            id: 'wf-1',
            name: 'Alur Pelayanan Utama',
            description: 'Deskripsi workflow utama',
            lanes: [{ id: 'lane-1', label: 'Petugas Loket', order: 1 }],
            nodes: [
              {
                id: 'wnode-1',
                lane_id: 'lane-1',
                type: 'start',
                label: 'Mulai Pelayanan',
                description: 'Start node',
                layout: { x: 50, y: 50 },
              },
              {
                id: 'wnode-2',
                lane_id: 'lane-1',
                type: 'end',
                label: 'Pelayanan Selesai',
                description: 'End node',
                layout: { x: 300, y: 50 },
              },
            ],
            edges: [
              {
                id: 'wedge-1',
                source: 'wnode-1',
                target: 'wnode-2',
                label: 'Selesai',
              },
            ],
          },
        ],
      },
    };

    vi.spyOn(api, 'getBlueprint').mockResolvedValue(mockDetailWithWf);
    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);

    const updatedDetail: BlueprintDetail = {
      ...mockDetailWithWf,
      status: {
        ...mockStatus,
        content_version: 2,
        sections: [
          {
            type: 'workflow',
            status: 'manual_edit',
            attempts: 1,
            started_at: '',
            completed_at: null,
            updated_at: '',
          },
        ],
      },
      content_json: {
        ...mockDetailWithWf.content_json,
        workflows: [
          {
            ...mockDetailWithWf.content_json!.workflows![0],
            name: 'Alur Pelayanan Utama (Updated)',
          },
        ],
      },
    };

    const draftSaveSpy = vi
      .spyOn(api, 'saveBlueprintDraftSection')
      .mockResolvedValue(updatedDetail);

    render(<BlueprintEditorView blueprintId="bp-123" initialSection="workflow" />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByTestId('blueprint-flow-canvas')).toBeTruthy();
    expect(screen.getAllByText('Alur Pelayanan Utama').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mulai Pelayanan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pelayanan Selesai').length).toBeGreaterThan(0);

    // Edit workflow metadata
    const editWfBtn = screen.getByRole('button', { name: /edit info workflow/i });
    fireEvent.click(editWfBtn);

    const nameInput = screen.getByDisplayValue('Alur Pelayanan Utama');
    fireEvent.change(nameInput, { target: { value: 'Alur Pelayanan Utama (Updated)' } });

    const saveWfBtn = screen.getByRole('button', { name: /simpan workflow/i });
    fireEvent.click(saveWfBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    expect(screen.getByText('Belum Disimpan')).toBeTruthy();

    // Click Save Draft
    const saveDraftBtn = screen.getByRole('button', { name: /simpan draft/i });
    fireEvent.click(saveDraftBtn);

    await waitFor(() => {
      expect(draftSaveSpy).toHaveBeenCalledTimes(1);
    });

    expect(draftSaveSpy).toHaveBeenCalledWith(
      'bp-123',
      'workflow',
      expect.objectContaining({
        revision_id: 'rev-001',
        content_version: 1,
        content: expect.objectContaining({
          workflows: expect.arrayContaining([
            expect.objectContaining({
              id: 'wf-1',
              name: 'Alur Pelayanan Utama (Updated)',
            }),
          ]),
        }),
      })
    );
  });

  it('switches to WBS tab, renders WBS editor, and saves WBS draft', async () => {
    const mockDetailWithWbs: BlueprintDetail = {
      ...mockDetail,
      content_json: {
        ...mockDetail.content_json,
        wbs: {
          modules: [
            {
              id: 'mod-1',
              name: 'Modul Antrian Utama',
              description: 'Deskripsi Modul Antrian',
              priority: 'high',
              dependencies: [],
              references: [],
              features: [
                {
                  id: 'feat-1',
                  name: 'Alokasi Tiket',
                  description: 'Alokasi nomor tiket',
                  acceptance_criteria: ['Kriteria 1'],
                },
              ],
            },
          ],
        },
        cross_references: [
          {
            id: 'xref-1',
            source_ref: 'wbs.module.mod-1',
            target_ref: 'architecture.node.node-1',
            relation_type: 'implements',
            description: 'Relasi WBS',
          },
        ],
      },
    };

    vi.spyOn(api, 'getBlueprint').mockResolvedValue(mockDetailWithWbs);
    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);

    const updatedDetail: BlueprintDetail = {
      ...mockDetailWithWbs,
      status: {
        ...mockStatus,
        content_version: 2,
        sections: [
          {
            type: 'wbs',
            status: 'manual_edit',
            attempts: 1,
            started_at: '',
            completed_at: null,
            updated_at: '',
          },
        ],
      },
      content_json: {
        ...mockDetailWithWbs.content_json,
        wbs: {
          modules: [
            {
              ...mockDetailWithWbs.content_json!.wbs!.modules[0],
              name: 'Modul Antrian Utama (Updated)',
            },
          ],
        },
      },
    };

    const draftSaveSpy = vi
      .spyOn(api, 'saveBlueprintDraftSection')
      .mockResolvedValue(updatedDetail);

    render(<BlueprintEditorView blueprintId="bp-123" initialSection="wbs" />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByTestId('wbs-editor')).toBeTruthy();
    expect(screen.getAllByText('Modul Antrian Utama').length).toBeGreaterThan(0);

    // Edit module name
    const editModBtn = screen.getByRole('button', { name: /edit module modul antrian utama/i });
    fireEvent.click(editModBtn);

    const nameInput = screen.getByDisplayValue('Modul Antrian Utama');
    fireEvent.change(nameInput, { target: { value: 'Modul Antrian Utama (Updated)' } });

    const saveModBtn = screen.getByRole('button', { name: /simpan module/i });
    fireEvent.click(saveModBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    expect(screen.getByText('Belum Disimpan')).toBeTruthy();

    // Click Save Draft
    const saveDraftBtn = screen.getByRole('button', { name: /simpan draft/i });
    fireEvent.click(saveDraftBtn);

    await waitFor(() => {
      expect(draftSaveSpy).toHaveBeenCalledTimes(1);
    });

    expect(draftSaveSpy).toHaveBeenCalledWith(
      'bp-123',
      'wbs',
      expect.objectContaining({
        revision_id: 'rev-001',
        content_version: 1,
        content: expect.objectContaining({
          wbs: expect.objectContaining({
            modules: expect.arrayContaining([
              expect.objectContaining({
                id: 'mod-1',
                name: 'Modul Antrian Utama (Updated)',
              }),
            ]),
          }),
        }),
      })
    );
  });

  it('renders per-section status badges on all five tabs and supports switching', async () => {
    const multiStatus: BlueprintStatus = {
      ...mockStatus,
      sections: [
        {
          type: 'journey',
          status: 'completed',
          attempts: 1,
          started_at: undefined,
          completed_at: null,
          updated_at: undefined,
        },
        {
          type: 'architecture',
          status: 'manual_edit',
          attempts: 1,
          started_at: undefined,
          completed_at: null,
          updated_at: undefined,
        },
        {
          type: 'state_machine',
          status: 'failed',
          attempts: 1,
          started_at: undefined,
          completed_at: null,
          updated_at: undefined,
        },
        {
          type: 'workflow',
          status: 'pending',
          attempts: 0,
          started_at: undefined,
          completed_at: null,
          updated_at: undefined,
        },
        {
          type: 'wbs',
          status: 'validated',
          attempts: 1,
          started_at: undefined,
          completed_at: null,
          updated_at: undefined,
        },
      ],
    };

    vi.spyOn(api, 'getBlueprint').mockResolvedValue({
      ...mockDetail,
      status: multiStatus,
    });
    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(multiStatus);

    render(<BlueprintEditorView blueprintId="bp-123" />, { wrapper: createWrapper() });

    expect(await screen.findByText('1. User Journey')).toBeTruthy();
    expect(screen.getByText('2. Arsitektur Sistem')).toBeTruthy();
    expect(screen.getByText('3. State Machine')).toBeTruthy();
    expect(screen.getByText('4. Workflow Bisnis')).toBeTruthy();
    expect(screen.getByText('5. WBS Deliverable')).toBeTruthy();

    // Check presence of status badges across tabs
    expect(screen.getAllByText('Selesai').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Draft').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Gagal').length).toBeGreaterThanOrEqual(1);

    // Switch tab to State Machine
    fireEvent.click(screen.getByText('3. State Machine'));
    expect(mockSetSearchParams).toHaveBeenCalled();
  });

  it('resolves initialSection from query params (?section=workflow)', async () => {
    mockSearchParams = new URLSearchParams('section=workflow');

    const detailWithWf: BlueprintDetail = {
      ...mockDetail,
      content_json: {
        workflows: [
          {
            id: 'wf-1',
            name: 'Workflow dari URL Query',
            description: 'Loaded via search param',
            lanes: [{ id: 'lane-1', label: 'Petugas', order: 1 }],
            nodes: [
              {
                id: 'wnode-1',
                lane_id: 'lane-1',
                type: 'start',
                label: 'Mulai',
                description: 'Start step',
                layout: { x: 50, y: 50 },
              },
            ],
            edges: [],
          },
        ],
      },
    };

    vi.spyOn(api, 'getBlueprint').mockResolvedValue(detailWithWf);
    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);

    render(<BlueprintEditorView blueprintId="bp-123" />, { wrapper: createWrapper() });

    expect(await screen.findByTestId('workflow-editor')).toBeTruthy();
    expect(screen.getByText('Workflow dari URL Query')).toBeTruthy();

    mockSearchParams = new URLSearchParams();
  });

  it('deep-links from validation panel issue to target section and focuses target element', async () => {
    const detailWithIssues: BlueprintDetail = {
      ...mockDetail,
      validation_result: {
        issues: [
          {
            code: 'DANGLING_EDGE',
            message: 'Edge references missing node',
            section: 'architecture',
            target_id: 'edge-99',
            severity: 'error',
            blocking: true,
          },
        ],
      },
    };

    vi.spyOn(api, 'getBlueprint').mockResolvedValue(detailWithIssues);
    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);

    render(<BlueprintEditorView blueprintId="bp-123" />, { wrapper: createWrapper() });

    await screen.findByText('1. User Journey');

    // Switch to validation tab
    const validationTabBtn = screen.getByText('Panel Validasi Server');
    fireEvent.click(validationTabBtn);

    expect(await screen.findByText('Edge references missing node')).toBeTruthy();

    // Click "Fokus" on the issue
    const focusBtn = screen.getByRole('button', { name: /fokus pada isu/i });
    fireEvent.click(focusBtn);

    // Verifies it navigated to Architecture editor tab
    expect(await screen.findByTestId('blueprint-flow-canvas')).toBeTruthy();
    expect(mockSetSearchParams).toHaveBeenCalled();
  });

  it('ensures no raw unparsed JSON is displayed across editors', async () => {
    vi.spyOn(api, 'getBlueprint').mockResolvedValue(mockDetail);
    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);

    render(<BlueprintEditorView blueprintId="bp-123" />, { wrapper: createWrapper() });

    await screen.findByText('1. User Journey');

    // Ensure raw JSON syntax markers like `{"journey":` or `"activities":[` are not exposed in normal UI
    expect(screen.queryByText(/\{"phases":/)).toBeNull();
    expect(screen.queryByText(/\{"actors":/)).toBeNull();
    expect(screen.queryByText(/\{"activities":/)).toBeNull();
  });
});
