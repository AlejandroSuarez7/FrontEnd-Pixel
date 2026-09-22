import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProveedoresPage } from './ProveedoresPage';

const mocks = vi.hoisted(() => ({ state: {}, confirm: vi.fn(), modalProps: null, viewProps: null, deleteProps: null, notifications: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../../../store/AuthContext', () => ({ useAuth: () => ({ user: { rol: 'Admin' }, hasPermission: () => true }) }));
vi.mock('../../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({ useConfirm: () => mocks.confirm }));
vi.mock('../../../../core/utils/notifications', () => ({ notifications: mocks.notifications }));
vi.mock('../application/useProveedores', () => ({ useProveedores: () => mocks.state }));
vi.mock('../../../../core/components/Pagination', () => ({ Pagination: ({ onPageChange }) => <button onClick={() => onPageChange(2)}>page-2</button> }));
vi.mock('../../../../shared/components/TableActions/TableActions', () => ({ TableActions: ({ primaryAction, actions = [] }) => <>{[primaryAction, ...actions].filter(Boolean).map((action) => <button key={action.label} onClick={action.onClick}>{action.label}</button>)}</> }));
vi.mock('./ProveedorModal', () => ({ ProveedorModal: (props) => { mocks.modalProps = props; return props.isOpen ? <div data-testid="provider-modal">{props.proveedor?.nombre || 'new'}</div> : null; } }));
vi.mock('./ProveedorViewModal', () => ({ ProveedorViewModal: (props) => { mocks.viewProps = props; return props.isOpen ? <div data-testid="provider-view">view</div> : null; } }));
vi.mock('../../../../shared/components/SafeDeleteModal/SafeDeleteModal', () => ({ SafeDeleteModal: (props) => { mocks.deleteProps = props; return props.isOpen ? <button onClick={props.deleteAction}>confirm-delete</button> : null; } }));

const baseState = () => ({
  proveedores: [
    { idProveedor: 1, nombre: 'Telas', telefono: '', correo: '', estado: true },
    { idProveedor: 2, nombre: 'Tintas', telefono: '1', correo: 'a@b.co', estado: false },
  ],
  paginationMeta: { limit: 10, total: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false }, loading: false, error: null,
  refetch: vi.fn(), handleCreate: vi.fn().mockResolvedValue(), handleUpdate: vi.fn().mockResolvedValue(),
  handleDeactivate: vi.fn().mockResolvedValue(), handleHardDelete: vi.fn().mockResolvedValue(),
});

describe('ProveedoresPage', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.state = baseState(); mocks.confirm.mockResolvedValue(true); });
  it('runs view, create, edit, deactivate and delete flows', async () => {
    render(<ProveedoresPage />);
    expect(screen.getByText('Sin telefono')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Nombre del proveedor...'), { target: { value: 'tel' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'true' } });
    fireEvent.click(screen.getByText('Nuevo proveedor'));
    await act(() => mocks.modalProps.onSubmit({ nombre: 'Nuevo' }));
    expect(mocks.state.handleCreate).toHaveBeenCalled();
    fireEvent.click(screen.getAllByText('Editar')[0]);
    await act(() => mocks.modalProps.onSubmit({ nombre: 'Editado' }));
    expect(mocks.state.handleUpdate).toHaveBeenCalledWith(1, { nombre: 'Editado' });
    fireEvent.click(screen.getAllByText('Ver')[0]);
    expect(screen.getByTestId('provider-view')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Desactivar'));
    await waitFor(() => expect(mocks.state.handleDeactivate).toHaveBeenCalledWith(1));
    fireEvent.click(screen.getAllByText('Eliminar')[0]);
    await act(() => mocks.deleteProps.deleteAction());
    expect(mocks.state.handleHardDelete).toHaveBeenCalledWith(1);
  });
  it('handles cancelled and failed deactivation', async () => {
    mocks.confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mocks.state.handleDeactivate.mockRejectedValueOnce(new Error('blocked'));
    render(<ProveedoresPage />);
    fireEvent.click(screen.getByText('Desactivar'));
    expect(mocks.state.handleDeactivate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Desactivar'));
    await waitFor(() => expect(mocks.notifications.error).toHaveBeenCalledWith('blocked'));
  });
  it.each([
    [{ loading: true }, 'Cargando proveedores...'],
    [{ proveedores: [], error: new Error('api fail') }, 'api fail'],
    [{ proveedores: [], error: null }, 'No se encontraron proveedores.'],
  ])('renders alternate state', (override, text) => {
    mocks.state = { ...baseState(), ...override };
    render(<ProveedoresPage />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
