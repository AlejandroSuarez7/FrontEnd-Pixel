import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUsers } from './useUsers';

const state = vi.hoisted(() => ({ config: null, refetch: vi.fn() }));
const repository = vi.hoisted(() => ({
  list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(),
  hardDelete: vi.fn(), findDuplicateFields: vi.fn(),
}));
vi.mock('../../../core/hooks/useLatestListRequest', () => ({
  useLatestListRequest: vi.fn((config) => {
    state.config = config;
    return { data: { items: [{ id: 1 }], meta: { total: 1 } }, loading: false, refreshing: true, error: null, refetch: state.refetch };
  }),
}));
vi.mock('../infrastructure/user.repository', () => ({
  UserApiRepository: vi.fn(function UserApiRepositoryMock() { return repository; }),
}));

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.refetch.mockResolvedValue(undefined);
    Object.values(repository).forEach((mock) => mock.mockResolvedValue({}));
  });

  it('loads and executes all user workflows', async () => {
    const { result } = renderHook(() => useUsers({ page: 2 }));
    await state.config.load('signal');
    await act(() => result.current.handleCreate({ nombre: 'Ana' }));
    await act(() => result.current.handleUpdate(1, { nombre: 'Beto' }));
    await act(() => result.current.handleToggleStatus(2));
    await act(() => result.current.handleHardDelete(3));
    result.current.findDuplicateFields({ correo: 'a@b.co' }, 4);
    expect(repository.list).toHaveBeenCalledWith({ page: 2 }, { signal: 'signal' });
    expect(repository.findDuplicateFields).toHaveBeenCalledWith({ correo: 'a@b.co' }, 4);
    expect(state.refetch).toHaveBeenCalledTimes(4);
  });

  it.each([
    ['create', 'create', (api) => api.handleCreate({})],
    ['update', 'update', (api) => api.handleUpdate(1, {})],
    ['status', 'delete', (api) => api.handleToggleStatus(1)],
    ['hard delete', 'hardDelete', (api) => api.handleHardDelete(1)],
  ])('propagates %s errors', async (_label, method, operation) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    repository[method].mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useUsers());
    await expect(operation(result.current)).rejects.toThrow('offline');
  });
});
