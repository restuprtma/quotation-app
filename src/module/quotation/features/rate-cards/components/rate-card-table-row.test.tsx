// @vitest-environment happy-dom
import type { RateCardSummaryResponse } from '../types';

import { it, vi, expect, describe, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { RateCardTableRow } from './rate-card-table-row';

afterEach(cleanup);

vi.mock('@mui/x-data-grid', () => ({
  gridClasses: {},
}));

vi.mock('src/shared/ui/label', () => ({
  Label: ({ children, color, ...other }: any) => (
    <span data-color={color} data-testid="label" {...other}>
      {children}
    </span>
  ),
}));

expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null && received !== undefined;
    return {
      pass,
      message: () =>
        pass
          ? 'expected element not to be in document'
          : 'expected element to be in document',
    };
  },
});

vi.mock('src/locales', () => ({
  useTranslate: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'table.default': 'DEFAULT',
        'actions.setDefault': 'Set as Default',
        'actions.viewDetails': 'View Details',
        'actions.delete': 'Delete',
        'table.rolesCount': 'roles',
        'status.active': 'Active',
        'status.inactive': 'Inactive',
        'tiers.commercialNational': 'Commercial National',
        'tiers.governmentBumn': 'Government / BUMN',
        'tiers.international': 'International',
        'markets.national': 'National',
        'markets.international': 'International',
      };
      return dict[key] || key;
    },
  }),
}));

vi.mock('src/shared/ui/iconify', () => ({
  Iconify: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

const mockDefaultRow: RateCardSummaryResponse = {
  id: 'rc-default-1',
  code: 'RC-DEF',
  name: 'Default Rate Card',
  market: 'national',
  client_tier: 'commercial_national',
  currency: 'IDR',
  is_active: true,
  is_default: true,
  item_count: 5,
  created_at: '2026-01-01T00:00:00Z',
};

const mockNonDefaultRow: RateCardSummaryResponse = {
  id: 'rc-custom-2',
  code: 'RC-CUST',
  name: 'Custom Rate Card',
  market: 'national',
  client_tier: 'commercial_national',
  currency: 'IDR',
  is_active: true,
  is_default: false,
  item_count: 0,
  created_at: '2026-01-01T00:00:00Z',
};

function renderRow(props: {
  row: RateCardSummaryResponse;
  onView?: (id: string) => void;
  onDelete?: (row: RateCardSummaryResponse) => void;
  onSetDefault?: (id: string) => void;
}) {
  return render(
    <table>
      <tbody>
        <RateCardTableRow
          row={props.row}
          onView={props.onView || vi.fn()}
          onDelete={props.onDelete || vi.fn()}
          onSetDefault={props.onSetDefault || vi.fn()}
        />
      </tbody>
    </table>
  );
}

describe('RateCardTableRow', () => {
  it('renders DEFAULT badge and does not show Set as Default button when row.is_default is true', () => {
    const handleSetDefault = vi.fn();

    renderRow({
      row: mockDefaultRow,
      onSetDefault: handleSetDefault,
    });

    // Assert DEFAULT badge is visible
    expect(screen.getByText('DEFAULT')).toBeInTheDocument();

    // Assert "Set as Default" button is either disabled or not shown
    const setDefaultBtn = screen.queryByRole('button', { name: /set as default/i });
    if (setDefaultBtn) {
      expect(setDefaultBtn).toBeDisabled();
    } else {
      expect(setDefaultBtn).toBeNull();
    }
  });

  it('renders Set as Default button and triggers onSetDefault when clicked for non-default row', () => {
    const handleSetDefault = vi.fn();

    renderRow({
      row: mockNonDefaultRow,
      onSetDefault: handleSetDefault,
    });

    // Assert DEFAULT badge is NOT rendered
    expect(screen.queryByText('DEFAULT')).toBeNull();

    // Assert "Set as Default" button is present and clickable
    const setDefaultBtn = screen.getByRole('button', { name: /set as default/i });
    expect(setDefaultBtn).toBeInTheDocument();

    fireEvent.click(setDefaultBtn);
    expect(handleSetDefault).toHaveBeenCalledTimes(1);
    expect(handleSetDefault).toHaveBeenCalledWith(mockNonDefaultRow.id);
  });

  it('handles onView and onDelete callbacks correctly', () => {
    const handleView = vi.fn();
    const handleDelete = vi.fn();

    renderRow({
      row: mockNonDefaultRow,
      onView: handleView,
      onDelete: handleDelete,
    });

    // Click code or view button
    fireEvent.click(screen.getByText(mockNonDefaultRow.code));
    expect(handleView).toHaveBeenCalledWith(mockNonDefaultRow.id);

    // Click delete button
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(mockNonDefaultRow);
  });
});
