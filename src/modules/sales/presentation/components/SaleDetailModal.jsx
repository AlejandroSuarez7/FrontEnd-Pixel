import { formatCurrency, formatDateTime } from '../../../../core/utils/formatters.js';
import ModalWrapper from './ModalWrapper.jsx';
import styles from './SaleDetailModal.module.css';
import SaleStatusBadge from './SaleStatusBadge.jsx';

const SaleDetailModal = ({ open, sale, onClose, onDownload, onAnnul, currentUserEmail, statuses }) => {
  if (!sale) return null;

  return (
    <ModalWrapper open={open} title={`Detalle de venta ${sale.id}`} onClose={onClose}>
      <div className={styles.detailGrid}>
        <div className={styles.section}>
          <p className={styles.label}>Cliente</p>
          <strong>{sale.clientName}</strong>
        </div>
        <div className={styles.section}>
          <p className={styles.label}>Fecha</p>
          <strong>{formatDateTime(sale.saleDate)}</strong>
        </div>
        <div className={styles.section}>
          <p className={styles.label}>Método pago</p>
          <strong>{sale.paymentMethod}</strong>
        </div>
        <div className={styles.section}>
          <p className={styles.label}>Estado</p>
          <SaleStatusBadge status={sale.status} />
        </div>
        <div className={styles.section}>
          <p className={styles.label}>Responsable</p>
          <strong>{sale.responsible}</strong>
        </div>
      </div>

      <div className={styles.productsSection}>
        <h3>Productos vendidos</h3>
        <div className={styles.productsTable}>
          <div className={styles.productsHeader}>
            <span>Producto</span>
            <span>Técnica</span>
            <span>Cantidad</span>
            <span>Precio unit.</span>
            <span>Subtotal</span>
          </div>
          {sale.items.map((item) => (
            <div key={item.idProducto} className={styles.productRow}>
              <span>{item.nombreProducto}</span>
              <span>{item.tecnica}</span>
              <span>{item.quantity}</span>
              <span>{formatCurrency(item.unitPrice)}</span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.totalsSection}>
        <div>
          <p>Subtotal</p>
          <strong>{formatCurrency(sale.subtotal)}</strong>
        </div>
        <div>
          <p>IVA</p>
          <strong>{formatCurrency(sale.tax)}</strong>
        </div>
        <div>
          <p>Total</p>
          <strong>{formatCurrency(sale.total)}</strong>
        </div>
      </div>

      <div className={styles.notesSection}>
        <p className={styles.label}>Observaciones</p>
        <p>{sale.observations || 'Sin observaciones'}</p>
      </div>

      <div className={styles.historySection}>
        <h3>Historial</h3>
        {sale.history.length === 0 ? (
          <p>No hay movimientos registrados.</p>
        ) : (
          <ul>
            {sale.history.map((entry, index) => (
              <li key={`${entry.when}-${index}`}>
                <strong>{formatDateTime(entry.when)}</strong> — {entry.action} por {entry.by}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.actionsRow}>
        <button type="button" className={styles.outlineButton} onClick={() => onDownload(sale)}>
          Descargar PDF
        </button>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() => onAnnul(sale.id, currentUserEmail)}
          disabled={sale.status === statuses.CANCELED}
        >
          Anular venta
        </button>
      </div>
    </ModalWrapper>
  );
};

export default SaleDetailModal;
