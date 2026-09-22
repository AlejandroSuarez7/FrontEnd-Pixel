import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../../core/utils/notifications';
import { PedidoEditModal } from './PedidoEditModal';

vi.mock('../../../../core/utils/notifications', () => ({
  notifications: { success: vi.fn(), error: vi.fn() },
}));

describe('PedidoEditModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not render when closed or when the order is absent', () => {
    const { rerender } = render(
      <PedidoEditModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} pedido={{ idPedido: 1 }} />,
    );
    expect(screen.queryByText(/fecha estimada de entrega/i)).not.toBeInTheDocument();

    rerender(<PedidoEditModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} pedido={null} />);
    expect(screen.queryByText(/fecha estimada de entrega/i)).not.toBeInTheDocument();
  });

  it('assigns a new date and closes after a successful update', async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <PedidoEditModal
        isOpen
        onClose={onClose}
        onSubmit={onSubmit}
        pedido={{ idPedido: 8, fechaEntregaEstimada: null }}
      />,
    );

    expect(screen.getByText('Asignar fecha estimada de entrega')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Fecha estimada de entrega'), {
      target: { value: '2026-10-05' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar fecha' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(8, '2026-10-05'));
    expect(notifications.success).toHaveBeenCalledWith('Fecha estimada de entrega actualizada.');
    expect(onClose).toHaveBeenCalled();
  });

  it('prefills an existing date and reports update failures', async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Fecha fuera del rango'));
    render(
      <PedidoEditModal
        isOpen
        onClose={onClose}
        onSubmit={onSubmit}
        pedido={{ idPedido: 9, fechaEntregaEstimada: '2026-09-25T15:00:00.000Z' }}
      />,
    );

    expect(screen.getByText('Editar fecha estimada de entrega')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha estimada de entrega')).toHaveValue('2026-09-25');
    fireEvent.submit(screen.getByLabelText('Fecha estimada de entrega').closest('form'));

    await waitFor(() => expect(notifications.error).toHaveBeenCalledWith('Fecha fuera del rango'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('submits null for an empty date and uses the fallback error', async () => {
    const onSubmit = vi.fn().mockRejectedValue({});
    render(
      <PedidoEditModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        pedido={{ idPedido: 10, fechaEntregaEstimada: null }}
      />,
    );

    fireEvent.submit(screen.getByLabelText('Fecha estimada de entrega').closest('form'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(10, null));
    expect(notifications.error).toHaveBeenCalledWith(
      'No se pudo actualizar la fecha estimada de entrega.',
    );
  });
});
