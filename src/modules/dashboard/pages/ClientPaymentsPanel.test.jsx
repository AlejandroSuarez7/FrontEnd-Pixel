import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../core/utils/notifications';
import { abonoRepository } from '../../sales/abonos/infrastructure/abono.repository';
import { ClientPaymentsPanel } from './ClientPaymentsPanel';

vi.mock('../../../core/utils/notifications', () => ({
  notifications: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('../../sales/abonos/infrastructure/abono.repository', () => ({
  abonoRepository: {
    listClientByPedido: vi.fn(),
    uploadClientReceipt: vi.fn(),
    getClientReceipt: vi.fn(),
  },
}));

vi.mock('../../sales/abonos/presentation/ReceiptPreviewModal', () => ({
  ReceiptPreviewModal: () => null,
}));

const order = {
  id: 52,
  number: 'PX-52',
  status: 'PENDIENTE',
  paymentStatus: 'PENDIENTE',
  total: 500000,
  paid: 0,
  balance: 500000,
};

const getFileInput = container => container.querySelector('input[type="file"]');

describe('ClientPaymentsPanel', () => {
  beforeEach(() => {
    abonoRepository.listClientByPedido.mockResolvedValue([]);
  });

  it('rejects unsupported and oversized files before calling the API', async () => {
    const { container } = render(
      <ClientPaymentsPanel order={order} canUpload canView={false} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /subir comprobante/i }));
    const input = getFileInput(container);

    fireEvent.change(input, {
      target: { files: [new File(['text'], 'receipt.txt', { type: 'text/plain' })] },
    });

    const oversizedFile = new File(['image'], 'receipt.png', { type: 'image/png' });
    Object.defineProperty(oversizedFile, 'size', { value: (10 * 1024 * 1024) + 1 });
    fireEvent.change(input, { target: { files: [oversizedFile] } });

    expect(notifications.warning).toHaveBeenNthCalledWith(
      1,
      'Selecciona un comprobante JPG, PNG o PDF.',
    );
    expect(notifications.warning).toHaveBeenNthCalledWith(
      2,
      'El comprobante no puede superar 10 MB.',
    );
    expect(abonoRepository.uploadClientReceipt).not.toHaveBeenCalled();
  });

  it('locks repeated uploads while OCR is processing', async () => {
    let resolveUpload;
    abonoRepository.uploadClientReceipt.mockImplementation(() => (
      new Promise(resolve => {
        resolveUpload = resolve;
      })
    ));
    const { container } = render(
      <ClientPaymentsPanel order={order} canUpload canView={false} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /subir comprobante/i }));
    const input = getFileInput(container);
    const file = new File(['image'], 'receipt.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });
    const submitButton = screen.getByRole('button', { name: /enviar comprobante/i });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    expect(abonoRepository.uploadClientReceipt).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /analizando comprobante/i })).toBeDisabled();

    resolveUpload({
      ocr: {
        montoDetectado: 150000,
        requiereRevisionManual: false,
      },
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(notifications.success).toHaveBeenCalledWith(
      expect.stringMatching(/detectamos un monto.*pendiente de confirmacion/i),
    );
  });

  it('reports that PDF receipts require manual review', async () => {
    abonoRepository.uploadClientReceipt.mockResolvedValue({
      ocr: {
        montoDetectado: null,
        requiereRevisionManual: true,
      },
    });
    const { container } = render(
      <ClientPaymentsPanel order={order} canUpload canView={false} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /subir comprobante/i }));

    fireEvent.change(getFileInput(container), {
      target: {
        files: [new File(['pdf'], 'receipt.pdf', { type: 'application/pdf' })],
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar comprobante/i }));

    await waitFor(() => {
      expect(notifications.success).toHaveBeenCalledWith(
        'Comprobante recibido. El archivo requiere revision manual.',
      );
    });
  });

  it('keeps the submit action disabled until a real file is selected', () => {
    render(<ClientPaymentsPanel order={order} canUpload canView={false} />);

    fireEvent.click(screen.getByRole('button', { name: /subir comprobante/i }));
    const submitButton = screen.getByRole('button', { name: /enviar comprobante/i });

    expect(submitButton).toBeDisabled();
    fireEvent.click(submitButton);
    expect(abonoRepository.uploadClientReceipt).not.toHaveBeenCalled();
  });
});
