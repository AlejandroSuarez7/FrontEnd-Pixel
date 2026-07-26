import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../../core/utils/notifications';
import { ConfirmProvider } from '../../../../shared/components/ConfirmDialog/ConfirmProvider';
import { abonoRepository } from '../infrastructure/abono.repository';
import { ReviewConfirmAbonoModal } from './ReviewConfirmAbonoModal';

vi.mock('../../../../core/utils/notifications', () => ({
  notifications: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('../infrastructure/abono.repository', () => ({
  abonoRepository: {
    update: vi.fn(),
    confirm: vi.fn(),
    reject: vi.fn(),
    getAdminReceipt: vi.fn(),
  },
}));

const basePayment = {
  idAbono: 9,
  idPedido: 52,
  monto: null,
  montoDetectadoOcr: 150000,
  metodoPago: 'TRANSFERENCIA',
  referencia: '',
  referenciaDetectadaOcr: 'REF-15',
  fechaPago: null,
  fechaDetectadaOcr: '2026-07-20',
  observaciones: '',
  estado: 'PENDIENTE',
  comprobanteDisponible: false,
  pedido: {
    total: 500000,
    totalPagado: 0,
    saldoPendiente: 500000,
    estadoPago: 'PENDIENTE',
    cliente: { nombre: 'Cliente Pixel' },
  },
};

const renderModal = (props = {}) => render(
  <ConfirmProvider>
    <ReviewConfirmAbonoModal
      isOpen
      abono={basePayment}
      onClose={vi.fn()}
      onCompleted={vi.fn()}
      {...props}
    />
  </ConfirmProvider>,
);

describe('ReviewConfirmAbonoModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    abonoRepository.update.mockResolvedValue({});
    abonoRepository.confirm.mockResolvedValue({});
    abonoRepository.getAdminReceipt.mockResolvedValue({
      blob: new Blob(['receipt'], { type: 'image/png' }),
      mimeType: 'image/png',
    });
    URL.createObjectURL = vi.fn(() => 'blob:receipt-preview');
    URL.revokeObjectURL = vi.fn();
  });

  it('prefills the detected amount and updates before confirming', async () => {
    const onCompleted = vi.fn();
    renderModal({ onCompleted });

    const amount = screen.getByLabelText(/monto a confirmar/i);
    expect(amount).toHaveValue(150000);
    expect(document.body.textContent).not.toMatch(/\bOCR\b|Tesseract/i);
    fireEvent.change(amount, { target: { value: '140000' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar abono/i }));

    await waitFor(() => {
      expect(abonoRepository.update).toHaveBeenCalledWith(
        9,
        expect.objectContaining({ monto: 140000 }),
      );
      expect(abonoRepository.confirm).toHaveBeenCalledWith(
        9,
        expect.objectContaining({ referencia: 'REF-15' }),
      );
    });
    expect(abonoRepository.update.mock.invocationCallOrder[0])
      .toBeLessThan(abonoRepository.confirm.mock.invocationCallOrder[0]);
    expect(onCompleted).toHaveBeenCalled();
  });

  it('does not confirm when updating the corrected data fails', async () => {
    abonoRepository.update.mockRejectedValueOnce(new Error('Monto superior al saldo'));
    renderModal();

    fireEvent.change(screen.getByLabelText(/monto a confirmar/i), {
      target: { value: '900000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirmar abono/i }));

    await waitFor(() => {
      expect(notifications.error).toHaveBeenCalledWith('Monto superior al saldo');
    });
    expect(abonoRepository.confirm).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('keeps an empty detected amount from being confirmed', () => {
    renderModal({
      abono: {
        ...basePayment,
        monto: null,
        montoDetectadoOcr: null,
      },
    });

    const amount = screen.getByLabelText(/monto a confirmar/i);
    expect(amount).toHaveValue(null);
    fireEvent.submit(document.getElementById('review-payment-form'));

    expect(notifications.warning).toHaveBeenCalledWith(
      'Ingresa un monto a confirmar mayor que cero.',
    );
    expect(abonoRepository.update).not.toHaveBeenCalled();
    expect(abonoRepository.confirm).not.toHaveBeenCalled();
  });

  it('skips the update request when confirmed data did not change', async () => {
    renderModal({
      abono: {
        ...basePayment,
        monto: 150000,
        referencia: 'REF-15',
        fechaPago: '2026-07-20',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /confirmar abono/i }));

    await waitFor(() => expect(abonoRepository.confirm).toHaveBeenCalledTimes(1));
    expect(abonoRepository.update).not.toHaveBeenCalled();
  });

  it('keeps the modal open when confirmation fails', async () => {
    abonoRepository.confirm.mockRejectedValueOnce(new Error('El abono ya fue procesado'));
    const onClose = vi.fn();
    renderModal({
      onClose,
      abono: {
        ...basePayment,
        monto: 150000,
        referencia: 'REF-15',
        fechaPago: '2026-07-20',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /confirmar abono/i }));

    await waitFor(() => {
      expect(notifications.error).toHaveBeenCalledWith('El abono ya fue procesado');
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('blocks repeated confirmation clicks while the request is pending', async () => {
    let resolveConfirmation;
    abonoRepository.confirm.mockImplementationOnce(() => new Promise(resolve => {
      resolveConfirmation = resolve;
    }));
    renderModal({
      abono: {
        ...basePayment,
        monto: 150000,
        referencia: 'REF-15',
        fechaPago: '2026-07-20',
      },
    });

    const button = screen.getByRole('button', { name: /confirmar abono/i });
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());
    expect(abonoRepository.confirm).toHaveBeenCalledTimes(1);
    resolveConfirmation({});
    await waitFor(() => expect(notifications.success).toHaveBeenCalled());
  });

  it('loads a protected image preview and revokes its temporary URL', async () => {
    const { unmount } = renderModal({
      abono: {
        ...basePayment,
        comprobanteDisponible: true,
        nombreOriginalComprobante: 'pago.png',
      },
    });

    expect(await screen.findByAltText('Comprobante de pago')).toHaveAttribute(
      'src',
      'blob:receipt-preview',
    );
    expect(abonoRepository.getAdminReceipt).toHaveBeenCalledWith(9);
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:receipt-preview');
  });

  it('offers open and download actions for a protected PDF', async () => {
    abonoRepository.getAdminReceipt.mockResolvedValueOnce({
      blob: new Blob(['pdf'], { type: 'application/pdf' }),
      mimeType: 'application/pdf',
    });
    renderModal({
      abono: {
        ...basePayment,
        comprobanteDisponible: true,
        nombreOriginalComprobante: 'pago.pdf',
      },
    });

    expect(await screen.findByText('pago.pdf')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /abrir/i })).toHaveAttribute('href', 'blob:receipt-preview');
    expect(screen.getByRole('link', { name: /descargar/i })).toHaveAttribute('download', 'pago.pdf');
    expect(document.body.textContent).not.toMatch(/\bOCR\b|Tesseract/i);
  });
});
