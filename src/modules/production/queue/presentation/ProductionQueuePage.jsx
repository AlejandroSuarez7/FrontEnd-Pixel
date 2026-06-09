import { Pagination } from '../../../../core/components/Pagination';
import { usePagination } from '../../../../core/hooks/usePagination';
import { formatDate } from '../../../../core/utils/fechaFormato';
import { useProductionQueue } from '../application/useProductionQueue';
import './ProductionQueuePage.css';

const styles = {
  pageContainer: 'production-queue-page-container',
  headerWrapper: 'production-queue-header-wrapper',
  breadcrumb: 'production-queue-breadcrumb',
  pageTitle: 'production-queue-page-title',
  pageSubtitle: 'production-queue-page-subtitle',
  kpiGrid: 'production-queue-kpi-grid',
  kpiCard: 'production-queue-kpi-card',
  kpiCardInfo: 'production-queue-kpi-card-info',
  kpiCardSuccess: 'production-queue-kpi-card-success',
  kpiLabel: 'production-queue-kpi-label',
  kpiValue: 'production-queue-kpi-value',
  kpiValueInfo: 'production-queue-kpi-value-info',
  kpiValueSuccess: 'production-queue-kpi-value-success',
  tableContainer: 'production-queue-table-container',
  loadingText: 'production-queue-loading-text',
  tableWrapper: 'production-queue-table-wrapper',
  table: 'production-queue-table',
  tableHeadRow: 'production-queue-table-head-row',
  tableHeader: 'production-queue-table-header',
  tableBodyRow: 'production-queue-table-body-row',
  tableCellId: 'production-queue-table-cell-id',
  tableCell: 'production-queue-table-cell',
  clientName: 'production-queue-client-name',
  clientEmail: 'production-queue-client-email',
  statusBadge: 'production-queue-status-badge',
  statusInfo: 'production-queue-status-info',
  totalPrice: 'production-queue-total-price',
  pagination: 'production-queue-pagination',
  paginationInfo: 'production-queue-pagination-info',
  paginationControls: 'production-queue-pagination-controls',
  paginationButton: 'production-queue-pagination-button',
  paginationButtonActive: 'production-queue-pagination-button-active',
};

const fmt = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;

export const ProductionQueuePage = () => {
  const { pedidos, loading } = useProductionQueue();
  const {
    currentPage,
    pageSize,
    paginatedItems,
    setCurrentPage,
    totalPages,
  } = usePagination(pedidos);

  const total = pedidos.length;
  const alDia = pedidos.filter(pedido => Number(pedido.saldoPendiente || 0) === 0).length;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Produccion / Cola</span>
          <h1 className={styles.pageTitle}>Cola de Produccion</h1>
          <p className={styles.pageSubtitle}>
            Pedidos en proceso ordenados por llegada a produccion.
          </p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.kpiCardInfo}`}>
          <span className={styles.kpiLabel}>En cola</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueInfo}`}>{total}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardSuccess}`}>
          <span className={styles.kpiLabel}>Pagados</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueSuccess}`}>{alDia}</span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando cola de produccion...</p>
        ) : pedidos.length === 0 ? (
          <p className={styles.loadingText}>No hay pedidos en proceso actualmente.</p>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeadRow}>
                    <th className={styles.tableHeader}>Posicion</th>
                    <th className={styles.tableHeader}>Pedido</th>
                    <th className={styles.tableHeader}>Cliente</th>
                    <th className={styles.tableHeader}>Ingreso</th>
                    <th className={styles.tableHeader}>Entrega estimada</th>
                    <th className={styles.tableHeader}>Total</th>
                    <th className={styles.tableHeader}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((pedido, index) => (
                    <tr key={pedido.idPedido} className={styles.tableBodyRow}>
                      <td className={styles.tableCellId}>#{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.statusBadge} ${styles.statusInfo}`}>
                          Pedido #{pedido.idPedido}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.clientName}>{pedido.cliente?.nombre || 'N/A'}</span>
                        <span className={styles.clientEmail}>{pedido.cliente?.correo || ''}</span>
                      </td>
                      <td className={styles.tableCell}>{formatDate(pedido.fechaIngresoProduccion)}</td>
                      <td className={styles.tableCell}>{pedido.fechaEntregaEstimada || '--'}</td>
                      <td className={styles.tableCell}>
                        <strong className={styles.totalPrice}>{fmt(pedido.total)}</strong>
                      </td>
                      <td className={styles.tableCell}>{fmt(pedido.saldoPendiente)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              classNames={styles}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              totalItems={pedidos.length}
              totalPages={totalPages}
            />
          </>
        )}
      </div>
    </div>
  );
};
