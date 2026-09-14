import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RolePermissionsModal } from './RolePermissionsModal';

const repositoryMocks = vi.hoisted(() => ({
  list: vi.fn(),
  listByRole: vi.fn(),
  assignToRole: vi.fn(),
  syncCatalog: vi.fn(),
}));

vi.mock('../infrastructure/permissions.repository', () => ({
  permissionsRepository: repositoryMocks,
}));

vi.mock('../../../../core/utils/notifications', () => ({
  notifications: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('RolePermissionsModal production queue permission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositoryMocks.list.mockResolvedValue([{
      idPermiso: 40,
      codigo: 'disenos.produccion',
      modulo: 'produccion',
      accion: 'cola_ver',
      descripcion: 'Consultar cola de producción',
      estado: true,
    }]);
    repositoryMocks.listByRole.mockResolvedValue([]);
    repositoryMocks.assignToRole.mockResolvedValue({});
  });

  it('loads the dynamic permission under Producción and sends its exact code when toggled', async () => {
    const user = userEvent.setup();
    render(
      <RolePermissionsModal
        isOpen
        onClose={vi.fn()}
        role={{ id: 7, nombre: 'Diseñador' }}
        canAssignPermissions
        canSyncPermissions
      />,
    );

    expect(await screen.findByText('Producción')).toBeInTheDocument();
    expect(screen.getAllByText('Consultar cola de producción').length).toBeGreaterThan(0);
    expect(screen.getByText('disenos.produccion')).toBeInTheDocument();
    expect(repositoryMocks.syncCatalog).not.toHaveBeenCalled();

    const checkbox = screen.getByRole('checkbox', { name: /Consultar cola de producción.*disenos\.produccion/i });
    await user.click(checkbox);
    await user.click(screen.getByRole('button', { name: 'Guardar permisos' }));
    await waitFor(() => {
      expect(repositoryMocks.assignToRole).toHaveBeenLastCalledWith(7, ['disenos.produccion']);
    });

    fireEvent.click(checkbox);
    await user.click(screen.getByRole('button', { name: 'Guardar permisos' }));
    await waitFor(() => {
      expect(repositoryMocks.assignToRole).toHaveBeenLastCalledWith(7, []);
    });
  });
});
