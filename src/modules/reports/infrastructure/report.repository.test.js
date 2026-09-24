import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../core/services/apiService';
import { reportRepository } from './report.repository';

vi.mock('../../../core/services/apiService', () => ({
  apiClient: { get: vi.fn() },
}));

describe('reportRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['ventas', 'api/reportes/ventas'],
    ['pedidos', 'api/reportes/pedidos'],
    ['cotizaciones', 'api/reportes/cotizaciones'],
    ['abonos', 'api/reportes/abonos'],
  ])('consulta el reporte %s usando su endpoint real', async (type, endpoint) => {
    const payload = { reporte: type, registros: [], totalRegistros: 0 };
    apiClient.get.mockResolvedValue({ data: { data: payload } });

    await expect(reportRepository.get(type, {
      fechaInicio: '2026-01-01',
      fechaFin: '2026-01-31',
      idCliente: 4,
      estado: '',
      page: 2,
      limit: 20,
    })).resolves.toEqual(payload);

    expect(apiClient.get).toHaveBeenCalledWith(endpoint, expect.objectContaining({
      params: {
        fechaInicio: '2026-01-01',
        fechaFin: '2026-01-31',
        idCliente: 4,
        page: 2,
        limit: 20,
      },
    }));
  });

  it('descarga el PDF como Blob, conserva filtros y excluye page/limit', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    apiClient.get.mockResolvedValue({
      data: blob,
      headers: { 'content-disposition': 'attachment; filename="ventas-septiembre.pdf"' },
    });

    const result = await reportRepository.downloadPdf('ventas', {
      fechaInicio: '2026-09-01',
      fechaFin: '2026-09-30',
      estadoPago: 'COMPLETO',
      page: 3,
      limit: 100,
    });

    expect(apiClient.get).toHaveBeenCalledWith('api/reportes/ventas/pdf', {
      params: {
        fechaInicio: '2026-09-01',
        fechaFin: '2026-09-30',
        estadoPago: 'COMPLETO',
      },
      responseType: 'blob',
    });
    expect(result).toEqual({ blob, filename: 'ventas-septiembre.pdf' });
  });

  it('usa un filename seguro cuando Content-Disposition no está presente', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    apiClient.get.mockResolvedValue({ data: blob, headers: {} });

    await expect(reportRepository.downloadPdf('abonos', { page: 1, limit: 20 }))
      .resolves.toEqual({ blob, filename: 'reporte-abonos.pdf' });
  });

  it('extrae el mensaje JSON de una respuesta de error Blob', async () => {
    const error = new Error('Request failed');
    error.status = 400;
    error.response = {
      status: 400,
      data: new Blob([
        JSON.stringify({ message: 'El reporte supera el máximo de 1000 registros.' }),
      ], { type: 'application/json' }),
    };
    apiClient.get.mockRejectedValue(error);

    await expect(reportRepository.downloadPdf('pedidos')).rejects.toMatchObject({
      status: 400,
      message: 'El reporte supera el máximo de 1000 registros.',
    });
  });
});
