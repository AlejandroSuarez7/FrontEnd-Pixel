import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCompras } from './useCompras';

const state = vi.hoisted(() => ({ config: null, refetch: vi.fn() }));
const repository = vi.hoisted(() => ({
  list: vi.fn(), getResumen: vi.fn(), listForDesigner: vi.fn(), create: vi.fn(), update: vi.fn(),
  confirm: vi.fn(), cancel: vi.fn(), remove: vi.fn(), listPedidos: vi.fn(), listProveedoresActivos: vi.fn(),
}));
vi.mock('../../../../core/hooks/useLatestListRequest', () => ({
  useLatestListRequest: vi.fn((config) => {
    state.config = config;
    return { data: { compras: [{ idCompra: 1 }], resumen: { totalCompras: 1 } }, loading: false, refreshing: false, error: null, refetch: state.refetch };
  }),
}));
vi.mock('../infrastructure/compra.repository', () => ({ compraRepository: repository }));

describe('useCompras', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.refetch.mockResolvedValue(undefined);
    Object.values(repository).forEach((mock) => mock.mockResolvedValue({ ok: true }));
  });

  it('loads normal and designer views and executes mutations', async () => {
    const { result, rerender } = renderHook(({ designer }) => useCompras({ estado: 'A' }, { onlyDesigner: designer }), {
      initialProps: { designer: false },
    });
    repository.list.mockResolvedValue([]);
    repository.getResumen.mockResolvedValue({});
    await state.config.load('signal');
    expect(repository.list).toHaveBeenCalledWith({ estado: 'A' }, { signal: 'signal' });

    await act(() => result.current.handleCreate({}));
    await act(() => result.current.handleUpdate(1, {}));
    await act(() => result.current.handleConfirm(1));
    await act(() => result.current.handleCancel(1, 'x'));
    await act(() => result.current.handleDelete(1));
    await result.current.getPedidos();
    await result.current.getProveedoresActivos();
    expect(state.refetch).toHaveBeenCalledTimes(5);

    rerender({ designer: true });
    repository.listForDesigner.mockResolvedValue([{ idCompra: 2 }]);
    await expect(state.config.load('designer-signal')).resolves.toMatchObject({ compras: [{ idCompra: 2 }] });
  });
});
