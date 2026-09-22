import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../core/services/apiService';
import { pedidoRepository } from './pedido.repository';

vi.mock('../../../../core/services/apiService', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('pedidoRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } } });
    apiClient.post.mockResolvedValue({ data: { data: { idPedido: 1, detalles: [] } } });
    apiClient.patch.mockResolvedValue({ data: { data: { idPedido: 1, detalles: [] }, message: 'ok' } });
  });

  it('uses the exact endpoint and body required by the backend', async () => {
    apiClient.patch.mockResolvedValueOnce({
      data: {
        data: {
          idDiseno: 90,
          estado: 'ENVIADO',
        },
      },
    });

    const file = new File(['design'], 'diseno-cliente.png', { type: 'image/png' });
    const result = await pedidoRepository.registrarDisenoRecibidoCliente(36, 'STAMP-102', {
      archivo: file,
      medioRecepcion: 'WHATSAPP',
      observaciones: ' Recibido por WhatsApp. ',
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      'api/pedidos/36/requerimientos-diseno/STAMP-102/diseno-recibido-cliente',
      expect.any(FormData),
    );
    const formData = apiClient.patch.mock.calls[0][1];
    expect(formData.get('archivo')).toBe(file);
    expect(formData.get('medioRecepcion')).toBe('WHATSAPP');
    expect(formData.get('observaciones')).toBe('Recibido por WhatsApp.');
    expect(result.estado).toBe('ENVIADO');
  });

  it('uses the exact endpoint for finalizing an eligible order', async () => {
    apiClient.patch.mockResolvedValueOnce({
      data: {
        data: {
          idPedido: 36,
          estadoPedido: 'FINALIZADO',
        },
      },
    });

    await pedidoRepository.finalizar(36);

    expect(apiClient.patch).toHaveBeenCalledTimes(1);
    expect(apiClient.patch).toHaveBeenCalledWith('api/pedidos/36/finalizar');
  });

  it('covers the complete successful order repository workflow', async () => {
    await pedidoRepository.getExpediente(1, { signal: 'signal' });
    await pedidoRepository.list({ estado: 'PENDIENTE' }, { signal: 'signal' });
    await pedidoRepository.create({ idCotizacion: 2 });
    await pedidoRepository.update(1, { observaciones: 'x' });
    await pedidoRepository.marcarEnProceso(1);
    await pedidoRepository.updateEstimatedDelivery(1, '2026-10-01');
    await pedidoRepository.marcarPendienteSaldo(1);
    await pedidoRepository.confirmarEntrega(1);
    await pedidoRepository.actualizarRequiereDiseno(1, 2, false);
    await pedidoRepository.saveClientDesignUrl(1, 2, 'https://file.test/a.png');
    await pedidoRepository.anular(1, ' Cliente cancela ');
    await pedidoRepository.anular(2, '   ');
    expect(apiClient.get).toHaveBeenCalledTimes(2);
    expect(apiClient.post).toHaveBeenCalledWith('api/pedidos', expect.any(Object));
    expect(apiClient.patch).toHaveBeenCalledWith('api/pedidos/1/anular', { motivoAnulacion: 'Cliente cancela' });
    expect(apiClient.patch).toHaveBeenCalledWith('api/pedidos/2/anular', {});
  });

  it.each([
    [403, 'No tienes permiso para cargar este diseno.'],
    [502, 'No pudimos almacenar el archivo. Intenta nuevamente.'],
    [400, 'mensaje backend'],
  ])('maps received-design upload error %s', async (status, message) => {
    apiClient.patch.mockRejectedValueOnce({ response: { status, data: { message: status === 400 ? message : undefined } } });
    await expect(pedidoRepository.registrarDisenoRecibidoCliente(1, 'A/B', { archivo: new File(['x'], 'a.png') }))
      .rejects.toMatchObject({ message });
  });
});
