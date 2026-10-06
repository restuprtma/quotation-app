// @vitest-environment happy-dom
import { vi, it, expect, describe, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import {
  PublishBlueprintDialog,
  type SectionSummaryItem,
} from './PublishBlueprintDialog';

describe('PublishBlueprintDialog', () => {
  afterEach(() => {
    cleanup();
  });

  const completeSections: SectionSummaryItem[] = [
    { type: 'journey', status: 'completed', title: 'User Journey' },
    { type: 'architecture', status: 'completed', title: 'Architecture' },
    { type: 'state_machine', status: 'completed', title: 'State Machine' },
    { type: 'workflow', status: 'completed', title: 'Business Workflow' },
    { type: 'wbs', status: 'validated', title: 'WBS' },
  ];

  const partialSections: SectionSummaryItem[] = [
    { type: 'journey', status: 'completed', title: 'User Journey' },
    { type: 'architecture', status: 'failed', title: 'Architecture' },
    { type: 'state_machine', status: 'pending', title: 'State Machine' },
    { type: 'workflow', status: 'manual_edit', title: 'Business Workflow' },
    { type: 'wbs', status: 'completed', title: 'WBS' },
  ];

  it('renders completeness matrix for all 5 canonical sections', () => {
    render(
      <PublishBlueprintDialog
        open
        onClose={vi.fn()}
        onPublish={vi.fn()}
        completenessStatus="complete"
        sections={completeSections}
      />
    );

    expect(screen.getByText('Matriks Kelengkapan Section')).toBeTruthy();
    expect(screen.getByText('User Journey')).toBeTruthy();
    expect(screen.getByText('Architecture')).toBeTruthy();
    expect(screen.getByText('State Machine')).toBeTruthy();
    expect(screen.getByText('Business Workflow')).toBeTruthy();
    expect(screen.getByText('WBS')).toBeTruthy();

    const selesaiBadges = screen.getAllByText('Selesai');
    expect(selesaiBadges.length).toBe(5);
  });

  it('complete blueprint does not show confirmation checkbox and enables publish directly', () => {
    const handlePublish = vi.fn();

    render(
      <PublishBlueprintDialog
        open
        onClose={vi.fn()}
        onPublish={handlePublish}
        completenessStatus="complete"
        sections={completeSections}
      />
    );

    expect(
      screen.queryByText(/Saya mengonfirmasi publikasi blueprint parsial/i)
    ).toBeNull();
    expect(
      screen.getByText(/Seluruh section telah lengkap dan tervalidasi/i)
    ).toBeTruthy();

    const publishButton = screen.getByRole('button', { name: 'Publikasikan' });
    expect((publishButton as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(publishButton);
    expect(handlePublish).toHaveBeenCalledWith({
      confirmPartial: false,
      warningCodes: [],
    });
  });

  it('partial blueprint requires confirmation checkbox and disables publish until checked', () => {
    const handlePublish = vi.fn();

    render(
      <PublishBlueprintDialog
        open
        onClose={vi.fn()}
        onPublish={handlePublish}
        completenessStatus="partial"
        sections={partialSections}
        warningCodes={['WARN_ARCH_INCOMPLETE']}
      />
    );

    expect(
      screen.getByText(/Blueprint belum lengkap \(status: Parsial\)/i)
    ).toBeTruthy();
    expect(screen.getByText('WARN_ARCH_INCOMPLETE')).toBeTruthy();

    const publishButton = screen.getByRole('button', { name: 'Publikasikan' });
    expect((publishButton as HTMLButtonElement).disabled).toBe(true);

    const checkbox = screen.getByRole('checkbox', {
      name: /Saya mengonfirmasi publikasi blueprint parsial/i,
    });
    expect((checkbox as HTMLInputElement).checked).toBe(false);

    fireEvent.click(checkbox);
    expect((checkbox as HTMLInputElement).checked).toBe(true);
    expect((publishButton as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(publishButton);
    expect(handlePublish).toHaveBeenCalledWith({
      confirmPartial: true,
      warningCodes: ['WARN_ARCH_INCOMPLETE'],
    });
  });

  it('disables publish and cancel buttons when isSubmitting is true', () => {
    render(
      <PublishBlueprintDialog
        open
        onClose={vi.fn()}
        onPublish={vi.fn()}
        completenessStatus="complete"
        sections={completeSections}
        isSubmitting
      />
    );

    const publishButton = screen.getByRole('button', { name: 'Publikasikan' });
    const cancelButton = screen.getByRole('button', { name: 'Batal' });

    expect((publishButton as HTMLButtonElement).disabled).toBe(true);
    expect((cancelButton as HTMLButtonElement).disabled).toBe(true);
  });

  it('calls onClose when Batal is clicked', () => {
    const handleClose = vi.fn();

    render(
      <PublishBlueprintDialog
        open
        onClose={handleClose}
        onPublish={vi.fn()}
        completenessStatus="complete"
        sections={completeSections}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Batal' });
    fireEvent.click(cancelButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
