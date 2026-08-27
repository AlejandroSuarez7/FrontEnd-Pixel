import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RolesPage from './RolesPage';

const mocks = vi.hoisted(() => ({
  getImpact: vi.fn(),
  handleHardDelete: vi.fn(),
  refreshRoles: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('../../../store/AuthContext', () => ({
  useAuth: () => ({ hasPermission: () => true }),
}));

vi.mock('../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({
  useConfirm: () => vi.fn(),
}));

vi.mock('../roles/application/useRoles', () => ({
  useRoles: () => ({
    roles: [{ id: 8, nombre: 'Diseñador', descripcion: 'Diseña piezas', estado: true }],
    paginationMeta: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    loading: false,
    error: null,
    handleCreate: vi.fn(),
    handleUpdate: vi.fn(),
    handleHardDelete: mocks.handleHardDelete,
    refreshRoles: mocks.refreshRoles,
  }),
}));

vi.mock('../../../shared/components/SafeDeleteModal/safeDelete.repository', () => ({
  safeDeleteRepository: { getImpact: mocks.getImpact },
}));

vi.mock('../../../core/utils/notifications', () => ({
  notifications: {
    success: mocks.success,
    error: mocks.error,
  },
}));

vi.mock('../../../shared/components/TableActions/TableActions', () => ({
  TableActions: ({ actions }) => (
    <div>{actions.filter(Boolean).map(action => (
      <button type="button" key={action.label} onClick={action.onClick}>{action.label}</button>
    ))}</div>
  ),
}));

vi.mock('../roles/presentation/RoleFormModal', () => ({ RoleFormModal: () => null }));
vi.mock('../roles/presentation/RolePermissionsModal', () => ({ RolePermissionsModal: () => null }));

const impact = {
  puedeEliminar: true,
  requiereConfirmacionReforzada: true,
  totalAfectados: 3,
  afectados: [{
    tipo: 'Usuarios',
    accion: 'ELIMINAR',
    cantidad: 3,
    registros: [{ id: 1, nombre: 'Juan Perez' }],
    registrosOmitidos: 2,
  }],
};

const openImpact = async () => {
  render(<RolesPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
  await screen.findByText('Juan Perez');
};

describe('RolesPage safe role deletion', () => {
  beforeEach(() => {
    mocks.getImpact.mockReset().mockResolvedValue(impact);
    mocks.handleHardDelete.mockReset().mockResolvedValue(undefined);
    mocks.refreshRoles.mockReset();
    mocks.success.mockReset();
    mocks.error.mockReset();
  });

  it('queries impact first and does not delete when opening or continuing', async () => {
    await openImpact();

    expect(mocks.getImpact).toHaveBeenCalledWith('/api/roles/8/impacto-eliminacion', expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(mocks.handleHardDelete).not.toHaveBeenCalled();
    expect(screen.getByText('+ 2 registros adicionales')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(mocks.handleHardDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Sí, eliminar definitivamente' })).toBeInTheDocument();
  });

  it('deletes only after the second confirmation and closes after success', async () => {
    await openImpact();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar definitivamente' }));

    await waitFor(() => expect(mocks.handleHardDelete).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mocks.success).toHaveBeenCalledWith('Rol eliminado correctamente.');
  });

  it('never deletes when the administrator cancels', async () => {
    await openImpact();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mocks.handleHardDelete).not.toHaveBeenCalled();
  });

  it('keeps double confirmation when totalAfectados is zero', async () => {
    mocks.getImpact.mockResolvedValue({ puedeEliminar: true, totalAfectados: 0, afectados: [] });
    render(<RolesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByText('No se encontraron registros relacionados que vayan a ser afectados.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('button', { name: 'Sí, eliminar definitivamente' })).toBeInTheDocument();
  });

  it('blocks deletion when puedeEliminar is false', async () => {
    mocks.getImpact.mockResolvedValue({
      puedeEliminar: false,
      totalAfectados: 1,
      afectados: [],
      motivoBloqueo: 'Este rol está protegido.',
    });
    render(<RolesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByText('No se puede eliminar este registro.')).toBeInTheDocument();
    expect(screen.getByText('Este rol está protegido.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continuar' })).not.toBeInTheDocument();
    expect(mocks.handleHardDelete).not.toHaveBeenCalled();
  });

  it('blocks DELETE and offers retry when impact lookup fails', async () => {
    mocks.getImpact
      .mockRejectedValueOnce(Object.assign(new Error('network'), { isNetworkError: true }))
      .mockResolvedValueOnce(impact);
    render(<RolesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByText(/Por seguridad, la eliminación fue cancelada/)).toBeInTheDocument();
    expect(mocks.handleHardDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Juan Perez')).toBeInTheDocument();
    expect(mocks.getImpact).toHaveBeenCalledTimes(2);
  });

  it('keeps the final modal open when DELETE fails and allows retry', async () => {
    mocks.handleHardDelete.mockRejectedValueOnce(Object.assign(new Error('Forbidden'), { status: 403 }));
    await openImpact();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar definitivamente' }));

    expect(await screen.findByText('No tienes permiso para realizar esta acción.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(mocks.error).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar definitivamente' }));
    await waitFor(() => expect(mocks.handleHardDelete).toHaveBeenCalledTimes(2));
  });

  it('locks the definitive action so a double click produces one DELETE', async () => {
    let resolveDelete;
    mocks.handleHardDelete.mockReturnValue(new Promise(resolve => { resolveDelete = resolve; }));
    await openImpact();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    const confirmButton = screen.getByRole('button', { name: 'Sí, eliminar definitivamente' });

    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);
    expect(mocks.handleHardDelete).toHaveBeenCalledOnce();

    await act(async () => resolveDelete());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
