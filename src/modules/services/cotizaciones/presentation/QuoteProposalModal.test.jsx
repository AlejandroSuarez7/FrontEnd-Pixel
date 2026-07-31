import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../../core/utils/notifications';
import { QuoteProposalModal } from './QuoteProposalModal';

vi.mock('../../../../core/utils/notifications', () => ({
  notifications: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

const baseQuote = {
  idCotizacion: 44,
  estado: 'EN_REVISION',
  calculoCompleto: true,
  requiereRevisionPrecio: false,
  precioSugeridoSistema: 2880000,
  cliente: {
    nombre: 'Cliente Pixel',
    correo: 'cliente@pixel.com',
  },
  detalles: [{
    idDetalleCotizacion: 20,
    cantidad: 100,
    suministradoPor: 'PIXEL',
    requiereDiseno: false,
    subtotalBruto: 3200000,
    descuentoPorcentaje: 10,
    descuentoTotal: 320000,
    subtotalServiciosOficial: 2880000,
    producto: { nombre: 'Camiseta estampada' },
    estampados: [{
      idDetalleEstampadoCotizacion: 71,
      ubicacion: 'FRENTE',
      tecnica: { nombre: 'DTF' },
      anchoCm: 10,
      altoCm: 12,
    }],
  }],
};

const renderModal = (props = {}) => render(
  <QuoteProposalModal
    open
    quote={baseQuote}
    onClose={vi.fn()}
    onSubmit={vi.fn().mockResolvedValue({})}
    {...props}
  />,
);

const focusMoneyInput = (name) => {
  const input = screen.getByLabelText(name, { exact: false });
  fireEvent.focus(input);
  return input;
};

describe('QuoteProposalModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('explains the suggested estimate and service breakdown', () => {
    renderModal();

    expect(screen.getByText('Estimación sugerida por el sistema')).toBeInTheDocument();
    expect(screen.getByText(/solo una sugerencia interna/i)).toBeInTheDocument();
    expect(screen.getByText('Subtotal de servicios')).toBeInTheDocument();
    expect(screen.getByText('Descuento automático por cantidad')).toBeInTheDocument();
    expect(screen.getByText('10% (-$ 320.000)')).toBeInTheDocument();
    expect(screen.queryByText('Precio final definido por PIXEL')).not.toBeInTheDocument();
  });

  it('locks the physical product cost when the client supplies the product', () => {
    renderModal({
      quote: {
        ...baseQuote,
        detalles: [{
          ...baseQuote.detalles[0],
          suministradoPor: 'CLIENTE',
          costoProducto: 500000,
        }],
      },
    });

    const cost = screen.getByLabelText('Producto suministrado por el cliente', { exact: false });
    expect(cost).toBeDisabled();
    expect(cost).toHaveValue('$ 0');
    expect(screen.getByText('No se agrega costo de suministro del producto.'))
      .toBeInTheDocument();
  });

  it('keeps a manually edited final price when product costs change', async () => {
    const user = userEvent.setup();
    renderModal();

    const finalPrice = focusMoneyInput('Precio final para el cliente *');
    fireEvent.change(finalPrice, { target: { value: '3500000' } });

    const productCost = focusMoneyInput('Costo del producto suministrado por PIXEL');
    fireEvent.change(productCost, { target: { value: '400000' } });

    expect(finalPrice).toHaveValue('3500000');
    expect(screen.getByText('Precio final definido manualmente.')).toBeInTheDocument();
    expect(screen.getByLabelText(/¿Por qué el precio final es diferente/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /usar subtotal calculado/i }));
    fireEvent.focus(finalPrice);
    expect(finalPrice).toHaveValue('3280000');
  });

  it('adds and removes detailed additional concepts', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /agregar concepto/i }));
    const concept = screen.getByPlaceholderText('Ej: Transporte');
    await user.type(concept, 'Transporte');
    const value = document.getElementById('concept-value-concept-1');
    fireEvent.focus(value);
    fireEvent.change(value, { target: { value: '100000' } });

    expect(screen.getByText('Transporte')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /eliminar concepto transporte/i }));
    expect(screen.queryByPlaceholderText('Ej: Transporte')).not.toBeInTheDocument();
  });

  it('shows only public information in the client preview', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText('Mensaje para el cliente', { exact: false }), 'Mensaje público');
    await user.type(screen.getByLabelText('Detalles visibles en la propuesta', { exact: false }), 'Detalle público');
    await user.type(screen.getByLabelText('Notas internas de PIXEL', { exact: false }), 'Margen privado');

    const previewHeading = screen.getByText('Vista previa para el cliente');
    const preview = previewHeading.closest('section');
    expect(within(preview).getByText('Mensaje público')).toBeInTheDocument();
    expect(within(preview).getByText('Detalle público')).toBeInTheDocument();
    expect(within(preview).queryByText('Margen privado')).not.toBeInTheDocument();
    expect(within(preview).queryByText(/estimación sugerida/i)).not.toBeInTheDocument();
  });

  it('prevents duplicate sends and submits one proposal', async () => {
    let release;
    const onSubmit = vi.fn(() => new Promise((resolve) => {
      release = resolve;
    }));
    renderModal({ onSubmit });

    const send = screen.getByRole('button', { name: 'Enviar propuesta al cliente' });
    fireEvent.click(send);
    fireEvent.click(send);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: /enviando propuesta/i })).toBeDisabled();
    release({});
    await waitFor(() => expect(screen.queryByRole('button', { name: /enviando propuesta/i }))
      .not.toBeInTheDocument());
  });

  it('focuses and preserves the adjustment reason after the backend validation error', async () => {
    const onSubmit = vi.fn().mockRejectedValue({
      response: {
        data: { code: 'MANUAL_PRICE_REASON_REQUIRED' },
      },
      message: 'Validation error',
    });
    renderModal({ onSubmit });

    const finalPrice = focusMoneyInput('Precio final para el cliente *');
    fireEvent.change(finalPrice, { target: { value: '3000000' } });
    const reason = screen.getByLabelText(/¿Por qué el precio final es diferente/i);
    fireEvent.change(reason, { target: { value: 'Acuerdo comercial' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar propuesta al cliente' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(reason).toHaveValue('Acuerdo comercial');
    expect(reason).toHaveFocus();
    expect(screen.getByText('Explica por qué el precio final es diferente.')).toBeInTheDocument();
    expect(notifications.error).toHaveBeenCalledWith(
      'Explica por qué el precio final es diferente.',
    );
  });
});
