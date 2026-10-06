import { it, vi, expect, describe } from 'vitest';
// @vitest-environment happy-dom
import { render, screen, fireEvent } from '@testing-library/react';

import { ShareLinkList } from './share-link-list';

describe('ShareLinkList', () => {
  it('renders empty message when no links are provided', () => {
    render(<ShareLinkList links={[]} onRevoke={vi.fn()} />);
    expect(screen.getByText('Belum ada tautan berbagi aktif.')).toBeDefined();
  });

  it('renders active and revoked share links properly', () => {
    const mockRevoke = vi.fn();
    const links = [
      {
        id: 'link-1',
        label: 'Backend Team',
        revision_number: 1,
        blueprint_revision_id: 'rev-1',
        created_at: new Date().toISOString(),
        revoked_at: null,
        last_accessed_at: null,
        is_revoked: false,
      },
      {
        id: 'link-2',
        label: 'Old QA Link',
        revision_number: 1,
        blueprint_revision_id: 'rev-1',
        created_at: new Date().toISOString(),
        revoked_at: new Date().toISOString(),
        last_accessed_at: null,
        is_revoked: true,
      },
    ];

    render(<ShareLinkList links={links} onRevoke={mockRevoke} />);

    expect(screen.getByText('Backend Team')).toBeDefined();
    expect(screen.getByText('Old QA Link')).toBeDefined();
    expect(screen.getByText('Aktif')).toBeDefined();
    expect(screen.getByText('Dicabut')).toBeDefined();

    const revokeBtn = screen.getByTitle('Cabut Akses');
    fireEvent.click(revokeBtn);
    expect(mockRevoke).toHaveBeenCalledWith('link-1');
  });
});
