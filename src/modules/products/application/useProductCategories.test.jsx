import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProductCategories } from './useProductCategories';

const state = vi.hoisted(() => ({ config: null, refetch: vi.fn() }));
const repository = vi.hoisted(() => ({
  list: vi.fn(), create: vi.fn(), update: vi.fn(), deactivate: vi.fn(), hardDelete: vi.fn(),
}));
vi.mock('../../../core/hooks/useLatestListRequest', () => ({
  useLatestListRequest: vi.fn((config) => {
    state.config = config;
    return { data: { items: [{ idCategoriaProducto: 1 }], meta: { total: 1 } }, loading: false, refreshing: false, error: null, refetch: state.refetch };
  }),
}));
vi.mock('../infrastructure/category.repository', () => ({ categoryRepository: repository }));

describe('useProductCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.refetch.mockResolvedValue(undefined);
    Object.values(repository).forEach((mock) => mock.mockResolvedValue({}));
  });

  it('loads and mutates categories', async () => {
    const { result } = renderHook(() => useProductCategories({ search: 'ropa' }));
    await state.config.load('signal');
    await act(() => result.current.createCategory({ nombre: 'Ropa' }));
    await act(() => result.current.updateCategory(1, { nombre: 'Textil' }));
    await act(() => result.current.deactivateCategory(2));
    await act(() => result.current.deleteCategory(3));
    expect(repository.list).toHaveBeenCalledWith({ search: 'ropa' }, { signal: 'signal' });
    expect(state.refetch).toHaveBeenCalledTimes(4);
  });
});
