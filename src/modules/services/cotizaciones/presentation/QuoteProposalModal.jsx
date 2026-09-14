import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Eye,
  Info,
  Package,
  Palette,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { formatMoneyCOP, formatPercentage } from '../../../../core/utils/formatters';
import { notifications } from '../../../../core/utils/notifications';
import {
  calculateProposalBreakdown,
  createProposalForm,
  formatMoneyInput,
  getSuggestedItemSubtotal,
  sanitizeMoneyInput,
  validateProposalForm,
} from '../domain/quoteProposal';
import { getQuoteStatusLabel } from './quoteWorkflow.utils';
import styles from './quoteWorkflow.module.css';

const ADJUSTMENT_REASON_LIMIT = 500;

const getBackendErrorCode = (error) => (
  error?.payload?.code
  || error?.response?.data?.code
  || error?.response?.data?.data?.code
  || ''
);

const getProposalErrorMessage = (error) => {
  const code = getBackendErrorCode(error);
  if (code === 'MANUAL_PRICE_REASON_REQUIRED') {
    return 'Explica por qué el precio final es diferente.';
  }
  if (/INVALID.*ID|NOT_FOUND|DETAIL/i.test(code)) {
    return 'Uno de los productos o diseños ya no está disponible. Recarga la cotización.';
  }
  if (/BREAKDOWN|DESGLOSE|INVALID_PROPOSAL/i.test(code)) {
    return 'Revisa los valores ingresados antes de enviar.';
  }
  if (!error?.response) {
    return 'No pudimos enviar la propuesta. Conservamos los datos para que puedas reintentar.';
  }
  return error?.message || 'No se pudo enviar la propuesta.';
};

const MoneyInput = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  error,
  help,
  required = false,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <label className={styles.moneyField} htmlFor={id}>
      <span>{label}{required ? ' *' : ''}</span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={focused ? value : formatMoneyInput(value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => onChange(sanitizeMoneyInput(event.target.value))}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        data-error={Boolean(error)}
      />
      {help && <small>{help}</small>}
      {error && <em className={styles.inlineError}>{error}</em>}
    </label>
  );
};

const SummaryLine = ({ label, value, emphasized = false, negative = false }) => (
  <div className={`${styles.summaryLine} ${emphasized ? styles.summaryLineEmphasized : ''}`}>
    <span>{label}</span>
    <strong className={negative ? styles.negativeValue : ''}>{value}</strong>
  </div>
);

const proposalStampCount = (quote) => (quote?.detalles || []).reduce(
  (sum, detail) => sum + (Array.isArray(detail.estampados) ? detail.estampados.length : 0),
  0,
);

export const QuoteProposalModal = ({ open, quote, onClose, onSubmit }) => {
  const [form, setForm] = useState(() => createProposalForm(quote));
  const [openItemId, setOpenItemId] = useState(() => form.items[0]?.idDetalleCotizacion ?? null);
  const [priceManuallyEdited, setPriceManuallyEdited] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(true);
  const conceptSequence = useRef(form.conceptosAdicionales.length);
  const modalRef = useRef(null);
  const reasonRef = useRef(null);
  const { isLocked: sending, runLocked } = useAsyncLock();

  const breakdown = useMemo(() => calculateProposalBreakdown(form), [form]);
  const currentValidation = useMemo(() => validateProposalForm(form), [form]);
  const client = quote?.cliente || {};
  const stampCount = proposalStampCount(quote);
  const suggestedPrice = quote?.precioSugeridoSistema ?? quote?.precioSugeridoInterno;
  const visibleDesigns = form.disenos.filter((design) => design.visibleCliente);
  const visibleConcepts = form.conceptosAdicionales.filter((concept) => concept.visibleCliente);
  const clientVisibleSubtotal = (
    breakdown.itemsTotal
    + visibleDesigns.reduce((sum, design) => sum + Number(design.costoDiseno || 0), 0)
    + visibleConcepts.reduce((sum, concept) => sum + Number(concept.valor || 0), 0)
    - breakdown.discount
  );
  const clientVisibleAdjustment = breakdown.finalPrice - clientVisibleSubtotal;
  const visibleErrors = { ...currentValidation.errors, ...errors };

  if (!open || !quote) return null;

  const clearError = (field) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const updateText = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    clearError(field);
  };

  const updateFinancialForm = (updater) => {
    setForm((current) => {
      const next = updater(current);
      if (priceManuallyEdited) return next;
      const nextBreakdown = calculateProposalBreakdown({ ...next, precioFinal: 0 });
      return {
        ...next,
        precioFinal: String(Math.max(0, nextBreakdown.subtotalDesglose)),
      };
    });
  };

  const updateItem = (idDetalleCotizacion, field, value) => {
    updateFinancialForm((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.idDetalleCotizacion !== idDetalleCotizacion) return item;
        const next = {
          ...item,
          [field]: value,
          ...(field === 'subtotalOficial' ? { subtotalModificado: true } : {}),
        };
        if (
          field !== 'subtotalOficial'
          && !item.subtotalModificado
          && ['costoProducto', 'otrosCostosItem', 'subtotalServiciosOficial'].includes(field)
        ) {
          next.subtotalOficial = String(getSuggestedItemSubtotal(next));
        }
        return next;
      }),
    }));
    clearError('items');
  };

  const applySuggestedItemSubtotal = (idDetalleCotizacion) => {
    updateFinancialForm((current) => ({
      ...current,
      items: current.items.map((item) => (
        item.idDetalleCotizacion === idDetalleCotizacion
          ? {
              ...item,
              subtotalOficial: String(getSuggestedItemSubtotal(item)),
              subtotalModificado: false,
            }
          : item
      )),
    }));
  };

  const updateDesign = (uiKey, field, value) => {
    updateFinancialForm((current) => ({
      ...current,
      disenos: current.disenos.map((design) => (
        design.uiKey === uiKey ? { ...design, [field]: value } : design
      )),
    }));
    clearError('disenos');
  };

  const addConcept = () => {
    conceptSequence.current += 1;
    updateFinancialForm((current) => ({
      ...current,
      conceptosAdicionales: [
        ...current.conceptosAdicionales,
        {
          localId: `concept-${conceptSequence.current}`,
          concepto: '',
          valor: '0',
          visibleCliente: true,
        },
      ],
    }));
  };

  const updateConcept = (localId, field, value) => {
    updateFinancialForm((current) => ({
      ...current,
      conceptosAdicionales: current.conceptosAdicionales.map((concept) => (
        concept.localId === localId ? { ...concept, [field]: value } : concept
      )),
    }));
    clearError('conceptosAdicionales');
  };

  const removeConcept = (localId) => {
    updateFinancialForm((current) => ({
      ...current,
      conceptosAdicionales: current.conceptosAdicionales.filter(
        (concept) => concept.localId !== localId,
      ),
    }));
    clearError('conceptosAdicionales');
  };

  const updateDiscount = (value) => {
    updateFinancialForm((current) => ({ ...current, descuentoManual: value }));
    clearError('descuentoManual');
  };

  const updateFinalPrice = (value) => {
    setPriceManuallyEdited(true);
    setForm((current) => ({ ...current, precioFinal: value }));
    clearError('precioFinal');
    clearError('motivoAjusteManual');
  };

  const useCalculatedSubtotal = () => {
    setPriceManuallyEdited(false);
    setForm((current) => ({
      ...current,
      precioFinal: String(Math.max(0, calculateProposalBreakdown(current).subtotalDesglose)),
    }));
    clearError('precioFinal');
    clearError('motivoAjusteManual');
  };

  const focusFirstError = (nextErrors) => {
    if (nextErrors.motivoAjusteManual) {
      reasonRef.current?.focus();
      reasonRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      return;
    }
    requestAnimationFrame(() => {
      const target = modalRef.current?.querySelector('[data-error="true"]');
      target?.focus();
      target?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    });
  };

  const scrollToFirstReview = () => {
    const firstItem = form.items.find((item) => item.requiereRevisionPrecio);
    if (!firstItem) return;
    setOpenItemId(firstItem.idDetalleCotizacion);
    requestAnimationFrame(() => {
      document.getElementById(`proposal-item-${firstItem.idDetalleCotizacion}`)
        ?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    const validation = validateProposalForm(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      focusFirstError(validation.errors);
      notifications.warning(Object.values(validation.errors)[0]);
      return;
    }

    await runLocked(async () => {
      try {
        await onSubmit({
          ...form,
          validaHasta: validation.validityIso,
        });
        onClose();
      } catch (error) {
        const code = getBackendErrorCode(error);
        if (code === 'MANUAL_PRICE_REASON_REQUIRED') {
          const nextErrors = {
            ...errors,
            motivoAjusteManual: 'Explica por qué el precio final es diferente.',
          };
          setErrors(nextErrors);
          focusFirstError(nextErrors);
        }
        if (!error?.wasNotified) notifications.error(getProposalErrorMessage(error));
      }
    });
  };

  return (
    <div className={styles.overlay} role="presentation">
      <section
        ref={modalRef}
        className={`${styles.modal} ${styles.proposalModal} ${styles.proposalWorkspace}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="proposal-title"
      >
        <header className={`${styles.header} ${styles.proposalHeader}`}>
          <div className={styles.proposalHeading}>
            <span>Propuesta para el cliente</span>
            <h2 id="proposal-title">Cotización #{quote.idCotizacion}</h2>
            <p>
              Revisa la estimación, completa los costos pendientes y define manualmente el precio
              final que recibirá el cliente.
            </p>
            <div className={styles.contextChips}>
              <span>{client.nombre || 'Cliente no especificado'}</span>
              <span>{form.items.length} producto(s)</span>
              <span>{stampCount} estampado(s)</span>
              <span>{getQuoteStatusLabel(quote.estado)}</span>
              <span>Vigencia: {form.validaHasta.replace('T', ' · ')}</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onClose}
            disabled={sending}
            aria-label="Cerrar"
          >
            <X size={19} />
          </button>
        </header>

        <form className={styles.proposalForm} onSubmit={submit}>
          <div className={`${styles.body} ${styles.proposalBody}`}>
            <section className={styles.proposalSection} aria-labelledby="system-estimate-title">
              <div className={styles.internalBanner}>
                <div>
                  <span id="system-estimate-title">Estimación sugerida por el sistema</span>
                  <strong>
                    {suggestedPrice == null ? 'No disponible' : formatMoneyCOP(suggestedPrice)}
                  </strong>
                  <small>
                    Este valor es solo una sugerencia interna. Puedes definir un precio final
                    diferente.
                  </small>
                </div>
                <div className={styles.estimateStatus}>
                  {quote.calculoCompleto === true && !quote.requiereRevisionPrecio ? (
                    <span className={styles.successTag}>
                      <CheckCircle2 size={15} /> Cálculo completo
                    </span>
                  ) : (
                    <span className={styles.reviewTag}>
                      <AlertTriangle size={15} /> Revisión necesaria
                    </span>
                  )}
                  {quote.requiereRevisionPrecio && (
                    <button type="button" onClick={scrollToFirstReview}>
                      Revisar pendientes
                    </button>
                  )}
                </div>
              </div>
              {quote.requiereRevisionPrecio && (
                <p className={styles.sectionNotice}>
                  Hay elementos que requieren revisión manual. Los encontrarás señalados dentro
                  del producto correspondiente.
                </p>
              )}
            </section>

            <section className={styles.proposalSection} aria-labelledby="proposal-products-title">
              <div className={styles.sectionHeading}>
                <div className={styles.sectionIcon}><Package size={18} /></div>
                <div>
                  <span>Productos y servicios</span>
                  <h3 id="proposal-products-title">Revisa el costo de cada producto</h3>
                </div>
              </div>
              {visibleErrors.items && <p className={styles.sectionError}>{visibleErrors.items}</p>}

              <div className={styles.proposalItems}>
                {form.items.map((item, index) => {
                  const isOpen = openItemId === item.idDetalleCotizacion;
                  const suggestedItemSubtotal = getSuggestedItemSubtotal(item);
                  return (
                    <article
                      id={`proposal-item-${item.idDetalleCotizacion}`}
                      className={`${styles.proposalItemCard} ${isOpen ? styles.proposalItemOpen : ''}`}
                      key={item.idDetalleCotizacion}
                    >
                      <button
                        type="button"
                        className={styles.proposalItemToggle}
                        onClick={() => setOpenItemId(isOpen ? null : item.idDetalleCotizacion)}
                        aria-expanded={isOpen}
                      >
                        <span className={styles.itemIndex}>{index + 1}</span>
                        <span className={styles.itemMain}>
                          <strong>{item.nombre}</strong>
                          <small>
                            Cant. {item.cantidad} · {item.tecnicas.join(', ')} ·{' '}
                            {item.suministradoPor === 'CLIENTE'
                              ? 'Suministra el cliente'
                              : 'Suministra PIXEL'}
                          </small>
                        </span>
                        {item.requiereRevisionPrecio && (
                          <span className={styles.reviewTag}>Revisar</span>
                        )}
                        <strong className={styles.itemTotal}>
                          {formatMoneyCOP(item.subtotalOficial)}
                        </strong>
                        <ChevronDown
                          size={18}
                          className={isOpen ? styles.chevronOpen : ''}
                        />
                      </button>

                      {isOpen && (
                        <div className={styles.proposalItemContent}>
                          <div className={styles.serviceBreakdown}>
                            <SummaryLine
                              label="Servicios antes del descuento"
                              value={formatMoneyCOP(item.subtotalServiciosBruto)}
                            />
                            <SummaryLine
                              label="Descuento automático por cantidad"
                              value={`${formatPercentage(item.descuentoPorcentaje ?? 0)} (${formatMoneyCOP(-Math.abs(item.descuentoTotalServicios))})`}
                              negative
                            />
                            <SummaryLine
                              label="Subtotal de servicios"
                              value={formatMoneyCOP(item.subtotalServiciosOficial)}
                              emphasized
                            />
                            {item.medidas.length > 0 && (
                              <small>Medidas: {item.medidas.join(', ')}</small>
                            )}
                          </div>

                          <div className={styles.itemCostGrid}>
                            <MoneyInput
                              id={`product-cost-${item.idDetalleCotizacion}`}
                              label={item.suministradoPor === 'CLIENTE'
                                ? 'Producto suministrado por el cliente'
                                : 'Costo del producto suministrado por PIXEL'}
                              value={item.suministradoPor === 'CLIENTE' ? '0' : item.costoProducto}
                              onChange={(value) => updateItem(
                                item.idDetalleCotizacion,
                                'costoProducto',
                                value,
                              )}
                              disabled={item.suministradoPor === 'CLIENTE'}
                              help={item.suministradoPor === 'CLIENTE'
                                ? 'No se agrega costo de suministro del producto.'
                                : 'Completa el costo del producto físico. Puede ser cero.'}
                            />
                            <MoneyInput
                              id={`other-cost-${item.idDetalleCotizacion}`}
                              label="Otros costos de este producto"
                              value={item.otrosCostosItem}
                              onChange={(value) => updateItem(
                                item.idDetalleCotizacion,
                                'otrosCostosItem',
                                value,
                              )}
                              help="Preparación, tratamiento, empaque o manipulación especial."
                            />
                            <MoneyInput
                              id={`official-subtotal-${item.idDetalleCotizacion}`}
                              label="Subtotal oficial del producto"
                              value={item.subtotalOficial}
                              onChange={(value) => updateItem(
                                item.idDetalleCotizacion,
                                'subtotalOficial',
                                value,
                              )}
                              help={`Suma sugerida: ${formatMoneyCOP(suggestedItemSubtotal)}`}
                            />
                          </div>
                          {item.subtotalModificado && Number(item.subtotalOficial) !== suggestedItemSubtotal && (
                            <button
                              type="button"
                              className={styles.inlineAction}
                              onClick={() => applySuggestedItemSubtotal(item.idDetalleCotizacion)}
                            >
                              <RotateCcw size={14} /> Usar suma sugerida del producto
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            <section className={styles.proposalSection} aria-labelledby="proposal-designs-title">
              <div className={styles.sectionHeading}>
                <div className={styles.sectionIcon}><Palette size={18} /></div>
                <div>
                  <span>Diseños</span>
                  <h3 id="proposal-designs-title">Diseños que requieren precio</h3>
                </div>
              </div>
              {visibleErrors.disenos && <p className={styles.sectionError}>{visibleErrors.disenos}</p>}
              {form.disenos.length === 0 ? (
                <p className={styles.compactEmpty}>No hay costos de diseño pendientes en esta propuesta.</p>
              ) : (
                <div className={styles.designList}>
                  {form.disenos.map((design) => (
                    <article className={styles.designRow} key={design.uiKey}>
                      <div className={styles.designDescription}>
                        <strong>{design.producto}</strong>
                        <span>
                          {design.tipo}
                          {design.ubicacion ? ` · ${design.ubicacion}` : ''}
                        </span>
                        {design.cubiertos.length > 0 && (
                          <small>Cubre: {design.cubiertos.join(', ')}</small>
                        )}
                      </div>
                      <label className={styles.designTextField}>
                        <span>Descripción visible</span>
                        <input
                          type="text"
                          value={design.descripcionVisible}
                          onChange={(event) => updateDesign(
                            design.uiKey,
                            'descripcionVisible',
                            event.target.value,
                          )}
                          aria-invalid={!design.descripcionVisible.trim()}
                          data-error={!design.descripcionVisible.trim()}
                        />
                      </label>
                      <MoneyInput
                        id={`design-cost-${design.uiKey}`}
                        label="Costo del diseño"
                        value={design.costoDiseno}
                        onChange={(value) => updateDesign(design.uiKey, 'costoDiseno', value)}
                      />
                      <label className={styles.visibilityCheck}>
                        <input
                          type="checkbox"
                          checked={design.visibleCliente}
                          onChange={(event) => updateDesign(
                            design.uiKey,
                            'visibleCliente',
                            event.target.checked,
                          )}
                        />
                        <span>Mostrar este concepto al cliente</span>
                      </label>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.proposalSection} aria-labelledby="proposal-concepts-title">
              <div className={styles.sectionHeadingWithAction}>
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionIcon}><Plus size={18} /></div>
                  <div>
                    <span>Otros conceptos</span>
                    <h3 id="proposal-concepts-title">Costos generales de la propuesta</h3>
                  </div>
                </div>
                <button type="button" className={styles.secondarySmallButton} onClick={addConcept}>
                  <Plus size={15} /> Agregar concepto
                </button>
              </div>
              {visibleErrors.conceptosAdicionales && (
                <p className={styles.sectionError}>{visibleErrors.conceptosAdicionales}</p>
              )}
              {form.conceptosAdicionales.length === 0 ? (
                <p className={styles.compactEmpty}>
                  No hay transporte, empaque u otros conceptos agregados.
                </p>
              ) : (
                <div className={styles.conceptList}>
                  {form.conceptosAdicionales.map((concept) => (
                    <div className={styles.conceptRow} key={concept.localId}>
                      <label>
                        <span>Concepto</span>
                        <input
                          type="text"
                          value={concept.concepto}
                          placeholder="Ej: Transporte"
                          onChange={(event) => updateConcept(
                            concept.localId,
                            'concepto',
                            event.target.value,
                          )}
                          aria-invalid={!concept.concepto.trim()}
                          data-error={!concept.concepto.trim()}
                        />
                      </label>
                      <MoneyInput
                        id={`concept-value-${concept.localId}`}
                        label="Valor"
                        value={concept.valor}
                        onChange={(value) => updateConcept(concept.localId, 'valor', value)}
                      />
                      <label className={styles.visibilityCheck}>
                        <input
                          type="checkbox"
                          checked={concept.visibleCliente}
                          onChange={(event) => updateConcept(
                            concept.localId,
                            'visibleCliente',
                            event.target.checked,
                          )}
                        />
                        <span>Visible para el cliente</span>
                      </label>
                      <button
                        type="button"
                        className={styles.removeIconButton}
                        onClick={() => removeConcept(concept.localId)}
                        aria-label={`Eliminar concepto ${concept.concepto || 'sin nombre'}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={`${styles.proposalSection} ${styles.financialSection}`} aria-labelledby="proposal-summary-title">
              <div className={styles.sectionHeading}>
                <div className={styles.sectionIcon}><Calculator size={18} /></div>
                <div>
                  <span>Resumen financiero</span>
                  <h3 id="proposal-summary-title">Resumen de la propuesta</h3>
                </div>
              </div>

              <div className={styles.financialGrid}>
                <div className={styles.breakdownCard}>
                  <SummaryLine label="Subtotal oficial de productos" value={formatMoneyCOP(breakdown.itemsTotal)} />
                  <SummaryLine label="Diseños" value={formatMoneyCOP(breakdown.designsTotal)} />
                  <SummaryLine label="Conceptos adicionales" value={formatMoneyCOP(breakdown.conceptsTotal)} />
                  <SummaryLine
                    label="Descuento comercial"
                    value={formatMoneyCOP(-Math.abs(breakdown.discount))}
                    negative={breakdown.discount > 0}
                  />
                  <SummaryLine
                    label="Subtotal del desglose"
                    value={formatMoneyCOP(breakdown.subtotalDesglose)}
                    emphasized
                  />
                  {visibleErrors.descuentoManual && (
                    <p className={styles.sectionError}>{visibleErrors.descuentoManual}</p>
                  )}
                </div>

                <div className={styles.finalPriceCard}>
                  <MoneyInput
                    id="proposal-manual-discount"
                    label="Descuento comercial manual"
                    value={form.descuentoManual}
                    onChange={updateDiscount}
                    error={visibleErrors.descuentoManual}
                    help="Es adicional al descuento automático por cantidad."
                  />
                  <MoneyInput
                    id="proposal-final-price"
                    label="Precio final para el cliente"
                    value={form.precioFinal}
                    onChange={updateFinalPrice}
                    error={visibleErrors.precioFinal}
                    help="Valor manual y oficial que recibirá el cliente."
                    required
                  />
                  <div className={styles.manualPriceStatus}>
                    <span>
                      {priceManuallyEdited
                        ? 'Precio final definido manualmente.'
                        : 'Valor sugerido actualizado con el desglose.'}
                    </span>
                    <button type="button" onClick={useCalculatedSubtotal}>
                      <RotateCcw size={14} /> Usar subtotal calculado
                    </button>
                  </div>
                  <div className={`${styles.adjustmentBox} ${breakdown.ajusteManual === 0 ? styles.adjustmentNeutral : ''}`}>
                    <span>Ajuste comercial</span>
                    <strong>
                      {breakdown.ajusteManual > 0 ? '+' : ''}
                      {formatMoneyCOP(breakdown.ajusteManual)}
                    </strong>
                    <small>
                      {breakdown.ajusteManual === 0
                        ? 'No hay diferencia entre el desglose y el precio final.'
                        : 'Diferencia entre el desglose y el precio final definido por PIXEL.'}
                    </small>
                  </div>
                </div>
              </div>

              {breakdown.ajusteManual !== 0 && (
                <label className={styles.reasonField} htmlFor="proposal-adjustment-reason">
                  <span>¿Por qué el precio final es diferente? *</span>
                  <textarea
                    ref={reasonRef}
                    id="proposal-adjustment-reason"
                    rows={3}
                    maxLength={ADJUSTMENT_REASON_LIMIT}
                    value={form.motivoAjusteManual}
                    placeholder="Ejemplo: incluye el suministro del producto, entrega urgente o un acuerdo comercial."
                    onChange={(event) => updateText('motivoAjusteManual', event.target.value)}
                    aria-invalid={Boolean(visibleErrors.motivoAjusteManual)}
                    data-error={Boolean(visibleErrors.motivoAjusteManual)}
                  />
                  <small>{form.motivoAjusteManual.length} / {ADJUSTMENT_REASON_LIMIT}</small>
                  {visibleErrors.motivoAjusteManual && (
                    <em className={styles.inlineError}>{visibleErrors.motivoAjusteManual}</em>
                  )}
                  <p>Este motivo es interno y no aparecerá en la propuesta del cliente.</p>
                </label>
              )}
            </section>

            <section className={styles.proposalSection} aria-labelledby="proposal-client-info-title">
              <div className={styles.sectionHeading}>
                <div className={styles.sectionIcon}><Info size={18} /></div>
                <div>
                  <span>Información de la propuesta</span>
                  <h3 id="proposal-client-info-title">Mensajes para el cliente y notas internas</h3>
                </div>
              </div>
              <div className={styles.fieldGrid}>
                <label className={styles.fieldWide}>
                  <span>Mensaje para el cliente</span>
                  <textarea
                    value={form.mensajeCliente}
                    onChange={(event) => updateText('mensajeCliente', event.target.value)}
                    rows={2}
                  />
                </label>
                <label>
                  <span>Detalles visibles en la propuesta</span>
                  <textarea
                    value={form.observacionesCliente}
                    onChange={(event) => updateText('observacionesCliente', event.target.value)}
                    rows={3}
                  />
                </label>
                <label>
                  <span>Notas internas de PIXEL</span>
                  <textarea
                    value={form.observacionesInternas}
                    onChange={(event) => updateText('observacionesInternas', event.target.value)}
                    rows={3}
                  />
                  <small>Estas notas nunca se muestran al cliente.</small>
                </label>
                <label>
                  <span>Válida hasta *</span>
                  <input
                    type="datetime-local"
                    value={form.validaHasta}
                    onChange={(event) => updateText('validaHasta', event.target.value)}
                    aria-invalid={Boolean(visibleErrors.validaHasta)}
                    data-error={Boolean(visibleErrors.validaHasta)}
                  />
                  {visibleErrors.validaHasta && (
                    <em className={styles.inlineError}>{visibleErrors.validaHasta}</em>
                  )}
                </label>
              </div>
            </section>

            <section className={`${styles.proposalSection} ${styles.previewSection}`} aria-labelledby="proposal-preview-title">
              <button
                type="button"
                className={styles.previewToggle}
                onClick={() => setShowPreview((current) => !current)}
                aria-expanded={showPreview}
              >
                <span><Eye size={18} /> Vista previa para el cliente</span>
                <ChevronDown size={18} className={showPreview ? styles.chevronOpen : ''} />
              </button>
              {showPreview && (
                <div className={styles.publicPreview}>
                  {form.mensajeCliente && <p className={styles.previewMessage}>{form.mensajeCliente}</p>}
                  <div className={styles.previewItems}>
                    {form.items.map((item) => (
                      <div key={item.idDetalleCotizacion}>
                        <span>{item.nombre} · Cant. {item.cantidad}</span>
                        <strong>{formatMoneyCOP(item.subtotalOficial)}</strong>
                      </div>
                    ))}
                    {visibleDesigns.map((design) => (
                      <div key={design.uiKey}>
                        <span>{design.descripcionVisible}</span>
                        <strong>{formatMoneyCOP(design.costoDiseno)}</strong>
                      </div>
                    ))}
                    {visibleConcepts.map((concept) => (
                      <div key={concept.localId}>
                        <span>{concept.concepto || 'Concepto pendiente'}</span>
                        <strong>{formatMoneyCOP(concept.valor)}</strong>
                      </div>
                    ))}
                    {breakdown.discount > 0 && (
                      <div>
                        <span>Descuento comercial</span>
                        <strong>-{formatMoneyCOP(breakdown.discount)}</strong>
                      </div>
                    )}
                    {clientVisibleAdjustment !== 0 && (
                      <div>
                        <span>Ajuste comercial</span>
                        <strong>
                          {clientVisibleAdjustment > 0 ? '+' : ''}
                          {formatMoneyCOP(clientVisibleAdjustment)}
                        </strong>
                      </div>
                    )}
                  </div>
                  <div className={styles.previewTotal}>
                    <span>Precio final</span>
                    <strong>{formatMoneyCOP(breakdown.finalPrice)}</strong>
                  </div>
                  {form.observacionesCliente && <p>{form.observacionesCliente}</p>}
                  <small>Vigencia: {form.validaHasta.replace('T', ' · ')}</small>
                </div>
              )}
            </section>
          </div>

          <footer className={`${styles.footer} ${styles.proposalFooter}`}>
            <div className={styles.footerTotal}>
              <span>Precio final para el cliente</span>
              <strong>{formatMoneyCOP(breakdown.finalPrice)}</strong>
            </div>
            <div className={styles.footerActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={onClose}
                disabled={sending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={sending || !currentValidation.isValid}
                title={!currentValidation.isValid
                  ? Object.values(currentValidation.errors)[0]
                  : undefined}
              >
                <Send size={16} /> {sending ? 'Enviando propuesta...' : 'Enviar propuesta al cliente'}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
};
