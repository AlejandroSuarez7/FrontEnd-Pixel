import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRoles } from './useRoles';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  hardDelete: vi.fn(),
  getDeletionImpact: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('../../../../core/hooks/useLatestListRequest', () => ({
  useLatestListRequest: () => ({
    data: {
      items: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    },
    loading: false,
    refreshing: false,
    error: null,
    refetch: mocks.refetch,
  }),
}));

vi.mock('../infrastructure/roles.repository', () => ({
  rolesRepository: {
    create: mocks.create,
    update: mocks.update,
    delete: mocks.delete,
    hardDelete: mocks.hardDelete,
    getDeletionImpact: mocks.getDeletionImpact,
  },
}));

describe('useRoles permanent deletion', () => {
  beforeEach(() => {
    mocks.create.mockReset().mockResolvedValue({ id: 1 });
    mocks.update.mockReset().mockResolvedValue({ id: 1, nombre: 'Actualizado' });
    mocks.delete.mockReset().mockResolvedValue(undefined);
    mocks.hardDelete.mockReset().mockResolvedValue(undefined);
    mocks.getDeletionImpact.mockReset().mockResolvedValue({ puedeEliminar: true });
    mocks.refetch.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('refreshes the role listing after a successful permanent deletion', async () => {
    const { result } = renderHook(() => useRoles({ page: 1, limit: 10 }));

    await act(async () => result.current.handleHardDelete(8));

    expect(mocks.hardDelete).toHaveBeenCalledWith(8);
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it('creates and updates roles before refreshing the listing', async () => {
    const { result } = renderHook(() => useRoles({ search: 'admin' }));
    let created;
    let updated;

    await act(async () => {
      created = await result.current.handleCreate({ nombre: 'Nuevo' });
      updated = await result.current.handleUpdate(1, { nombre: 'Actualizado' });
    });

    expect(mocks.create).toHaveBeenCalledWith({ nombre: 'Nuevo' });
    expect(mocks.update).toHaveBeenCalledWith(1, { nombre: 'Actualizado' });
    expect(mocks.refetch).toHaveBeenCalledTimes(2);
    expect(created).toEqual({ id: 1 });
    expect(updated.nombre).toBe('Actualizado');
  });

  it('toggles a role and delegates impact queries', async () => {
    const { result } = renderHook(() => useRoles());

    await act(async () => result.current.handleDelete(4));
    await expect(result.current.getDeletionImpact(4, { signal: 'signal' }))
      .resolves
      .toEqual({ puedeEliminar: true });

    expect(mocks.delete).toHaveBeenCalledWith(4);
    expect(mocks.refetch).toHaveBeenCalledOnce();
    expect(mocks.getDeletionImpact).toHaveBeenCalledWith(4, { signal: 'signal' });
  });

  it.each([
    ['handleCreate', [{ nombre: 'Nuevo' }], 'create'],
    ['handleUpdate', [1, { nombre: 'Cambio' }], 'update'],
    ['handleDelete', [1], 'delete'],
    ['handleHardDelete', [1], 'hardDelete'],
  ])('rethrows failures from %s without refreshing', async (handler, args, repositoryMethod) => {
    const failure = new Error('fallo controlado');
    mocks[repositoryMethod].mockRejectedValueOnce(failure);
    const { result } = renderHook(() => useRoles());

    await act(async () => {
      await expect(result.current[handler](...args)).rejects.toBe(failure);
    });

    expect(mocks.refetch).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
