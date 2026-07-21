import { useEffect, useState } from 'react';
import { Pagination } from '../../../../core/components/Pagination';
import { usePagination } from '../../../../core/hooks/usePagination';
import { formatDate } from '../../../../core/utils/fechaFormato';
import { notifications } from '../../../../core/utils/notifications';
import { useAuth } from '../../../../store/AuthContext';
import { useProductionQueue } from '../application/useProductionQueue';
import './ProductionQueuePage.css';

const styles = {
  pageContainer: 'production-queue-page-container',
  headerWrapper: 'production-queue-header-wrapper',
  breadcrumb: 'production-queue-breadcrumb',
  pageTitle: 'production-queue-page-title',
  pageSubtitle: 'production-queue-page-subtitle',
  headerActions: 'production-queue-header-actions',
  primaryButton: 'production-queue-primary-button',
  secondaryButton: 'production-queue-secondary-button',
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
  tableBodyRowDragging: 'production-queue-table-body-row-dragging',
  tableBodyRowDragOver: 'production-queue-table-body-row-drag-over',
  tableCellId: 'production-queue-table-cell-id',
  tableCell: 'production-queue-table-cell',
  dragCell: 'production-queue-drag-cell',
  dragHandle: 'production-queue-drag-handle',
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
const getRoleName = () => {
  const session = JSON.parse(localStorage.getItem('pixel_user') || '{}');
  return session?.rol?.nombre || 'Cliente';
};

const canReorderQueue = (role) => role === 'Admin' || role === 'Secretaria';

const formatQueueDate = (...dates) => {
  const validDate = dates.find(date => date && !Number.isNaN(new Date(date).getTime()));
  return validDate ? formatDate(validDate) : '--';
};

const mergeQueueOrder = (currentOrder, incoming) => {
  if (currentOrder.length === 0) return incoming;
  const incomingMap = new Map(incoming.map(item => [item.idPedido, item]));
  const ordered = currentOrder
    .filter(item => incomingMap.has(item.idPedido))
    .map(item => incomingMap.get(item.idPedido));
  const newItems = incoming.filter(item => !currentOrder.some(current => current.idPedido === item.idPedido));
  return [...ordered, ...newItems];
};

export const ProductionQueuePage = () => {
  const { hasPermission } = useAuth();
  const userRole = getRoleName();
  const canEditPosition = canReorderQueue(userRole) && hasPermission('disenos.produccion');
  const { pedidos, loading, saveOrder, savingOrder } = useProductionQueue();
  const [orderedPedidos, setOrderedPedidos] = useState([]);
  const [draftPedidos, setDraftPedidos] = useState([]);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [hasCustomOrder, setHasCustomOrder] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    if (isEditingOrder) return;
    setOrderedPedidos(prev => (hasCustomOrder ? mergeQueueOrder(prev, pedidos) : pedidos));
  }, [pedidos, hasCustomOrder, isEditingOrder]);

  const queueSource = isEditingOrder ? draftPedidos : orderedPedidos;
  const {
    currentPage,
    pageSize,
    paginatedItems,
    setCurrentPage,
    totalPages,
  } = usePagination(queueSource);

  const visibleItems = isEditingOrder ? draftPedidos : paginatedItems;
  const total = queueSource.length;
  const alDia = queueSource.filter(pedido => Number(pedido.saldoPendiente || 0) === 0).length;

  const handleStartEdit = () => {
    setDraftPedidos(orderedPedidos);
    setIsEditingOrder(true);
    setCurrentPage(1);
  };

  const handleCancelEdit = () => {
    setDraftPedidos([]);
    setDragIndex(null);
    setDragOverIndex(null);
    setIsEditingOrder(false);
  };

  const handleSaveEdit = async () => {
    try {
      await saveOrder(draftPedidos);
      setOrderedPedidos(draftPedidos);
      setHasCustomOrder(true);
      setDraftPedidos([]);
      setDragIndex(null);
      setDragOverIndex(null);
      setIsEditingOrder(false);
      setCurrentPage(1);
      notifications.success('Orden de produccion guardado correctamente.');
    } catch (error) {
      notifications.error(error.message || 'No se pudo guardar la posicion de la cola.');
    }
  };

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOver = (event, index) => {
    event.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    setDraftPedidos(prev => {
      const next = [...prev];
      const [movedItem] = next.splice(dragIndex, 1);
      next.splice(index, 0, movedItem);
      return next;
    });
    setDragIndex(null);
    setDragOverIndex(null);
  };

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
        {canEditPosition && total > 0 && (
          <div className={styles.headerActions}>
            {!isEditingOrder ? (
              <button type="button" className={styles.primaryButton} onClick={handleStartEdit}>
                Cambiar Posicion
              </button>
            ) : (
              <>
                <button type="button" className={styles.secondaryButton} onClick={handleCancelEdit} disabled={savingOrder}>
                  Cancelar
                </button>
                <button type="button" className={styles.primaryButton} onClick={handleSaveEdit} disabled={savingOrder}>
                  {savingOrder ? 'Guardando...' : 'Guardar'}
                </button>
              </>
            )}
          </div>
        )}
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
        ) : queueSource.length === 0 ? (
          <p className={styles.loadingText}>No hay pedidos en proceso actualmente.</p>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeadRow}>
                    {isEditingOrder && <th className={styles.tableHeader}>Mover</th>}
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
                  {visibleItems.map((pedido, index) => {
                    const realIndex = isEditingOrder ? index : (currentPage - 1) * pageSize + index;
                    const isDragging = isEditingOrder && dragIndex === index;
                    const isDragOver = isEditingOrder && dragOverIndex === index && dragIndex !== index;

                    return (
                    <tr
                      key={pedido.idPedido}
                      className={`${styles.tableBodyRow} ${isDragging ? styles.tableBodyRowDragging : ''} ${isDragOver ? styles.tableBodyRowDragOver : ''}`}
                      draggable={isEditingOrder}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={event => handleDragOver(event, index)}
                      onDrop={() => handleDrop(index)}
                      onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                    >
                      {isEditingOrder && (
                        <td className={styles.dragCell}>
                          <span className={styles.dragHandle}>drag_indicator</span>
                        </td>
                      )}
                      <td className={styles.tableCellId}>#{realIndex + 1}</td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.statusBadge} ${styles.statusInfo}`}>
                          Pedido #{pedido.idPedido}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.clientName}>{pedido.cliente?.nombre || 'Cliente no especificado'}</span>
                        <span className={styles.clientEmail}>{pedido.cliente?.correo || ''}</span>
                      </td>
                      <td className={styles.tableCell}>{formatQueueDate(pedido.fechaIngresoProduccion, pedido.fechaActualizacion, pedido.fechaCreacion)}</td>
                      <td className={styles.tableCell}>{formatQueueDate(pedido.fechaEntregaEstimada)}</td>
                      <td className={styles.tableCell}>
                        <strong className={styles.totalPrice}>{fmt(pedido.total)}</strong>
                      </td>
                      <td className={styles.tableCell}>{fmt(pedido.saldoPendiente)}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!isEditingOrder && (
              <Pagination
                classNames={styles}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                totalItems={queueSource.length}
                totalPages={totalPages}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
