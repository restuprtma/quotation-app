// @vitest-environment happy-dom
import { it, vi, expect, describe, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import * as useHooks from '../hooks/use-shared-blueprint';
import { SharedBlueprintView } from './shared-blueprint-view';

vi.mock('../hooks/use-shared-blueprint');

describe('SharedBlueprintView', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders loading state when isLoading is true', () => {
    vi.spyOn(useHooks, 'useSharedBlueprint').mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(<SharedBlueprintView token="sample-token" />);
    expect(screen.getByTestId('shared-blueprint-loading')).toBeDefined();
  });

  it('renders generic not found card on 404 or missing blueprint', () => {
    vi.spyOn(useHooks, 'useSharedBlueprint').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('404'),
    } as any);

    render(<SharedBlueprintView token="sample-token" />);
    expect(screen.getByText('Blueprint Tidak Ditemukan')).toBeDefined();
  });

  it('renders permanent partial banner when completeness_status is partial', () => {
    vi.spyOn(useHooks, 'useSharedBlueprint').mockReturnValue({
      data: {
        title: 'Hospital Core System',
        revision_number: 2,
        completeness_status: 'partial',
        published_at: new Date().toISOString(),
        summary: 'Partial architecture preview',
        assumptions: [],
        open_questions: [],
        completeness_matrix: { journey: 'validated', architecture: 'pending' },
        warnings: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<SharedBlueprintView token="sample-token" />);
    expect(screen.getByText(/Blueprint Parsial - Revision 2/i)).toBeDefined();
    expect(
      screen.getByText(/Dokumen ini belum lengkap dan dapat berubah pada revision berikutnya/i)
    ).toBeDefined();
  });

  it('renders safe placeholder for missing or pending sections', () => {
    vi.spyOn(useHooks, 'useSharedBlueprint').mockReturnValue({
      data: {
        title: 'Hospital Core System',
        revision_number: 2,
        completeness_status: 'partial',
        published_at: new Date().toISOString(),
        summary: 'Partial architecture preview',
        assumptions: [],
        open_questions: [],
        completeness_matrix: { journey: 'pending' },
        warnings: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<SharedBlueprintView token="sample-token" />);
    expect(
      screen.getByText(
        /Bagian ini belum tersedia pada Revision 2. Hubungi Business Analyst untuk revision berikutnya./i
      )
    ).toBeDefined();
  });

  it('does not render editor controls, retry actions, or sensitive financial data', () => {
    vi.spyOn(useHooks, 'useSharedBlueprint').mockReturnValue({
      data: {
        title: 'Hospital Core System',
        revision_number: 1,
        completeness_status: 'complete',
        published_at: new Date().toISOString(),
        summary: 'Complete system preview',
        assumptions: [],
        open_questions: [],
        completeness_matrix: { journey: 'validated' },
        warnings: [],
        journey: {
          scenarios: [
            {
              title: 'Pasien Rawat Jalan',
              steps: [{ step_number: 1, action: 'Pendaftaran', response: 'Nomor Antrean' }],
            },
          ],
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<SharedBlueprintView token="sample-token" />);
    expect(screen.queryByText(/Blueprint Parsial/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /simpan|publish|retry|edit/i })).toBeNull();
  });
});
