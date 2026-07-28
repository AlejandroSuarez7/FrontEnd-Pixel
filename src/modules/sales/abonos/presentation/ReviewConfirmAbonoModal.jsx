/* eslint-disable react-hooks/set-state-in-effect */
import { Download, ExternalLink, FileText, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { createTemporaryObjectUrl } from '../../../../core/services/protectedFileService';
import { formatCalendarDate, toCalendarDateInput } from '../../../../core/utils/fechaFormato';
import { notifications } from '../../../../core/utils/notifications';
import { formatPaymentOrigin } from '../../../../core/utils/paymentOrigin';
import { useConfirm } from '../../../../shared/components/ConfirmDialog/ConfirmProvider';
import { abonoRepository } from '../infrastructure/abono.repository';
import './AbonosPage.css';

const formatMoney = (value, fallback = 'No identificado') => (
  value === null || value === undefined || value === '' || !Number.isFinite(Number(value))
    ? fallback
    : new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(value))
);

const normalizeText = value => String(value || '').trim();
const formatReadingQuality = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? `${Math.round(Math.max(0, Math.min(100, numericValue)))}%`
    : 'No especificada';
};

export const ReviewConfirmAbonoModal = ({
  isOpen,
  abono,
  onClose,
  onCompleted,
  canReject = false,
}) => {
  const confirm = useConfirm();
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();
  const [monto, setMonto] = useState('');
  const [referencia, setReferencia] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [metodoPago, setMetodoPago] = useState('TRANSFERENCIA');
  const [observaciones, setObservaciones] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [detailAbono, setDetailAbono] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailRequestKey, setDetailRequestKey] = useState(0);
  const currentAbono = detailAbono || abono;

  useEffect(() => {
    if (!isOpen || !abono?.idAbono) {
      setDetailAbono(null);
      setDetailError('');
      setLoadingDetail(false);
      return undefined;
    }

    let active = true;
    setDetailAbono(null);
    setDetailError('');
    setLoadingDetail(true);

    abonoRepository.getById(abono.idAbono)
      .then(detail => {
        if (active) setDetailAbono(detail);
      })
      .catch(error => {
        if (active) setDetailError(error.message || 'No se pudo cargar el detalle completo del abono.');
      })
      .finally(() => {
        if (active) setLoadingDetail(false);
      });

    return () => {
      active = false;
    };
  }, [abono?.idAbono, detailRequestKey, isOpen]);

  useEffect(() => {
    if (!isOpen || !currentAbono) return;
    setMonto(currentAbono.monto ?? currentAbono.montoDetectadoOcr ?? '');
    setReferencia(currentAbono.referencia || currentAbono.referenciaDetectadaOcr || '');
    setFechaPago(toCalendarDateInput(currentAbono.fechaPago || currentAbono.fechaDetectadaOcr));
    setMetodoPago(currentAbono.metodoPago || 'TRANSFERENCIA');
    setObservaciones(currentAbono.observaciones || '');
  }, [currentAbono, isOpen]);

  useEffect(() => {
    const detailRequestResolved = Boolean(detailAbono || detailError);
    if (!isOpen || !detailRequestResolved || !currentAbono?.comprobanteDisponible) {
      setPreview(null);
      setPreviewError('');
      return undefined;
    }

    let active = true;
    let releaseUrl = null;
    setPreview(null);
    setPreviewError('');

    abonoRepository.getAdminReceipt(currentAbono.idAbono)
      .then(({ blob, mimeType }) => {
        if (!active) return;
        const temporary = createTemporaryObjectUrl(blob);
        releaseUrl = temporary.revoke;
        setPreview({
          url: temporary.objectUrl,
          mimeType,
          fileName: currentAbono.nombreOriginalComprobante || `comprobante-${currentAbono.idAbono}`,
        });
      })
      .catch(error => {
        if (active) setPreviewError(error.message || 'Comprobante no disponible.');
      });

    return () => {
      active = false;
      releaseUrl?.();
    };
  }, [currentAbono, detailAbono, detailError, isOpen]);

  const updatePayload = useMemo(() => {
    if (!currentAbono) return null;
    const payload = {};
    const amountNumber = Number(monto);

    if (currentAbono.monto == null || Number(currentAbono.monto) !== amountNumber) payload.monto = amountNumber;
    if (normalizeText(currentAbono.referencia) !== normalizeText(referencia)) payload.referencia = referencia;
    if (toCalendarDateInput(currentAbono.fechaPago) !== fechaPago) payload.fechaPago = fechaPago;
    if (normalizeText(currentAbono.metodoPago) !== normalizeText(metodoPago)) payload.metodoPago = metodoPago;
    if (normalizeText(currentAbono.observaciones) !== normalizeText(observaciones)) payload.observaciones = observaciones;

    return payload;
  }, [currentAbono, fechaPago, metodoPago, monto, observaciones, referencia]);

  if (!isOpen || !abono) return null;

  const pedido = currentAbono.pedido || {};
  const cliente = pedido.cliente || {};
  const definitiveData = currentAbono.datosDefinitivos || {};
  const hasDefinitiveData = [
    definitiveData.monto,
    definitiveData.referencia,
    definitiveData.fecha,
  ].some(value => value !== null && value !== undefined && value !== '');
  const canProcess = !loadingDetail && !detailError;
  const isImage = preview?.mimeType?.startsWith('image/');
  const isPdf = preview?.mimeType === 'application/pdf';

  const handleSubmit = event => {
    event.preventDefault();

    const amountNumber = Number(monto);
    if (!monto || !Number.isFinite(amountNumber) || amountNumber <= 0) {
      notifications.warning('Ingresa un monto a confirmar mayor que cero.');
      return;
    }
    if (!metodoPago) {
      notifications.warning('Selecciona el metodo de pago.');
      return;
    }
    if (fechaPago && Number.isNaN(new Date(`${fechaPago}T00:00:00`).getTime())) {
      notifications.warning('Ingresa una fecha de pago valida.');
      return;
    }

    runLocked(async () => {
      try {
        const hasChanges = Object.keys(updatePayload || {}).length > 0;
        if (hasChanges) {
          await abonoRepository.update(currentAbono.idAbono, updatePayload);
        }
        await abonoRepository.confirm(currentAbono.idAbono, {
          referencia,
          observaciones,
        });
        try {
          await onCompleted?.();
        } catch {
          notifications.warning('El abono fue confirmado, pero no pudimos actualizar la vista. Vuelve a abrir el pedido.');
        }
        notifications.success(
          hasChanges
            ? 'Datos actualizados y abono confirmado correctamente.'
            : 'Abono confirmado correctamente.',
        );
        onClose();
      } catch (error) {
        if (!error.wasNotified) notifications.error(error.message || 'No pudimos completar la confirmacion.');
      }
    });
  };

  const handleReject = async () => {
    const result = await confirm({
      title: 'Rechazar abono',
      message: `Indica el motivo para rechazar el abono #${currentAbono.idAbono}.`,
      confirmText: 'Rechazar',
      variant: 'danger',
      input: true,
      inputPlaceholder: 'Motivo de rechazo',
      requiredInput: true,
    });
    if (!result.confirmed) return;

    await runLocked(async () => {
      try {
        await abonoRepository.reject(currentAbono.idAbono, result.value);
        await onCompleted?.();
        notifications.success('Abono rechazado.');
        onClose();
      } catch (error) {
        if (!error.wasNotified) notifications.error(error.message || 'No se pudo rechazar el abono.');
      }
    });
  };

  return (
    <div className="abonos-overlay">
      <div className="abonos-review-modal" role="dialog" aria-modal="true" aria-labelledby="review-payment-title">
        <header className="abonos-review-header">
          <div>
            <span className="abonos-breadcrumb">Pedido #{currentAbono.idPedido}</span>
            <h3 id="review-payment-title">Revisar y confirmar abono</h3>
            <p>Verifica que los datos del comprobante sean correctos antes de confirmar el pago.</p>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Cerrar">
            <X size={19} />
          </button>
        </header>

        <div className="abonos-review-body">
          {loadingDetail && <p className="abonos-review-detail-state">Cargando informacion del abono...</p>}
          {detailError && (
            <div className="abonos-review-detail-state" role="alert">
              <span>{detailError}</span>
              <button type="button" onClick={() => setDetailRequestKey(current => current + 1)}>
                Reintentar
              </button>
            </div>
          )}
          <section className="abonos-review-summary">
            <div><span>Pedido</span><strong>#{currentAbono.idPedido}</strong></div>
            <div><span>Cliente</span><strong>{cliente.nombre || 'Cliente no especificado'}</strong></div>
            <div><span>Total</span><strong>{formatMoney(pedido.total)}</strong></div>
            <div><span>Confirmado</span><strong>{formatMoney(pedido.totalPagadoConfirmado ?? pedido.totalPagado, '$0')}</strong></div>
            <div><span>Saldo pendiente</span><strong>{formatMoney(pedido.saldoPendiente)}</strong></div>
            <div><span>Estado de pago</span><strong>{pedido.estadoPago || 'PENDIENTE'}</strong></div>
          </section>

          <div className="abonos-review-columns">
            <section className="abonos-review-receipt">
              <div className="abonos-review-section-title">
                <div><span>Comprobante</span><h4>Archivo enviado</h4></div>
                {currentAbono.requiereRevisionManual && <strong>Revision manual</strong>}
              </div>

              {!currentAbono.comprobanteDisponible && <p>Comprobante no disponible.</p>}
              {currentAbono.comprobanteDisponible && !preview && !previewError && <p>Cargando comprobante...</p>}
              {previewError && <p>{previewError}</p>}
              {isImage && <img src={preview.url} alt="Comprobante de pago" />}
              {isPdf && (
                <div className="abonos-review-pdf">
                  <FileText size={42} />
                  <strong>{preview.fileName}</strong>
                  <span>El archivo requiere revision manual.</span>
                </div>
              )}
              {preview && !isImage && !isPdf && <p>Vista previa no disponible para este archivo.</p>}
              {preview && (
                <div className="abonos-review-file-actions">
                  <a href={preview.url} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Abrir</a>
                  <a href={preview.url} download={preview.fileName}><Download size={15} /> Descargar</a>
                </div>
              )}
            </section>

            <form id="review-payment-form" className="abonos-review-form" onSubmit={handleSubmit}>
              <section className="abonos-detected-data">
                <div className="abonos-review-section-title"><div><span>Referencia</span><h4>Datos detectados</h4></div></div>
                <div className="abonos-detected-grid">
                  <div><span>Monto detectado</span><strong>{formatMoney(currentAbono.montoDetectadoOcr)}</strong></div>
                  <div><span>Referencia detectada</span><strong>{currentAbono.referenciaDetectadaOcr || 'No identificada'}</strong></div>
                  <div><span>Fecha detectada</span><strong>{currentAbono.fechaDetectadaOcr ? formatCalendarDate(currentAbono.fechaDetectadaOcr) : 'No identificada'}</strong></div>
                  <div><span>Banco o plataforma</span><strong>{currentAbono.bancoDetectadoOcr || 'No identificado'}</strong></div>
                  <div>
                    <span>Calidad de lectura</span>
                    <strong>
                      {formatReadingQuality(currentAbono.calidadLectura ?? currentAbono.confianzaOcr)}
                    </strong>
                  </div>
                  <div>
                    <span>Estado de revision</span>
                    <strong>{currentAbono.requiereRevisionManual ? 'Revision manual' : 'Pendiente de confirmacion'}</strong>
                  </div>
                  <div>
                    <span>Origen</span>
                    <strong>{formatPaymentOrigin(currentAbono)}</strong>
                  </div>
                </div>
                {currentAbono.requiereRevisionManual && <p>No pudimos leer completamente el comprobante. Revisa cada dato antes de confirmar.</p>}
              </section>

              {hasDefinitiveData && (
                <section className="abonos-detected-data">
                  <div className="abonos-review-section-title">
                    <div><span>Registro</span><h4>Datos definitivos existentes</h4></div>
                  </div>
                  <div className="abonos-detected-grid">
                    <div><span>Monto definitivo</span><strong>{formatMoney(definitiveData.monto)}</strong></div>
                    <div><span>Referencia definitiva</span><strong>{definitiveData.referencia || 'No especificada'}</strong></div>
                    <div><span>Fecha definitiva</span><strong>{definitiveData.fecha ? formatCalendarDate(definitiveData.fecha) : 'No especificada'}</strong></div>
                  </div>
                </section>
              )}

              <section className="abonos-confirm-data">
                <div className="abonos-review-section-title"><div><span>Confirmacion</span><h4>Datos que se confirmaran</h4></div></div>
                <label>
                  <span>Monto a confirmar *</span>
                  <input type="number" min="1" step="1" value={monto} onChange={event => setMonto(event.target.value)} disabled={isSubmitting} required />
                  <small>Confirma o corrige el monto antes de aprobar el abono.</small>
                </label>
                <div className="abonos-review-form-grid">
                  <label><span>Referencia</span><input value={referencia} onChange={event => setReferencia(event.target.value)} maxLength={255} disabled={isSubmitting} /></label>
                  <label><span>Fecha del pago</span><input type="date" value={fechaPago} onChange={event => setFechaPago(event.target.value)} disabled={isSubmitting} /></label>
                  <label><span>Metodo de pago *</span><select value={metodoPago} onChange={event => setMetodoPago(event.target.value)} disabled={isSubmitting} required><option value="TRANSFERENCIA">Transferencia</option><option value="EFECTIVO">Efectivo</option></select></label>
                </div>
                <label><span>Observaciones</span><textarea value={observaciones} onChange={event => setObservaciones(event.target.value)} maxLength={500} rows={2} disabled={isSubmitting} /></label>
              </section>
            </form>
          </div>
        </div>

        <footer className="abonos-review-footer">
          <button type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
          {canReject && <button type="button" className="danger" onClick={handleReject} disabled={isSubmitting || !canProcess}>Rechazar</button>}
          <button type="submit" form="review-payment-form" className="primary" disabled={isSubmitting || !canProcess}>
            {isSubmitting ? 'Confirmando...' : 'Confirmar abono'}
          </button>
        </footer>
      </div>
    </div>
  );
};
