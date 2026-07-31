import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../../core/utils/notifications';
import { DesignOriginModal } from './DesignOriginModal';

vi.mock('../../../../core/utils/notifications', () => ({
  notifications: {
    error: vi.fn(),
  },
}));

const requirement = {
  idPedido: 54,
  idRequerimientoDiseno: 'STAMP-34',
};

const renderModal = onSubmit => render(
  <DesignOriginModal
    isOpen
    requirement={requirement}
    pedido={{ idPedido: 54 }}
    onClose={vi.fn()}
    onSubmit={onSubmit}
  />,
);

describe('DesignOriginModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['El cliente entrega el diseno', 'CLIENTE'],
    ['PIXEL crea el diseno', 'PIXEL'],
  ])('submits %s as %s', async (label, expectedOrigin) => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderModal(onSubmit);

    fireEvent.click(screen.getByRole('radio', { name: new RegExp(`^${label}`) }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar seleccion' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expectedOrigin));
  });

  it('prevents a second submission while the first one is pending', async () => {
    let resolveRequest;
    const onSubmit = vi.fn(() => new Promise(resolve => {
      resolveRequest = resolve;
    }));
    renderModal(onSubmit);

    fireEvent.click(screen.getByRole('radio', { name: /^El cliente entrega el diseno/ }));
    const submitButton = screen.getByRole('button', { name: 'Guardar seleccion' });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
    resolveRequest();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it('keeps the modal open and reports the error when saving fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('No pudimos guardar el cambio. Intenta nuevamente.'));
    renderModal(onSubmit);

    fireEvent.click(screen.getByRole('radio', { name: /^PIXEL crea el diseno/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar seleccion' }));

    await waitFor(() => {
      expect(notifications.error).toHaveBeenCalledWith('No pudimos guardar el cambio. Intenta nuevamente.');
    });
    expect(screen.getByRole('dialog', { name: 'Definir quien entrega el diseno' })).toBeInTheDocument();
  });
});
