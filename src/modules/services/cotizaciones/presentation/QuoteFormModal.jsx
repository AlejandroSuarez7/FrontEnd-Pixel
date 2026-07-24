import { useEffect, useState } from 'react';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import {
  formatMoneyCOP,
  formatPercentage,
  getQuoteDiscountTotal,
  getQuoteSubtotalBruto,
  getQuoteSubtotalWithDiscount,
  getQuoteTotal,
} from '../../../../core/utils/formatters';
import { notifications } from '../../../../core/utils/notifications';
import { publicQuoteRepository } from '../../../landing/infrastructure/publicQuote.repository.js';
import styles from './quotes.module.css';

const initialDetail = {
  idCategoriaProducto: '',
  idProducto: '',
  idTecnica: '',
  descripcion: '',
  cantidad: 1,
  observaciones: '',
};

const getCalculationItems = (calculation) => {
  if (!calculation) return [];
  if (Array.isArray(calculation.items)) return calculation.items;
  if (Array.isArray(calculation.detalles)) return calculation.detalles;
  const singleItem = calculation.item || calculation.detalle;
  return singleItem ? [singleItem] : [];
};

const createEmptyDetail = () => ({ ...initialDetail });

export const QuoteFormModal = ({ isOpen, onClose, onSubmit, quote, isStaff }) => {
  const [observaciones, setObservaciones] = useState('');
  const [motivoCambio, setMotivoCambio] = useState('');
  const [costosAdicionales, setCostosAdicionales] = useState(0);
  const [cliente, setCliente] = useState({ nombre: '', correo: '', telefono: '' });
  const [detalles, setDetalles] = useState([]);
  const [activeDetailIndex, setActiveDetailIndex] = useState(0);

  const [tecnicas, setTecnicas] = useState([]);
  const [loadingTecnicas, setLoadingTecnicas] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [calculo, setCalculo] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();

  const isEditing = !!quote;
  const isPricing = isStaff && isEditing;
  const hasExistingValues = Number(quote?.total || 0) > 0
    || Number(quote?.subtotal || 0) > 0
    || detalles.some(det => Number(det.precioUnitario || 0) > 0);
  const shouldShowChangeReason = isPricing && hasExistingValues;
  const calculationItems = getCalculationItems(calculo);
  const additionalCosts = Number(costosAdicionales || 0);
  const finalTotal = getQuoteTotal({
    ...calculo,
    costosAdicionales: additionalCosts,
  });
  const quoteNumber = quote?.idCotizacion ? `#${quote.idCotizacion}` : '';

  useEffect(() => {
    if (!isOpen) return;

    setLoadingTecnicas(true);
    publicQuoteRepository
      .listTechniques()
      .then(items => setTecnicas((items || []).filter(item => item.estado === true)))
      .catch((err) => {
        console.error('Error al cargar tecnicas:', err);
        setTecnicas([]);
      })
      .finally(() => setLoadingTecnicas(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setLoadingProductos(true);
    Promise.all([
      publicQuoteRepository.listCategories(),
      publicQuoteRepository.listProducts(),
    ])
      .then(([categories, products]) => {
        setCategorias(categories || []);
        setProductos(products || []);
      })
      .catch((err) => {
        console.error('Error al cargar productos cotizables:', err);
        notifications.error('No se pudieron cargar los productos cotizables.');
        setCategorias([]);
        setProductos([]);
      })
      .finally(() => setLoadingProductos(false));
  }, [isOpen]);

  useEffect(() => {
    if (quote) {
      setObservaciones(quote.observaciones || '');
      setMotivoCambio('');
      setCostosAdicionales(quote.costosAdicionales || 0);
      setCliente({
        nombre: quote.cliente?.nombre || '',
        correo: quote.cliente?.correo || '',
        telefono: quote.cliente?.telefono || '',
      });
      setDetalles(quote.detalles?.length ? quote.detalles : [createEmptyDetail()]);
      setActiveDetailIndex(0);
    } else {
      setObservaciones('');
      setMotivoCambio('');
      setCostosAdicionales(0);
      setCliente({ nombre: '', correo: '', telefono: '' });
      setCalculo(null);
      setDetalles([createEmptyDetail()]);
      setActiveDetailIndex(0);
    }
  }, [quote, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const calculableDetails = detalles
      .filter(det => det.idProducto && Number(det.cantidad) > 0)
      .map(det => ({
        idProducto: Number(det.idProducto),
        ...(det.idTecnica && { idTecnica: Number(det.idTecnica) }),
        cantidad: Number(det.cantidad),
        observaciones: det.observaciones?.trim() || null,
      }));

    if (calculableDetails.length === 0) {
      setCalculo(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setCalculando(true);
      publicQuoteRepository
        .calculate(calculableDetails)
        .then(setCalculo)
        .catch((err) => {
          console.error('Error al calcular producto:', err);
          setCalculo(null);
          notifications.error(err.message || 'No se pudo calcular el valor estimado.');
        })
        .finally(() => setCalculando(false));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [isOpen, detalles]);

  if (!isOpen) return null;

  const updateDetail = (index, field, value) => {
    setDetalles(prev => {
      const next = [...prev];
      next[index] = { ...(next[index] || initialDetail), [field]: value };
      return next;
    });
  };

  const addDetail = () => {
    setDetalles(prev => {
      const next = [...prev, createEmptyDetail()];
      setActiveDetailIndex(next.length - 1);
      return next;
    });
  };

  const removeDetail = (index) => {
    setDetalles(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      setActiveDetailIndex(current => Math.max(0, Math.min(current >= index ? current - 1 : current, next.length - 1)));
      return next;
    });
  };

  const updateCliente = (field, value) => {
    setCliente(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (index, value) => {
    setDetalles(prev => {
      const next = [...prev];
      next[index] = {
        ...(next[index] || initialDetail),
        idCategoriaProducto: value,
        idProducto: '',
        descripcion: '',
      };
      return next;
    });
    setCalculo(null);
  };

  const handleProductChange = (index, value) => {
    const product = productos.find(item => Number(item.idProducto) === Number(value));
    setDetalles(prev => {
      const next = [...prev];
      next[index] = {
        ...(next[index] || initialDetail),
        idProducto: value,
        descripcion: product?.nombre || '',
      };
      return next;
    });
    setCalculo(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await runLocked(async () => {

    try {
      if (isStaff && !isEditing) {
        if (!cliente.nombre.trim()) {
          notifications.warning('El nombre del cliente es obligatorio.');
          return;
        }
        if (!cliente.telefono.trim()) {
          notifications.warning('El telefono del cliente es obligatorio para cotizaciones presenciales.');
          return;
        }
        if (!/^\d{10}$/.test(cliente.telefono.trim())) {
          notifications.warning('El telefono debe tener exactamente 10 numeros.');
          return;
        }
        if (cliente.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.correo.trim())) {
          notifications.warning('Ingresa un correo valido para el cliente.');
          return;
        }
        const invalidProductIndex = detalles.findIndex(det => !det.idProducto);
        if (invalidProductIndex >= 0) {
          setActiveDetailIndex(invalidProductIndex);
          notifications.warning(`Selecciona un producto para el item ${invalidProductIndex + 1}.`);
          return;
        }
        const invalidQuantityIndex = detalles.findIndex(det => Number(det.cantidad || 0) <= 0);
        if (invalidQuantityIndex >= 0) {
          setActiveDetailIndex(invalidQuantityIndex);
          notifications.warning(`La cantidad del item ${invalidQuantityIndex + 1} debe ser mayor a 0.`);
          return;
        }
        const invalidTechniqueIndex = detalles.findIndex(det => !det.idTecnica);
        if (invalidTechniqueIndex >= 0) {
          setActiveDetailIndex(invalidTechniqueIndex);
          notifications.warning(`Selecciona una tecnica para el item ${invalidTechniqueIndex + 1}.`);
          return;
        }
      }

      const pricedDetails = isPricing
        ? detalles.map((det, index) => {
          const itemCalculation = calculationItems[index] || {};
          return {
          ...det,
          precioUnitario: det.precioUnitario || itemCalculation.precioUnitario || det.precioBase || 0,
          costoDiseno: det.costoDiseno || 0,
        };
        })
        : detalles;

      const payload = {
        observaciones: observaciones.trim() || null,
        detalles: pricedDetails,
        ...(isPricing && { costosAdicionales: Number(costosAdicionales || 0) }),
        ...(shouldShowChangeReason && motivoCambio.trim() && {
          motivoCambio: motivoCambio.trim(),
        }),
        ...(isStaff && !isEditing && {
          cliente: {
            nombre: cliente.nombre.trim(),
            correo: cliente.correo.trim().toLowerCase() || null,
            telefono: cliente.telefono.trim() || null,
          },
        }),
      };

      await onSubmit(payload);
    } catch (err) {
      notifications.error(err.message || 'Ocurrio un error al procesar el formulario.');
    }
    });
  };

  const modalTitle = isPricing
    ? `Cotizar solicitud ${quoteNumber}`
    : isEditing
      ? `Editar cotizacion ${quoteNumber}`
      : 'Nueva solicitud de cotizacion';

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${isPricing ? styles.modalQuotePricing : styles.modalSm}`}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>{modalTitle}</h3>
            {isPricing && (
              <p className={styles.modalSubtitle}>
                Revisa el producto, aplica costos necesarios y envia el precio final al cliente.
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn} disabled={isSubmitting}>x</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {isStaff && !isEditing && (
            <div className={styles.quoteClientGrid}>
              <div className={`${styles.inputGroup} ${styles.quoteClientName}`}>
                <label className={styles.inputLabel}>Nombre completo *</label>
                <input
                  type="text"
                  value={cliente.nombre}
                  onChange={event => updateCliente('nombre', event.target.value)}
                  className={styles.inputField}
                  placeholder="Nombre del cliente"
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Correo</label>
                <input
                  type="email"
                  value={cliente.correo}
                  onChange={event => updateCliente('correo', event.target.value)}
                  className={styles.inputField}
                  placeholder="cliente@email.com"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Telefono</label>
                <input
                  type="tel"
                  value={cliente.telefono}
                  onChange={event => updateCliente('telefono', event.target.value.replace(/\D/g, '').slice(0, 10))}
                  className={styles.inputField}
                  placeholder="3000000000"
                  inputMode="numeric"
                  maxLength={10}
                  required
                />
              </div>
            </div>
          )}

          {isPricing && (
            <div className={styles.quoteSummaryCard}>
              <div className={styles.quoteSummaryItem}>
                <span>Cliente</span>
                <strong>{quote?.cliente?.nombre || 'Cliente sin nombre'}</strong>
                <small>{[quote?.cliente?.correo, quote?.cliente?.telefono].filter(Boolean).join(' | ') || 'Sin contacto registrado'}</small>
              </div>
              <div className={styles.quoteSummaryItem}>
                <span>Productos</span>
                <strong>{detalles.length}</strong>
                <small>{quote?.productosResumen || 'Productos de la solicitud'}</small>
              </div>
              <div className={styles.quoteSummaryItem}>
                <span>Estado</span>
                <strong>{quote?.estado || 'PENDIENTE'}</strong>
                <small>{quote?.tipoCotizacion || 'Cotizacion'}</small>
              </div>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              {isPricing ? 'Observaciones internas del administrador' : 'Observaciones generales'}
            </label>
            <textarea
              value={observaciones}
              onChange={event => setObservaciones(event.target.value)}
              className={styles.inputField}
              rows={2}
              placeholder="Entrega, urgencia, empaque u otra aclaracion..."
            />
          </div>

          <div className={styles.pricingPanel}>
            <div className={styles.pricingPanelHeader}>
              <div>
                <p className={styles.detailsSectionLabel}>Productos a cotizar</p>
                <p className={styles.pricingHelpText}>
                  Agrega uno o varios productos. El backend recalcula precios, descuentos y totales.
                </p>
              </div>
              <div className={styles.quotePanelActions}>
                {calculando && <span className={styles.pricingBadge}>Calculando...</span>}
                <button type="button" className={styles.btnSecondary} onClick={addDetail} disabled={isSubmitting}>
                  Agregar producto
                </button>
              </div>
            </div>

            <div className={styles.detailRowsWrapper}>
              {detalles.map((item, index) => {
                const availableProducts = item.idCategoriaProducto
                  ? productos.filter(product => Number(product.idCategoriaProducto || product.categoriaProducto?.idCategoriaProducto) === Number(item.idCategoriaProducto))
                  : productos;
                const calculationItem = calculationItems[index] || item;
                const unitBase = Number(calculationItem?.precioBase ?? item.precioBase ?? item.producto?.precioBase ?? 0);
                const suggestedUnitPrice = Number(calculationItem?.precioUnitario ?? item.precioUnitario ?? unitBase ?? 0);
                const discountPercent = calculationItem?.descuentoPorcentaje ?? item.descuentoPorcentaje ?? null;
                const discountAmount = getQuoteDiscountTotal(calculationItem || {});
                const subtotalBruto = getQuoteSubtotalBruto(calculationItem || {}) || (unitBase * Number(item.cantidad || 1));
                const subtotalWithDiscount = getQuoteSubtotalWithDiscount(calculationItem || {});
                const selectedProduct = productos.find(product => Number(product.idProducto) === Number(item.idProducto));
                const selectedTechnique = tecnicas.find(tecnica => Number(tecnica.idTecnica) === Number(item.idTecnica));
                const itemTitle = selectedProduct?.nombre || item.producto?.nombre || item.descripcion || 'Falta seleccionar producto';
                const isComplete = Boolean(item.idProducto && item.idTecnica && Number(item.cantidad || 0) > 0);
                const isOpen = activeDetailIndex === index;

                return (
                  <div
                    className={`${styles.quoteProductBlock} ${!isComplete ? styles.quoteProductIncomplete : ''}`}
                    key={item.idDetalleCotizacion || `detail-${index}`}
                  >
                    <div className={styles.quoteItemAccordionHeader}>
                      <button
                        type="button"
                        className={styles.quoteItemSummaryButton}
                        onClick={() => setActiveDetailIndex(index)}
                        aria-expanded={isOpen}
                      >
                        <span className={styles.quoteItemTitle}>
                          Producto {index + 1} - {itemTitle}
                        </span>
                        <span className={styles.quoteItemSummaryMeta}>
                          Cant. {Number(item.cantidad || 0).toLocaleString('es-CO')} - {selectedTechnique?.nombre || item.tecnica?.nombre || 'Sin tecnica'} - {subtotalWithDiscount > 0 ? formatMoneyCOP(subtotalWithDiscount) : 'Por cotizar'}
                        </span>
                      </button>
                      <span className={`${styles.quoteItemStatus} ${isComplete ? styles.quoteItemStatusComplete : styles.quoteItemStatusPending}`}>
                        {isComplete ? 'Completo' : 'Falta informacion'}
                      </span>
                      <button
                        type="button"
                        className={styles.quoteItemTinyBtn}
                        onClick={() => setActiveDetailIndex(index)}
                        disabled={isSubmitting}
                      >
                        {isOpen ? 'Editando' : 'Editar'}
                      </button>
                      {detalles.length > 1 && (
                        <button type="button" className={styles.quoteItemTinyBtnDanger} onClick={() => removeDetail(index)} disabled={isSubmitting}>
                          Quitar
                        </button>
                      )}
                    </div>

                    {isOpen && (
                      <div className={styles.quoteItemAccordionBody}>
                    <div className={styles.quoteProductGrid}>
                      {categorias.length > 0 && !isPricing && (
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Categoria</label>
                          <select
                            value={item.idCategoriaProducto || ''}
                            onChange={event => handleCategoryChange(index, event.target.value)}
                            className={styles.selectField}
                          >
                            <option value="">Todas las categorias</option>
                            {categorias.map(category => (
                              <option key={category.idCategoriaProducto} value={category.idCategoriaProducto}>
                                {category.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Tecnica *</label>
                        {loadingTecnicas ? (
                          <p className={styles.inlineLoadingText}>Cargando tecnicas...</p>
                        ) : tecnicas.length === 0 && !isPricing ? (
                          <p className={styles.inlineErrorText}>No hay tecnicas activas disponibles.</p>
                        ) : (
                          <select
                            value={item.idTecnica || ''}
                            onChange={event => updateDetail(index, 'idTecnica', event.target.value)}
                            className={styles.selectField}
                            required
                          >
                            <option value="">{item.tecnica?.nombre || 'Seleccione una tecnica'}</option>
                            {tecnicas.map(tecnica => (
                              <option key={tecnica.idTecnica} value={tecnica.idTecnica}>
                                {tecnica.nombre}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    <div className={styles.quoteItemGrid}>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Producto *</label>
                        {loadingProductos ? (
                          <p className={styles.inlineLoadingText}>Cargando productos...</p>
                        ) : productos.length === 0 && !isPricing ? (
                          <p className={styles.inlineErrorText}>No hay productos activos disponibles.</p>
                        ) : (
                          <select
                            value={item.idProducto || ''}
                            onChange={event => handleProductChange(index, event.target.value)}
                            className={styles.selectField}
                            required
                          >
                            <option value="">{item.producto?.nombre || 'Seleccione un producto'}</option>
                            {availableProducts.map(product => (
                              <option key={product.idProducto} value={product.idProducto}>
                                {product.categoriaProducto?.nombre ? `${product.categoriaProducto.nombre} - ${product.nombre}` : product.nombre}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Cantidad *</label>
                        <input
                          type="number"
                          value={item.cantidad || 1}
                          onChange={event => updateDetail(index, 'cantidad', event.target.value)}
                          className={styles.detailRowInputSm}
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Detalle opcional: color, talla o ubicacion del estampado"
                      value={item.observaciones || ''}
                      onChange={event => updateDetail(index, 'observaciones', event.target.value)}
                      className={styles.detailRowInputFlex}
                    />

                    {isPricing && (
                      <div className={styles.pricingInputsGrid}>
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Precio unitario aplicado</label>
                          <input
                            type="number"
                            value={item.precioUnitario ?? (suggestedUnitPrice > 0 ? suggestedUnitPrice : '')}
                            onChange={event => updateDetail(index, 'precioUnitario', event.target.value)}
                            className={styles.inputFieldStaff}
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Costo de diseno</label>
                          <input
                            type="number"
                            value={item.costoDiseno || ''}
                            onChange={event => updateDetail(index, 'costoDiseno', event.target.value)}
                            className={styles.inputFieldStaff}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    )}

                    <div className={styles.pricingGrid}>
                      <div className={styles.priceMetric}>
                        <span>Precio base</span>
                        <strong>{unitBase > 0 ? formatMoneyCOP(unitBase) : 'Por cotizar'}</strong>
                      </div>
                      <div className={styles.priceMetric}>
                        <span>Descuento</span>
                        <strong>{formatPercentage(discountPercent, '0%')}</strong>
                      </div>
                      <div className={styles.priceMetric}>
                        <span>Valor descontado</span>
                        <strong>{discountAmount > 0 ? `-${formatMoneyCOP(discountAmount)}` : 'Sin descuento'}</strong>
                      </div>
                      <div className={styles.priceMetric}>
                        <span>Subtotal bruto</span>
                        <strong>{subtotalBruto > 0 ? formatMoneyCOP(subtotalBruto) : 'Por cotizar'}</strong>
                      </div>
                      <div className={styles.priceMetric}>
                        <span>Subtotal final</span>
                        <strong>{subtotalWithDiscount > 0 ? formatMoneyCOP(subtotalWithDiscount) : 'Por cotizar'}</strong>
                      </div>
                    </div>
                    </div>
                    )}
                  </div>
                );
              })}
            </div>

            {isPricing && (
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Costos adicionales</label>
                <input
                  type="number"
                  value={costosAdicionales}
                  onChange={event => setCostosAdicionales(event.target.value)}
                  className={styles.inputFieldStaff}
                  min="0"
                  step="0.01"
                />
                <span className={styles.fieldHint}>Ej: diseno extra, urgencia, domicilio, personalizacion especial.</span>
              </div>
            )}

            <div className={styles.quoteTotalCard}>
              <span>Total final</span>
              <strong>{finalTotal > 0 ? formatMoneyCOP(finalTotal) : formatMoneyCOP(calculo?.total ?? 0)}</strong>
              <small>{calculando ? 'Calculando con precios reales...' : 'Total general de la cotizacion.'}</small>
            </div>
          </div>

          {shouldShowChangeReason && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Motivo del cambio</label>
              <textarea
                value={motivoCambio}
                onChange={event => setMotivoCambio(event.target.value)}
                className={styles.inputField}
                rows={2}
                placeholder="Ej: Se agrego costo de diseno, se ajusto la cantidad, se modifico el valor del producto..."
              />
              <span className={styles.fieldHint}>
                Este motivo sera enviado al cliente por correo si la cotizacion ya habia sido enviada o valorizada.
              </span>
            </div>
          )}

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isPricing ? 'Enviar precio al cliente' : 'Procesar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
