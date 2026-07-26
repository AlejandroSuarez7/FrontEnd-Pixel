/* eslint-disable react-hooks/set-state-in-effect */
import { FileSearch, FileText, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAsyncLock } from '../../../core/hooks/useAsyncLock';
import { notifications } from '../../../core/utils/notifications';
import { formatDate } from '../../../core/utils/fechaFormato';
import { abonoRepository } from '../../sales/abonos/infrastructure/abono.repository';
import { ReceiptPreviewModal } from '../../sales/abonos/presentation/ReceiptPreviewModal';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const formatMoney = value => (
  value == null || value === ''
    ? 'Pendiente de revision'
    : new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(value))
);

const paymentStatusLabel = {
  PENDIENTE: 'Pendiente de revision',
  CONFIRMADO: 'Confirmado',
  RECHAZADO: 'Rechazado',
};

export const ClientPaymentsPanel = ({ order, canUpload, canView }) => {
  const inputRef = useRef(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const { isLocked: isUploading, runLocked } = useAsyncLock();

  const loadPayments = useCallback(async () => {
    if (!order?.id || !canView) {
      setPayments([]);
      return;
    }
    setLoading(true);
    try {
      setPayments(await abonoRepository.listClientByPedido(order.id));
    } catch (error) {
      setPayments([]);
      notifications.error(error.message || 'No se pudieron consultar tus abonos.');
    } finally {
      setLoading(false);
    }
  }, [order, canView]);

  useEffect(() => {
    setResult(null);
    loadPayments();
  }, [loadPayments]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      notifications.warning('Selecciona un comprobante JPG, PNG o PDF.');
      event.target.value = '';
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      notifications.warning('El comprobante no puede superar 10 MB.');
      event.target.value = '';
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const closeUpload = (force = false) => {
    if (isUploading && !force) return;
    setIsUploadOpen(false);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (typeof File === 'undefined' || !(selectedFile instanceof File)) {
      notifications.warning('Selecciona un comprobante antes de continuar.');
      return;
    }

    await runLocked(async () => {
      try {
        const uploadResult = await abonoRepository.uploadClientReceipt(order.id, selectedFile);
        setResult(uploadResult);
        await loadPayments();

        if (selectedFile.type === 'application/pdf') {
          notifications.success('Comprobante recibido. El archivo requiere revision manual.');
        } else if (uploadResult?.ocr?.requiereRevisionManual || uploadResult?.ocr?.montoDetectado == null) {
          notifications.success('Comprobante recibido. El equipo de PIXEL revisara los datos manualmente.');
        } else {
          notifications.success(`Comprobante recibido. Detectamos un monto de ${formatMoney(uploadResult.ocr.montoDetectado)} y quedo pendiente de confirmacion.`);
        }
        closeUpload(true);
      } catch (error) {
        notifications.error(error.message || 'No se pudo procesar el comprobante.');
      }
    });
  };

  const selectedReceiptLoader = useCallback(
    () => abonoRepository.getClientReceipt(receiptPayment?.idAbono),
    [receiptPayment?.idAbono],
  );
  if (!order) return null;
  const canReceivePayment = !['ANULADO', 'ENTREGADO'].includes(order.status) && Number(order.balance || 0) > 0;

  return (
    <section className="dashboard-panel dashboard-client-payments">
      <div className="dashboard-client-payments-header">
        <div>
          <span className="dashboard-eyebrow">Abonos</span>
          <h2>Pagos de {order.number}</h2>
          <p>Consulta tus pagos y envía el comprobante de una transferencia.</p>
        </div>
        {canUpload && canReceivePayment && (
          <button
            type="button"
            className="dashboard-upload-receipt"
            onClick={() => setIsUploadOpen(true)}
          >
            <Upload size={18} />
            Subir comprobante
          </button>
        )}
      </div>

      <div className="dashboard-payment-summary">
        <div><span>Total pedido</span><strong>{formatMoney(order.total)}</strong></div>
        <div><span>Total confirmado</span><strong>{formatMoney(order.paid)}</strong></div>
        <div><span>Saldo pendiente</span><strong>{formatMoney(order.balance)}</strong></div>
        <div><span>Estado de pago</span><strong>{Number(order.balance || 0) <= 0 ? 'Pago completo' : order.paymentStatus}</strong></div>
      </div>

      {result?.ocr && (
        <div className="dashboard-ocr-result">
          <strong>Datos detectados</strong>
          <span>Monto detectado: {formatMoney(result.ocr.montoDetectado)}</span>
          <span>Referencia: {result.ocr.referenciaDetectada || 'Pendiente de revision'}</span>
          <span>Banco o plataforma: {result.ocr.bancoDetectado || 'No identificado'}</span>
          <small>Estado: Pendiente de revisión por PIXEL.</small>
        </div>
      )}

      {!canView ? (
        <p className="dashboard-client-payment-empty">No tienes permiso para consultar el historial de abonos.</p>
      ) : loading ? (
        <p className="dashboard-client-payment-empty">Consultando abonos...</p>
      ) : payments.length === 0 ? (
        <p className="dashboard-client-payment-empty">Todavía no hay abonos registrados para este pedido.</p>
      ) : (
        <div className="dashboard-client-payment-list">
          {payments.map(payment => (
            <article key={payment.idAbono}>
              <div>
                <strong>{formatMoney(payment.monto ?? payment.montoDetectadoOcr)}</strong>
                <small>{payment.monto == null && payment.montoDetectadoOcr != null ? 'Monto detectado' : payment.estado === 'CONFIRMADO' ? 'Monto confirmado' : 'Monto del abono'}</small>
              </div>
              <div>
                <span className={`dashboard-payment-status ${String(payment.estado || '').toLowerCase()}`}>
                  {paymentStatusLabel[payment.estado] || payment.estado}
                </span>
                <small>{formatDate(payment.fechaCreacion)}</small>
              </div>
              <div>
                <span>{payment.referencia || payment.referenciaDetectadaOcr || 'Sin referencia'}</span>
                {payment.requiereRevisionManual && <small>Requiere revision manual</small>}
                {payment.motivoRechazo && <small>{payment.motivoRechazo}</small>}
              </div>
              {payment.comprobanteDisponible && (
                <button type="button" onClick={() => setReceiptPayment(payment)}>
                  <FileSearch size={17} /> Ver comprobante
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      <small className="dashboard-upload-help">Archivos permitidos: JPG, PNG o PDF. Tamaño máximo: 10 MB.</small>

      {isUploadOpen && (
        <div className="dashboard-receipt-upload-overlay" role="presentation">
          <div
            className="dashboard-receipt-upload-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-upload-title"
          >
            <div className="dashboard-receipt-upload-title">
              <div>
                <span className="dashboard-eyebrow">Transferencia</span>
                <h3 id="receipt-upload-title">Subir comprobante</h3>
                <p>Selecciona el archivo y revisa sus datos antes de enviarlo.</p>
              </div>
              <button type="button" onClick={() => closeUpload()} disabled={isUploading} aria-label="Cerrar">
                <X size={19} />
              </button>
            </div>

            <label className="dashboard-receipt-file-picker">
              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <Upload size={22} />
              <strong>{selectedFile ? 'Cambiar comprobante' : 'Seleccionar comprobante'}</strong>
              <small>JPG, PNG o PDF. Maximo 10 MB.</small>
            </label>

            {selectedFile && (
              <div className="dashboard-receipt-selected-file">
                <FileText size={22} />
                <div>
                  <strong>{selectedFile.name}</strong>
                  <span>
                    {selectedFile.type || 'Tipo no identificado'} · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (inputRef.current) inputRef.current.value = '';
                  }}
                  disabled={isUploading}
                >
                  Quitar
                </button>
              </div>
            )}

            <div className="dashboard-receipt-upload-actions">
              <button type="button" onClick={() => closeUpload()} disabled={isUploading}>
                Cancelar
              </button>
              <button
                type="button"
                className="primary"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? 'Analizando comprobante...' : 'Enviar comprobante'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ReceiptPreviewModal
        isOpen={Boolean(receiptPayment)}
        onClose={() => setReceiptPayment(null)}
        loadReceipt={selectedReceiptLoader}
        title={`Comprobante del abono #${receiptPayment?.idAbono || ''}`}
      />
    </section>
  );
};
