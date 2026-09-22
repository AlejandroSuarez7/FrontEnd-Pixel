import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProducts } from './useProducts';

const state = vi.hoisted(() => ({ config: null, refetch: vi.fn() }));
const repository = vi.hoisted(() => ({
  list: vi.fn(), create: vi.fn(), update: vi.fn(), deactivate: vi.fn(), hardDelete: vi.fn(),
  replaceRanges: vi.fn(), listRanges: vi.fn(),
}));
vi.mock('../../../core/hooks/useLatestListRequest', () => ({
  useLatestListRequest: vi.fn((config) => {
    state.config = config;
    return { data: { items: [{ idProducto: 1 }], meta: { total: 1 } }, loading: false, refreshing: false, error: null, refetch: state.refetch };
  }),
}));
vi.mock('../infrastructure/product.repository', () => ({ productRepository: repository }));

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.refetch.mockResolvedValue(undefined);
    Object.values(repository).forEach((mock) => mock.mockResolvedValue({ idProducto: 1 }));
  });

  it('loads, mutates and manages discount ranges with optional refresh', async () => {
    const { result } = renderHook(() => useProducts({ search: 'camisa' }));
    await state.config.load('signal');
    await act(() => result.current.createProduct({}, { refresh: false }));
    await act(() => result.current.createProduct({}));
    await act(() => result.current.updateProduct(1, {}, { refresh: false }));
    await act(() => result.current.updateProduct(1, {}));
    await act(() => result.current.deactivateProduct(1));
    await act(() => result.current.deleteProduct(1));
    await act(() => result.current.saveRanges(1, []));
    await result.current.loadRanges(1, { signal: 'ranges' });
    expect(state.refetch).toHaveBeenCalledTimes(5);
    expect(repository.listRanges).toHaveBeenCalledWith(1, { signal: 'ranges' });
  });
});
