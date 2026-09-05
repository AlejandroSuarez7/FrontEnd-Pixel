import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../../core/utils/notifications';
import { RegisterClientDesignModal } from './RegisterClientDesignModal';

vi.mock('../../../../core/utils/notifications', () => ({
  notifications: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

const detail = {
  idRequerimientoDiseno: 'STAMP-102',
  idPedido: 36,
  cantidad: 12,
  producto: { nombre: 'Camiseta estampada' },
};

describe('RegisterClientDesignModal', () => {
  it('validates the file and preserves the exact backend payload fields', async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    const { container } = render(
      <RegisterClientDesignModal
        isOpen
        pedido={{ idPedido: 36 }}
        detail={detail}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const file = new File(['design'], 'diseno.png', { type: 'image/png' });
    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [file] },
    });
    fireEvent.change(screen.getByLabelText(/medio de recepcion/i), {
      target: { value: 'CORREO' },
    });
    fireEvent.change(screen.getByLabelText(/observaciones/i), {
      target: { value: 'Recibido por correo.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar diseno recibido' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      archivo: file,
      medioRecepcion: 'CORREO',
      observaciones: 'Recibido por correo.',
    }));
  });

  it('prevents a duplicated submit while the request is pending', async () => {
    let resolveRequest;
    const onSubmit = vi.fn(() => new Promise(resolve => {
      resolveRequest = resolve;
    }));
    const { container } = render(
      <RegisterClientDesignModal
        isOpen
        pedido={{ idPedido: 36 }}
        detail={detail}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [new File(['design'], 'diseno.pdf', { type: 'application/pdf' })] },
    });
    const submit = screen.getByRole('button', { name: 'Registrar diseno recibido' });
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => expect(submit).toBeDisabled());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    resolveRequest({});
  });

  it('keeps the modal open when the request fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('No se pudo registrar el diseno recibido.'));
    const { container } = render(
      <RegisterClientDesignModal
        isOpen
        pedido={{ idPedido: 36 }}
        detail={detail}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [new File(['design'], 'diseno.webp', { type: 'image/webp' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar diseno recibido' }));

    await waitFor(() => {
      expect(notifications.error).toHaveBeenCalledWith('No se pudo registrar el diseno recibido.');
    });
    expect(screen.getByRole('dialog', { name: 'Registrar diseno recibido' })).toBeInTheDocument();
  });
});
