import { it, vi, expect, describe } from 'vitest';

import axios, { endpoints } from 'src/shared/lib/axios';

import { getClients } from './generation';

describe('Client Fetching & Quotation Form Client Resolution', () => {
  it('endpoints.core.clients is configured correctly', () => {
    expect((endpoints as any).core?.clients).toBe('/core/v1/admin/clients');
  });

  it('getClients is defined as an async function', () => {
    expect(typeof getClients).toBe('function');
  });

  it('getClients unwraps { items: [...] } envelope structure', async () => {
    const mockClients = [
      { id: '40000000-0000-0000-0000-000000000001', name: 'Owner Organization', slug: 'owner' },
      { id: '40000000-0000-0000-0000-000000000002', name: 'Client Organization', slug: 'client' },
    ];

    vi.spyOn(axios, 'get').mockResolvedValueOnce({
      data: {
        data: {
          items: mockClients,
          total: 2,
        },
        message: 'Clients retrieved successfully',
      },
    });

    const result = await getClients();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('40000000-0000-0000-0000-000000000001');
    expect(result[0].name).toBe('Owner Organization');
    expect(result[1].name).toBe('Client Organization');
  });

  it('getClients unwraps direct array [...] envelope structure', async () => {
    const mockClients = [
      { id: '40000000-0000-0000-0000-000000000003', name: 'Acme Corp', slug: 'acme' },
    ];

    vi.spyOn(axios, 'get').mockResolvedValueOnce({
      data: {
        data: mockClients,
        message: 'Clients retrieved successfully',
      },
    });

    const result = await getClients();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Acme Corp');
  });
});
