import { useMemo, useState } from 'react';
import { Pagination } from '../../../../core/components/Pagination';
import { notifications } from '../../../../core/utils/notifications';
import { usePagination } from '../../../../core/hooks/usePagination';
import { useConfirm } from '../../../../shared/components/ConfirmDialog/ConfirmProvider';
import { TableActions } from '../../../../shared/components/TableActions/TableActions';
import { useAuth } from '../../../../store/AuthContext';
import { useDisenos } from '../application/useDisenos';
import { DisenoModal } from './DisenoModal';
import { DisenoViewModal } from './DisenoViewModal';
import { formatDate } from '../../../../core/utils/fechaFormato';
import './DisenosPage.css';

const styles = {
  pageContainer: 'disenos-page-container',
  headerWrapper: 'disenos-header-wrapper',
  breadcrumb: 'disenos-breadcrumb',
  pageTitle: 'disenos-page-title',
  pageSubtitle: 'disenos-page-subtitle',
  primaryButton: 'disenos-primary-button',
  kpiGrid: 'disenos-kpi-grid',
  kpiCard: 'disenos-kpi-card',
  kpiCardWarning: 'disenos-kpi-card-warning',
  kpiCardInfo: 'disenos-kpi-card-info',
  kpiCardSuccess: 'disenos-kpi-card-success',
  kpiLabel: 'disenos-kpi-label',
  kpiValue: 'disenos-kpi-value',
  kpiValueWarning: 'disenos-kpi-value-warning',
  kpiValueInfo: 'disenos-kpi-value-info',
  kpiValueSuccess: 'disenos-kpi-value-success',
  filterSection: 'disenos-filter-section',
  searchInput: 'disenos-search-input',
  inputField: 'disenos-input-field',
  tableContainer: 'disenos-table-container',
  loadingText: 'disenos-loading-text',
  tableWrapper: 'disenos-table-wrapper',
  table: 'disenos-table',
  tableHeadRow: 'disenos-table-head-row',
  tableHeader: 'disenos-table-header',
  tableBodyRow: 'disenos-table-body-row',
  tableCellId: 'disenos-table-cell-id',
  tableCell: 'disenos-table-cell',
  statusBadge: 'disenos-status-badge',
  estadoPagoParcial: 'disenos-status-warning',
  estadoPedidoEnProceso: 'disenos-status-info',
  estadoPagoCompleto: 'disenos-status-success',
  actionsCell: 'disenos-actions-cell',
  actionBtn: 'disenos-action-btn',
  actionBtnProcess: 'disenos-action-btn-process',
  actionBtnEdit: 'disenos-action-btn-edit',
  actionBtnCancel: 'disenos-action-btn-cancel',
  actionBtnView: 'disenos-action-btn-view',
  actionDivider: 'disenos-action-divider',
  pagination: 'disenos-pagination',
  paginationInfo: 'disenos-pagination-info',
  paginationControls: 'disenos-pagination-controls',
  paginationButton: 'disenos-pagination-button',
  paginationButtonActive: 'disenos-pagination-button-active',
};

const ESTADO_CLASS = {
  PENDIENTE: styles.estadoPagoParcial,
  ENVIADO: styles.estadoPedidoEnProceso,
  APROBADO: styles.estadoPagoCompleto,
};

export const DisenosPage = () => {
  const { hasPermission } = useAuth();
  const confirm = useConfirm();
  const session = JSON.parse(localStorage.getItem('pixel_user') || '{}');
  const userRole = session?.rol?.nombre || 'Cliente';
  const userId = Number(session?.idUsuario || session?.id || 0);
  const isStaff = userRole === 'Admin' || userRole === 'Secretaria';
  const isDisenador = userRole?.toLowerCase?.().includes('dise');

  const [filters, setFilters] = useState({ search: '', idPedido: '', estado: '' });
  const [selectedDiseno, setSelectedDiseno] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const {
    disenos,
    loading,
    handleCreate,
    handleUpdate,
    handleApprove,
    handleDelete,
    getPedidos,
  } = useDisenos({
    idPedido: filters.idPedido,
    estado: filters.estado,
  });

  const filteredDisenos = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    if (!term) return disenos;
    return disenos.filter((diseno) => {
      const cliente = diseno.pedido?.cliente?.nombre || '';
      const disenador = diseno.disenador?.nombre || '';
      return (
        String(diseno.idDiseno).includes(term) ||
        String(diseno.idPedido).includes(term) ||
        cliente.toLowerCase().includes(term) ||
        disenador.toLowerCase().includes(term) ||
        diseno.descripcion.toLowerCase().includes(term)
      );
    });
  }, [disenos, filters.search]);

  const total = filteredDisenos.length;
  const pendientes = filteredDisenos.filter(item => item.estado === 'PENDIENTE').length;
  const enviados = filteredDisenos.filter(item => item.estado === 'ENVIADO').length;
  const aprobados = filteredDisenos.filter(item => item.estado === 'APROBADO').length;
  const {
    currentPage,
    pageSize,
    paginatedItems: paginatedDisenos,
    setCurrentPage,
    totalPages,
  } = usePagination(filteredDisenos);

  const handleOpenCreate = () => {
    setSelectedDiseno(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (diseno) => {
    setSelectedDiseno(diseno);
    setIsModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (selectedDiseno) {
      await handleUpdate(selectedDiseno.idDiseno, payload);
    } else {
      await handleCreate(payload);
    }
    setIsModalOpen(false);
    setSelectedDiseno(null);
  };

  const canApprove = (diseno) => {
    const ownerId = Number(diseno.pedido?.cliente?.idUsuario || 0);
    return diseno.estado === 'ENVIADO' && hasPermission('disenos.aprobar') && (isStaff || ownerId === userId);
  };

  const onApproveClick = async (diseno) => {
    const result = await confirm({
      title: 'Aprobar diseno',
      message: `Aprobar diseno #${diseno.idDiseno}?`,
      confirmText: 'Aprobar',
      variant: 'success',
      input: true,
      inputPlaceholder: 'Observaciones opcionales',
      requiredInput: false,
    });

    if (!result.confirmed) return;

    try {
      const response = await handleApprove(diseno.idDiseno, { observaciones: result.value });
      notifications.success(response.message || 'Diseno aprobado correctamente.');
    } catch (error) {
      notifications.error(error.message || 'No se pudo aprobar el diseno.');
    }
  };

  const onDeleteClick = async (diseno) => {
    const accepted = await confirm({
      title: 'Eliminar diseno',
      message: `Eliminar diseno #${diseno.idDiseno}?`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });

    if (!accepted) return;

    try {
      await handleDelete(diseno.idDiseno);
      notifications.success('Diseno eliminado correctamente.');
    } catch (error) {
      notifications.error(error.message || 'No se pudo eliminar el diseno.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Produccion / Disenos</span>
          <h1 className={styles.pageTitle}>Gestion de Disenos</h1>
          <p className={styles.pageSubtitle}>
            Administra archivos, envio y aprobacion de disenos asociados a pedidos.
          </p>
        </div>
        {hasPermission('disenos.crear') && (!userRole || userRole !== 'Cliente') ? (
          <button onClick={handleOpenCreate} className={styles.primaryButton}>
            Nuevo diseno
          </button>
        ) : null}
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Total</span><span className={styles.kpiValue}>{total}</span></div>
        <div className={`${styles.kpiCard} ${styles.kpiCardWarning}`}><span className={styles.kpiLabel}>Pendientes</span><span className={`${styles.kpiValue} ${styles.kpiValueWarning}`}>{pendientes}</span></div>
        <div className={`${styles.kpiCard} ${styles.kpiCardInfo}`}><span className={styles.kpiLabel}>Enviados</span><span className={`${styles.kpiValue} ${styles.kpiValueInfo}`}>{enviados}</span></div>
        <div className={`${styles.kpiCard} ${styles.kpiCardSuccess}`}><span className={styles.kpiLabel}>Aprobados</span><span className={`${styles.kpiValue} ${styles.kpiValueSuccess}`}>{aprobados}</span></div>
      </div>

      <div className={styles.filterSection}>
        <input
          type="text"
          placeholder="Buscar por pedido, cliente, disenador o descripcion..."
          value={filters.search}
          onChange={event => setFilters(prev => ({ ...prev, search: event.target.value }))}
          className={styles.searchInput}
        />
        <input
          type="number"
          min="1"
          placeholder="ID pedido"
          value={filters.idPedido}
          onChange={event => setFilters(prev => ({ ...prev, idPedido: event.target.value }))}
          className={styles.searchInput}
        />
        <select value={filters.estado} onChange={event => setFilters(prev => ({ ...prev, estado: event.target.value }))} className={styles.inputField}>
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="ENVIADO">Enviado</option>
          <option value="APROBADO">Aprobado</option>
        </select>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando disenos...</p>
        ) : filteredDisenos.length === 0 ? (
          <p className={styles.loadingText}>No se encontraron disenos.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeader}>ID</th>
                  <th className={styles.tableHeader}>Pedido</th>
                  <th className={styles.tableHeader}>Cliente</th>
                  <th className={styles.tableHeader}>Disenador</th>
                  <th className={styles.tableHeader}>Estado</th>
                  <th className={styles.tableHeader}>Envio</th>
                  <th className={styles.tableHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDisenos.map(diseno => (
                  <tr key={diseno.idDiseno} className={styles.tableBodyRow}>
                    <td className={styles.tableCellId}>#{diseno.idDiseno}</td>
                    <td className={styles.tableCell}>#{diseno.idPedido}</td>
                    <td className={styles.tableCell}>{diseno.pedido?.cliente?.nombre || 'N/A'}</td>
                    <td className={styles.tableCell}>{diseno.disenador?.nombre || 'Sin asignar'}</td>
                    <td className={styles.tableCell}>
                      <span className={`${styles.statusBadge} ${ESTADO_CLASS[diseno.estado] || ''}`}>
                        {diseno.estado}
                      </span>
                    </td>
                    <td className={styles.tableCell}>{formatDate(diseno.fechaEnvio || diseno.fechaCreacion)}</td>
                    <td className={styles.actionsCell}>
                      <TableActions
                        primaryAction={{ label: 'Ver', onClick: () => { setSelectedDiseno(diseno); setIsViewOpen(true); }, variant: 'accent' }}
                        actions={[
                          canApprove(diseno) && { label: 'Aprobar', onClick: () => onApproveClick(diseno), variant: 'success' },
                          hasPermission('disenos.editar') && (isStaff || isDisenador) && diseno.estado !== 'APROBADO' && { label: 'Editar', onClick: () => handleOpenEdit(diseno), variant: 'warning' },
                          hasPermission('disenos.eliminar') && isStaff && diseno.estado !== 'APROBADO' && { label: 'Eliminar', onClick: () => onDeleteClick(diseno), variant: 'danger' },
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
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          totalItems={filteredDisenos.length}
          totalPages={totalPages}
        />
      </div>

      <DisenoModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedDiseno(null); }}
        onSubmit={handleSubmit}
        diseno={selectedDiseno}
        isStaff={isStaff}
        getPedidos={getPedidos}
      />

      <DisenoViewModal
        isOpen={isViewOpen}
        onClose={() => { setIsViewOpen(false); setSelectedDiseno(null); }}
        diseno={selectedDiseno}
      />
    </div>
  );
};
