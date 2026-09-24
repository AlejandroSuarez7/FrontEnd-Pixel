import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PedidosPage from './PedidosPage';

const mocks = vi.hoisted(() => ({ permissions: new Set() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../../store/AuthContext', () => ({
  useAuth: () => ({
    user: { rol: { nombre: 'Admin' } },
    hasPermission: (code) => mocks.permissions.has(code),
  }),
}));
vi.mock('../../../shared/components/ConfirmDialog/ConfirmContext', () => ({ useConfirm: () => vi.fn() }));
vi.mock('../pedidos/application/usePedidos', () => ({
  usePedidos: () => ({
    pedidos: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
    handlePendienteSaldo: vi.fn(),
    handleFinalizar: vi.fn(),
    handleAnular: vi.fn(),
    handleConfirmarEntrega: vi.fn(),
    handleActualizarRequiereDiseno: vi.fn(),
    paginationMeta: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
  }),
}));
vi.mock('../pedidos/presentation/PedidoDetailsModal', () => ({ PedidoDetailsModal: () => null }));

describe('PedidosPage report access', () => {
  beforeEach(() => mocks.permissions.clear());

  it('muestra Generar reporte únicamente con pedidos.ver', () => {
    const { rerender } = render(<PedidosPage />);
    expect(screen.queryByRole('button', { name: 'Generar reporte' })).not.toBeInTheDocument();

    mocks.permissions.add('pedidos.ver');
    rerender(<PedidosPage />);
    expect(screen.getByRole('button', { name: 'Generar reporte' }))
      .toHaveClass('report-trigger-button');
  });
});
