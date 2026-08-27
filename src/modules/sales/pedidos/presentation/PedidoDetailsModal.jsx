// pedidos/presentation/PedidoDetailsModal.jsx
import { formatCalendarDate, formatDate } from '../../../../core/utils/fechaFormato';
import {
  formatMoneyCOP,
  formatPercentage,
  toNumberOrNull,
} from '../../../../core/utils/formatters';
import { getDesignCoverageInfo } from '../../../../core/utils/designCoverage';
import { getProductCategoryName } from '../../../../core/utils/productCategory';
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

const formatDateValue = (value, fallback = 'Por definir') => formatCalendarDate(value, fallback);

const firstValue = (...values) => values.find((value) => value !== null && value !== undefined && value !== '');

const moneyOrText = (value, fallback = 'No especificado') => {
  const numericValue = toNumberOrNull(value);
  return numericValue === null ? fallback : formatMoneyCOP(numericValue);
};

const discountOrText = (value) => {
  if (value === null || value === undefined || value === '') return 'No especificado';
  return formatPercentage(value);
};

const getItemProductName = (item) => (
  item.producto?.nombre
  || item.nombreProducto
  || item.descripcion
  || 'Producto no especificado'
);

const getItemDiscountTotal = (item) => {
  const explicitDiscount = toNumberOrNull(firstValue(item.descuentoTotal, item.descuentoAplicado));
  if (explicitDiscount !== null) return explicitDiscount;

  const unitDiscount = toNumberOrNull(item.descuentoValorUnitario);
  const quantity = toNumberOrNull(item.cantidad);
  if (unitDiscount !== null && quantity !== null) return unitDiscount * quantity;

  return null;
};

const getItemSubtotalBruto = (item) => firstValue(item.subtotalBruto, item.subtotal);

const getItemSubtotalWithDiscount = (item) => firstValue(
  item.subtotalConDescuento,
  item.subtotalFinal,
  item.totalConDescuento,
  item.total,
  item.subtotal
);

export const PedidoDetailsModal = ({
  isOpen,
  onClose,
  pedido,
  canEditDesignRequirement = false,
  onToggleDesignRequirement,
  pendingDesignRequirementId = null,
}) => {
  if (!isOpen || !pedido) return null;

  const fmt = (value, fallback = '$0') => formatMoneyCOP(value, fallback);
  const clienteNombre = pedido.cliente?.nombre || 'Cliente no especificado';
  const clienteCorreo = pedido.cliente?.correo || 'Correo no especificado';
  const clienteTelefono = pedido.cliente?.telefono || 'Telefono no especificado';
  const clienteContacto = [pedido.cliente?.correo, pedido.cliente?.telefono].filter(Boolean).join(' | ');
  const detalles = Array.isArray(pedido.detalles) ? pedido.detalles : [];
  const estadoPedidoLabel = ESTADO_PEDIDO_LABEL[pedido.estadoPedido] || pedido.estadoPedido || 'Sin estado';
  const estadoPagoLabel = ESTADO_PAGO_LABEL[pedido.estadoPago] || pedido.estadoPago || 'Sin estado';
  const subtotalBrutoPedido = firstValue(pedido.subtotalBruto, pedido.subtotal, pedido.cotizacion?.subtotalBruto, pedido.cotizacion?.subtotal);
  const subtotalConDescuentoPedido = firstValue(
    pedido.subtotalConDescuento,
    pedido.subtotalFinal,
    pedido.cotizacion?.subtotalConDescuento,
    pedido.cotizacion?.subtotalFinal
  );
  const descuentoTotal = firstValue(pedido.descuentoTotal, pedido.cotizacion?.descuentoTotal);
  const costosAdicionales = firstValue(pedido.costosAdicionales, pedido.cotizacion?.costosAdicionales);
  const costoDiseno = firstValue(pedido.costoDiseno, pedido.cotizacion?.costoDiseno);
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
                    const subtotalBruto = getItemSubtotalBruto(det);
                    const subtotalFinal = getItemSubtotalWithDiscount(det);
                    const itemDiscountTotal = getItemDiscountTotal(det);
                    const productName = getItemProductName(det);
                    const designCoverage = getDesignCoverageInfo(det);

                    return (
                      <article key={det.idDetallePedido || index} className={styles.orderItemCard}>
                        <div className={styles.orderItemHeader}>
                          <div>
                            <span className={styles.orderItemEyebrow}>Producto #{index + 1}</span>
                            <h4>{productName}</h4>
                          </div>
                          <span className={styles.orderItemQuantity}>{det.cantidad || 0} uds</span>
                        </div>

                        {det.descripcion && det.descripcion !== productName && (
                          <p className={styles.orderItemNote}>{det.descripcion}</p>
                        )}
                        {det.observaciones && <p className={styles.orderItemNote}>{det.observaciones}</p>}

                        <div className={styles.orderItemMetrics}>
                          <div>
                            <span>Categoria</span>
                            <strong>{getProductCategoryName(det)}</strong>
                          </div>
                          <div>
                            <span>Tecnica</span>
                            <strong>{det.tecnica?.nombre || (det.idTecnica ? `Tecnica #${det.idTecnica}` : 'No especificada')}</strong>
                          </div>
                          <div>
                            <span>Precio base unitario</span>
                            <strong>{moneyOrText(firstValue(det.precioBase, det.producto?.precioBase))}</strong>
                          </div>
                          <div>
                            <span>Descuento aplicado</span>
                            <strong>{discountOrText(det.descuentoPorcentaje)}</strong>
                          </div>
                          <div>
                            <span>Valor descontado</span>
                            <strong>{itemDiscountTotal !== null && itemDiscountTotal > 0 ? `-${fmt(itemDiscountTotal)}` : moneyOrText(itemDiscountTotal, 'No especificado')}</strong>
                          </div>
                          <div>
                            <span>Costo de diseno</span>
                            <strong>{moneyOrText(det.costoDiseno, 'No aplica')}</strong>
                          </div>
                          <div>
                            <span>Precio unitario con descuento</span>
                            <strong>{moneyOrText(det.precioUnitario)}</strong>
                          </div>
                          <div>
                            <span>Subtotal bruto</span>
                            <strong>{moneyOrText(subtotalBruto)}</strong>
                          </div>
                          <div>
                            <span>Subtotal con descuento</span>
                            <strong>{moneyOrText(subtotalFinal)}</strong>
                          </div>
                          <div>
                            <span>Requiere diseno</span>
                            <strong>{det.requiereDiseno === false ? 'No' : 'Si'}</strong>
                          </div>
                          <div>
                            <span>Diseno asociado</span>
                            <strong>{designCoverage.label}</strong>
                          </div>
                          <div>
                            <span>Origen del diseno</span>
                            <strong>
                              {designCoverage.noDesignRequired
                                ? 'No aplica'
                                : det.origenDiseno === 'CLIENTE'
                                  ? 'Cliente'
                                  : 'PIXEL'}
                            </strong>
                          </div>
                        </div>
                        {designCoverage.message && (
                          <p className={styles.orderItemNote}>{designCoverage.message}</p>
                        )}
                        {designCoverage.isGeneral && (
                          <p className={styles.orderItemNote}>Cubierto por un diseno general del pedido.</p>
                        )}
                        {designCoverage.fileUrl && (
                          <a
                            className={styles.orderItemToggleBtn}
                            href={designCoverage.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Ver archivo del diseno
                          </a>
                        )}
                        {canEditDesignRequirement && det.idDetallePedido && (
                          <div className={styles.orderItemActions}>
                            <button
                              type="button"
                              className={styles.orderItemToggleBtn}
                              disabled={pendingDesignRequirementId === det.idDetallePedido}
                              onClick={() => onToggleDesignRequirement?.(det)}
                            >
                              {pendingDesignRequirementId === det.idDetallePedido
                                ? 'Actualizando...'
                                : det.requiereDiseno === false
                                  ? 'Marcar requiere diseno'
                                  : 'Marcar no requiere diseno'}
                            </button>
                          </div>
                        )}
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
                <strong>{moneyOrText(subtotalBrutoPedido)}</strong>
              </div>
              <div className={styles.orderMoneyRow}>
                <span>Descuento</span>
                <strong>{toNumberOrNull(descuentoTotal) > 0 ? `-${fmt(descuentoTotal)}` : moneyOrText(descuentoTotal, 'Sin descuento')}</strong>
              </div>
              <div className={styles.orderMoneyRow}>
                <span>Subtotal con descuento</span>
                <strong>{moneyOrText(subtotalConDescuentoPedido)}</strong>
              </div>
              <div className={styles.orderMoneyRow}>
                <span>Costos adicionales</span>
                <strong>{moneyOrText(costosAdicionales, 'No aplica')}</strong>
              </div>
              <div className={styles.orderMoneyRow}>
                <span>Costo de diseno</span>
                <strong>{moneyOrText(costoDiseno, 'No aplica')}</strong>
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
