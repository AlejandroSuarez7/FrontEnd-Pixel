import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../core/utils/notifications';
import { CategoryModal } from './CategoryModal';

vi.mock('../../../core/utils/notifications', () => ({
  notifications: { warning: vi.fn(), error: vi.fn() },
}));

describe('CategoryModal', () => {
  it('renders nothing when closed and validates a short category name', async () => {
    const onSubmit = vi.fn();
    const { container, rerender } = render(
      <CategoryModal isOpen={false} onClose={vi.fn()} onSubmit={onSubmit} />,
    );
    expect(container).toBeEmptyDOMElement();

    rerender(<CategoryModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Nombre *'), { target: { value: 'x' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => expect(notifications.warning).toHaveBeenCalledWith(
      'El nombre de la categoria debe tener al menos 2 caracteres.',
    ));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('creates a category with the selected state', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue({});
    render(<CategoryModal isOpen onClose={onClose} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Nombre *'), 'Tintas');
    await user.type(screen.getByLabelText('Descripción'), 'Tintas textiles');
    await user.selectOptions(screen.getByLabelText('Estado'), 'false');
    await user.click(screen.getByRole('button', { name: 'Crear categoria' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      nombre: 'Tintas',
      descripcion: 'Tintas textiles',
      estado: false,
    }));
  });

  it('loads edit data and reports a save failure', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error());
    render(
      <CategoryModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        category={{ idCategoriaProducto: 4, nombre: 'Camisetas', descripcion: 'Base', estado: true }}
      />,
    );

    expect(screen.getByText('Editar categoria')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(notifications.error).toHaveBeenCalledWith(
      'No se pudo guardar la categoria.',
    ));
  });
});
