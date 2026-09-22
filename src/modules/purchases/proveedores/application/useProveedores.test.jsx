import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProveedores } from './useProveedores';

const state = vi.hoisted(() => ({ config: null, refetch: vi.fn() }));
const repository = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), update: vi.fn(), deactivate: vi.fn(), hardDelete: vi.fn() }));
vi.mock('../../../../core/hooks/useLatestListRequest', () => ({
  useLatestListRequest: vi.fn((config) => {
    state.config = config;
    return { data: { items: [{ idProveedor: 1 }], meta: { total: 1 } }, loading: false, refreshing: false, error: null, refetch: state.refetch };
  }),
}));
vi.mock('../infrastructure/proveedor.repository', () => ({ proveedorRepository: repository }));

describe('useProveedores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.refetch.mockResolvedValue(undefined);
    Object.values(repository).forEach((mock) => mock.mockResolvedValue({}));
  });
  it('loads and mutates providers', async () => {
    const { result } = renderHook(() => useProveedores({ estado: true }));
    await state.config.load('signal');
    await act(() => result.current.handleCreate({ nombre: 'Telas' }));
    await act(() => result.current.handleUpdate(1, { nombre: 'Tintas' }));
    await act(() => result.current.handleDeactivate(2));
    await act(() => result.current.handleHardDelete(3));
    expect(repository.list).toHaveBeenCalledWith({ estado: true }, { signal: 'signal' });
    expect(state.refetch).toHaveBeenCalledTimes(4);
  });
});
