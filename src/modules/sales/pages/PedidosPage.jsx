// pedidos/presentation/PedidosPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from '../../../core/components/Pagination';
import { notifications } from '../../../core/utils/notifications';
import { formatCalendarDate } from '../../../core/utils/fechaFormato';
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
  PENDIENTE_SALDO_FINAL: styles.estadoPedidoPendienteSaldo,
  FINALIZADO:  styles.estadoPedidoFinalizado,
  ENTREGADO:   styles.estadoPedidoEntregado,
  ANULADO:     styles.estadoPedidoAnulado,
};

const ESTADO_PAGO_CLASS = {
  PENDIENTE: styles.estadoPagoPendiente,
  PARCIAL:   styles.estadoPagoParcial,
  COMPLETO:  styles.estadoPagoCompleto,
};

const PedidosPage = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const confirm = useConfirm();
  const userRole = user?.rol?.nombre || user?.rol || user?.nombreRol || 'Cliente';
  const isStaff  = userRole === 'Admin' || userRole === 'Secretaria';

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    pedidos,
    loading,
    error,
    refetch,
    handleUpdateEstimatedDelivery,
    handleMarcarEnProceso,
    handlePendienteSaldo,
    handleFinalizar,
    handleAnular,
    handleConfirmarEntrega,
    handleActualizarRequiereDiseno,
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
  const [pendingDesignRequirementId, setPendingDesignRequirementId] = useState(null);

  // KPIs
  const total      = paginationMeta.total;
  const pendientes = pedidos.filter(p => p.estadoPedido === 'PENDIENTE').length;
  const enProceso  = pedidos.filter(p => p.estadoPedido === 'EN_PROCESO').length;
  const saldoFinal = pedidos.filter(p => p.estadoPedido === 'PENDIENTE_SALDO_FINAL').length;
  const finalizados = pedidos.filter(p => p.estadoPedido === 'FINALIZADO').length;
  const canConfirmDelivery = (pedido) => (
    pedido.estadoPedido === 'FINALIZADO' &&
    (pedido.estadoPago === 'COMPLETO' || Number(pedido.saldoPendiente || 0) <= 0)
  );
  const canFinalizePedido = (pedido) => pedido.puedeFinalizar === true;

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

  const onPendienteSaldoClick = async (id) => {
    const accepted = await confirm({
      title: 'Solicitar saldo final',
      message: 'El cliente sera notificado por correo de que el pedido termino produccion, pero falta pagar el saldo final para coordinar la entrega. Recuerdale revisar SPAM o correo no deseado si no lo encuentra.',
      confirmText: 'Confirmar',
      variant: 'warning',
    });

    if (!accepted) return;

    try {
      await handlePendienteSaldo(id);
      notifications.success('Saldo final solicitado. El cliente fue notificado por correo. Recuerdale revisar SPAM o correo no deseado si no lo encuentra.');
    } catch (err) {
      notifications.error(err.message || 'No se pudo solicitar el saldo final.');
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
      notifications.error(err.message || 'No se puede finalizar porque el pedido aun tiene saldo pendiente.');
    }
  };

  const onAnularClick = async (id) => {
    const result = await confirm({
      title: 'Anular pedido',
      message: 'Estas seguro de anular este pedido? Esta accion conservara el historial, abonos y disenos asociados.',
      confirmText: 'Anular',
      variant: 'danger',
      input: true,
      inputLabel: 'Motivo de anulacion (opcional)',
      inputPlaceholder: 'Ej: El cliente cancelo la solicitud.',
    });

    if (!result.confirmed) return;

    try {
      await handleAnular(id, result.value);
      notifications.success('Pedido anulado correctamente.');
    } catch (err) {
      notifications.error(err.message || 'No se pudo anular el pedido.');
    }
  };

  const onConfirmarEntregaClick = async (id) => {
    const accepted = await confirm({
      title: 'Confirmar entrega del producto',
      message: 'Confirmas que el cliente ya reclamo o recibio este pedido? Esta accion cerrara definitivamente el proceso.',
      confirmText: 'Confirmar entrega',
      variant: 'success',
    });

    if (!accepted) return;

    try {
      await handleConfirmarEntrega(id);
      notifications.success('Entrega confirmada correctamente. El cliente sera notificado por correo. Recuerdale revisar SPAM o correo no deseado si no lo encuentra.');
    } catch (err) {
      notifications.error(err.message || 'No se pudo confirmar la entrega.');
    }
  };

  const onToggleDesignRequirement = async (detalle) => {
    if (!selectedPedido || !detalle?.idDetallePedido) return;

    const nextValue = detalle.requiereDiseno === false;
    const accepted = await confirm({
      title: 'Actualizar requisito de diseno',
      message: 'Confirmas cambiar si este producto requiere diseno?',
      confirmText: 'Confirmar',
      variant: 'warning',
    });

    if (!accepted) return;

    setPendingDesignRequirementId(detalle.idDetallePedido);
    try {
      await handleActualizarRequiereDiseno(selectedPedido.idPedido, detalle.idDetallePedido, nextValue);
      setSelectedPedido((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          detalles: (prev.detalles || []).map((item) => (
            item.idDetallePedido === detalle.idDetallePedido
              ? { ...item, requiereDiseno: nextValue }
              : item
          )),
        };
      });
      notifications.success(nextValue ? 'El producto fue marcado como requiere diseno.' : 'El producto fue marcado como no requiere diseno.');
    } catch (error) {
      notifications.error(error.message || 'No se pudo actualizar el requisito de diseno.');
    } finally {
      setPendingDesignRequirementId(null);
    }
  };

  const fmtFecha = (val) => formatCalendarDate(val);

  const getClientName = (cliente) => cliente?.nombre || 'Cliente no especificado';
  const getContactText = (cliente) => [cliente?.correo, cliente?.telefono].filter(Boolean).join(' | ');

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
        <div className={`${styles.kpiCard} ${styles.kpiCardWarning}`}>
          <span className={styles.kpiLabel}>Saldo final</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueWarning}`}>{saldoFinal}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardSuccess}`}>
          <span className={styles.kpiLabel}>Finalizados</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueSuccess}`}>{finalizados}</span>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className={styles.filterSection}>
        <label className={styles.filterField}>
          <span>Buscar pedidos</span>
          <input
            type="text"
            placeholder="Cliente, pedido o descripcion..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.searchInput}
          />
        </label>
      </div>

      {/* TABLA */}
      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando pedidos...</p>
        ) : error && pedidos.length === 0 ? (
          <div className={styles.loadingText}>
            <p>{error.message || 'No se pudieron cargar los pedidos.'}</p>
            <button type="button" className={styles.primaryButton} onClick={refetch}>Reintentar</button>
          </div>
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
                      <span className={styles.clientName}>{getClientName(pedido.cliente)}</span>
                      <span className={styles.clientEmail}>{getContactText(pedido.cliente)}</span>
                    </td>

                    <td className={styles.tableCell}>
                      <span className={`${styles.statusBadge} ${ESTADO_PEDIDO_CLASS[pedido.estadoPedido] || ''}`}>
                        {pedido.estadoPedido === 'PENDIENTE_SALDO_FINAL'
                          ? 'Pendiente saldo final'
                          : pedido.estadoPedido === 'ENTREGADO'
                            ? 'Entregado'
                            : pedido.estadoPedido === 'ANULADO'
                              ? 'Anulado'
                            : pedido.estadoPedido.replace('_', ' ')}
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
                        ? <span className={styles.balanceDue}>
                            ${Number(pedido.saldoPendiente).toLocaleString('es-CO')}
                          </span>
                        : <span className={styles.balancePaid}>Al dia</span>
                      }
                    </td>

                    <td className={styles.tableCell}>
                      <span className={pedido.fechaEntregaEstimada ? styles.deliveryDate : styles.tableCellMuted}>
                        {pedido.fechaEntregaEstimada ? fmtFecha(pedido.fechaEntregaEstimada) : 'Por definir'}
                      </span>
                    </td>

                    <td className={styles.actionsCell}>
                      <TableActions
                        primaryAction={{ label: 'Ver', onClick: () => { setSelectedPedido(pedido); setIsDetailsOpen(true); }, variant: 'accent' }}
                        actions={[
                          hasPermission('pedidos.ver') && isStaff && { label: 'Ver expediente', onClick: () => navigate(`/dashboard/orders/${pedido.idPedido}/expediente`), variant: 'accent' },
                          hasPermission('pedidos.pasar_proceso') && isStaff && pedido.estadoPedido === 'PENDIENTE' && { label: 'En proceso', onClick: () => onEnProcesoClick(pedido.idPedido), variant: 'info' },
                          hasPermission('pedidos.finalizar') && isStaff && pedido.puedeSolicitarSaldoFinal === true && { label: 'Solicitar saldo final', onClick: () => onPendienteSaldoClick(pedido.idPedido), variant: 'warning' },
                          hasPermission('pedidos.finalizar') && isStaff && canFinalizePedido(pedido) && { label: 'Finalizar pedido', onClick: () => onFinalizarClick(pedido.idPedido), variant: 'success' },
                          hasPermission('pedidos.finalizar') && isStaff && canConfirmDelivery(pedido) && { label: 'Confirmar entrega', onClick: () => onConfirmarEntregaClick(pedido.idPedido), variant: 'success' },
                          hasPermission('pedidos.anular') && isStaff && pedido.estadoPedido !== 'FINALIZADO' && pedido.estadoPedido !== 'ENTREGADO' && pedido.estadoPedido !== 'ANULADO' && { label: 'Anular', onClick: () => onAnularClick(pedido.idPedido), variant: 'danger' },
                          hasPermission('pedidos.editar') && pedido.estadoPedido !== 'FINALIZADO' && pedido.estadoPedido !== 'ENTREGADO' && pedido.estadoPedido !== 'ANULADO' && {
                            label: 'Asignar fecha estimada',
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
        canEditDesignRequirement={hasPermission('pedidos.editar') && isStaff}
        onToggleDesignRequirement={onToggleDesignRequirement}
        pendingDesignRequirementId={pendingDesignRequirementId}
      />

      <PedidoEditModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedPedido(null); }}
        onSubmit={handleUpdateEstimatedDelivery}
        pedido={selectedPedido}
      />
    </div>
  );
};

export default PedidosPage;
