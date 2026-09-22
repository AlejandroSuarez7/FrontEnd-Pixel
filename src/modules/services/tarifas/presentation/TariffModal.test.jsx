import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TariffModal } from './TariffModal';

const mocks = vi.hoisted(() => ({ notifications: { warning: vi.fn(), error: vi.fn() } }));
vi.mock('../../../../core/hooks/useAsyncLock', () => ({ useAsyncLock: () => ({ isLocked: false, runLocked: (operation) => operation() }) }));
vi.mock('../../../../core/utils/notifications', () => ({ notifications: mocks.notifications }));

describe('TariffModal', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns null and validates each required value', () => {
    const { container } = render(<TariffModal open={false} techniques={[]} />);
    expect(container).toBeEmptyDOMElement();
    render(<TariffModal open techniques={[{ idTecnica: 1, nombre: 'DTF' }]} onSubmit={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Guardar tarifa'));
    expect(mocks.notifications.warning).toHaveBeenLastCalledWith('Selecciona una técnica.');
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1' } });
    fireEvent.click(screen.getByText('Guardar tarifa'));
    expect(mocks.notifications.warning).toHaveBeenLastCalledWith('El ancho y el alto deben ser mayores a 0.');
    fireEvent.change(screen.getByPlaceholderText('Ej: 20'), { target: { value: '10,5' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 30'), { target: { value: '20' } });
    fireEvent.click(screen.getByText('Guardar tarifa'));
    expect(mocks.notifications.warning).toHaveBeenLastCalledWith('El precio unitario debe ser mayor a 0.');
  });
  it('creates and edits tariffs, closing only on success', async () => {
    const onSubmit = vi.fn().mockResolvedValue(); const onClose = vi.fn();
    render(<TariffModal open techniques={[{ idTecnica: 1, nombre: 'DTF' }]} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 20'), { target: { value: '10' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 30'), { target: { value: '20' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 12500'), { target: { value: '5000' } });
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'false' } });
    fireEvent.click(screen.getByText('Guardar tarifa'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ idTecnica: '1', estado: false })));
    expect(onClose).toHaveBeenCalled();
  });
  it('reports submit errors for an existing tariff', async () => {
    const onSubmit = vi.fn().mockRejectedValueOnce(new Error('blocked'));
    render(<TariffModal open tariff={{ idTecnica: 1, anchoHastaCm: 10, altoHastaCm: 20, precioUnitario: 1000, estado: true }} techniques={[]} onSubmit={onSubmit} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Guardar tarifa'));
    await waitFor(() => expect(mocks.notifications.error).toHaveBeenCalledWith('blocked'));
    expect(screen.getByText('La técnica no cambia al editar una tarifa.')).toBeInTheDocument();
  });
});
