import { StrictMode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useLatestListRequest } from './useLatestListRequest';

const wrapper = ({ children }) => <StrictMode>{children}</StrictMode>;

const createDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

describe('useLatestListRequest', () => {
  it('runs only one list request when mounted under StrictMode', async () => {
    const load = vi.fn().mockResolvedValue(['ready']);

    const { result } = renderHook(() => useLatestListRequest({
      queryKey: 'initial',
      load,
      initialData: [],
    }), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(load).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(['ready']);
  });

  it('ignores an older response after filters change', async () => {
    const first = createDeferred();
    const second = createDeferred();
    const loadFirst = vi.fn(() => first.promise);
    const loadSecond = vi.fn(() => second.promise);

    const { result, rerender } = renderHook(
      ({ queryKey, load }) => useLatestListRequest({
        queryKey,
        load,
        initialData: [],
      }),
      {
        initialProps: { queryKey: 'page-1', load: loadFirst },
      },
    );

    await waitFor(() => expect(loadFirst).toHaveBeenCalledTimes(1));
    rerender({ queryKey: 'page-2', load: loadSecond });
    await waitFor(() => expect(loadSecond).toHaveBeenCalledTimes(1));

    await act(async () => {
      second.resolve(['new']);
      await second.promise;
    });
    await waitFor(() => expect(result.current.data).toEqual(['new']));

    await act(async () => {
      first.resolve(['old']);
      await first.promise;
    });
    expect(result.current.data).toEqual(['new']);
  });

  it('releases loading and allows retry after a failure', async () => {
    const load = vi.fn()
      .mockRejectedValueOnce(new Error('Servidor no disponible'))
      .mockResolvedValueOnce(['recovered']);

    const { result } = renderHook(() => useLatestListRequest({
      queryKey: 'initial',
      load,
      initialData: [],
    }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe('Servidor no disponible');

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(['recovered']);
  });
});
