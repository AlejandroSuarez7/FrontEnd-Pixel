// pedidos/presentation/PedidoDetailsModal.jsx
import { formatDate } from '../../../../core/utils/fechaFormato';
import {
  formatMoneyCOP,
  formatPercentage,
  getQuoteDiscountTotal,
  getQuoteSubtotalBruto,
  getQuoteSubtotalWithDiscount,
} from '../../../../core/utils/formatters';
import styles from './pedidos.module.css';

const ESTADO_PEDIDO_CLASS = {
  PENDIENTE: styles.estadoPedidoPendiente,
  EN_PROCESO: styles.estadoPedidoEnProceso,
  PENDIENTE_SALDO_FINAL: styles.estadoPedidoPendienteSaldo,
  FINALIZADO: styles.estadoPedidoFinalizado,
  ENTREGADO: styles.estadoPedidoEntregado,
  ANULADO: styles.estadoPedidoAnulado,
};

const ESTADO_PAGO_CLASS = {
  PENDIENTE: styles.estadoPagoPendiente,
  PARCIAL: styles.estadoPagoParcial,
  COMPLETO: styles.estadoPagoCompleto,
};

const ESTADO_PEDIDO_LABEL = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En produccion',
  PENDIENTE_SALDO_FINAL: 'Pendiente saldo final',
  FINALIZADO: 'Finalizado',
  ENTREGADO: 'Entregado',
  ANULADO: 'Anulado',
};

const ESTADO_PAGO_LABEL = {
  PENDIENTE: 'Pendiente',
  PARCIAL: 'Parcial',
  COMPLETO: 'Completo',
};

const ISO_DATE_IN_BRACKETS = /\[(\d{4}-\d{2}-\d{2}T[^\]]+)\]/g;
const QUEUE_ORDER_MARKER_GLOBAL = /\n?\[\[PIXEL_QUEUE_ORDER:\d+\]\]/g;

const formatObservaciones = (observaciones) => {
  const cleanObservaciones = (observaciones || '').replace(QUEUE_ORDER_MARKER_GLOBAL, '').trim();
  if (!cleanObservaciones) return 'Sin observaciones';
  return cleanObservaciones.replace(ISO_DATE_IN_BRACKETS, (_, date) => formatDate(date));
};

const formatDateValue = (value, fallback = 'Por definir') => {
  if (!value) return fallback;
  return formatDate(value);
};

export const PedidoDetailsModal = ({ isOpen, onClose, pedido }) => {
  if (!isOpen || !pedido) return null;

  const fmt = (value, fallback = '$0') => formatMoneyCOP(value, fallback);
  const clienteNombre = pedido.cliente?.nombre || 'Cliente no especificado';
  const clienteCorreo = pedido.cliente?.correo || 'Correo no especificado';
  const clienteTelefono = pedido.cliente?.telefono || 'Telefono no especificado';
  const clienteContacto = [pedido.cliente?.correo, pedido.cliente?.telefono].filter(Boolean).join(' | ');
  const detalles = Array.isArray(pedido.detalles) ? pedido.detalles : [];
  const estadoPedidoLabel = ESTADO_PEDIDO_LABEL[pedido.estadoPedido] || pedido.estadoPedido || 'Sin estado';
  const estadoPagoLabel = ESTADO_PAGO_LABEL[pedido.estadoPago] || pedido.estadoPago || 'Sin estado';
  const subtotal = pedido.subtotal ?? null;
  const descuentoTotal = pedido.descuentoTotal ?? 0;
  const costosAdicionales = pedido.costosAdicionales ?? 0;
  const totalFinal = pedido.total ?? 0;
  const totalPagado = pedido.totalPagado ?? 0;
  const saldoPendiente = pedido.saldoPendiente ?? 0;

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalLg} ${styles.orderDetailsModal}`}>
        <div className={`${styles.modalHeader} ${styles.orderDetailsHeader}`}>
          <div>
            <h3 className={styles.modalTitle}>Pedido #{pedido.idPedido}</h3>
            <p className={styles.modalSubtitle}>
              Cliente: {clienteNombre} · Cotizacion #{pedido.idCotizacion || 'No asociada'}
            </p>
            {clienteContacto && <p className={styles.modalSubtitle}>{clienteContacto}</p>}
          </div>

          <div className={styles.orderDetailsHeaderActions}>
            <span className={`${styles.statusBadge} ${ESTADO_PEDIDO_CLASS[pedido.estadoPedido] || ''}`}>
              {estadoPedidoLabel}
            </span>
            <span className={`${styles.statusBadge} ${ESTADO_PAGO_CLASS[pedido.estadoPago] || ''}`}>
              {estadoPagoLabel}
            </span>
            <button type="button" onClick={onClose} className={styles.modalCloseBtn}>
              x
            </button>
          </div>
        </div>

        <div className={styles.form}>
          <div className={styles.orderSummaryGrid}>
            <div className={styles.orderSummaryCard}>
              <span>Cliente</span>
              <strong>{clienteNombre}</strong>
              <small>{clienteCorreo}</small>
            </div>
            <div className={styles.orderSummaryCard}>
              <span>Estado pedido</span>
              <strong>{estadoPedidoLabel}</strong>
              <small>Cotizacion #{pedido.idCotizacion || 'No asociada'}</small>
            </div>
            <div className={styles.orderSummaryCard}>
              <span>Estado pago</span>
              <strong>{estadoPagoLabel}</strong>
              <small>{Number(saldoPendiente) > 0 ? 'Con saldo pendiente' : 'Sin saldo pendiente'}</small>
            </div>
            <div className={styles.orderSummaryCard}>
              <span>Total</span>
              <strong>{fmt(totalFinal)}</strong>
              <small>Valor final del pedido</small>
            </div>
            <div className={styles.orderSummaryCard}>
              <span>Pagado</span>
              <strong>{fmt(totalPagado)}</strong>
              <small>Abonos confirmados</small>
            </div>
            <div className={`${styles.orderSummaryCard} ${Number(saldoPendiente) > 0 ? styles.orderSummaryCardWarning : styles.orderSummaryCardSuccess}`}>
              <span>Saldo</span>
              <strong>{fmt(saldoPendiente)}</strong>
              <small>{Number(saldoPendiente) > 0 ? 'Pendiente por pagar' : 'Pago completo'}</small>
            </div>
          </div>

          {pedido.estadoPedido === 'PENDIENTE_SALDO_FINAL' && (
            <div className={`${styles.detailsInfoBox} ${styles.orderNoticeWarning}`}>
              <strong>Saldo final pendiente:</strong> El pedido termino produccion y falta confirmar el saldo final para coordinar la entrega.
            </div>
          )}

          {pedido.estadoPedido === 'ENTREGADO' && (
            <div className={`${styles.detailsInfoBox} ${styles.orderNoticeSuccess}`}>
              <strong>Producto entregado:</strong> El cliente ya reclamo o recibio este pedido.
            </div>
          )}

          {pedido.estadoPedido === 'ANULADO' && (
            <div className={`${styles.detailsInfoBox} ${styles.orderNoticeDanger}`}>
              <strong>Pedido anulado:</strong> El historial, los abonos y los disenos asociados se conservan para consulta.
            </div>
          )}

          <div className={`${styles.readOnlyGrid} ${styles.orderDatesGrid}`}>
            <div className={styles.readOnlyItem}>
              Fecha de creacion
              <strong>{formatDateValue(pedido.fechaCreacion, 'No aplica')}</strong>
            </div>
            <div className={styles.readOnlyItem}>
              Entrega estimada
              <strong>{formatDateValue(pedido.fechaEntregaEstimada)}</strong>
            </div>
            <div className={styles.readOnlyItem}>
              Fecha finalizado
              <strong>{formatDateValue(pedido.fechaFinalizado, 'No aplica')}</strong>
            </div>
            <div className={styles.readOnlyItem}>
              Fecha entregado
              <strong>{formatDateValue(pedido.fechaEntregado, 'No aplica')}</strong>
            </div>
          </div>

          <div className={styles.orderContentGrid}>
            <section className={styles.orderSection}>
              <p className={styles.detailsSectionTitle}>Producto del pedido</p>
              {detalles.length === 0 ? (
                <div className={styles.orderEmptyState}>Este pedido no tiene producto registrado.</div>
              ) : (
                <div className={styles.orderItemsList}>
                  {detalles.map((det, index) => {
                    const subtotalBruto = getQuoteSubtotalBruto(det);
                    const subtotalFinal = getQuoteSubtotalWithDiscount(det);
                    const itemDiscountTotal = getQuoteDiscountTotal(det);

                    return (
                      <article key={det.idDetallePedido || index} className={styles.orderItemCard}>
                        <div className={styles.orderItemHeader}>
                          <div>
                            <span className={styles.orderItemEyebrow}>Producto #{index + 1}</span>
                            <h4>{det.descripcion || 'Producto no especificado'}</h4>
                          </div>
                          <span className={styles.orderItemQuantity}>{det.cantidad || 0} uds</span>
                        </div>

                        {det.observaciones && <p className={styles.orderItemNote}>{det.observaciones}</p>}

                        <div className={styles.orderItemMetrics}>
                          <div>
                            <span>Tecnica</span>
                            <strong>{det.tecnica?.nombre || (det.idTecnica ? `Tecnica #${det.idTecnica}` : 'No especificada')}</strong>
                          </div>
                          <div>
                            <span>Precio unitario</span>
                            <strong>{fmt(det.precioUnitario)}</strong>
                          </div>
                          <div>
                            <span>Descuento</span>
                            <strong>{formatPercentage(det.descuentoPorcentaje, '0%')}</strong>
                            {itemDiscountTotal > 0 && <small>-{fmt(itemDiscountTotal)}</small>}
                          </div>
                          <div>
                            <span>Subtotal bruto</span>
                            <strong>{fmt(subtotalBruto)}</strong>
                          </div>
                          <div>
                            <span>Subtotal final</span>
                            <strong>{fmt(subtotalFinal)}</strong>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className={styles.orderTotalsPanel}>
              <p className={styles.detailsSectionTitle}>Desglose economico</p>
              <div className={styles.orderMoneyRow}>
                <span>Subtotal bruto</span>
                <strong>{subtotal !== null ? fmt(subtotal) : 'No especificado'}</strong>
              </div>
              <div className={styles.orderMoneyRow}>
                <span>Descuento</span>
                <strong>{Number(descuentoTotal) > 0 ? `-${fmt(descuentoTotal)}` : 'Sin descuento'}</strong>
              </div>
              <div className={styles.orderMoneyRow}>
                <span>Costos adicionales</span>
                <strong>{fmt(costosAdicionales)}</strong>
              </div>
              <div className={styles.orderMoneyRow}>
                <span>Costo de diseno</span>
                <strong>No aplica</strong>
              </div>
              <div className={`${styles.orderMoneyRow} ${styles.orderMoneyTotal}`}>
                <span>Total final</span>
                <strong>{fmt(totalFinal)}</strong>
              </div>
              <div className={styles.orderMoneyRow}>
                <span>Total pagado</span>
                <strong>{fmt(totalPagado)}</strong>
              </div>
              <div className={`${styles.orderMoneyRow} ${styles.orderMoneyBalance}`}>
                <span>Saldo pendiente</span>
                <strong>{fmt(saldoPendiente)}</strong>
              </div>
            </aside>
          </div>

          <div className={styles.orderNotesGrid}>
            <div className={styles.orderNoteBox}>
              <span>Observaciones</span>
              <p>{formatObservaciones(pedido.observaciones)}</p>
            </div>
            <div className={styles.orderNoteBox}>
              <span>Contacto</span>
              <p>{clienteTelefono}</p>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.btnPrimary}>
            Cerrar ventana
          </button>
        </div>
      </div>
    </div>
  );
};
