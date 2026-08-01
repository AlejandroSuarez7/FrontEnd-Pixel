import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../core/services/apiService';
import { publicQuoteRepository } from './publicQuote.repository';

vi.mock('../../../core/services/apiService', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('publicQuoteRepository final contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { data: {} } });
    apiClient.post.mockResolvedValue({ data: { data: {} } });
    apiClient.patch.mockResolvedValue({ data: { data: {} } });
  });

  it('validates the complete public payload without changing its items', async () => {
    const payload = {
      items: [{
        tipoProducto: 'OTRO',
        nombrePersonalizado: 'Bolso artesanal',
        cantidad: 5,
        suministradoPor: 'CLIENTE',
        estampados: [],
      }],
      observaciones: 'Revisar material',
    };

    await publicQuoteRepository.calculate(payload);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/public/cotizaciones/calcular',
      payload,
      expect.objectContaining({ skipAuthRedirect: true }),
    );
  });

  it('uses the protected client edit endpoint with only items and observations', async () => {
    const items = [{
      tipoProducto: 'CATALOGO',
      idProducto: 10,
      cantidad: 12,
      suministradoPor: 'PIXEL',
      estampados: [],
    }];

    await publicQuoteRepository.updateClientQuote(42, {
      items,
      observaciones: null,
      localId: 'NO-ENVIAR',
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/api/cotizaciones/42/cliente',
      {
        items,
        observaciones: null,
      },
    );
  });

  it('loads named sizes for the selected technique and forwards cancellation', async () => {
    const signal = new AbortController().signal;
    apiClient.get.mockResolvedValue({ data: { data: [{ idTarifaTecnica: 1, nombre: 'Punto corazón' }] } });

    await expect(publicQuoteRepository.listTechniqueTariffs(2, { signal })).resolves.toEqual([
      { idTarifaTecnica: 1, nombre: 'Punto corazón' },
    ]);
    expect(apiClient.get).toHaveBeenCalledWith('/api/public/tecnicas/2/tarifas', { signal });
  });
});
