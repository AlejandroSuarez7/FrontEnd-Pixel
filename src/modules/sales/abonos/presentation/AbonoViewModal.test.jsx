import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { abonoRepository } from '../infrastructure/abono.repository';
import { AbonoViewModal } from './AbonoViewModal';

vi.mock('../infrastructure/abono.repository', () => ({
  abonoRepository: { getAdminReceipt: vi.fn() },
}));

vi.mock('./ReceiptPreviewModal', () => ({
  ReceiptPreviewModal: ({ isOpen, onClose, loadReceipt, title }) => (
    <section data-testid="receipt-preview" data-open={String(isOpen)}>
      <span>{title}</span>
      <button type="button" onClick={loadReceipt}>Cargar archivo</button>
      <button type="button" onClick={onClose}>Cerrar comprobante</button>
    </section>
  ),
}));

const fullPayment = {
  idAbono: 12,
  idPedido: 36,
  estado: 'RECHAZADO',
  monto: 150000,
  montoDetectadoOcr: 'invalido',
  metodoPago: 'TRANSFERENCIA',
  fechaCreacion: '2026-07-20',
  fechaConfirmacion: null,
  fechaRechazo: '2026-07-21',
  referencia: 'REF-12',
  referenciaDetectadaOcr: 'OCR-12',
  bancoDetectadoOcr: 'Nequi',
  fechaDetectadaOcr: '2026-07-19',
  requiereRevisionManual: true,
  comprobanteDisponible: true,
  motivoRechazo: 'Documento ilegible',
  pedido: {
    total: 800000,
    totalPagado: 300000,
    saldoPendiente: 500000,
    cliente: {
      nombre: 'Cliente Pixel',
      correo: 'cliente@example.com',
      telefono: '3001234567',
    },
  },
};

describe('AbonoViewModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    abonoRepository.getAdminReceipt.mockResolvedValue({ mimeType: 'image/png' });
  });

  it('does not render without an open payment', () => {
    const { rerender } = render(
      <AbonoViewModal isOpen={false} onClose={vi.fn()} abono={fullPayment} />,
    );
    expect(screen.queryByText('Abono #12')).not.toBeInTheDocument();

    rerender(<AbonoViewModal isOpen onClose={vi.fn()} abono={null} />);
    expect(screen.queryByText('Abono #12')).not.toBeInTheDocument();
  });

  it('shows complete financial details and opens the protected receipt', async () => {
    const onClose = vi.fn();
    render(<AbonoViewModal isOpen onClose={onClose} abono={fullPayment} />);

    expect(screen.getByText(/Cliente: Cliente Pixel/)).toBeInTheDocument();
    expect(screen.getByText('cliente@example.com | 3001234567')).toBeInTheDocument();
    expect(screen.getByText('Documento ilegible')).toBeInTheDocument();
    expect(screen.getAllByText('Pendiente de revision')).not.toHaveLength(0);
    expect(screen.getByText('Requiere revision manual')).toBeInTheDocument();
    expect(screen.getByText('$800.000')).toBeInTheDocument();

    expect(screen.getByTestId('receipt-preview')).toHaveAttribute('data-open', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Ver comprobante' }));
    expect(screen.getByTestId('receipt-preview')).toHaveAttribute('data-open', 'true');
    expect(screen.getByText('Comprobante del abono #12')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cargar archivo' }));
    await waitFor(() => expect(abonoRepository.getAdminReceipt).toHaveBeenCalledWith(12));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar comprobante' }));
    expect(screen.getByTestId('receipt-preview')).toHaveAttribute('data-open', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar ventana' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses fallbacks when optional payment and client data are absent', () => {
    render(
      <AbonoViewModal
        isOpen
        onClose={vi.fn()}
        abono={{
          idAbono: 2,
          idPedido: 5,
          estado: 'PENDIENTE',
          monto: '',
          metodoPago: 'EFECTIVO',
          comprobanteDisponible: false,
          requiereRevisionManual: false,
          pedido: {},
        }}
      />,
    );

    expect(screen.getByText(/Cliente: Cliente no especificado/)).toBeInTheDocument();
    expect(screen.getByText('Comprobante no disponible')).toBeInTheDocument();
    expect(screen.getByText('Datos disponibles para revision')).toBeInTheDocument();
    expect(screen.getAllByText('Por definir')).not.toHaveLength(0);
    expect(screen.queryByText(/Motivo de rechazo/)).not.toBeInTheDocument();
  });
});
