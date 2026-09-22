import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../core/services/apiService';
import { productRepository } from './product.repository';

vi.mock('../../../core/services/apiService', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('productRepository discount ranges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads ranges from the exact product endpoint', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        data: [
          { cantidadMinima: 10, porcentaje: '8', estado: true },
        ],
      },
    });

    const ranges = await productRepository.listRanges(7);

    expect(apiClient.get).toHaveBeenCalledWith('api/productos/7/rangos', {
      signal: undefined,
    });
    expect(ranges[0]).toMatchObject({
      cantidadMinima: 10,
      porcentaje: '8',
      estado: true,
    });
  });

  it('saves only the new range field names', async () => {
    apiClient.patch.mockResolvedValue({ data: { data: [] } });

    await productRepository.replaceRanges(7, [
      { cantidadMinima: '10', porcentaje: '8', estado: true },
    ]);

    expect(apiClient.patch).toHaveBeenCalledWith('api/productos/7/rangos', {
      rangos: [
        { cantidadMinima: 10, porcentaje: 8, estado: true },
      ],
    });
  });

  it('lists products with pagination and maps nullable and default fields', async () => {
    const signal = new AbortController().signal;
    apiClient.get.mockResolvedValueOnce({
      data: {
        data: [{
          idProducto: 4,
          idCategoriaProducto: 2,
          nombre: 'Camiseta',
          descripcion: null,
          precioBase: '25000',
          estado: 1,
          rangosDescuento: [{ cantidadMinima: 10, porcentaje: 5 }],
        }],
        meta: { page: 2, limit: 5, total: 6, totalPages: 2 },
      },
    });

    const result = await productRepository.list({ page: 2, limit: 5 }, { signal });

    expect(apiClient.get).toHaveBeenCalledWith('api/productos', {
      params: expect.objectContaining({ page: 2, limit: 5, sortBy: 'idProducto', order: 'desc' }),
      signal,
    });
    expect(result.items[0]).toMatchObject({
      descripcion: '',
      precioBase: 25000,
      requiereDiseno: true,
      estado: true,
    });
  });

  it('creates and updates normalized product payloads', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: { data: { idProducto: 5, nombre: 'Gorra', precioBase: null, estado: false } },
    });
    apiClient.patch.mockResolvedValueOnce({
      data: { data: { idProducto: 5, nombre: 'Gorra Pro', precioBase: 30000, estado: true } },
    });

    const created = await productRepository.create({
      nombre: '  Gorra ',
      idCategoriaProducto: '3',
      descripcion: '  ',
      requiereDiseno: 0,
      estado: 0,
    });
    const updated = await productRepository.update(5, {
      nombre: '  Gorra Pro ',
      idCategoriaProducto: '3',
      descripcion: '  Bordada ',
      requiereDiseno: 1,
      estado: 1,
    });

    expect(apiClient.post).toHaveBeenCalledWith('api/productos', {
      nombre: 'Gorra',
      idCategoriaProducto: 3,
      descripcion: null,
      requiereDiseno: false,
      estado: false,
    });
    expect(apiClient.patch).toHaveBeenCalledWith('api/productos/5', {
      nombre: 'Gorra Pro',
      idCategoriaProducto: 3,
      descripcion: 'Bordada',
      requiereDiseno: true,
      estado: true,
    });
    expect(created.precioBase).toBeNull();
    expect(updated.precioBase).toBe(30000);
  });

  it('deactivates and permanently deletes products', async () => {
    apiClient.delete
      .mockResolvedValueOnce({ data: { action: 'deactivated' } })
      .mockResolvedValueOnce({ data: { action: 'deleted' } });

    await expect(productRepository.deactivate(9)).resolves.toEqual({ action: 'deactivated' });
    await expect(productRepository.hardDelete(9)).resolves.toEqual({ action: 'deleted' });
    expect(apiClient.delete).toHaveBeenNthCalledWith(1, 'api/productos/9');
    expect(apiClient.delete).toHaveBeenNthCalledWith(2, 'api/productos/9/eliminar');
  });

  it('supports nested range responses and forwards list-range cancellation', async () => {
    const signal = new AbortController().signal;
    apiClient.get
      .mockResolvedValueOnce({ data: { data: { rangos: [{ cantidadMinima: 20, porcentaje: 10 }] } } })
      .mockResolvedValueOnce({ data: { data: null } });

    await expect(productRepository.listRanges(4, { signal })).resolves.toHaveLength(1);
    await expect(productRepository.listRanges(5)).resolves.toEqual([]);
    expect(apiClient.get).toHaveBeenNthCalledWith(1, 'api/productos/4/rangos', { signal });
  });
});
