import { useCallback, useState } from 'react';
import { formatDate } from '../../../../core/utils/fechaFormato';
import { abonoRepository } from '../infrastructure/abono.repository';
import { ReceiptPreviewModal } from './ReceiptPreviewModal';
import './AbonosPage.css';

const styles = {
  overlay: 'abonos-overlay',
  modalContainer: 'abonos-modal-container',
  modalLg: 'abonos-modal-lg',
  modalHeader: 'abonos-modal-header',
  modalTitle: 'abonos-modal-title',
  modalSubtitle: 'abonos-modal-subtitle',
  modalCloseBtn: 'abonos-modal-close-btn',
  form: 'abonos-form',
  readOnlyGrid: 'abonos-read-only-grid',
  readOnlyItem: 'abonos-read-only-item',
  detailsInfoBox: 'abonos-details-info-box',
  totalBlock: 'abonos-total-block',
  totalBlockRow: 'abonos-total-block-row',
  grandTotal: 'abonos-grand-total',
  modalFooter: 'abonos-modal-footer',
  btnPrimary: 'abonos-btn-primary',
};

const fmt = (value, fallback = 'Pendiente de revision') => (
  value === null || value === undefined || value === '' || !Number.isFinite(Number(value))
    ? fallback
    : `$${Number(value).toLocaleString('es-CO')}`
);

export const AbonoViewModal = ({ isOpen, onClose, abono }) => {
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const loadReceipt = useCallback(
    () => abonoRepository.getAdminReceipt(abono?.idAbono),
    [abono?.idAbono],
  );

  if (!isOpen || !abono) return null;
  const clienteContacto = [abono.pedido?.cliente?.correo, abono.pedido?.cliente?.telefono].filter(Boolean).join(' | ');
  const clienteNombre = abono.pedido?.cliente?.nombre || 'Cliente no especificado';

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalLg}`}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Abono #{abono.idAbono}</h3>
            <p className={styles.modalSubtitle}>
              Pedido #{abono.idPedido} | Cliente: {clienteNombre}
            </p>
            {clienteContacto && <p className={styles.modalSubtitle}>{clienteContacto}</p>}
          </div>
          <button onClick={onClose} className={styles.modalCloseBtn}>x</button>
        </div>

        <div className={styles.form}>
          <div className={styles.readOnlyGrid}>
            <div className={styles.readOnlyItem}>Estado<strong>{abono.estado}</strong></div>
            <div className={styles.readOnlyItem}>Monto final<strong>{fmt(abono.monto)}</strong></div>
            <div className={styles.readOnlyItem}>Monto detectado<strong>{fmt(abono.montoDetectadoOcr)}</strong></div>
            <div className={styles.readOnlyItem}>Metodo<strong>{abono.metodoPago}</strong></div>
            <div className={styles.readOnlyItem}>Creado<strong>{formatDate(abono.fechaCreacion)}</strong></div>
            <div className={styles.readOnlyItem}>Confirmado<strong>{formatDate(abono.fechaConfirmacion)}</strong></div>
            <div className={styles.readOnlyItem}>Rechazado<strong>{formatDate(abono.fechaRechazo)}</strong></div>
          </div>

          <div className={styles.detailsInfoBox}>
            <strong>Referencia final:</strong> {abono.referencia || 'Pendiente de revision'}
          </div>

          <div className={styles.detailsInfoBox}>
            <strong>Datos detectados:</strong>{' '}
            {[abono.referenciaDetectadaOcr, abono.bancoDetectadoOcr, formatDate(abono.fechaDetectadaOcr)]
              .filter(Boolean)
              .join(' | ') || 'Sin datos detectados'}
          </div>

          <div className={styles.detailsInfoBox}>
            <strong>Revision:</strong>{' '}
            {abono.requiereRevisionManual ? 'Requiere revision manual' : 'Datos disponibles para revision'}
          </div>

          <div className={styles.detailsInfoBox}>
            <strong>Comprobante:</strong>{' '}
            {abono.comprobanteDisponible ? (
              <button type="button" className={styles.btnSecondary} onClick={() => setIsReceiptOpen(true)}>
                Ver comprobante
              </button>
            ) : 'Comprobante no disponible'}
          </div>

          {abono.motivoRechazo && (
            <div className={styles.detailsInfoBox}>
              <strong>Motivo de rechazo:</strong> {abono.motivoRechazo}
            </div>
          )}

          <div className={styles.totalBlock}>
            <div className={styles.totalBlockRow}>
              <span>Total pedido</span>
              <span>{fmt(abono.pedido?.total)}</span>
            </div>
            <div className={styles.totalBlockRow}>
              <span>Total pagado</span>
              <span>{fmt(abono.pedido?.totalPagado)}</span>
            </div>
            <div className={styles.grandTotal}>
              <span>Saldo pendiente</span>
              <span>{fmt(abono.pedido?.saldoPendiente)}</span>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnPrimary}>
            Cerrar ventana
          </button>
        </div>
      </div>
      <ReceiptPreviewModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        loadReceipt={loadReceipt}
        title={`Comprobante del abono #${abono.idAbono}`}
      />
    </div>
  );
};
