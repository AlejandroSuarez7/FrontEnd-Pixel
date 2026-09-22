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

  it('creates a public quote as JSON when it has no files', async () => {
    const payload = {
      items: [{ idProducto: 10, origenDiseno: 'PIXEL', estampados: [] }],
    };

    await publicQuoteRepository.create(payload);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/public/cotizaciones',
      payload,
      { skipAuthRedirect: true },
    );
  });

  it('creates a public quote as multipart when a client design file exists', async () => {
    const file = new File(['design'], 'design.jpeg', { type: 'image/jpeg' });

    await publicQuoteRepository.create({
      items: [{
        idProducto: 10,
        requiereDiseno: true,
        origenDiseno: 'CLIENTE',
        estampados: [{ origenDiseno: 'CLIENTE' }],
        archivoDiseno: file,
      }],
    });

    const body = apiClient.post.mock.calls[0][1];
    expect(body).toBeInstanceOf(FormData);
    expect(body.getAll('archivoDiseno')).toEqual([file]);
    expect(JSON.parse(body.get('payload')).items[0].archivoDisenoIndice).toBe(0);
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

  it('loads every public catalog with cancellation support', async () => {
    const signal = new AbortController().signal;
    apiClient.get
      .mockResolvedValueOnce({ data: { data: [{ idProducto: 1 }] } })
      .mockResolvedValueOnce({ data: { data: [{ idProducto: 2 }] } })
      .mockResolvedValueOnce({ data: { data: [{ idProducto: 3 }] } })
      .mockResolvedValueOnce({ data: { data: [{ idCategoriaProducto: 4 }] } })
      .mockResolvedValueOnce({ data: { data: [{ idTecnica: 5 }] } });

    await expect(publicQuoteRepository.listProducts({ signal })).resolves.toHaveLength(1);
    await expect(publicQuoteRepository.listProductsByCategory(2, { signal })).resolves.toHaveLength(1);
    await expect(publicQuoteRepository.listProductsByCategory(null, { signal })).resolves.toHaveLength(1);
    await expect(publicQuoteRepository.listCategories({ signal })).resolves.toHaveLength(1);
    await expect(publicQuoteRepository.listTechniques({ signal })).resolves.toHaveLength(1);

    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/api/public/productos', {
      params: { idCategoriaProducto: 2 },
      signal,
    });
    expect(apiClient.get).toHaveBeenNthCalledWith(3, '/api/public/productos', {
      params: {},
      signal,
    });
  });

  it('returns safe catalog fallbacks for missing or invalid lists', async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: { data: { invalid: true } } });

    await expect(publicQuoteRepository.listProducts()).resolves.toEqual([]);
    await expect(publicQuoteRepository.listTechniqueTariffs(4)).resolves.toEqual([]);
  });

  it('wraps array calculations and returns protected client quote data', async () => {
    const signal = new AbortController().signal;
    apiClient.post.mockResolvedValueOnce({ data: { data: { total: 25000 } } });
    apiClient.get.mockResolvedValueOnce({ data: { data: { idCotizacion: 9 } } });

    await expect(publicQuoteRepository.calculate([{ idProducto: 1 }], { signal }))
      .resolves
      .toEqual({ total: 25000 });
    await expect(publicQuoteRepository.getClientQuote(9, { signal }))
      .resolves
      .toEqual({ idCotizacion: 9 });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/public/cotizaciones/calcular',
      { items: [{ idProducto: 1 }] },
      { skipAuthRedirect: true, signal },
    );
    expect(apiClient.get).toHaveBeenCalledWith('/api/cotizaciones/9', { signal });
  });

  it('defaults omitted client observations to null', async () => {
    await publicQuoteRepository.updateClientQuote(7, { items: [] });
    expect(apiClient.patch).toHaveBeenCalledWith('/api/cotizaciones/7/cliente', {
      items: [],
      observaciones: null,
    });
  });
});
