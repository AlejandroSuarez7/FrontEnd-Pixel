import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../core/services/apiService';
import { categoryRepository } from './category.repository';

vi.mock('../../../core/services/apiService', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe('categoryRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists private and public categories with normalized defaults', async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: { data: [{ idCategoriaProducto: 1, nombre: 'Tintas' }], meta: { total: 1 } } })
      .mockResolvedValueOnce({ data: { data: [{ idCategoriaProducto: 2, nombre: 'Textiles', estado: false }] } });

    const result = await categoryRepository.list({ search: 'tin' }, { signal: 'signal' });
    expect(apiClient.get).toHaveBeenNthCalledWith(1, 'api/categorias-producto', {
      params: expect.objectContaining({ page: 1, search: 'tin' }), signal: 'signal',
    });
    expect(result.items[0]).toMatchObject({ descripcion: '', estado: true });
    await expect(categoryRepository.listPublic()).resolves.toEqual([
      expect.objectContaining({ idCategoriaProducto: 2, estado: false }),
    ]);
  });

  it('creates, updates, deactivates and deletes categories', async () => {
    apiClient.post.mockResolvedValue({ data: { data: { idCategoriaProducto: 1, nombre: 'Tintas', estado: true } } });
    apiClient.patch
      .mockResolvedValueOnce({ data: { data: { idCategoriaProducto: 1, nombre: 'Tintas 2', estado: false } } })
      .mockResolvedValueOnce({ data: { ok: true } });
    apiClient.delete.mockResolvedValue({ data: { ok: true } });

    await categoryRepository.create({ nombre: ' Tintas ', descripcion: ' ', estado: 1 });
    expect(apiClient.post).toHaveBeenCalledWith('api/categorias-producto', {
      nombre: 'Tintas', descripcion: null, estado: true,
    });
    await categoryRepository.update(1, { nombre: ' Tintas 2 ', descripcion: ' Nueva ', estado: false });
    expect(apiClient.patch).toHaveBeenNthCalledWith(1, 'api/categorias-producto/1', {
      nombre: 'Tintas 2', descripcion: 'Nueva', estado: false,
    });
    await expect(categoryRepository.deactivate(1)).resolves.toEqual({ ok: true });
    await expect(categoryRepository.hardDelete(1)).resolves.toEqual({ ok: true });
  });
});
