import styles from './SalesFilters.module.css';

const paymentOptions = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata'];
const statusOptions = ['Pendiente', 'Pagada', 'Anulada'];

const SalesFilters = ({
  query,
  statusFilter,
  paymentFilter,
  onQueryChange,
  onStatusChange,
  onPaymentMethodChange,
  onCreateSale,
}) => {
  return (
    <div className={styles.filtersCard}>
      <div className={styles.topRow}>
        <h2>Filtrar ventas</h2>
        <button type="button" className={styles.addButton} onClick={onCreateSale}>
          + Nueva venta
        </button>
      </div>

      <div className={styles.filterRow}>
        <label className={styles.fieldGroup}>
          <span>Buscar</span>
          <input
            type="search"
            value={query}
            placeholder="Cliente o número de venta"
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>

        <label className={styles.fieldGroup}>
          <span>Estado</span>
          <select value={statusFilter} onChange={(event) => onStatusChange(event.target.value)}>
            <option value="">Todos</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.fieldGroup}>
          <span>Método pago</span>
          <select value={paymentFilter} onChange={(event) => onPaymentMethodChange(event.target.value)}>
            <option value="">Todos</option>
            {paymentOptions.map((payment) => (
              <option key={payment} value={payment}>
                {payment}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};

export default SalesFilters;
