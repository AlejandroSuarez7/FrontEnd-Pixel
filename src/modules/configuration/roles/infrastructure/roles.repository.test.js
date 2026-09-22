import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../core/services/apiService';
import { RolesApiRepository } from './roles.repository';

vi.mock('../../../../core/services/apiService', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
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

  it('lists roles and creates and updates nested or direct API responses', async () => {
    const signal = new AbortController().signal;
    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ idRol: 1, nombre: 'Administrador', estado: true }] },
    });
    apiClient.post.mockResolvedValueOnce({
      data: { data: { idRol: 2, nombre: 'Diseñador', estado: true } },
    });
    apiClient.patch.mockResolvedValueOnce({
      data: { idRol: 2, nombre: 'Diseñador senior', estado: true },
    });
    const repository = new RolesApiRepository();

    const listed = await repository.list({ page: 1 }, { signal });
    const created = await repository.create({ nombre: ' Diseñador ', descripcion: ' Diseño ', estado: true });
    const updated = await repository.update(2, { nombre: ' Diseñador senior ', estado: true });

    expect(apiClient.get).toHaveBeenCalledWith('api/roles', {
      params: expect.objectContaining({ page: 1, sortBy: 'nombre', order: 'asc' }),
      signal,
    });
    expect(listed.items[0].nombre).toBe('Administrador');
    expect(created.id).toBe(2);
    expect(updated.nombre).toBe('Diseñador senior');
  });

  it('toggles role state and normalizes sparse deletion impacts', async () => {
    apiClient.delete.mockResolvedValueOnce({ data: { ok: true } });
    apiClient.get.mockResolvedValueOnce({ data: { motivo: 'Tiene usuarios', totalAfectados: -2 } });
    const repository = new RolesApiRepository();

    await expect(repository.delete(3)).resolves.toEqual({ ok: true });
    await expect(repository.getDeletionImpact(3)).resolves.toEqual({
      puedeEliminar: false,
      requiereConfirmacionReforzada: false,
      totalAfectados: 0,
      limiteRegistrosPorTipo: 0,
      afectados: [],
      explicacion: 'Tiene usuarios',
    });
    expect(apiClient.delete).toHaveBeenCalledWith('api/roles/3');
  });

  it.each([
    ['create', [{ nombre: 'Rol' }], 'post', 'No se pudo crear el rol'],
    ['update', [1, { nombre: 'Rol' }], 'patch', 'No se pudo actualizar el rol'],
    ['delete', [1], 'delete', 'No se pudo cambiar el estado del rol'],
    ['hardDelete', [1], 'delete', 'No se pudo eliminar el rol'],
    ['getDeletionImpact', [1], 'get', 'No se pudo consultar el impacto de la eliminación'],
  ])('wraps failures from %s', async (method, args, clientMethod, message) => {
    apiClient[clientMethod].mockRejectedValueOnce(new Error(message));
    await expect(new RolesApiRepository()[method](...args)).rejects.toThrow(message);
  });
});
