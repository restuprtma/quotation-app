import type { Quotation } from '../types';

import { toast } from 'sonner';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
// @vitest-environment happy-dom
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';

import { Table, TableBody } from '@mui/material';

import { QuotationTableRow } from './quotation-table-row';

vi.mock('src/locales', () => ({
  useTranslate: () => ({
    t: (key: string, params?: any) => {
      if (params?.number !== undefined) return `Rev ${params.number}`;
      return key;
    },
  }),
}));

vi.mock('src/shared/ui/iconify', () => ({
  Iconify: ({ icon }: { icon: string }) => <span data-icon={icon} />,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockQuotation: Quotation = {
  id: 'quo-1',
  quotation_number: 'QUO-001',
  client_id: 'cli-1',
  client_name: 'PT ABC',
  solution_type: 'custom',
  status: 'published',
  current_revision: 1,
  public_token: 'token-uuid-1234',
  created_at: '2026-08-14T00:00:00Z',
  updated_at: '2026-08-14T00:00:00Z',
};

describe('QuotationTableRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders copy public link icon button for published quotation', () => {
    render(
      <Table>
        <TableBody>
          <QuotationTableRow row={mockQuotation} onView={vi.fn()} />
        </TableBody>
      </Table>
    );

    const linkBtn = screen.getByTestId('copy-public-link-btn');
    expect(linkBtn).toBeDefined();
  });

  it('copies link to clipboard when clicked and shows toast without triggering onView', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });
    const onViewMock = vi.fn();

    render(
      <Table>
        <TableBody>
          <QuotationTableRow row={mockQuotation} onView={onViewMock} />
        </TableBody>
      </Table>
    );

    const linkBtn = screen.getByTestId('copy-public-link-btn');
    fireEvent.click(linkBtn);

    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('/p/q/token-uuid-1234'));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('editor.publicLinkCopied'));
    });
    expect(onViewMock).not.toHaveBeenCalled();
  });

  it('does not render copy public link button for draft quotation', () => {
    render(
      <Table>
        <TableBody>
          <QuotationTableRow row={{ ...mockQuotation, status: 'draft' }} onView={vi.fn()} />
        </TableBody>
      </Table>
    );

    expect(screen.queryByTestId('copy-public-link-btn')).toBeNull();
  });

  it('renders copy public link icon button for signed quotation', () => {
    render(
      <Table>
        <TableBody>
          <QuotationTableRow row={{ ...mockQuotation, status: 'signed' }} onView={vi.fn()} />
        </TableBody>
      </Table>
    );

    const linkBtn = screen.getByTestId('copy-public-link-btn');
    expect(linkBtn).toBeDefined();
  });

  it('does not render copy public link button if public_token is empty', () => {
    render(
      <Table>
        <TableBody>
          <QuotationTableRow row={{ ...mockQuotation, public_token: '' }} onView={vi.fn()} />
        </TableBody>
      </Table>
    );

    expect(screen.queryByTestId('copy-public-link-btn')).toBeNull();
  });

  it('renders copy and open public link options in popover menu and triggers actions without onView', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });
    const openMock = vi.fn();
    vi.stubGlobal('open', openMock);

    const onViewMock = vi.fn();

    render(
      <Table>
        <TableBody>
          <QuotationTableRow row={mockQuotation} onView={onViewMock} />
        </TableBody>
      </Table>
    );

    // Open more menu
    const moreBtn = screen.getByRole('button', { name: 'table.actions' });
    fireEvent.click(moreBtn);

    const copyMenuItem = screen.getByText('rowActions.copyPublicLink');
    const openMenuItem = screen.getByText('rowActions.openPublicLink');
    expect(copyMenuItem).toBeDefined();
    expect(openMenuItem).toBeDefined();

    // Click open menu item
    fireEvent.click(openMenuItem);
    expect(openMock).toHaveBeenCalledWith(
      expect.stringContaining('/p/q/token-uuid-1234'),
      '_blank',
      'noopener,noreferrer'
    );
    expect(onViewMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
