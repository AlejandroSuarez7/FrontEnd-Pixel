import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Pagination } from '../../../../core/components/Pagination';
import { useDebounce } from '../../../../core/hooks/useDebounce';
import { notifications } from '../../../../core/utils/notifications';
import { DEFAULT_PAGE_SIZE } from '../../../../core/utils/serverPagination';
import { useConfirm } from '../../../../shared/components/ConfirmDialog/ConfirmProvider';
import { SafeDeleteModal } from '../../../../shared/components/SafeDeleteModal/SafeDeleteModal';
import { SAFE_DELETE_IMPACT_ENDPOINTS } from '../../../../shared/components/SafeDeleteModal/safeDeleteEndpoints';
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
  const { user, hasPermission } = useAuth();
  const confirm = useConfirm();
  const location = useLocation();
  const userRole = user?.rol?.nombre || user?.rol || user?.nombreRol || 'Cliente';
  const isStaff = userRole === 'Admin' || userRole === 'Secretaria';

  const initialClientId = Number.isInteger(Number(location.state?.idCliente)) ? String(location.state.idCliente) : '';
  const initialOrderId = Number.isInteger(Number(location.state?.idPedido)) ? String(location.state.idPedido) : '';
  const initialNavigationRef = useRef({
    idCliente: initialClientId,
    idPedido: initialOrderId,
  });
  const navigationOrderResolvedRef = useRef(false);
  const [filters, setFilters] = useState(() => ({
    search: '',
    idCliente: initialClientId,
    idPedido: initialOrderId,
    estado: '',
    metodoPago: '',
  }));
  const [currentPage, setCurrentPage] = useState(1);
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [clientOrders, setClientOrders] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState('');
  const [loadingClientOrders, setLoadingClientOrders] = useState(Boolean(initialClientId));
  const [clientOrdersError, setClientOrdersError] = useState('');
  const [selectedAbono, setSelectedAbono] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [reviewAbono, setReviewAbono] = useState(null);
  const [deletionAbono, setDeletionAbono] = useState(null);
  const debouncedSearch = useDebounce(filters.search, 350);
  const debouncedClientSearch = useDebounce(clientSearch, 350);

  const {
    abonos,
    loading,
    refreshing,
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
    const initialOrderId = initialNavigationRef.current.idPedido;
    if (!initialOrderId || initialNavigationRef.current.idCliente || navigationOrderResolvedRef.current) return;
    let canceled = false;

    getPedido(initialOrderId)
      .then(order => {
        if (canceled) return;
        navigationOrderResolvedRef.current = true;
        const orderClient = order?.cliente;
        const orderClientId = order?.idCliente || orderClient?.idCliente;
        if (!orderClientId) return;
        setFilters(current => (
          current.idCliente === String(orderClientId)
            ? current
            : { ...current, idCliente: String(orderClientId) }
        ));
        setLoadingClientOrders(true);
        if (orderClient) {
          setClients(current => (
            current.some(client => Number(client.idCliente) === Number(orderClientId))
              ? current
              : [orderClient, ...current]
          ));
        }
      })
      .catch(() => {
        if (!canceled) {
          navigationOrderResolvedRef.current = true;
          setClientOrdersError('El pedido fue aplicado al filtro, pero no se pudo resolver su cliente.');
        }
      });

    return () => {
      canceled = true;
    };
  }, [getPedido]);

  useEffect(() => {
    if (!isStaff) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      clientRepository.list({
        page: 1,
        limit: 10,
        search: debouncedClientSearch,
        sortBy: 'nombre',
        order: 'asc',
      }, { signal: controller.signal })
        .then(result => {
          if (controller.signal.aborted) return;
          setClients(result.items);
          setClientsError('');
        })
        .catch((requestError) => {
          if (controller.signal.aborted || requestError.code === 'ERR_CANCELED') return;
          setClients([]);
          setClientsError(requestError.message || 'No se pudieron cargar los clientes.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoadingClients(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isStaff, debouncedClientSearch]);

  useEffect(() => {
    if (!filters.idCliente) return;
    const controller = new AbortController();
    clientRepository.listOrders(filters.idCliente, { signal: controller.signal })
      .then(orders => {
        if (controller.signal.aborted) return;
        setClientOrders(orders);
        setClientOrdersError('');
      })
      .catch((requestError) => {
        if (controller.signal.aborted || requestError.code === 'ERR_CANCELED') return;
        setClientOrders([]);
        setClientOrdersError(requestError.message || 'No se pudieron cargar los pedidos del cliente.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingClientOrders(false);
      });
    return () => controller.abort();
  }, [filters.idCliente]);

  const total = paginationMeta.total;
  const pendientes = abonos.filter(item => item.estado === 'PENDIENTE').length;
  const confirmados = abonos.filter(item => item.estado === 'CONFIRMADO').length;
  const rechazados = abonos.filter(item => item.estado === 'RECHAZADO').length;

  const updateFilter = (field, value) => {
    if (field === 'idCliente') {
      setClientOrders([]);
      setClientOrdersError('');
      setLoadingClientOrders(Boolean(value));
    }
    setFilters(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'idCliente' ? { idPedido: '' } : {}),
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', idCliente: '', idPedido: '', estado: '', metodoPago: '' });
    setClientSearch('');
    setClientOrders([]);
    setClientOrdersError('');
    setLoadingClientOrders(false);
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
      if (!error.wasNotified) notifications.error(error.message || 'No se pudo rechazar el abono.');
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
                onChange={event => {
                  setClientSearch(event.target.value);
                  setLoadingClients(true);
                }}
                className={styles.searchInput}
              />
              <select
                aria-label="Seleccionar cliente"
                value={filters.idCliente}
                onChange={event => updateFilter('idCliente', event.target.value)}
                className={styles.inputField}
              >
                <option value="">{loadingClients ? 'Cargando clientes...' : 'Todos los clientes'}</option>
                {filters.idCliente && !clients.some(client => String(client.idCliente) === String(filters.idCliente)) && (
                  <option value={filters.idCliente}>Cliente #{filters.idCliente}</option>
                )}
                {clients.map(client => (
                  <option key={client.idCliente} value={client.idCliente}>{client.nombre}</option>
                ))}
              </select>
            </div>
            {clientsError && <small className="abonos-filter-error">{clientsError}</small>}
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
              {filters.idPedido && !clientOrders.some(order => String(order.idPedido) === String(filters.idPedido)) && (
                <option value={filters.idPedido}>Pedido #{filters.idPedido}</option>
              )}
              {clientOrders.map(order => (
                <option key={order.idPedido} value={order.idPedido}>
                  Pedido #{order.idPedido} - Total {fmt(order.total)} - Saldo {fmt(order.saldoPendiente)}
                </option>
              ))}
            </select>
            {clientOrdersError && <small className="abonos-filter-error">{clientOrdersError}</small>}
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
              onClick={clearFilters}
            >
              <RotateCcw size={15} aria-hidden="true" />
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        {refreshing && <div className="abonos-refreshing" role="status">Actualizando abonos...</div>}
        {loading ? (
          <p className={styles.loadingText}>Cargando abonos...</p>
        ) : error ? (
          <div className="abonos-error-state" role="alert">
            <strong>No se pudo cargar Gestion de Abonos</strong>
            <p>{error}</p>
            <button type="button" onClick={() => refetch()}>Reintentar</button>
          </div>
        ) : abonos.length === 0 ? (
          <p className={styles.loadingText}>No hay abonos para los filtros seleccionados.</p>
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
                            hasPermission('abonos.eliminar') && isStaff && abono.estado === 'PENDIENTE' && { label: 'Eliminar', onClick: () => setDeletionAbono(abono), variant: 'danger' },
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

      {isModalOpen && (
        <AbonoModal
          isOpen
          onClose={() => { setIsModalOpen(false); setSelectedAbono(null); }}
          onSubmit={handleSubmit}
          abono={selectedAbono}
          isStaff={isStaff}
          getPedido={getPedido}
          getAbonosByPedido={getAbonosByPedido}
          getPedidos={getPedidos}
        />
      )}

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
      <SafeDeleteModal
        key={deletionAbono?.idAbono || 'payment-delete'}
        isOpen={Boolean(deletionAbono)}
        entityLabel="abono"
        entityName={deletionAbono ? `Abono #${deletionAbono.idAbono}` : ''}
        impactEndpoint={deletionAbono ? SAFE_DELETE_IMPACT_ENDPOINTS.payment(deletionAbono.idAbono) : ''}
        deleteAction={() => handleDelete(deletionAbono.idAbono)}
        successMessage="Abono eliminado correctamente."
        onClose={() => setDeletionAbono(null)}
      />
    </div>
  );
};
