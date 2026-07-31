import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../core/services/apiService';
import { DisenoApiRepository } from './diseno.repository';

vi.mock('../../../../core/services/apiService', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('DisenoApiRepository requirements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the exact requirements endpoint and nested response', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        data: {
          requerimientos: [{
            idRequerimientoDiseno: 'STAMP-34',
            tipo: 'ESTAMPADO',
            idPedido: 54,
            puedeCrearDiseno: true,
          }],
          resumen: { totalDisenosRequeridos: 1 },
        },
      },
    });
    const signal = new AbortController().signal;
    const repository = new DisenoApiRepository();

    const result = await repository.getRequerimientosDiseno(54, { signal });

    expect(apiClient.get).toHaveBeenCalledWith(
      'api/pedidos/54/requerimientos-diseno',
      { signal },
    );
    expect(result.requerimientos).toHaveLength(1);
    expect(result.requerimientos[0].idRequerimientoDiseno).toBe('STAMP-34');
  });

  it.each(['CLIENTE', 'PIXEL'])(
    'defines the requirement origin as %s using the exact contract',
    async origenDiseno => {
      apiClient.patch.mockResolvedValue({ data: { data: { origenDiseno } } });
      const repository = new DisenoApiRepository();

      await repository.definirOrigenRequerimiento(54, 'STAMP-34', origenDiseno);

      expect(apiClient.patch).toHaveBeenCalledWith(
        'api/pedidos/54/requerimientos-diseno/STAMP-34/origen',
        { origenDiseno },
      );
    },
  );
});
