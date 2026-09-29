// @vitest-environment happy-dom
import type { BlueprintListItem } from '../types';

import { MemoryRouter } from 'react-router';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { BlueprintListTable } from './blueprint-list-table';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BlueprintListTable', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  const mockItems: BlueprintListItem[] = [
    {
      blueprint_id: 'bp-1',
      quotation_id: 'q-1',
      title: 'Completed Blueprint',
      generation_status: 'completed',
      updated_at: '2026-09-17T10:00:00Z',
    },
    {
      blueprint_id: 'bp-2',
      quotation_id: 'q-2',
      title: 'In Progress Blueprint',
      generation_status: 'in_progress',
      updated_at: '2026-09-17T11:00:00Z',
    },
    {
      blueprint_id: 'bp-3',
      quotation_id: 'q-3',
      title: 'Partial Failed Blueprint',
      generation_status: 'partial_failed',
      updated_at: '2026-09-17T12:00:00Z',
    },
    {
      blueprint_id: 'bp-4',
      quotation_id: 'q-4',
      title: 'Failed Blueprint',
      generation_status: 'failed',
      updated_at: '2026-09-17T13:00:00Z',
    },
    {
      blueprint_id: 'bp-5',
      quotation_id: 'q-5',
      title: 'Pending Blueprint',
      generation_status: 'pending',
      updated_at: '2026-09-17T14:00:00Z',
    },
  ];

  it('renders all items with correct titles, status chips, and formatted dates', () => {
    render(
      <MemoryRouter>
        <BlueprintListTable
          items={mockItems}
          total={5}
          page={1}
          limit={20}
          onPageChange={vi.fn()}
          onLimitChange={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Completed Blueprint')).toBeDefined();
    expect(screen.getByText('Selesai')).toBeDefined();

    expect(screen.getByText('In Progress Blueprint')).toBeDefined();
    expect(screen.getByText('Sedang Berjalan')).toBeDefined();

    expect(screen.getByText('Partial Failed Blueprint')).toBeDefined();
    expect(screen.getByText('Menunggu input / pemulihan')).toBeDefined();

    expect(screen.getByText('Failed Blueprint')).toBeDefined();
    expect(screen.getByText('Gagal / butuh pemulihan')).toBeDefined();

    expect(screen.getByText('Pending Blueprint')).toBeDefined();
    expect(screen.getByText('Menunggu')).toBeDefined();
  });

  it('only displays Buka button for each row and navigates on click', () => {
    render(
      <MemoryRouter>
        <BlueprintListTable
          items={[mockItems[3]]} // Failed item
          total={1}
          page={1}
          limit={20}
          onPageChange={vi.fn()}
          onLimitChange={vi.fn()}
        />
      </MemoryRouter>
    );

    // Verify only 'Buka' button exists (no Delete, Archive, etc.)
    const bukaButton = screen.getByRole('button', { name: /Buka/i });
    expect(bukaButton).toBeDefined();
    expect(screen.queryByRole('button', { name: /Hapus|Delete|Archive/i })).toBeNull();

    fireEvent.click(bukaButton);
    expect(mockNavigate).toHaveBeenCalledWith('/blueprint/bp-4');
  });

  it('renders empty message when items array is empty', () => {
    render(
      <MemoryRouter>
        <BlueprintListTable
          items={[]}
          total={0}
          page={1}
          limit={20}
          emptyMessage="Kustom pesan kosong"
          onPageChange={vi.fn()}
          onLimitChange={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Kustom pesan kosong')).toBeDefined();
  });

  it('renders circular progress when isLoading is true', () => {
    render(
      <MemoryRouter>
        <BlueprintListTable
          items={[]}
          total={0}
          page={1}
          limit={20}
          isLoading
          onPageChange={vi.fn()}
          onLimitChange={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeDefined();
  });

  it('renders error alert when error is provided', () => {
    render(
      <MemoryRouter>
        <BlueprintListTable
          items={[]}
          total={0}
          page={1}
          limit={20}
          error={new Error('Gagal memuat list')}
          onPageChange={vi.fn()}
          onLimitChange={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Gagal memuat list')).toBeDefined();
  });

  it('triggers onPageChange and onLimitChange handlers correctly', () => {
    const handlePageChange = vi.fn();
    const handleLimitChange = vi.fn();

    render(
      <MemoryRouter>
        <BlueprintListTable
          items={mockItems}
          total={50}
          page={1}
          limit={10}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </MemoryRouter>
    );

    // Find next page button in TablePagination
    const nextPageBtn = screen.getByRole('button', { name: /next page/i });
    fireEvent.click(nextPageBtn);

    expect(handlePageChange).toHaveBeenCalledWith(2);
  });
});
