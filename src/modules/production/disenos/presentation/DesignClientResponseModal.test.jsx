import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DesignClientResponseModal } from './DesignClientResponseModal';

vi.mock('../../../../core/hooks/useAsyncLock', () => ({ useAsyncLock: () => ({ isLocked: false, runLocked: (operation) => operation() }) }));
const design = { idDiseno: 1, idPedido: 2, pedido: { cliente: { nombre: 'Ana' } }, detallePedido: { producto: { nombre: 'Camiseta' } } };

describe('DesignClientResponseModal', () => {
  it('returns null without required state', () => {
    const { container } = render(<DesignClientResponseModal isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });
  it('submits an approval with optional traceability', async () => {
    const onSubmit = vi.fn().mockResolvedValue(); const onClose = vi.fn();
    render(<DesignClientResponseModal isOpen mode="approve" diseno={design} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText(/Ana/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Medio de aprobacion *'), { target: { value: 'CORREO' } });
    fireEvent.change(screen.getByLabelText('Observaciones'), { target: { value: ' Aprobó ' } });
    fireEvent.click(screen.getByText('Registrar aprobacion'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ medio: 'CORREO', observaciones: 'Aprobó' }));
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalled();
  });
  it('requires and submits rejection observations', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<DesignClientResponseModal isOpen mode="reject" diseno={{ idDiseno: 3, idPedido: 4, cliente: { nombre: 'Beto' }, producto: { nombre: 'Vaso' } }} onSubmit={onSubmit} onClose={vi.fn()} />);
    expect(screen.getByText('Registrar rechazo')).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Cambios solicitados *'), { target: { value: ' Más azul ' } });
    fireEvent.click(screen.getByText('Registrar rechazo'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ medio: 'WHATSAPP', observaciones: 'Más azul' }));
  });
});
