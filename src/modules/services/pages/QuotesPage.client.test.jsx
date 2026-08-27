import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import QuotesPage from './QuotesPage';

vi.mock('../../../store/AuthContext', () => ({
  useAuth: () => ({
    user: { rol: { nombre: 'Cliente' } },
    permissions: ['cotizaciones.cliente.ver'],
    hasPermission: () => true,
  }),
}));

vi.mock('../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({
  useConfirm: () => vi.fn(),
}));

vi.mock('../cotizaciones/application/useQuotes', () => ({
  useQuotes: () => ({
    quotes: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
    handleCreate: vi.fn(),
    updateRequest: vi.fn(),
    handleCancel: vi.fn(),
    handleHardDelete: vi.fn(),
    sendProposal: vi.fn(),
    respondAsClient: vi.fn(),
    respondAsStaff: vi.fn(),
    paginationMeta: { page: 1, totalPages: 1, totalItems: 0 },
  }),
}));

describe('QuotesPage client actions', () => {
  it('does not duplicate the create quote access with a Nueva solicitud button', () => {
    render(<QuotesPage />);

    expect(screen.getByRole('heading', { name: 'Mis cotizaciones' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nueva solicitud' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Nueva solicitud' })).not.toBeInTheDocument();
  });
});
