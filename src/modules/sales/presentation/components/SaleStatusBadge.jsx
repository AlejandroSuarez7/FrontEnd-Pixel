import styles from './SaleStatusBadge.module.css';

const statusClassName = {
  Pendiente: styles.pending,
  Pagada: styles.paid,
  Anulada: styles.canceled,
};

const SaleStatusBadge = ({ status }) => {
  return <span className={`${styles.badge} ${statusClassName[status] || ''}`}>{status}</span>;
};

export default SaleStatusBadge;
