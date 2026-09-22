import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../core/services/apiService';
import { ProveedorApiRepository } from './proveedor.repository';

vi.mock('../../../../core/services/apiService', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

describe('ProveedorApiRepository', () => {
  const repository = new ProveedorApiRepository();
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { data: [{ idProveedor: 1, nombre: 'Telas' }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } } });
    apiClient.post.mockResolvedValue({ data: { data: { idProveedor: 2, nombre: 'Nuevo' } } });
    apiClient.patch.mockResolvedValue({ data: { data: { idProveedor: 1, nombre: 'Editado' } } });
    apiClient.delete.mockResolvedValue({ data: { message: 'ok' } });
  });
  it('covers all successful provider operations', async () => {
    await repository.list({ search: 'tel' }, { signal: 'signal' });
    await repository.getById(1);
    await repository.create({ nombre: ' Nuevo ' });
    await repository.update(1, { nombre: ' Editado ', estado: true });
    await repository.deactivate(1);
    await repository.hardDelete(1);
    expect(apiClient.delete).toHaveBeenNthCalledWith(1, 'api/proveedores/1');
    expect(apiClient.delete).toHaveBeenNthCalledWith(2, 'api/proveedores/1/eliminar');
  });
  it.each([
    ['getById', 'get', [1]], ['create', 'post', [{}]], ['update', 'patch', [1, {}]],
    ['deactivate', 'delete', [1]], ['hardDelete', 'delete', [1]],
  ])('wraps %s failures', async (method, clientMethod, args) => {
    apiClient[clientMethod].mockRejectedValueOnce(new Error('offline'));
    await expect(repository[method](...args)).rejects.toThrow();
  });
});
