import { it, vi, expect, describe } from 'vitest';

import axios, { endpoints } from 'src/shared/lib/axios';

import { getClients, createClientOrganization } from './generation';

describe('Client Fetching & Quotation Form Client Resolution', () => {
  it('endpoints.quotation.clientOrganizations.root is configured correctly', () => {
    expect((endpoints as any).quotation?.clientOrganizations?.root).toBe(
      '/quotation/v1/client-organizations'
    );
  });

  it('getClients is defined as an async function', () => {
    expect(typeof getClients).toBe('function');
  });

  it('getClients calls quotation clientOrganizations endpoint and unwraps { items: [...] }', async () => {
    const mockClients = [
      { id: '40000000-0000-0000-0000-000000000001', name: 'Owner Organization', slug: 'owner' },
      { id: '40000000-0000-0000-0000-000000000002', name: 'Client Organization', slug: 'client' },
    ];

    const getSpy = vi.spyOn(axios, 'get').mockResolvedValueOnce({
      data: {
        data: {
          items: mockClients,
          total: 2,
        },
        message: 'Clients retrieved successfully',
      },
    });

    const result = await getClients();
    expect(getSpy).toHaveBeenCalledWith('/quotation/v1/client-organizations');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('40000000-0000-0000-0000-000000000001');
    expect(result[0].name).toBe('Owner Organization');
    expect(result[1].name).toBe('Client Organization');
  });

  it('getClients unwraps direct array [...] envelope structure', async () => {
    const mockClients = [
      { id: '40000000-0000-0000-0000-000000000003', name: 'Acme Corp', slug: 'acme' },
    ];

    const getSpy = vi.spyOn(axios, 'get').mockResolvedValueOnce({
      data: {
        data: mockClients,
        message: 'Clients retrieved successfully',
      },
    });

    const result = await getClients();
    expect(getSpy).toHaveBeenCalledWith('/quotation/v1/client-organizations');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Acme Corp');
  });

  it('createClientOrganization is defined as an async function', () => {
    expect(typeof createClientOrganization).toBe('function');
  });

  it('createClientOrganization trims name and posts to quotation client-organizations endpoint', async () => {
    const createdClient = {
      id: '50000000-0000-0000-0000-000000000001',
      name: 'PT Baru Sukses',
    };

    const postSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        data: createdClient,
        message: 'Client organization created successfully',
      },
    });

    const result = await createClientOrganization('   PT Baru Sukses   ');
    expect(postSpy).toHaveBeenCalledWith('/quotation/v1/client-organizations', {
      name: 'PT Baru Sukses',
    });
    expect(result).toEqual(createdClient);
  });
});
