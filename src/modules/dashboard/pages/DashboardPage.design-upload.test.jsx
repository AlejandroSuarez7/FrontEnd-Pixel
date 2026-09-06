import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { disenoRepository } from '../../production/disenos/infrastructure/diseno.repository';
import { ClientDesignFilePanel } from './DashboardPage';

vi.mock('../../production/disenos/infrastructure/diseno.repository', () => ({
  disenoRepository: { uploadClientDesign: vi.fn() },
}));

vi.mock('../../sales/pedidos/infrastructure/pedido.repository', () => ({
  pedidoRepository: { saveClientDesignUrl: vi.fn() },
}));

vi.mock('../../../core/utils/notifications', () => ({
  notifications: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

describe('ClientDesignFilePanel', () => {
  it('uploads the current order requirement and refreshes the dashboard', async () => {
    disenoRepository.uploadClientDesign.mockResolvedValue({ estado: 'ENVIADO' });
    const onSaved = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <ClientDesignFilePanel
        order={{
          id: '54',
          requirements: [{
            idRequerimientoDiseno: 'GROUP-LOGO',
            origenDiseno: 'CLIENTE',
            producto: { nombre: 'Camiseta' },
            cantidad: 12,
          }],
        }}
        onSaved={onSaved}
      />,
    );
    const file = new File(['design'], 'logo.webp', { type: 'image/webp' });

    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar diseno' }));

    await waitFor(() => {
      expect(disenoRepository.uploadClientDesign).toHaveBeenCalledWith(
        '54',
        'GROUP-LOGO',
        file,
      );
      expect(onSaved).toHaveBeenCalledTimes(1);
    });
  });
});
