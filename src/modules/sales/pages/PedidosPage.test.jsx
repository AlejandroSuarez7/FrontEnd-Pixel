import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PedidosPage from './PedidosPage';

const mocks = vi.hoisted(() => ({ state: {}, confirm: vi.fn(), navigate: vi.fn(), detailsProps: null, notifications: { success: vi.fn(), error: vi.fn() } }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../../../store/AuthContext', () => ({ useAuth: () => ({ user: { nombreRol: 'Admin' }, hasPermission: () => true }) }));
vi.mock('../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({ useConfirm: () => mocks.confirm }));
vi.mock('../../../core/utils/notifications', () => ({ notifications: mocks.notifications }));
vi.mock('../pedidos/application/usePedidos', () => ({ usePedidos: () => mocks.state }));
vi.mock('../../../core/components/Pagination', () => ({ Pagination: ({ onPageChange }) => <button onClick={() => onPageChange(2)}>page-2</button> }));
vi.mock('../../../shared/components/TableActions/TableActions', () => ({ TableActions: ({ primaryAction, actions = [] }) => <>{[primaryAction, ...actions].filter(Boolean).map((action) => <button key={action.label} onClick={action.onClick}>{action.label}</button>)}</> }));
vi.mock('../pedidos/presentation/PedidoDetailsModal', () => ({ PedidoDetailsModal: (props) => { mocks.detailsProps = props; return props.isOpen ? <div data-testid="details-modal">details</div> : null; } }));

const pedido = (overrides) => ({ idPedido: 1, cliente: { nombre: 'Ana', correo: 'a@x.co', telefono: '1' }, estadoPedido: 'PENDIENTE', estadoPago: 'PARCIAL', total: 1000, saldoPendiente: 500, fechaEntregaEstimada: '2026-03-01', detalles: [{ idDetallePedido: 11, requiereDiseno: false }], ...overrides });
const baseState = () => ({
  pedidos: [
    pedido({ idPedido: 1, puedeSolicitarSaldoFinal: true, puedeFinalizar: true }),
    pedido({ idPedido: 2, cliente: null, estadoPedido: 'FINALIZADO', estadoPago: 'COMPLETO', saldoPendiente: 0, fechaEntregaEstimada: null }),
    pedido({ idPedido: 3, estadoPedido: 'PENDIENTE_SALDO_FINAL' }),
    pedido({ idPedido: 4, estadoPedido: 'ENTREGADO', estadoPago: 'COMPLETO', saldoPendiente: 0 }),
    pedido({ idPedido: 5, estadoPedido: 'ANULADO' }),
  ],
  loading: false, error: null, refetch: vi.fn(), paginationMeta: { limit: 10, total: 5, totalPages: 1, hasNextPage: false, hasPrevPage: false },
  handlePendienteSaldo: vi.fn().mockResolvedValue(), handleFinalizar: vi.fn().mockResolvedValue(), handleAnular: vi.fn().mockResolvedValue(),
  handleConfirmarEntrega: vi.fn().mockResolvedValue(), handleActualizarRequiereDiseno: vi.fn().mockResolvedValue(),
});

describe('PedidosPage', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.state = baseState(); mocks.confirm.mockResolvedValue(true); });
  it('renders states and executes every order action', async () => {
    render(<PedidosPage />);
    expect(screen.getByText('Cliente no especificado')).toBeInTheDocument();
    expect(screen.getByText('Por definir')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Cliente, pedido o descripcion...'), { target: { value: 'ana' } });
    fireEvent.click(screen.getAllByText('Gestionar pedido')[0]);
    expect(mocks.navigate).toHaveBeenCalledWith('/dashboard/orders/1/expediente');
    fireEvent.click(screen.getByText('Solicitar saldo final'));
    await waitFor(() => expect(mocks.state.handlePendienteSaldo).toHaveBeenCalledWith(1));
    fireEvent.click(screen.getByText('Finalizar pedido'));
    await waitFor(() => expect(mocks.state.handleFinalizar).toHaveBeenCalledWith(1));
    fireEvent.click(screen.getByText('Confirmar entrega'));
    await waitFor(() => expect(mocks.state.handleConfirmarEntrega).toHaveBeenCalledWith(2));
    mocks.confirm.mockResolvedValueOnce({ confirmed: true, value: 'Cliente cancela' });
    fireEvent.click(screen.getAllByText('Anular')[0]);
    await waitFor(() => expect(mocks.state.handleAnular).toHaveBeenCalledWith(1, 'Cliente cancela'));
    fireEvent.click(screen.getAllByText('Ver')[0]);
    expect(screen.getByTestId('details-modal')).toBeInTheDocument();
    await act(() => mocks.detailsProps.onToggleDesignRequirement({ idDetallePedido: 11, requiereDiseno: false }));
    expect(mocks.state.handleActualizarRequiereDiseno).toHaveBeenCalledWith(1, 11, true);
    mocks.detailsProps.onClose();
  });
  it('handles declined and failed order operations', async () => {
    mocks.confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true).mockResolvedValueOnce({ confirmed: false });
    mocks.state.handlePendienteSaldo.mockRejectedValueOnce(new Error('saldo fail'));
    render(<PedidosPage />);
    fireEvent.click(screen.getByText('Solicitar saldo final'));
    expect(mocks.state.handlePendienteSaldo).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Solicitar saldo final'));
    await waitFor(() => expect(mocks.notifications.error).toHaveBeenCalledWith('saldo fail'));
    fireEvent.click(screen.getAllByText('Anular')[0]);
    expect(mocks.state.handleAnular).not.toHaveBeenCalled();
  });
  it.each([
    [{ loading: true }, 'Cargando pedidos...'],
    [{ pedidos: [], error: new Error('api fail') }, 'api fail'],
    [{ pedidos: [], error: null }, 'No se encontraron pedidos.'],
  ])('renders alternate state', (override, text) => {
    mocks.state = { ...baseState(), ...override };
    render(<PedidosPage />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
