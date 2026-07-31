import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Pagination } from '../../../../core/components/Pagination';
import { useDebounce } from '../../../../core/hooks/useDebounce';
import { usePagination } from '../../../../core/hooks/usePagination';
import { formatDate } from '../../../../core/utils/fechaFormato';
import { UserApiRepository } from '../../../users/infrastructure/user.repository';
import { useVentas } from '../application/useVentas';
import './VentasPage.css';

const styles = {
  pageContainer: 'ventas-page-container',
  headerWrapper: 'ventas-header-wrapper',
  breadcrumb: 'ventas-breadcrumb',
  pageTitle: 'ventas-page-title',
  pageSubtitle: 'ventas-page-subtitle',
  kpiGrid: 'ventas-kpi-grid',
  kpiCard: 'ventas-kpi-card',
  kpiCardTotal: 'ventas-kpi-card-total',
  kpiCardSuccess: 'ventas-kpi-card-success',
  kpiCardWarning: 'ventas-kpi-card-warning',
  kpiLabel: 'ventas-kpi-label',
  kpiValue: 'ventas-kpi-value',
  kpiValueTotal: 'ventas-kpi-value-total',
  kpiValueSuccess: 'ventas-kpi-value-success',
  kpiValueWarning: 'ventas-kpi-value-warning',
  filterSection: 'ventas-filter-section',
  filterField: 'ventas-filter-field',
  filterSearch: 'ventas-filter-search',
  filterDateGroup: 'ventas-filter-date-group',
  clearFiltersButton: 'ventas-clear-filters-button',
  searchInput: 'ventas-search-input',
  inputField: 'ventas-input-field',
  tableContainer: 'ventas-table-container',
  loadingText: 'ventas-loading-text',
  tableWrapper: 'ventas-table-wrapper',
  table: 'ventas-table',
  tableHeadRow: 'ventas-table-head-row',
  tableHeader: 'ventas-table-header',
  tableBodyRow: 'ventas-table-body-row',
  tableCellId: 'ventas-table-cell-id',
  tableCell: 'ventas-table-cell',
  clientName: 'ventas-client-name',
  clientEmail: 'ventas-client-email',
  statusBadge: 'ventas-status-badge',
  statusSuccess: 'ventas-status-success',
  statusWarning: 'ventas-status-warning',
  statusDanger: 'ventas-status-danger',
  techniqueList: 'ventas-technique-list',
  totalPrice: 'ventas-total-price',
  paidAmount: 'ventas-paid-amount',
  balanceAmount: 'ventas-balance-amount',
  pagination: 'ventas-pagination',
  paginationInfo: 'ventas-pagination-info',
  paginationControls: 'ventas-pagination-controls',
  paginationButton: 'ventas-pagination-button',
  paginationButtonActive: 'ventas-pagination-button-active',
};

const ESTADO_CLASS = {
  COMPLETO: styles.statusSuccess,
  COMPLETA: styles.statusSuccess,
  PARCIAL: styles.statusWarning,
  PENDIENTE: styles.statusDanger,
  ANULADA: styles.statusDanger,
};

const fmt = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;
const userRepository = new UserApiRepository();
let clientesPromise = null;

const getClientesActivos = () => {
  if (!clientesPromise) {
    clientesPromise = userRepository.list({ idRol: 3 })
      .then(data => data.filter(user => user.nombreRol === 'Cliente' && user.estado === true))
      .catch(error => {
        clientesPromise = null;
        throw error;
      });
  }

  return clientesPromise;
};

export const VentasPage = () => {
  const [filters, setFilters] = useState({
    search: '',
    fechaInicio: '',
    fechaFin: '',
    idCliente: '',
    estadoPago: '',
  });
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const debouncedSearch = useDebounce(filters.search, 350);

  const { ventas, resumen, loading, error, refetch } = useVentas({
    ...filters,
    search: debouncedSearch,
  });
  const ventasCompletas = ventas.filter(venta => venta.estadoPago === 'COMPLETO').length;
  const {
    currentPage,
    pageSize,
    paginatedItems,
    setCurrentPage,
    totalPages,
  } = usePagination(ventas);

  useEffect(() => {
    let isMounted = true;
    getClientesActivos()
      .then(data => {
        if (!isMounted) return;
        setClientes(data);
      })
      .catch(error => {
        console.error('Error al cargar clientes para ventas:', error);
        if (isMounted) setClientes([]);
      })
      .finally(() => {
        if (isMounted) setLoadingClientes(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const clearFilters = () => {
    setFilters({
      search: '',
      fechaInicio: '',
      fechaFin: '',
      idCliente: '',
      estadoPago: '',
    });
    setCurrentPage(1);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Ventas / Gestion</span>
          <h1 className={styles.pageTitle}>Gestion de Ventas</h1>
          <p className={styles.pageSubtitle}>
            Consulta una venta por pedido desde el primer abono confirmado.
          </p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.kpiCardTotal}`}>
          <span className={styles.kpiLabel}>Total ventas</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueTotal}`}>{fmt(resumen.totalVentas)}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Cantidad ventas</span>
          <span className={styles.kpiValue}>{resumen.cantidadVentas || ventas.length}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardSuccess}`}>
          <span className={styles.kpiLabel}>Completas</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueSuccess}`}>{resumen.ventasPagadasCompletas || ventasCompletas}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardWarning}`}>
          <span className={styles.kpiLabel}>Parciales</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueWarning}`}>{resumen.ventasPagadasParciales || ventas.filter(item => item.estado === 'PARCIAL').length}</span>
        </div>
      </div>

      <div className={styles.filterSection}>
        <label className={`${styles.filterField} ${styles.filterSearch}`}>
          <span>Buscar ventas</span>
          <input
            type="text"
            placeholder="Cliente, correo, documento o pedido..."
            value={filters.search}
            onChange={event => setFilters(prev => ({ ...prev, search: event.target.value }))}
            className={styles.searchInput}
          />
        </label>
        <label className={styles.filterDateGroup}>
          <span>Fecha inicio</span>
          <input
            type="date"
            value={filters.fechaInicio}
            onChange={event => setFilters(prev => ({ ...prev, fechaInicio: event.target.value }))}
            className={styles.inputField}
          />
        </label>
        <label className={styles.filterDateGroup}>
          <span>Fecha fin</span>
          <input
            type="date"
            value={filters.fechaFin}
            onChange={event => setFilters(prev => ({ ...prev, fechaFin: event.target.value }))}
            className={styles.inputField}
          />
        </label>
        <label className={styles.filterField}>
          <span>Cliente</span>
          <select
            value={filters.idCliente}
            onChange={event => setFilters(prev => ({ ...prev, idCliente: event.target.value }))}
            className={styles.inputField}
            disabled={loadingClientes}
          >
            <option value="">{loadingClientes ? 'Cargando clientes...' : 'Todos los clientes'}</option>
            {clientes.map(cliente => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre} - {cliente.correo}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filterField}>
          <span>Estado de pago</span>
          <select
            value={filters.estadoPago}
            onChange={event => setFilters(prev => ({ ...prev, estadoPago: event.target.value }))}
            className={styles.inputField}
          >
            <option value="">Todos los pagos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PARCIAL">Parcial</option>
            <option value="COMPLETO">Completo</option>
          </select>
        </label>
        <button type="button" className={styles.clearFiltersButton} onClick={clearFilters}>
          <RotateCcw size={15} />
          Limpiar
        </button>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando ventas...</p>
        ) : error && ventas.length === 0 ? (
          <div className={styles.loadingText}>
            <p>No fue posible cargar las ventas.</p>
            <button type="button" className={styles.clearFiltersButton} onClick={refetch}>
              Reintentar
            </button>
          </div>
        ) : ventas.length === 0 ? (
          <p className={styles.loadingText}>No se encontraron ventas finalizadas.</p>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeadRow}>
                    <th className={styles.tableHeader}>Pedido</th>
                    <th className={styles.tableHeader}>Cliente</th>
                    <th className={styles.tableHeader}>Contacto</th>
                    <th className={styles.tableHeader}>Total</th>
                    <th className={styles.tableHeader}>Pagado</th>
                    <th className={styles.tableHeader}>Saldo</th>
                    <th className={styles.tableHeader}>Venta</th>
                    <th className={styles.tableHeader}>Pago</th>
                    <th className={styles.tableHeader}>Primer pago</th>
                    <th className={styles.tableHeader}>Tecnicas</th>
                    <th className={styles.tableHeader}>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map(venta => (
                    <tr key={venta.idPedido} className={styles.tableBodyRow}>
                      <td className={styles.tableCellId}>#{venta.idPedido}</td>
                      <td className={styles.tableCell}>
                        <span className={styles.clientName}>{venta.nombreCliente || 'N/A'}</span>
                        <span className={styles.clientEmail}>Cliente #{venta.idCliente}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.clientName}>{venta.telefonoCliente || 'Sin telefono'}</span>
                        <span className={styles.clientEmail}>{venta.correoCliente || 'Sin correo'}</span>
                      </td>
                      <td className={styles.tableCell}><strong className={styles.totalPrice}>{fmt(venta.total)}</strong></td>
                      <td className={styles.tableCell}><span className={styles.paidAmount}>{fmt(venta.totalPagado)}</span></td>
                      <td className={styles.tableCell}><span className={Number(venta.saldoPendiente) > 0 ? styles.balanceAmount : styles.paidAmount}>{fmt(venta.saldoPendiente)}</span></td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.statusBadge} ${ESTADO_CLASS[venta.estado] || ''}`}>
                          {venta.estado || 'Sin venta'}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.statusBadge} ${ESTADO_CLASS[venta.estadoPago] || ''}`}>
                          {venta.estadoPago}
                        </span>
                      </td>
                      <td className={styles.tableCell}>{formatDate(venta.fechaPrimerPago)}</td>
                      <td className={styles.tableCell}>
                        <span className={styles.techniqueList}>
                          {venta.tecnicas?.length ? venta.tecnicas.map(tecnica => tecnica.nombre).join(', ') : 'Sin tecnica'}
                        </span>
                      </td>
                      <td className={styles.tableCell}>{venta.cantidadTotalProductos}</td>
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
              totalItems={ventas.length}
              totalPages={totalPages}
            />
          </>
        )}
      </div>
    </div>
  );
};
