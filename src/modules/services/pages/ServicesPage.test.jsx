import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ServicesPage from './ServicesPage';

vi.mock('../../../store/AuthContext', () => ({
  useAuth: () => ({
    hasAnyPermission: () => false,
    hasPermission: () => true,
  }),
}));

vi.mock('../tecnicas/application/useTecnicas', () => ({
  useTecnicas: () => ({
    tecnicas: [],
    loading: false,
    error: null,
    handleCreate: vi.fn(),
    handleUpdate: vi.fn(),
    handleHardDelete: vi.fn(),
    paginationMeta: {
      total: 0,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    refreshTecnicas: vi.fn(),
  }),
}));

describe('ServicesPage visible copy', () => {
  it('uses technique terminology throughout the catalog page', () => {
    const { container } = render(<ServicesPage />);

    expect(screen.getByText('Catálogo / Técnicas')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gestión de Técnicas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nueva técnica' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar técnica por nombre o descripción...')).toBeInTheDocument();
    expect(screen.getByText('No se encontraron técnicas registradas.')).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/gestión de servicios/i);
  });
});
