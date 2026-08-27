import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VentasPage } from './VentasPage';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
}));
vi.mock('../../../../store/AuthContext', () => ({
  useAuth: () => ({ hasPermission: permission => permission === 'pedidos.ver' }),
}));
vi.mock('../../../users/infrastructure/user.repository', () => ({
  UserApiRepository: class {
    list() { return Promise.resolve([]); }
  },
}));
vi.mock('../application/useVentas', () => ({
  useVentas: () => ({
    ventas: [{
      idPedido: 36,
      idCliente: 8,
      nombreCliente: 'Cliente PIXEL',
      total: 850000,
      totalPagado: 850000,
      saldoPendiente: 0,
      estado: 'COMPLETA',
      estadoPago: 'COMPLETO',
      fechaPrimerPago: '2026-08-20T10:00:00.000Z',
      tecnicas: [],
      cantidadTotalProductos: 2,
    }],
    resumen: {}, loading: false, error: null, refetch: vi.fn(),
  }),
}));

describe('VentasPage historical order access', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses human date labels and opens the existing expediente in read-only mode', () => {
    render(<VentasPage />);

    expect(screen.getByText('Desde')).toBeInTheDocument();
    expect(screen.getByText('Hasta')).toBeInTheDocument();
    expect(screen.getByText('Filtra las ventas segun la fecha de su primer pago.')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Acciones'));
    fireEvent.click(screen.getByRole('button', { name: 'Ver expediente' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/dashboard/orders/36/expediente?mode=readonly&from=sales');
  });
});
