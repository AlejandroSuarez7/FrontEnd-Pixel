import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComprasPage } from './ComprasPage';

const mocks = vi.hoisted(() => ({ state: {}, confirm: vi.fn(), modalProps: null, viewProps: null, deleteProps: null, notifications: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../../../store/AuthContext', () => ({ useAuth: () => ({ user: { rol: { nombre: 'Admin' } }, hasPermission: () => true }) }));
vi.mock('../../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({ useConfirm: () => mocks.confirm }));
vi.mock('../../../../core/utils/notifications', () => ({ notifications: mocks.notifications }));
vi.mock('../application/useCompras', () => ({ useCompras: () => mocks.state }));
vi.mock('../../../../core/hooks/usePagination', () => ({ usePagination: (items) => ({ currentPage: 1, pageSize: 10, paginatedItems: items, setCurrentPage: vi.fn(), totalPages: 1 }) }));
vi.mock('../../../../core/components/Pagination', () => ({ Pagination: () => <div>pagination</div> }));
vi.mock('../../../../shared/components/TableActions/TableActions', () => ({ TableActions: ({ primaryAction, actions = [] }) => <>{[primaryAction, ...actions].filter(Boolean).map((action) => <button key={action.label} onClick={action.onClick}>{action.label}</button>)}</> }));
vi.mock('./CompraModal', () => ({ CompraModal: (props) => { mocks.modalProps = props; return props.isOpen ? <div data-testid="compra-modal">{props.compra?.idCompra || 'new'}</div> : null; } }));
vi.mock('./CompraViewModal', () => ({ CompraViewModal: (props) => { mocks.viewProps = props; return props.isOpen ? <div data-testid="compra-view">view</div> : null; } }));
vi.mock('../../../../shared/components/SafeDeleteModal/SafeDeleteModal', () => ({ SafeDeleteModal: (props) => { mocks.deleteProps = props; return props.isOpen ? <button onClick={props.deleteAction}>confirm-delete</button> : null; } }));

const baseState = () => ({
  compras: [
    { idCompra: 1, idPedido: 8, estado: 'PENDIENTE', total: 1500, fechaCompra: '2026-01-02', proveedor: { nombre: 'Telas' }, compradoPor: { nombre: 'Ana' }, detalles: [{ descripcionInsumo: 'Algodón' }] },
    { idCompra: 2, idPedido: 9, estado: 'COMPRADA', total: 0, fechaCompra: null, proveedor: null, compradoPor: null, detalles: [] },
  ],
  resumen: { cantidadCompras: 2, totalCompras: 1500, porEstado: { PENDIENTE: 1, ANULADA: 0 } },
  loading: false, error: null, refetch: vi.fn(), handleCreate: vi.fn().mockResolvedValue(), handleUpdate: vi.fn().mockResolvedValue(),
  handleConfirm: vi.fn().mockResolvedValue({ message: 'Lista' }), handleCancel: vi.fn().mockResolvedValue(), handleDelete: vi.fn().mockResolvedValue(),
  getPedidos: vi.fn(), getProveedoresActivos: vi.fn(),
});

describe('ComprasPage', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.state = baseState(); mocks.confirm.mockResolvedValue(true); });
  it('filters and runs create, edit, view, confirm, cancel and delete flows', async () => {
    render(<ComprasPage />);
    fireEvent.change(screen.getByPlaceholderText('Buscar por compra, pedido, proveedor o insumo...'), { target: { value: 'algodón' } });
    expect(screen.queryByText('#9')).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Buscar por compra, pedido, proveedor o insumo...'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Nueva compra'));
    await act(() => mocks.modalProps.onSubmit({ idPedido: 8 }));
    expect(mocks.state.handleCreate).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Editar'));
    await act(() => mocks.modalProps.onSubmit({ idPedido: 9 }));
    expect(mocks.state.handleUpdate).toHaveBeenCalledWith(1, { idPedido: 9 });
    fireEvent.click(screen.getAllByText('Ver')[0]);
    expect(screen.getByTestId('compra-view')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Confirmar'));
    await waitFor(() => expect(mocks.state.handleConfirm).toHaveBeenCalledWith(1));
    mocks.confirm.mockResolvedValueOnce({ confirmed: true, value: 'Duplicada' });
    fireEvent.click(screen.getByText('Anular'));
    await waitFor(() => expect(mocks.state.handleCancel).toHaveBeenCalledWith(1, 'Duplicada'));
    fireEvent.click(screen.getByText('Eliminar'));
    await act(() => mocks.deleteProps.deleteAction());
    expect(mocks.state.handleDelete).toHaveBeenCalledWith(1);
  });
  it('handles confirmations declined and operation failures', async () => {
    mocks.confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true).mockResolvedValueOnce({ confirmed: false });
    mocks.state.handleConfirm.mockRejectedValueOnce(new Error('confirm fail'));
    render(<ComprasPage />);
    fireEvent.click(screen.getByText('Confirmar'));
    expect(mocks.state.handleConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Confirmar'));
    await waitFor(() => expect(mocks.notifications.error).toHaveBeenCalledWith('confirm fail'));
    fireEvent.click(screen.getByText('Anular'));
    expect(mocks.state.handleCancel).not.toHaveBeenCalled();
  });
  it.each([
    [{ loading: true }, 'Cargando compras...'],
    [{ compras: [], error: new Error('api fail') }, 'api fail'],
    [{ compras: [], error: null }, 'No se encontraron compras.'],
  ])('renders alternate state', (override, text) => {
    mocks.state = { ...baseState(), ...override };
    render(<ComprasPage />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
