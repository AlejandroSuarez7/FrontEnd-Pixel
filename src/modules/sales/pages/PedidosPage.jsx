// pedidos/presentation/PedidosPage.jsx
import { useState } from 'react';
import { Pagination } from '../../../core/components/Pagination';
import { notifications } from '../../../core/utils/notifications';
import { DEFAULT_PAGE_SIZE } from '../../../core/utils/serverPagination';
import { useConfirm } from '../../../shared/components/ConfirmDialog/ConfirmProvider';
import { TableActions } from '../../../shared/components/TableActions/TableActions';
import { useAuth } from '../../../store/AuthContext';
import { usePedidos } from '../pedidos/application/usePedidos';
import { PedidoDetailsModal } from '../pedidos/presentation/PedidoDetailsModal';
import { PedidoEditModal } from '../pedidos/presentation/PedidoEditModal';
import styles from '../pedidos/presentation/pedidos.module.css';

const ESTADO_PEDIDO_CLASS = {
  PENDIENTE:   styles.estadoPedidoPendiente,
  EN_PROCESO:  styles.estadoPedidoEnProceso,
  FINALIZADO:  styles.estadoPedidoFinalizado,
  ANULADO:     styles.estadoPedidoAnulado,
};

const ESTADO_PAGO_CLASS = {
  PENDIENTE: styles.estadoPagoPendiente,
  PARCIAL:   styles.estadoPagoParcial,
  COMPLETO:  styles.estadoPagoCompleto,
};

const PedidosPage = () => {
  const { hasPermission } = useAuth();
  const confirm = useConfirm();
  const session  = JSON.parse(localStorage.getItem('pixel_user') || '{}');
  const userRole = session?.rol?.nombre || 'Cliente';
  const isStaff  = userRole === 'Admin' || userRole === 'Secretaria';

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    pedidos,
    loading,
    handleUpdate,
    handleMarcarEnProceso,
    handleFinalizar,
    handleAnular,
    paginationMeta,
  } = usePedidos({
    page: currentPage,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm,
    sortBy: 'idPedido',
    order: 'desc',
  });

  const [isDetailsOpen, setIsDetailsOpen]   = useState(false);
  const [isEditOpen, setIsEditOpen]         = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);

  // KPIs
  const total      = paginationMeta.total;
  const pendientes = pedidos.filter(p => p.estadoPedido === 'PENDIENTE').length;
  const enProceso  = pedidos.filter(p => p.estadoPedido === 'EN_PROCESO').length;
  const finalizados = pedidos.filter(p => p.estadoPedido === 'FINALIZADO').length;

  const onEnProcesoClick = async (id) => {
    const accepted = await confirm({
      title: 'Pasar a proceso',
      message: 'Marcar este pedido como EN PROCESO?',
      confirmText: 'Pasar a proceso',
      variant: 'warning',
    });

    if (!accepted) return;

    try {
      await handleMarcarEnProceso(id);
      notifications.success('Pedido marcado en proceso.');
    } catch (err) {
      notifications.error(err.message || 'No se pudo marcar el pedido en proceso.');
    }
  };

  const onFinalizarClick = async (id) => {
    const accepted = await confirm({
      title: 'Finalizar pedido',
      message: 'Finalizar este pedido? Esta accion indica que la produccion esta completa.',
      confirmText: 'Finalizar',
      variant: 'success',
    });

    if (!accepted) return;

    try {
      await handleFinalizar(id);
      notifications.success('Pedido finalizado correctamente.');
    } catch (err) {
      notifications.error(err.message || 'No se pudo finalizar el pedido.');
    }
  };

  const onAnularClick = async (id) => {
    const accepted = await confirm({
      title: 'Anular pedido',
      message: 'Anular este pedido? Esta accion no se puede deshacer.',
      confirmText: 'Anular',
      variant: 'danger',
    });

    if (!accepted) return;

    try {
      await handleAnular(id);
      notifications.success('Pedido anulado correctamente.');
    } catch (err) {
      notifications.error(err.message || 'No se pudo anular el pedido.');
    }
  };

  const fmtFecha = (val) => val
    ? new Date(val).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className={styles.pageContainer}>

      {/* HEADER */}
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Producción / Pedidos</span>
          <h1 className={styles.pageTitle}>Gestión de Pedidos</h1>
          <p className={styles.pageSubtitle}>
            {isStaff
              ? 'Gestiona el ciclo de producción de los pedidos activos.'
              : 'Consulta el estado y avance de tus pedidos.'}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total pedidos</span>
          <span className={styles.kpiValue}>{total}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardWarning}`}>
          <span className={styles.kpiLabel}>Pendientes</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueWarning}`}>{pendientes}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardInfo}`}>
          <span className={styles.kpiLabel}>En proceso</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueInfo}`}>{enProceso}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardSuccess}`}>
          <span className={styles.kpiLabel}>Finalizados</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueSuccess}`}>{finalizados}</span>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className={styles.filterSection}>
        <input
          type="text"
          placeholder="Buscar pedido por cliente o descripción..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.searchInput}
        />
      </div>

      {/* TABLA */}
      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando pedidos...</p>
        ) : pedidos.length === 0 ? (
          <p className={styles.loadingText}>No se encontraron pedidos.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeader}>ID</th>
                  <th className={styles.tableHeader}>Cliente</th>
                  <th className={styles.tableHeader}>Estado pedido</th>
                  <th className={styles.tableHeader}>Estado pago</th>
                  <th className={styles.tableHeader}>Total</th>
                  <th className={styles.tableHeader}>Saldo</th>
                  <th className={styles.tableHeader}>Entrega estimada</th>
                  <th className={styles.tableHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pedido) => (
                  <tr key={pedido.idPedido} className={styles.tableBodyRow}>

                    <td className={styles.tableCellId}>#{pedido.idPedido}</td>

                    <td className={styles.tableCell}>
                      <span className={styles.clientName}>{pedido.cliente?.nombre || 'N/A'}</span>
                      <span className={styles.clientEmail}>{pedido.cliente?.correo || ''}</span>
                    </td>

                    <td className={styles.tableCell}>
                      <span className={`${styles.statusBadge} ${ESTADO_PEDIDO_CLASS[pedido.estadoPedido] || ''}`}>
                        {pedido.estadoPedido.replace('_', ' ')}
                      </span>
                    </td>

                    <td className={styles.tableCell}>
                      <span className={`${styles.statusBadge} ${ESTADO_PAGO_CLASS[pedido.estadoPago] || ''}`}>
                        {pedido.estadoPago}
                      </span>
                    </td>

                    <td className={styles.tableCell}>
                      <strong className={styles.totalPrice}>
                        ${Number(pedido.total).toLocaleString('es-CO')}
                      </strong>
                    </td>

                    <td className={styles.tableCell}>
                      {Number(pedido.saldoPendiente) > 0
                        ? <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                            ${Number(pedido.saldoPendiente).toLocaleString('es-CO')}
                          </span>
                        : <span className={styles.tableCellMuted}>Al día</span>
                      }
                    </td>

                    <td className={styles.tableCell}>
                      <span className={pedido.fechaEntregaEstimada ? '' : styles.tableCellMuted}>
                        {pedido.fechaEntregaEstimada}
                      </span>
                    </td>

                    <td className={styles.actionsCell}>
                      <TableActions
                        primaryAction={{ label: 'Ver', onClick: () => { setSelectedPedido(pedido); setIsDetailsOpen(true); }, variant: 'accent' }}
                        actions={[
                          hasPermission('pedidos.pasar_proceso') && isStaff && pedido.estadoPedido === 'PENDIENTE' && { label: 'En proceso', onClick: () => onEnProcesoClick(pedido.idPedido), variant: 'info' },
                          hasPermission('pedidos.finalizar') && isStaff && pedido.estadoPedido === 'EN_PROCESO' && { label: 'Finalizar', onClick: () => onFinalizarClick(pedido.idPedido), variant: 'success' },
                          hasPermission('pedidos.anular') && isStaff && pedido.estadoPedido !== 'FINALIZADO' && pedido.estadoPedido !== 'ANULADO' && { label: 'Anular', onClick: () => onAnularClick(pedido.idPedido), variant: 'danger' },
                          hasPermission('pedidos.editar') && pedido.estadoPedido !== 'FINALIZADO' && pedido.estadoPedido !== 'ANULADO' && {
                            label: 'Editar',
                            onClick: () => { setSelectedPedido(pedido); setIsEditOpen(true); },
                            variant: 'warning',
                          },
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

      {/* MODALES */}
      <PedidoDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setSelectedPedido(null); }}
        pedido={selectedPedido}
      />

      <PedidoEditModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedPedido(null); }}
        onSubmit={handleUpdate}
        pedido={selectedPedido}
        isStaff={isStaff}
      />
    </div>
  );
};

export default PedidosPage;
