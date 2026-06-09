import { useEffect, useState } from 'react';
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
  filterDateGroup: 'ventas-filter-date-group',
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
  pagination: 'ventas-pagination',
  paginationInfo: 'ventas-pagination-info',
  paginationControls: 'ventas-pagination-controls',
  paginationButton: 'ventas-pagination-button',
  paginationButtonActive: 'ventas-pagination-button-active',
};

const ESTADO_CLASS = {
  COMPLETO: styles.statusSuccess,
  PARCIAL: styles.statusWarning,
  PENDIENTE: styles.statusDanger,
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
  const [loadingClientes, setLoadingClientes] = useState(false);
  const debouncedSearch = useDebounce(filters.search, 350);

  const { ventas, resumen, loading } = useVentas({
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
    setLoadingClientes(true);
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

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Ventas / Gestion</span>
          <h1 className={styles.pageTitle}>Gestion de Ventas</h1>
          <p className={styles.pageSubtitle}>
            Consulta pedidos finalizados, pagos y resumen comercial.
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
      </div>

      <div className={styles.filterSection}>
        <input
          type="text"
          placeholder="Buscar por cliente, correo, documento o pedido..."
          value={filters.search}
          onChange={event => setFilters(prev => ({ ...prev, search: event.target.value }))}
          className={styles.searchInput}
        />
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
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando ventas...</p>
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
                    <th className={styles.tableHeader}>Pago</th>
                    <th className={styles.tableHeader}>Finalizado</th>
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
                      <td className={styles.tableCell}>{fmt(venta.totalPagado)}</td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.statusBadge} ${ESTADO_CLASS[venta.estadoPago] || ''}`}>
                          {venta.estadoPago}
                        </span>
                      </td>
                      <td className={styles.tableCell}>{formatDate(venta.fechaFinalizado)}</td>
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
