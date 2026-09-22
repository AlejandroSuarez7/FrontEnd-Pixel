import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../core/services/apiService';
import { CompraApiRepository } from './compra.repository';

vi.mock('../../../../core/services/apiService', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe('CompraApiRepository', () => {
  const repository = new CompraApiRepository();
  beforeEach(() => vi.clearAllMocks());

  it('lists purchases with all supported filters and response shapes', async () => {
    apiClient.get.mockResolvedValue({ data: { compras: [{ idCompra: 1 }] } });
    const result = await repository.list({
      idPedido: 1, idProveedor: 2, estado: 'PENDIENTE', compradoPorId: 3,
      desde: '2026-01-01', hasta: '2026-01-31',
    }, { signal: 'signal' });
    expect(apiClient.get).toHaveBeenCalledWith('api/compras', {
      params: expect.objectContaining({ idPedido: 1, idProveedor: 2, compradoPorId: 3 }),
      signal: 'signal',
    });
    expect(result[0].idCompra).toBe(1);
  });

  it('loads designer and summary data including empty fallbacks', async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: { data: [{ idPedido: 1 }, { idPedido: 2 }] } })
      .mockResolvedValueOnce({ data: { data: [{ idCompra: 1 }] } })
      .mockResolvedValueOnce({ data: { data: [{ idCompra: 2 }] } });
    expect(await repository.listForDesigner()).toHaveLength(2);

    apiClient.get.mockResolvedValueOnce({ data: {} });
    expect(await repository.getResumen({ idPedido: 1, idProveedor: 2, desde: 'a', hasta: 'b' })).toEqual({
      totalCompras: 0, cantidadCompras: 0, porEstado: {},
    });
  });

  it('creates, updates, confirms, cancels and removes purchases', async () => {
    apiClient.post.mockResolvedValue({ data: { data: { idCompra: 1 } } });
    apiClient.patch
      .mockResolvedValueOnce({ data: { data: { idCompra: 1 } } })
      .mockResolvedValueOnce({ data: { ok: true } })
      .mockResolvedValueOnce({ data: { ok: true } });
    apiClient.delete.mockResolvedValue({ data: { ok: true } });

    await expect(repository.create({ idPedido: 1, idProveedor: 2 })).resolves.toMatchObject({ idCompra: 1 });
    await expect(repository.update(1, { observaciones: 'x' })).resolves.toMatchObject({ idCompra: 1 });
    await expect(repository.confirm(1)).resolves.toEqual({ ok: true });
    await expect(repository.cancel(1, ' Motivo ')).resolves.toEqual({ ok: true });
    await expect(repository.remove(1)).resolves.toEqual({ ok: true });
    expect(apiClient.patch).toHaveBeenLastCalledWith('api/compras/1/anular', { observaciones: 'Motivo' });
  });

  it.each([
    ['create', () => repository.create({ idPedido: 1, idProveedor: 2 }), 'post'],
    ['update', () => repository.update(1, {}), 'patch'],
    ['confirm', () => repository.confirm(1), 'patch'],
    ['cancel', () => repository.cancel(1, ''), 'patch'],
    ['remove', () => repository.remove(1), 'delete'],
    ['listByPedido', () => repository.listByPedido(1), 'get'],
  ])('wraps %s request failures', async (_name, operation, method) => {
    apiClient[method].mockRejectedValueOnce(new Error('offline'));
    await expect(operation()).rejects.toThrow();
  });

  it('loads raw order and active supplier lists', async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: { data: [{ idPedido: 1 }] } })
      .mockResolvedValueOnce({ data: { data: [{ idProveedor: 2 }] } });
    await expect(repository.listPedidos()).resolves.toEqual([{ idPedido: 1 }]);
    await expect(repository.listProveedoresActivos()).resolves.toEqual([{ idProveedor: 2 }]);
  });
});
