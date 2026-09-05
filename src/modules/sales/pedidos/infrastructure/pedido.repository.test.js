import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../core/services/apiService';
import { pedidoRepository } from './pedido.repository';

vi.mock('../../../../core/services/apiService', () => ({
  apiClient: {
    patch: vi.fn(),
  },
}));

describe('pedidoRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
