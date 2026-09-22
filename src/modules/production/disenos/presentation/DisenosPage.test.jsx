import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DisenosPage } from './DisenosPage';

const mocks = vi.hoisted(() => ({ state: {}, permissions: new Set(), confirm: vi.fn(), modalProps: null, viewProps: null, responseProps: null, deleteProps: null, notifications: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../../../store/AuthContext', () => ({ useAuth: () => ({ user: { rol: { nombre: 'Admin' } }, hasPermission: (permission) => mocks.permissions.has(permission) }) }));
vi.mock('../../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({ useConfirm: () => mocks.confirm }));
vi.mock('../../../../core/utils/notifications', () => ({ notifications: mocks.notifications }));
vi.mock('../application/useDisenos', () => ({ useDisenos: () => mocks.state }));
vi.mock('../../../../core/hooks/usePagination', () => ({ usePagination: (items) => ({ currentPage: 1, pageSize: 10, paginatedItems: items, setCurrentPage: vi.fn(), totalPages: 1 }) }));
vi.mock('../../../../core/components/Pagination', () => ({ Pagination: () => <div>pagination</div> }));
vi.mock('../../../../shared/components/TableActions/TableActions', () => ({ TableActions: ({ primaryAction, actions = [] }) => <>{[primaryAction, ...actions].filter(Boolean).map((action) => <button key={action.label} onClick={action.onClick}>{action.label}</button>)}</> }));
vi.mock('./DisenoModal', () => ({ DisenoModal: (props) => { mocks.modalProps = props; return props.isOpen ? <div data-testid="design-modal">{props.diseno?.idDiseno || 'new'}</div> : null; } }));
vi.mock('./DisenoViewModal', () => ({ DisenoViewModal: (props) => { mocks.viewProps = props; return props.isOpen ? <div data-testid="design-view">view</div> : null; } }));
vi.mock('./DesignClientResponseModal', () => ({ DesignClientResponseModal: (props) => { mocks.responseProps = props; return props.isOpen ? <div data-testid="response-modal">{props.mode}</div> : null; } }));
vi.mock('../../../../shared/components/SafeDeleteModal/SafeDeleteModal', () => ({ SafeDeleteModal: (props) => { mocks.deleteProps = props; return props.isOpen ? <button onClick={props.deleteAction}>confirm-delete</button> : null; } }));

const design = (overrides) => ({ idDiseno: 1, idPedido: 10, descripcion: 'Logo', origenDiseno: 'ADMIN', estado: 'ENVIADO', fechaEnvio: '2026-01-01', pedido: { cliente: { nombre: 'Ana', correo: 'a@x.co', telefono: '1' }, detalles: [] }, disenador: { nombre: 'Diana' }, detallePedido: { descripcion: 'Camiseta', idTecnica: 3, cantidad: 2 }, ...overrides });
const baseState = () => ({
  disenos: [
    design({ idDiseno: 1 }),
    design({ idDiseno: 2, estado: 'APROBADO', esDisenoGeneral: true, origenDiseno: 'OTRO', fechaEnvio: null }),
    design({ idDiseno: 3, estado: 'RECHAZADO', origenDiseno: 'CLIENTE', detallePedido: { producto: { nombre: 'Vaso' }, tecnica: { nombre: 'UV' }, cantidad: 1 } }),
  ],
  loading: false, error: null, refetch: vi.fn(), handleCreate: vi.fn().mockResolvedValue(), handleUpdate: vi.fn().mockResolvedValue(),
  handleApprove: vi.fn().mockResolvedValue({ data: { estadoPedido: 'EN_PROCESO' } }), handleApproveByClientAdmin: vi.fn().mockResolvedValue({}),
  handleRejectByClientAdmin: vi.fn().mockResolvedValue({}), handleDelete: vi.fn().mockResolvedValue(), getPendingDesignOrders: vi.fn(), getRequerimientosDiseno: vi.fn(),
});

describe('DisenosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.state = baseState(); mocks.confirm.mockResolvedValue({ confirmed: true, value: 'OK' });
    mocks.permissions = new Set(['disenos.crear', 'disenos.editar', 'disenos.eliminar', 'disenos.aprobar_cliente', 'disenos.rechazar_cliente']);
  });
  it('filters and runs create, edit, view, client response and delete flows', async () => {
    render(<DisenosPage />);
    expect(screen.getByText('Diseño general del pedido')).toBeInTheDocument();
    expect(screen.getByText('No aplica')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Cliente, diseñador o producto...'), { target: { value: 'camiseta' } });
    expect(screen.queryByText('#3')).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Cliente, diseñador o producto...'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Nuevo diseño'));
    await act(() => mocks.modalProps.onSubmit({ estado: 'APROBADO' }));
    expect(mocks.state.handleCreate).toHaveBeenCalled();
    fireEvent.click(screen.getAllByText('Editar')[0]);
    await act(() => mocks.modalProps.onSubmit({ descripcion: 'Editado' }));
    expect(mocks.state.handleUpdate).toHaveBeenCalledWith(1, { descripcion: 'Editado' });
    fireEvent.click(screen.getAllByText('Ver')[0]);
    expect(screen.getByTestId('design-view')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Aprobar por cliente'));
    await act(() => mocks.responseProps.onSubmit({ medio: 'WHATSAPP', observaciones: 'Sí' }));
    expect(mocks.state.handleApproveByClientAdmin).toHaveBeenCalledWith(1, expect.objectContaining({ medioAprobacion: 'WHATSAPP' }));
    fireEvent.click(screen.getByText('Rechazar por cliente'));
    await act(() => mocks.responseProps.onSubmit({ medio: 'EMAIL', observaciones: 'Cambiar' }));
    expect(mocks.state.handleRejectByClientAdmin).toHaveBeenCalledWith(1, expect.objectContaining({ medioRespuesta: 'EMAIL' }));
    fireEvent.click(screen.getAllByText('Eliminar')[0]);
    await act(() => mocks.deleteProps.deleteAction());
    expect(mocks.state.handleDelete).toHaveBeenCalledWith(1);
  });
  it('supports direct approval and reports failures', async () => {
    mocks.permissions = new Set(['disenos.aprobar']);
    mocks.state.handleApprove.mockRejectedValueOnce(new Error('blocked'));
    render(<DisenosPage />);
    fireEvent.click(screen.getByText('Aprobar'));
    await waitFor(() => expect(mocks.notifications.error).toHaveBeenCalledWith('blocked'));
  });
  it.each([
    [{ loading: true }, 'Cargando diseños...'],
    [{ disenos: [], error: new Error('api fail') }, 'api fail'],
    [{ disenos: [], error: null }, 'No se encontraron diseños.'],
  ])('renders alternate state', (override, text) => {
    mocks.state = { ...baseState(), ...override };
    render(<DisenosPage />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
