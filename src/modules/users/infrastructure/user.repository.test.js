import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../core/services/apiService';
import { UserApiRepository } from './user.repository';

vi.mock('../../../core/services/apiService', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('./adapters/userDTO', () => ({
  userDTO: {
    fromApi: vi.fn((item) => item),
    fromApiList: vi.fn((items) => items.map((item) => ({ id: item.idUsuario, ...item }))),
  },
}));

describe('UserApiRepository', () => {
  const repository = new UserApiRepository();
  beforeEach(() => vi.clearAllMocks());

  it('lists users and detects duplicated normalized fields while excluding the current user', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { data: [{ idUsuario: 1, nombre: 'Ana' }], meta: { total: 1 } } });
    await repository.list({ search: 'ana' }, { signal: 'signal' });
    expect(apiClient.get).toHaveBeenCalledWith('api/usuarios', {
      params: expect.objectContaining({ search: 'ana', sortBy: 'nombre' }), signal: 'signal',
    });

    apiClient.get
      .mockResolvedValueOnce({ data: { data: [{ idUsuario: 2, correo: 'ANA@MAIL.COM' }] } })
      .mockResolvedValueOnce({ data: { data: [{ idUsuario: 1, documento: '123' }] } })
      .mockResolvedValueOnce({ data: { data: [{ idUsuario: 3, telefono: '300' }] } });
    await expect(repository.findDuplicateFields({
      correo: ' ana@mail.com ', documento: '123', telefono: '300',
    }, 1)).resolves.toEqual(expect.arrayContaining(['correo', 'telefono']));
  });

  it('returns no duplicates for blank fields and executes mutations', async () => {
    await expect(repository.findDuplicateFields({ correo: '', documento: null, telefono: undefined })).resolves.toEqual([]);
    apiClient.post.mockResolvedValue({ data: { data: { id: 1 } } });
    apiClient.patch.mockResolvedValue({ data: { id: 1 } });
    apiClient.delete
      .mockResolvedValueOnce({ data: { ok: true } })
      .mockResolvedValueOnce({ data: { removed: true } });
    await expect(repository.create({ nombre: 'Ana' })).resolves.toEqual({ id: 1 });
    await expect(repository.update(1, { nombre: 'B' })).resolves.toEqual({ id: 1 });
    await expect(repository.delete(1)).resolves.toEqual({ ok: true });
    await expect(repository.hardDelete(1)).resolves.toEqual({ removed: true });
  });

  it.each([
    ['create', () => repository.create({}), 'post'],
    ['update', () => repository.update(1, {}), 'patch'],
    ['delete', () => repository.delete(1), 'delete'],
    ['hardDelete', () => repository.hardDelete(1), 'delete'],
  ])('wraps %s failures', async (_name, operation, method) => {
    apiClient[method].mockRejectedValueOnce(new Error('offline'));
    await expect(operation()).rejects.toThrow();
  });
});
