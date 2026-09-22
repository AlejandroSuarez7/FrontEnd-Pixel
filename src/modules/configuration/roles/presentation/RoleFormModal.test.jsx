import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../../core/utils/notifications';
import { RoleFormModal } from './RoleFormModal';

vi.mock('../../../../core/utils/notifications', () => ({
  notifications: { error: vi.fn() },
}));

describe('RoleFormModal', () => {
  it('renders nothing while closed and creates a role when opened', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue({});
    const { rerender } = render(
      <RoleFormModal isOpen={false} onClose={onClose} onSubmit={onSubmit} />,
    );
    expect(screen.queryByText('Registrar nuevo rol')).not.toBeInTheDocument();

    rerender(<RoleFormModal isOpen onClose={onClose} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('Nombre del rol *'), 'Supervisor');
    await user.type(screen.getByLabelText('Descripción de permisos'), 'Control de producción');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      nombre: 'Supervisor',
      descripcion: 'Control de producción',
      estado: true,
    }));
    expect(onClose).toHaveBeenCalled();
  });

  it('updates a regular role and allows changing its state', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({});
    render(
      <RoleFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        role={{ id: 7, nombre: 'Operario', descripcion: 'Anterior', estado: false }}
      />,
    );

    const stateSwitch = screen.getByRole('switch');
    expect(stateSwitch).toHaveAttribute('aria-checked', 'false');
    await user.click(stateSwitch);
    fireEvent.change(screen.getByLabelText('Descripción de permisos'), { target: { value: 'Nueva' } });
    await user.click(screen.getByRole('button', { name: 'Actualizar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(7, {
      nombre: 'Operario',
      descripcion: 'Nueva',
      estado: true,
    }));
  });

  it('protects core role fields and reports submission errors', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('No autorizado'));
    render(
      <RoleFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        role={{ id: 1, nombre: 'Admin', descripcion: '', estado: true }}
      />,
    );

    expect(screen.getByLabelText('Nombre del rol *')).toBeDisabled();
    expect(screen.getByRole('switch')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Actualizar' }));

    await waitFor(() => expect(notifications.error).toHaveBeenCalledWith('No autorizado'));
  });
});
