import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../core/services/apiService';
import { TecnicasApiRepository } from './tecnicas.repository';

vi.mock('../../../../core/services/apiService', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('./adapters/tecnicasDTO', () => ({
  tecnicasDTO: {
    fromApi: vi.fn((item) => item),
    fromApiList: vi.fn((items) => items),
    toApi: vi.fn((item) => ({ nombre: item.nombre?.trim() })),
  },
}));

describe('TecnicasApiRepository', () => {
  const repository = new TecnicasApiRepository();
  beforeEach(() => vi.clearAllMocks());

  it('lists and gets techniques', async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: { data: [{ id: 1 }], meta: { total: 1 } } })
      .mockResolvedValueOnce({ data: { data: { id: 1 } } });
    await repository.list({ search: 'dtf' }, { signal: 'signal' });
    expect(apiClient.get).toHaveBeenNthCalledWith(1, 'api/tecnicas', {
      params: expect.objectContaining({ search: 'dtf', sortBy: 'nombre' }), signal: 'signal',
    });
    await expect(repository.getById(1)).resolves.toEqual({ id: 1 });
  });

  it('creates, updates, deactivates and permanently deletes techniques', async () => {
    apiClient.post.mockResolvedValue({ data: { data: { id: 1 } } });
    apiClient.patch.mockResolvedValue({ data: { data: { id: 1 } } });
    apiClient.delete
      .mockResolvedValueOnce({ data: { ok: true } })
      .mockResolvedValueOnce({ data: { removed: true } });
    await repository.create({ nombre: ' DTF ' });
    expect(apiClient.post).toHaveBeenCalledWith('api/tecnicas', { nombre: 'DTF' });
    await repository.update(1, { nombre: ' DTG ' });
    expect(apiClient.patch).toHaveBeenCalledWith('api/tecnicas/1', { nombre: 'DTG' });
    await expect(repository.delete(1)).resolves.toEqual({ ok: true });
    await expect(repository.hardDelete(1)).resolves.toEqual({ removed: true });
  });

  it.each([
    ['getById', () => repository.getById(1), 'get'],
    ['create', () => repository.create({}), 'post'],
    ['update', () => repository.update(1, {}), 'patch'],
    ['delete', () => repository.delete(1), 'delete'],
    ['hardDelete', () => repository.hardDelete(1), 'delete'],
  ])('wraps %s failures', async (_name, operation, method) => {
    apiClient[method].mockRejectedValueOnce(new Error('offline'));
    await expect(operation()).rejects.toThrow();
  });
});
