import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../core/utils/notifications';
import {
  createReceiptAnalysisSession,
} from '../../sales/abonos/application/receiptAnalysis.service';
import { abonoRepository } from '../../sales/abonos/infrastructure/abono.repository';
import { ClientPaymentsPanel } from './ClientPaymentsPanel';

const analysisMocks = vi.hoisted(() => ({
  analyze: vi.fn(),
  cancel: vi.fn(),
}));

vi.mock('../../../core/utils/notifications', () => ({
  notifications: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('../../sales/abonos/application/receiptAnalysis.service', () => ({
  createReceiptAnalysisSession: vi.fn(() => ({
    analyze: analysisMocks.analyze,
    cancel: analysisMocks.cancel,
  })),
  createManualReceiptAnalysis: () => ({
    montoDetectado: null,
    referenciaDetectada: null,
    fechaDetectada: null,
    bancoDetectado: null,
    calidadLectura: 0,
    requiereRevisionManual: true,
    origenAnalisis: 'FRONTEND',
    amountCandidates: [],
  }),
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

const detectedData = {
  montoDetectado: 150000,
  referenciaDetectada: 'M123456',
  fechaDetectada: '2026-07-26',
  bancoDetectado: 'Nequi',
  calidadLectura: 82,
  requiereRevisionManual: false,
  origenAnalisis: 'FRONTEND',
  amountCandidates: [{ value: 150000 }],
};

const getFileInput = container => container.querySelector('input[type="file"]');

const openUpload = (container) => {
  fireEvent.click(screen.getByRole('button', { name: /subir comprobante/i }));
  return getFileInput(container);
};

describe('ClientPaymentsPanel', () => {
  beforeEach(() => {
    abonoRepository.listClientByPedido.mockResolvedValue([]);
    analysisMocks.analyze.mockResolvedValue(detectedData);
    analysisMocks.cancel.mockResolvedValue(undefined);
    abonoRepository.uploadClientReceipt.mockResolvedValue({
      abono: {
        idAbono: 9,
        estado: 'PENDIENTE',
        metodoPago: 'TRANSFERENCIA',
      },
      datosDetectados: {
        monto: 150000,
        referencia: 'M123456',
        fecha: '2026-07-26',
        banco: 'Nequi',
        calidadLectura: 82,
        requiereRevisionManual: false,
        origenAnalisis: 'FRONTEND',
      },
    });
  });

  it('rejects invalid, empty and oversized files before starting analysis', () => {
    const { container } = render(
      <ClientPaymentsPanel order={order} canUpload canView={false} />,
    );
    const input = openUpload(container);

    fireEvent.change(input, {
      target: { files: [new File(['text'], 'receipt.txt', { type: 'text/plain' })] },
    });

    const emptyFile = new File([], 'empty.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [emptyFile] } });

    const oversizedFile = new File(['image'], 'receipt.png', { type: 'image/png' });
    Object.defineProperty(oversizedFile, 'size', { value: (10 * 1024 * 1024) + 1 });
    fireEvent.change(input, { target: { files: [oversizedFile] } });

    expect(notifications.warning).toHaveBeenNthCalledWith(
      1,
      'Selecciona un comprobante JPG, PNG o PDF.',
    );
    expect(notifications.warning).toHaveBeenNthCalledWith(
      2,
      'Selecciona un comprobante valido antes de continuar.',
    );
    expect(notifications.warning).toHaveBeenNthCalledWith(
      3,
      'El comprobante no puede superar 10 MB.',
    );
    expect(createReceiptAnalysisSession).not.toHaveBeenCalled();
    expect(abonoRepository.uploadClientReceipt).not.toHaveBeenCalled();
  });

  it.each([
    ['image/jpeg', 'receipt.jpg'],
    ['image/png', 'receipt.png'],
  ])('analyzes a selected %s image before enabling upload', async (mimeType, fileName) => {
    const { container } = render(
      <ClientPaymentsPanel order={order} canUpload canView={false} />,
    );
    const file = new File(['image'], fileName, { type: mimeType });

    fireEvent.change(openUpload(container), { target: { files: [file] } });

    expect(createReceiptAnalysisSession).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByText(/150\.000/)).toBeInTheDocument();
    });
    expect(analysisMocks.analyze).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ onProgress: expect.any(Function) }),
    );
    expect(screen.getByRole('button', { name: /enviar comprobante/i })).toBeEnabled();
  });

  it('does not analyze PDFs and submits them for manual review', async () => {
    const { container } = render(
      <ClientPaymentsPanel order={order} canUpload canView={false} />,
    );
    const file = new File(['pdf'], 'receipt.pdf', { type: 'application/pdf' });

    fireEvent.change(openUpload(container), { target: { files: [file] } });

    expect(createReceiptAnalysisSession).not.toHaveBeenCalled();
    expect(screen.getByText('Requiere revision manual')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /enviar comprobante/i }));

    await waitFor(() => {
      expect(abonoRepository.uploadClientReceipt).toHaveBeenCalledWith(
        52,
        file,
        expect.objectContaining({
          requiereRevisionManual: true,
          origenAnalisis: 'FRONTEND',
        }),
        '',
      );
    });
    expect(notifications.success).toHaveBeenCalledWith(
      'Comprobante recibido. El archivo quedo pendiente de revision manual.',
    );
  });

  it('locks repeated uploads and keeps the payment pending', async () => {
    let resolveUpload;
    abonoRepository.uploadClientReceipt.mockImplementation(() => (
      new Promise(resolve => {
        resolveUpload = resolve;
      })
    ));
    const { container } = render(
      <ClientPaymentsPanel order={order} canUpload canView={false} />,
    );
    const file = new File(['image'], 'receipt.png', { type: 'image/png' });
    fireEvent.change(openUpload(container), { target: { files: [file] } });
    await screen.findByText(/150\.000/);

    const submitButton = screen.getByRole('button', { name: /enviar comprobante/i });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    expect(abonoRepository.uploadClientReceipt).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /enviando comprobante/i })).toBeDisabled();

    resolveUpload({
      abono: { idAbono: 9, estado: 'PENDIENTE' },
      datosDetectados: {
        monto: 150000,
        requiereRevisionManual: false,
      },
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByText(/comprobante pendiente de confirmacion/i)).toBeInTheDocument();
    expect(notifications.success).toHaveBeenCalledWith(
      expect.stringMatching(/detectamos un monto.*pendiente de confirmacion/i),
    );
  });

  it('allows manual upload after analysis fails', async () => {
    analysisMocks.analyze.mockRejectedValueOnce(new Error('analysis failed'));
    const { container } = render(
      <ClientPaymentsPanel order={order} canUpload canView={false} />,
    );
    const file = new File(['image'], 'receipt.png', { type: 'image/png' });

    fireEvent.change(openUpload(container), { target: { files: [file] } });

    await waitFor(() => {
      expect(notifications.warning).toHaveBeenCalledWith(
        'No pudimos identificar todos los datos. PIXEL revisara el comprobante manualmente.',
      );
    });
    const submitButton = screen.getByRole('button', { name: /enviar comprobante/i });
    expect(submitButton).toBeEnabled();
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(abonoRepository.uploadClientReceipt).toHaveBeenCalledWith(
        52,
        file,
        expect.objectContaining({ requiereRevisionManual: true }),
        '',
      );
    });
  });

  it('keeps the file after an upload error and retries without analyzing again', async () => {
    abonoRepository.uploadClientReceipt
      .mockRejectedValueOnce(new Error('Sin conexion'))
      .mockResolvedValueOnce({
        abono: { idAbono: 9, estado: 'PENDIENTE' },
        datosDetectados: { monto: 150000, requiereRevisionManual: false },
      });
    const { container } = render(
      <ClientPaymentsPanel order={order} canUpload canView={false} />,
    );
    const file = new File(['image'], 'receipt.png', { type: 'image/png' });
    fireEvent.change(openUpload(container), { target: { files: [file] } });
    await screen.findByText(/150\.000/);

    fireEvent.click(screen.getByRole('button', { name: /enviar comprobante/i }));
    await waitFor(() => expect(notifications.error).toHaveBeenCalledWith('Sin conexion'));

    expect(screen.getByText('receipt.png')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /enviar comprobante/i }));

    await waitFor(() => {
      expect(abonoRepository.uploadClientReceipt).toHaveBeenCalledTimes(2);
    });
    expect(analysisMocks.analyze).toHaveBeenCalledTimes(1);
  });

  it('keeps the duplicate receipt visible and reports that no new payment was created', async () => {
    abonoRepository.uploadClientReceipt.mockResolvedValueOnce({
      abono: { idAbono: 9, estado: 'PENDIENTE' },
      datosDetectados: { monto: 150000, requiereRevisionManual: false },
      duplicado: true,
    });
    const { container } = render(
      <ClientPaymentsPanel order={order} canUpload canView={false} />,
    );
    const file = new File(['image'], 'receipt.png', { type: 'image/png' });
    fireEvent.change(openUpload(container), { target: { files: [file] } });
    await screen.findByText(/150\.000/);

    fireEvent.click(screen.getByRole('button', { name: /enviar comprobante/i }));

    await waitFor(() => {
      expect(notifications.warning).toHaveBeenCalledWith(
        'Este comprobante ya estaba registrado para el pedido. No se creo un abono duplicado.',
      );
    });
    expect(screen.getByRole('dialog', { name: /subir comprobante/i })).toBeInTheDocument();
    expect(screen.getByText('receipt.png')).toBeInTheDocument();
    expect(analysisMocks.analyze).toHaveBeenCalledTimes(1);
  });

  it('invalidates the previous analysis when the file changes and cleans up on cancel', async () => {
    let resolveFirst;
    analysisMocks.analyze
      .mockImplementationOnce(() => new Promise(resolve => {
        resolveFirst = resolve;
      }))
      .mockResolvedValueOnce({ ...detectedData, montoDetectado: 80000 });
    const { container } = render(
      <ClientPaymentsPanel order={order} canUpload canView={false} />,
    );
    const input = openUpload(container);

    fireEvent.change(input, {
      target: { files: [new File(['one'], 'first.png', { type: 'image/png' })] },
    });
    fireEvent.change(input, {
      target: { files: [new File(['two'], 'second.png', { type: 'image/png' })] },
    });

    await waitFor(() => expect(screen.getByText(/80\.000/)).toBeInTheDocument());
    resolveFirst(detectedData);
    await waitFor(() => expect(screen.queryByText(/150\.000/)).not.toBeInTheDocument());
    expect(analysisMocks.cancel).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('never exposes technical analyzer names in the interface', async () => {
    const { container } = render(
      <ClientPaymentsPanel order={order} canUpload canView={false} />,
    );
    fireEvent.change(openUpload(container), {
      target: { files: [new File(['image'], 'receipt.png', { type: 'image/png' })] },
    });
    await screen.findByText(/150\.000/);

    expect(document.body.textContent).not.toMatch(/\bOCR\b|Tesseract/i);
  });
});
