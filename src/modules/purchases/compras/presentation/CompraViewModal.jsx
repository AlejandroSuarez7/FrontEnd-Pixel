import { formatDate } from '../../../../core/utils/fechaFormato';
import './ComprasPage.css';

const styles = {
  overlay: 'compras-overlay',
  modalContainer: 'compras-modal-container',
  modalLg: 'compras-modal-lg',
  modalHeader: 'compras-modal-header',
  modalTitle: 'compras-modal-title',
  modalCloseBtn: 'compras-modal-close-btn',
  form: 'compras-form',
  readOnlyGrid: 'compras-read-only-grid',
  readOnlyItem: 'compras-read-only-item',
  detailsInfoBox: 'compras-details-info-box',
  table: 'compras-table',
  tableHeadRow: 'compras-table-head-row',
  tableHeader: 'compras-table-header',
  tableBodyRow: 'compras-table-body-row',
  tableCell: 'compras-table-cell',
  totalBlock: 'compras-total-block',
  totalBlockRow: 'compras-total-block-row',
  grandTotal: 'compras-grand-total',
  modalFooter: 'compras-modal-footer',
  btnPrimary: 'compras-btn-primary',
};

const fmt = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;

export const CompraViewModal = ({ isOpen, onClose, compra, isDesigner }) => {
  if (!isOpen || !compra) return null;

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalLg}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Compra #{compra.idCompra}</h3>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn}>x</button>
        </div>

        <div className={styles.form}>
          <div className={styles.readOnlyGrid}>
            <div className={styles.readOnlyItem}>Pedido<strong>#{compra.idPedido}</strong></div>
            <div className={styles.readOnlyItem}>Estado<strong>{compra.estado}</strong></div>
            <div className={styles.readOnlyItem}>Fecha<strong>{formatDate(compra.fechaCompra)}</strong></div>
            {!isDesigner && <div className={styles.readOnlyItem}>Proveedor<strong>{compra.proveedor?.nombre || 'N/A'}</strong></div>}
            {!isDesigner && <div className={styles.readOnlyItem}>Comprador<strong>{compra.compradoPor?.nombre || 'N/A'}</strong></div>}
          </div>

          <div className={styles.detailsInfoBox}>
            <strong>Observaciones:</strong> {compra.observaciones || 'Sin observaciones'}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeader}>Insumo</th>
                  <th className={styles.tableHeader}>Cantidad</th>
                  {!isDesigner && <th className={styles.tableHeader}>Costo unit.</th>}
                  {!isDesigner && <th className={styles.tableHeader}>Subtotal</th>}
                </tr>
              </thead>
              <tbody>
                {compra.detalles.map(detalle => (
                  <tr key={detalle.idDetalleCompra || detalle.descripcionInsumo} className={styles.tableBodyRow}>
                    <td className={styles.tableCell}>{detalle.descripcionInsumo}</td>
                    <td className={styles.tableCell}>{detalle.cantidad}</td>
                    {!isDesigner && <td className={styles.tableCell}>{fmt(detalle.costoUnitario)}</td>}
                    {!isDesigner && <td className={styles.tableCell}>{fmt(detalle.subtotal)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isDesigner && (
            <div className={styles.totalBlock}>
              <div className={styles.totalBlockRow}><span>Total compra</span><span>{fmt(compra.total)}</span></div>
              <div className={styles.grandTotal}><span>Estado</span><span>{compra.estado}</span></div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.btnPrimary}>Cerrar ventana</button>
        </div>
      </div>
    </div>
  );
};
