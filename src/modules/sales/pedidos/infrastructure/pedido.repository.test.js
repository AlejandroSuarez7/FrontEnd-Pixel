import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../core/services/apiService';
import { pedidoRepository } from './pedido.repository';

vi.mock('../../../../core/services/apiService', () => ({
  apiClient: {
    patch: vi.fn(),
  },
}));

describe('pedidoRepository client design receipt', () => {
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

    const result = await pedidoRepository.registrarDisenoRecibidoCliente(36, 102, {
      archivoDisenoInicialUrl: ' https://example.com/diseno-cliente.png ',
      medioRecepcion: 'WHATSAPP',
      observaciones: ' Recibido por WhatsApp. ',
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      'api/pedidos/36/detalles/102/diseno-recibido-cliente',
      {
        archivoDisenoInicialUrl: 'https://example.com/diseno-cliente.png',
        medioRecepcion: 'WHATSAPP',
        observaciones: 'Recibido por WhatsApp.',
      },
    );
    expect(result.estado).toBe('ENVIADO');
  });
});
