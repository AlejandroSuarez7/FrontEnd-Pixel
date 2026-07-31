import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PublicQuotePage from './PublicQuotePage';
import { publicQuoteRepository } from '../infrastructure/publicQuote.repository';

const {
  navigateMock,
  confirmMock,
  notificationsMock,
  authState,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  confirmMock: vi.fn(),
  notificationsMock: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
  authState: {
    user: null,
    permissions: [],
    logout: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useLocation: () => ({ search: window.location.search }),
  useNavigate: () => navigateMock,
}));

vi.mock('../../../store/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({
  useConfirm: () => confirmMock,
}));

vi.mock('../../../core/utils/notifications', () => ({
  notifications: notificationsMock,
}));

vi.mock('../infrastructure/publicQuote.repository', () => ({
  publicQuoteRepository: {
    listCategories: vi.fn(),
    listTechniques: vi.fn(),
    listProducts: vi.fn(),
    calculate: vi.fn(),
    create: vi.fn(),
    getClientQuote: vi.fn(),
    updateClientQuote: vi.fn(),
  },
}));

const catalogProduct = {
  idProducto: 10,
  idCategoriaProducto: 1,
  nombre: 'Camiseta',
  descripcion: 'Camiseta pública',
  requiereDiseno: true,
  categoriaProducto: { idCategoriaProducto: 1, nombre: 'Textiles' },
};

const fillContact = async (user) => {
  await user.type(screen.getByLabelText(/nombre completo/i), 'Cliente Pixel');
  await user.type(screen.getByLabelText(/^correo/i), 'cliente@pixel.com');
  await user.type(screen.getByLabelText(/teléfono/i), '3001234567');
};

const configureCatalogProduct = async (user, { quantity = '12' } = {}) => {
  await user.selectOptions(screen.getByLabelText(/producto \*/i), '10');
  fireEvent.change(screen.getByLabelText(/cantidad \*/i), { target: { value: quantity } });
  await user.selectOptions(screen.getByLabelText(/técnica estampado 1/i), '2');
  fireEvent.change(screen.getByLabelText(/ancho/i), { target: { value: '10' } });
  fireEvent.change(screen.getByLabelText(/alto/i), { target: { value: '12' } });
};

describe('PublicQuotePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.history.replaceState({}, '', '/cotizar');
    window.scrollTo = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
    authState.user = null;
    authState.permissions = [];
    authState.loading = false;
    authState.logout = vi.fn();
    publicQuoteRepository.listCategories.mockResolvedValue([
      { idCategoriaProducto: 1, nombre: 'Textiles' },
    ]);
    publicQuoteRepository.listTechniques.mockResolvedValue([
      { idTecnica: 2, nombre: 'DTF', requiereMedidas: true },
      { idTecnica: 3, nombre: 'Bordado', requiereMedidas: false },
    ]);
    publicQuoteRepository.listProducts.mockResolvedValue([catalogProduct]);
    publicQuoteRepository.calculate.mockResolvedValue({
      estado: 'EN_REVISION',
      estadoPrecio: 'PENDIENTE_CONFIRMACION',
      requiereRevisionManual: false,
    });
    publicQuoteRepository.create.mockResolvedValue({
      data: { cotizacion: { idCotizacion: 101, estado: 'EN_REVISION' } },
    });
    publicQuoteRepository.updateClientQuote.mockResolvedValue({
      idCotizacion: 42,
      estado: 'EN_REVISION',
    });
    confirmMock.mockResolvedValue(true);
  });

  it('renders the desktop workbench with two panels and no fake product or prices', async () => {
    render(<PublicQuotePage />);

    expect(await screen.findByRole('heading', { name: /cuéntanos qué quieres estampar/i })).toBeInTheDocument();
    expect(screen.getByTestId('public-quote-builder')).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: /0 productos agregados/i })).toBeInTheDocument();
    expect(screen.getByText(/agrega el primer producto para comenzar/i)).toBeInTheDocument();
    expect(screen.queryByText(/producto sin seleccionar/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continuar/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/precio unitario|total estimado|descuento/i)).not.toBeInTheDocument();
    expect(screen.getByText(/precio pendiente de confirmación/i)).toBeInTheDocument();
  });

  it('submits the exact catalog contract without local or price fields', async () => {
    const user = userEvent.setup();
    render(<PublicQuotePage />);

    await screen.findByRole('heading', { name: /configura un producto/i });
    await fillContact(user);
    await configureCatalogProduct(user);
    await user.click(screen.getByRole('button', { name: /añadir a la cotización/i }));
    expect(await screen.findByRole('heading', { name: /1 producto agregado/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /enviar solicitud de cotización/i }));
    await waitFor(() => expect(publicQuoteRepository.create).toHaveBeenCalledTimes(1));

    expect(publicQuoteRepository.calculate).toHaveBeenCalledWith({
      items: [expect.objectContaining({
        tipoProducto: 'CATALOGO',
        idProducto: 10,
        cantidad: 12,
        suministradoPor: 'PIXEL',
        requiereDiseno: true,
        estampados: [expect.objectContaining({
          idTecnica: 2,
          ubicacion: 'FRENTE',
          anchoCm: 10,
          altoCm: 12,
        })],
      })],
      observaciones: null,
    });

    const payload = publicQuoteRepository.create.mock.calls[0][0];
    expect(payload.cliente).toEqual({
      nombre: 'Cliente Pixel',
      correo: 'cliente@pixel.com',
      telefono: '3001234567',
    });
    expect(payload.items[0]).toMatchObject({
      tipoProducto: 'CATALOGO',
      idProducto: 10,
      cantidad: 12,
      suministradoPor: 'PIXEL',
    });
    expect(JSON.stringify(payload)).not.toMatch(/localId|precioBase|subtotal|descuento/);
  });

  it('allows an OTRO product without stamps and omits idProducto', async () => {
    const user = userEvent.setup();
    render(<PublicQuotePage />);

    await screen.findByRole('heading', { name: /configura un producto/i });
    await fillContact(user);
    await user.click(screen.getByRole('button', { name: /^otro producto$/i }));
    await user.type(
      screen.getByLabelText(/qué producto quieres estampar/i),
      'Bolso artesanal',
    );
    await user.selectOptions(
      screen.getByLabelText(/quién suministra el producto/i),
      'CLIENTE',
    );
    await user.click(screen.getByRole('button', { name: /^eliminar$/i }));
    expect(screen.getByText(/sin estampados configurados/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /añadir a la cotización/i }));
    await user.click(screen.getByRole('button', { name: /enviar solicitud de cotización/i }));

    await waitFor(() => expect(publicQuoteRepository.create).toHaveBeenCalledTimes(1));
    const item = publicQuoteRepository.create.mock.calls[0][0].items[0];
    expect(item).toMatchObject({
      tipoProducto: 'OTRO',
      nombrePersonalizado: 'Bolso artesanal',
      suministradoPor: 'CLIENTE',
      estampados: [],
    });
    expect(item).not.toHaveProperty('idProducto');
  });

  it('allows the client to leave the service and dimensions pending', async () => {
    const user = userEvent.setup();
    render(<PublicQuotePage />);

    await screen.findByRole('heading', { name: /configura un producto/i });
    await fillContact(user);
    await user.selectOptions(screen.getByLabelText(/producto \*/i), '10');
    await user.click(screen.getByRole('button', { name: /añadir a la cotización/i }));
    expect(screen.getByText('Servicio y medidas por definir')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /enviar solicitud de cotización/i }));

    await waitFor(() => expect(publicQuoteRepository.create).toHaveBeenCalledTimes(1));
    const stamp = publicQuoteRepository.create.mock.calls[0][0].items[0].estampados[0];
    expect(stamp.idTecnica).toBeNull();
    expect(stamp).not.toHaveProperty('anchoCm');
    expect(stamp).not.toHaveProperty('altoCm');
    expect(screen.queryByText(/crear grupo|grupo de diseño|grupoDisenoCompartido/i))
      .not.toBeInTheDocument();
  });

  it('clears optional dimensions without clearing the selected technique', async () => {
    const user = userEvent.setup();
    render(<PublicQuotePage />);

    await screen.findByRole('heading', { name: /configura un producto/i });
    await fillContact(user);
    await configureCatalogProduct(user);
    await user.click(screen.getByRole('checkbox', { name: /no conozco las medidas/i }));
    await user.click(screen.getByRole('button', { name: /añadir a la cotización/i }));
    expect(screen.getByText('DTF · Frente · Medidas por definir')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /enviar solicitud de cotización/i }));

    await waitFor(() => expect(publicQuoteRepository.create).toHaveBeenCalledTimes(1));
    const stamp = publicQuoteRepository.create.mock.calls[0][0].items[0].estampados[0];
    expect(stamp.idTecnica).toBe(2);
    expect(stamp).not.toHaveProperty('anchoCm');
    expect(stamp).not.toHaveProperty('altoCm');
  });

  it('shares a design through a human reference while keeping the internal group stable', async () => {
    const user = userEvent.setup();
    render(<PublicQuotePage />);

    await screen.findByRole('heading', { name: /configura un producto/i });
    await fillContact(user);
    await user.selectOptions(screen.getByLabelText(/producto \*/i), '10');
    await user.click(screen.getByRole('button', { name: /agregar estampado/i }));
    await user.selectOptions(
      screen.getByLabelText(/qué diseño utilizarás/i),
      screen.getByRole('option', { name: /mismo diseño de producto 1/i }),
    );
    await user.click(screen.getByRole('button', { name: /añadir a la cotización/i }));
    await user.click(screen.getByRole('button', { name: /enviar solicitud de cotización/i }));

    await waitFor(() => expect(publicQuoteRepository.create).toHaveBeenCalledTimes(1));
    const stamps = publicQuoteRepository.create.mock.calls[0][0].items[0].estampados;
    expect(stamps[0].grupoDisenoCompartido).toBeTruthy();
    expect(stamps[1].grupoDisenoCompartido).toBe(stamps[0].grupoDisenoCompartido);
  });

  it('edits an item in place instead of duplicating it', async () => {
    const user = userEvent.setup();
    render(<PublicQuotePage />);

    await screen.findByRole('heading', { name: /configura un producto/i });
    await configureCatalogProduct(user);
    await user.click(screen.getByRole('button', { name: /añadir a la cotización/i }));

    const summary = screen.getByRole('complementary');
    await user.click(within(summary).getByRole('button', { name: /editar/i }));
    expect(screen.getByText(/editando producto 1/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/cantidad \*/i), { target: { value: '24' } });
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(screen.getByRole('heading', { name: /1 producto agregado/i })).toBeInTheDocument();
    expect(within(summary).getByText('24')).toBeInTheDocument();
  });

  it('keeps the local summary when public validation requests manual review', async () => {
    const user = userEvent.setup();
    publicQuoteRepository.calculate.mockResolvedValue({
      total: 999999,
      precioSugerido: 888888,
      items: [],
      requiereRevisionManual: true,
    });
    render(<PublicQuotePage />);

    await screen.findByRole('heading', { name: /configura un producto/i });
    await fillContact(user);
    await configureCatalogProduct(user);
    await user.click(screen.getByRole('button', { name: /añadir a la cotización/i }));
    await user.click(screen.getByRole('button', { name: /enviar solicitud de cotización/i }));

    await waitFor(() => expect(publicQuoteRepository.create).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('$ 999.999')).not.toBeInTheDocument();
    expect(screen.queryByText(/precio sugerido/i)).not.toBeInTheDocument();
    expect(notificationsMock.success).toHaveBeenCalled();
  });

  it('uses the client edit endpoint and keeps account data readonly', async () => {
    authState.user = {
      idUsuario: 7,
      correo: 'cliente@pixel.com',
      rol: { nombre: 'Cliente' },
      cliente: {
        idCliente: 9,
        nombre: 'Cliente existente',
        correo: 'cliente@pixel.com',
        telefono: '3001234567',
      },
    };
    authState.permissions = ['dashboard.cliente'];
    window.history.replaceState({}, '', '/cotizar?editar=42');
    publicQuoteRepository.getClientQuote.mockResolvedValue({
      idCotizacion: 42,
      estado: 'EN_REVISION',
      observaciones: 'Conservar',
      cliente: authState.user.cliente,
      detalles: [{
        tipoProducto: 'CATALOGO',
        idProducto: 10,
        cantidad: 12,
        suministradoPor: 'PIXEL',
        requiereDiseno: true,
        origenDiseno: 'PIXEL',
        esDisenoGeneral: true,
        producto: catalogProduct,
        estampados: [{
          idTecnica: 2,
          ubicacion: 'FRENTE',
          anchoCm: 10,
          altoCm: 12,
          origenDiseno: 'PIXEL',
        }],
      }],
    });

    const user = userEvent.setup();
    render(<PublicQuotePage />);

    expect(await screen.findByRole('heading', { name: /1 producto agregado/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre completo/i)).toHaveAttribute('readonly');
    await user.click(screen.getByRole('button', { name: /enviar solicitud de cotización/i }));
    await waitFor(() => expect(publicQuoteRepository.updateClientQuote).toHaveBeenCalledTimes(1));
    expect(publicQuoteRepository.updateClientQuote).toHaveBeenCalledWith(42, {
      items: expect.any(Array),
      observaciones: 'Conservar',
    });
    expect(publicQuoteRepository.create).not.toHaveBeenCalled();
  });

  it('blocks structural editing after a client proposal exists', async () => {
    authState.user = {
      idUsuario: 7,
      correo: 'cliente@pixel.com',
      rol: { nombre: 'Cliente' },
      cliente: {
        idCliente: 9,
        nombre: 'Cliente existente',
        correo: 'cliente@pixel.com',
        telefono: '3001234567',
      },
    };
    authState.permissions = ['dashboard.cliente'];
    window.history.replaceState({}, '', '/cotizar?editar=42');
    publicQuoteRepository.getClientQuote.mockResolvedValue({
      idCotizacion: 42,
      estado: 'PENDIENTE_APROBACION_CLIENTE',
      cliente: authState.user.cliente,
      detalles: [],
    });

    render(<PublicQuotePage />);
    expect(await screen.findByText(/ya tiene una propuesta/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar solicitud de cotización/i })).toBeDisabled();
  });

  it('prevents a rapid double submit from creating two requests', async () => {
    let resolveCreate;
    publicQuoteRepository.create.mockImplementation(() => (
      new Promise((resolve) => {
        resolveCreate = resolve;
      })
    ));
    const user = userEvent.setup();
    render(<PublicQuotePage />);

    await screen.findByRole('heading', { name: /configura un producto/i });
    await fillContact(user);
    await configureCatalogProduct(user);
    await user.click(screen.getByRole('button', { name: /añadir a la cotización/i }));
    const submit = screen.getByRole('button', { name: /enviar solicitud de cotización/i });
    await user.dblClick(submit);

    await waitFor(() => expect(publicQuoteRepository.create).toHaveBeenCalledTimes(1));
    resolveCreate({ data: { cotizacion: { idCotizacion: 101 } } });
    await screen.findByText(/solicitud #101/i);
  });
});
