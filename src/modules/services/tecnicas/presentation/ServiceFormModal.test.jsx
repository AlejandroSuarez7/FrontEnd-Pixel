import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../../core/utils/notifications';
import { tariffRepository } from '../../tarifas/infrastructure/tariff.repository';
import { ServiceFormModal } from './ServiceFormModal';

vi.mock('../../../../core/utils/notifications', () => ({
  notifications: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));
vi.mock('../../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
vi.mock('../../tarifas/infrastructure/tariff.repository', () => ({
  tariffRepository: {
    list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(),
  },
}));

const permissions = { canView: true, canCreate: true, canEdit: true, canDelete: true };
const service = { id: 2, nombre: 'DTF', descripcion: '', estado: true, requiereMedidas: true };

describe('ServiceFormModal named rates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tariffRepository.list.mockResolvedValue({
      items: [{
        idTarifaTecnica: 1,
        idTecnica: 2,
        nombre: 'Punto corazón',
        anchoHastaCm: 10,
        altoHastaCm: 10,
        precioUnitario: 10000,
        estado: true,
      }],
    });
    tariffRepository.update.mockImplementation(async (_id, payload) => ({ idTarifaTecnica: 1, ...payload }));
  });

  it('shows and edits the required size name through the current admin endpoint flow', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue({ idTecnica: 2 });
    render(<ServiceFormModal isOpen service={service} tariffPermissions={permissions} onClose={vi.fn()} onCreate={vi.fn()} onUpdate={onUpdate} />);

    const name = await screen.findByLabelText('Nombre del tamaño tarifa 1');
    expect(name).toHaveValue('Punto corazón');
    await user.clear(name);
    await user.type(name, 'Carta');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(tariffRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ nombre: 'Carta', anchoHastaCm: 10, altoHastaCm: 10 }),
    ));
  });

  it('shows an inline error for a blank name and does not save', async () => {
    const onUpdate = vi.fn().mockResolvedValue({ idTecnica: 2 });
    render(<ServiceFormModal isOpen service={service} tariffPermissions={permissions} onClose={vi.fn()} onCreate={vi.fn()} onUpdate={onUpdate} />);

    const name = await screen.findByLabelText('Nombre del tamaño tarifa 1');
    fireEvent.change(name, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText(/nombre del tamaño es obligatorio/i)).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(notifications.warning).toHaveBeenCalled();
  });
});
