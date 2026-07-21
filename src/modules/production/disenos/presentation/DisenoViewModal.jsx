import { useEffect, useState } from 'react';
import { formatDate } from '../../../../core/utils/fechaFormato';
import './DisenosPage.css';

const styles = {
  overlay: 'disenos-overlay',
  modalContainer: 'disenos-modal-container',
  modalLg: 'disenos-modal-lg',
  modalHeader: 'disenos-modal-header',
  modalTitle: 'disenos-modal-title',
  modalSubtitle: 'disenos-modal-subtitle',
  modalCloseBtn: 'disenos-modal-close-btn',
  form: 'disenos-form',
  readOnlyGrid: 'disenos-read-only-grid',
  readOnlyItem: 'disenos-read-only-item',
  detailsInfoBox: 'disenos-details-info-box',
  imagePreview: 'disenos-image-preview',
  imagePreviewMedia: 'disenos-image-preview-media',
  imagePreviewLink: 'disenos-image-preview-link',
  totalBlock: 'disenos-total-block',
  totalBlockRow: 'disenos-total-block-row',
  grandTotal: 'disenos-grand-total',
  modalFooter: 'disenos-modal-footer',
  btnPrimary: 'disenos-btn-primary',
};

const fmt = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;
const normalizeStatus = (value = '') => String(value || '').toUpperCase();
const formatDesignOrigin = (origen = '') => {
  const value = normalizeStatus(origen);
  if (value === 'CLIENTE') return 'Enviado por cliente';
  if (value === 'ADMIN') return 'Admin';
  if (value === 'OTRO') return 'Otro';
  return 'Equipo PIXEL / Disenador';
};

export const DisenoViewModal = ({ isOpen, onClose, diseno }) => {
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    setPreviewError(false);
  }, [diseno?.idDiseno, diseno?.archivoUrl, isOpen]);

  if (!isOpen || !diseno) return null;
  const archivoUrl = diseno.archivoUrl?.trim();
  const clienteContacto = [diseno.pedido?.cliente?.correo, diseno.pedido?.cliente?.telefono].filter(Boolean).join(' | ');
  const clienteNombre = diseno.pedido?.cliente?.nombre || 'Cliente no especificado';
  const producto = diseno.pedido?.detalles?.[0]?.descripcion;
  const enviadoPorCliente = normalizeStatus(diseno.origenDiseno) === 'CLIENTE';

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalLg}`}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Diseno #{diseno.idDiseno}</h3>
            <p className={styles.modalSubtitle}>
              Pedido #{diseno.idPedido} | Cliente: {clienteNombre}
            </p>
            {clienteContacto && <p className={styles.modalSubtitle}>{clienteContacto}</p>}
          </div>
          <button onClick={onClose} className={styles.modalCloseBtn}>x</button>
        </div>

        <div className={styles.form}>
          <div className={styles.readOnlyGrid}>
            <div className={styles.readOnlyItem}>Estado<strong>{diseno.estado}</strong></div>
            <div className={styles.readOnlyItem}>Creado<strong>{formatDate(diseno.fechaCreacion)}</strong></div>
            <div className={styles.readOnlyItem}>Enviado<strong>{formatDate(diseno.fechaEnvio)}</strong></div>
            <div className={styles.readOnlyItem}>Recibido<strong>{formatDate(diseno.fechaRecepcion)}</strong></div>
            <div className={styles.readOnlyItem}>Aprobado<strong>{formatDate(diseno.fechaAprobacion)}</strong></div>
            <div className={styles.readOnlyItem}>Respuesta cliente<strong>{formatDate(diseno.fechaRespuestaCliente)}</strong></div>
          </div>

          <div className={styles.detailsInfoBox}>
            <strong>Origen del diseno:</strong> {formatDesignOrigin(diseno.origenDiseno)}
          </div>

          <div className={styles.detailsInfoBox}>
            <strong>Medio de recepcion:</strong> {diseno.medioRecepcion || 'No aplica'}
          </div>

          <div className={styles.detailsInfoBox}>
            <strong>Recibido por:</strong> {diseno.recibidoPor?.nombre || (diseno.recibidoPorId ? `Usuario #${diseno.recibidoPorId}` : 'No especificado')}
          </div>

          <div className={styles.detailsInfoBox}>
            <strong>Disenador:</strong> {enviadoPorCliente ? 'No aplica' : diseno.disenador?.nombre || 'Sin asignar'}
          </div>

          <div className={styles.detailsInfoBox}>
            <strong>Descripcion:</strong> {diseno.descripcion || (enviadoPorCliente ? 'Diseno enviado por el cliente' : 'Sin descripcion')}
          </div>
          {producto && (
            <div className={styles.detailsInfoBox}>
              <strong>Producto:</strong> {producto}
            </div>
          )}

          <div className={styles.detailsInfoBox}>
            <strong>Observaciones:</strong> {diseno.observaciones || 'Sin observaciones'}
          </div>

          <div className={styles.detailsInfoBox}>
            <strong>Observaciones del cliente:</strong> {diseno.observacionesCliente || 'Sin observaciones del cliente'}
          </div>

          {(diseno.medioRespuestaCliente || diseno.medioRespuesta || diseno.medioAprobacion || diseno.respuestaRegistradaPor) && (
            <div className={styles.detailsInfoBox}>
              <strong>Respuesta registrada:</strong>{' '}
              {[diseno.medioRespuestaCliente || diseno.medioRespuesta || diseno.medioAprobacion, diseno.respuestaRegistradaPor?.nombre]
                .filter(Boolean)
                .join(' | ') || 'Sin informacion adicional'}
            </div>
          )}

          <div className={styles.detailsInfoBox}>
            <strong>Archivo:</strong>{' '}
            {archivoUrl ? (
              <a href={archivoUrl} target="_blank" rel="noreferrer">
                Abrir archivo
              </a>
            ) : 'Sin archivo enviado'}
          </div>

          {archivoUrl && (
            <div className={styles.imagePreview}>
              {!previewError ? (
                <img
                  src={archivoUrl}
                  alt="Vista previa del diseno"
                  className={styles.imagePreviewMedia}
                  onError={() => setPreviewError(true)}
                />
              ) : (
                <div className={styles.detailsInfoBox}>
                  No se pudo previsualizar la imagen. Puedes abrir el archivo desde el enlace.
                </div>
              )}
              <a href={archivoUrl} target="_blank" rel="noreferrer" className={styles.imagePreviewLink}>
                Abrir archivo
              </a>
            </div>
          )}

          <div className={styles.totalBlock}>
            <div className={styles.totalBlockRow}>
              <span>Total pedido</span>
              <span>{fmt(diseno.pedido?.total)}</span>
            </div>
            <div className={styles.totalBlockRow}>
              <span>Estado pago</span>
              <span>{diseno.pedido?.estadoPago || 'N/A'}</span>
            </div>
            <div className={styles.grandTotal}>
              <span>Estado pedido</span>
              <span>{diseno.pedido?.estadoPedido || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnPrimary}>
            Cerrar ventana
          </button>
        </div>
      </div>
    </div>
  );
};
