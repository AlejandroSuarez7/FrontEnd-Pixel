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

  it('shows only the official proposal values to the client', () => {
    render(
      <QuoteDetailsModal
        isOpen
        onClose={vi.fn()}
        quote={{
          idCotizacion: 91,
          estado: 'PENDIENTE_APROBACION_CLIENTE',
          tipoCotizacion: 'PUBLICA',
          precioSugeridoInterno: 910000,
          advertenciasInternas: ['Tarifa interna pendiente'],
          observacionesInternas: 'Margen privado',
          cliente: {
            nombre: 'Cliente Pixel',
            correo: 'cliente@pixel.com',
            telefono: '3000000000',
          },
          detalles: [{
            idDetalleCotizacion: 14,
            cantidad: 12,
            precioBase: 88000,
            precioSugeridoInterno: 850000,
            producto: { nombre: 'Camiseta' },
            estampados: [{
              idTecnica: 2,
              ubicacion: 'FRENTE',
              origenDiseno: 'PIXEL',
              tecnica: { nombre: 'Bordado' },
            }],
          }],
          propuesta: {
            idVersion: 7,
            numeroVersion: 2,
            precioFinal: 820000,
            descuentoManual: 20000,
            costosAdicionales: 40000,
            validaHasta: '2099-08-06T23:59:59.000Z',
            estado: 'ENVIADA',
            mensajeCliente: 'Esta es tu propuesta final.',
            observacionesCliente: 'Incluye entrega local.',
            desgloseVisible: {
              subtotalItems: 800000,
              items: [{
                idDetalleCotizacion: 14,
                nombre: 'Camiseta',
                cantidad: 12,
                subtotal: 800000,
              }],
              total: 820000,
            },
          },
        }}
        isStaff={false}
      />,
    );

    expect(screen.getAllByText('$ 820.000').length).toBeGreaterThan(0);
    expect(screen.getByText('Esta es tu propuesta final.')).toBeInTheDocument();
    expect(screen.getByText('Incluye entrega local.')).toBeInTheDocument();
    expect(screen.getByText('Enviada al cliente')).toBeInTheDocument();
    expect(screen.queryByText(/Estimacion interna/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Tarifa interna pendiente')).not.toBeInTheDocument();
    expect(screen.queryByText('Margen privado')).not.toBeInTheDocument();
    expect(screen.queryByText('Precio base unitario')).not.toBeInTheDocument();
  });

  it('separates public proposal labels and values without exposing invalid data', () => {
    const { container } = render(
      <QuoteDetailsModal
        isOpen
        onClose={vi.fn()}
        isStaff={false}
        quote={{
          idCotizacion: 110,
          estado: 'PENDIENTE_APROBACION_CLIENTE',
          cliente: { nombre: 'Cliente Pixel' },
          detalles: [{
            idDetalleCotizacion: 31,
            cantidad: 20,
            producto: { nombre: 'Camiseta' },
          }],
          propuesta: {
            idVersion: 10,
            numeroVersion: 3,
            estado: 'ENVIADA',
            precioFinal: 3357200,
            descuentoManual: 0,
            validaHasta: '2099-08-07T23:59:59.000Z',
            mensajeCliente: 'Propuesta revisada por PIXEL.',
            desgloseVisible: {
              subtotalItems: 3237200,
              items: [{
                idDetalleCotizacion: 31,
                nombre: 'Camiseta',
                cantidad: 20,
                subtotalOficial: 3237200,
              }],
              disenos: [{
                descripcionVisible: 'Creacion del diseno',
                costoDiseno: 20000,
                visibleCliente: true,
              }],
              conceptosAdicionales: [{
                concepto: 'Transporte',
                valor: 100000,
                visibleCliente: true,
              }],
            },
          },
        }}
      />,
    );

    const discountLabel = screen.getByText('Descuento comercial');
    expect(discountLabel.parentElement).toHaveTextContent('No aplica');
    expect(discountLabel.parentElement?.querySelector('strong')).toHaveTextContent('No aplica');
    expect(screen.getByText('Creacion del diseno')).toBeInTheDocument();
    expect(screen.getByText('Transporte')).toBeInTheDocument();
    expect(screen.getByText('Version 3')).toBeInTheDocument();
    expect(screen.getByText('Total final').parentElement?.querySelector('strong')).toHaveTextContent('$ 3.357.200');
    expect(container).not.toHaveTextContent(/undefined|null|NaN/i);
    expect(container).not.toHaveTextContent(/motivo|notas internas|estimacion interna/i);
  });

  it('shows product discount and pending calculation reasons with human labels', () => {
    render(
      <QuoteDetailsModal
        isOpen
        onClose={vi.fn()}
        isStaff
        quote={{
          idCotizacion: 102,
          estado: 'EN_REVISION',
          tipoCotizacion: 'PUBLICA',
          requiereRevisionPrecio: true,
          cliente: { nombre: 'Cliente Pixel' },
          detalles: [{
            idDetalleCotizacion: 20,
            tipoProducto: 'CATALOGO',
            cantidad: 12,
            precioBase: 8000,
            precioUnitario: 7360,
            descuentoPorcentaje: 8,
            descuentoTotal: 7680,
            subtotalBruto: 96000,
            subtotalConDescuento: 88320,
            requiereRevisionPrecio: true,
            calculoCompleto: false,
            estadoMedidas: 'MEDIDAS_PENDIENTES',
            motivosRevision: ['SIN_TARIFA_PARA_MEDIDAS'],
            rangoProductoAplicado: {
              cantidadMinima: 10,
              porcentaje: 8,
            },
            producto: { nombre: 'Camiseta' },
          }],
        }}
      />,
    );

    expect(screen.getByText('Descuento por cantidad')).toBeInTheDocument();
    expect(screen.getByText(/Desde 10 unidades/)).toBeInTheDocument();
    expect(screen.getByText('Medidas pendientes de definir con el cliente.')).toBeInTheDocument();
    expect(screen.getByText('No existe una tarifa configurada para estas medidas.')).toBeInTheDocument();
    expect(screen.queryByText(/SIN_TARIFA|MEDIDAS_PENDIENTES/)).not.toBeInTheDocument();
  });
});
