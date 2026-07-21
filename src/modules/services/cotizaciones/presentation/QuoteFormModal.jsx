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

const getFirstCalculationItem = (calculation) => {
  if (!calculation) return null;
  if (Array.isArray(calculation.items)) return calculation.items[0] || null;
  if (Array.isArray(calculation.detalles)) return calculation.detalles[0] || null;
  return calculation.item || calculation.detalle || null;
};

export const QuoteFormModal = ({ isOpen, onClose, onSubmit, quote, isStaff }) => {
  const [observaciones, setObservaciones] = useState('');
  const [motivoCambio, setMotivoCambio] = useState('');
  const [costosAdicionales, setCostosAdicionales] = useState(0);
  const [cliente, setCliente] = useState({ nombre: '', correo: '', telefono: '' });
  const [detalles, setDetalles] = useState([]);

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
  const detail = detalles[0] || initialDetail;
  const hasExistingValues = Number(quote?.total || 0) > 0
    || Number(quote?.subtotal || 0) > 0
    || detalles.some(det => Number(det.precioUnitario || 0) > 0);
  const shouldShowChangeReason = isPricing && hasExistingValues;
  const calculationItem = getFirstCalculationItem(calculo);
  const quantity = Number(detail.cantidad || 1);
  const unitBase = Number(
    calculationItem?.precioBase
      ?? calculationItem?.precioUnitarioBase
      ?? detail.precioBase
      ?? detail.producto?.precioBase
      ?? 0
  );
  const suggestedUnitPrice = Number(
    calculationItem?.precioUnitario
      ?? calculationItem?.precioUnitarioFinal
      ?? detail.precioUnitario
      ?? unitBase
      ?? 0
  );
  const appliedUnitPrice = Number(detail.precioUnitario ?? suggestedUnitPrice ?? 0);
  const unitPriceInputValue = detail.precioUnitario ?? (suggestedUnitPrice > 0 ? suggestedUnitPrice : '');
  const discountPercent =
    calculationItem?.descuentoPorcentaje
      ?? calculationItem?.descuento
      ?? detail.descuentoPorcentaje
      ?? null;
  const calculationSource = calculationItem || detail;
  const discountAmount = getQuoteDiscountTotal(calculationSource);
  const additionalCosts = Number(costosAdicionales || 0);
  const subtotalBruto = getQuoteSubtotalBruto(calculationSource) || ((unitBase || appliedUnitPrice) * quantity);
  const subtotalWithDiscount = getQuoteSubtotalWithDiscount(calculationSource);
  const finalTotal = getQuoteTotal({
    ...calculo,
    total: undefined,
    subtotalConDescuento: subtotalWithDiscount,
    costosAdicionales: additionalCosts,
  });
  const quoteNumber = quote?.idCotizacion ? `#${quote.idCotizacion}` : '';

  useEffect(() => {
    if (!isOpen || isPricing) return;

    setLoadingTecnicas(true);
    publicQuoteRepository
      .listTechniques()
      .then(items => setTecnicas((items || []).filter(item => item.estado === true)))
      .catch((err) => {
        console.error('Error al cargar tecnicas:', err);
        setTecnicas([]);
      })
      .finally(() => setLoadingTecnicas(false));
  }, [isOpen, isPricing]);

  useEffect(() => {
    if (!isOpen || isPricing) return;

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
  }, [isOpen, isPricing]);

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
      setDetalles(quote.detalles || []);
    } else {
      setObservaciones('');
      setMotivoCambio('');
      setCostosAdicionales(0);
      setCliente({ nombre: '', correo: '', telefono: '' });
      setCalculo(null);
      setDetalles([{ ...initialDetail }]);
    }
  }, [quote, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (!detail.idProducto || Number(detail.cantidad) <= 0) {
      setCalculo(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setCalculando(true);
      publicQuoteRepository
        .calculate([{
          idProducto: Number(detail.idProducto),
          cantidad: Number(detail.cantidad),
        }])
        .then(setCalculo)
        .catch((err) => {
          console.error('Error al calcular producto:', err);
          setCalculo(null);
          notifications.error(err.message || 'No se pudo calcular el valor estimado.');
        })
        .finally(() => setCalculando(false));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [isOpen, detail.idProducto, detail.cantidad]);

  if (!isOpen) return null;

  const updateDetail = (field, value) => {
    setDetalles(prev => {
      const next = [...prev];
      next[0] = { ...(next[0] || initialDetail), [field]: value };
      return next;
    });
  };

  const updateCliente = (field, value) => {
    setCliente(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = async (value) => {
    setDetalles(prev => {
      const next = [...prev];
      next[0] = {
        ...(next[0] || initialDetail),
        idCategoriaProducto: value,
        idProducto: '',
        descripcion: '',
      };
      return next;
    });
    setCalculo(null);

    setLoadingProductos(true);
    try {
      const filteredProducts = await publicQuoteRepository.listProductsByCategory(value);
      setProductos(filteredProducts || []);
    } catch (err) {
      console.error('Error al filtrar productos:', err);
      notifications.error('No se pudieron cargar los productos de la categoria.');
      setProductos([]);
    } finally {
      setLoadingProductos(false);
    }
  };

  const handleProductChange = (value) => {
    const product = productos.find(item => Number(item.idProducto) === Number(value));
    setDetalles(prev => {
      const next = [...prev];
      next[0] = {
        ...(next[0] || initialDetail),
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
        if (!detail.idProducto) {
          notifications.warning('Selecciona un producto para calcular la cotizacion.');
          return;
        }
        if (Number(detail.cantidad || 0) <= 0) {
          notifications.warning('La cantidad debe ser mayor a 0.');
          return;
        }
      }

      const pricedDetails = isPricing
        ? detalles.map(det => ({
          ...det,
          precioUnitario: det.precioUnitario || appliedUnitPrice || det.precioBase || 0,
          costoDiseno: det.costoDiseno || 0,
        }))
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

          {isPricing ? (
            <>
              <div className={styles.quoteSummaryCard}>
                <div className={styles.quoteSummaryItem}>
                  <span>Cliente</span>
                  <strong>{quote?.cliente?.nombre || 'Cliente sin nombre'}</strong>
                  <small>{[quote?.cliente?.correo, quote?.cliente?.telefono].filter(Boolean).join(' | ') || 'Sin contacto registrado'}</small>
                </div>
                <div className={styles.quoteSummaryItem}>
                  <span>Producto</span>
                  <strong>{detail.producto?.nombre || detail.descripcion || 'Producto sin nombre'}</strong>
                  <small>{detail.tecnica?.nombre ? `Tecnica: ${detail.tecnica.nombre}` : 'Tecnica no registrada'}</small>
                </div>
                <div className={styles.quoteSummaryItem}>
                  <span>Cantidad</span>
                  <strong>{quantity.toLocaleString('es-CO')}</strong>
                  <small>Una cotizacion corresponde a un solo producto</small>
                </div>
                <div className={styles.quoteSummaryItem}>
                  <span>Estado</span>
                  <strong>{quote?.estado || 'PENDIENTE'}</strong>
                  <small>{quote?.tipoCotizacion || 'Cotizacion'}</small>
                </div>
              </div>

              <div className={styles.pricingPanel}>
                <div className={styles.pricingPanelHeader}>
                  <div>
                    <p className={styles.detailsSectionLabel}>Calculo del precio</p>
                    <p className={styles.pricingHelpText}>
                      Los valores se toman del producto cotizable y sus rangos. Ajusta solo si necesitas sobrescribir el precio sugerido.
                    </p>
                  </div>
                  {calculando && <span className={styles.pricingBadge}>Calculando...</span>}
                </div>

                <div className={styles.pricingGrid}>
                  <div className={styles.priceMetric}>
                    <span>Precio base unitario</span>
                    <strong>{unitBase > 0 ? formatMoneyCOP(unitBase) : 'Por cotizar'}</strong>
                  </div>
                  <div className={styles.priceMetric}>
                    <span>Descuento aplicado</span>
                    <strong>{formatPercentage(discountPercent)}</strong>
                  </div>
                  <div className={styles.priceMetric}>
                    <span>Valor descontado</span>
                    <strong>{discountAmount > 0 ? `-${formatMoneyCOP(discountAmount)}` : 'Sin descuento'}</strong>
                  </div>
                  <div className={styles.priceMetric}>
                    <span>Cantidad</span>
                    <strong>{quantity.toLocaleString('es-CO')}</strong>
                  </div>
                  <div className={styles.priceMetric}>
                    <span>Subtotal bruto</span>
                    <strong>{subtotalBruto > 0 ? formatMoneyCOP(subtotalBruto) : 'Por cotizar'}</strong>
                  </div>
                  <div className={styles.priceMetric}>
                    <span>Subtotal con descuento</span>
                    <strong>{subtotalWithDiscount > 0 ? formatMoneyCOP(subtotalWithDiscount) : 'Por cotizar'}</strong>
                  </div>
                </div>

                <div className={styles.pricingInputsGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Precio unitario aplicado</label>
                    <input
                      type="number"
                      value={unitPriceInputValue}
                      onChange={event => {
                        const next = [...detalles];
                        next[0] = { ...(next[0] || initialDetail), precioUnitario: event.target.value };
                        setDetalles(next);
                      }}
                      className={styles.inputFieldStaff}
                      min="0"
                      step="0.01"
                      required
                    />
                    <span className={styles.fieldHint}>Ajuste manual si el precio sugerido necesita cambiar.</span>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Costo de diseno</label>
                    <input
                      type="number"
                      value={detail.costoDiseno || ''}
                      onChange={event => {
                        const next = [...detalles];
                        next[0] = { ...(next[0] || initialDetail), costoDiseno: event.target.value };
                        setDetalles(next);
                      }}
                      className={styles.inputFieldStaff}
                      min="0"
                      step="0.01"
                    />
                    <span className={styles.fieldHint}>Si no aplica, dejalo en cero.</span>
                  </div>

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
                </div>

                <div className={styles.quoteTotalCard}>
                  <span>Total final</span>
                  <strong>{finalTotal > 0 ? formatMoneyCOP(finalTotal) : 'Por cotizar'}</strong>
                  <small>Este sera el valor enviado al cliente para aprobacion.</small>
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

              <div className={styles.observationsGrid}>
                <div className={styles.readOnlyNote}>
                  <span>Observaciones del cliente</span>
                  <p>{quote?.observaciones || detail.observaciones || 'El cliente no dejo observaciones.'}</p>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Observaciones internas del administrador</label>
                  <textarea
                    value={observaciones}
                    onChange={event => setObservaciones(event.target.value)}
                    className={styles.inputField}
                    rows={3}
                    placeholder="Notas internas, condiciones o aclaraciones para esta cotizacion..."
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Observaciones generales</label>
                <textarea
                  value={observaciones}
                  onChange={event => setObservaciones(event.target.value)}
                  className={styles.inputField}
                  rows={2}
                  placeholder="Entrega, urgencia, empaque u otra aclaracion..."
                />
              </div>

              <div>
                <p className={styles.detailsSectionLabel}>Producto a cotizar</p>

                <div className={styles.detailRowsWrapper}>
                <div className={styles.quoteProductBlock}>
                  <div className={styles.quoteProductGrid}>
                    {categorias.length > 0 && (
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Categoria</label>
                        <select
                          value={detail.idCategoriaProducto || ''}
                          onChange={event => handleCategoryChange(event.target.value)}
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
                      ) : tecnicas.length === 0 ? (
                        <p className={styles.inlineErrorText}>No hay tecnicas activas disponibles.</p>
                      ) : (
                        <select
                          value={detail.idTecnica || ''}
                          onChange={event => updateDetail('idTecnica', event.target.value)}
                          className={styles.selectField}
                          required
                        >
                          <option value="">Seleccione una tecnica</option>
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
                      ) : productos.length === 0 ? (
                        <p className={styles.inlineErrorText}>No hay productos activos disponibles.</p>
                      ) : (
                        <select
                          value={detail.idProducto || ''}
                          onChange={event => handleProductChange(event.target.value)}
                          className={styles.selectField}
                          required
                        >
                          <option value="">Seleccione un producto</option>
                          {productos.map(product => (
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
                        placeholder="Cant."
                        value={detail.cantidad || 1}
                        onChange={event => updateDetail('cantidad', event.target.value)}
                        className={styles.detailRowInputSm}
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Detalle opcional: color, talla o ubicacion del estampado"
                    value={detail.observaciones || ''}
                    onChange={event => updateDetail('observaciones', event.target.value)}
                    className={styles.detailRowInputFlex}
                  />

                  <div className={styles.quoteEstimateBox}>
                    <div>
                      <span className={styles.quoteEstimateLabel}>Total estimado</span>
                      <strong className={styles.quoteEstimateValue}>
                        {formatMoneyCOP(calculo?.total ?? 0)}
                      </strong>
                    </div>
                    <span className={styles.quoteEstimateText}>
                      {calculando ? 'Calculando con precios reales...' : 'Este valor se confirmara al cotizar.'}
                    </span>
                  </div>
                </div>
                </div>

                <p className={styles.infoNote}>
                  Cada cotizacion corresponde a un solo producto. Para otro articulo, crea una nueva cotizacion.
                </p>
              </div>
            </>
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
