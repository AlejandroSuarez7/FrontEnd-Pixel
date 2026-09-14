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

  it('maps the real nested detail contract and backend financial aliases', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        data: {
          idAbono: 12,
          idPedido: 36,
          estado: 'PENDIENTE',
          metodoPago: 'TRANSFERENCIA',
          origenRegistroCodigo: 'FRONTEND',
          origenRegistroLabel: 'Enviado desde el portal del cliente',
          datosDetectados: {
            monto: '150000',
            referencia: 'REF-REAL',
            fecha: '2026-07-28',
            banco: 'Nequi',
            calidadLectura: 82,
            requiereRevisionManual: false,
          },
          datosDefinitivos: {
            monto: null,
            referencia: null,
            fecha: null,
          },
          pedido: {
            idPedido: 36,
            cliente: {
              idCliente: 5,
              nombre: 'Cliente Real',
              correo: 'cliente@example.com',
            },
            totalPagadoConfirmado: '300000',
          },
          totalPedido: '800000',
          totalConfirmado: '300000',
          saldoPendiente: '500000',
          estadoPago: 'PARCIAL',
        },
      },
    });

    const result = await abonoRepository.getById(12);

    expect(apiClient.get).toHaveBeenCalledWith('api/abonos/12');
    expect(result.montoDetectadoOcr).toBe(150000);
    expect(result.referenciaDetectadaOcr).toBe('REF-REAL');
    expect(result.pedido.cliente.nombre).toBe('Cliente Real');
    expect(result.pedido.total).toBe('800000');
    expect(result.pedido.totalPagadoConfirmado).toBe('300000');
    expect(result.pedido.saldoPendiente).toBe('500000');
    expect(result.origenRegistroLabel).toBe('Enviado desde el portal del cliente');
  });

  it.each([
    ['image/jpeg', 'comprobante.jpg'],
    ['image/png', 'comprobante.png'],
    ['application/pdf', 'comprobante.pdf'],
  ])('uploads %s as multipart with the exact analysis fields', async (mimeType, fileName) => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        data: {
          abono: { idAbono: 9, estado: 'PENDIENTE' },
          datosDetectados: {
            monto: 150000,
            requiereRevisionManual: mimeType === 'application/pdf',
            origenAnalisis: 'FRONTEND',
          },
        },
      },
    });
    const file = new File(['receipt'], fileName, { type: mimeType });
    const detectedData = {
      montoDetectado: mimeType === 'application/pdf' ? null : 150000,
      referenciaDetectada: 'M123456',
      fechaDetectada: '2026-07-26',
      bancoDetectado: 'Nequi',
      calidadLectura: mimeType === 'application/pdf' ? 0 : 82,
      requiereRevisionManual: mimeType === 'application/pdf',
    };

    const result = await abonoRepository.uploadClientReceipt(
      52,
      file,
      detectedData,
      'Transferencia del pedido',
    );

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    const [url, formData, config] = apiClient.post.mock.calls[0];
    expect(url).toBe('api/cliente/pedidos/52/abonos/comprobante');
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get('archivo')).toBe(file);
    expect(formData.get('referenciaDetectada')).toBe('M123456');
    expect(formData.get('fechaDetectada')).toBe('2026-07-26');
    expect(formData.get('bancoDetectado')).toBe('Nequi');
    expect(formData.get('calidadLectura')).toBe(
      mimeType === 'application/pdf' ? '0' : '82',
    );
    expect(formData.get('requiereRevisionManual')).toBe(
      String(mimeType === 'application/pdf'),
    );
    expect(formData.get('origenAnalisis')).toBe('FRONTEND');
    expect(formData.get('observaciones')).toBe('Transferencia del pedido');
    expect(formData.get('montoDetectado')).toBe(
      mimeType === 'application/pdf' ? null : '150000',
    );
    expect(config).toEqual({ timeout: 120000 });
    expect(config.headers).toBeUndefined();
    expect(result.abono.estado).toBe('PENDIENTE');
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
