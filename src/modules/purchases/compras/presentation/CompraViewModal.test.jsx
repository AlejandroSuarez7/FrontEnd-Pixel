import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CompraViewModal } from './CompraViewModal';

const compra = {
  idCompra: 7,
  idPedido: 15,
  estado: 'RECIBIDA',
  fechaCompra: '2026-09-20',
  proveedor: { nombre: 'Textiles SAS' },
  compradoPor: { nombre: 'Ana' },
  observaciones: 'Entrega completa',
  total: 45000,
  detalles: [{ idDetalleCompra: 1, descripcionInsumo: 'Tela', cantidad: 3, costoUnitario: 15000, subtotal: 45000 }],
};

describe('CompraViewModal', () => {
  it('stays hidden without an open purchase', () => {
    const { container, rerender } = render(<CompraViewModal isOpen={false} compra={compra} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<CompraViewModal isOpen compra={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows financial and supplier details and closes', () => {
    const onClose = vi.fn();
    render(<CompraViewModal isOpen compra={compra} onClose={onClose} isDesigner={false} />);
    expect(screen.getByText('Textiles SAS')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getAllByText('$45.000')).not.toHaveLength(0);
    expect(screen.getByText('$15.000')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar ventana' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('hides costs from designers and uses optional fallbacks', () => {
    render(<CompraViewModal isOpen compra={{ ...compra, observaciones: '', detalles: [{ descripcionInsumo: 'Hilo', cantidad: 2 }] }} onClose={vi.fn()} isDesigner />);
    expect(screen.getByText('Sin observaciones')).toBeInTheDocument();
    expect(screen.queryByText('Proveedor')).not.toBeInTheDocument();
    expect(screen.queryByText('Costo unit.')).not.toBeInTheDocument();
    expect(screen.queryByText('Total compra')).not.toBeInTheDocument();
  });
});
