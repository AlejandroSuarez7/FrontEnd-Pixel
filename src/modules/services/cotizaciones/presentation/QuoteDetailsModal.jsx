// cotizaciones/presentation/QuoteDetailsModal.jsx
import { useMemo, useState } from 'react';
import {
  formatMoneyCOP,
  formatPercentage,
  getQuoteDiscountTotal,
  getQuoteSubtotalBruto,
  getQuoteSubtotalWithDiscount,
  getQuoteTotal,
} from '../../../../core/utils/formatters';
import { getProductCategoryName } from '../../../../core/utils/productCategory';
import {
  getClientVisibleQuoteTotal,
  getCurrentQuoteVersion,
  getProposalStatusLabel,
  getQuoteDecisionLabel,
  getQuoteStatusLabel,
  getResponseMediumLabel,
  isQuoteProposalExpired,
} from './quoteWorkflow.utils';
import { formatCalendarDate } from '../../../../core/utils/fechaFormato';
import styles from './quotes.module.css';

const formatMoney = (value) => {
  const numberValue = Number(value || 0);
  return numberValue > 0 ? formatMoneyCOP(numberValue) : 'Por cotizar';
};

const getQuoteTypeLabel = (type) => {
  const normalized = String(type || '').toUpperCase();
  if (normalized.includes('PUBLIC')) return 'Publica';
  if (normalized.includes('PRESENC')) return 'Presencial';
  return type || 'Cotizacion';
};

const PRODUCT_PAGE_SIZE = 10;

const toFiniteAmount = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
};

const sumAmounts = (items, getValue) => items.reduce((totalValue, item) => {
  const amount = toFiniteAmount(getValue(item));
  return totalValue + (amount ?? 0);
}, 0);

const getDetailName = (detail, fallback = 'Producto no especificado') => (
  detail?.producto?.nombre
  || detail?.nombrePersonalizado
  || detail?.descripcionPersonalizada
  || detail?.descripcion
  || fallback
);

const getDetailTechniques = (detail) => {
  const names = Array.isArray(detail?.estampados)
    ? detail.estampados.map((stamp) => stamp.tecnica?.nombre).filter(Boolean)
    : [];
  if (names.length > 0) return [...new Set(names)].join(', ');
  return detail?.tecnica?.nombre || 'Tecnica no registrada';
};

const getSupplyLabel = (value) => (
  String(value || '').toUpperCase() === 'CLIENTE' ? 'Lo suministra el cliente' : 'Lo suministra PIXEL'
);

const getDesignOriginLabel = (value) => {
  const labels = {
    CLIENTE: 'El cliente aporta el diseno',
    PIXEL: 'PIXEL crea el diseno',
    PENDIENTE_DEFINIR: 'Pendiente por definir',
    NO_REQUIERE: 'No requiere diseno',
  };
  return labels[String(value || '').toUpperCase()] || 'Pendiente por definir';
};

const getProductDiscountRangeLabel = (detail) => {
  const range = detail?.rangoProductoAplicado;
  if (!range) return detail?.tipoProducto === 'OTRO' ? 'No aplica' : 'No especificado';
  if (typeof range === 'string') return range.replaceAll('_', ' ').toLowerCase();

  const minimum = range.cantidadMinima ?? range.cantidadMin;
  const percentage = range.porcentaje ?? range.descuentoPorcentaje;
  if (minimum == null && percentage == null) return 'No especificado';
  return [
    minimum != null ? `Desde ${Number(minimum).toLocaleString('es-CO')} unidades` : null,
    percentage != null ? formatPercentage(percentage) : null,
  ].filter(Boolean).join(' · ');
};

const getReviewMessages = (detail) => {
  if (!detail) return [];
  const rawReasons = [
    detail.estadoMedidas,
    ...(Array.isArray(detail.motivosRevision) ? detail.motivosRevision : []),
    ...(Array.isArray(detail.estampados)
      ? detail.estampados.flatMap((stamp) => [
          stamp.estadoMedidas,
          ...(Array.isArray(stamp.motivosRevision) ? stamp.motivosRevision : []),
        ])
      : []),
  ].filter(Boolean);

  const messages = rawReasons.map((reason) => {
    const normalized = String(reason).toUpperCase();
    if (normalized.includes('TECNICA') || normalized.includes('SERVICIO')) {
      return 'Servicio pendiente de seleccionar.';
    }
    if (normalized.includes('TARIFA')) {
      return 'No existe una tarifa configurada para estas medidas.';
    }
    if (normalized.includes('MEDIDA')) {
      return 'Medidas pendientes de definir con el cliente.';
    }
    return 'El precio sugerido requiere revisión manual.';
  });

  if (detail.tipoProducto === 'OTRO') {
    messages.push('El producto personalizado requiere revisión manual.');
  }
  if ((detail.requiereRevisionPrecio || detail.calculoCompleto === false) && messages.length === 0) {
    messages.push('El precio sugerido requiere revisión manual.');
  }
  return [...new Set(messages)];
};

export const QuoteDetailsModal = ({ isOpen, onClose, quote, isStaff = false }) => {
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);

  const details = useMemo(() => (
    Array.isArray(quote?.detalles) ? quote.detalles : []
  ), [quote]);

  const searchableDetails = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return details;

    return details.filter((detail, index) => {
      const product = getDetailName(detail, `Producto ${index + 1}`);
      const tecnica = getDetailTechniques(detail);
      const observaciones = detail.observaciones || '';
      return `${product} ${tecnica} ${observaciones}`.toLowerCase().includes(term);
    });
  }, [details, productSearch]);

  const totalProductPages = Math.max(1, Math.ceil(searchableDetails.length / PRODUCT_PAGE_SIZE));
  const safeProductPage = Math.min(productPage, totalProductPages);
  const paginatedDetails = searchableDetails.slice(
    (safeProductPage - 1) * PRODUCT_PAGE_SIZE,
    safeProductPage * PRODUCT_PAGE_SIZE,
  );

  if (!isOpen || !quote) return null;

  const firstDetail = details[0] || null;
  const statusLabel = getQuoteStatusLabel(quote.estado);
  const clienteContacto = [quote.cliente?.correo, quote.cliente?.telefono].filter(Boolean);
  const productName = quote.productosResumen || getDetailName(firstDetail);
  const quantityItems = quote.cantidadItems ?? details.length;
  const totalQuantity = details.reduce((sum, detail) => sum + Number(detail.cantidad || 0), 0);
  const subtotalBruto = getQuoteSubtotalBruto(quote) || details.reduce((sum, detail) => sum + getQuoteSubtotalBruto(detail || {}), 0);
  const discountTotal = getQuoteDiscountTotal(quote) || details.reduce((sum, detail) => sum + getQuoteDiscountTotal(detail || {}), 0);
  const subtotalWithDiscount = getQuoteSubtotalWithDiscount(quote) || details.reduce((sum, detail) => sum + getQuoteSubtotalWithDiscount(detail || {}), 0);
  const discountPercentage = quote.descuentoPorcentaje
    ?? (subtotalBruto > 0 && discountTotal > 0 ? (discountTotal / subtotalBruto) * 100 : 0);
  const additionalCosts = Number(quote.costosAdicionales || 0);
  const designCost = Number(quote.costoDiseno || details.reduce((sum, detail) => sum + Number(detail.costoDiseno || 0), 0));
  const currentProposal = getCurrentQuoteVersion(quote);
  const proposalBreakdown = currentProposal?.desgloseVisible || null;
  const proposalItems = Array.isArray(proposalBreakdown?.items)
    ? proposalBreakdown.items
    : Array.isArray(currentProposal?.items) ? currentProposal.items : [];
  const proposalDesigns = (
    Array.isArray(proposalBreakdown?.disenos)
      ? proposalBreakdown.disenos
      : Array.isArray(currentProposal?.disenos) ? currentProposal.disenos : []
  ).filter((design) => design.visibleCliente !== false);
  const proposalConcepts = (
    Array.isArray(proposalBreakdown?.conceptosAdicionales)
      ? proposalBreakdown.conceptosAdicionales
      : Array.isArray(currentProposal?.conceptosAdicionales)
        ? currentProposal.conceptosAdicionales
        : []
  ).filter((concept) => concept.visibleCliente !== false);
  const proposalItemsSubtotal = toFiniteAmount(proposalBreakdown?.subtotalItems)
    ?? sumAmounts(proposalItems, (item) => item.subtotalOficial ?? item.subtotal);
  const proposalDesignsTotal = toFiniteAmount(proposalBreakdown?.totalDisenos)
    ?? sumAmounts(proposalDesigns, (design) => design.costoDiseno ?? design.valor);
  const proposalConceptsTotal = toFiniteAmount(proposalBreakdown?.totalConceptosAdicionales)
    ?? sumAmounts(proposalConcepts, (concept) => concept.valor);
  const proposalLegacyAdditional = toFiniteAmount(currentProposal?.costosAdicionales) ?? 0;
  const proposalAdjustment = toFiniteAmount(
    currentProposal?.ajusteManual ?? proposalBreakdown?.ajusteManual,
  );
  const proposalExpired = isQuoteProposalExpired(currentProposal);
  const total = isStaff ? getQuoteTotal(quote) : getClientVisibleQuoteTotal(quote);
  const clientObservations = quote.observaciones || '';
  const internalObservations = quote.observacionesInternas || quote.notasInternas || quote.observacionesAdmin || '';
  const selectedDetail = details[selectedProductIndex] || details[0] || null;
  const selectedDetailName = getDetailName(selectedDetail);
  const selectedDetailTechniques = getDetailTechniques(selectedDetail);
  const selectedStamps = Array.isArray(selectedDetail?.estampados) ? selectedDetail.estampados : [];
  const selectedDetailQuantity = Number(selectedDetail?.cantidad || 0);
  const selectedDetailBasePrice = Number(selectedDetail?.precioBase || selectedDetail?.producto?.precioBase || 0);
  const selectedDetailUnitPrice = Number(selectedDetail?.precioUnitario || 0);
  const selectedDetailDiscount = selectedDetail?.descuentoPorcentaje ?? null;
  const selectedDetailDiscountTotal = getQuoteDiscountTotal(selectedDetail || {});
  const selectedDetailSubtotalBruto = getQuoteSubtotalBruto(selectedDetail || {});
  const selectedDetailSubtotalWithDiscount = getQuoteSubtotalWithDiscount(selectedDetail || {});
  const selectedDetailReviewMessages = getReviewMessages(selectedDetail);
  const selectedDetailRequiresDesign = selectedDetail?.requiereDiseno !== false
    && (
      selectedStamps.length === 0
      || !selectedStamps.every((stamp) => stamp.origenDiseno === 'NO_REQUIERE')
    );
  const selectedDetailDesignOrigin = selectedDetailRequiresDesign
    ? (selectedDetail?.origenDiseno === 'CLIENTE' ? 'Cliente' : 'PIXEL')
    : 'No aplica';
  const selectedDetailDesignStatus = !selectedDetailRequiresDesign
    ? 'No requiere diseno'
    : selectedDetail?.origenDiseno === 'CLIENTE'
      ? 'Diseno aportado por el cliente'
      : 'PIXEL crea el diseno';

  const getStatusClass = (estado) => {
    switch (estado) {
      case 'APROBADA': return styles.statusAprobada;
      case 'ACEPTADA':
      case 'CONVERTIDA_EN_PEDIDO': return styles.statusAprobada;
      case 'COTIZADA': return styles.statusCotizada;
      case 'PENDIENTE_APROBACION_CLIENTE': return styles.statusCotizada;
      case 'ANULADA': return styles.statusAnulada;
      case 'RECHAZADA': return styles.statusRechazada;
      case 'RECHAZADA_CLIENTE': return styles.statusRechazada;
      case 'VENCIDA': return styles.statusNeutral;
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
              <span className={`${styles.statusBadge} ${getStatusClass(quote.estado)}`}>
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
              <small title={clienteContacto.join(' | ') || undefined}>
                {clienteContacto.join(' | ') || 'Sin contacto registrado'}
              </small>
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
              <strong>{total == null ? 'Precio pendiente de confirmacion' : formatMoney(total)}</strong>
              <small>{statusLabel}</small>
            </div>
          </section>

          {!isStaff && (
            <section className={styles.clientQuoteNotice}>
              <strong>
                {currentProposal
                  ? `Propuesta oficial - Version ${currentProposal.numeroVersion || 1}`
                  : 'Precio pendiente de confirmacion'}
              </strong>
              <span>
                {currentProposal
                  ? 'Revisa el valor y la vigencia antes de responder.'
                  : 'El equipo de PIXEL revisara productos, medidas y disenos antes de enviarte una propuesta final.'}
              </span>
            </section>
          )}

          {isStaff && (
            <section className={styles.internalEstimateBanner}>
              <div>
                <span>Estimacion interna - no enviada al cliente</span>
                <strong>
                  {quote.precioSugeridoInterno == null
                    ? 'No configurada'
                    : formatMoneyCOP(quote.precioSugeridoInterno)}
                </strong>
              </div>
              {quote.requiereRevisionPrecio && (
                <p>Hay productos o estampados que requieren revision manual de precio.</p>
              )}
              {Array.isArray(quote.advertenciasInternas) && quote.advertenciasInternas.length > 0 && (
                <ul>
                  {quote.advertenciasInternas.map((warning, index) => (
                    <li key={`${warning}-${index}`}>{warning}</li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section className={styles.quoteDetailsSection}>
            <div className={styles.quoteDetailsSectionHeader}>
              <span>Productos cotizados</span>
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
                const itemName = getDetailName(detail, `Producto ${index + 1}`);
                const quantity = Number(detail.cantidad || 0);
                const discount = detail.descuentoPorcentaje ?? null;
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
                        {getDetailTechniques(detail)} - Cant. {quantity.toLocaleString('es-CO')}
                        {isStaff
                          ? ` - ${formatPercentage(discount, 'Sin descuento')} - ${formatMoney(itemSubtotalWithDiscount)}`
                          : ` - ${getSupplyLabel(detail.suministradoPor)}`}
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
                  disabled={safeProductPage <= 1}
                >
                  Anterior
                </button>
                <span>Pagina {safeProductPage} de {totalProductPages}</span>
                <button
                  type="button"
                  onClick={() => {
                    setProductPage(page => Math.min(totalProductPages, page + 1));
                  }}
                  disabled={safeProductPage >= totalProductPages}
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
                  <small>Tecnicas: {selectedDetailTechniques}</small>
                  <small>Categoria: {getProductCategoryName(selectedDetail)}</small>
                  <small>{getSupplyLabel(selectedDetail.suministradoPor)}</small>
                </div>
                <div className={styles.quoteProductExpandedDetail}>
                  <div>
                    <span>Tipo de producto</span>
                    <strong>{selectedDetail.tipoProducto === 'OTRO' ? 'Producto personalizado' : 'Producto del catalogo'}</strong>
                  </div>
                  <div>
                    <span>Cantidad</span>
                    <strong>{selectedDetailQuantity.toLocaleString('es-CO')}</strong>
                  </div>
                  {isStaff && (
                    <>
                      <div>
                        <span>Precio base unitario</span>
                        <strong>{selectedDetailBasePrice > 0 ? formatMoneyCOP(selectedDetailBasePrice) : 'Por cotizar'}</strong>
                      </div>
                      <div>
                        <span>Rango del producto aplicado</span>
                        <strong>{getProductDiscountRangeLabel(selectedDetail)}</strong>
                      </div>
                      <div>
                        <span>Descuento por cantidad</span>
                        <strong>{formatPercentage(selectedDetailDiscount, 'No especificado')}</strong>
                      </div>
                      <div>
                        <span>Monto descontado</span>
                        <strong>{selectedDetailDiscountTotal > 0 ? `-${formatMoneyCOP(selectedDetailDiscountTotal)}` : 'Sin descuento'}</strong>
                      </div>
                      <div>
                        <span>Tarifa unitaria aplicada</span>
                        <strong>{selectedDetailUnitPrice > 0 ? formatMoneyCOP(selectedDetailUnitPrice) : 'Por cotizar'}</strong>
                      </div>
                      <div>
                        <span>Subtotal bruto de servicios</span>
                        <strong>{formatMoney(selectedDetailSubtotalBruto)}</strong>
                      </div>
                      <div>
                        <span>Subtotal neto de servicios</span>
                        <strong>{formatMoney(selectedDetailSubtotalWithDiscount)}</strong>
                      </div>
                    </>
                  )}
                  <div>
                    <span>Configuracion de diseno</span>
                    <strong>{selectedDetailDesignStatus}</strong>
                  </div>
                  <div>
                    <span>Origen del diseno</span>
                    <strong>{selectedDetailDesignOrigin}</strong>
                  </div>
                  {isStaff && (
                    <div>
                      <span>Costo de diseno</span>
                      <strong>
                        {selectedDetailRequiresDesign && Number(selectedDetail.costoDiseno || 0) > 0
                          ? formatMoneyCOP(selectedDetail.costoDiseno)
                          : 'No configurado'}
                      </strong>
                    </div>
                  )}
                  {selectedDetail?.esDisenoGeneral && (
                    <div>
                      <span>Alcance</span>
                      <strong>Diseno general del pedido</strong>
                    </div>
                  )}
                  {selectedDetail?.archivoDisenoInicialUrl && (
                    <div>
                      <span>Archivo aportado</span>
                      <a href={selectedDetail.archivoDisenoInicialUrl} target="_blank" rel="noreferrer">
                        Ver diseno
                      </a>
                    </div>
                  )}
                  <div className={styles.quoteProductObservation}>
                    <span>Observaciones del item</span>
                    <strong>{selectedDetail.observaciones || 'Sin observaciones'}</strong>
                  </div>
                </div>

                {isStaff && selectedDetailReviewMessages.length > 0 && (
                  <div className={styles.quoteReviewMessages}>
                    <strong>Revisión pendiente</strong>
                    <ul>
                      {selectedDetailReviewMessages.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={styles.quoteStampsList}>
                  <span className={styles.quoteStampsTitle}>Estampados solicitados</span>
                  {selectedStamps.length === 0 ? (
                    <p>Esta cotizacion historica no tiene estampados separados.</p>
                  ) : selectedStamps.map((stamp, index) => (
                    <article key={stamp.idDetalleEstampadoCotizacion || `${stamp.idTecnica}-${index}`}>
                      <strong>Estampado {index + 1}: {stamp.tecnica?.nombre || 'Tecnica no especificada'}</strong>
                      <span>Ubicacion: {String(stamp.ubicacion || 'Por definir').replaceAll('_', ' ').toLowerCase()}</span>
                      <span>
                        Medidas: {stamp.anchoCm && stamp.altoCm ? `${stamp.anchoCm} x ${stamp.altoCm} cm` : 'Por definir'}
                      </span>
                      <span>Diseno: {getDesignOriginLabel(stamp.origenDiseno)}</span>
                      {stamp.grupoDisenoCompartido && <span>Diseño compartido con otro estampado</span>}
                      {(stamp.descripcion || stamp.observaciones) && (
                        <small>{stamp.descripcion || stamp.observaciones}</small>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className={styles.observationsGrid}>
            <div className={styles.readOnlyNote}>
              <span>Observaciones del cliente</span>
              <p>{clientObservations || 'Sin observaciones'}</p>
            </div>
            {isStaff && (
              <div className={styles.readOnlyNote}>
                <span>Observaciones internas</span>
                <p>{internalObservations || 'Sin observaciones'}</p>
              </div>
            )}
          </section>

          {isStaff && quote.creadoPor?.nombre && (
            <p className={styles.detailsCreatedBy}>
              Gestionada por: <strong>{quote.creadoPor.nombre}</strong>
              {quote.creadoPor.rol?.nombre ? ` - ${quote.creadoPor.rol.nombre}` : ''}
            </p>
          )}

          {isStaff ? (
            <section className={styles.quoteTotalsPanel}>
              <div className={styles.quoteTotalsRows}>
              <div>
                <span>Subtotal bruto de servicios</span>
                <strong>{formatMoney(subtotalBruto)}</strong>
              </div>
              <div>
                <span>Descuento por cantidad del producto</span>
                <strong>{formatPercentage(discountPercentage, '0%')}</strong>
              </div>
              <div>
                <span>Monto descontado</span>
                <strong>{discountTotal > 0 ? `-${formatMoneyCOP(discountTotal)}` : 'Sin descuento'}</strong>
              </div>
              <div>
                <span>Subtotal neto de servicios</span>
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
          ) : currentProposal ? (
            <section className={styles.clientProposalPanel}>
              <div className={styles.clientProposalHeading}>
                <div>
                  <span>Propuesta oficial</span>
                  <strong>{formatMoneyCOP(currentProposal.precioFinal)}</strong>
                  <small>Version {currentProposal.numeroVersion || 1}</small>
                </div>
                <div className={styles.clientProposalStatus}>
                  <span>{getProposalStatusLabel(currentProposal.estado)}</span>
                  <small>
                    {currentProposal.validaHasta
                      ? `${proposalExpired ? 'Vencio' : 'Valida hasta'}: ${formatCalendarDate(currentProposal.validaHasta)}`
                      : 'Sin fecha limite'}
                  </small>
                </div>
              </div>

              {proposalItems.length > 0 && (
                <div className={styles.clientProposalItems}>
                  <span>Desglose por producto</span>
                  {proposalItems.map((item, index) => (
                    <div key={item.idDetalleCotizacion || `${item.nombre}-${index}`}>
                      <p>
                        <strong>{item.nombre || `Producto ${index + 1}`}</strong>
                        <small>Cant. {Number(item.cantidad || 0).toLocaleString('es-CO')}</small>
                      </p>
                      <strong>{formatMoneyCOP(item.subtotalOficial ?? item.subtotal ?? 0)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {proposalDesigns.length > 0 && (
                <div className={styles.clientProposalVisibleList}>
                  <span>Disenos incluidos</span>
                  {proposalDesigns.map((design, index) => (
                    <div key={design.idDiseno || design.idDetalleCotizacion || design.idDetalleEstampadoCotizacion || design.grupoDisenoCompartido || index}>
                      <strong>{design.descripcionVisible || `Diseno ${index + 1}`}</strong>
                      <span>{formatMoneyCOP(design.costoDiseno ?? design.valor ?? 0)}</span>
                    </div>
                  ))}
                </div>
              )}

              {proposalConcepts.length > 0 && (
                <div className={styles.clientProposalVisibleList}>
                  <span>Conceptos adicionales</span>
                  {proposalConcepts.map((concept, index) => (
                    <div key={`${concept.concepto || 'concepto'}-${index}`}>
                      <strong>{concept.concepto || 'Concepto adicional'}</strong>
                      <span>{formatMoneyCOP(concept.valor ?? 0)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.clientProposalAmounts}>
                <div>
                  <span>Subtotal de productos</span>
                  <strong>{formatMoneyCOP(proposalItemsSubtotal || currentProposal.precioFinal)}</strong>
                </div>
                <div>
                  <span>Descuento comercial</span>
                  <strong>
                    {Number(currentProposal.descuentoManual || 0) > 0
                      ? `-${formatMoneyCOP(currentProposal.descuentoManual)}`
                      : 'No aplica'}
                  </strong>
                </div>
                <div>
                  <span>Conceptos adicionales</span>
                  <strong>
                    {(proposalConceptsTotal || proposalLegacyAdditional) > 0
                      ? formatMoneyCOP(proposalConceptsTotal || proposalLegacyAdditional)
                      : 'No aplica'}
                  </strong>
                </div>
                {proposalDesigns.length > 0 && (
                  <div>
                    <span>Disenos visibles</span>
                    <strong>{proposalDesignsTotal > 0 ? formatMoneyCOP(proposalDesignsTotal) : 'No aplica'}</strong>
                  </div>
                )}
                {proposalAdjustment != null && proposalAdjustment !== 0 && (
                  <div>
                    <span>Ajuste comercial</span>
                    <strong>{proposalAdjustment > 0 ? '+' : '-'}{formatMoneyCOP(Math.abs(proposalAdjustment))}</strong>
                  </div>
                )}
                <div className={styles.clientProposalTotal}>
                  <span>Total final</span>
                  <strong>{formatMoneyCOP(currentProposal.precioFinal)}</strong>
                </div>
              </div>

              {(currentProposal.mensajeCliente || currentProposal.observacionesCliente) && (
                <div className={styles.clientProposalMessages}>
                  {currentProposal.mensajeCliente && (
                    <div>
                      <span>Mensaje de PIXEL</span>
                      <p>{currentProposal.mensajeCliente}</p>
                    </div>
                  )}
                  {currentProposal.observacionesCliente && (
                    <div>
                      <span>Observaciones de la propuesta</span>
                      <p>{currentProposal.observacionesCliente}</p>
                    </div>
                  )}
                </div>
              )}

              {currentProposal.respuesta && (
                <div className={styles.clientProposalResponse}>
                  <strong>{getQuoteDecisionLabel(currentProposal.respuesta.decision)}</strong>
                  <span>
                    {getResponseMediumLabel(currentProposal.respuesta.medio)}
                    {currentProposal.respuesta.fechaRespuesta
                      ? ` - ${formatCalendarDate(currentProposal.respuesta.fechaRespuesta)}`
                      : ''}
                  </span>
                  {currentProposal.respuesta.observaciones && (
                    <p>{currentProposal.respuesta.observaciones}</p>
                  )}
                </div>
              )}
            </section>
          ) : null}
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
