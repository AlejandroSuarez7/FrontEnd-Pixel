import { useEffect, useState } from 'react';
import { formatDate } from '../../../../core/utils/fechaFormato';
import { getProductCategoryName } from '../../../../core/utils/productCategory';
import {
  formatMoneyCOP,
  getQuoteDiscountTotal,
  getQuoteSubtotalBruto,
  getQuoteTotal,
} from '../../../../core/utils/formatters';
import './DisenosPage.css';

const styles = {
  overlay: 'disenos-overlay',
  modalContainer: 'disenos-modal-container',
  modalLg: 'disenos-modal-lg',
  modalHeader: 'disenos-modal-header',
  modalTitle: 'disenos-modal-title',
  modalSubtitle: 'disenos-modal-subtitle',
  modalCloseBtn: 'disenos-modal-close-btn',
  imagePreview: 'disenos-image-preview',
  imagePreviewMedia: 'disenos-image-preview-media',
  imagePreviewLink: 'disenos-image-preview-link',
  btnPrimary: 'disenos-btn-primary',
  btnSecondary: 'disenos-btn-secondary',
};

const normalizeStatus = (value = '') => String(value || '').toUpperCase();
const formatDesignOrigin = (origen = '') => {
  const value = normalizeStatus(origen);
  if (value === 'CLIENTE') return 'Diseno enviado por el cliente';
  if (value === 'OTRO') return 'Otro origen';
  return 'Equipo PIXEL / Disenador';
};

const formatStatus = (status = '') => ({
  PENDIENTE: 'Pendiente',
  ENVIADO: 'Enviado para revision',
  PENDIENTE_APROBACION: 'Pendiente de aprobacion',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Cambios solicitados',
}[normalizeStatus(status)] || status || 'Sin estado');

const safeDate = (value) => value ? formatDate(value) : 'No registrada';
const isWaitingResponse = (status) => ['ENVIADO', 'PENDIENTE_APROBACION', 'PENDIENTE_DE_APROBACION', 'POR_APROBAR'].includes(normalizeStatus(status));
const getDesignProductName = (diseno) => {
  if (diseno?.esDisenoGeneral) return 'Diseno general del pedido';
  const detalle = diseno?.detallePedido;
  return detalle?.producto?.nombre || detalle?.descripcion || diseno?.descripcion || diseno?.pedido?.detalles?.[0]?.descripcion || 'Producto no especificado';
};
const getDesignTechniqueName = (diseno) => {
  const detalle = diseno?.detallePedido;
  return detalle?.tecnica?.nombre || (detalle?.idTecnica ? `Tecnica #${detalle.idTecnica}` : 'No especificada');
};

export const DisenoViewModal = ({
  isOpen,
  onClose,
  diseno,
  onApprove,
  onReject,
  pendingAction = false,
}) => {
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    setPreviewError(false);
  }, [diseno?.idDiseno, diseno?.archivoUrl, isOpen]);

  if (!isOpen || !diseno) return null;

  const archivoUrl = diseno.archivoUrl?.trim();
  const estado = normalizeStatus(diseno.estado);
  const enviadoPorCliente = normalizeStatus(diseno.origenDiseno) === 'CLIENTE';
  const clienteNombre = diseno.pedido?.cliente?.nombre || 'Cliente no especificado';
  const clienteContacto = [diseno.pedido?.cliente?.correo, diseno.pedido?.cliente?.telefono].filter(Boolean).join(' | ');
  const producto = getDesignProductName(diseno);
  const detallePedido = diseno.detallePedido;
  const resumenCotizacion = diseno.pedido?.cotizacion || diseno.cotizacion || diseno.pedido || {};
  const subtotal = getQuoteSubtotalBruto(resumenCotizacion);
  const descuentoTotal = getQuoteDiscountTotal(resumenCotizacion);
  const costosAdicionales = Number(resumenCotizacion.costosAdicionales ?? 0);
  const total = getQuoteTotal({ ...resumenCotizacion, total: resumenCotizacion.total ?? diseno.pedido?.total });
  const puedeResponder = isWaitingResponse(estado) && (onApprove || onReject);

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalLg} disenos-view-modal`}>
        <div className={styles.modalHeader}>
          <div>
            <div className="disenos-view-heading-row">
              <h3 className={styles.modalTitle}>Diseno #{diseno.idDiseno}</h3>
              <span className={`disenos-view-status disenos-view-status-${estado.toLowerCase()}`}>{formatStatus(estado)}</span>
            </div>
            <p className={styles.modalSubtitle}>Pedido #{diseno.idPedido} | {clienteNombre}</p>
            {clienteContacto && <p className={styles.modalSubtitle}>{clienteContacto}</p>}
          </div>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn} aria-label="Cerrar detalle">x</button>
        </div>

        <div className="disenos-view-content">
          <section className="disenos-view-summary" aria-label="Resumen del diseno">
            <div><span>Estado</span><strong>{formatStatus(estado)}</strong></div>
            <div><span>Enviado</span><strong>{safeDate(diseno.fechaEnvio)}</strong></div>
            <div><span>Respuesta</span><strong>{safeDate(diseno.fechaRespuestaCliente)}</strong></div>
            <div><span>Origen</span><strong>{enviadoPorCliente ? 'Cliente' : 'Equipo PIXEL'}</strong></div>
            <div><span>Alcance</span><strong>{diseno.esDisenoGeneral ? 'Todo el pedido' : 'Producto especifico'}</strong></div>
          </section>

          <section className="disenos-view-design-grid">
            <div className="disenos-view-preview-column">
              <span className="disenos-view-section-label">Diseno enviado</span>
              {archivoUrl ? (
                <div className={styles.imagePreview}>
                  {!previewError ? (
                    <img
                      src={archivoUrl}
                      alt={`Vista previa del diseno ${diseno.idDiseno}`}
                      className={styles.imagePreviewMedia}
                      onError={() => setPreviewError(true)}
                    />
                  ) : (
                    <div className="disenos-view-file-empty">No fue posible previsualizar este archivo.</div>
                  )}
                  <a href={archivoUrl} target="_blank" rel="noreferrer" className={styles.imagePreviewLink}>Abrir diseno</a>
                </div>
              ) : (
                <div className="disenos-view-file-empty">Archivo no disponible.</div>
              )}
            </div>

            <div className="disenos-view-info-column">
              <div className="disenos-view-info-block">
                <span className="disenos-view-section-label">Producto</span>
                <strong>{producto}</strong>
                <p>Categoria: {getProductCategoryName(detallePedido || {})}</p>
                {diseno.esDisenoGeneral && <p>Aplica para todo el pedido.</p>}
                {!diseno.esDisenoGeneral && detallePedido && (
                  <p>
                    Tecnica: {getDesignTechniqueName(diseno)}
                    {detallePedido.cantidad ? ` | Cant. ${detallePedido.cantidad}` : ''}
                    {detallePedido.requiereDiseno === false ? ' | No requiere diseno' : ''}
                  </p>
                )}
                {diseno.descripcion && diseno.descripcion !== producto && <p>{diseno.descripcion}</p>}
              </div>
              <div className="disenos-view-info-block">
                <span className="disenos-view-section-label">Origen del diseno</span>
                <strong>{formatDesignOrigin(diseno.origenDiseno)}</strong>
                <p>Medio: {diseno.medioRecepcion || 'No aplica'}</p>
              </div>
              <div className="disenos-view-info-block">
                <span className="disenos-view-section-label">Responsable</span>
                <strong>{enviadoPorCliente ? 'Diseno enviado por el cliente' : diseno.disenador?.nombre || 'Sin asignar'}</strong>
                {!enviadoPorCliente && diseno.recibidoPor?.nombre && <p>Recibido por: {diseno.recibidoPor.nombre}</p>}
              </div>
            </div>
          </section>

          <section className="disenos-view-observations">
            <div>
              <span className="disenos-view-section-label">Observaciones del equipo</span>
              <p>{diseno.observaciones || 'Sin observaciones'}</p>
            </div>
            <div>
              <span className="disenos-view-section-label">Observaciones del cliente</span>
              <p>{diseno.observacionesCliente || 'Sin observaciones'}</p>
            </div>
            {(diseno.respuestaRegistradaPor?.nombre || diseno.medioRespuestaCliente || diseno.medioRespuesta || diseno.medioAprobacion) && (
              <div>
                <span className="disenos-view-section-label">Respuesta registrada por</span>
                <p>{[diseno.respuestaRegistradaPor?.nombre, diseno.medioRespuestaCliente || diseno.medioRespuesta || diseno.medioAprobacion].filter(Boolean).join(' | ')}</p>
              </div>
            )}
          </section>

          <section className="disenos-view-price-summary" aria-label="Resumen de la cotizacion">
            <span>Subtotal: <strong>{formatMoneyCOP(subtotal)}</strong></span>
            <span>Descuento: <strong>{descuentoTotal > 0 ? `-${formatMoneyCOP(descuentoTotal)}` : 'Sin descuento'}</strong></span>
            <span>Adicionales: <strong>{formatMoneyCOP(costosAdicionales)}</strong></span>
            <span className="disenos-view-total">Total: <strong>{formatMoneyCOP(total)}</strong></span>
          </section>

          {estado === 'APROBADO' && <p className="disenos-view-state-message success">Este diseno ya fue aprobado.</p>}
          {estado === 'RECHAZADO' && <p className="disenos-view-state-message warning">Se solicitaron correcciones. Revisa las observaciones del cliente.</p>}
        </div>

        <div className="disenos-modal-footer disenos-view-footer">
          {puedeResponder && onReject && (
            <button type="button" className={styles.btnSecondary} onClick={onReject} disabled={pendingAction}>
              {pendingAction ? 'Procesando...' : 'Solicitar cambios'}
            </button>
          )}
          {puedeResponder && onApprove && (
            <button type="button" className={styles.btnPrimary} onClick={onApprove} disabled={pendingAction}>
              {pendingAction ? 'Procesando...' : 'Aprobar diseno'}
            </button>
          )}
          <button type="button" onClick={onClose} className={puedeResponder ? styles.btnSecondary : styles.btnPrimary} disabled={pendingAction}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
