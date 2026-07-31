import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../../core/utils/notifications';
import { publicQuoteRepository } from '../../../landing/infrastructure/publicQuote.repository';
import { clientRepository } from '../../../users/infrastructure/client.repository';
import { QuoteFormModal } from './QuoteFormModal';

vi.mock('../../../../core/hooks/useDebounce', () => ({
  useDebounce: (value) => value,
}));

vi.mock('../../../../core/utils/notifications', () => ({
  notifications: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('../../../landing/infrastructure/publicQuote.repository', () => ({
  publicQuoteRepository: {
    listCategories: vi.fn(),
    listProducts: vi.fn(),
    listTechniques: vi.fn(),
  },
}));

vi.mock('../../../users/infrastructure/client.repository', () => ({
  clientRepository: {
    list: vi.fn(),
  },
}));

const catalogs = {
  categories: [{ idCategoriaProducto: 3, nombre: 'Textiles' }],
  products: [{ idProducto: 11, idCategoriaProducto: 3, nombre: 'Camiseta clasica' }],
  techniques: [
    { idTecnica: 2, nombre: 'DTF', estado: true, requiereMedidas: true },
    { idTecnica: 4, nombre: 'Bordado', estado: true, requiereMedidas: false },
  ],
};

const renderModal = (props = {}) => render(
  <QuoteFormModal
    isOpen
    isStaff
    onClose={vi.fn()}
    onSubmit={vi.fn().mockResolvedValue({})}
    {...props}
  />,
);

const completeWalkInClient = async (user) => {
  await user.type(screen.getByLabelText('Nombre completo *'), 'Cliente presencial');
  await user.type(screen.getByLabelText('Telefono *'), '3001234567');
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
  await screen.findByText('Productos');
};

const selectCatalogProduct = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Producto del catalogo' }));
  fireEvent.change(screen.getByLabelText('Producto *'), { target: { value: '11' } });
};

const goToReview = async (user) => {
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
  await screen.findByText('Confirma la informacion antes de crear la solicitud');
};

describe('QuoteFormModal presencial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    publicQuoteRepository.listCategories.mockResolvedValue(catalogs.categories);
    publicQuoteRepository.listProducts.mockResolvedValue(catalogs.products);
    publicQuoteRepository.listTechniques.mockResolvedValue(catalogs.techniques);
    clientRepository.list.mockResolvedValue({ items: [] });
  });

  it('organiza la solicitud en tres pasos y registra una atencion sin portal', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({});
    renderModal({ onSubmit });

    expect(screen.getByRole('navigation', { name: 'Pasos de la solicitud' })).toBeInTheDocument();
    expect(screen.getByText('Registrar cotizacion sin acceso al portal')).toBeInTheDocument();
    expect(screen.getByText(/No se creara un Usuario/i)).toBeInTheDocument();

    await completeWalkInClient(user);
    selectCatalogProduct();
    await goToReview(user);

    expect(screen.getByText('Precio pendiente de confirmacion')).toBeInTheDocument();
    expect(screen.queryByText(/^Subtotal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$\s*\d/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Crear solicitud' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      cliente: {
        nombre: 'Cliente presencial',
        correo: null,
        telefono: '3001234567',
      },
      items: [{
        idProducto: '11',
        cantidad: 1,
        suministradoPor: 'PIXEL',
        estampados: [{ idTecnica: '' }],
      }],
    });
  });

  it('busca y envia el id de un cliente existente sin duplicar sus datos', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({});
    clientRepository.list.mockResolvedValue({
      items: [{
        idCliente: 81,
        nombre: 'Cliente registrado',
        documento: '100200300',
        correo: 'cliente@pixel.com',
        telefono: '3012223344',
      }],
    });
    renderModal({ onSubmit });

    await user.click(screen.getByRole('button', { name: 'Buscar cliente existente' }));
    await user.type(screen.getByPlaceholderText('Buscar cliente...'), 'Cliente');
    await user.click(await screen.findByRole('button', { name: /Cliente registrado/i }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    selectCatalogProduct();
    await goToReview(user);
    await user.click(screen.getByRole('button', { name: 'Crear solicitud' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ idCliente: 81 });
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('cliente');
  });

  it('permite un producto especial sin estampados para revision manual', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({});
    renderModal({ onSubmit });

    await completeWalkInClient(user);
    await user.click(screen.getByRole('button', { name: 'Otro producto' }));
    await user.type(screen.getByLabelText('Nombre del producto *'), 'Bolso artesanal');
    await user.click(screen.getByRole('button', { name: 'Quitar' }));
    await goToReview(user);

    expect(screen.getByText(/Producto especial sin estampados definidos/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Crear solicitud' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].items[0]).toMatchObject({
      tipoProducto: 'OTRO',
      nombrePersonalizado: 'Bolso artesanal',
      estampados: [],
    });
  });

  it('comparte de forma estable un diseno entre estampados sin mostrar ids tecnicos', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({});
    renderModal({ onSubmit });

    await completeWalkInClient(user);
    selectCatalogProduct();
    await user.click(screen.getByRole('button', { name: 'Agregar estampado' }));
    await user.click(screen.getByLabelText(/Usar el mismo diseno en todos/i));
    await goToReview(user);
    await user.click(screen.getByRole('button', { name: 'Crear solicitud' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const stamps = onSubmit.mock.calls[0][0].items[0].estampados;
    expect(stamps).toHaveLength(2);
    expect(stamps[0].grupoDisenoCompartido).toBeTruthy();
    expect(stamps[1].grupoDisenoCompartido).toBe(stamps[0].grupoDisenoCompartido);
    expect(screen.queryByText(/GRUPO-DISENO/i)).not.toBeInTheDocument();
  });

  it('evita el doble envio y conserva el modal cuando guardar falla', async () => {
    const user = userEvent.setup();
    let rejectRequest;
    const onSubmit = vi.fn(() => new Promise((resolve, reject) => {
      rejectRequest = reject;
    }));
    renderModal({ onSubmit });

    await completeWalkInClient(user);
    selectCatalogProduct();
    await goToReview(user);
    const submit = screen.getByRole('button', { name: 'Crear solicitud' });
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    rejectRequest(new Error('No fue posible guardar'));
    await waitFor(() => expect(notifications.error).toHaveBeenCalledWith('No fue posible guardar'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear solicitud' })).toBeEnabled();
  });
});
