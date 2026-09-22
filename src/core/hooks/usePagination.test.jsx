import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePagination } from './usePagination';

describe('usePagination', () => {
  it('paginates items and clamps pages to the available range', () => {
    const items = Array.from({ length: 12 }, (_, index) => index + 1);
    const { result } = renderHook(() => usePagination(items, 5));

    act(() => result.current.setCurrentPage(3));
    expect(result.current.currentPage).toBe(3);
    expect(result.current.paginatedItems).toEqual([11, 12]);

    act(() => result.current.setCurrentPage(99));
    expect(result.current.currentPage).toBe(3);
  });

  it('returns to the first page when item count or page size changes', () => {
    const initialItems = Array.from({ length: 12 }, (_, index) => index + 1);
    const { result, rerender } = renderHook(
      ({ items, pageSize }) => usePagination(items, pageSize),
      { initialProps: { items: initialItems, pageSize: 5 } },
    );

    act(() => result.current.setCurrentPage(2));
    expect(result.current.currentPage).toBe(2);

    rerender({ items: initialItems.slice(0, 8), pageSize: 5 });
    expect(result.current.currentPage).toBe(1);

    act(() => result.current.setCurrentPage(2));
    rerender({ items: initialItems.slice(0, 8), pageSize: 4 });
    expect(result.current.currentPage).toBe(1);
  });
});
