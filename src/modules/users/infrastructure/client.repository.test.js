import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../core/services/apiService';
import { clientRepository } from './client.repository';

vi.mock('../../../core/services/apiService', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe('clientRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists and maps clients with defaults and optional abort signals', async () => {
    apiClient.get.mockResolvedValue({ data: { data: [{ idCliente: 1, nombre: null, estado: 1 }], meta: { total: 1 } } });
    const result = await clientRepository.list({ search: 'ana' }, { signal: 'signal' });
    expect(apiClient.get).toHaveBeenCalledWith('api/clientes', {
      params: expect.objectContaining({ search: 'ana', sortBy: 'nombre' }), signal: 'signal',
    });
    expect(result.items[0]).toMatchObject({ nombre: '', estado: true, cotizaciones: [], pedidos: [] });

    apiClient.get.mockResolvedValueOnce({ data: { data: [] } });
    await clientRepository.list();
    expect(apiClient.get).toHaveBeenLastCalledWith('api/clientes', { params: expect.any(Object) });
  });

  it('gets details, orders and supports state and delete operations', async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: { data: { idCliente: 2, nombre: 'Ana', estado: false } } })
      .mockResolvedValueOnce({ data: { data: [{ idPedido: 3 }] } })
      .mockResolvedValueOnce({ data: { data: null } });
    apiClient.patch.mockResolvedValue({ data: { data: { idCliente: 2, nombre: 'Ana', estado: false } } });
    apiClient.delete.mockResolvedValue({ data: { ok: true } });

    await expect(clientRepository.getById(2)).resolves.toMatchObject({ idCliente: 2, estado: false });
    await expect(clientRepository.listOrders(2, { signal: 'signal' })).resolves.toEqual([{ idPedido: 3 }]);
    await expect(clientRepository.listOrders(2)).resolves.toEqual([]);
    await expect(clientRepository.deactivate(2)).resolves.toMatchObject({ idCliente: 2 });
    await expect(clientRepository.delete(2)).resolves.toEqual({ ok: true });
  });
});
