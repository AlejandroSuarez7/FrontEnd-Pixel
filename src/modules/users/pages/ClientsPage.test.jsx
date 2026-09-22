import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClientsPage from './ClientsPage';

const mocks = vi.hoisted(() => ({ listState: {}, requestConfig: null, confirm: vi.fn(), repository: { list: vi.fn(), getById: vi.fn(), deactivate: vi.fn(), delete: vi.fn() }, deleteProps: null, notifications: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../../core/hooks/useDebounce', () => ({ useDebounce: (value) => value }));
vi.mock('../../../core/hooks/useLatestListRequest', () => ({ useLatestListRequest: (config) => { mocks.requestConfig = config; return mocks.listState; } }));
vi.mock('../../../store/AuthContext', () => ({ useAuth: () => ({ hasPermission: () => true }) }));
vi.mock('../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({ useConfirm: () => mocks.confirm }));
vi.mock('../../../core/utils/notifications', () => ({ notifications: mocks.notifications }));
vi.mock('../infrastructure/client.repository', () => ({ clientRepository: mocks.repository }));
vi.mock('../../../core/components/Pagination', () => ({ Pagination: ({ onPageChange }) => <button onClick={() => onPageChange(2)}>page-2</button> }));
vi.mock('../../../shared/components/TableActions/TableActions', () => ({ TableActions: ({ primaryAction, actions = [] }) => <>{[primaryAction, ...actions].filter(Boolean).map((action) => <button key={action.label} onClick={action.onClick}>{action.label}</button>)}</> }));
vi.mock('../../../shared/components/SafeDeleteModal/SafeDeleteModal', () => ({ SafeDeleteModal: (props) => { mocks.deleteProps = props; return props.isOpen ? <button onClick={props.deleteAction}>confirm-delete</button> : null; } }));

const baseState = () => ({
  data: { items: [
    { idCliente: 1, nombre: 'Ana', correo: '', telefono: '', documento: '', estado: true, fechaCreacion: '2026-01-02' },
    { idCliente: 2, nombre: 'Beto', correo: 'b@x.co', telefono: '1', documento: '2', estado: false, fechaCreacion: 'invalid' },
  ], meta: { limit: 10, total: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false } },
  loading: false, error: null, refetch: vi.fn(),
});

describe('ClientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.listState = baseState(); mocks.confirm.mockResolvedValue(true);
    mocks.repository.getById.mockResolvedValue({ idCliente: 1, nombre: 'Ana detalle', count: { cotizaciones: 2, pedidos: 3 } });
    mocks.repository.deactivate.mockResolvedValue(); mocks.repository.delete.mockResolvedValue();
  });
  it('loads, searches, views, deactivates and deletes clients', async () => {
    render(<ClientsPage />);
    await mocks.requestConfig.load('signal');
    expect(mocks.repository.list).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }), { signal: 'signal' });
    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre, correo, telefono o documento...'), { target: { value: 'ana' } });
    fireEvent.click(screen.getAllByText('Ver')[0]);
    expect(screen.getByText('Cargando detalle del cliente...')).toBeInTheDocument();
    expect(await screen.findByText('Ana detalle')).toBeInTheDocument();
    expect(screen.getAllByText('2')).toHaveLength(3);
    fireEvent.click(screen.getByText('Cerrar'));
    fireEvent.click(screen.getByText('Desactivar'));
    await waitFor(() => expect(mocks.repository.deactivate).toHaveBeenCalledWith(1));
    expect(mocks.listState.refetch).toHaveBeenCalled();
    fireEvent.click(screen.getAllByText('Eliminar')[0]);
    await act(() => mocks.deleteProps.deleteAction());
    expect(mocks.repository.delete).toHaveBeenCalledWith(1);
  });
  it('handles declined deactivation and detail/deactivate errors', async () => {
    mocks.repository.getById.mockRejectedValueOnce(new Error('detail fail'));
    mocks.confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mocks.repository.deactivate.mockRejectedValueOnce(new Error('blocked'));
    render(<ClientsPage />);
    fireEvent.click(screen.getAllByText('Ver')[0]);
    await waitFor(() => expect(mocks.notifications.error).toHaveBeenCalledWith('detail fail'));
    fireEvent.click(screen.getByText('Desactivar'));
    expect(mocks.repository.deactivate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Desactivar'));
    await waitFor(() => expect(mocks.notifications.error).toHaveBeenCalledWith('blocked'));
  });
  it.each([
    [{ loading: true }, 'Cargando clientes externos...'],
    [{ data: { items: [], meta: { total: 0 } }, error: new Error('x') }, 'No fue posible cargar los clientes.'],
    [{ data: { items: [], meta: { total: 0 } }, error: null }, 'No se encontraron clientes externos.'],
  ])('renders alternate state', (override, text) => {
    mocks.listState = { ...baseState(), ...override };
    render(<ClientsPage />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
