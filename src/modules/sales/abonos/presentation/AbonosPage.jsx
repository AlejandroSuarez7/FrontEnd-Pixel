import { useMemo, useState } from 'react';
import { Pagination } from '../../../../core/components/Pagination';
import { usePagination } from '../../../../core/hooks/usePagination';
import { TableActions } from '../../../../shared/components/TableActions/TableActions';
import { useAbonos } from '../application/useAbonos';
import { AbonoModal } from './AbonoModal';
import { AbonoViewModal } from './AbonoViewModal';
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

export const AbonosPage = () => {
  const session = JSON.parse(localStorage.getItem('pixel_user') || '{}');
  const userRole = session?.rol?.nombre || 'Cliente';
  const isStaff = userRole === 'Admin' || userRole === 'Secretaria';

  const [filters, setFilters] = useState({ search: '', idPedido: '', estado: '', metodoPago: '' });
  const [selectedAbono, setSelectedAbono] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const {
    abonos,
    loading,
    handleCreate,
    handleUpdate,
    handleConfirm,
    handleReject,
    handleDelete,
    getPedido,
    getAbonosByPedido,
    getPedidos,
  } = useAbonos({
    idPedido: isStaff ? filters.idPedido : '',
    estado: filters.estado,
    metodoPago: filters.metodoPago,
    onlyOwnPedidos: !isStaff,
  });

  const filteredAbonos = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    const pedidoTerm = filters.idPedido.trim();
    const abonosPorPedido = pedidoTerm
      ? abonos.filter(abono => String(abono.idPedido).includes(pedidoTerm))
      : abonos;

    if (!term) return abonosPorPedido;
    return abonosPorPedido.filter((abono) => {
      const cliente = abono.pedido?.cliente?.nombre || '';
      const referencia = abono.referencia || '';
      return (
        String(abono.idAbono).includes(term) ||
        String(abono.idPedido).includes(term) ||
        cliente.toLowerCase().includes(term) ||
        referencia.toLowerCase().includes(term)
      );
    });
  }, [abonos, filters.idPedido, filters.search]);

  const total = filteredAbonos.length;
  const pendientes = filteredAbonos.filter(item => item.estado === 'PENDIENTE').length;
  const confirmados = filteredAbonos.filter(item => item.estado === 'CONFIRMADO').length;
  const rechazados = filteredAbonos.filter(item => item.estado === 'RECHAZADO').length;
  const {
    currentPage,
    pageSize,
    paginatedItems: paginatedAbonos,
    setCurrentPage,
    totalPages,
  } = usePagination(filteredAbonos);

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

  const onConfirmClick = (abono) => {
    if (window.confirm(`Confirmar abono #${abono.idAbono} por ${fmt(abono.monto)}?`)) {
      handleConfirm(abono.idAbono, { referencia: abono.referencia })
        .then(result => alert(result.message || 'Abono confirmado correctamente.'))
        .catch(error => alert(error.message));
    }
  };

  const onRejectClick = (abono) => {
    const motivo = window.prompt('Motivo de rechazo del abono:');
    if (!motivo) return;
    handleReject(abono.idAbono, motivo).catch(error => alert(error.message));
  };

  const onDeleteClick = (abono) => {
    if (window.confirm(`Eliminar abono pendiente #${abono.idAbono}?`)) {
      handleDelete(abono.idAbono).catch(error => alert(error.message));
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
        <button onClick={handleOpenCreate} className={styles.primaryButton}>
          Nuevo abono
        </button>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Total</span><span className={styles.kpiValue}>{total}</span></div>
        <div className={`${styles.kpiCard} ${styles.kpiCardWarning}`}><span className={styles.kpiLabel}>Pendientes</span><span className={`${styles.kpiValue} ${styles.kpiValueWarning}`}>{pendientes}</span></div>
        <div className={`${styles.kpiCard} ${styles.kpiCardSuccess}`}><span className={styles.kpiLabel}>Confirmados</span><span className={`${styles.kpiValue} ${styles.kpiValueSuccess}`}>{confirmados}</span></div>
        <div className={`${styles.kpiCard} ${styles.kpiCardDanger}`}><span className={styles.kpiLabel}>Rechazados</span><span className={`${styles.kpiValue} ${styles.kpiValueDanger}`}>{rechazados}</span></div>
      </div>

      <div className={styles.filterSection}>
        <input
          type="text"
          placeholder="Buscar por pedido, cliente o referencia..."
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
          <option value="CONFIRMADO">Confirmado</option>
          <option value="RECHAZADO">Rechazado</option>
        </select>
        <select value={filters.metodoPago} onChange={event => setFilters(prev => ({ ...prev, metodoPago: event.target.value }))} className={styles.inputField}>
          <option value="">Todos los metodos</option>
          <option value="EFECTIVO">Efectivo</option>
          <option value="TRANSFERENCIA">Transferencia</option>
        </select>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando abonos...</p>
        ) : filteredAbonos.length === 0 ? (
          <p className={styles.loadingText}>No se encontraron abonos.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeader}>ID</th>
                  <th className={styles.tableHeader}>Pedido</th>
                  <th className={styles.tableHeader}>Cliente</th>
                  <th className={styles.tableHeader}>Monto</th>
                  <th className={styles.tableHeader}>Metodo</th>
                  <th className={styles.tableHeader}>Estado</th>
                  <th className={styles.tableHeader}>Fecha</th>
                  <th className={styles.tableHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAbonos.map(abono => (
                  <tr key={abono.idAbono} className={styles.tableBodyRow}>
                    <td className={styles.tableCellId}>#{abono.idAbono}</td>
                    <td className={styles.tableCell}>#{abono.idPedido}</td>
                    <td className={styles.tableCell}>{abono.pedido?.cliente?.nombre || 'N/A'}</td>
                    <td className={styles.tableCell}><strong>{fmt(abono.monto)}</strong></td>
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
                            isStaff && abono.estado === 'PENDIENTE' && { label: 'Confirmar', onClick: () => onConfirmClick(abono), variant: 'success' },
                            isStaff && abono.estado === 'PENDIENTE' && { label: 'Rechazar', onClick: () => onRejectClick(abono), variant: 'danger' },
                            isStaff && abono.estado === 'PENDIENTE' && { label: 'Editar', onClick: () => handleOpenEdit(abono), variant: 'warning' },
                            isStaff && abono.estado === 'PENDIENTE' && { label: 'Eliminar', onClick: () => onDeleteClick(abono), variant: 'danger' },
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
          totalItems={filteredAbonos.length}
          totalPages={totalPages}
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
    </div>
  );
};
