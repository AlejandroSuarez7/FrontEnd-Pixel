import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductCategoriesPage } from './ProductCategoriesPage';

const mocks = vi.hoisted(() => ({ state: {}, confirm: vi.fn(), modalProps: null, deleteProps: null, notifications: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../../core/hooks/useDebounce', () => ({ useDebounce: (value) => value }));
vi.mock('../../../store/AuthContext', () => ({ useAuth: () => ({ hasPermission: () => true }) }));
vi.mock('../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({ useConfirm: () => mocks.confirm }));
vi.mock('../../../core/utils/notifications', () => ({ notifications: mocks.notifications }));
vi.mock('../application/useProductCategories', () => ({ useProductCategories: () => mocks.state }));
vi.mock('../../../core/components/Pagination', () => ({ Pagination: ({ onPageChange }) => <button onClick={() => onPageChange(2)}>page-2</button> }));
vi.mock('../../../shared/components/TableActions/TableActions', () => ({ TableActions: ({ primaryAction, actions = [] }) => <>{[primaryAction, ...actions].filter(Boolean).map((action) => <button key={action.label} onClick={action.onClick}>{action.label}</button>)}</> }));
vi.mock('../presentation/CategoryModal', () => ({ CategoryModal: (props) => { mocks.modalProps = props; return props.isOpen ? <div data-testid="category-modal">{props.category?.nombre || 'new category'}</div> : null; } }));
vi.mock('../../../shared/components/SafeDeleteModal/SafeDeleteModal', () => ({ SafeDeleteModal: (props) => { mocks.deleteProps = props; return props.isOpen ? <button onClick={props.deleteAction}>confirm-delete</button> : null; } }));

const baseState = () => ({
  categories: [
    { idCategoriaProducto: 1, nombre: 'Ropa', descripcion: '', estado: true },
    { idCategoriaProducto: 2, nombre: 'Vidrio', descripcion: 'Vasos', estado: false },
  ],
  paginationMeta: { limit: 10, total: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false },
  loading: false, error: null, refreshCategories: vi.fn(), createCategory: vi.fn().mockResolvedValue(),
  updateCategory: vi.fn().mockResolvedValue(), deactivateCategory: vi.fn().mockResolvedValue(), deleteCategory: vi.fn().mockResolvedValue(),
});

describe('ProductCategoriesPage', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.state = baseState(); mocks.confirm.mockResolvedValue(true); });
  it('runs create, edit, deactivate and delete flows', async () => {
    render(<ProductCategoriesPage />);
    expect(screen.getByText('Sin descripción')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre...'), { target: { value: 'rop' } });
    fireEvent.click(screen.getByText('Nueva categoria'));
    await act(() => mocks.modalProps.onSubmit({ nombre: 'Nueva' }));
    expect(mocks.state.createCategory).toHaveBeenCalled();
    fireEvent.click(screen.getAllByText('Editar')[0]);
    await act(() => mocks.modalProps.onSubmit({ nombre: 'Editada' }));
    expect(mocks.state.updateCategory).toHaveBeenCalledWith(1, { nombre: 'Editada' });
    fireEvent.click(screen.getByText('Desactivar'));
    await waitFor(() => expect(mocks.state.deactivateCategory).toHaveBeenCalledWith(1));
    fireEvent.click(screen.getAllByText('Eliminar')[0]);
    await act(() => mocks.deleteProps.deleteAction());
    expect(mocks.state.deleteCategory).toHaveBeenCalledWith(1);
  });
  it('handles cancelled and failed deactivation', async () => {
    mocks.confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mocks.state.deactivateCategory.mockRejectedValueOnce(new Error('blocked'));
    render(<ProductCategoriesPage />);
    fireEvent.click(screen.getByText('Desactivar'));
    expect(mocks.state.deactivateCategory).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Desactivar'));
    await waitFor(() => expect(mocks.notifications.error).toHaveBeenCalledWith('blocked'));
  });
  it.each([
    [{ loading: true }, 'Cargando categorias...'],
    [{ categories: [], error: new Error('x') }, 'No fue posible cargar las categorias.'],
    [{ categories: [], error: null }, 'No se encontraron categorias.'],
  ])('renders alternate state', (override, text) => {
    mocks.state = { ...baseState(), ...override };
    render(<ProductCategoriesPage />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
