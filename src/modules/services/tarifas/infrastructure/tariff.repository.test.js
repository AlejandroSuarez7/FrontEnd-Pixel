import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../core/services/apiService';
import { tariffRepository } from './tariff.repository';

vi.mock('../../../../core/services/apiService', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('tariffRepository contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.post.mockResolvedValue({
      data: {
        data: {
          idTarifa: 8,
          idTecnica: 2,
          anchoHastaCm: 10.5,
          altoHastaCm: 12.75,
          precioUnitario: 8500.25,
          esGeneral: false,
          estado: true,
        },
      },
    });
    apiClient.patch.mockResolvedValue({ data: { data: {} } });
    apiClient.delete.mockResolvedValue({ data: { data: {} } });
  });

  it('lists one service tariffs using the administrative endpoint and backend pagination', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        data: [{
          idTarifaTecnica: 5,
          idTecnica: 2,
          nombre: 'Punto corazón',
          anchoHastaCm: '10',
          altoHastaCm: '10',
          precioUnitario: '10000',
          estado: true,
        }],
        meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
      },
    });

    const result = await tariffRepository.list({ idTecnica: 2, page: 1, limit: 100 });

    expect(apiClient.get).toHaveBeenCalledWith('/api/tarifas-tecnicas', {
      params: {
        idTecnica: 2,
        page: 1,
        limit: 100,
        sortBy: 'idTarifa',
        order: 'desc',
      },
      signal: undefined,
    });
    expect(result.items[0]).toMatchObject({
      idTarifa: 5,
      idTecnica: 2,
      precioUnitario: 10000,
      anchoHastaCm: 10,
      altoHastaCm: 10,
    });
  });

  it('creates a dimensional tariff using the current backend contract', async () => {
    await tariffRepository.create({
      idTecnica: '2',
      nombre: 'Punto corazón',
      anchoHastaCm: '10,5',
      altoHastaCm: '12,75',
      precioUnitario: '8500,25',
      esGeneral: false,
      estado: true,
    });

    expect(apiClient.post).toHaveBeenCalledWith('/api/tarifas-tecnicas', {
      idTecnica: 2,
      nombre: 'Punto corazón',
      anchoHastaCm: 10.5,
      altoHastaCm: 12.75,
      esGeneral: false,
      precioUnitario: 8500.25,
      estado: true,
    });
  });

  it('creates a general tariff without fake zero dimensions', async () => {
    await tariffRepository.create({
      idTecnica: 2,
      nombre: 'Tarifa general',
      anchoHastaCm: null,
      altoHastaCm: null,
      precioUnitario: 7000,
      esGeneral: true,
      estado: true,
    });

    expect(apiClient.post).toHaveBeenCalledWith('/api/tarifas-tecnicas', {
      idTecnica: 2,
      nombre: 'Tarifa general',
      anchoHastaCm: null,
      altoHastaCm: null,
      esGeneral: true,
      precioUnitario: 7000,
      estado: true,
    });
  });

  it('updates and deletes tariffs through the existing endpoints', async () => {
    await tariffRepository.update(8, {
      idTecnica: 2,
      nombre: 'Carta',
      anchoHastaCm: 20,
      altoHastaCm: 20,
      precioUnitario: 9000,
      esGeneral: false,
      estado: true,
    });
    await tariffRepository.remove(8);

    expect(apiClient.patch).toHaveBeenCalledWith('/api/tarifas-tecnicas/8', {
      nombre: 'Carta',
      anchoHastaCm: 20,
      altoHastaCm: 20,
      esGeneral: false,
      precioUnitario: 9000,
      estado: true,
    });
    expect(apiClient.delete).toHaveBeenCalledWith('/api/tarifas-tecnicas/8');
  });

  it('lists public techniques and handles invalid catalog responses', async () => {
    const signal = new AbortController().signal;
    apiClient.get
      .mockResolvedValueOnce({ data: { data: [{ idTecnica: 2, nombre: 'DTF' }] } })
      .mockResolvedValueOnce({ data: { data: null } });
    await expect(tariffRepository.listTechniques({ signal })).resolves.toHaveLength(1);
    await expect(tariffRepository.listTechniques()).resolves.toEqual([]);
    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/api/public/tecnicas', { signal });
  });

  it('loads and normalizes technique discounts', async () => {
    const signal = new AbortController().signal;
    apiClient.get
      .mockResolvedValueOnce({ data: { data: [{ idDescuento: '3', idTecnica: '2', cantidadMinima: '10', porcentaje: '7.5', estado: false }] } })
      .mockResolvedValueOnce({ data: { data: {} } });

    await expect(tariffRepository.listDiscounts(2, { signal })).resolves.toEqual([
      expect.objectContaining({ idDescuento: 3, idTecnica: 2, cantidadMinima: 10, porcentaje: 7.5, estado: false }),
    ]);
    await expect(tariffRepository.listDiscounts(2)).resolves.toEqual([]);
  });

  it('replaces discounts with normalized payloads and maps the response', async () => {
    apiClient.patch
      .mockResolvedValueOnce({ data: { data: [{ idDescuento: 4, idTecnica: 2, cantidadMinima: 20, porcentaje: 12.5 }] } })
      .mockResolvedValueOnce({ data: { data: null } });

    await expect(tariffRepository.replaceDiscounts(2, [{ cantidadMinima: '20', porcentaje: '12,5', estado: 1 }]))
      .resolves
      .toEqual([expect.objectContaining({ porcentaje: 12.5, estado: true })]);
    await expect(tariffRepository.replaceDiscounts(2, [])).resolves.toEqual([]);
    expect(apiClient.patch).toHaveBeenNthCalledWith(1, '/api/tarifas-tecnicas/tecnicas/2/descuentos', {
      descuentos: [{ cantidadMinima: 20, porcentaje: '12.5', estado: true }],
    });
  });

  it('maps nullable tariff dimensions and inferred general state', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { data: { idTarifaTecnica: '9', idTecnica: '2', anchoHastaCm: null, altoHastaCm: null, precioUnitario: null, estado: false } } });
    const result = await tariffRepository.create({ idTecnica: 2, nombre: 'General', esGeneral: true, precioUnitario: null, estado: false });
    expect(result).toMatchObject({ idTarifa: 9, idTecnica: 2, anchoHastaCm: null, altoHastaCm: null, esGeneral: true, precioUnitario: null, estado: false, tecnica: null });
  });
});
