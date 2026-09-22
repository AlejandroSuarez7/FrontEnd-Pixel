import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../core/utils/notifications';
import { ProductModal } from './ProductModal';

vi.mock('../../../core/utils/notifications', () => ({
  notifications: { warning: vi.fn(), error: vi.fn() },
}));

const categories = [{ idCategoriaProducto: 2, nombre: 'Textiles' }];

describe('ProductModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders nothing when closed and validates required product data', async () => {
    const onSubmit = vi.fn();
    const { container, rerender } = render(
      <ProductModal isOpen={false} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
    rerender(<ProductModal isOpen onSubmit={onSubmit} onClose={vi.fn()} categories={categories} />);
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(notifications.warning).toHaveBeenCalledWith(
      'El nombre debe tener al menos 2 caracteres.',
    ));
  });

  it('creates a product and valid discount ranges', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue({ idProducto: 8 });
    render(
      <ProductModal
        isOpen
        onClose={onClose}
        onSubmit={onSubmit}
        categories={categories}
        canManageDiscounts
      />,
    );

    await user.type(screen.getByLabelText('Nombre *'), 'Camiseta');
    await user.selectOptions(screen.getByLabelText('Categoría *'), '2');
    await user.selectOptions(screen.getByLabelText('Requiere diseño'), 'false');
    await user.selectOptions(document.getElementById('product-status'), 'false');
    await user.type(screen.getByLabelText('Descripción'), 'Algodón');
    fireEvent.change(screen.getByLabelText('Descuento rango 1'), { target: { value: '10' } });
    await user.click(screen.getByRole('button', { name: 'Agregar rango' }));
    expect(screen.getAllByLabelText(/Cantidad mínima rango/)).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Quitar rango 2' }));
    await user.click(screen.getByRole('button', { name: 'Crear producto' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      product: expect.objectContaining({ nombre: 'Camiseta', idCategoriaProducto: '2', requiereDiseno: false, estado: false }),
      persistedProductId: null,
    })));
    expect(onClose).toHaveBeenCalled();
  });

  it('loads existing ranges and updates an edited product', async () => {
    const user = userEvent.setup();
    const onLoadRanges = vi.fn().mockResolvedValue([
      { idRangoDescuento: 3, cantidadMinima: 10, porcentaje: 5, estado: true },
    ]);
    const onSubmit = vi.fn().mockResolvedValue({ idProducto: 4 });
    render(
      <ProductModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        onLoadRanges={onLoadRanges}
        categories={categories}
        canManageDiscounts
        product={{ idProducto: 4, nombre: 'Gorra', idCategoriaProducto: 2, estado: true }}
      />,
    );

    expect(await screen.findByLabelText('Cantidad mínima rango 1')).toHaveValue(10);
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ persistedProductId: 4 })));
  });

  it('reports range validation, loading and partial persistence failures', async () => {
    const onSubmit = vi.fn().mockRejectedValue(Object.assign(new Error('Rangos pendientes'), {
      partial: true,
      persistedProductId: 12,
    }));
    const { container } = render(
      <ProductModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        categories={categories}
        canManageDiscounts
      />,
    );
    fireEvent.change(screen.getByLabelText('Nombre *'), { target: { value: 'Producto' } });
    fireEvent.change(screen.getByLabelText('Categoría *'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Cantidad mínima rango 1'), { target: { value: '0' } });
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(notifications.warning).toHaveBeenCalledWith('Revisa los rangos de descuento.'));

    fireEvent.change(screen.getByLabelText('Cantidad mínima rango 1'), { target: { value: '1' } });
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(notifications.warning).toHaveBeenCalledWith('Rangos pendientes'));
  });

  it('reports range-loading and normal submit failures', async () => {
    const loadError = new Error('No cargó');
    const onLoadRanges = vi.fn().mockRejectedValue(loadError);
    const onSubmit = vi.fn().mockRejectedValue(new Error());
    const { container } = render(
      <ProductModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        onLoadRanges={onLoadRanges}
        categories={categories}
        canManageDiscounts
        product={{ idProducto: 5, nombre: 'Gorra', idCategoriaProducto: 2, rangos: [] }}
      />,
    );
    await waitFor(() => expect(notifications.error).toHaveBeenCalledWith('No cargó'));
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(notifications.error).toHaveBeenCalledWith('No se pudo guardar el producto.'));
  });
});
