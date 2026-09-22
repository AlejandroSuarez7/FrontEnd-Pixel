import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../../core/utils/notifications';
import { ProveedorModal } from './ProveedorModal';

vi.mock('../../../../core/utils/notifications', () => ({
  notifications: { warning: vi.fn(), error: vi.fn() },
}));

describe('ProveedorModal', () => {
  it('renders nothing while closed and validates the supplier name', async () => {
    const onSubmit = vi.fn();
    const { container, rerender } = render(
      <ProveedorModal isOpen={false} onClose={vi.fn()} onSubmit={onSubmit} />,
    );
    expect(container).toBeEmptyDOMElement();

    rerender(<ProveedorModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(notifications.warning).toHaveBeenCalledWith(
      'El nombre del proveedor es obligatorio.',
    ));
  });

  it('registers all supplier fields and its state', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({});
    render(<ProveedorModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Nombre *'), 'Textiles SAS');
    await user.type(screen.getByLabelText('Telefono'), '3001234567');
    await user.type(screen.getByLabelText('Correo'), 'ventas@example.com');
    await user.type(screen.getByLabelText('Direccion'), 'Centro');
    await user.click(screen.getByRole('checkbox', { name: /Proveedor activo/i }));
    await user.click(screen.getByRole('button', { name: 'Registrar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      nombre: 'Textiles SAS',
      telefono: '3001234567',
      correo: 'ventas@example.com',
      direccion: 'Centro',
      estado: false,
    }));
  });

  it('loads an existing supplier and reports save errors', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Duplicado'));
    render(
      <ProveedorModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        proveedor={{
          idProveedor: 8,
          nombre: 'Proveedor actual',
          telefono: '1',
          correo: 'actual@example.com',
          direccion: 'Norte',
          estado: true,
        }}
      />,
    );

    expect(screen.getByText('Editar proveedor #8')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(notifications.error).toHaveBeenCalledWith('Duplicado'));
  });
});
