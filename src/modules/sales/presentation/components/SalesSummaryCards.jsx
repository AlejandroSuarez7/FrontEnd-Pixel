import styles from './SalesSummaryCards.module.css';
import { formatCurrency } from '../../../../core/utils/formatters.js';

const SalesSummaryCards = ({ sales }) => {
  const totalSales = sales.length;
  const totalAmount = sales.reduce((sum, sale) => sum + sale.total, 0);
  const pending = sales.filter((sale) => sale.status === 'Pendiente').length;
  const paid = sales.filter((sale) => sale.status === 'Pagada').length;
  const canceled = sales.filter((sale) => sale.status === 'Anulada').length;

  return (
    <div className={styles.summaryGrid}>
      <article className={styles.summaryCard}>
        <p className={styles.cardLabel}>Ventas registradas</p>
        <strong>{totalSales}</strong>
      </article>
      <article className={styles.summaryCard}>
        <p className={styles.cardLabel}>Total facturado</p>
        <strong>{formatCurrency(totalAmount)}</strong>
      </article>
      <article className={styles.summaryCard}>
        <p className={styles.cardLabel}>Pendientes</p>
        <strong>{pending}</strong>
      </article>
      <article className={styles.summaryCard}>
        <p className={styles.cardLabel}>Anuladas</p>
        <strong>{canceled}</strong>
      </article>
    </div>
  );
};

export default SalesSummaryCards;
