import { useMemo, useState } from 'react';
import { Pagination } from '../../../../core/components/Pagination';
import { notifications } from '../../../../core/utils/notifications';
import { usePagination } from '../../../../core/hooks/usePagination';
import { formatDate } from '../../../../core/utils/fechaFormato';
import { useConfirm } from '../../../../shared/components/ConfirmDialog/ConfirmProvider';
import { TableActions } from '../../../../shared/components/TableActions/TableActions';
import { useAuth } from '../../../../store/AuthContext';
import { useCompras } from '../application/useCompras';
import { CompraModal } from './CompraModal';
import { CompraViewModal } from './CompraViewModal';
import './ComprasPage.css';

const styles = {
  pageContainer: 'compras-page-container',
  headerWrapper: 'compras-header-wrapper',
  breadcrumb: 'compras-breadcrumb',
  pageTitle: 'compras-page-title',
  pageSubtitle: 'compras-page-subtitle',
  primaryButton: 'compras-primary-button',
  kpiGrid: 'compras-kpi-grid',
  kpiCard: 'compras-kpi-card',
  kpiCardWarning: 'compras-kpi-card-warning',
  kpiCardSuccess: 'compras-kpi-card-success',
  kpiCardDanger: 'compras-kpi-card-danger',
  kpiLabel: 'compras-kpi-label',
  kpiValue: 'compras-kpi-value',
  kpiValueWarning: 'compras-kpi-value-warning',
  kpiValueSuccess: 'compras-kpi-value-success',
  kpiValueDanger: 'compras-kpi-value-danger',
  filterSection: 'compras-filter-section',
  filterDateGroup: 'compras-filter-date-group',
  searchInput: 'compras-search-input',
  inputField: 'compras-input-field',
  tableContainer: 'compras-table-container',
  loadingText: 'compras-loading-text',
  tableWrapper: 'compras-table-wrapper',
  table: 'compras-table',
  tableHeadRow: 'compras-table-head-row',
  tableHeader: 'compras-table-header',
  tableBodyRow: 'compras-table-body-row',
  tableCellId: 'compras-table-cell-id',
  tableCell: 'compras-table-cell',
  statusBadge: 'compras-status-badge',
  statusWarning: 'compras-status-warning',
  statusSuccess: 'compras-status-success',
  statusDanger: 'compras-status-danger',
  actionsCell: 'compras-actions-cell',
  actionBtn: 'compras-action-btn',
  actionBtnProcess: 'compras-action-btn-process',
  actionBtnEdit: 'compras-action-btn-edit',
  actionBtnCancel: 'compras-action-btn-cancel',
  actionBtnView: 'compras-action-btn-view',
  actionDivider: 'compras-action-divider',
  pagination: 'compras-pagination',
  paginationInfo: 'compras-pagination-info',
  paginationControls: 'compras-pagination-controls',
  paginationButton: 'compras-pagination-button',
  paginationButtonActive: 'compras-pagination-button-active',
};

const ESTADO_CLASS = {
  PENDIENTE: styles.statusWarning,
  COMPRADA: styles.statusSuccess,
  ANULADA: styles.statusDanger,
};

const fmt = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;

export const ComprasPage = () => {
  const { user, hasPermission } = useAuth();
  const confirm = useConfirm();
  const userRole = user?.rol?.nombre || user?.rol || user?.nombreRol || 'Cliente';
  const isStaff = userRole === 'Admin' || userRole === 'Secretaria';
  const isDesigner = userRole?.toLowerCase?.().includes('dise');

  const [filters, setFilters] = useState({ search: '', idPedido: '', idProveedor: '', estado: '', compradoPorId: '', desde: '', hasta: '' });
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const {
    compras,
    resumen,
    loading,
    error,
    refetch,
    handleCreate,
    handleUpdate,
    handleConfirm,
    handleCancel,
    handleDelete,
    getPedidos,
    getProveedoresActivos,
  } = useCompras({
    idPedido: filters.idPedido,
    idProveedor: filters.idProveedor,
    estado: filters.estado,
    compradoPorId: filters.compradoPorId,
    desde: filters.desde,
    hasta: filters.hasta,
  }, { onlyDesigner: isDesigner && !isStaff });

  const filteredCompras = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    if (!term) return compras;
    return compras.filter(compra => (
      String(compra.idCompra).includes(term) ||
      String(compra.idPedido).includes(term) ||
      (compra.proveedor?.nombre || '').toLowerCase().includes(term) ||
      (compra.compradoPor?.nombre || '').toLowerCase().includes(term) ||
      compra.detalles.some(det => det.descripcionInsumo.toLowerCase().includes(term))
    ));
  }, [compras, filters.search]);

  const {
    currentPage,
    pageSize,
    paginatedItems,
    setCurrentPage,
    totalPages,
  } = usePagination(filteredCompras);

  const handleOpenCreate = () => {
    setSelectedCompra(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (compra) => {
    setSelectedCompra(compra);
    setIsModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (selectedCompra) {
      await handleUpdate(selectedCompra.idCompra, payload);
    } else {
      await handleCreate(payload);
    }
    setIsModalOpen(false);
    setSelectedCompra(null);
  };

  const onConfirmClick = async (compra) => {
    const accepted = await confirm({
      title: 'Confirmar compra',
      message: `Confirmar compra #${compra.idCompra}?`,
      confirmText: 'Confirmar',
      variant: 'success',
    });

    if (!accepted) return;

    try {
      const result = await handleConfirm(compra.idCompra);
      notifications.success(result.message || 'Compra confirmada correctamente.');
    } catch (error) {
      notifications.error(error.message || 'No se pudo confirmar la compra.');
    }
  };

  const onCancelClick = async (compra) => {
    const result = await confirm({
      title: 'Anular compra',
      message: `Indica el motivo para anular la compra #${compra.idCompra}.`,
      confirmText: 'Anular',
      variant: 'danger',
      input: true,
      inputPlaceholder: 'Motivo de anulacion',
      requiredInput: true,
    });

    if (!result.confirmed) return;

    try {
      await handleCancel(compra.idCompra, result.value);
      notifications.success('Compra anulada correctamente.');
    } catch (error) {
      notifications.error(error.message || 'No se pudo anular la compra.');
    }
  };

  const onDeleteClick = async (compra) => {
    const accepted = await confirm({
      title: 'Eliminar compra',
      message: `Eliminar compra pendiente #${compra.idCompra}?`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });

    if (!accepted) return;

    try {
      await handleDelete(compra.idCompra);
      notifications.success('Compra eliminada correctamente.');
    } catch (error) {
      notifications.error(error.message || 'No se pudo eliminar la compra.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Compras / Gestion</span>
          <h1 className={styles.pageTitle}>Gestion de Compras</h1>
          <p className={styles.pageSubtitle}>
            {isDesigner ? 'Consulta el estado operativo de compras asociadas a pedidos.' : 'Control interno de compras de insumos por pedido.'}
          </p>
        </div>
        {isStaff && hasPermission('compras.crear') && (
          <button type="button" onClick={handleOpenCreate} className={styles.primaryButton}>
            Nueva compra
          </button>
        )}
      </div>

      {isStaff && hasPermission('compras.resumen') && (
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}><span className={styles.kpiLabel}>Cantidad</span><span className={styles.kpiValue}>{resumen.cantidadCompras || filteredCompras.length}</span></div>
          <div className={`${styles.kpiCard} ${styles.kpiCardSuccess}`}><span className={styles.kpiLabel}>Total compras</span><span className={`${styles.kpiValue} ${styles.kpiValueSuccess}`}>{fmt(resumen.totalCompras)}</span></div>
          <div className={`${styles.kpiCard} ${styles.kpiCardWarning}`}><span className={styles.kpiLabel}>Pendientes</span><span className={`${styles.kpiValue} ${styles.kpiValueWarning}`}>{resumen.porEstado?.PENDIENTE || 0}</span></div>
          <div className={`${styles.kpiCard} ${styles.kpiCardDanger}`}><span className={styles.kpiLabel}>Anuladas</span><span className={`${styles.kpiValue} ${styles.kpiValueDanger}`}>{resumen.porEstado?.ANULADA || 0}</span></div>
        </div>
      )}

      <div className={styles.filterSection}>
        <input type="text" placeholder="Buscar por compra, pedido, proveedor o insumo..." value={filters.search} onChange={event => setFilters(prev => ({ ...prev, search: event.target.value }))} className={styles.searchInput} />
        <input type="number" min="1" placeholder="ID pedido" value={filters.idPedido} onChange={event => setFilters(prev => ({ ...prev, idPedido: event.target.value }))} className={styles.searchInput} />
        {isStaff && <input type="number" min="1" placeholder="ID proveedor" value={filters.idProveedor} onChange={event => setFilters(prev => ({ ...prev, idProveedor: event.target.value }))} className={styles.searchInput} />}
        <select value={filters.estado} onChange={event => setFilters(prev => ({ ...prev, estado: event.target.value }))} className={styles.inputField}>
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="COMPRADA">Comprada</option>
          <option value="ANULADA">Anulada</option>
        </select>
        {isStaff && (
          <label className={styles.filterDateGroup}>
            <span>Desde</span>
            <input type="date" value={filters.desde} onChange={event => setFilters(prev => ({ ...prev, desde: event.target.value }))} className={styles.inputField} />
          </label>
        )}
        {isStaff && (
          <label className={styles.filterDateGroup}>
            <span>Hasta</span>
            <input type="date" value={filters.hasta} onChange={event => setFilters(prev => ({ ...prev, hasta: event.target.value }))} className={styles.inputField} />
          </label>
        )}
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando compras...</p>
        ) : error && filteredCompras.length === 0 ? (
          <div className={styles.loadingText}>
            <p>{error.message || 'No se pudieron cargar las compras.'}</p>
            <button type="button" className={styles.primaryButton} onClick={refetch}>Reintentar</button>
          </div>
        ) : filteredCompras.length === 0 ? (
          <p className={styles.loadingText}>No se encontraron compras.</p>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeadRow}>
                    {!isDesigner && <th className={styles.tableHeader}>ID</th>}
                    <th className={styles.tableHeader}>Pedido</th>
                    {!isDesigner && <th className={styles.tableHeader}>Proveedor</th>}
                    {!isDesigner && <th className={styles.tableHeader}>Comprador</th>}
                    <th className={styles.tableHeader}>Estado</th>
                    {!isDesigner && <th className={styles.tableHeader}>Total</th>}
                    <th className={styles.tableHeader}>Fecha</th>
                    <th className={styles.tableHeader}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map(compra => (
                    <tr key={compra.idCompra} className={styles.tableBodyRow}>
                      {!isDesigner && <td className={styles.tableCellId}>#{compra.idCompra}</td>}
                      <td className={styles.tableCell}>#{compra.idPedido}</td>
                      {!isDesigner && <td className={styles.tableCell}>{compra.proveedor?.nombre || 'N/A'}</td>}
                      {!isDesigner && <td className={styles.tableCell}>{compra.compradoPor?.nombre || 'N/A'}</td>}
                      <td className={styles.tableCell}><span className={`${styles.statusBadge} ${ESTADO_CLASS[compra.estado] || ''}`}>{compra.estado}</span></td>
                      {!isDesigner && <td className={styles.tableCell}><strong>{fmt(compra.total)}</strong></td>}
                      <td className={styles.tableCell}>{formatDate(compra.fechaCompra)}</td>
                      <td className={styles.actionsCell}>
                        <TableActions
                          primaryAction={{ label: 'Ver', onClick: () => { setSelectedCompra(compra); setIsViewOpen(true); }, variant: 'accent' }}
                          actions={[
                            hasPermission('compras.confirmar') && isStaff && compra.estado === 'PENDIENTE' && { label: 'Confirmar', onClick: () => onConfirmClick(compra), variant: 'success' },
                            hasPermission('compras.anular') && isStaff && compra.estado === 'PENDIENTE' && { label: 'Anular', onClick: () => onCancelClick(compra), variant: 'danger' },
                            hasPermission('compras.editar') && isStaff && compra.estado === 'PENDIENTE' && { label: 'Editar', onClick: () => handleOpenEdit(compra), variant: 'warning' },
                            hasPermission('compras.eliminar') && isStaff && compra.estado === 'PENDIENTE' && { label: 'Eliminar', onClick: () => onDeleteClick(compra), variant: 'danger' },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination classNames={styles} currentPage={currentPage} onPageChange={setCurrentPage} pageSize={pageSize} totalItems={filteredCompras.length} totalPages={totalPages} />
          </>
        )}
      </div>

      <CompraModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedCompra(null); }} onSubmit={handleSubmit} compra={selectedCompra} getPedidos={getPedidos} getProveedoresActivos={getProveedoresActivos} />
      <CompraViewModal isOpen={isViewOpen} onClose={() => { setIsViewOpen(false); setSelectedCompra(null); }} compra={selectedCompra} isDesigner={isDesigner && !isStaff} />
    </div>
  );
};
