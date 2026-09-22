import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductsPage } from './ProductsPage';

const mocks = vi.hoisted(() => ({
  state: {}, confirm: vi.fn(), listPublic: vi.fn(), modalProps: null, deleteProps: null,
  notifications: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../core/hooks/useDebounce', () => ({ useDebounce: (value) => value }));
vi.mock('../../../store/AuthContext', () => ({ useAuth: () => ({ hasPermission: () => true, hasAnyPermission: () => true }) }));
vi.mock('../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({ useConfirm: () => mocks.confirm }));
vi.mock('../../../core/utils/notifications', () => ({ notifications: mocks.notifications }));
vi.mock('../application/useProducts', () => ({ useProducts: () => mocks.state }));
vi.mock('../infrastructure/category.repository', () => ({ categoryRepository: { listPublic: mocks.listPublic } }));
vi.mock('../../../core/components/Pagination', () => ({ Pagination: ({ onPageChange }) => <button onClick={() => onPageChange(2)}>page-2</button> }));
vi.mock('../../../shared/components/TableActions/TableActions', () => ({
  TableActions: ({ primaryAction, actions = [] }) => <>{[primaryAction, ...actions].filter(Boolean).map((action) => <button key={action.label} onClick={action.onClick}>{action.label}</button>)}</>,
}));
vi.mock('../presentation/ProductModal', () => ({
  ProductModal: (props) => {
    mocks.modalProps = props;
    return props.isOpen ? <div data-testid="product-modal">{props.product?.nombre || 'new product'}</div> : null;
  },
}));
vi.mock('../../../shared/components/SafeDeleteModal/SafeDeleteModal', () => ({
  SafeDeleteModal: (props) => {
    mocks.deleteProps = props;
    return props.isOpen ? <button onClick={props.deleteAction}>confirm-delete</button> : null;
  },
}));

const baseState = () => ({
  products: [
    { idProducto: 1, nombre: 'Camiseta', descripcion: '', categoriaProducto: { nombre: 'Ropa' }, requiereDiseno: true, estado: true },
    { idProducto: 2, nombre: 'Vaso', descripcion: 'Vidrio', categoriaProducto: null, requiereDiseno: false, estado: false },
  ],
  paginationMeta: { page: 1, limit: 10, total: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false },
  loading: false, error: null,
  refreshProducts: vi.fn().mockResolvedValue(), createProduct: vi.fn().mockResolvedValue({ idProducto: 9 }),
  updateProduct: vi.fn().mockResolvedValue({ idProducto: 1 }), deactivateProduct: vi.fn().mockResolvedValue(),
  deleteProduct: vi.fn().mockResolvedValue(), loadRanges: vi.fn(), saveRanges: vi.fn().mockResolvedValue(),
});

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state = baseState();
    mocks.confirm.mockResolvedValue(true);
    mocks.listPublic.mockResolvedValue([{ idCategoriaProducto: 4, nombre: 'Promocionales' }]);
  });

  it('loads categories and runs create, edit, deactivate and delete flows', async () => {
    render(<ProductsPage />);
    expect(screen.getByText('Sin descripción')).toBeInTheDocument();
    expect(screen.getByText('Sin categoria')).toBeInTheDocument();
    expect(await screen.findByText('Promocionales')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre...'), { target: { value: 'cam' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '4' } });
    fireEvent.click(screen.getByText('Nuevo producto'));
    await act(() => mocks.modalProps.onSubmit({ product: { nombre: 'Nuevo' }, ranges: [{ cantidadMinima: 2 }] }));
    expect(mocks.state.createProduct).toHaveBeenCalled();
    expect(mocks.state.saveRanges).toHaveBeenCalledWith(9, [{ cantidadMinima: 2 }]);

    mocks.modalProps.onClose();
    fireEvent.click(screen.getAllByText('Editar')[0]);
    await act(() => mocks.modalProps.onSubmit({ product: { nombre: 'Editado' }, ranges: [], persistedProductId: 1 }));
    expect(mocks.state.updateProduct).toHaveBeenCalledWith(1, { nombre: 'Editado' }, { refresh: false });
    fireEvent.click(screen.getByText('Desactivar'));
    await waitFor(() => expect(mocks.state.deactivateProduct).toHaveBeenCalledWith(1));
    fireEvent.click(screen.getAllByText('Eliminar')[0]);
    await act(() => mocks.deleteProps.deleteAction());
    expect(mocks.state.deleteProduct).toHaveBeenCalledWith(1);
  });

  it('surfaces partial range failures and deactivate errors', async () => {
    mocks.state.saveRanges.mockRejectedValueOnce(new Error('range fail'));
    mocks.state.deactivateProduct.mockRejectedValueOnce(new Error('blocked'));
    render(<ProductsPage />);
    fireEvent.click(screen.getByText('Nuevo producto'));
    await expect(mocks.modalProps.onSubmit({ product: {}, ranges: [] })).rejects.toMatchObject({ partial: true, persistedProductId: 9 });
    expect(mocks.state.refreshProducts).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Desactivar'));
    await waitFor(() => expect(mocks.notifications.error).toHaveBeenCalledWith('blocked'));
  });

  it.each([
    [{ loading: true }, 'Cargando productos...'],
    [{ products: [], error: new Error('x') }, 'No fue posible cargar los productos.'],
    [{ products: [], error: null }, 'No se encontraron productos cotizables.'],
  ])('renders alternate list state', (override, text) => {
    mocks.state = { ...baseState(), ...override };
    render(<ProductsPage />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
