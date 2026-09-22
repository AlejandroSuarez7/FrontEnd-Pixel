import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiscountsModal } from './DiscountsModal';

const mocks = vi.hoisted(() => ({ repository: { listDiscounts: vi.fn(), replaceDiscounts: vi.fn() }, notifications: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }));
vi.mock('../../../../core/hooks/useAsyncLock', () => ({ useAsyncLock: () => ({ isLocked: false, runLocked: (operation) => operation() }) }));
vi.mock('../../../../core/utils/notifications', () => ({ notifications: mocks.notifications }));
vi.mock('../infrastructure/tariff.repository', () => ({ tariffRepository: mocks.repository }));

describe('DiscountsModal', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.repository.listDiscounts.mockResolvedValue([]); mocks.repository.replaceDiscounts.mockResolvedValue([]); });
  it('loads an empty list, adds, validates and saves a discount', async () => {
    const onClose = vi.fn();
    render(<DiscountsModal open technique={{ idTecnica: 1, nombre: 'DTF' }} onClose={onClose} />);
    await screen.findByText('Esta técnica no tiene descuentos configurados.');
    fireEvent.click(screen.getByText('Agregar descuento'));
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '0' } });
    fireEvent.click(screen.getByText('Guardar descuentos'));
    expect(mocks.notifications.warning).toHaveBeenCalled();
    fireEvent.change(screen.getByText('Cantidad mínima').closest('label').querySelector('input'), { target: { value: '2' } });
    fireEvent.change(screen.getByText('Descuento %').closest('label').querySelector('input'), { target: { value: '10,5' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'false' } });
    fireEvent.click(screen.getByText('Guardar descuentos'));
    await waitFor(() => expect(mocks.repository.replaceDiscounts).toHaveBeenCalledWith(1, [expect.objectContaining({ cantidadMinima: '2', porcentaje: '10,5', estado: false })]));
    expect(onClose).toHaveBeenCalled();
  });
  it('detects duplicate quantities and save errors', async () => {
    mocks.repository.listDiscounts.mockResolvedValueOnce([{ idDescuento: 1, cantidadMinima: 5, porcentaje: 10, estado: true }, { idDescuento: 2, cantidadMinima: 5, porcentaje: 20, estado: true }]);
    mocks.repository.replaceDiscounts.mockRejectedValueOnce(new Error('save fail'));
    render(<DiscountsModal open technique={{ idTecnica: 1 }} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getAllByDisplayValue('5')).toHaveLength(2));
    fireEvent.click(screen.getByText('Guardar descuentos'));
    expect(mocks.notifications.warning).toHaveBeenLastCalledWith('No puedes repetir una cantidad mínima.');
    fireEvent.click(screen.getByLabelText('Quitar descuento 2'));
    fireEvent.click(screen.getByText('Guardar descuentos'));
    await waitFor(() => expect(mocks.notifications.error).toHaveBeenCalledWith('save fail'));
  });
  it('shows loading and request errors', async () => {
    mocks.repository.listDiscounts.mockRejectedValueOnce(new Error('load fail'));
    render(<DiscountsModal open technique={{ idTecnica: 1 }} onClose={vi.fn()} />);
    expect(screen.getByText('Cargando descuentos...')).toBeInTheDocument();
    await screen.findByText('load fail');
  });
});
