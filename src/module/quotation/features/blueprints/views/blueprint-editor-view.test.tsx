// @vitest-environment happy-dom
import type { ReactNode } from 'react';
import type { BlueprintDetail, BlueprintStatus } from '../types';

import React from 'react';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';

import * as api from '../api';
import { BlueprintEditorView } from './blueprint-editor-view';

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

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
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
});
