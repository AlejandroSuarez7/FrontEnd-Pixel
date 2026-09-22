import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuoteVersionsModal } from './QuoteVersionsModal';

const mocks = vi.hoisted(() => ({ listVersions: vi.fn() }));

vi.mock('../infrastructure/quote.repository', () => ({
  QuoteApiRepository: class {
    listVersions(...args) { return mocks.listVersions(...args); }
  },
}));

describe('QuoteVersionsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listVersions.mockResolvedValue([]);
  });

  it('stays hidden and skips requests when closed or missing a quote', () => {
    const { container, rerender } = render(<QuoteVersionsModal open={false} quote={{ idCotizacion: 1 }} />);
    expect(container).toBeEmptyDOMElement();
    expect(mocks.listVersions).not.toHaveBeenCalled();
    rerender(<QuoteVersionsModal open quote={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows loading and then an empty history', async () => {
    render(<QuoteVersionsModal open quote={{ idCotizacion: 8 }} onClose={vi.fn()} />);
    expect(screen.getByText('Cargando propuestas...')).toBeInTheDocument();
    expect(await screen.findByText(/aún no tiene propuestas/i)).toBeInTheDocument();
    expect(mocks.listVersions).toHaveBeenCalledWith(8, { signal: expect.any(AbortSignal) });
  });

  it('renders current and historical proposals with response metadata', async () => {
    mocks.listVersions.mockResolvedValueOnce([
      {
        idVersion: 1,
        esVigente: true,
        precioFinal: 250000,
        estado: 'ENVIADA',
        enviadaAt: '2026-09-20',
        validaHasta: '2026-09-30',
        respuesta: {
          decision: 'ACEPTAR',
          medio: 'CORREO',
          fechaRespuesta: '2026-09-21',
          usuarioInterno: { nombre: 'Ana' },
        },
      },
      { idVersion: 2, esVigente: false, precioFinal: 200000, estado: 'VENCIDA' },
    ]);
    const onClose = vi.fn();
    render(<QuoteVersionsModal open quote={{ idCotizacion: 8 }} onClose={onClose} />);

    expect(await screen.findByText('Propuesta vigente')).toBeInTheDocument();
    expect(screen.getByText('Propuesta historica')).toBeInTheDocument();
    expect(screen.getByText('Registrada por Ana')).toBeInTheDocument();
    expect(screen.getByText('Vigente')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar' })[1]);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows request messages and the fallback error', async () => {
    mocks.listVersions.mockRejectedValueOnce(new Error('No autorizado'));
    const { rerender } = render(<QuoteVersionsModal open quote={{ idCotizacion: 4 }} onClose={vi.fn()} />);
    expect(await screen.findByText('No autorizado')).toBeInTheDocument();

    mocks.listVersions.mockRejectedValueOnce({});
    rerender(<QuoteVersionsModal open quote={{ idCotizacion: 5 }} onClose={vi.fn()} />);
    expect(await screen.findByText('No se pudieron cargar las propuestas.')).toBeInTheDocument();
  });

  it('ignores cancellation errors', async () => {
    mocks.listVersions.mockRejectedValueOnce({ code: 'ERR_CANCELED' });
    render(<QuoteVersionsModal open quote={{ idCotizacion: 6 }} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.queryByText(/No se pudieron cargar/)).not.toBeInTheDocument());
  });
});
