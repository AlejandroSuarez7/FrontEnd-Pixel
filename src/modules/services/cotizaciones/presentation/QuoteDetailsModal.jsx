// cotizaciones/presentation/QuoteDetailsModal.jsx
import {
  formatMoneyCOP,
  formatPercentage,
  getQuoteDiscountTotal,
  getQuoteSubtotalBruto,
  getQuoteSubtotalWithDiscount,
  getQuoteTotal,
} from '../../../../core/utils/formatters';
import styles from './quotes.module.css';

const formatMoney = (value) => {
  const numberValue = Number(value || 0);
  return numberValue > 0 ? formatMoneyCOP(numberValue) : 'Por cotizar';
};

const formatOptionalMoney = (value) => {
  const numberValue = Number(value || 0);
  return numberValue > 0 ? formatMoneyCOP(numberValue) : 'No aplica';
};

const getQuoteStatusLabel = (quote) => {
  if (quote.estado === 'PENDIENTE' && Number(quote.total || 0) > 0) return 'POR APROBAR';
  return quote.estado || 'PENDIENTE';
};

const getQuoteTypeLabel = (type) => {
  const normalized = String(type || '').toUpperCase();
  if (normalized.includes('PUBLIC')) return 'Publica';
  if (normalized.includes('PRESENC')) return 'Presencial';
  return type || 'Cotizacion';
};

export const QuoteDetailsModal = ({ isOpen, onClose, quote }) => {
  if (!isOpen || !quote) return null;

  const detail = quote.detalles?.[0] || null;
  const statusLabel = getQuoteStatusLabel(quote);
  const clienteContacto = [quote.cliente?.correo, quote.cliente?.telefono].filter(Boolean);
  const productName = detail?.producto?.nombre || detail?.descripcion || 'Producto no especificado';
  const quantity = Number(detail?.cantidad || 0);
  const unitPrice = Number(detail?.precioUnitario || 0);
  const discount = detail?.descuentoPorcentaje ?? null;
  const designCost = Number(detail?.costoDiseno || 0);
  const itemSubtotalBruto = getQuoteSubtotalBruto(detail || {});
  const itemDiscountTotal = getQuoteDiscountTotal(detail || {});
  const itemSubtotalWithDiscount = getQuoteSubtotalWithDiscount(detail || {});
  const subtotalBruto = getQuoteSubtotalBruto(quote) || itemSubtotalBruto;
  const discountTotal = getQuoteDiscountTotal(quote) || itemDiscountTotal;
  const subtotalWithDiscount = getQuoteSubtotalWithDiscount(quote) || itemSubtotalWithDiscount;
  const additionalCosts = Number(quote.costosAdicionales || 0);
  const total = getQuoteTotal(quote);
  const clientObservations = quote.observaciones || detail?.observaciones || '';
  const internalObservations = quote.observacionesInternas || quote.notasInternas || quote.observacionesAdmin || '';

  const getStatusClass = (estado) => {
    switch (estado) {
      case 'APROBADA': return styles.statusAprobada;
      case 'COTIZADA': return styles.statusCotizada;
      case 'ANULADA': return styles.statusAnulada;
      case 'RECHAZADA': return styles.statusRechazada;
      case 'POR APROBAR': return styles.statusCotizada;
      case 'PENDIENTE':
      default: return styles.statusPendiente;
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.quoteDetailsModal}`}>
        <div className={styles.quoteDetailsHeader}>
          <div>
            <span className={styles.breadcrumb}>Cotizacion</span>
            <h3 className={styles.modalTitle}>Cotizacion #{quote.idCotizacion}</h3>
            <div className={styles.quoteHeaderMeta}>
              <span className={styles.typeBadge}>{getQuoteTypeLabel(quote.tipoCotizacion)}</span>
              <span className={`${styles.statusBadge} ${getStatusClass(statusLabel)}`}>
                {statusLabel}
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn}>x</button>
        </div>

        <div className={styles.quoteDetailsBody}>
          <section className={styles.quoteDetailsSummary}>
            <div className={styles.quoteDetailsSummaryItem}>
              <span>Cliente</span>
              <strong>{quote.cliente?.nombre || 'Cliente no registrado'}</strong>
              <small>{clienteContacto.join(' | ') || 'Sin contacto registrado'}</small>
            </div>
            <div className={styles.quoteDetailsSummaryItem}>
              <span>Producto cotizado</span>
              <strong>{productName}</strong>
              <small>{detail?.tecnica?.nombre ? `Tecnica: ${detail.tecnica.nombre}` : 'Tecnica no registrada'}</small>
            </div>
            <div className={styles.quoteDetailsSummaryItem}>
              <span>Cantidad</span>
              <strong>{quantity > 0 ? quantity.toLocaleString('es-CO') : 'Sin cantidad'}</strong>
              <small>Un producto por cotizacion</small>
            </div>
            <div className={styles.quoteDetailsSummaryItem}>
              <span>Total</span>
              <strong>{formatMoney(total)}</strong>
              <small>{statusLabel}</small>
            </div>
          </section>

          <section className={styles.quoteDetailsSection}>
            <div className={styles.quoteDetailsSectionHeader}>
              <span>Producto / servicio incluido</span>
              <strong>{productName}</strong>
            </div>

            <div className={styles.quoteProductDetailCard}>
              <div className={styles.quoteProductMain}>
                <span>Detalle solicitado</span>
                <p>{detail?.observaciones || detail?.descripcion || 'Sin detalle adicional'}</p>
              </div>

              <div className={styles.quoteProductStats}>
                <div>
                  <span>Cantidad</span>
                  <strong>{quantity > 0 ? quantity.toLocaleString('es-CO') : '0'}</strong>
                </div>
                <div>
                  <span>Precio unitario</span>
                  <strong>{unitPrice > 0 ? formatMoneyCOP(unitPrice) : 'Por cotizar'}</strong>
                </div>
                <div>
                  <span>Descuento aplicado</span>
                  <strong>{formatPercentage(discount)}</strong>
                </div>
                <div>
                  <span>Costo de diseno</span>
                  <strong>{formatOptionalMoney(designCost)}</strong>
                </div>
                <div>
                  <span>Subtotal bruto</span>
                  <strong>{formatMoney(itemSubtotalBruto)}</strong>
                </div>
                <div>
                  <span>Valor descontado</span>
                  <strong>{itemDiscountTotal > 0 ? `-${formatMoneyCOP(itemDiscountTotal)}` : 'Sin descuento'}</strong>
                </div>
                <div>
                  <span>Subtotal con descuento</span>
                  <strong>{formatMoney(itemSubtotalWithDiscount)}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.observationsGrid}>
            <div className={styles.readOnlyNote}>
              <span>Observaciones del cliente</span>
              <p>{clientObservations || 'Sin observaciones'}</p>
            </div>
            <div className={styles.readOnlyNote}>
              <span>Observaciones internas</span>
              <p>{internalObservations || 'Sin observaciones'}</p>
            </div>
          </section>

          {quote.creadoPor?.nombre && (
            <p className={styles.detailsCreatedBy}>
              Gestionada por: <strong>{quote.creadoPor.nombre}</strong>
              {quote.creadoPor.rol?.nombre ? ` - ${quote.creadoPor.rol.nombre}` : ''}
            </p>
          )}

          <section className={styles.quoteTotalsPanel}>
            <div className={styles.quoteTotalsRows}>
              <div>
                <span>Subtotal bruto</span>
                <strong>{formatMoney(subtotalBruto)}</strong>
              </div>
              <div>
                <span>Descuento aplicado</span>
                <strong>{formatPercentage(discount, '0%')}</strong>
              </div>
              <div>
                <span>Valor descontado</span>
                <strong>{discountTotal > 0 ? `-${formatMoneyCOP(discountTotal)}` : 'Sin descuento'}</strong>
              </div>
              <div>
                <span>Subtotal con descuento</span>
                <strong>{formatMoney(subtotalWithDiscount)}</strong>
              </div>
              <div>
                <span>Costos adicionales</span>
                <strong>{additionalCosts > 0 ? formatMoneyCOP(additionalCosts) : 'No aplica'}</strong>
              </div>
            </div>

            <div className={styles.quoteGrandTotalCard}>
              <span>Total final</span>
              <strong>{formatMoney(total)}</strong>
            </div>
          </section>
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
