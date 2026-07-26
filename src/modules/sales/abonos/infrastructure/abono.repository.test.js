import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../core/services/apiService';
import { fetchProtectedBlob } from '../../../../core/services/protectedFileService';
import { abonoRepository } from './abono.repository';

vi.mock('../../../../core/services/apiService', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../../core/services/protectedFileService', () => ({
  fetchProtectedBlob: vi.fn(),
}));

describe('abonoRepository', () => {
  beforeEach(() => {
    apiClient.get.mockReset();
    apiClient.post.mockReset();
    fetchProtectedBlob.mockReset();
  });

  it('uses backend pagination and preserves nullable OCR amounts', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        data: [{
          idAbono: 9,
          idPedido: 52,
          monto: null,
          montoDetectadoOcr: 150000,
          estado: 'PENDIENTE',
          comprobanteDisponible: true,
        }],
        meta: {
          page: 2,
          limit: 10,
          total: 13,
          totalPages: 2,
          hasNextPage: false,
          hasPrevPage: true,
        },
      },
    });

    const result = await abonoRepository.list({
      page: 2,
      limit: 10,
      idCliente: 4,
      idPedido: 52,
      search: 'nequi',
    });

    expect(apiClient.get).toHaveBeenCalledWith('api/abonos', {
      params: expect.objectContaining({
        page: 2,
        limit: 10,
        idCliente: 4,
        idPedido: 52,
        search: 'nequi',
      }),
    });
    expect(result.items[0].monto).toBeNull();
    expect(result.items[0].montoDetectadoOcr).toBe(150000);
    expect(result.meta.total).toBe(13);
  });

  it.each([
    ['image/jpeg', 'comprobante.jpg'],
    ['image/png', 'comprobante.png'],
    ['application/pdf', 'comprobante.pdf'],
  ])('uploads %s as multipart with the required archivo field', async (mimeType, fileName) => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        data: {
          abono: { idAbono: 9 },
          ocr: { montoDetectado: 150000, requiereRevisionManual: false },
        },
      },
    });
    const file = new File(['receipt'], fileName, { type: mimeType });

    const result = await abonoRepository.uploadClientReceipt(52, file);

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    const [url, formData, config] = apiClient.post.mock.calls[0];
    expect(url).toBe('api/cliente/pedidos/52/abonos/comprobante');
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get('archivo')).toBe(file);
    expect(config).toEqual({ timeout: 120000 });
    expect(result.ocr.montoDetectado).toBe(150000);
  });

  it('rejects the upload before the request when the value is not a File', async () => {
    await expect(abonoRepository.uploadClientReceipt(52, 'C:\\fakepath\\receipt.png'))
      .rejects
      .toThrow('Selecciona un comprobante antes de continuar.');

    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('loads protected client receipts through the blob helper', async () => {
    fetchProtectedBlob.mockResolvedValueOnce({
      blob: new Blob(['receipt'], { type: 'application/pdf' }),
      mimeType: 'application/pdf',
    });

    const result = await abonoRepository.getClientReceipt(9);

    expect(fetchProtectedBlob).toHaveBeenCalledWith('api/cliente/abonos/9/comprobante');
    expect(result.mimeType).toBe('application/pdf');
  });
});
