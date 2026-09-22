import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../../core/utils/notifications';
import { CompraModal } from './CompraModal';

vi.mock('../../../../core/utils/notifications', () => ({
  notifications: { warning: vi.fn(), error: vi.fn() },
}));

const getPedidos = vi.fn();
const getProveedoresActivos = vi.fn();

const renderModal = (props = {}) => render(
  <CompraModal
    isOpen
    onClose={vi.fn()}
    onSubmit={vi.fn().mockResolvedValue({})}
    getPedidos={getPedidos}
    getProveedoresActivos={getProveedoresActivos}
    {...props}
  />,
);

describe('CompraModal', () => {
  it('renders nothing while closed', () => {
    const { container } = render(
      <CompraModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        getPedidos={getPedidos}
        getProveedoresActivos={getProveedoresActivos}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('loads valid options and registers a confirmed purchase with editable details', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({});
    getPedidos.mockResolvedValue([
      { idPedido: 10, estadoPedido: 'EN_PROCESO', cliente: { nombre: 'Ana' } },
      { idPedido: 11, estadoPedido: 'ENTREGADO', cliente: { nombre: 'Luis' } },
    ]);
    getProveedoresActivos.mockResolvedValue([{ idProveedor: 20, nombre: 'Textiles SAS' }]);
    renderModal({ onSubmit });

    await screen.findByRole('option', { name: /Pedido #10/ });
    expect(screen.queryByRole('option', { name: /Pedido #11/ })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Pedido *'), '10');
    await user.selectOptions(screen.getByLabelText('Proveedor *'), '20');
    await user.type(screen.getByLabelText('Observaciones'), 'Compra urgente');
    await user.type(screen.getByLabelText('Insumo'), 'Tela negra');
    fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Costo unitario'), { target: { value: '5000' } });
    expect(screen.getByText('$10.000')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Agregar insumo' }));
    expect(screen.getAllByLabelText('Insumo')).toHaveLength(2);
    await user.click(screen.getAllByRole('button', { name: 'Quitar' })[1]);
    await user.click(screen.getByRole('checkbox', { name: /Confirmar al registrar/i }));
    await user.click(screen.getByRole('button', { name: 'Registrar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      idPedido: '10',
      idProveedor: '20',
      observaciones: 'Compra urgente',
      confirmar: true,
      detalles: [{ descripcionInsumo: 'Tela negra', cantidad: '2', costoUnitario: '5000' }],
    }));
  });

  it('warns when details are absent or contain invalid quantities', async () => {
    getPedidos.mockResolvedValue([]);
    getProveedoresActivos.mockResolvedValue([]);
    const { container } = renderModal();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Registrar' })).toBeEnabled());

    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(notifications.warning).toHaveBeenCalledWith(
      'La compra debe tener minimo un detalle.',
    ));

    fireEvent.change(screen.getByLabelText('Insumo'), { target: { value: 'Tela' } });
    fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('Costo unitario'), { target: { value: '0' } });
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(notifications.warning).toHaveBeenCalledWith(
      'Cantidad y costo unitario deben ser mayores a 0.',
    ));
  });

  it('loads an existing purchase and reports failures even when option loading fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Compra duplicada'));
    getPedidos.mockRejectedValue(new Error('offline'));
    getProveedoresActivos.mockResolvedValue(undefined);
    const { container } = renderModal({
      onSubmit,
      compra: {
        idCompra: 30,
        idPedido: 10,
        idProveedor: 20,
        observaciones: 'Existente',
        detalles: [{ descripcionInsumo: 'Tinta', cantidad: 3, costoUnitario: 1000 }],
      },
    });

    expect(screen.getByText('Editar compra #30')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Confirmar al registrar/i })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled());
    expect(screen.getByLabelText('Pedido *')).toBeDisabled();
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => expect(notifications.error).toHaveBeenCalledWith('Compra duplicada'));
  });
});
