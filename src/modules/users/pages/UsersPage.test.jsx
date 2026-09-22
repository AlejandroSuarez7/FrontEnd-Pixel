import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersPage } from './UsersPage';

const mocks = vi.hoisted(() => ({ state: {}, confirm: vi.fn(), roleList: vi.fn(), modalProps: null, deleteProps: null, notifications: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../../core/hooks/useDebounce', () => ({ useDebounce: (value) => value }));
vi.mock('../../../store/AuthContext', () => ({ useAuth: () => ({ hasPermission: () => true }) }));
vi.mock('../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({ useConfirm: () => mocks.confirm }));
vi.mock('../../../core/utils/notifications', () => ({ notifications: mocks.notifications }));
vi.mock('../application/useUsers', () => ({ useUsers: () => mocks.state }));
vi.mock('../../configuration/roles/infrastructure/roles.repository', () => ({ rolesRepository: { list: mocks.roleList } }));
vi.mock('../../../core/components/Pagination', () => ({ Pagination: ({ onPageChange }) => <button onClick={() => onPageChange(2)}>page-2</button> }));
vi.mock('../../../shared/components/TableActions/TableActions', () => ({ TableActions: ({ actions = [] }) => <>{actions.filter(Boolean).map((action) => <button key={action.label} onClick={action.onClick}>{action.label}</button>)}</> }));
vi.mock('../presentation/UserFormModal', () => ({ UserFormModal: (props) => { mocks.modalProps = props; return props.isOpen ? <div data-testid="user-modal">{props.user?.nombre || 'new user'}</div> : null; } }));
vi.mock('../../../shared/components/SafeDeleteModal/SafeDeleteModal', () => ({ SafeDeleteModal: (props) => { mocks.deleteProps = props; return props.isOpen ? <button onClick={props.deleteAction}>confirm-delete</button> : null; } }));

const baseState = () => ({
  users: [
    { id: 1, nombre: 'Ana', correo: 'a@b.co', documento: '', nombreRol: 'Operador', estado: true },
    { id: 2, nombre: 'Root', correo: 'r@b.co', documento: '2', nombreRol: 'Admin', estado: false },
  ],
  loading: false, error: null, paginationMeta: { limit: 10, total: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false },
  handleCreate: vi.fn().mockResolvedValue(), handleUpdate: vi.fn().mockResolvedValue(), handleToggleStatus: vi.fn().mockResolvedValue(),
  handleHardDelete: vi.fn().mockResolvedValue(), findDuplicateFields: vi.fn().mockResolvedValue([]), refreshUsers: vi.fn(),
});

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.state = baseState(); mocks.confirm.mockResolvedValue(true);
    mocks.roleList.mockResolvedValue({ items: [{ id: 3, nombre: 'Cliente' }, { id: 4, nombre: 'Operador' }], meta: { totalPages: 1 } });
  });
  it('loads staff roles and runs create, edit, toggle and delete flows', async () => {
    render(<UsersPage />);
    expect(await screen.findByText('Operador', { selector: 'option' })).toBeInTheDocument();
    expect(screen.queryByText('Cliente', { selector: 'option' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Nombre, correo o documento...'), { target: { value: 'ana' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '4' } });
    fireEvent.click(screen.getByText('Nuevo usuario'));
    await act(() => mocks.modalProps.onSubmit({ nombre: 'Nuevo' }));
    expect(mocks.state.handleCreate).toHaveBeenCalled();
    fireEvent.click(screen.getAllByText('Editar')[0]);
    await act(() => mocks.modalProps.onSubmit({ nombre: 'Ana 2' }));
    expect(mocks.state.handleUpdate).toHaveBeenCalledWith(1, { nombre: 'Ana 2' });
    fireEvent.click(screen.getByText('Desactivar'));
    await waitFor(() => expect(mocks.state.handleToggleStatus).toHaveBeenCalledWith(1));
    fireEvent.click(screen.getByText('Eliminar'));
    await act(() => mocks.deleteProps.deleteAction());
    expect(mocks.state.handleHardDelete).toHaveBeenCalledWith(1);
  });
  it('rejects duplicate fields and handles toggle errors/cancellation', async () => {
    mocks.state.findDuplicateFields.mockResolvedValueOnce(['correo', 'telefono']);
    mocks.confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mocks.state.handleToggleStatus.mockRejectedValueOnce(new Error('blocked'));
    render(<UsersPage />);
    await waitFor(() => expect(mocks.roleList).toHaveBeenCalled());
    fireEvent.click(screen.getByText('Nuevo usuario'));
    await expect(mocks.modalProps.onSubmit({ correo: 'x' })).rejects.toMatchObject({ silent: true });
    fireEvent.click(screen.getByText('Desactivar'));
    expect(mocks.state.handleToggleStatus).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Desactivar'));
    await waitFor(() => expect(mocks.notifications.error).toHaveBeenCalledWith('blocked'));
  });
  it.each([
    [{ loading: true }, 'Cargando usuarios del sistema...'],
    [{ users: [], error: new Error('x') }, 'No fue posible cargar los usuarios.'],
    [{ users: [], error: null }, 'No se encontraron usuarios registrados.'],
  ])('renders alternate state', async (override, text) => {
    mocks.state = { ...baseState(), ...override };
    render(<UsersPage />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
