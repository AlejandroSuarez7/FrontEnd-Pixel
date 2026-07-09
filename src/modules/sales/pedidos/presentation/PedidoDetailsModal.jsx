// pedidos/presentation/PedidoDetailsModal.jsx
import { formatDate } from '../../../../core/utils/fechaFormato';
import styles from './pedidos.module.css';

const ESTADO_PEDIDO_CLASS = {
  PENDIENTE:   styles.estadoPedidoPendiente,
  EN_PROCESO:  styles.estadoPedidoEnProceso,
  FINALIZADO:  styles.estadoPedidoFinalizado,
  ANULADO:     styles.estadoPedidoAnulado,
};

const ESTADO_PAGO_CLASS = {
  PENDIENTE:    styles.estadoPagoPendiente,
  PARCIAL:      styles.estadoPagoParcial,
  COMPLETO:     styles.estadoPagoCompleto,
};

const ISO_DATE_IN_BRACKETS = /\[(\d{4}-\d{2}-\d{2}T[^\]]+)\]/g;
const QUEUE_ORDER_MARKER_GLOBAL = /\n?\[\[PIXEL_QUEUE_ORDER:\d+\]\]/g;

const formatObservaciones = (observaciones) => {
  const cleanObservaciones = (observaciones || '').replace(QUEUE_ORDER_MARKER_GLOBAL, '').trim();
  if (!cleanObservaciones) return 'Sin observaciones registradas';
  return cleanObservaciones.replace(ISO_DATE_IN_BRACKETS, (_, date) => formatDate(date));
};

export const PedidoDetailsModal = ({ isOpen, onClose, pedido }) => {
  if (!isOpen || !pedido) return null;

  const fmt = (val) => `$${Number(val || 0).toLocaleString('es-CO')}`;
  const clienteContacto = [pedido.cliente?.correo, pedido.cliente?.telefono].filter(Boolean).join(' | ');

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalLg}`}>

        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Pedido #{pedido.idPedido}</h3>
            <p className={styles.modalSubtitle}>
              Cliente: {pedido.cliente?.nombre || 'N/A'} · Cotización #{pedido.idCotizacion}
            </p>
            {clienteContacto && <p className={styles.modalSubtitle}>{clienteContacto}</p>}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className={`${styles.statusBadge} ${ESTADO_PEDIDO_CLASS[pedido.estadoPedido] || ''}`}>
              {pedido.estadoPedido}
            </span>
            <span className={`${styles.statusBadge} ${ESTADO_PAGO_CLASS[pedido.estadoPago] || ''}`}>
              {pedido.estadoPago}
            </span>
            <button onClick={onClose} className={styles.modalCloseBtn}>✕</button>
          </div>
        </div>

        <div className={styles.form}>

          {/* Observaciones */}
          <div className={styles.detailsInfoBox}>
            <strong>Observaciones:</strong>{' '}
            {formatObservaciones(pedido.observaciones)}
          </div>

          {/* Fechas */}
          <div className={styles.readOnlyGrid}>
            <div className={styles.readOnlyItem}>
              Fecha de creación
              <strong>{pedido.fechaCreacion ? formatDate(pedido.fechaCreacion) : '--'}</strong>
            </div>
            <div className={styles.readOnlyItem}>
              Entrega estimada
              <strong>{pedido.fechaEntregaEstimada ? pedido.fechaEntregaEstimada : "--"}</strong>
            </div>
            <div className={styles.readOnlyItem}>
              Fecha finalizado
              <strong>{pedido.fechaFinalizado ? pedido.fechaFinalizado : "--"}</strong>
            </div>
          </div>

          {/* Detalles de producción */}
          <p className={styles.detailsSectionTitle}>Ítems de producción</p>

          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeader}>Descripción</th>
                  <th className={styles.tableHeader}>Técnica</th>
                  <th className={styles.tableHeader}>Cantidad</th>
                  <th className={styles.tableHeader}>Precio unit.</th>
                  <th className={styles.tableHeader}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {!pedido.detalles || pedido.detalles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className={styles.loadingText}>
                      Este pedido no tiene ítems registrados.
                    </td>
                  </tr>
                ) : (
                  pedido.detalles.map((det) => (
                    <tr key={det.idDetallePedido} className={styles.tableBodyRow}>
                      <td className={styles.tableCell}>
                        <span style={{ fontWeight: 500 }}>{det.descripcion}</span>
                        {det.observaciones && (
                          <small style={{ display: 'block', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            {det.observaciones}
                          </small>
                        )}
                      </td>
                      <td className={styles.tableCell}>{det.tecnica?.nombre || `#${det.idTecnica}`}</td>
                      <td className={styles.tableCell}>{det.cantidad}</td>
                      <td className={styles.tableCell}>{fmt(det.precioUnitario)}</td>
                      <td className={styles.tableCell}><strong>{fmt(det.subtotal)}</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className={styles.totalBlock}>
            <div className={styles.totalBlockRow}>
              <span>Total del pedido</span>
              <span>{fmt(pedido.total)}</span>
            </div>
            <div className={styles.totalBlockRow}>
              <span>Total pagado</span>
              <span>{fmt(pedido.totalPagado)}</span>
            </div>
            <div className={styles.grandTotal}>
              <span>Saldo pendiente</span>
              <span>{fmt(pedido.saldoPendiente)}</span>
            </div>
          </div>

        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnPrimary}>
            Cerrar ventana
          </button>
        </div>

      </div>
    </div>
  );
};
