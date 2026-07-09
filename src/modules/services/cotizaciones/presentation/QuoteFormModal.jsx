import { useEffect, useState } from 'react';
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

export const QuoteFormModal = ({ isOpen, onClose, onSubmit, quote, isStaff }) => {
  const [observaciones, setObservaciones] = useState('');
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

  const isEditing = !!quote;
  const isPricing = isStaff && isEditing;
  const detail = detalles[0] || initialDetail;

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
      setCostosAdicionales(quote.costosAdicionales || 0);
      setCliente({
        nombre: quote.cliente?.nombre || '',
        correo: quote.cliente?.correo || '',
        telefono: quote.cliente?.telefono || '',
      });
      setDetalles(quote.detalles || []);
    } else {
      setObservaciones('');
      setCostosAdicionales(0);
      setCliente({ nombre: '', correo: '', telefono: '' });
      setCalculo(null);
      setDetalles([{ ...initialDetail }]);
    }
  }, [quote, isOpen]);

  useEffect(() => {
    if (!isOpen || isPricing) return;

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
  }, [isOpen, isPricing, detail.idProducto, detail.cantidad]);

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

    try {
      if (isStaff && !isEditing) {
        if (!cliente.nombre.trim()) {
          notifications.warning('El nombre del cliente es obligatorio.');
          return;
        }
        if (!cliente.correo.trim() && !cliente.telefono.trim()) {
          notifications.warning('Ingresa correo o telefono del cliente.');
          return;
        }
        if (cliente.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.correo.trim())) {
          notifications.warning('Ingresa un correo valido para el cliente.');
          return;
        }
      }

      const payload = {
        observaciones: observaciones.trim() || null,
        detalles,
        ...(isPricing && { costosAdicionales: Number(costosAdicionales || 0) }),
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
  };

  const modalTitle = isPricing
    ? `Asignar valores - Cotizacion #${quote?.idCotizacion}`
    : isEditing
      ? 'Editar solicitud'
      : 'Nueva solicitud de cotizacion';

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalSm}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{modalTitle}</h3>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn}>x</button>
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
                />
              </div>
            </div>
          )}

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

          {isPricing && (
            <div className={styles.inputGroup} style={{ maxWidth: '200px' }}>
              <label className={styles.inputLabel}>Costos adicionales ($)</label>
              <input
                type="number"
                value={costosAdicionales}
                onChange={event => setCostosAdicionales(event.target.value)}
                className={styles.inputFieldStaff}
                min="0"
              />
            </div>
          )}

          <div>
            <p className={styles.detailsSectionLabel}>
              {isPricing ? 'Valores del producto' : 'Producto a cotizar'}
            </p>

            <div className={styles.detailRowsWrapper}>
              {!isPricing ? (
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
                        ${Number(calculo?.total || 0).toLocaleString('es-CO')}
                      </strong>
                    </div>
                    <span className={styles.quoteEstimateText}>
                      {calculando ? 'Calculando con precios reales...' : 'Este valor se confirmara al cotizar.'}
                    </span>
                  </div>
                </div>
              ) : (
                detalles.map((det, index) => (
                  <div key={det.idDetalleCotizacion || index} className={styles.detailRow}>
                    <input
                      type="text"
                      placeholder="Descripcion de la prenda o articulo"
                      value={det.descripcion || ''}
                      className={styles.detailRowInputFlex}
                      disabled
                      required
                    />
                    <input
                      type="number"
                      placeholder="Cant."
                      value={det.cantidad || 1}
                      className={styles.detailRowInputSm}
                      min="1"
                      disabled
                      required
                    />
                    <input
                      type="number"
                      placeholder="$ Unitario"
                      value={det.precioUnitario || ''}
                      onChange={event => {
                        const next = [...detalles];
                        next[index] = { ...next[index], precioUnitario: event.target.value };
                        setDetalles(next);
                      }}
                      className={styles.detailRowInputStaff}
                      min="0"
                      required
                    />
                    <input
                      type="number"
                      placeholder="$ Diseno"
                      value={det.costoDiseno || ''}
                      onChange={event => {
                        const next = [...detalles];
                        next[index] = { ...next[index], costoDiseno: event.target.value };
                        setDetalles(next);
                      }}
                      className={styles.detailRowInputStaff}
                      min="0"
                    />
                  </div>
                ))
              )}
            </div>

            <p className={styles.infoNote}>
              Cada cotizacion corresponde a un solo producto. Para otro articulo, crea una nueva cotizacion.
            </p>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary}>
              {isPricing ? 'Enviar precios' : 'Procesar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
