import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuoteDetailsModal } from './QuoteDetailsModal';

describe('QuoteDetailsModal long contact data', () => {
  it('keeps the complete long email available inside the client summary', () => {
    const correo = 'cliente.con.un.correo.extremadamente.largo.para.validar@example-corporativo.com';
    render(
      <QuoteDetailsModal
        isOpen
        onClose={vi.fn()}
        quote={{
          idCotizacion: 75,
          estado: 'PENDIENTE',
          tipoCotizacion: 'PUBLICA',
          total: 100000,
          cantidadItems: 1,
          cliente: {
            nombre: 'Cliente de prueba',
            correo,
            telefono: '3000000000',
          },
          detalles: [{
            idDetalleCotizacion: 1,
            cantidad: 1,
            precioBase: 100000,
            precioUnitario: 100000,
            subtotalBruto: 100000,
            subtotalConDescuento: 100000,
            producto: { nombre: 'Producto' },
          }],
        }}
      />,
    );

    const contact = screen.getByTitle(`${correo} | 3000000000`);
    expect(contact).toHaveTextContent(correo);
  });
});
