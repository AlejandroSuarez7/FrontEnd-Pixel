import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { publicQuoteRepository } from '../infrastructure/publicQuote.repository';
import { StampTariffSelector } from './StampTariffSelector';

vi.mock('../infrastructure/publicQuote.repository', () => ({
  publicQuoteRepository: { listTechniqueTariffs: vi.fn() },
}));

const technique = { idTecnica: 2, nombre: 'DTF', requiereMedidas: true };
const rates = [
  { idTarifaTecnica: 1, nombre: 'Punto corazón', anchoHastaCm: 10, altoHastaCm: 10, esGeneral: false },
  { idTarifaTecnica: 2, nombre: 'Carta', anchoHastaCm: 22, altoHastaCm: 28, esGeneral: false },
];

describe('StampTariffSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    publicQuoteRepository.listTechniqueTariffs.mockResolvedValue(rates);
  });

  it('loads named options without prices and stores the selected id and dimensions', async () => {
    const user = userEvent.setup();
    const onPatch = vi.fn();
    render(<StampTariffSelector stamp={{}} technique={technique} onPatch={onPatch} />);

    const select = await screen.findByLabelText('Tamaño del estampado');
    expect(screen.getByRole('option', { name: 'Punto corazón — hasta 10 × 10 cm' })).toBeInTheDocument();
    expect(screen.queryByText(/\$|precio/i)).not.toBeInTheDocument();
    await user.selectOptions(select, '2');

    expect(onPatch).toHaveBeenLastCalledWith(expect.objectContaining({
      idTarifaTecnica: 2,
      anchoCm: 22,
      altoCm: 28,
    }));
  });

  it('allows a pending size when there are no configured rates', async () => {
    publicQuoteRepository.listTechniqueTariffs.mockResolvedValue([]);
    const onPatch = vi.fn();
    render(<StampTariffSelector stamp={{}} technique={technique} onPatch={onPatch} />);

    expect(await screen.findByText('No hay tamaños configurados para este servicio.')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'No conozco el tamaño' })).toBeInTheDocument();
    await waitFor(() => expect(onPatch).toHaveBeenCalledWith(expect.objectContaining({
      idTarifaTecnica: null,
      anchoCm: null,
      altoCm: null,
    })));
  });

  it('auto-selects a single general rate and cancels the old request on technique change', async () => {
    const signals = [];
    publicQuoteRepository.listTechniqueTariffs.mockImplementation((id, { signal }) => {
      signals.push(signal);
      return Promise.resolve(Number(id) === 4
        ? [{ idTarifaTecnica: 4, nombre: 'Tarifa general', esGeneral: true }]
        : rates);
    });
    const onPatch = vi.fn();
    const { rerender } = render(
      <StampTariffSelector stamp={{}} technique={technique} onPatch={onPatch} />,
    );
    rerender(
      <StampTariffSelector
        stamp={{}}
        technique={{ idTecnica: 4, nombre: 'Sublimación', requiereMedidas: false }}
        onPatch={onPatch}
      />,
    );

    await waitFor(() => expect(signals[0].aborted).toBe(true));
    await waitFor(() => expect(onPatch).toHaveBeenCalledWith(expect.objectContaining({
      idTarifaTecnica: 4,
      tarifaEsGeneral: true,
      anchoCm: null,
      altoCm: null,
    })));
    expect(await screen.findByText('Tarifa general')).toBeInTheDocument();
  });
});
