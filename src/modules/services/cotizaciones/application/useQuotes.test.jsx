import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuotes } from './useQuotes';

const state = vi.hoisted(() => ({ config: null, refetch: vi.fn() }));
const repository = vi.hoisted(() => ({
  list: vi.fn(), createAsStaff: vi.fn(), createAsClient: vi.fn(), assignPrices: vi.fn(),
  updateAsClient: vi.fn(), approve: vi.fn(), cancel: vi.fn(), hardDelete: vi.fn(),
  updateRequest: vi.fn(), sendProposal: vi.fn(), respondAsClient: vi.fn(), respondAsStaff: vi.fn(),
}));

vi.mock('../../../../core/hooks/useLatestListRequest', () => ({
  useLatestListRequest: vi.fn((config) => {
    state.config = config;
    return { data: { items: [{ idCotizacion: 1 }], meta: { total: 1 } }, loading: false, refreshing: false, error: null, refetch: state.refetch };
  }),
}));
vi.mock('../infrastructure/quote.repository', () => ({
  QuoteApiRepository: vi.fn(function QuoteApiRepositoryMock() {
    return repository;
  }),
}));

describe('useQuotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.refetch.mockResolvedValue(undefined);
    Object.values(repository).forEach((mock) => mock.mockResolvedValue({ idCotizacion: 1 }));
  });

  it('loads and executes every quote workflow with refresh', async () => {
    const { result } = renderHook(() => useQuotes({ estado: 'PENDIENTE' }));
    repository.list.mockResolvedValue({ items: [] });
    await state.config.load('signal');
    expect(repository.list).toHaveBeenCalledWith({ estado: 'PENDIENTE' }, { signal: 'signal' });
    expect(result.current.quotes).toEqual([{ idCotizacion: 1 }]);

    await act(() => result.current.handleCreate({ nombre: 'A' }, false));
    await act(() => result.current.handleCreate({ nombre: 'B' }, true));
    await act(() => result.current.handleUpdate(1, { total: 1 }, false));
    await act(() => result.current.handleUpdate(1, { total: 2 }, true));
    await act(() => result.current.handleApprove(1));
    await act(() => result.current.handleReject(2));
    await act(() => result.current.handleCancel(3));
    await act(() => result.current.handleHardDelete(4));
    await act(() => result.current.updateRequest(5, { note: 'x' }));
    await act(() => result.current.sendProposal(6, { total: 10 }));
    await act(() => result.current.respondAsClient(7, { accepted: true }));
    await act(() => result.current.respondAsStaff(8, { accepted: false }));

    expect(repository.createAsClient).toHaveBeenCalled();
    expect(repository.createAsStaff).toHaveBeenCalled();
    expect(repository.updateAsClient).toHaveBeenCalled();
    expect(repository.assignPrices).toHaveBeenCalled();
    expect(state.refetch).toHaveBeenCalledTimes(12);
  });

  it.each([
    ['create', 'createAsClient', (api) => api.handleCreate({})],
    ['update', 'updateAsClient', (api) => api.handleUpdate(1, {})],
    ['approve', 'approve', (api) => api.handleApprove(1)],
    ['reject', 'cancel', (api) => api.handleReject(1)],
    ['cancel', 'cancel', (api) => api.handleCancel(1)],
    ['delete', 'hardDelete', (api) => api.handleHardDelete(1)],
  ])('propagates %s errors', async (_name, method, operation) => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    repository[method].mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useQuotes());
    await expect(operation(result.current)).rejects.toThrow('offline');
    consoleError.mockRestore();
  });
});
