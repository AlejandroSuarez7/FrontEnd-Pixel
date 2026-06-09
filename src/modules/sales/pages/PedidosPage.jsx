// pedidos/presentation/PedidosPage.jsx
import React, { useState } from 'react';
import { Pagination } from '../../../core/components/Pagination';
import { usePagination } from '../../../core/hooks/usePagination';
import { TableActions } from '../../../shared/components/TableActions/TableActions';
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
  const session  = JSON.parse(localStorage.getItem('pixel_user') || '{}');
  const userRole = session?.rol?.nombre || 'Cliente';
  const isStaff  = userRole === 'Admin' || userRole === 'Secretaria';

  const [searchTerm, setSearchTerm] = useState('');

  const {
    pedidos,
    loading,
    handleUpdate,
    handleMarcarEnProceso,
    handleFinalizar,
    handleAnular,
  } = usePedidos({ search: searchTerm });

  const [isDetailsOpen, setIsDetailsOpen]   = useState(false);
  const [isEditOpen, setIsEditOpen]         = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);

  // KPIs
  const total      = pedidos.length;
  const pendientes = pedidos.filter(p => p.estadoPedido === 'PENDIENTE').length;
  const enProceso  = pedidos.filter(p => p.estadoPedido === 'EN_PROCESO').length;
  const finalizados = pedidos.filter(p => p.estadoPedido === 'FINALIZADO').length;
  const {
    currentPage,
    pageSize,
    paginatedItems: paginatedPedidos,
    setCurrentPage,
    totalPages,
  } = usePagination(pedidos);

  const onEnProcesoClick = (id) => {
    if (window.confirm('¿Marcar este pedido como EN PROCESO?')) {
      handleMarcarEnProceso(id).catch(err => alert(err.message));
    }
  };

  const onFinalizarClick = (id) => {
    if (window.confirm('¿Finalizar este pedido? Esta acción indica que la producción está completa.')) {
      handleFinalizar(id).catch(err => alert(err.message));
    }
  };

  const onAnularClick = (id) => {
    if (window.confirm('¿Estás seguro de que deseas ANULAR este pedido?\n\nEsta acción no se puede deshacer.')) {
      handleAnular(id).catch(err => alert(err.message));
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
          onChange={e => setSearchTerm(e.target.value)}
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
                {paginatedPedidos.map((pedido) => (
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
                          isStaff && pedido.estadoPedido === 'PENDIENTE' && { label: 'En proceso', onClick: () => onEnProcesoClick(pedido.idPedido), variant: 'info' },
                          isStaff && pedido.estadoPedido === 'EN_PROCESO' && { label: 'Finalizar', onClick: () => onFinalizarClick(pedido.idPedido), variant: 'success' },
                          isStaff && pedido.estadoPedido !== 'FINALIZADO' && pedido.estadoPedido !== 'ANULADO' && { label: 'Anular', onClick: () => onAnularClick(pedido.idPedido), variant: 'danger' },
                          pedido.estadoPedido !== 'FINALIZADO' && pedido.estadoPedido !== 'ANULADO' && {
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
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          totalItems={pedidos.length}
          totalPages={totalPages}
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
