import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../core/services/apiService';
import { RolesApiRepository } from './roles.repository';

vi.mock('../../../../core/services/apiService', () => ({
  apiClient: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('RolesApiRepository deletion contracts', () => {
  beforeEach(() => {
    apiClient.get.mockReset();
    apiClient.delete.mockReset();
  });

  it('queries the exact deletion impact endpoint and normalizes its nested response', async () => {
    const signal = new AbortController().signal;
    apiClient.get.mockResolvedValue({
      data: {
        data: {
          puedeEliminar: true,
          requiereConfirmacionReforzada: true,
          totalAfectados: 3,
          limiteRegistrosPorTipo: 10,
          afectados: [{ tipo: 'Usuarios', accion: 'ELIMINAR', cantidad: 3 }],
        },
      },
    });
    const repository = new RolesApiRepository();

    const result = await repository.getDeletionImpact(8, { signal });

    expect(apiClient.get).toHaveBeenCalledWith(
      'api/roles/8/impacto-eliminacion',
      { signal },
    );
    expect(result).toEqual(expect.objectContaining({
      puedeEliminar: true,
      requiereConfirmacionReforzada: true,
      totalAfectados: 3,
      limiteRegistrosPorTipo: 10,
    }));
    expect(result.afectados).toHaveLength(1);
  });

  it('uses the existing permanent deletion endpoint unchanged', async () => {
    apiClient.delete.mockResolvedValue({ data: { message: 'ok' } });
    const repository = new RolesApiRepository();

    await repository.hardDelete(8);

    expect(apiClient.delete).toHaveBeenCalledWith('api/roles/8/eliminar');
  });
});
