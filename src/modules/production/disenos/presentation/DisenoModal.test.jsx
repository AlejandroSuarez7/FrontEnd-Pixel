import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DisenoModal } from './DisenoModal';

vi.mock('../../../../core/services/apiService', () => ({
  apiClient: { get: vi.fn() },
}));

vi.mock('../../../../core/utils/notifications', () => ({
  notifications: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

const pedido = {
  idPedido: 36,
  estadoPedido: 'PENDIENTE',
  estadoPago: 'PARCIAL',
  cliente: { nombre: 'Cliente Pixel' },
  detalles: [
    {
      idDetallePedido: 101,
      cantidad: 10,
      producto: { nombre: 'Producto sin diseno' },
      requiereDiseno: false,
      estadoCoberturaDiseno: 'NO_REQUIERE_DISENO',
      cubiertoPorDiseno: true,
    },
    {
      idDetallePedido: 102,
      cantidad: 12,
      producto: { nombre: 'Producto del cliente' },
      requiereDiseno: true,
      origenDiseno: 'CLIENTE',
      archivoDisenoInicialUrl: 'https://example.com/cliente.png',
      estadoCoberturaDiseno: 'DISENO_ENTREGADO_POR_CLIENTE',
      cubiertoPorDiseno: false,
    },
    {
      idDetallePedido: 103,
      cantidad: 20,
      producto: { nombre: 'Producto PIXEL' },
      requiereDiseno: true,
      origenDiseno: 'PIXEL',
      estadoCoberturaDiseno: 'PENDIENTE_CREACION_PIXEL',
      cubiertoPorDiseno: false,
    },
  ],
};

describe('DisenoModal design coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables covered products and only enables PIXEL pending products', async () => {
    render(
      <DisenoModal
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isStaff={false}
        getPedidos={vi.fn().mockResolvedValue([pedido])}
      />,
    );

    fireEvent.change(await screen.findByLabelText(/pedido/i), {
      target: { value: '36' },
    });

    const noDesignOption = await screen.findByRole('option', { name: /no requiere diseno/i });
    const clientOption = screen.getByRole('option', { name: /diseno recibido/i });
    const pixelOption = screen.getByRole('option', { name: /pendiente de creacion por pixel/i });

    expect(noDesignOption).toBeDisabled();
    expect(clientOption).toBeDisabled();
    expect(pixelOption).not.toHaveAttribute('disabled');
    await waitFor(() => {
      expect(screen.getByLabelText(/producto del pedido/i)).toHaveValue('103');
    });
  });

  it('submits the only eligible detail without allowing a client-origin duplicate', async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    render(
      <DisenoModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isStaff={false}
        getPedidos={vi.fn().mockResolvedValue([pedido])}
      />,
    );

    fireEvent.change(await screen.findByLabelText(/pedido/i), {
      target: { value: '36' },
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/producto del pedido/i)).toHaveValue('103');
    });

    expect(screen.getByLabelText(/origen del diseno/i)).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /registrar/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        idPedido: '36',
        idDetallePedido: 103,
        origenDiseno: 'DISENADOR',
      }));
    });
  });

  it('allows a rejected product to receive a corrected version', async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    const rejectedPedido = {
      ...pedido,
      detalles: [{
        idDetallePedido: 104,
        cantidad: 25,
        producto: { nombre: 'Camiseta para corregir' },
        requiereDiseno: true,
        estadoCoberturaDiseno: 'DISENO_RECHAZADO',
        diseno: {
          idDiseno: 77,
          estado: 'RECHAZADO',
          archivoUrl: 'https://example.com/version-anterior.png',
        },
      }],
    };

    render(
      <DisenoModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isStaff={false}
        presetPedido={rejectedPedido}
        presetDetailId="104"
        lockPedido
      />,
    );

    expect(screen.getByRole('heading', { name: 'Cargar diseno corregido' })).toBeInTheDocument();
    expect(screen.getByText('Nueva version para revision')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver version anterior' })).toHaveAttribute(
      'href',
      'https://example.com/version-anterior.png',
    );

    fireEvent.change(screen.getByPlaceholderText('https://archivo.com/diseno.png'), {
      target: { value: 'https://example.com/version-corregida.png' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cargar diseno corregido' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      idPedido: 36,
      idDetallePedido: 104,
      archivoUrl: 'https://example.com/version-corregida.png',
    })));
  });
});
