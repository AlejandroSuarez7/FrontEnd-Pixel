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

  it('normalizes catalog aliases and returns an empty list for invalid responses', async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: [{ id: 3, codigo: 'roles.ver', nombre: 'Ver roles' }] })
      .mockResolvedValueOnce({ data: { data: null } });
    const repository = new PermissionsApiRepository();

    await expect(repository.list()).resolves.toEqual([expect.objectContaining({
      idPermiso: 3,
      modulo: 'general',
      accion: 'ver',
      label: 'Ver roles',
      descripcion: 'roles.ver',
      estado: true,
    })]);
    await expect(repository.list()).resolves.toEqual([]);
  });

  it('loads permission codes from arrays and object aliases', async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: { data: ['roles.ver', { codigo: 'roles.editar' }] } })
      .mockResolvedValueOnce({ data: { codigos: ['roles.eliminar'] } });
    const repository = new PermissionsApiRepository();

    await expect(repository.listByRole(2)).resolves.toEqual(['roles.ver', 'roles.editar']);
    await expect(repository.listByRole(3)).resolves.toEqual(['roles.eliminar']);
    expect(apiClient.get).toHaveBeenNthCalledWith(1, 'api/permisos/roles/2');
  });

  it('synchronizes the backend permission catalog', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { synchronized: true } });
    await expect(new PermissionsApiRepository().syncCatalog()).resolves.toEqual({ synchronized: true });
    expect(apiClient.post).toHaveBeenCalledWith('api/permisos/sincronizar');
  });
});
