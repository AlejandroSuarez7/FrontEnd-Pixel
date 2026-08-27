import { StrictMode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { clientRepository } from '../../../users/infrastructure/client.repository';
import { useAbonos } from '../application/useAbonos';
import { AbonosPage } from './AbonosPage';

const refetch = vi.fn();

vi.mock('../../../../store/AuthContext', () => ({
  useAuth: () => ({
    hasPermission: () => true,
    user: { rol: { nombre: 'Admin' } },
  }),
}));

vi.mock('../../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({
  useConfirm: () => vi.fn(),
}));

vi.mock('../application/useAbonos', () => ({
  useAbonos: vi.fn(),
}));

vi.mock('../../../users/infrastructure/client.repository', () => ({
  clientRepository: {
    list: vi.fn(),
    listOrders: vi.fn(),
  },
}));

vi.mock('./AbonoViewModal', () => ({ AbonoViewModal: () => null }));
vi.mock('./ReviewConfirmAbonoModal', () => ({ ReviewConfirmAbonoModal: () => null }));

const hookResult = (overrides = {}) => ({
  abonos: [],
  loading: false,
  refreshing: false,
  error: '',
  paginationMeta: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  refetch,
  handleCreate: vi.fn(),
  handleUpdate: vi.fn(),
  handleReject: vi.fn(),
  handleDelete: vi.fn(),
  getPedido: vi.fn(),
  getAbonosByPedido: vi.fn(),
  getPedidos: vi.fn(),
  ...overrides,
});

const PageRouter = ({ state = null, withNavigationTargets = false }) => (
  <MemoryRouter initialEntries={[{ pathname: '/dashboard/sales/payments', state }]}>
    <Routes>
      <Route
        path="/dashboard/sales/payments"
        element={(
          <>
            {withNavigationTargets && (
              <>
                <Link to="/dashboard/services/quotes">Ir a cotizaciones</Link>
                <Link to="/dashboard/sales/orders">Ir a pedidos</Link>
              </>
            )}
            <AbonosPage />
          </>
        )}
      />
      <Route path="/dashboard/services/quotes" element={<div>Vista de cotizaciones</div>} />
      <Route path="/dashboard/sales/orders" element={<div>Vista de pedidos</div>} />
    </Routes>
  </MemoryRouter>
);

const renderPage = (state = null, withNavigationTargets = false, strictMode = false) => render(
  strictMode ? (
    <StrictMode>
      <PageRouter state={state} withNavigationTargets={withNavigationTargets} />
    </StrictMode>
  ) : (
    <PageRouter state={state} withNavigationTargets={withNavigationTargets} />
  ),
);

describe('AbonosPage navigation and filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('pixel_user', JSON.stringify({ rol: { nombre: 'Admin' } }));
    useAbonos.mockReturnValue(hookResult());
    clientRepository.list.mockResolvedValue({
      items: [
        { idCliente: 4, nombre: 'Cliente A' },
        { idCliente: 9, nombre: 'Cliente B' },
      ],
    });
    clientRepository.listOrders.mockResolvedValue([]);
  });

  it('loads directly without navigation state or filters', async () => {
    renderPage();

    expect(screen.getByText('No hay abonos para los filtros seleccionados.')).toBeInTheDocument();
    expect(useAbonos).toHaveBeenCalledWith(expect.objectContaining({
      page: 1,
      idCliente: '',
      idPedido: '',
    }));
    await waitFor(() => expect(clientRepository.list).toHaveBeenCalledTimes(1));
  });

  it('uses only ids when entering from an order file', async () => {
    clientRepository.listOrders.mockResolvedValueOnce([
      { idPedido: 52, total: 500000, saldoPendiente: 250000 },
    ]);

    renderPage({ idCliente: 4, idPedido: 52 });

    expect(useAbonos).toHaveBeenCalledWith(expect.objectContaining({
      idCliente: '4',
      idPedido: '52',
    }));
    await waitFor(() => expect(clientRepository.listOrders).toHaveBeenCalledWith(
      '4',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    ));
  });

  it('clears the selected order when the client changes', async () => {
    clientRepository.listOrders.mockResolvedValue([
      { idPedido: 52, total: 500000, saldoPendiente: 250000 },
    ]);

    renderPage({ idCliente: 4, idPedido: 52 });
    await waitFor(() => expect(screen.getByRole('option', { name: 'Cliente B' })).toBeInTheDocument());
    expect(screen.getByLabelText('Seleccionar cliente')).toHaveValue('4');

    fireEvent.change(screen.getByLabelText('Seleccionar cliente'), { target: { value: '9' } });

    expect(useAbonos.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({
      idCliente: '9',
      idPedido: '',
      page: 1,
    }));
    await waitFor(() => expect(clientRepository.listOrders).toHaveBeenCalledWith(
      '9',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    ));
    expect(clientRepository.listOrders).toHaveBeenCalledTimes(2);
  });

  it('clears all filters and supports retry after an error', () => {
    useAbonos.mockReturnValue(hookResult({
      error: 'Error interno del servidor',
    }));
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(refetch).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByPlaceholderText('Pedido, cliente o referencia...'), {
      target: { value: 'PX-52' },
    });
    fireEvent.click(screen.getByRole('button', { name: /limpiar filtros/i }));
    expect(screen.getByPlaceholderText('Pedido, cliente o referencia...')).toHaveValue('');
  });

  it('unmounts Gestion de Abonos when the pathname changes', async () => {
    renderPage({ idCliente: 4, idPedido: 52 }, true);

    fireEvent.click(screen.getByRole('link', { name: 'Ir a cotizaciones' }));

    expect(await screen.findByText('Vista de cotizaciones')).toBeInTheDocument();
    expect(screen.queryByText('Gestion de Abonos')).not.toBeInTheDocument();
  });

  it('does not enter an update loop when mounted under StrictMode', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      renderPage(null, false, true);

      await waitFor(() => expect(clientRepository.list).toHaveBeenCalled());
      await new Promise(resolve => window.setTimeout(resolve, 20));

      expect(useAbonos.mock.calls.length).toBeLessThanOrEqual(8);
      expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(/Maximum update depth exceeded/i);
    } finally {
      consoleError.mockRestore();
    }
  });

  it('unmounts Gestion de Abonos when navigating to orders', async () => {
    renderPage(null, true);

    fireEvent.click(screen.getByRole('link', { name: 'Ir a pedidos' }));

    expect(await screen.findByText('Vista de pedidos')).toBeInTheDocument();
    expect(screen.queryByText('Gestion de Abonos')).not.toBeInTheDocument();
  });

  it('resolves a preloaded order once under StrictMode without looping filters', async () => {
    const getPedido = vi.fn().mockResolvedValue({
      idPedido: 52,
      idCliente: 4,
      cliente: { idCliente: 4, nombre: 'Cliente A' },
    });
    useAbonos.mockReturnValue(hookResult({ getPedido }));

    renderPage({ idPedido: 52 }, false, true);

    await waitFor(() => expect(screen.getByLabelText('Seleccionar cliente')).toHaveValue('4'));
    expect(useAbonos.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({
      idCliente: '4',
      idPedido: '52',
    }));
    expect(getPedido.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('opens and closes the real payment modal under StrictMode without an update loop', async () => {
    const getPedidos = vi.fn().mockResolvedValue([]);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    useAbonos.mockReturnValue(hookResult({ getPedidos }));

    try {
      renderPage(null, false, true);

      fireEvent.click(screen.getByRole('button', { name: 'Nuevo abono' }));
      expect(await screen.findByRole('heading', { name: 'Registrar abono' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'x' }));

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Registrar abono' })).not.toBeInTheDocument();
      });
      expect(getPedidos.mock.calls.length).toBeLessThanOrEqual(2);
      expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(/Maximum update depth exceeded/i);
    } finally {
      consoleError.mockRestore();
    }
  });
});
