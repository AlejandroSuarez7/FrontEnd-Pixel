import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../core/utils/notifications';
import QuotesPage from './QuotesPage';

const mocks = vi.hoisted(() => ({
  handleCreate: vi.fn(),
  sendProposal: vi.fn(),
}));

vi.mock('../../../store/AuthContext', () => ({
  useAuth: () => ({
    user: { rol: { nombre: 'Admin' } },
    permissions: ['cotizaciones.crear_presencial', 'cotizaciones.propuesta.enviar'],
    hasPermission: () => true,
  }),
}));

vi.mock('../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({ useConfirm: () => vi.fn() }));
vi.mock('../../../core/utils/notifications', () => ({
  notifications: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));
vi.mock('../cotizaciones/application/useQuotes', () => ({
  useQuotes: () => ({
    quotes: [], loading: false, error: null, refetch: vi.fn(),
    handleCreate: mocks.handleCreate, updateRequest: vi.fn(), handleCancel: vi.fn(),
    handleHardDelete: vi.fn(), sendProposal: mocks.sendProposal,
    respondAsClient: vi.fn(), respondAsStaff: vi.fn(),
    paginationMeta: { page: 1, limit: 10, total: 0, totalPages: 1 },
  }),
}));
vi.mock('../cotizaciones/presentation/QuoteFormModal', () => ({
  QuoteFormModal: ({ onSubmit }) => (
    <button type="button" onClick={() => onSubmit({
      items: [{ idProducto: 1, cantidad: 2 }],
      immediateProposal: { enabled: true, payload: { precioFinal: 850000 } },
    })}>
      Simular creacion presencial
    </button>
  ),
}));

describe('QuotesPage immediate proposal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.handleCreate.mockResolvedValue({ idCotizacion: 44 });
    mocks.sendProposal.mockResolvedValue({});
  });

  it('creates the quote first and sends the proposal with its real id', async () => {
    render(<QuotesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Nueva cotizacion presencial' }));
    fireEvent.click(screen.getByRole('button', { name: 'Simular creacion presencial' }));

    await waitFor(() => expect(mocks.sendProposal).toHaveBeenCalledWith(44, { precioFinal: 850000 }));
    expect(mocks.handleCreate).toHaveBeenCalledWith({ items: [{ idProducto: 1, cantidad: 2 }] }, true);
  });

  it('keeps the created quote when the proposal request fails', async () => {
    mocks.sendProposal.mockRejectedValue(new Error('Network Error'));
    render(<QuotesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Nueva cotizacion presencial' }));
    fireEvent.click(screen.getByRole('button', { name: 'Simular creacion presencial' }));

    await waitFor(() => expect(notifications.warning).toHaveBeenCalledWith(
      'La solicitud fue creada, pero no pudimos enviar la propuesta. Puedes retomarla desde Gestion de Cotizaciones.',
    ));
    expect(mocks.handleCreate).toHaveBeenCalledTimes(1);
  });
});
