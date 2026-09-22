import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QuotesPage from './QuotesPage';

const mocks = vi.hoisted(() => ({
  state: {}, auth: {}, isClient: false, confirm: vi.fn(), formProps: null, detailProps: null,
  proposalProps: null, responseProps: null, deleteProps: null,
  notifications: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../core/hooks/useDebounce', () => ({ useDebounce: (value) => value }));
vi.mock('../../../store/AuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('../../../core/utils/permissions', () => ({ isClientUser: () => mocks.isClient }));
vi.mock('../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({ useConfirm: () => mocks.confirm }));
vi.mock('../../../core/utils/notifications', () => ({ notifications: mocks.notifications }));
vi.mock('../cotizaciones/application/useQuotes', () => ({ useQuotes: () => mocks.state }));
vi.mock('../../../core/components/Pagination', () => ({ Pagination: ({ onPageChange }) => <button onClick={() => onPageChange(2)}>page-2</button> }));
vi.mock('../../../shared/components/TableActions/TableActions', () => ({ TableActions: ({ primaryAction, actions = [] }) => <>{[primaryAction, ...actions].filter(Boolean).map((action) => <button key={action.label} onClick={action.onClick}>{action.label}</button>)}</> }));
vi.mock('../cotizaciones/presentation/QuoteFormModal', () => ({ QuoteFormModal: (props) => { mocks.formProps = props; return props.isOpen ? <div data-testid="quote-form">{props.quote?.idCotizacion || 'new'}</div> : null; } }));
vi.mock('../cotizaciones/presentation/QuoteDetailsModal', () => ({ QuoteDetailsModal: (props) => { mocks.detailProps = props; return props.isOpen ? <div data-testid="quote-details">details</div> : null; } }));
vi.mock('../cotizaciones/presentation/QuoteProposalModal', () => ({ QuoteProposalModal: (props) => { mocks.proposalProps = props; return props.open ? <div data-testid="quote-proposal">proposal</div> : null; } }));
vi.mock('../cotizaciones/presentation/QuoteResponseModal', () => ({ QuoteResponseModal: (props) => { mocks.responseProps = props; return props.open ? <div data-testid="quote-response">response</div> : null; } }));
vi.mock('../../../shared/components/SafeDeleteModal/SafeDeleteModal', () => ({ SafeDeleteModal: (props) => { mocks.deleteProps = props; return props.isOpen ? <button onClick={props.deleteAction}>confirm-delete</button> : null; } }));

const future = '2099-01-01T00:00:00.000Z';
const quote = (overrides) => ({ idCotizacion: 1, estado: 'SOLICITUD_RECIBIDA', cliente: { nombre: 'Ana', correo: 'a@x.co', telefono: '1' }, detalles: [{ producto: { nombre: 'Camiseta' } }], tipoCotizacion: '', total: 0, ...overrides });
const baseState = () => ({
  quotes: [
    quote({ idCotizacion: 1 }),
    quote({ idCotizacion: 2, estado: 'PENDIENTE_APROBACION_CLIENTE', productosResumen: 'Vaso', cantidadItems: 2, propuestaActual: { idVersion: 8, estado: 'ENVIADA', precioFinal: 50000, validaHasta: future } }),
    quote({ idCotizacion: 3, estado: 'ACEPTADA', cliente: null, detalles: [], total: 1000 }),
    quote({ idCotizacion: 4, estado: 'VENCIDA', detalles: [{ nombrePersonalizado: 'Bolso' }, { descripcion: 'Logo' }, { descripcion: 'Caja' }], propuesta: { idVersion: 9, estado: 'ENVIADA', precioFinal: 2000, validaHasta: 'invalid' } }),
  ],
  loading: false, error: null, refetch: vi.fn(), paginationMeta: { limit: 10, total: 4, totalPages: 1, hasNextPage: false, hasPrevPage: false },
  handleCreate: vi.fn().mockResolvedValue({ idCotizacion: 10 }), updateRequest: vi.fn().mockResolvedValue(), handleCancel: vi.fn().mockResolvedValue(),
  handleHardDelete: vi.fn().mockResolvedValue(), sendProposal: vi.fn().mockResolvedValue(), respondAsClient: vi.fn().mockResolvedValue({ idPedido: 20 }),
  respondAsStaff: vi.fn().mockResolvedValue({ pedido: { idPedido: 21 } }),
});

describe('QuotesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.state = baseState(); mocks.isClient = false; mocks.confirm.mockResolvedValue(true);
    mocks.auth = { user: { nombreRol: 'Admin' }, permissions: [], hasPermission: () => true };
  });

  it('renders variants and executes staff create/edit/proposal/response/delete flows', async () => {
    render(<QuotesPage />);
    expect(screen.getByText('Vaso (2 productos)')).toBeInTheDocument();
    expect(screen.getByText('Sin productos')).toBeInTheDocument();
    expect(screen.getByText('Bolso, Logo y 1 mas')).toBeInTheDocument();
    expect(screen.getByText('Precio pendiente de confirmacion')).toBeInTheDocument();
    expect(screen.getByText('Propuesta vencida')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Buscar por cliente, producto o estado...'), { target: { value: 'ana' } });
    fireEvent.click(screen.getByText('Nueva cotización presencial'));
    await act(() => mocks.formProps.onSubmit({ items: [], immediateProposal: { enabled: false } }));
    expect(mocks.state.handleCreate).toHaveBeenCalledWith({ items: [] }, true);
    fireEvent.click(screen.getAllByText('Editar solicitud')[0]);
    await act(() => mocks.formProps.onSubmit({ observaciones: 'x', immediateProposal: null }));
    expect(mocks.state.updateRequest).toHaveBeenCalledWith(1, { observaciones: 'x' });
    fireEvent.click(screen.getAllByText('Enviar propuesta')[0]);
    await act(() => mocks.proposalProps.onSubmit({ precioFinal: 10 }));
    expect(mocks.state.sendProposal).toHaveBeenCalledWith(1, { precioFinal: 10 });
    fireEvent.click(screen.getByText('Registrar respuesta'));
    await act(() => mocks.responseProps.onSubmit({ decision: 'ACEPTAR' }));
    expect(mocks.state.respondAsStaff).toHaveBeenCalledWith(2, { decision: 'ACEPTAR' });
    fireEvent.click(screen.getAllByText('Ver')[0]);
    expect(screen.getByTestId('quote-details')).toBeInTheDocument();
    fireEvent.click(screen.getAllByText('Eliminar')[0]);
    await act(() => mocks.deleteProps.deleteAction());
    expect(mocks.state.handleHardDelete).toHaveBeenCalledWith(1);
  });

  it('handles immediate proposal partial failure and cancellation outcomes', async () => {
    mocks.state.sendProposal.mockRejectedValueOnce(new Error('proposal fail'));
    mocks.confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mocks.state.handleCancel.mockRejectedValueOnce(new Error('cancel fail'));
    render(<QuotesPage />);
    fireEvent.click(screen.getByText('Nueva cotización presencial'));
    await act(() => mocks.formProps.onSubmit({ items: [], immediateProposal: { enabled: true, payload: { precioFinal: 1 } } }));
    expect(mocks.notifications.warning).toHaveBeenCalled();
    fireEvent.click(screen.getAllByText('Anular')[0]);
    expect(mocks.state.handleCancel).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByText('Anular')[0]);
    await waitFor(() => expect(mocks.notifications.error).toHaveBeenCalledWith('cancel fail'));
  });

  it('uses the client response path and all decision messages', async () => {
    mocks.isClient = true;
    mocks.auth = { user: { nombreRol: 'Cliente' }, permissions: [], hasPermission: () => true };
    mocks.state.quotes = [quote({ idCotizacion: 2, estado: 'PENDIENTE_APROBACION_CLIENTE', propuestaActual: { idVersion: 8, estado: 'ENVIADA', precioFinal: 50000, validaHasta: future } })];
    render(<QuotesPage />);
    expect(screen.getByText('Mis cotizaciones')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Responder propuesta'));
    await act(() => mocks.responseProps.onSubmit({ decision: 'ACEPTAR' }));
    await act(() => mocks.responseProps.onSubmit({ decision: 'SOLICITAR_AJUSTE' }));
    await act(() => mocks.responseProps.onSubmit({ decision: 'RECHAZAR' }));
    expect(mocks.state.respondAsClient).toHaveBeenCalledTimes(3);
    expect(mocks.notifications.success).toHaveBeenCalledWith('Solicitud de ajuste registrada.');
    expect(mocks.notifications.success).toHaveBeenCalledWith('Propuesta rechazada correctamente.');
  });

  it.each([
    [{ loading: true }, 'Cargando cotizaciones...'],
    [{ quotes: [], error: new Error('api fail') }, 'api fail'],
    [{ quotes: [], error: null }, 'No hay cotizaciones para mostrar.'],
  ])('renders alternate state', (override, text) => {
    mocks.state = { ...baseState(), ...override };
    render(<QuotesPage />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
