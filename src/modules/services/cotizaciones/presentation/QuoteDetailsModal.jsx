// cotizaciones/presentation/QuoteDetailsModal.jsx
import { useEffect, useMemo, useState } from 'react';
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

const PRODUCT_PAGE_SIZE = 10;

export const QuoteDetailsModal = ({ isOpen, onClose, quote }) => {
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);

  const details = useMemo(() => (
    Array.isArray(quote?.detalles) ? quote.detalles : []
  ), [quote?.detalles]);

  const searchableDetails = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return details;

    return details.filter((detail, index) => {
      const product = detail.producto?.nombre || detail.descripcion || `Producto ${index + 1}`;
      const tecnica = detail.tecnica?.nombre || '';
      const observaciones = detail.observaciones || '';
      return `${product} ${tecnica} ${observaciones}`.toLowerCase().includes(term);
    });
  }, [details, productSearch]);

  const totalProductPages = Math.max(1, Math.ceil(searchableDetails.length / PRODUCT_PAGE_SIZE));
  const paginatedDetails = searchableDetails.slice(
    (productPage - 1) * PRODUCT_PAGE_SIZE,
    productPage * PRODUCT_PAGE_SIZE,
  );

  useEffect(() => {
    if (!isOpen) return;
    setSelectedProductIndex(0);
    setProductSearch('');
    setProductPage(1);
  }, [isOpen, quote?.idCotizacion]);

  useEffect(() => {
    setProductPage(current => Math.min(current, totalProductPages));
  }, [totalProductPages]);

  if (!isOpen || !quote) return null;

  const firstDetail = details[0] || null;
  const statusLabel = getQuoteStatusLabel(quote);
  const clienteContacto = [quote.cliente?.correo, quote.cliente?.telefono].filter(Boolean);
  const productName = quote.productosResumen || firstDetail?.producto?.nombre || firstDetail?.descripcion || 'Producto no especificado';
  const quantityItems = quote.cantidadItems ?? details.length;
  const totalQuantity = details.reduce((sum, detail) => sum + Number(detail.cantidad || 0), 0);
  const subtotalBruto = getQuoteSubtotalBruto(quote) || details.reduce((sum, detail) => sum + getQuoteSubtotalBruto(detail || {}), 0);
  const discountTotal = getQuoteDiscountTotal(quote) || details.reduce((sum, detail) => sum + getQuoteDiscountTotal(detail || {}), 0);
  const subtotalWithDiscount = getQuoteSubtotalWithDiscount(quote) || details.reduce((sum, detail) => sum + getQuoteSubtotalWithDiscount(detail || {}), 0);
  const discountPercentage = quote.descuentoPorcentaje
    ?? (subtotalBruto > 0 && discountTotal > 0 ? (discountTotal / subtotalBruto) * 100 : 0);
  const additionalCosts = Number(quote.costosAdicionales || 0);
  const designCost = Number(quote.costoDiseno || details.reduce((sum, detail) => sum + Number(detail.costoDiseno || 0), 0));
  const total = getQuoteTotal(quote);
  const clientObservations = quote.observaciones || '';
  const internalObservations = quote.observacionesInternas || quote.notasInternas || quote.observacionesAdmin || '';
  const selectedDetail = details[selectedProductIndex] || details[0] || null;
  const selectedDetailName = selectedDetail?.producto?.nombre || selectedDetail?.descripcion || 'Producto no especificado';
  const selectedDetailQuantity = Number(selectedDetail?.cantidad || 0);
  const selectedDetailBasePrice = Number(selectedDetail?.precioBase || selectedDetail?.producto?.precioBase || 0);
  const selectedDetailUnitPrice = Number(selectedDetail?.precioUnitario || 0);
  const selectedDetailDiscount = selectedDetail?.descuentoPorcentaje ?? null;
  const selectedDetailDiscountTotal = getQuoteDiscountTotal(selectedDetail || {});
  const selectedDetailSubtotalBruto = getQuoteSubtotalBruto(selectedDetail || {});
  const selectedDetailSubtotalWithDiscount = getQuoteSubtotalWithDiscount(selectedDetail || {});

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
              <span>Productos cotizados</span>
              <strong>{productName}</strong>
              <small>{quantityItems === 1 ? '1 producto cotizado' : `${quantityItems} productos cotizados`}</small>
            </div>
            <div className={styles.quoteDetailsSummaryItem}>
              <span>Cantidad total</span>
              <strong>{totalQuantity > 0 ? totalQuantity.toLocaleString('es-CO') : 'Sin cantidad'}</strong>
              <small>{quantityItems} item(s)</small>
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

            <div className={styles.quoteProductsToolbar}>
              <input
                type="search"
                value={productSearch}
                onChange={(event) => {
                  setProductSearch(event.target.value);
                  setProductPage(1);
                  setSelectedProductIndex(0);
                }}
                className={styles.quoteProductSearch}
                placeholder="Buscar producto, tecnica u observacion..."
              />
              <span>
                {searchableDetails.length} de {details.length} producto(s)
              </span>
            </div>

            <div className={styles.quoteProductsCompactList}>
              {details.length === 0 ? (
                <div className={styles.quoteProductCompactItem}>
                  <div className={styles.quoteProductCompactSummary}>
                    <span>Producto</span>
                    <strong>Producto no especificado</strong>
                  </div>
                </div>
              ) : paginatedDetails.length === 0 ? (
                <div className={styles.quoteProductEmptyState}>No hay productos que coincidan con la busqueda.</div>
              ) : paginatedDetails.map((detail, pageIndex) => {
                const index = details.indexOf(detail);
                const itemName = detail.producto?.nombre || detail.descripcion || `Producto ${index + 1}`;
                const quantity = Number(detail.cantidad || 0);
                const basePrice = Number(detail.precioBase || detail.producto?.precioBase || 0);
                const unitPrice = Number(detail.precioUnitario || 0);
                const discount = detail.descuentoPorcentaje ?? null;
                const itemSubtotalBruto = getQuoteSubtotalBruto(detail || {});
                const itemDiscountTotal = getQuoteDiscountTotal(detail || {});
                const itemSubtotalWithDiscount = getQuoteSubtotalWithDiscount(detail || {});
                const isSelected = selectedProductIndex === index;

                return (
                  <div
                    className={`${styles.quoteProductCompactItem} ${isSelected ? styles.quoteProductCompactItemActive : ''}`}
                    key={detail.idDetalleCotizacion || `${index}-${pageIndex}`}
                  >
                    <button
                      type="button"
                      className={styles.quoteProductCompactSummary}
                      onClick={() => setSelectedProductIndex(index)}
                      aria-pressed={isSelected}
                    >
                      <span>Producto {index + 1}</span>
                      <strong>{itemName}</strong>
                      <small>
                        {detail.tecnica?.nombre || 'Tecnica no registrada'} - Cant. {quantity.toLocaleString('es-CO')} - {formatPercentage(discount, '0%')} desc. - {formatMoney(itemSubtotalWithDiscount)}
                      </small>
                    </button>

                    <button
                      type="button"
                      className={styles.quoteProductExpandBtn}
                      onClick={() => setSelectedProductIndex(index)}
                    >
                      {isSelected ? 'Seleccionado' : 'Ver detalle'}
                    </button>
                  </div>
                );
              })}
            </div>

            {searchableDetails.length > PRODUCT_PAGE_SIZE && (
              <div className={styles.quoteProductsPager}>
                <button
                  type="button"
                  onClick={() => {
                    setProductPage(page => Math.max(1, page - 1));
                  }}
                  disabled={productPage <= 1}
                >
                  Anterior
                </button>
                <span>Pagina {productPage} de {totalProductPages}</span>
                <button
                  type="button"
                  onClick={() => {
                    setProductPage(page => Math.min(totalProductPages, page + 1));
                  }}
                  disabled={productPage >= totalProductPages}
                >
                  Siguiente
                </button>
              </div>
            )}

            {selectedDetail && (
              <div className={styles.quoteSelectedProductPanel}>
                <div className={styles.quoteSelectedProductHeader}>
                  <span>Detalle del producto seleccionado</span>
                  <strong>Producto {selectedProductIndex + 1}</strong>
                </div>
                <div className={styles.quoteSelectedProductTitle}>
                  <strong>{selectedDetailName}</strong>
                  <small>{selectedDetail.tecnica?.nombre ? `Tecnica: ${selectedDetail.tecnica.nombre}` : 'Tecnica no registrada'}</small>
                </div>
                <div className={styles.quoteProductExpandedDetail}>
                  <div>
                    <span>Cantidad</span>
                    <strong>{selectedDetailQuantity.toLocaleString('es-CO')}</strong>
                  </div>
                  <div>
                    <span>Precio base unitario</span>
                    <strong>{selectedDetailBasePrice > 0 ? formatMoneyCOP(selectedDetailBasePrice) : 'Por cotizar'}</strong>
                  </div>
                  <div>
                    <span>Descuento aplicado</span>
                    <strong>{formatPercentage(selectedDetailDiscount, '0%')}</strong>
                  </div>
                  <div>
                    <span>Valor descontado</span>
                    <strong>{selectedDetailDiscountTotal > 0 ? `-${formatMoneyCOP(selectedDetailDiscountTotal)}` : 'Sin descuento'}</strong>
                  </div>
                  <div>
                    <span>Precio unitario</span>
                    <strong>{selectedDetailUnitPrice > 0 ? formatMoneyCOP(selectedDetailUnitPrice) : 'Por cotizar'}</strong>
                  </div>
                  <div>
                    <span>Subtotal bruto</span>
                    <strong>{formatMoney(selectedDetailSubtotalBruto)}</strong>
                  </div>
                  <div>
                    <span>Subtotal con descuento</span>
                    <strong>{formatMoney(selectedDetailSubtotalWithDiscount)}</strong>
                  </div>
                  <div className={styles.quoteProductObservation}>
                    <span>Observaciones del item</span>
                    <strong>{selectedDetail.observaciones || 'Sin observaciones'}</strong>
                  </div>
                </div>
              </div>
            )}
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
                <strong>{formatPercentage(discountPercentage, '0%')}</strong>
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
              <div>
                <span>Costo de diseno</span>
                <strong>{designCost > 0 ? formatMoneyCOP(designCost) : 'No aplica'}</strong>
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
