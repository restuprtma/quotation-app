// @vitest-environment happy-dom

import { it, vi, expect, describe, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import { createTheme, ThemeProvider } from '@mui/material/styles';

import { GenerationProgressCard, MEETING_GENERATION_STAGES } from './generation-progress-card';

vi.mock('src/shared/ui/iconify', () => ({
  Iconify: ({ icon }: { icon: string }) => <span data-icon={icon} />,
}));

function renderCard(props: Partial<React.ComponentProps<typeof GenerationProgressCard>> = {}) {
  return render(
    <ThemeProvider theme={createTheme()}>
      <GenerationProgressCard open activeStageIndex={0} isError={false} {...props} />
    </ThemeProvider>
  );
}

describe('GenerationProgressCard', () => {
  afterEach(cleanup);

  it('renders all caller-supplied meeting stages', () => {
    renderCard({ stages: MEETING_GENERATION_STAGES });

    expect(screen.getByText('Memvalidasi catatan meeting')).toBeDefined();
    expect(screen.getByText('Menyimpan draf awal')).toBeDefined();
    expect(screen.getByText('Mengekstrak dan memvalidasi kebutuhan dengan AI')).toBeDefined();
    expect(screen.getByText('Mencocokkan skema dan katalog')).toBeDefined();
    expect(screen.getByText('Menghitung dan menyusun quotation')).toBeDefined();
    expect(screen.getByText('Menyelesaikan draf')).toBeDefined();
    expect(screen.getByText('Selesai')).toBeDefined();
  });

  it('only claims a saved draft and offers retry plus Open Draft for a persisted timeout', () => {
    const onRetry = vi.fn();
    const onOpenEditor = vi.fn();
    renderCard({
      isError: true,
      errorCode: 'provider_timeout',
      quotationId: 'quotation-1',
      onRetry,
      onOpenEditor,
    });
    expect(screen.getByText(/draft is saved/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Retry Generation/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Open Draft/i })).toBeDefined();
  });

  it('hides retry when callers disable it while retaining Back to Form', () => {
    renderCard({ isError: true, showRetry: false, onRetry: vi.fn() });

    expect(screen.getByRole('button', { name: 'Back to Form' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Retry Generation' })).toBeNull();
  });

  it('uses existing advanced stages by default', () => {
    renderCard({ activeStageIndex: 2 });

    expect(screen.getByText('Preparing allocation')).toBeDefined();
  });
});
