import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tariffRepository } from '../../tarifas/infrastructure/tariff.repository';
import { ServiceDetailsModal } from './ServiceDetailsModal';

vi.mock('../../tarifas/infrastructure/tariff.repository', () => ({
  tariffRepository: {
    list: vi.fn(),
  },
}));

const service = {
  id: 2,
  nombre: 'DTF',
  descripcion: 'Impresión para prendas.',
  estado: true,
  requiereMedidas: true,
};

const renderModal = (props = {}) => render(
  <ServiceDetailsModal
    isOpen
    service={service}
    onClose={vi.fn()}
    {...props}
  />,
);

describe('ServiceDetailsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays dimensional prices for the selected service', async () => {
    tariffRepository.list.mockResolvedValue({
      items: [{
        idTarifa: 11,
        nombre: 'Punto corazón',
        anchoHastaCm: 10,
        altoHastaCm: 10,
        precioUnitario: 10000,
        esGeneral: false,
        estado: true,
      }],
    });

    renderModal();

    expect(screen.getByText('Cargando precios configurados...')).toBeInTheDocument();
    expect(await screen.findByText('Punto corazón')).toBeInTheDocument();
    expect(screen.getByText('10 × 10 cm')).toBeInTheDocument();
    expect(screen.getByText(/10\.000/)).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(tariffRepository.list).toHaveBeenCalledWith({
      idTecnica: 2,
      page: 1,
      limit: 100,
    }, { signal: expect.any(AbortSignal) });
  });

  it('displays a general price without empty dimensions', async () => {
    tariffRepository.list.mockResolvedValue({
      items: [{
        idTarifa: 12,
        nombre: '',
        anchoHastaCm: null,
        altoHastaCm: null,
        precioUnitario: 7000,
        esGeneral: true,
        estado: false,
      }],
    });

    renderModal({ service: { ...service, requiereMedidas: false } });

    expect(await screen.findByText('Tarifa general')).toBeInTheDocument();
    expect(screen.getByText(/7\.000/)).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
    expect(screen.queryByText('Dimensiones no especificadas')).not.toBeInTheDocument();
  });

  it('shows the empty state when the service has no configured prices', async () => {
    tariffRepository.list.mockResolvedValue({ items: [] });

    renderModal();

    expect(await screen.findByText('No hay precios configurados para este servicio.'))
      .toBeInTheDocument();
    expect(screen.queryByText(/undefined|null|prisma/i)).not.toBeInTheDocument();
  });

  it('shows a human error and retries the request', async () => {
    tariffRepository.list
      .mockRejectedValueOnce(new Error('Prisma validation failed'))
      .mockResolvedValueOnce({
        items: [{
          idTarifa: 13,
          nombre: 'Carta',
          anchoHastaCm: 22,
          altoHastaCm: 28,
          precioUnitario: 18000,
          estado: true,
        }],
      });

    renderModal();

    expect(await screen.findByText('No pudimos cargar los precios configurados.'))
      .toBeInTheDocument();
    expect(screen.queryByText(/Prisma validation failed/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Carta')).toBeInTheDocument();
    await waitFor(() => expect(tariffRepository.list).toHaveBeenCalledTimes(2));
  });
});
