import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../../core/utils/notifications';
import { useProductionQueue } from '../application/useProductionQueue';
import { ProductionQueuePage } from './ProductionQueuePage';

const authState = vi.hoisted(() => ({ role: 'Admin', allowed: true }));

vi.mock('../../../../store/AuthContext', () => ({
  useAuth: () => ({
    user: { rol: { nombre: authState.role } },
    hasPermission: () => authState.allowed,
  }),
}));
vi.mock('../application/useProductionQueue', () => ({ useProductionQueue: vi.fn() }));
vi.mock('../../../../core/utils/notifications', () => ({
  notifications: { success: vi.fn(), error: vi.fn() },
}));

const queueItems = [
  {
    idPedido: 1,
    cliente: { nombre: 'Ana', correo: 'ana@example.com' },
    fechaIngresoProduccion: '2026-01-01',
    fechaEntregaEstimada: '2026-01-10',
    total: 100000,
    saldoPendiente: 0,
  },
  {
    idPedido: 2,
    cliente: null,
    fechaActualizacion: '2026-01-02',
    total: null,
    saldoPendiente: 20000,
  },
];

const setQueueState = (overrides = {}) => {
  useProductionQueue.mockReturnValue({
    pedidos: queueItems,
    loading: false,
    error: null,
    refetch: vi.fn(),
    saveOrder: vi.fn().mockResolvedValue(undefined),
    savingOrder: false,
    ...overrides,
  });
};

describe('ProductionQueuePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.role = 'Admin';
    authState.allowed = true;
    setQueueState();
  });

  it('shows loading, error retry and empty states', async () => {
    const refetch = vi.fn();
    setQueueState({ pedidos: [], loading: true, refetch });
    const { rerender } = render(<ProductionQueuePage />);
    expect(screen.getByText('Cargando cola de producción...')).toBeInTheDocument();

    setQueueState({ pedidos: [], error: new Error('Sin red'), refetch });
    rerender(<ProductionQueuePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(refetch).toHaveBeenCalled();

    setQueueState({ pedidos: [], error: null });
    rerender(<ProductionQueuePage />);
    expect(screen.getByText('No hay pedidos en proceso actualmente.')).toBeInTheDocument();
  });

  it('renders the queue and saves a reordered draft', async () => {
    const user = userEvent.setup();
    const saveOrder = vi.fn().mockResolvedValue(undefined);
    setQueueState({ saveOrder });
    render(<ProductionQueuePage />);

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Cliente no especificado')).toBeInTheDocument();
    expect(screen.getByText('1', { selector: 'span' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cambiar posición' }));

    const rows = screen.getAllByRole('row').slice(1);
    fireEvent.dragStart(rows[0]);
    fireEvent.dragOver(rows[1]);
    fireEvent.drop(rows[1]);
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(saveOrder).toHaveBeenCalledWith([
      expect.objectContaining({ idPedido: 2 }),
      expect.objectContaining({ idPedido: 1 }),
    ]));
    expect(notifications.success).toHaveBeenCalled();
  });

  it('cancels editing and handles no-op drops', async () => {
    const user = userEvent.setup();
    render(<ProductionQueuePage />);
    await user.click(screen.getByRole('button', { name: 'Cambiar posición' }));
    const rows = screen.getAllByRole('row').slice(1);
    fireEvent.drop(rows[0]);
    fireEvent.dragStart(rows[0]);
    fireEvent.drop(rows[0]);
    fireEvent.dragEnd(rows[0]);
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: 'Cambiar posición' })).toBeInTheDocument();
  });

  it('reports save failures and hides editing controls from clients', async () => {
    const user = userEvent.setup();
    setQueueState({ saveOrder: vi.fn().mockRejectedValue(new Error('No guardó')) });
    const { rerender } = render(<ProductionQueuePage />);
    await user.click(screen.getByRole('button', { name: 'Cambiar posición' }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(notifications.error).toHaveBeenCalledWith('No guardó'));

    authState.role = 'Cliente';
    rerender(<ProductionQueuePage />);
    expect(screen.queryByRole('button', { name: 'Cambiar posición' })).not.toBeInTheDocument();
  });
});
