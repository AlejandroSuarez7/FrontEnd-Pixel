/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Pagination } from '../../../../core/components/Pagination';
import { useDebounce } from '../../../../core/hooks/useDebounce';
import { notifications } from '../../../../core/utils/notifications';
import { DEFAULT_PAGE_SIZE } from '../../../../core/utils/serverPagination';
import { useConfirm } from '../../../../shared/components/ConfirmDialog/ConfirmProvider';
import { TableActions } from '../../../../shared/components/TableActions/TableActions';
import { useAuth } from '../../../../store/AuthContext';
import { clientRepository } from '../../../users/infrastructure/client.repository';
import { useAbonos } from '../application/useAbonos';
import { AbonoModal } from './AbonoModal';
import { AbonoViewModal } from './AbonoViewModal';
import { ReviewConfirmAbonoModal } from './ReviewConfirmAbonoModal';
import { formatDate } from '../../../../core/utils/fechaFormato';
import './AbonosPage.css';

const styles = {
  pageContainer: 'abonos-page-container',
  headerWrapper: 'abonos-header-wrapper',
  breadcrumb: 'abonos-breadcrumb',
  pageTitle: 'abonos-page-title',
  pageSubtitle: 'abonos-page-subtitle',
  primaryButton: 'abonos-primary-button',
  kpiGrid: 'abonos-kpi-grid',
  kpiCard: 'abonos-kpi-card',
  kpiCardWarning: 'abonos-kpi-card-warning',
  kpiCardSuccess: 'abonos-kpi-card-success',
  kpiCardDanger: 'abonos-kpi-card-danger',
  kpiLabel: 'abonos-kpi-label',
  kpiValue: 'abonos-kpi-value',
  kpiValueWarning: 'abonos-kpi-value-warning',
  kpiValueSuccess: 'abonos-kpi-value-success',
  kpiValueDanger: 'abonos-kpi-value-danger',
  filterSection: 'abonos-filter-section',
  filterGrid: 'abonos-filter-grid',
  filterField: 'abonos-filter-field',
  filterFieldSearch: 'abonos-filter-field-search',
  filterFieldClient: 'abonos-filter-field-client',
  filterFieldOrder: 'abonos-filter-field-order',
  clientControls: 'abonos-client-controls',
  filterActions: 'abonos-filter-actions',
  clearFiltersButton: 'abonos-clear-filters-button',
  searchInput: 'abonos-search-input',
  inputField: 'abonos-input-field',
  tableContainer: 'abonos-table-container',
  loadingText: 'abonos-loading-text',
  tableWrapper: 'abonos-table-wrapper',
  table: 'abonos-table',
  tableHeadRow: 'abonos-table-head-row',
  tableHeader: 'abonos-table-header',
  tableBodyRow: 'abonos-table-body-row',
  tableCellId: 'abonos-table-cell-id',
  tableCell: 'abonos-table-cell',
  statusBadge: 'abonos-status-badge',
  estadoPagoParcial: 'abonos-status-warning',
  estadoPagoCompleto: 'abonos-status-success',
  estadoPagoPendiente: 'abonos-status-danger',
  actionsCell: 'abonos-actions-cell',
  actionBtn: 'abonos-action-btn',
  actionBtnProcess: 'abonos-action-btn-process',
  actionBtnEdit: 'abonos-action-btn-edit',
  actionBtnCancel: 'abonos-action-btn-cancel',
  actionBtnView: 'abonos-action-btn-view',
  actionDivider: 'abonos-action-divider',
  pagination: 'abonos-pagination',
  paginationInfo: 'abonos-pagination-info',
  paginationControls: 'abonos-pagination-controls',
  paginationButton: 'abonos-pagination-button',
  paginationButtonActive: 'abonos-pagination-button-active',
};

const ESTADO_CLASS = {
  PENDIENTE: styles.estadoPagoParcial,
  CONFIRMADO: styles.estadoPagoCompleto,
  RECHAZADO: styles.estadoPagoPendiente,
};

const fmt = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;
const getClienteNombre = (cliente) => cliente?.nombre || 'Cliente no especificado';
const getClienteContacto = (cliente) => [cliente?.correo, cliente?.telefono].filter(Boolean).join(' | ');

export const AbonosPage = () => {
  const { hasPermission } = useAuth();
  const confirm = useConfirm();
  const session = JSON.parse(localStorage.getItem('pixel_user') || '{}');
  const userRole = session?.rol?.nombre || 'Cliente';
  const isStaff = userRole === 'Admin' || userRole === 'Secretaria';

  const [filters, setFilters] = useState({ search: '', idCliente: '', idPedido: '', estado: '', metodoPago: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [clientOrders, setClientOrders] = useState([]);
  const [loadingClientOrders, setLoadingClientOrders] = useState(false);
  const [selectedAbono, setSelectedAbono] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [reviewAbono, setReviewAbono] = useState(null);
  const debouncedSearch = useDebounce(filters.search, 350);

  const {
    abonos,
    loading,
    error,
    paginationMeta,
    refetch,
    handleCreate,
    handleUpdate,
    handleReject,
    handleDelete,
    getPedido,
    getAbonosByPedido,
    getPedidos,
  } = useAbonos({
    page: currentPage,
    limit: DEFAULT_PAGE_SIZE,
    search: debouncedSearch,
    idCliente: filters.idCliente,
    idPedido: filters.idPedido,
    estado: filters.estado,
    metodoPago: filters.metodoPago,
    sortBy: 'idAbono',
    order: 'desc',
  });

  useEffect(() => {
    if (!isStaff) return;
    const timer = window.setTimeout(() => {
      clientRepository.list({
        page: 1,
        limit: 10,
        search: clientSearch,
        sortBy: 'nombre',
        order: 'asc',
      })
        .then(result => setClients(result.items))
        .catch(() => setClients([]));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [isStaff, clientSearch]);

  useEffect(() => {
    if (!filters.idCliente) {
      setClientOrders([]);
      return;
    }
    setLoadingClientOrders(true);
    clientRepository.listOrders(filters.idCliente)
      .then(setClientOrders)
      .catch((requestError) => {
        setClientOrders([]);
        notifications.error(requestError.message || 'No se pudieron cargar los pedidos del cliente.');
      })
      .finally(() => setLoadingClientOrders(false));
  }, [filters.idCliente]);

  const total = paginationMeta.total;
  const pendientes = abonos.filter(item => item.estado === 'PENDIENTE').length;
  const confirmados = abonos.filter(item => item.estado === 'CONFIRMADO').length;
  const rechazados = abonos.filter(item => item.estado === 'RECHAZADO').length;

  const updateFilter = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'idCliente' ? { idPedido: '' } : {}),
    }));
    setCurrentPage(1);
  };

  const handleOpenCreate = () => {
    setSelectedAbono(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (abono) => {
    setSelectedAbono(abono);
    setIsModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (selectedAbono) {
      await handleUpdate(selectedAbono.idAbono, payload);
    } else {
      await handleCreate(payload);
    }
    setIsModalOpen(false);
    setSelectedAbono(null);
  };

  const onRejectClick = async (abono) => {
    const result = await confirm({
      title: 'Rechazar abono',
      message: `Indica el motivo para rechazar el abono #${abono.idAbono}.`,
      confirmText: 'Rechazar',
      variant: 'danger',
      input: true,
      inputPlaceholder: 'Motivo de rechazo',
      requiredInput: true,
    });

    if (!result.confirmed) return;

    try {
      await handleReject(abono.idAbono, result.value);
      notifications.success('Abono rechazado correctamente.');
    } catch (error) {
      notifications.error(error.message || 'No se pudo rechazar el abono.');
    }
  };

  const onDeleteClick = async (abono) => {
    const accepted = await confirm({
      title: 'Eliminar abono',
      message: `Eliminar abono pendiente #${abono.idAbono}?`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });

    if (!accepted) return;

    try {
      await handleDelete(abono.idAbono);
      notifications.success('Abono eliminado correctamente.');
    } catch (error) {
      notifications.error(error.message || 'No se pudo eliminar el abono.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Ventas / Abonos</span>
          <h1 className={styles.pageTitle}>Gestion de Abonos</h1>
          <p className={styles.pageSubtitle}>
            Registra, revisa y confirma los pagos asociados a pedidos.
          </p>
        </div>
        {hasPermission('abonos.crear') && (
          <button onClick={handleOpenCreate} className={styles.primaryButton}>
            Nuevo abono
          </button>
        )}
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Total</span><span className={styles.kpiValue}>{total}</span></div>
        <div className={`${styles.kpiCard} ${styles.kpiCardWarning}`}><span className={styles.kpiLabel}>Pendientes</span><span className={`${styles.kpiValue} ${styles.kpiValueWarning}`}>{pendientes}</span></div>
        <div className={`${styles.kpiCard} ${styles.kpiCardSuccess}`}><span className={styles.kpiLabel}>Confirmados</span><span className={`${styles.kpiValue} ${styles.kpiValueSuccess}`}>{confirmados}</span></div>
        <div className={`${styles.kpiCard} ${styles.kpiCardDanger}`}><span className={styles.kpiLabel}>Rechazados</span><span className={`${styles.kpiValue} ${styles.kpiValueDanger}`}>{rechazados}</span></div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterGrid}>
          <label className={`${styles.filterField} ${styles.filterFieldSearch}`}>
            <span>Busqueda general</span>
            <input
              type="text"
              placeholder="Pedido, cliente o referencia..."
              value={filters.search}
              onChange={event => updateFilter('search', event.target.value)}
              className={styles.searchInput}
            />
          </label>

          <div className={`${styles.filterField} ${styles.filterFieldClient}`}>
            <span>Cliente</span>
            <div className={styles.clientControls}>
              <input
                type="search"
                aria-label="Buscar cliente"
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={event => setClientSearch(event.target.value)}
                className={styles.searchInput}
              />
              <select
                aria-label="Seleccionar cliente"
                value={filters.idCliente}
                onChange={event => updateFilter('idCliente', event.target.value)}
                className={styles.inputField}
              >
                <option value="">Todos los clientes</option>
                {clients.map(client => (
                  <option key={client.idCliente} value={client.idCliente}>{client.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <label className={`${styles.filterField} ${styles.filterFieldOrder}`}>
            <span>Pedido</span>
            <select
              value={filters.idPedido}
              onChange={event => updateFilter('idPedido', event.target.value)}
              className={styles.inputField}
              disabled={!filters.idCliente || loadingClientOrders}
            >
              <option value="">{loadingClientOrders ? 'Cargando pedidos...' : 'Todos los pedidos'}</option>
              {clientOrders.map(order => (
                <option key={order.idPedido} value={order.idPedido}>
                  Pedido #{order.idPedido} - Total {fmt(order.total)} - Saldo {fmt(order.saldoPendiente)}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.filterField}>
            <span>Estado</span>
            <select value={filters.estado} onChange={event => updateFilter('estado', event.target.value)} className={styles.inputField}>
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="CONFIRMADO">Confirmado</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </label>

          <label className={styles.filterField}>
            <span>Metodo</span>
            <select value={filters.metodoPago} onChange={event => updateFilter('metodoPago', event.target.value)} className={styles.inputField}>
              <option value="">Todos</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </label>

          <div className={styles.filterActions}>
            <button
              type="button"
              className={styles.clearFiltersButton}
              onClick={() => {
                setFilters({ search: '', idCliente: '', idPedido: '', estado: '', metodoPago: '' });
                setClientSearch('');
                setCurrentPage(1);
              }}
            >
              <RotateCcw size={15} aria-hidden="true" />
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando abonos...</p>
        ) : error ? (
          <p className={styles.loadingText}>{error}</p>
        ) : abonos.length === 0 ? (
          <p className={styles.loadingText}>No se encontraron abonos con estos filtros.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeader}>ID</th>
                  <th className={styles.tableHeader}>Pedido</th>
                  <th className={styles.tableHeader}>Cliente</th>
                  <th className={styles.tableHeader}>Total pedido</th>
                  <th className={styles.tableHeader}>Saldo</th>
                  <th className={styles.tableHeader}>Monto</th>
                  <th className={styles.tableHeader}>Metodo</th>
                  <th className={styles.tableHeader}>Estado</th>
                  <th className={styles.tableHeader}>Fecha</th>
                  <th className={styles.tableHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {abonos.map(abono => (
                  <tr key={abono.idAbono} className={styles.tableBodyRow}>
                    <td className={styles.tableCellId}>#{abono.idAbono}</td>
                    <td className={styles.tableCell}>#{abono.idPedido}</td>
                    <td className={styles.tableCell}>
                      <strong>{getClienteNombre(abono.pedido?.cliente)}</strong>
                      <span style={{ display: 'block', color: '#8f9bb3', fontSize: 12 }}>{getClienteContacto(abono.pedido?.cliente)}</span>
                    </td>
                    <td className={styles.tableCell}>{fmt(abono.pedido?.total)}</td>
                    <td className={styles.tableCell}>{fmt(abono.pedido?.saldoPendiente)}</td>
                    <td className={styles.tableCell}>
                      <strong>{abono.monto == null ? 'Pendiente de revision' : fmt(abono.monto)}</strong>
                      {abono.montoDetectadoOcr != null && (
                        <span style={{ display: 'block', color: '#8f9bb3', fontSize: 12 }}>
                          Detectado: {fmt(abono.montoDetectadoOcr)}
                        </span>
                      )}
                    </td>
                    <td className={styles.tableCell}>{abono.metodoPago}</td>
                    <td className={styles.tableCell}>
                      <span className={`${styles.statusBadge} ${ESTADO_CLASS[abono.estado] || ''}`}>
                        {abono.estado}
                      </span>
                    </td>
                    <td className={styles.tableCell}>{formatDate(abono.fechaCreacion)}</td>
                    <td className={styles.actionsCell}>
                      <TableActions
                        primaryAction={{ label: 'Ver', onClick: () => { setSelectedAbono(abono); setIsViewOpen(true); }, variant: 'accent' }}
                          actions={[
                            hasPermission('abonos.confirmar') && isStaff && abono.estado === 'PENDIENTE' && { label: 'Aprobar', onClick: () => setReviewAbono(abono), variant: 'success' },
                            hasPermission('abonos.rechazar') && isStaff && abono.estado === 'PENDIENTE' && { label: 'Rechazar', onClick: () => onRejectClick(abono), variant: 'danger' },
                            hasPermission('abonos.editar') && isStaff && abono.estado === 'PENDIENTE' && { label: 'Editar datos', onClick: () => handleOpenEdit(abono), variant: 'warning' },
                            hasPermission('abonos.eliminar') && isStaff && abono.estado === 'PENDIENTE' && { label: 'Eliminar', onClick: () => onDeleteClick(abono), variant: 'danger' },
                          ]}
                        />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          classNames={styles}
          currentPage={currentPage}
          hasNextPage={paginationMeta.hasNextPage}
          hasPrevPage={paginationMeta.hasPrevPage}
          onPageChange={setCurrentPage}
          pageSize={paginationMeta.limit}
          totalItems={paginationMeta.total}
          totalPages={paginationMeta.totalPages}
        />
      </div>

      <AbonoModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedAbono(null); }}
        onSubmit={handleSubmit}
        abono={selectedAbono}
        isStaff={isStaff}
        getPedido={getPedido}
        getAbonosByPedido={getAbonosByPedido}
        getPedidos={getPedidos}
      />

      <AbonoViewModal
        isOpen={isViewOpen}
        onClose={() => { setIsViewOpen(false); setSelectedAbono(null); }}
        abono={selectedAbono}
      />

      <ReviewConfirmAbonoModal
        isOpen={Boolean(reviewAbono)}
        abono={reviewAbono}
        onClose={() => setReviewAbono(null)}
        onCompleted={refetch}
        canReject={hasPermission('abonos.rechazar')}
      />
    </div>
  );
};
