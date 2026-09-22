import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../core/services/apiService';
import { ventaRepository } from './venta.repository';

vi.mock('../../../../core/services/apiService', () => ({
  apiClient: { get: vi.fn() },
}));
vi.mock('./adapters/venta.dto', () => ({
  ventaDTO: { fromApiList: vi.fn((items) => items) },
}));

describe('ventaRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses the search endpoint and optional filters', async () => {
    apiClient.get.mockResolvedValue({ data: { ventas: [{ idVenta: 1 }] } });
    await expect(ventaRepository.list({
      search: ' Ana ', fechaInicio: '2026-01-01', fechaFin: '2026-01-31', idCliente: 2, estadoPago: 'PAGADO',
    }, { signal: 'signal' })).resolves.toEqual([{ idVenta: 1 }]);
    expect(apiClient.get).toHaveBeenCalledWith('api/ventas/buscar', {
      params: { termino: 'Ana', fechaInicio: '2026-01-01', fechaFin: '2026-01-31', idCliente: 2, estadoPago: 'PAGADO' },
      signal: 'signal',
    });
  });

  it('uses the normal listing endpoint with empty and populated filters', async () => {
    apiClient.get.mockResolvedValue({ data: { data: [{ idVenta: 2 }] } });
    await ventaRepository.list({ fechaInicio: '2026-01-01', estadoPago: 'PENDIENTE' });
    expect(apiClient.get).toHaveBeenCalledWith('api/ventas', {
      params: { fechaInicio: '2026-01-01', estadoPago: 'PENDIENTE' }, signal: undefined,
    });
    apiClient.get.mockResolvedValueOnce({ data: [] });
    await expect(ventaRepository.list()).resolves.toEqual([]);
  });

  it('normalizes period and general summaries including fallbacks', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { data: { totalVentas: 20, cantidadVentas: 2, ticketPromedio: 10 } } });
    await expect(ventaRepository.getResumen({ fechaInicio: 'a', fechaFin: 'b' })).resolves.toEqual({
      totalVentas: 20, cantidadVentas: 2, ticketPromedio: 10,
      ventasPagadasCompletas: 0, ventasPagadasParciales: 0,
    });
    apiClient.get.mockResolvedValueOnce({ data: {} });
    await expect(ventaRepository.getResumen()).resolves.toMatchObject({ totalVentas: 0, cantidadVentas: 0 });
  });
});
