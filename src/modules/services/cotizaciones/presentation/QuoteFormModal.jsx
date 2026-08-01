import { useEffect, useMemo, useState } from 'react';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { useDebounce } from '../../../../core/hooks/useDebounce';
import { notifications } from '../../../../core/utils/notifications';
import { publicQuoteRepository } from '../../../landing/infrastructure/publicQuote.repository';
import { StampTariffSelector } from '../../../landing/components/StampTariffSelector';
import { getStampSizeSummary } from '../../../landing/domain/stampTariffs';
import { clientRepository } from '../../../users/infrastructure/client.repository';
import styles from './quotes.module.css';

const LOCATION_OPTIONS = [
  ['FRENTE', 'Frente'],
  ['ESPALDA', 'Espalda'],
  ['MANGA_DERECHA', 'Manga derecha'],
  ['MANGA_IZQUIERDA', 'Manga izquierda'],
  ['PECHO', 'Pecho'],
  ['OTRO', 'Otra ubicacion'],
];

const DESIGN_OPTIONS = [
  ['CLIENTE', 'El cliente aporta el diseno'],
  ['PIXEL', 'PIXEL crea el diseno'],
  ['PENDIENTE_DEFINIR', 'Se definira despues'],
  ['NO_REQUIERE', 'No requiere diseno'],
];

const STEPS = [
  { id: 1, label: 'Cliente' },
  { id: 2, label: 'Productos y estampados' },
  { id: 3, label: 'Revision' },
];

let localSequence = 0;
const localId = (prefix) => `${prefix}-${Date.now()}-${localSequence += 1}`;

const createStamp = (source = {}) => ({
  localId: localId('stamp'),
  idDetalleEstampadoCotizacion: source.idDetalleEstampadoCotizacion,
  idTecnica: source.idTecnica || source.tecnica?.idTecnica || '',
  idTarifaTecnica: source.idTarifaTecnica ?? null,
  nombreTarifa: source.tarifaTecnica?.nombre || source.tarifa?.nombre || source.nombreTarifa || '',
  tarifaEsGeneral: Boolean(
    source.tarifaTecnica?.esGeneral || source.tarifa?.esGeneral || source.tarifaEsGeneral
  ),
  ubicacion: source.ubicacion || 'FRENTE',
  anchoCm: source.anchoCm ?? '',
  altoCm: source.altoCm ?? '',
  origenDiseno: source.origenDiseno || 'PENDIENTE_DEFINIR',
  grupoDisenoCompartido: source.grupoDisenoCompartido || '',
  descripcion: source.descripcion || '',
  observaciones: source.observaciones || '',
  tecnica: source.tecnica || null,
});

const createItem = (source = {}) => {
  const legacyStamp = source.idTecnica
    ? createStamp({
        idTecnica: source.idTecnica,
        tecnica: source.tecnica,
        origenDiseno: source.origenDiseno,
      })
    : null;
  const stamps = Array.isArray(source.estampados) && source.estampados.length > 0
    ? source.estampados.map(createStamp)
    : [legacyStamp || createStamp()];

  return {
    localId: localId('item'),
    idDetalleCotizacion: source.idDetalleCotizacion,
    tipoProducto: source.tipoProducto || (source.idProducto ? 'CATALOGO' : 'OTRO'),
    idCategoriaProducto: source.idCategoriaProducto
      || source.producto?.idCategoriaProducto
      || source.producto?.categoriaProducto?.idCategoriaProducto
      || '',
    idProducto: source.idProducto || source.producto?.idProducto || '',
    nombrePersonalizado: source.nombrePersonalizado || (!source.idProducto ? source.descripcion : '') || '',
    descripcionPersonalizada: source.descripcionPersonalizada || '',
    materialReferencia: source.materialReferencia || '',
    cantidad: source.cantidad || 1,
    suministradoPor: source.suministradoPor || 'PIXEL',
    observaciones: source.observaciones || '',
    producto: source.producto || null,
    estampados: stamps,
  };
};

const getItemName = (item, products) => {
  if (item.tipoProducto === 'OTRO') {
    return item.nombrePersonalizado.trim() || 'Falta indicar el producto';
  }
  return products.find((product) => Number(product.idProducto) === Number(item.idProducto))?.nombre
    || item.producto?.nombre
    || 'Falta seleccionar producto';
};

const getSharedDesignGroups = (items = []) => (
  [...new Set(
    items.flatMap((item) => item.estampados || [])
      .map((stamp) => String(stamp.grupoDisenoCompartido || '').trim())
      .filter(Boolean),
  )]
);

const nextSharedDesignGroup = (items = []) => {
  const groups = new Set(getSharedDesignGroups(items));
  let number = 1;
  while (groups.has(`GRUPO-DISENO-${number}`)) number += 1;
  return `GRUPO-DISENO-${number}`;
};

const getStampSummary = (stamp, techniques) => {
  const technique = techniques.find(
    (item) => Number(item.idTecnica) === Number(stamp.idTecnica),
  )?.nombre || 'Servicio por definir';
  const location = LOCATION_OPTIONS.find(([value]) => value === stamp.ubicacion)?.[1]
    || stamp.ubicacion
    || 'Ubicacion por definir';
  return `${technique} · ${location} · ${getStampSizeSummary(stamp)}`;
};

const validateItem = (item, index) => {
  const number = index + 1;
  if (item.tipoProducto === 'CATALOGO' && !item.idProducto) {
    return `Selecciona el producto ${number}.`;
  }
  if (item.tipoProducto === 'OTRO' && !item.nombrePersonalizado.trim()) {
    return `Escribe el nombre del producto ${number}.`;
  }
  if (!Number.isInteger(Number(item.cantidad)) || Number(item.cantidad) <= 0) {
    return `La cantidad del producto ${number} debe ser un entero mayor a 0.`;
  }
  if (
    item.tipoProducto !== 'OTRO'
    && (!Array.isArray(item.estampados) || item.estampados.length === 0)
  ) {
    return `Agrega al menos un estampado al producto ${number}.`;
  }

  for (let stampIndex = 0; stampIndex < item.estampados.length; stampIndex += 1) {
    const stamp = item.estampados[stampIndex];
    const hasWidth = stamp.anchoCm !== '' && stamp.anchoCm != null;
    const hasHeight = stamp.altoCm !== '' && stamp.altoCm != null;
    if (hasWidth !== hasHeight) {
      return `Completa ancho y alto juntos en el estampado ${stampIndex + 1}.`;
    }
    if (
      (hasWidth && (Number(stamp.anchoCm) <= 0 || Number(stamp.anchoCm) > 500))
      || (hasHeight && (Number(stamp.altoCm) <= 0 || Number(stamp.altoCm) > 500))
    ) {
      return 'Las medidas deben ser mayores a 0 y maximo 500 cm.';
    }
  }
  return null;
};

export const QuoteFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  quote,
  isStaff,
}) => {
  const isEditing = Boolean(quote);
  const [cliente, setCliente] = useState(() => ({
    nombre: quote?.cliente?.nombre || '',
    correo: quote?.cliente?.correo || '',
    telefono: quote?.cliente?.telefono || '',
  }));
  const [clientMode, setClientMode] = useState('NEW');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const debouncedClientSearch = useDebounce(clientSearch, 350);
  const [observaciones, setObservaciones] = useState(() => quote?.observaciones || '');
  const [items, setItems] = useState(() => (
    quote?.detalles?.length ? quote.detalles.map(createItem) : [createItem()]
  ));
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [activeStampId, setActiveStampId] = useState(() => items[0]?.estampados?.[0]?.localId || null);
  const [step, setStep] = useState(isEditing ? 2 : 1);
  const [catalogs, setCatalogs] = useState({ categories: [], products: [], techniques: [] });
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();

  useEffect(() => {
    if (!isOpen) return undefined;
    const controller = new AbortController();
    Promise.all([
      publicQuoteRepository.listCategories({ signal: controller.signal }),
      publicQuoteRepository.listProducts({ signal: controller.signal }),
      publicQuoteRepository.listTechniques({ signal: controller.signal }),
    ])
      .then(([categories, products, techniques]) => {
        if (controller.signal.aborted) return;
        setCatalogs({
          categories: categories || [],
          products: products || [],
          techniques: (techniques || []).filter((technique) => technique.estado !== false),
        });
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.code === 'ERR_CANCELED') return;
        notifications.error(error.message || 'No se pudo cargar el catalogo para cotizar.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingCatalogs(false);
      });
    return () => controller.abort();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isStaff || isEditing || clientMode !== 'EXISTING') return undefined;
    const controller = new AbortController();
    clientRepository.list({
      page: 1,
      limit: 8,
      search: debouncedClientSearch,
      sortBy: 'nombre',
      order: 'asc',
    }, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setClientResults(result.items || []);
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.code === 'ERR_CANCELED') return;
        setClientResults([]);
        notifications.error(error.message || 'No se pudieron buscar los clientes.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingClients(false);
      });
    return () => controller.abort();
  }, [clientMode, debouncedClientSearch, isEditing, isOpen, isStaff]);

  const completeItems = useMemo(
    () => items.filter((item, index) => !validateItem(item, index)).length,
    [items],
  );
  if (!isOpen) return null;

  const updateClient = (field, value) => {
    setCliente((current) => ({ ...current, [field]: value }));
  };

  const chooseClient = (client) => {
    setSelectedClient(client);
    setCliente({
      nombre: client.nombre || '',
      correo: client.correo || '',
      telefono: client.telefono || '',
    });
  };

  const changeClientMode = (mode) => {
    setClientMode(mode);
    setSelectedClient(null);
    setClientSearch('');
    setClientResults([]);
    setLoadingClients(mode === 'EXISTING');
    if (mode === 'NEW') {
      setCliente({ nombre: '', correo: '', telefono: '' });
    }
  };

  const updateItem = (index, field, value) => {
    setItems((current) => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      if (field === 'tipoProducto') {
        return {
          ...item,
          tipoProducto: value,
          idProducto: '',
          idCategoriaProducto: '',
          nombrePersonalizado: '',
        };
      }
      if (field === 'idCategoriaProducto') {
        return { ...item, idCategoriaProducto: value, idProducto: '' };
      }
      return { ...item, [field]: value };
    }));
  };

  const updateStamp = (itemIndex, stampId, field, value) => {
    setItems((current) => current.map((item, index) => (
      index === itemIndex
        ? {
            ...item,
            estampados: item.estampados.map((stamp) => (
              stamp.localId === stampId
                ? {
                    ...stamp,
                    [field]: value,
                    ...(field === 'idTecnica'
                      ? {
                          idTarifaTecnica: null,
                          nombreTarifa: '',
                          tarifaEsGeneral: false,
                          anchoCm: null,
                          altoCm: null,
                        }
                      : {}),
                  }
                : stamp
            )),
          }
        : item
    )));
  };

  const patchStamp = (itemIndex, stampId, patch) => {
    setItems((current) => current.map((item, index) => (
      index === itemIndex
        ? {
            ...item,
            estampados: item.estampados.map((stamp) => (
              stamp.localId === stampId ? { ...stamp, ...patch } : stamp
            )),
          }
        : item
    )));
  };

  const shareDesignWithStamp = (itemIndex, stampId, targetStampId) => {
    setItems((current) => {
      if (!targetStampId) {
        return current.map((item, index) => (index === itemIndex
          ? {
              ...item,
              estampados: item.estampados.map((stamp) => (
                stamp.localId === stampId ? { ...stamp, grupoDisenoCompartido: '' } : stamp
              )),
            }
          : item));
      }

      const targetStamp = current.flatMap((item) => item.estampados)
        .find((stamp) => stamp.localId === targetStampId);
      const group = targetStamp?.grupoDisenoCompartido || nextSharedDesignGroup(current);
      return current.map((item) => ({
        ...item,
        estampados: item.estampados.map((stamp) => (
          stamp.localId === stampId || stamp.localId === targetStampId
            ? { ...stamp, grupoDisenoCompartido: group }
            : stamp
        )),
      }));
    });
  };

  const applyOneDesignForProduct = (itemIndex, enabled) => {
    setItems((current) => {
      const group = enabled ? nextSharedDesignGroup(current) : '';
      return current.map((item, index) => index === itemIndex
        ? {
            ...item,
            estampados: item.estampados.map((stamp) => ({
              ...stamp,
              grupoDisenoCompartido: group,
            })),
          }
        : item);
    });
  };

  const addItem = () => {
    const nextIndex = items.length;
    const item = createItem();
    setItems((current) => [...current, item]);
    setActiveItemIndex(nextIndex);
    setActiveStampId(item.estampados[0]?.localId || null);
  };

  const duplicateItem = (index) => {
    const copy = createItem({
      ...items[index],
      idDetalleCotizacion: undefined,
      estampados: items[index].estampados.map((stamp) => ({
        ...stamp,
        idDetalleEstampadoCotizacion: undefined,
        grupoDisenoCompartido: '',
      })),
    });
    setItems((current) => [...current, copy]);
    setActiveItemIndex(items.length);
    setActiveStampId(copy.estampados[0]?.localId || null);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setActiveItemIndex((current) => Math.max(0, Math.min(current >= index ? current - 1 : current, items.length - 2)));
  };

  const addStamp = (itemIndex) => {
    const stamp = createStamp();
    setItems((current) => current.map((item, index) => (
      index === itemIndex
        ? { ...item, estampados: [...item.estampados, stamp] }
        : item
    )));
    setActiveStampId(stamp.localId);
  };

  const duplicateStamp = (itemIndex, stampId) => {
    const source = items[itemIndex].estampados.find((stamp) => stamp.localId === stampId);
    if (!source) return;
    const copy = createStamp({ ...source, grupoDisenoCompartido: '' });
    setItems((current) => current.map((item, index) => index === itemIndex
      ? { ...item, estampados: [...item.estampados, copy] }
      : item));
    setActiveStampId(copy.localId);
  };

  const removeStamp = (itemIndex, stampId) => {
    setItems((current) => current.map((item, index) => (
      index === itemIndex && (item.estampados.length > 1 || item.tipoProducto === 'OTRO')
        ? { ...item, estampados: item.estampados.filter((stamp) => stamp.localId !== stampId) }
        : item
    )));
    if (activeStampId === stampId) setActiveStampId(null);
  };

  const validateClient = () => {
    if (!isStaff || isEditing) return null;
    if (clientMode === 'EXISTING') {
      return selectedClient ? null : 'Selecciona un cliente existente.';
    }
    if (cliente.nombre.trim().length < 2) return 'El nombre completo del cliente es obligatorio.';
    if (!/^\d{10}$/.test(cliente.telefono.trim())) return 'El telefono debe tener exactamente 10 digitos.';
    if (cliente.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.correo.trim())) {
      return 'Ingresa un correo valido.';
    }
    return null;
  };

  const validateProducts = () => {
    if (items.length === 0) return { message: 'Agrega al menos un producto.', index: 0 };
    for (let index = 0; index < items.length; index += 1) {
      const message = validateItem(items[index], index);
      if (message) return { message, index };
    }
    return null;
  };

  const goToNextStep = () => {
    if (step === 1) {
      const error = validateClient();
      if (error) {
        notifications.warning(error);
        return;
      }
      setStep(2);
      return;
    }
    const error = validateProducts();
    if (error) {
      setActiveItemIndex(error.index);
      setStep(2);
      notifications.warning(error.message);
      return;
    }
    setStep(3);
  };

  const submit = async (event) => {
    event.preventDefault();
    await runLocked(async () => {
      const clientError = validateClient();
      if (clientError) {
        setStep(1);
        notifications.warning(clientError);
        return;
      }
      const productsError = validateProducts();
      if (productsError) {
        setActiveItemIndex(productsError.index);
        setStep(2);
        notifications.warning(productsError.message);
        return;
      }

      try {
        await onSubmit({
          observaciones: observaciones.trim() || null,
          items,
          ...(isStaff && !isEditing
            ? selectedClient
              ? { idCliente: selectedClient.idCliente }
              : {
                cliente: {
                  nombre: cliente.nombre.trim(),
                  correo: cliente.correo.trim().toLowerCase() || null,
                  telefono: cliente.telefono.trim(),
                },
              }
            : {}),
        });
      } catch (error) {
        notifications.error(error.message || 'No se pudo guardar la solicitud.');
      }
    });
  };

  return (
    <div className={styles.overlay}>
      <section className={`${styles.modalContainer} ${styles.quoteRequestModal}`} role="dialog" aria-modal="true">
        <header className={styles.modalHeader}>
          <div>
            <span className={styles.breadcrumb}>{isEditing ? 'Editar solicitud' : 'Cotizacion presencial'}</span>
            <h3 className={styles.modalTitle}>
              {isEditing ? `Editar cotizacion #${quote.idCotizacion}` : 'Nueva solicitud de cotizacion'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn} disabled={isSubmitting} aria-label="Cerrar">x</button>
        </header>

        <nav className={styles.quoteRequestSteps} aria-label="Pasos de la solicitud">
          {STEPS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={step === item.id ? styles.quoteRequestStepActive : ''}
              onClick={() => item.id < step && !(isEditing && item.id === 1) && setStep(item.id)}
              disabled={item.id > step || isSubmitting || (isEditing && item.id === 1)}
              aria-current={step === item.id ? 'step' : undefined}
            >
              <span>{item.id}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <form onSubmit={submit} className={styles.quoteRequestForm}>
          <div className={styles.quoteRequestBody}>
            {step === 1 && isStaff && !isEditing && (
              <section className={styles.quoteRequestSection}>
                <div className={styles.quoteRequestSectionTitle}>
                  <span>Cliente</span>
                  <strong>Selecciona un cliente o registra una atencion presencial</strong>
                </div>
                <div className={styles.quoteClientMode}>
                  <button type="button" className={clientMode === 'EXISTING' ? styles.quoteTypeActive : ''} onClick={() => changeClientMode('EXISTING')}>
                    Buscar cliente existente
                  </button>
                  <button type="button" className={clientMode === 'NEW' ? styles.quoteTypeActive : ''} onClick={() => changeClientMode('NEW')}>
                    Registrar cotizacion sin acceso al portal
                  </button>
                </div>

                {clientMode === 'EXISTING' ? (
                  <div className={styles.quoteClientSearchPanel}>
                    <label className={styles.inputGroup}>
                      <span className={styles.inputLabel}>Buscar por nombre, documento, correo o telefono</span>
                      <input
                        type="search"
                        value={clientSearch}
                        onChange={(event) => {
                          setClientSearch(event.target.value);
                          setLoadingClients(true);
                        }}
                        className={styles.inputField}
                        placeholder="Buscar cliente..."
                      />
                    </label>
                    <div className={styles.quoteClientResults}>
                      {loadingClients && <p>Buscando clientes...</p>}
                      {!loadingClients && clientResults.map((client) => (
                        <button
                          type="button"
                          key={client.idCliente}
                          className={selectedClient?.idCliente === client.idCliente ? styles.quoteClientSelected : ''}
                          onClick={() => chooseClient(client)}
                        >
                          <strong>{client.nombre}</strong>
                          <span>{[client.documento, client.telefono, client.correo].filter(Boolean).join(' - ')}</span>
                        </button>
                      ))}
                      {!loadingClients && clientResults.length === 0 && <p>No encontramos clientes con esta busqueda.</p>}
                    </div>
                    {selectedClient && (
                      <div className={styles.quoteSelectedClient}>
                        <span>Cliente seleccionado</span>
                        <strong>{selectedClient.nombre}</strong>
                        <small>{[selectedClient.telefono, selectedClient.correo].filter(Boolean).join(' - ')}</small>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className={styles.quoteClientGrid}>
                      <label className={`${styles.inputGroup} ${styles.quoteClientName}`}>
                        <span className={styles.inputLabel}>Nombre completo *</span>
                        <input value={cliente.nombre} onChange={(event) => updateClient('nombre', event.target.value)} className={styles.inputField} maxLength={150} />
                      </label>
                      <label className={styles.inputGroup}>
                        <span className={styles.inputLabel}>Correo opcional</span>
                        <input type="email" value={cliente.correo} onChange={(event) => updateClient('correo', event.target.value)} className={styles.inputField} />
                      </label>
                      <label className={styles.inputGroup}>
                        <span className={styles.inputLabel}>Telefono *</span>
                        <input type="tel" value={cliente.telefono} onChange={(event) => updateClient('telefono', event.target.value.replace(/\D/g, '').slice(0, 10))} className={styles.inputField} maxLength={10} inputMode="numeric" />
                      </label>
                    </div>
                    <p className={styles.quoteCompatibilityNotice}>No se creara un Usuario ni se solicitara contrasena para registrar esta cotizacion.</p>
                  </>
                )}
              </section>
            )}

            {step === 2 && (
            <>
            <section className={styles.quoteRequestSection}>
              <div className={styles.quoteRequestProductsHeader}>
                <div className={styles.quoteRequestSectionTitle}>
                  <span>Productos</span>
                  <strong>{items.length} producto(s) - {completeItems} completo(s)</strong>
                </div>
                <button type="button" className={styles.btnSecondary} onClick={addItem} disabled={isSubmitting}>
                  Agregar otro producto
                </button>
              </div>

              <div className={styles.quoteRequestItems}>
                {items.map((item, itemIndex) => {
                  const isOpen = activeItemIndex === itemIndex;
                  const error = validateItem(item, itemIndex);
                  const availableProducts = item.idCategoriaProducto
                    ? catalogs.products.filter((product) => (
                        Number(product.idCategoriaProducto || product.categoriaProducto?.idCategoriaProducto)
                        === Number(item.idCategoriaProducto)
                      ))
                    : catalogs.products;

                  return (
                    <article className={`${styles.quoteRequestItem} ${error ? styles.quoteProductIncomplete : ''}`} key={item.localId}>
                      <div className={styles.quoteRequestItemHeader}>
                        <button type="button" onClick={() => setActiveItemIndex(itemIndex)} className={styles.quoteItemSummaryButton}>
                          <strong>Producto {itemIndex + 1}: {getItemName(item, catalogs.products)}</strong>
                          <small>
                            Cant. {Number(item.cantidad || 0).toLocaleString('es-CO')} - {item.estampados.length} estampado(s)
                          </small>
                        </button>
                        <span className={`${styles.quoteItemStatus} ${error ? styles.quoteItemStatusPending : styles.quoteItemStatusComplete}`}>
                          {error ? 'Falta informacion' : 'Completo'}
                        </span>
                        <button type="button" className={styles.quoteItemTinyBtn} onClick={() => setActiveItemIndex(itemIndex)}>
                          {isOpen ? 'Editando' : 'Editar'}
                        </button>
                        <button type="button" className={styles.quoteItemTinyBtn} onClick={() => duplicateItem(itemIndex)}>
                          Duplicar
                        </button>
                        {items.length > 1 && (
                          <button type="button" className={styles.quoteItemTinyBtnDanger} onClick={() => removeItem(itemIndex)}>
                            Quitar
                          </button>
                        )}
                      </div>

                      {isOpen && (
                        <div className={styles.quoteRequestItemBody}>
                          <div className={styles.quoteProductTypeControl}>
                            <button
                              type="button"
                              className={item.tipoProducto === 'CATALOGO' ? styles.quoteTypeActive : ''}
                              onClick={() => updateItem(itemIndex, 'tipoProducto', 'CATALOGO')}
                            >
                              Producto del catalogo
                            </button>
                            <button
                              type="button"
                              className={item.tipoProducto === 'OTRO' ? styles.quoteTypeActive : ''}
                              onClick={() => updateItem(itemIndex, 'tipoProducto', 'OTRO')}
                            >
                              Otro producto
                            </button>
                          </div>

                          {item.tipoProducto === 'CATALOGO' ? (
                            <div className={styles.quoteRequestGrid}>
                              <label className={styles.inputGroup}>
                                <span className={styles.inputLabel}>Categoria</span>
                                <select
                                  value={item.idCategoriaProducto}
                                  onChange={(event) => updateItem(itemIndex, 'idCategoriaProducto', event.target.value)}
                                  className={styles.selectField}
                                  disabled={loadingCatalogs}
                                >
                                  <option value="">Todas las categorias</option>
                                  {catalogs.categories.map((category) => (
                                    <option key={category.idCategoriaProducto} value={category.idCategoriaProducto}>{category.nombre}</option>
                                  ))}
                                </select>
                              </label>
                              <label className={styles.inputGroup}>
                                <span className={styles.inputLabel}>Producto *</span>
                                <select
                                  value={item.idProducto}
                                  onChange={(event) => updateItem(itemIndex, 'idProducto', event.target.value)}
                                  className={styles.selectField}
                                  disabled={loadingCatalogs}
                                >
                                  <option value="">Selecciona un producto</option>
                                  {availableProducts.map((product) => (
                                    <option key={product.idProducto} value={product.idProducto}>{product.nombre}</option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          ) : (
                            <div className={styles.quoteRequestGrid}>
                              <label className={styles.inputGroup}>
                                <span className={styles.inputLabel}>Nombre del producto *</span>
                                <input
                                  value={item.nombrePersonalizado}
                                  onChange={(event) => updateItem(itemIndex, 'nombrePersonalizado', event.target.value)}
                                  className={styles.inputField}
                                  maxLength={150}
                                  placeholder="Ej: Chaqueta impermeable"
                                />
                              </label>
                              <label className={styles.inputGroup}>
                                <span className={styles.inputLabel}>Material o referencia</span>
                                <input
                                  value={item.materialReferencia}
                                  onChange={(event) => updateItem(itemIndex, 'materialReferencia', event.target.value)}
                                  className={styles.inputField}
                                  maxLength={255}
                                />
                              </label>
                              <label className={`${styles.inputGroup} ${styles.quoteRequestWide}`}>
                                <span className={styles.inputLabel}>Descripcion</span>
                                <textarea
                                  value={item.descripcionPersonalizada}
                                  onChange={(event) => updateItem(itemIndex, 'descripcionPersonalizada', event.target.value)}
                                  className={styles.inputField}
                                  maxLength={500}
                                  rows={2}
                                />
                              </label>
                              <p className={styles.quoteCompatibilityNotice}>
                                PIXEL revisara la compatibilidad del producto antes de enviar la propuesta final.
                              </p>
                            </div>
                          )}

                          <div className={styles.quoteRequestGrid}>
                            <label className={styles.inputGroup}>
                              <span className={styles.inputLabel}>Cantidad *</span>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={item.cantidad}
                                onChange={(event) => updateItem(itemIndex, 'cantidad', event.target.value)}
                                className={styles.inputField}
                              />
                            </label>
                            <label className={styles.inputGroup}>
                              <span className={styles.inputLabel}>Quien suministra el producto *</span>
                              <select
                                value={item.suministradoPor}
                                onChange={(event) => updateItem(itemIndex, 'suministradoPor', event.target.value)}
                                className={styles.selectField}
                              >
                                <option value="PIXEL">PIXEL</option>
                                <option value="CLIENTE">Cliente</option>
                              </select>
                            </label>
                            <label className={`${styles.inputGroup} ${styles.quoteRequestWide}`}>
                              <span className={styles.inputLabel}>Observaciones del producto</span>
                              <input
                                value={item.observaciones}
                                onChange={(event) => updateItem(itemIndex, 'observaciones', event.target.value)}
                                className={styles.inputField}
                                maxLength={255}
                                placeholder="Color, talla u otra aclaracion"
                              />
                            </label>
                          </div>

                          <div className={styles.quoteStampsEditorHeader}>
                            <div>
                              <span>Servicios de estampacion</span>
                              <strong>{item.estampados.length} configurado(s)</strong>
                            </div>
                            <button type="button" className={styles.btnSecondary} onClick={() => addStamp(itemIndex)}>
                              Agregar estampado
                            </button>
                          </div>

                          {item.estampados.length > 1 && (
                            <label className={styles.quoteUseOneDesign}>
                              <input
                                type="checkbox"
                                checked={item.estampados.every((stamp) => (
                                  stamp.grupoDisenoCompartido
                                  && stamp.grupoDisenoCompartido === item.estampados[0].grupoDisenoCompartido
                                ))}
                                onChange={(event) => applyOneDesignForProduct(itemIndex, event.target.checked)}
                              />
                              Usar el mismo diseno en todos los estampados de este producto
                            </label>
                          )}

                          <div className={styles.quoteStampsEditor}>
                            {item.estampados.map((stamp, stampIndex) => {
                              const isStampOpen = activeStampId === stamp.localId;
                              const selectedTechnique = catalogs.techniques.find(
                                (technique) => Number(technique.idTecnica) === Number(stamp.idTecnica),
                              );
                              const sharedTarget = items.flatMap((sourceItem) => sourceItem.estampados)
                                .find((candidate) => (
                                  candidate.localId !== stamp.localId
                                  && candidate.grupoDisenoCompartido
                                  && candidate.grupoDisenoCompartido === stamp.grupoDisenoCompartido
                                ));
                              const availableDesigns = items.flatMap((sourceItem, sourceItemIndex) => (
                                sourceItem.estampados.map((candidate, candidateIndex) => ({
                                  ...candidate,
                                  itemIndex: sourceItemIndex,
                                  stampIndex: candidateIndex,
                                }))
                              )).filter((candidate) => candidate.localId !== stamp.localId);
                              return (
                              <section key={stamp.localId} className={styles.quoteStampEditor}>
                                <header>
                                  <button type="button" className={styles.quoteStampSummary} onClick={() => setActiveStampId(isStampOpen ? null : stamp.localId)}>
                                    <strong>Estampado {stampIndex + 1}</strong>
                                    <small>{getStampSummary(stamp, catalogs.techniques)}</small>
                                  </button>
                                  <div>
                                    <button type="button" onClick={() => duplicateStamp(itemIndex, stamp.localId)}>Duplicar</button>
                                    {(item.estampados.length > 1 || item.tipoProducto === 'OTRO') && (
                                      <button type="button" onClick={() => removeStamp(itemIndex, stamp.localId)}>Quitar</button>
                                    )}
                                  </div>
                                </header>
                                {isStampOpen && (
                                <div className={styles.quoteRequestGrid}>
                                  <label className={styles.inputGroup}>
                                    <span className={styles.inputLabel}>Servicio o tecnica</span>
                                    <select
                                      value={stamp.idTecnica}
                                      onChange={(event) => updateStamp(itemIndex, stamp.localId, 'idTecnica', event.target.value)}
                                      className={styles.selectField}
                                      disabled={loadingCatalogs}
                                    >
                                      <option value="">No se ha definido el servicio</option>
                                      {catalogs.techniques.map((technique) => (
                                        <option key={technique.idTecnica} value={technique.idTecnica}>{technique.nombre}</option>
                                      ))}
                                    </select>
                                  </label>
                                  <label className={styles.inputGroup}>
                                    <span className={styles.inputLabel}>Ubicacion</span>
                                    <select
                                      value={stamp.ubicacion}
                                      onChange={(event) => updateStamp(itemIndex, stamp.localId, 'ubicacion', event.target.value)}
                                      className={styles.selectField}
                                    >
                                      {LOCATION_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                    </select>
                                  </label>
                                  <StampTariffSelector
                                    stamp={stamp}
                                    technique={selectedTechnique}
                                    onPatch={(patch) => patchStamp(itemIndex, stamp.localId, patch)}
                                    disabled={loadingCatalogs || isSubmitting}
                                    labelClassName={styles.inputGroup}
                                    selectClassName={styles.selectField}
                                    wideClassName={styles.quoteRequestWide}
                                    messageClassName={styles.quoteCompatibilityNotice}
                                  />
                                  <label className={styles.inputGroup}>
                                    <span className={styles.inputLabel}>Origen del diseno</span>
                                    <select
                                      value={stamp.origenDiseno}
                                      onChange={(event) => updateStamp(itemIndex, stamp.localId, 'origenDiseno', event.target.value)}
                                      className={styles.selectField}
                                    >
                                      {DESIGN_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                    </select>
                                  </label>
                                  <label className={styles.inputGroup}>
                                    <span className={styles.inputLabel}>Que diseno utilizara este estampado?</span>
                                    <select
                                      value={sharedTarget?.localId || ''}
                                      onChange={(event) => shareDesignWithStamp(itemIndex, stamp.localId, event.target.value)}
                                      className={styles.selectField}
                                    >
                                      <option value="">Diseno diferente</option>
                                      {availableDesigns.map((candidate) => (
                                        <option key={candidate.localId} value={candidate.localId}>
                                          Usar el mismo diseno de Producto {candidate.itemIndex + 1} - {candidate.ubicacion || `Estampado ${candidate.stampIndex + 1}`}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  <label className={`${styles.inputGroup} ${styles.quoteRequestWide}`}>
                                    <span className={styles.inputLabel}>Descripcion del estampado</span>
                                    <input
                                      value={stamp.descripcion}
                                      onChange={(event) => updateStamp(itemIndex, stamp.localId, 'descripcion', event.target.value)}
                                      className={styles.inputField}
                                      maxLength={500}
                                    />
                                  </label>
                                  <label className={`${styles.inputGroup} ${styles.quoteRequestWide}`}>
                                    <span className={styles.inputLabel}>Observaciones del estampado</span>
                                    <textarea
                                      value={stamp.observaciones}
                                      onChange={(event) => updateStamp(itemIndex, stamp.localId, 'observaciones', event.target.value)}
                                      className={styles.inputField}
                                      maxLength={500}
                                      rows={2}
                                    />
                                  </label>
                                  {(
                                    !stamp.idTecnica
                                    || (selectedTechnique?.requiereMedidas === true && (!stamp.anchoCm || !stamp.altoCm))
                                  ) && (
                                    <p className={`${styles.quoteCompatibilityNotice} ${styles.quoteRequestWide}`}>
                                      PIXEL completara estos datos durante la revision.
                                    </p>
                                  )}
                                </div>
                                )}
                              </section>
                              );
                            })}
                          </div>
                          <div className={styles.quoteSaveProductRow}>
                            <button type="button" className={styles.btnPrimary} onClick={() => setActiveItemIndex(-1)}>
                              Guardar producto
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            <label className={`${styles.inputGroup} ${styles.quoteRequestGeneralNotes}`}>
              <span className={styles.inputLabel}>Observaciones generales</span>
              <textarea
                value={observaciones}
                onChange={(event) => setObservaciones(event.target.value)}
                className={styles.inputField}
                rows={2}
                placeholder="Entrega, urgencia, empaque u otra aclaracion..."
              />
            </label>

            <div className={styles.quotePendingPriceNotice}>
              <strong>Precio pendiente de confirmacion</strong>
              <span>PIXEL completara durante la revision los servicios, medidas o disenos que esten pendientes.</span>
            </div>
            </>
            )}

            {step === 3 && (
              <section className={`${styles.quoteRequestSection} ${styles.quoteReviewStep}`}>
                <div className={styles.quoteRequestSectionTitle}>
                  <span>Revision</span>
                  <strong>Confirma la informacion antes de crear la solicitud</strong>
                </div>

                <div className={styles.quoteReviewClient}>
                  <span>Cliente presencial</span>
                  <strong>{selectedClient?.nombre || cliente.nombre}</strong>
                  <small>{[selectedClient?.telefono || cliente.telefono, selectedClient?.correo || cliente.correo].filter(Boolean).join(' - ') || 'Sin datos adicionales'}</small>
                  <small>{selectedClient ? 'Cliente existente' : 'Sin acceso al portal'}</small>
                </div>

                <div className={styles.quoteReviewProducts}>
                  {items.map((item, itemIndex) => (
                    <article key={item.localId}>
                      <header>
                        <div>
                          <span>Producto {itemIndex + 1}</span>
                          <strong>{getItemName(item, catalogs.products)}</strong>
                        </div>
                        <button type="button" onClick={() => { setActiveItemIndex(itemIndex); setStep(2); }}>
                          Volver a editar
                        </button>
                      </header>
                      <div>
                        <span>Cantidad: {Number(item.cantidad).toLocaleString('es-CO')}</span>
                        <span>Suministrado por: {item.suministradoPor === 'CLIENTE' ? 'Cliente' : 'PIXEL'}</span>
                        <span>{item.estampados.length} estampado(s)</span>
                      </div>
                      {item.estampados.length > 0 ? (
                        <ul>
                          {item.estampados.map((stamp) => (
                            <li key={stamp.localId}>
                              {getStampSummary(stamp, catalogs.techniques)} - {DESIGN_OPTIONS.find(([value]) => value === stamp.origenDiseno)?.[1] || 'Diseno por definir'}
                            </li>
                          ))}
                        </ul>
                      ) : <p>Producto especial sin estampados definidos. PIXEL lo revisara manualmente.</p>}
                    </article>
                  ))}
                </div>

                {observaciones.trim() && (
                  <div className={styles.quoteReviewNotes}>
                    <span>Observaciones generales</span>
                    <p>{observaciones}</p>
                  </div>
                )}

                <div className={styles.quotePendingPriceNotice}>
                  <strong>Precio pendiente de confirmacion</strong>
                  <span>El equipo de PIXEL revisara servicios, medidas, descuentos y disenos antes de enviar la propuesta.</span>
                </div>
              </section>
            )}
          </div>

          <footer className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={isSubmitting}>
              Cancelar
            </button>
            <div className={styles.quoteRequestFooterActions}>
              {step > (isEditing ? 2 : 1) && (
                <button type="button" className={styles.btnSecondary} onClick={() => setStep((current) => current - 1)} disabled={isSubmitting}>
                  Volver
                </button>
              )}
              {step < 3 ? (
                <button type="button" className={styles.btnPrimary} onClick={goToNextStep} disabled={isSubmitting || loadingCatalogs}>
                  Continuar
                </button>
              ) : (
                <button type="submit" className={styles.btnPrimary} disabled={isSubmitting || loadingCatalogs}>
                  {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar solicitud' : 'Crear solicitud'}
                </button>
              )}
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
};
