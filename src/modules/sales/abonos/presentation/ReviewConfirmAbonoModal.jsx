/* eslint-disable react-hooks/set-state-in-effect */
import { Download, ExternalLink, FileText, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { createTemporaryObjectUrl } from '../../../../core/services/protectedFileService';
import { formatDate } from '../../../../core/utils/fechaFormato';
import { notifications } from '../../../../core/utils/notifications';
import { useConfirm } from '../../../../shared/components/ConfirmDialog/ConfirmProvider';
import { abonoRepository } from '../infrastructure/abono.repository';
import './AbonosPage.css';

const formatMoney = (value, fallback = 'No identificado') => (
  value === null || value === undefined || value === ''
    ? fallback
    : new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(value))
);

const toInputDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
};

const normalizeText = value => String(value || '').trim();

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

  useEffect(() => {
    if (!isOpen || !abono) return;
    setMonto(abono.monto ?? abono.montoDetectadoOcr ?? '');
    setReferencia(abono.referencia || abono.referenciaDetectadaOcr || '');
    setFechaPago(toInputDate(abono.fechaPago || abono.fechaDetectadaOcr));
    setMetodoPago(abono.metodoPago || 'TRANSFERENCIA');
    setObservaciones(abono.observaciones || '');
  }, [abono, isOpen]);

  useEffect(() => {
    if (!isOpen || !abono?.comprobanteDisponible) {
      setPreview(null);
      setPreviewError('');
      return undefined;
    }

    let active = true;
    let releaseUrl = null;
    setPreview(null);
    setPreviewError('');

    abonoRepository.getAdminReceipt(abono.idAbono)
      .then(({ blob, mimeType }) => {
        if (!active) return;
        const temporary = createTemporaryObjectUrl(blob);
        releaseUrl = temporary.revoke;
        setPreview({
          url: temporary.objectUrl,
          mimeType,
          fileName: abono.nombreOriginalComprobante || `comprobante-${abono.idAbono}`,
        });
      })
      .catch(error => {
        if (active) setPreviewError(error.message || 'Comprobante no disponible.');
      });

    return () => {
      active = false;
      releaseUrl?.();
    };
  }, [abono, isOpen]);

  const updatePayload = useMemo(() => {
    if (!abono) return null;
    const payload = {};
    const amountNumber = Number(monto);

    if (abono.monto == null || Number(abono.monto) !== amountNumber) payload.monto = amountNumber;
    if (normalizeText(abono.referencia) !== normalizeText(referencia)) payload.referencia = referencia;
    if (toInputDate(abono.fechaPago) !== fechaPago) payload.fechaPago = fechaPago;
    if (normalizeText(abono.metodoPago) !== normalizeText(metodoPago)) payload.metodoPago = metodoPago;
    if (normalizeText(abono.observaciones) !== normalizeText(observaciones)) payload.observaciones = observaciones;

    return payload;
  }, [abono, fechaPago, metodoPago, monto, observaciones, referencia]);

  if (!isOpen || !abono) return null;

  const pedido = abono.pedido || {};
  const cliente = pedido.cliente || {};
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
          await abonoRepository.update(abono.idAbono, updatePayload);
        }
        await abonoRepository.confirm(abono.idAbono, {
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
        notifications.error(error.message || 'No pudimos completar la confirmacion.');
      }
    });
  };

  const handleReject = async () => {
    const result = await confirm({
      title: 'Rechazar abono',
      message: `Indica el motivo para rechazar el abono #${abono.idAbono}.`,
      confirmText: 'Rechazar',
      variant: 'danger',
      input: true,
      inputPlaceholder: 'Motivo de rechazo',
      requiredInput: true,
    });
    if (!result.confirmed) return;

    await runLocked(async () => {
      try {
        await abonoRepository.reject(abono.idAbono, result.value);
        await onCompleted?.();
        notifications.success('Abono rechazado.');
        onClose();
      } catch (error) {
        notifications.error(error.message || 'No se pudo rechazar el abono.');
      }
    });
  };

  return (
    <div className="abonos-overlay">
      <div className="abonos-review-modal" role="dialog" aria-modal="true" aria-labelledby="review-payment-title">
        <header className="abonos-review-header">
          <div>
            <span className="abonos-breadcrumb">Pedido #{abono.idPedido}</span>
            <h3 id="review-payment-title">Revisar y confirmar abono</h3>
            <p>Verifica que los datos del comprobante sean correctos antes de confirmar el pago.</p>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Cerrar">
            <X size={19} />
          </button>
        </header>

        <div className="abonos-review-body">
          <section className="abonos-review-summary">
            <div><span>Pedido</span><strong>#{abono.idPedido}</strong></div>
            <div><span>Cliente</span><strong>{cliente.nombre || 'Cliente no especificado'}</strong></div>
            <div><span>Total</span><strong>{formatMoney(pedido.total)}</strong></div>
            <div><span>Confirmado</span><strong>{formatMoney(pedido.totalPagado, '$0')}</strong></div>
            <div><span>Saldo pendiente</span><strong>{formatMoney(pedido.saldoPendiente)}</strong></div>
            <div><span>Estado de pago</span><strong>{pedido.estadoPago || 'PENDIENTE'}</strong></div>
          </section>

          <div className="abonos-review-columns">
            <section className="abonos-review-receipt">
              <div className="abonos-review-section-title">
                <div><span>Comprobante</span><h4>Archivo enviado</h4></div>
                {abono.requiereRevisionManual && <strong>Revision manual</strong>}
              </div>

              {!abono.comprobanteDisponible && <p>Comprobante no disponible.</p>}
              {abono.comprobanteDisponible && !preview && !previewError && <p>Cargando comprobante...</p>}
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
                  <div><span>Monto detectado</span><strong>{formatMoney(abono.montoDetectadoOcr)}</strong></div>
                  <div><span>Referencia detectada</span><strong>{abono.referenciaDetectadaOcr || 'No identificada'}</strong></div>
                  <div><span>Fecha detectada</span><strong>{abono.fechaDetectadaOcr ? formatDate(abono.fechaDetectadaOcr) : 'No identificada'}</strong></div>
                  <div><span>Banco o plataforma</span><strong>{abono.bancoDetectadoOcr || 'No identificado'}</strong></div>
                </div>
                {abono.requiereRevisionManual && <p>No pudimos leer completamente el comprobante. Revisa cada dato antes de confirmar.</p>}
              </section>

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
          {canReject && <button type="button" className="danger" onClick={handleReject} disabled={isSubmitting}>Rechazar</button>}
          <button type="submit" form="review-payment-form" className="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Confirmando...' : 'Confirmar abono'}
          </button>
        </footer>
      </div>
    </div>
  );
};
