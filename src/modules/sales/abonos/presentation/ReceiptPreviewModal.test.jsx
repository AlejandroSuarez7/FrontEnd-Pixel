import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTemporaryObjectUrl } from '../../../../core/services/protectedFileService';
import { ReceiptPreviewModal } from './ReceiptPreviewModal';

vi.mock('../../../../core/services/protectedFileService', () => ({
  createTemporaryObjectUrl: vi.fn(),
}));

describe('ReceiptPreviewModal', () => {
  const revoke = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    createTemporaryObjectUrl.mockReturnValue({
      objectUrl: 'blob:protected-receipt',
      revoke,
    });
  });

  it('stays hidden and does not load a receipt when closed', () => {
    const loadReceipt = vi.fn();
    render(
      <ReceiptPreviewModal isOpen={false} onClose={vi.fn()} loadReceipt={loadReceipt} />,
    );

    expect(screen.queryByText('Comprobante')).not.toBeInTheDocument();
    expect(loadReceipt).not.toHaveBeenCalled();
  });

  it('loads an image, exposes actions and releases its temporary URL', async () => {
    const onClose = vi.fn();
    const loadReceipt = vi.fn().mockResolvedValue({
      blob: new Blob(['image'], { type: 'image/png' }),
      mimeType: 'image/png',
    });
    const { unmount } = render(
      <ReceiptPreviewModal isOpen onClose={onClose} loadReceipt={loadReceipt} title="Pago 12" />,
    );

    expect(screen.getByText('Cargando comprobante...')).toBeInTheDocument();
    expect(await screen.findByAltText('Comprobante de pago')).toHaveAttribute(
      'src',
      'blob:protected-receipt',
    );
    expect(screen.getByRole('link', { name: /abrir/i })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: /descargar/i })).toHaveAttribute('download');
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar' })[1]);
    expect(onClose).toHaveBeenCalled();

    unmount();
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it('renders PDFs and unsupported file guidance', async () => {
    const { rerender } = render(
      <ReceiptPreviewModal
        isOpen
        onClose={vi.fn()}
        loadReceipt={() => Promise.resolve({ blob: new Blob(['pdf']), mimeType: 'application/pdf' })}
        title="Transferencia PDF"
      />,
    );
    expect(await screen.findByTitle('Transferencia PDF')).toHaveAttribute('src', 'blob:protected-receipt');

    rerender(
      <ReceiptPreviewModal
        isOpen
        onClose={vi.fn()}
        loadReceipt={() => Promise.resolve({ blob: new Blob(['zip']), mimeType: 'application/zip' })}
        title="Archivo ZIP"
      />,
    );
    expect(await screen.findByText(/no admite vista previa/i)).toBeInTheDocument();
  });

  it('shows request errors and the default error message', async () => {
    const { rerender } = render(
      <ReceiptPreviewModal
        isOpen
        onClose={vi.fn()}
        loadReceipt={() => Promise.reject(new Error('Acceso denegado'))}
      />,
    );
    expect(await screen.findByText('Acceso denegado')).toBeInTheDocument();

    rerender(<ReceiptPreviewModal isOpen={false} onClose={vi.fn()} loadReceipt={null} />);
    rerender(
      <ReceiptPreviewModal
        isOpen
        onClose={vi.fn()}
        loadReceipt={() => Promise.reject({})}
      />,
    );
    expect(await screen.findByText('Comprobante no disponible.')).toBeInTheDocument();
  });

  it('ignores a late response after unmounting', async () => {
    let resolveReceipt;
    const loadReceipt = vi.fn(() => new Promise(resolve => {
      resolveReceipt = resolve;
    }));
    const { unmount } = render(
      <ReceiptPreviewModal isOpen onClose={vi.fn()} loadReceipt={loadReceipt} />,
    );
    unmount();

    await act(async () => {
      resolveReceipt({ blob: new Blob(['late']), mimeType: 'image/png' });
      await Promise.resolve();
    });
    expect(createTemporaryObjectUrl).not.toHaveBeenCalled();
    expect(revoke).not.toHaveBeenCalled();
  });
});
