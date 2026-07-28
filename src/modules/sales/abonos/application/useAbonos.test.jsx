import { StrictMode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { abonoRepository } from '../infrastructure/abono.repository';
import { useAbonos } from './useAbonos';

vi.mock('../infrastructure/abono.repository', () => ({
  abonoRepository: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    confirm: vi.fn(),
    reject: vi.fn(),
    remove: vi.fn(),
    getPedido: vi.fn(),
    listByPedido: vi.fn(),
    listPedidos: vi.fn(),
  },
}));

const emptyResult = {
  items: [],
  meta: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

describe('useAbonos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    abonoRepository.list.mockResolvedValue(emptyResult);
  });

  it('loads once without filters even under StrictMode', async () => {
    const wrapper = ({ children }) => <StrictMode>{children}</StrictMode>;
    const { result } = renderHook(
      () => useAbonos({ page: 1, limit: 10, search: '', idCliente: '', idPedido: '' }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(abonoRepository.list).toHaveBeenCalledTimes(1);
    expect(abonoRepository.list).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        idCliente: '',
        idPedido: '',
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('uses backend filters and cancels stale requests when they change', async () => {
    const { result, rerender } = renderHook(
      ({ idCliente, idPedido }) => useAbonos({
        page: 1,
        limit: 10,
        idCliente,
        idPedido,
      }),
      { initialProps: { idCliente: '4', idPedido: '52' } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({ idCliente: '9', idPedido: '' });

    await waitFor(() => expect(abonoRepository.list).toHaveBeenCalledTimes(2));
    expect(abonoRepository.list.mock.calls[1][0]).toEqual(expect.objectContaining({
      idCliente: '9',
      idPedido: '',
      page: 1,
    }));
  });

  it('does not let an older response overwrite the latest filter result', async () => {
    let resolveFirst;
    let resolveSecond;
    abonoRepository.list
      .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }))
      .mockImplementationOnce(() => new Promise(resolve => { resolveSecond = resolve; }));

    const { result, rerender } = renderHook(
      ({ idCliente }) => useAbonos({ page: 1, limit: 10, idCliente }),
      { initialProps: { idCliente: '4' } },
    );

    await waitFor(() => expect(abonoRepository.list).toHaveBeenCalledTimes(1));
    rerender({ idCliente: '9' });
    await waitFor(() => expect(abonoRepository.list).toHaveBeenCalledTimes(2));

    await act(async () => {
      resolveSecond({
        ...emptyResult,
        items: [{ idAbono: 90 }],
      });
    });
    await waitFor(() => expect(result.current.abonos).toEqual([{ idAbono: 90 }]));

    await act(async () => {
      resolveFirst({
        ...emptyResult,
        items: [{ idAbono: 40 }],
      });
    });
    expect(result.current.abonos).toEqual([{ idAbono: 90 }]);
  });

  it('releases loading after an error and allows retrying', async () => {
    abonoRepository.list
      .mockRejectedValueOnce(new Error('Servidor no disponible'))
      .mockResolvedValueOnce(emptyResult);

    const { result } = renderHook(() => useAbonos({ page: 1, limit: 10 }));

    await waitFor(() => expect(result.current.error).toBe('Servidor no disponible'));
    expect(result.current.loading).toBe(false);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBe('');
    expect(result.current.loading).toBe(false);
    expect(abonoRepository.list).toHaveBeenCalledTimes(2);
  });
});
