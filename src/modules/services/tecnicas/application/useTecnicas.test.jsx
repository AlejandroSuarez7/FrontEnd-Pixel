import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTecnicas } from './useTecnicas';

const state = vi.hoisted(() => ({ config: null, refetch: vi.fn() }));
const repository = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), hardDelete: vi.fn() }));
vi.mock('../../../../core/hooks/useLatestListRequest', () => ({
  useLatestListRequest: vi.fn((config) => {
    state.config = config;
    return { data: { items: [{ id: 1 }], meta: { total: 1 } }, loading: false, refreshing: false, error: null, refetch: state.refetch };
  }),
}));
vi.mock('../infrastructure/tecnicas.repository', () => ({ tecnicasRepository: repository }));

describe('useTecnicas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.refetch.mockResolvedValue(undefined);
    Object.values(repository).forEach((mock) => mock.mockResolvedValue({ id: 1 }));
  });
  it('loads and executes technique workflows', async () => {
    const { result } = renderHook(() => useTecnicas({ estado: true }));
    await state.config.load('signal');
    await expect(act(() => result.current.handleCreate({ nombre: 'DTF' }))).resolves.toEqual({ id: 1 });
    await expect(act(() => result.current.handleUpdate(1, { nombre: 'UV' }))).resolves.toEqual({ id: 1 });
    await act(() => result.current.handleDelete(2));
    await act(() => result.current.handleHardDelete(3));
    expect(repository.list).toHaveBeenCalledWith({ estado: true }, { signal: 'signal' });
    expect(state.refetch).toHaveBeenCalledTimes(4);
  });
});
