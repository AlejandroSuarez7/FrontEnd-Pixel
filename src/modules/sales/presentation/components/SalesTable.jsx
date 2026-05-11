import { formatCurrency, formatShortDate } from '../../../../core/utils/formatters.js';
import SaleStatusBadge from './SaleStatusBadge.jsx';
import styles from './SalesTable.module.css';

const SalesTable = ({ sales, isLoading, onView, onPdf, onAnnul, currentUserEmail }) => {
  if (isLoading) {
    return (
      <div className={styles.emptyState}>
        <strong>Cargando ventas...</strong>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className={styles.emptyState}>
        <strong>No se encontraron ventas</strong>
        <p>Utiliza los filtros para ver resultados o crea una nueva venta.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Número</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Método</th>
            <th>Estado</th>
            <th>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td>{sale.id}</td>
              <td>{sale.clientName}</td>
              <td>{formatShortDate(sale.saleDate)}</td>
              <td>{sale.paymentMethod}</td>
              <td>
                <SaleStatusBadge status={sale.status} />
              </td>
              <td>{formatCurrency(sale.total)}</td>
              <td className={styles.actionsCell}>
                <button type="button" className={styles.actionButton} onClick={() => onView(sale.id)}>
                  Ver
                </button>
                <button type="button" className={styles.actionButton} onClick={() => onPdf(sale)}>
                  PDF
                </button>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.cancelButton}`}
                  onClick={() => onAnnul(sale.id, currentUserEmail)}
                  disabled={sale.status === 'Anulada'}
                >
                  Anular
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SalesTable;
