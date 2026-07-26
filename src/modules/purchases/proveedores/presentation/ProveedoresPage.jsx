import { useState } from 'react';
import { Pagination } from '../../../../core/components/Pagination';
import { notifications } from '../../../../core/utils/notifications';
import { DEFAULT_PAGE_SIZE } from '../../../../core/utils/serverPagination';
import { useConfirm } from '../../../../shared/components/ConfirmDialog/ConfirmProvider';
import { TableActions } from '../../../../shared/components/TableActions/TableActions';
import { useAuth } from '../../../../store/AuthContext';
import { useProveedores } from '../application/useProveedores';
import { ProveedorModal } from './ProveedorModal';
import { ProveedorViewModal } from './ProveedorViewModal';
import './ProveedoresPage.css';

const styles = {
  pageContainer: 'proveedores-page-container',
  headerWrapper: 'proveedores-header-wrapper',
  breadcrumb: 'proveedores-breadcrumb',
  pageTitle: 'proveedores-page-title',
  pageSubtitle: 'proveedores-page-subtitle',
  primaryButton: 'proveedores-primary-button',
  kpiGrid: 'proveedores-kpi-grid',
  kpiCard: 'proveedores-kpi-card',
  kpiCardSuccess: 'proveedores-kpi-card-success',
  kpiCardDanger: 'proveedores-kpi-card-danger',
  kpiLabel: 'proveedores-kpi-label',
  kpiValue: 'proveedores-kpi-value',
  kpiValueSuccess: 'proveedores-kpi-value-success',
  kpiValueDanger: 'proveedores-kpi-value-danger',
  filterSection: 'proveedores-filter-section',
  filterField: 'proveedores-filter-field',
  filterSearch: 'proveedores-filter-search',
  searchInput: 'proveedores-search-input',
  inputField: 'proveedores-input-field',
  tableContainer: 'proveedores-table-container',
  loadingText: 'proveedores-loading-text',
  tableWrapper: 'proveedores-table-wrapper',
  table: 'proveedores-table',
  tableHeadRow: 'proveedores-table-head-row',
  tableHeader: 'proveedores-table-header',
  tableBodyRow: 'proveedores-table-body-row',
  tableCellId: 'proveedores-table-cell-id',
  tableCell: 'proveedores-table-cell',
  statusBadge: 'proveedores-status-badge',
  statusActive: 'proveedores-status-active',
  statusInactive: 'proveedores-status-inactive',
  actionsCell: 'proveedores-actions-cell',
  actionBtn: 'proveedores-action-btn',
  actionBtnEdit: 'proveedores-action-btn-edit',
  actionBtnCancel: 'proveedores-action-btn-cancel',
  actionBtnView: 'proveedores-action-btn-view',
  actionDivider: 'proveedores-action-divider',
  pagination: 'proveedores-pagination',
  paginationInfo: 'proveedores-pagination-info',
  paginationControls: 'proveedores-pagination-controls',
  paginationButton: 'proveedores-pagination-button',
  paginationButtonActive: 'proveedores-pagination-button-active',
};

export const ProveedoresPage = () => {
  const { hasPermission } = useAuth();
  const confirm = useConfirm();
  const session = JSON.parse(localStorage.getItem('pixel_user') || '{}');
  const userRole = session?.rol?.nombre || 'Cliente';
  const isAdmin = userRole === 'Admin';

  const [filters, setFilters] = useState({ search: '', estado: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const {
    proveedores,
    loading,
    handleCreate,
    handleUpdate,
    handleDeactivate,
    handleHardDelete,
    paginationMeta,
  } = useProveedores({
    ...filters,
    page: currentPage,
    limit: DEFAULT_PAGE_SIZE,
    sortBy: 'nombre',
    order: 'asc',
  });

  const total = paginationMeta.total;
  const activos = proveedores.filter(item => item.estado === true).length;
  const inactivos = proveedores.filter(item => item.estado === false).length;

  const handleOpenCreate = () => {
    setSelectedProveedor(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (proveedor) => {
    setSelectedProveedor(proveedor);
    setIsModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (selectedProveedor) {
      await handleUpdate(selectedProveedor.idProveedor, payload);
      notifications.success('Proveedor actualizado correctamente.');
    } else {
      await handleCreate(payload);
      notifications.success('Proveedor creado correctamente.');
    }
    setIsModalOpen(false);
    setSelectedProveedor(null);
  };

  const onDeactivateClick = async (proveedor) => {
    const accepted = await confirm({
      title: 'Desactivar proveedor',
      message: `Desactivar proveedor "${proveedor.nombre}"?`,
      confirmText: 'Desactivar',
      variant: 'warning',
    });

    if (!accepted) return;

    try {
      await handleDeactivate(proveedor.idProveedor);
      notifications.success('Proveedor desactivado correctamente.');
    } catch (error) {
      notifications.error(error.message || 'No se pudo desactivar el proveedor.');
    }
  };

  const onHardDeleteClick = async (proveedor) => {
    const accepted = await confirm({
      title: 'Eliminar proveedor',
      message: `Eliminar fisicamente proveedor "${proveedor.nombre}"? Esta accion no se puede deshacer.`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });

    if (!accepted) return;

    try {
      await handleHardDelete(proveedor.idProveedor);
      notifications.success('Proveedor eliminado correctamente.');
    } catch (error) {
      notifications.error(error.message || 'No se pudo eliminar el proveedor.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Compras / Proveedores</span>
          <h1 className={styles.pageTitle}>Gestion de Proveedores</h1>
          <p className={styles.pageSubtitle}>
            Administra proveedores disponibles para compras internas.
          </p>
        </div>
        {hasPermission('proveedores.crear') && (
          <button type="button" onClick={handleOpenCreate} className={styles.primaryButton}>
            Nuevo proveedor
          </button>
        )}
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Total</span><span className={styles.kpiValue}>{total}</span></div>
        <div className={`${styles.kpiCard} ${styles.kpiCardSuccess}`}><span className={styles.kpiLabel}>Activos</span><span className={`${styles.kpiValue} ${styles.kpiValueSuccess}`}>{activos}</span></div>
        <div className={`${styles.kpiCard} ${styles.kpiCardDanger}`}><span className={styles.kpiLabel}>Inactivos</span><span className={`${styles.kpiValue} ${styles.kpiValueDanger}`}>{inactivos}</span></div>
      </div>

      <div className={styles.filterSection}>
        <label className={`${styles.filterField} ${styles.filterSearch}`}>
          <span>Buscar proveedores</span>
          <input
            type="text"
            placeholder="Nombre del proveedor..."
            value={filters.search}
            onChange={event => {
              setFilters(prev => ({ ...prev, search: event.target.value }));
              setCurrentPage(1);
            }}
            className={styles.searchInput}
          />
        </label>
        <label className={styles.filterField}>
          <span>Estado</span>
          <select
            value={filters.estado}
            onChange={event => {
              setFilters(prev => ({ ...prev, estado: event.target.value }));
              setCurrentPage(1);
            }}
            className={styles.inputField}
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </label>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando proveedores...</p>
        ) : proveedores.length === 0 ? (
          <p className={styles.loadingText}>No se encontraron proveedores.</p>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeadRow}>
                    <th className={styles.tableHeader}>ID</th>
                    <th className={styles.tableHeader}>Nombre</th>
                    <th className={styles.tableHeader}>Telefono</th>
                    <th className={styles.tableHeader}>Correo</th>
                    <th className={styles.tableHeader}>Estado</th>
                    <th className={styles.tableHeader}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedores.map(proveedor => (
                    <tr key={proveedor.idProveedor} className={styles.tableBodyRow}>
                      <td className={styles.tableCellId}>#{proveedor.idProveedor}</td>
                      <td className={styles.tableCell}>{proveedor.nombre}</td>
                      <td className={styles.tableCell}>{proveedor.telefono || 'Sin telefono'}</td>
                      <td className={styles.tableCell}>{proveedor.correo || 'Sin correo'}</td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.statusBadge} ${proveedor.estado ? styles.statusActive : styles.statusInactive}`}>
                          {proveedor.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>
                        <TableActions
                          primaryAction={{ label: 'Ver', onClick: () => { setSelectedProveedor(proveedor); setIsViewOpen(true); }, variant: 'accent' }}
                          actions={[
                            hasPermission('proveedores.desactivar') && proveedor.estado && { label: 'Desactivar', onClick: () => onDeactivateClick(proveedor), variant: 'danger' },
                            hasPermission('proveedores.editar') && { label: 'Editar', onClick: () => handleOpenEdit(proveedor), variant: 'warning' },
                            hasPermission('proveedores.eliminar') && isAdmin && { label: 'Eliminar', onClick: () => onHardDeleteClick(proveedor), variant: 'danger' },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          </>
        )}
      </div>

      <ProveedorModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedProveedor(null); }}
        onSubmit={handleSubmit}
        proveedor={selectedProveedor}
      />
      <ProveedorViewModal
        isOpen={isViewOpen}
        onClose={() => { setIsViewOpen(false); setSelectedProveedor(null); }}
        proveedor={selectedProveedor}
      />
    </div>
  );
};
