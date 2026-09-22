import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePedidos } from './usePedidos';

const state = vi.hoisted(() => ({ config: null, refetch: vi.fn() }));
const repository = vi.hoisted(() => ({
  list: vi.fn(), create: vi.fn(), update: vi.fn(), marcarEnProceso: vi.fn(), finalizar: vi.fn(),
  updateEstimatedDelivery: vi.fn(), marcarPendienteSaldo: vi.fn(), anular: vi.fn(),
  confirmarEntrega: vi.fn(), actualizarRequiereDiseno: vi.fn(),
}));

vi.mock('../../../../core/hooks/useLatestListRequest', () => ({
  useLatestListRequest: vi.fn((config) => {
    state.config = config;
    return { data: { items: [{ idPedido: 1 }], meta: { total: 1 } }, loading: false, refreshing: false, error: null, refetch: state.refetch };
  }),
}));
vi.mock('../infrastructure/pedido.repository', () => ({ pedidoRepository: repository }));

describe('usePedidos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.refetch.mockResolvedValue(undefined);
    Object.values(repository).forEach((mock) => mock.mockResolvedValue({}));
  });

  it('loads and executes all order transitions', async () => {
    const { result } = renderHook(() => usePedidos({ estado: 'PENDIENTE' }));
    await state.config.load('signal');
    expect(repository.list).toHaveBeenCalledWith({ estado: 'PENDIENTE' }, { signal: 'signal' });

    await act(() => result.current.handleCreate({ idCotizacion: 1 }));
    await act(() => result.current.handleUpdate(1, { observaciones: 'x' }));
    await act(() => result.current.handleUpdateEstimatedDelivery(1, '2026-01-01'));
    await act(() => result.current.handleMarcarEnProceso(1));
    await act(() => result.current.handlePendienteSaldo(1));
    await act(() => result.current.handleFinalizar(1));
    await act(() => result.current.handleAnular(1, 'motivo'));
    await act(() => result.current.handleConfirmarEntrega(1));
    await act(() => result.current.handleActualizarRequiereDiseno(1, 2, false));
    expect(state.refetch).toHaveBeenCalledTimes(9);
  });

  it.each([
    ['create', 'create', (api) => api.handleCreate({})],
    ['update', 'update', (api) => api.handleUpdate(1, {})],
    ['process', 'marcarEnProceso', (api) => api.handleMarcarEnProceso(1)],
    ['finish', 'finalizar', (api) => api.handleFinalizar(1)],
    ['delivery date', 'updateEstimatedDelivery', (api) => api.handleUpdateEstimatedDelivery(1, '')],
    ['balance', 'marcarPendienteSaldo', (api) => api.handlePendienteSaldo(1)],
    ['cancel', 'anular', (api) => api.handleAnular(1, 'x')],
    ['delivery', 'confirmarEntrega', (api) => api.handleConfirmarEntrega(1)],
    ['design flag', 'actualizarRequiereDiseno', (api) => api.handleActualizarRequiereDiseno(1, 2, true)],
  ])('propagates %s errors', async (_name, method, operation) => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    repository[method].mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => usePedidos());
    await expect(operation(result.current)).rejects.toThrow('offline');
    consoleError.mockRestore();
  });
});
