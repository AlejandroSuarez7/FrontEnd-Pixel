import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDisenos } from './useDisenos';

const state = vi.hoisted(() => ({ config: null, refetch: vi.fn() }));
const repository = vi.hoisted(() => ({
  list: vi.fn(), create: vi.fn(), update: vi.fn(), approve: vi.fn(), approveByClientAdmin: vi.fn(),
  rejectByClientAdmin: vi.fn(), remove: vi.fn(), listByPedido: vi.fn(), listPendingProduction: vi.fn(),
  listPendingDesignOrders: vi.fn(), listPedidos: vi.fn(), getRequerimientosDiseno: vi.fn(),
}));
vi.mock('../../../../core/hooks/useLatestListRequest', () => ({
  useLatestListRequest: vi.fn((config) => {
    state.config = config;
    return { data: [{ idDiseno: 1 }], loading: false, refreshing: false, error: null, refetch: state.refetch };
  }),
}));
vi.mock('../infrastructure/diseno.repository', () => ({ disenoRepository: repository }));

describe('useDisenos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.refetch.mockResolvedValue(undefined);
    Object.values(repository).forEach((mock) => mock.mockResolvedValue({ ok: true }));
  });

  it('covers mutations and stable lookup callbacks', async () => {
    const { result } = renderHook(() => useDisenos({ estado: 'BORRADOR' }));
    await state.config.load('signal');
    await act(() => result.current.handleCreate({}));
    await act(() => result.current.handleUpdate(1, {}));
    await act(() => result.current.handleApprove(1, {}));
    await act(() => result.current.handleApproveByClientAdmin(1, {}));
    await act(() => result.current.handleRejectByClientAdmin(1, {}));
    await act(() => result.current.handleDelete(1));
    await result.current.getDisenosByPedido(2);
    await result.current.getPendingProduction();
    await result.current.getPendingDesignOrders({ signal: 'x' });
    await result.current.getPedidos({ estado: 'A' });
    await result.current.getRequerimientosDiseno(2, { signal: 'y' });
    expect(state.refetch).toHaveBeenCalledTimes(6);
    expect(repository.getRequerimientosDiseno).toHaveBeenCalledWith(2, { signal: 'y' });
  });
});
