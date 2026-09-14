import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../core/services/apiService';
import { productRepository } from './product.repository';

vi.mock('../../../core/services/apiService', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
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
});
