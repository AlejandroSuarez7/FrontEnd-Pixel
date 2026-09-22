import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../../core/utils/notifications';
import { QuoteResponseModal } from './QuoteResponseModal';

vi.mock('../../../../core/utils/notifications', () => ({
  notifications: { warning: vi.fn(), error: vi.fn() },
}));

const baseProps = {
  open: true,
  quote: { idCotizacion: 18 },
  version: { idVersion: 4, precioFinal: 250000 },
  isStaff: false,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
};

describe('QuoteResponseModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    baseProps.onSubmit.mockResolvedValue(undefined);
  });

  it('does not render without the required open data', () => {
    const { container, rerender } = render(<QuoteResponseModal {...baseProps} open={false} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<QuoteResponseModal {...baseProps} quote={null} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<QuoteResponseModal {...baseProps} version={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('submits a direct client acceptance without a medium', async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<QuoteResponseModal {...baseProps} onClose={onClose} onSubmit={onSubmit} />);

    expect(screen.getByText('Tu respuesta')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'De acuerdo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar respuesta' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      idVersion: 4,
      decision: 'ACEPTAR',
      observaciones: 'De acuerdo',
    }));
    expect(onClose).toHaveBeenCalled();
  });

  it('requires a reason for adjustment requests', () => {
    render(<QuoteResponseModal {...baseProps} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'SOLICITAR_AJUSTE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar respuesta' }));
    expect(notifications.warning).toHaveBeenCalledWith('Indica el motivo del ajuste solicitado.');
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Motivo del ajuste *')).toBeInTheDocument();
  });

  it('lets staff record the medium and a rejection', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<QuoteResponseModal {...baseProps} isStaff onSubmit={onSubmit} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'RECHAZAR' } });
    fireEvent.change(selects[1], { target: { value: 'CORREO' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar respuesta' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      decision: 'RECHAZAR',
      medio: 'CORREO',
    })));
    expect(screen.getByText(/en nombre del cliente/i)).toBeInTheDocument();
  });

  it('reports service errors and preserves the modal', async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Versión vencida'));
    render(<QuoteResponseModal {...baseProps} onClose={onClose} onSubmit={onSubmit} />);
    fireEvent.submit(screen.getByRole('textbox').closest('form'));
    await waitFor(() => expect(notifications.error).toHaveBeenCalledWith('Versión vencida'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('uses the fallback error and closes from the header', async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockRejectedValue({});
    render(<QuoteResponseModal {...baseProps} onClose={onClose} onSubmit={onSubmit} isStaff />);
    fireEvent.submit(screen.getByRole('textbox').closest('form'));
    await waitFor(() => expect(notifications.error).toHaveBeenCalledWith('No se pudo registrar la respuesta.'));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalled();
  });
});
