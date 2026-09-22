import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ServicesPage from './ServicesPage';

const mocks = vi.hoisted(() => ({
  state: null,
  hasPermission: vi.fn(),
  hasAnyPermission: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  hardDelete: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('../../../store/AuthContext', () => ({
  useAuth: () => ({ hasPermission: mocks.hasPermission, hasAnyPermission: mocks.hasAnyPermission }),
}));

vi.mock('../tecnicas/application/useTecnicas', () => ({
  useTecnicas: () => mocks.state,
}));

vi.mock('../../../core/hooks/useDebounce', () => ({ useDebounce: value => value }));

vi.mock('../../../core/components/Pagination', () => ({
  Pagination: ({ onPageChange }) => <button type="button" onClick={() => onPageChange(2)}>Página siguiente simulada</button>,
}));

vi.mock('../../../shared/components/TableActions/TableActions', () => ({
  TableActions: ({ primaryAction, actions }) => (
    <div>
      <button type="button" onClick={primaryAction.onClick}>{primaryAction.label}</button>
      {actions.filter(Boolean).map(action => (
        <button type="button" key={action.label} onClick={action.onClick}>{action.label}</button>
      ))}
    </div>
  ),
}));

vi.mock('../tecnicas/presentation/ServiceFormModal', () => ({
  ServiceFormModal: ({ service, onClose, tariffPermissions }) => (
    <div data-testid="form-modal">
      <span>{service ? `Editar ${service.nombre}` : 'Crear técnica'}</span>
      <span>{String(tariffPermissions.canView)}</span>
      <button type="button" onClick={onClose}>Cerrar formulario</button>
    </div>
  ),
}));

vi.mock('../tecnicas/presentation/ServiceDetailsModal', () => ({
  ServiceDetailsModal: ({ isOpen, service, onClose }) => isOpen ? (
    <div data-testid="details-modal">
      <span>{service?.nombre}</span>
      <button type="button" onClick={onClose}>Cerrar detalle</button>
    </div>
  ) : null,
}));

vi.mock('../../../shared/components/SafeDeleteModal/SafeDeleteModal', () => ({
  SafeDeleteModal: ({ isOpen, entityName, impactEndpoint, deleteAction, onClose }) => isOpen ? (
    <div data-testid="delete-modal">
      <span>{entityName}</span>
      <span>{impactEndpoint}</span>
      <button type="button" onClick={deleteAction}>Confirmar eliminación</button>
      <button type="button" onClick={onClose}>Cerrar eliminación</button>
    </div>
  ) : null,
}));

const makeState = (overrides = {}) => ({
  tecnicas: [],
  loading: false,
  error: null,
  handleCreate: mocks.create,
  handleUpdate: mocks.update,
  handleHardDelete: mocks.hardDelete,
  paginationMeta: { total: 0, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false },
  refreshTecnicas: mocks.refresh,
  ...overrides,
});

describe('ServicesPage interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasPermission.mockReturnValue(true);
    mocks.hasAnyPermission.mockReturnValue(true);
    mocks.state = makeState();
  });

  it('shows loading and a retryable empty error', () => {
    mocks.state = makeState({ loading: true });
    const { rerender } = render(<ServicesPage />);
    expect(screen.getByText('Cargando técnicas de producción...')).toBeInTheDocument();

    mocks.state = makeState({ error: new Error('fallo') });
    rerender(<ServicesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('renders active and inactive rows including missing descriptions', () => {
    mocks.state = makeState({
      tecnicas: [
        { id: 1, nombre: 'Bordado', descripcion: 'Hilo', estado: true },
        { id: 2, nombre: 'Sublimación', descripcion: '', estado: false },
      ],
      paginationMeta: { total: 12, limit: 10, totalPages: 2, hasNextPage: true, hasPrevPage: false },
    });
    render(<ServicesPage />);
    expect(screen.getByText('Hilo')).toBeInTheDocument();
    expect(screen.getByText('Sin descripción')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Buscar técnica/), { target: { value: 'bordado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente simulada' }));
  });

  it('opens and closes create, edit and detail dialogs', () => {
    mocks.state = makeState({ tecnicas: [{ id: 7, nombre: 'Serigrafía', descripcion: 'Tinta', estado: true }] });
    render(<ServicesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Nueva técnica' }));
    expect(screen.getByText('Crear técnica')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar formulario' }));

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByText('Editar Serigrafía')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar formulario' }));

    fireEvent.click(screen.getByRole('button', { name: 'Ver' }));
    expect(screen.getByTestId('details-modal')).toHaveTextContent('Serigrafía');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar detalle' }));
    expect(screen.queryByTestId('details-modal')).not.toBeInTheDocument();
  });

  it('opens safe deletion with the technique endpoint and delegates deletion', () => {
    mocks.state = makeState({ tecnicas: [{ id: 9, nombre: 'DTF', estado: true }] });
    render(<ServicesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByTestId('delete-modal')).toHaveTextContent('DTF');
    expect(screen.getByTestId('delete-modal')).toHaveTextContent('/api/tecnicas/9/impacto-eliminacion');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }));
    expect(mocks.hardDelete).toHaveBeenCalledWith(9);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar eliminación' }));
    expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument();
  });

  it('hides mutation actions without permissions', () => {
    mocks.hasPermission.mockReturnValue(false);
    mocks.hasAnyPermission.mockReturnValue(false);
    mocks.state = makeState({ tecnicas: [{ id: 3, nombre: 'Laser', estado: true }] });
    render(<ServicesPage />);
    expect(screen.queryByRole('button', { name: 'Nueva técnica' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver' })).toBeInTheDocument();
  });
});
