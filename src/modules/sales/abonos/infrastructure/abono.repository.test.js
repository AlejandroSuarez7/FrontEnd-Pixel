import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../core/services/apiService';
import { fetchProtectedBlob } from '../../../../core/services/protectedFileService';
import { abonoRepository, buildClientReceiptFormData } from './abono.repository';

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
    apiClient.patch.mockReset();
    apiClient.delete.mockReset();
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

  it('builds receipt form data defensively and ignores invalid optional values', () => {
    const file = new File(['receipt'], 'receipt.png', { type: 'image/png' });
    const formData = buildClientReceiptFormData(file, {
      montoDetectado: -1,
      referenciaDetectada: `  ${'R'.repeat(120)}  `,
      fechaDetectada: '2026-02-30',
      bancoDetectado: '  Banco Pixel  ',
      calidadLectura: 101,
      requiereRevisionManual: true,
    }, `  ${'O'.repeat(520)}  `);

    expect(formData.get('archivo')).toBe(file);
    expect(formData.get('montoDetectado')).toBeNull();
    expect(formData.get('referenciaDetectada')).toHaveLength(100);
    expect(formData.get('fechaDetectada')).toBeNull();
    expect(formData.get('bancoDetectado')).toBe('Banco Pixel');
    expect(formData.get('calidadLectura')).toBeNull();
    expect(formData.get('requiereRevisionManual')).toBe('true');
    expect(formData.get('observaciones')).toHaveLength(500);
  });

  it('lists records by order and client order, forwarding the abort signal', async () => {
    const signal = new AbortController().signal;
    apiClient.get
      .mockResolvedValueOnce({ data: { data: [{ idAbono: 1, estado: 'PENDIENTE' }] } })
      .mockResolvedValueOnce({ data: { data: [{ idAbono: 2, estado: 'CONFIRMADO' }] } });

    const adminItems = await abonoRepository.listByPedido(7);
    const clientItems = await abonoRepository.listClientByPedido(8, { signal });

    expect(apiClient.get).toHaveBeenNthCalledWith(1, 'api/pedidos/7/abonos');
    expect(apiClient.get).toHaveBeenNthCalledWith(
      2,
      'api/cliente/pedidos/8/abonos',
      { signal },
    );
    expect(adminItems[0].idAbono).toBe(1);
    expect(clientItems[0].idAbono).toBe(2);
  });

  it('loads orders with and without a search term', async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: { data: { idPedido: 11 } } })
      .mockResolvedValueOnce({ data: { data: [{ idPedido: 11 }] } })
      .mockResolvedValueOnce({ data: {} });

    await expect(abonoRepository.getPedido(11)).resolves.toEqual({ idPedido: 11 });
    await expect(abonoRepository.listPedidos({ search: 'Ana' })).resolves.toEqual([{ idPedido: 11 }]);
    await expect(abonoRepository.listPedidos()).resolves.toEqual([]);

    expect(apiClient.get).toHaveBeenNthCalledWith(1, 'api/pedidos/11');
    expect(apiClient.get).toHaveBeenNthCalledWith(2, 'api/pedidos/buscar', {
      params: { termino: 'Ana' },
    });
    expect(apiClient.get).toHaveBeenNthCalledWith(3, 'api/pedidos', { params: {} });
  });

  it('creates JSON and multipart payments and maps the API response', async () => {
    apiClient.post
      .mockResolvedValueOnce({ data: { data: { idAbono: 20, monto: 50000 } } })
      .mockResolvedValueOnce({ data: { data: { idAbono: 21, monto: 75000 } } });

    const plain = await abonoRepository.create({
      idPedido: '3',
      monto: '50000',
      metodoPago: 'EFECTIVO',
      referencia: '  REF-1 ',
      confirmar: false,
    });
    const file = new File(['receipt'], 'receipt.pdf', { type: 'application/pdf' });
    const multipart = await abonoRepository.create({
      idPedido: 4,
      monto: 75000,
      metodoPago: 'TRANSFERENCIA',
      referencia: '',
      archivo: file,
    });

    expect(apiClient.post.mock.calls[0]).toEqual([
      'api/abonos',
      expect.objectContaining({ idPedido: 3, monto: 50000, referencia: 'REF-1', confirmar: false }),
    ]);
    const requestBody = apiClient.post.mock.calls[1][1];
    expect(requestBody).toBeInstanceOf(FormData);
    expect(requestBody.get('idPedido')).toBe('4');
    expect(requestBody.get('archivo')).toBe(file);
    expect(requestBody.get('referencia')).toBeNull();
    expect(plain.idAbono).toBe(20);
    expect(multipart.idAbono).toBe(21);
  });

  it('updates, confirms, rejects and removes payments with normalized payloads', async () => {
    apiClient.patch
      .mockResolvedValueOnce({ data: { data: { idAbono: 30, monto: 90000 } } })
      .mockResolvedValueOnce({ data: { ok: true, action: 'confirmed' } })
      .mockResolvedValueOnce({ data: { ok: true, action: 'rejected' } });
    apiClient.delete.mockResolvedValueOnce({ data: { ok: true, action: 'deleted' } });

    const updated = await abonoRepository.update(30, {
      monto: '',
      metodoPago: 'TRANSFERENCIA',
      referencia: '  REF-30 ',
      fechaPago: '',
      observaciones: '  revisado ',
    });
    const confirmed = await abonoRepository.confirm(30, {
      referencia: '  FINAL-30 ',
      observaciones: '  aprobado ',
    });
    const rejected = await abonoRepository.reject(31, '  ilegible ');
    const removed = await abonoRepository.remove(32);

    expect(apiClient.patch).toHaveBeenNthCalledWith(1, 'api/abonos/30', {
      monto: null,
      metodoPago: 'TRANSFERENCIA',
      referencia: 'REF-30',
      fechaPago: null,
      observaciones: 'revisado',
    });
    expect(apiClient.patch).toHaveBeenNthCalledWith(2, 'api/abonos/30/confirmar', {
      referencia: 'FINAL-30',
      observaciones: 'aprobado',
    });
    expect(apiClient.patch).toHaveBeenNthCalledWith(3, 'api/abonos/31/rechazar', {
      motivoRechazo: 'ilegible',
    });
    expect(apiClient.delete).toHaveBeenCalledWith('api/abonos/32');
    expect(updated.idAbono).toBe(30);
    expect(confirmed.action).toBe('confirmed');
    expect(rejected.action).toBe('rejected');
    expect(removed.action).toBe('deleted');
  });

  it('loads admin receipts and forwards list cancellation untouched', async () => {
    const canceled = Object.assign(new Error('cancelled'), { code: 'ERR_CANCELED' });
    fetchProtectedBlob.mockResolvedValueOnce({ blob: new Blob(['x']), mimeType: 'image/png' });
    apiClient.get.mockRejectedValueOnce(canceled);

    await expect(abonoRepository.getAdminReceipt(41)).resolves.toEqual(
      expect.objectContaining({ mimeType: 'image/png' }),
    );
    expect(fetchProtectedBlob).toHaveBeenCalledWith('api/abonos/41/comprobante');
    await expect(abonoRepository.list({}, { signal: new AbortController().signal }))
      .rejects
      .toBe(canceled);
    expect(apiClient.get).toHaveBeenCalledWith('api/abonos', expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  });

  it.each([
    ['getById', [1], 'No se pudo consultar el abono', 'get'],
    ['listByPedido', [1], 'No se pudieron consultar los abonos del pedido', 'get'],
    ['listClientByPedido', [1], 'No se pudieron consultar tus abonos', 'get'],
    ['getPedido', [1], 'No se pudo consultar el pedido', 'get'],
    ['listPedidos', [], 'No se pudieron consultar los pedidos', 'get'],
    ['create', [{ idPedido: 1 }], 'No se pudo registrar el abono', 'post'],
    ['update', [1, {}], 'No se pudo actualizar el abono', 'patch'],
    ['confirm', [1], 'No se pudo confirmar el abono', 'patch'],
    ['reject', [1], 'No se pudo rechazar el abono', 'patch'],
    ['remove', [1], 'No se pudo eliminar el abono', 'delete'],
  ])('wraps %s request failures', async (method, args, message, clientMethod) => {
    apiClient[clientMethod].mockRejectedValueOnce(new Error(message));
    await expect(abonoRepository[method](...args)).rejects.toThrow(message);
  });
});
