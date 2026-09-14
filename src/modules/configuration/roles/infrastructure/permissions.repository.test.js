import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../core/services/apiService';
import { PermissionsApiRepository } from './permissions.repository';

vi.mock('../../../../core/services/apiService', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

describe('PermissionsApiRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('preserves the production metadata supplied by the backend catalog', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        data: [{
          idPermiso: 40,
          codigo: 'disenos.produccion',
          label: 'Consultar cola de producción',
          modulo: 'produccion',
          accion: 'cola_ver',
        }],
      },
    });

    const permissions = await new PermissionsApiRepository().list();

    expect(permissions[0]).toMatchObject({
      codigo: 'disenos.produccion',
      label: 'Consultar cola de producción',
      modulo: 'produccion',
      accion: 'cola_ver',
    });
  });

  it('sends the exact selected permission code without aliases', async () => {
    apiClient.patch.mockResolvedValue({ data: { ok: true } });

    await new PermissionsApiRepository().assignToRole(7, ['disenos.produccion']);

    expect(apiClient.patch).toHaveBeenCalledWith('api/permisos/roles/7', {
      permisos: ['disenos.produccion'],
    });
  });
});
