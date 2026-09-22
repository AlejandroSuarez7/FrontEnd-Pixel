import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTariffs } from './useTariffs';

const state = vi.hoisted(() => ({ config: null, refetch: vi.fn() }));
const repository = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() }));
vi.mock('../../../../core/hooks/useLatestListRequest', () => ({
  useLatestListRequest: vi.fn((config) => {
    state.config = config;
    return { data: { items: [{ idTarifa: 1 }], meta: { total: 1 } }, loading: false, refreshing: false, error: null, refetch: state.refetch };
  }),
}));
vi.mock('../infrastructure/tariff.repository', () => ({ tariffRepository: repository }));

describe('useTariffs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.refetch.mockResolvedValue(undefined);
    Object.values(repository).forEach((mock) => mock.mockResolvedValue({ idTarifa: 1 }));
  });
  it('loads, returns mutation results and refreshes', async () => {
    const { result } = renderHook(() => useTariffs({ page: 3 }));
    await state.config.load('signal');
    await expect(act(() => result.current.createTariff({ idTecnica: 1 }))).resolves.toEqual({ idTarifa: 1 });
    await expect(act(() => result.current.updateTariff(1, { precio: 2 }))).resolves.toEqual({ idTarifa: 1 });
    await act(() => result.current.deleteTariff(1));
    expect(repository.list).toHaveBeenCalledWith({ page: 3 }, { signal: 'signal' });
    expect(state.refetch).toHaveBeenCalledTimes(3);
  });
});
