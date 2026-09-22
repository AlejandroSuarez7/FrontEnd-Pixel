import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PedidoDetailsModal } from './PedidoDetailsModal';

const basePedido = {
  idPedido: 10,
  idCotizacion: 4,
  estadoPedido: 'EN_PROCESO',
  estadoPago: 'PARCIAL',
  total: 100000,
  subtotalBruto: 110000,
  subtotalConDescuento: 95000,
  descuentoTotal: 15000,
  costosAdicionales: 3000,
  costoDiseno: 2000,
  totalPagado: 40000,
  saldoPendiente: 60000,
  fechaCreacion: '2026-01-01T10:00:00Z',
  observaciones: '[2026-01-02T10:00:00Z] En producción\n[[PIXEL_QUEUE_ORDER:2]]',
  cliente: { nombre: 'Ana', correo: 'ana@example.com', telefono: '3001234567' },
  detalles: [{
    idDetallePedido: 5,
    cantidad: 2,
    producto: { nombre: 'Camiseta', precioBase: 50000, categoria: { nombre: 'Textiles' } },
    descripcion: 'Camiseta estampada',
    observaciones: 'Color negro',
    tecnica: { nombre: 'DTF' },
    precioBase: 50000,
    descuentoPorcentaje: 10,
    descuentoValorUnitario: 5000,
    costoDiseno: 2000,
    precioUnitario: 45000,
    subtotalBruto: 100000,
    subtotalFinal: 90000,
    requiereDiseno: true,
    origenDiseno: 'CLIENTE',
    archivoDisenoInicialUrl: 'https://example.com/design.png',
  }],
};

describe('PedidoDetailsModal', () => {
  it('renders nothing without an open order', () => {
    const { container, rerender } = render(<PedidoDetailsModal isOpen={false} pedido={basePedido} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<PedidoDetailsModal isOpen pedido={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the full economic and design detail and supports requirement updates', () => {
    const onClose = vi.fn();
    const onToggle = vi.fn();
    render(
      <PedidoDetailsModal
        isOpen
        pedido={basePedido}
        onClose={onClose}
        canEditDesignRequirement
        onToggleDesignRequirement={onToggle}
      />,
    );

    expect(screen.getByText('Pedido #10')).toBeInTheDocument();
    expect(screen.getByText('Camiseta')).toBeInTheDocument();
    expect(screen.getByText('Color negro')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver archivo del diseño' })).toHaveAttribute(
      'href', 'https://example.com/design.png',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Marcar no requiere diseño' }));
    expect(onToggle).toHaveBeenCalledWith(basePedido.detalles[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar ventana' }));
    expect(onClose).toHaveBeenCalled();
  });

  it.each([
    ['PENDIENTE_SALDO_FINAL', 'Saldo final pendiente:'],
    ['ENTREGADO', 'Producto entregado:'],
    ['ANULADO', 'Pedido anulado:'],
  ])('shows the %s order notice', (estadoPedido, notice) => {
    render(<PedidoDetailsModal isOpen pedido={{ ...basePedido, estadoPedido }} />);
    expect(screen.getByText(notice)).toBeInTheDocument();
  });

  it('covers empty and fallback order data without fabricating values', () => {
    render(<PedidoDetailsModal isOpen pedido={{ idPedido: 11, detalles: null, saldoPendiente: 0 }} />);
    expect(screen.getByText('Cliente no especificado')).toBeInTheDocument();
    expect(screen.getByText('Este pedido no tiene producto registrado.')).toBeInTheDocument();
    expect(screen.getByText('Sin observaciones')).toBeInTheDocument();
    expect(screen.getAllByText('No especificado').length).toBeGreaterThan(0);
  });

  it('uses unit discount fallback and exposes a pending design update state', () => {
    const detail = {
      idDetallePedido: 6,
      cantidad: 3,
      nombreProducto: 'Gorra',
      idTecnica: 9,
      descuentoValorUnitario: 1000,
      subtotal: 30000,
      total: 27000,
      requiereDiseno: false,
    };
    render(
      <PedidoDetailsModal
        isOpen
        pedido={{ ...basePedido, saldoPendiente: 0, detalles: [detail] }}
        canEditDesignRequirement
        pendingDesignRequirementId={6}
      />,
    );
    expect(screen.getByText('Gorra')).toBeInTheDocument();
    expect(screen.getByText('Técnica #9')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actualizando...' })).toBeDisabled();
    expect(screen.getAllByText('No aplica').length).toBeGreaterThan(0);
  });
});
