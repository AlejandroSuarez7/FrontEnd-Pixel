export const PUBLIC_QUOTE_DRAFT_VERSION = 3;
export const MAX_PUBLIC_QUOTE_ITEMS = 50;
export const MAX_ITEM_STAMPS = 20;

export const DESIGN_OPTIONS = [
  ['CLIENTE', 'Ya tengo el diseño'],
  ['PIXEL', 'Quiero que PIXEL cree el diseño'],
  ['PENDIENTE_DEFINIR', 'Lo enviaré después'],
  ['NO_REQUIERE', 'No requiere diseño'],
];

export const SUPPLY_OPTIONS = [
  ['PIXEL', 'PIXEL suministra el producto'],
  ['CLIENTE', 'Yo entregaré el producto'],
];

let localSequence = 0;
export const nextLocalId = (prefix) => `${prefix}-${Date.now()}-${localSequence += 1}`;

export const createStamp = (overrides = {}) => ({
  localId: nextLocalId('stamp'),
  idTecnica: '',
  ubicacion: 'FRENTE',
  anchoCm: '',
  altoCm: '',
  medidasDesconocidas: false,
  origenDiseno: 'PENDIENTE_DEFINIR',
  grupoDisenoCompartido: '',
  descripcion: '',
  observaciones: '',
  ...overrides,
});

export const createQuoteItem = (overrides = {}) => ({
  localId: nextLocalId('item'),
  tipoProducto: 'CATALOGO',
  idCategoriaProducto: '',
  idProducto: '',
  nombrePersonalizado: '',
  descripcionPersonalizada: '',
  materialReferencia: '',
  imagenReferencia: '',
  cantidad: 1,
  suministradoPor: 'PIXEL',
  observaciones: '',
  requiereDiseno: true,
  origenDiseno: 'PENDIENTE_DEFINIR',
  archivoDisenoInicialUrl: '',
  esDisenoGeneral: false,
  estampados: [createStamp()],
  ...overrides,
});

export const cleanOptionalText = (value) => {
  const cleaned = String(value ?? '').trim();
  return cleaned || undefined;
};

export const isHttpUrl = (value) => {
  if (!cleanOptionalText(value)) return true;
  try {
    const url = new URL(String(value).trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const getTechnique = (techniques, idTecnica) => (
  techniques.find((technique) => Number(technique.idTecnica) === Number(idTecnica))
);

export const getProduct = (products, idProducto) => (
  products.find((product) => Number(product.idProducto) === Number(idProducto))
);

export const getItemName = (item, products) => {
  if (item.tipoProducto === 'OTRO') {
    return item.nombrePersonalizado?.trim() || 'Producto especial';
  }
  return getProduct(products, item.idProducto)?.nombre
    || item.producto?.nombre
    || item.descripcion
    || 'Producto del catálogo';
};

export const getDesignGroupsInUse = (items = []) => (
  new Set(
    items.flatMap((item) => item.estampados || [])
      .map((stamp) => cleanOptionalText(stamp.grupoDisenoCompartido))
      .filter(Boolean),
  )
);

export const pruneDesignGroups = (groups = [], items = [], currentItem = null) => {
  const usedGroups = getDesignGroupsInUse([
    ...items,
    ...(currentItem ? [currentItem] : []),
  ]);
  return groups.filter((group) => usedGroups.has(group.id));
};

export const createDesignGroup = (label) => ({
  id: `GRUPO-${Date.now()}-${localSequence += 1}`,
  label: String(label).trim().slice(0, 100),
});

export const cloneQuoteItem = (item, { preserveGroups = false } = {}) => ({
  ...item,
  localId: nextLocalId('item'),
  estampados: (item.estampados || []).map((stamp) => ({
    ...stamp,
    localId: nextLocalId('stamp'),
    grupoDisenoCompartido: preserveGroups ? stamp.grupoDisenoCompartido : '',
  })),
});

const buildStampPayload = (stamp, item, techniques) => {
  const technique = getTechnique(techniques, stamp.idTecnica);
  const requiresMeasures = technique?.requiereMedidas === true;
  const origin = item.esDisenoGeneral
    ? item.origenDiseno
    : item.requiereDiseno
      ? stamp.origenDiseno
      : 'NO_REQUIERE';

  return {
    idTecnica: stamp.idTecnica ? Number(stamp.idTecnica) : null,
    ubicacion: cleanOptionalText(stamp.ubicacion) || 'FRENTE',
    ...(requiresMeasures && stamp.anchoCm !== '' && stamp.altoCm !== ''
      ? {
          anchoCm: Number(stamp.anchoCm),
          altoCm: Number(stamp.altoCm),
        }
      : {}),
    ...(cleanOptionalText(stamp.descripcion)
      ? { descripcion: cleanOptionalText(stamp.descripcion) }
      : {}),
    ...(cleanOptionalText(stamp.observaciones)
      ? { observaciones: cleanOptionalText(stamp.observaciones) }
      : {}),
    origenDiseno: origin,
    ...(!item.esDisenoGeneral && item.requiereDiseno && cleanOptionalText(stamp.grupoDisenoCompartido)
      ? { grupoDisenoCompartido: cleanOptionalText(stamp.grupoDisenoCompartido) }
      : {}),
  };
};

export const buildPublicQuoteItemPayload = (item, techniques = []) => {
  const requiresDesign = item.requiereDiseno !== false;
  const stampOrigins = [...new Set(
    (item.estampados || [])
      .map((stamp) => stamp.origenDiseno)
      .filter(Boolean),
  )];
  const itemOrigin = requiresDesign
    ? String(
        item.esDisenoGeneral
          ? item.origenDiseno
          : stampOrigins.length === 1
            ? stampOrigins[0]
            : item.origenDiseno || 'PENDIENTE_DEFINIR',
      ).toUpperCase()
    : 'NO_REQUIERE';
  const hasClientDesign = itemOrigin === 'CLIENTE' || stampOrigins.includes('CLIENTE');

  return {
    tipoProducto: item.tipoProducto,
    ...(item.tipoProducto === 'CATALOGO'
      ? { idProducto: Number(item.idProducto) }
      : {
          nombrePersonalizado: item.nombrePersonalizado.trim(),
          ...(cleanOptionalText(item.descripcionPersonalizada)
            ? { descripcionPersonalizada: cleanOptionalText(item.descripcionPersonalizada) }
            : {}),
          ...(cleanOptionalText(item.materialReferencia)
            ? { materialReferencia: cleanOptionalText(item.materialReferencia) }
            : {}),
          ...(cleanOptionalText(item.imagenReferencia)
            ? { imagenReferencia: cleanOptionalText(item.imagenReferencia) }
            : {}),
        }),
    cantidad: Number(item.cantidad),
    suministradoPor: item.suministradoPor,
    ...(cleanOptionalText(item.observaciones)
      ? { observaciones: cleanOptionalText(item.observaciones) }
      : {}),
    requiereDiseno: requiresDesign,
    origenDiseno: itemOrigin,
    ...(requiresDesign && hasClientDesign && cleanOptionalText(item.archivoDisenoInicialUrl)
      ? { archivoDisenoInicialUrl: cleanOptionalText(item.archivoDisenoInicialUrl) }
      : {}),
    esDisenoGeneral: requiresDesign && Boolean(item.esDisenoGeneral),
    estampados: (item.estampados || []).map((stamp) => (
      buildStampPayload(stamp, {
        ...item,
        requiereDiseno: requiresDesign,
        origenDiseno: itemOrigin,
      }, techniques)
    )),
  };
};

const textTooLong = (value, max) => String(value || '').length > max;

export const validateContact = (contact, isClient = false) => {
  const errors = {};
  if (!isClient && contact.nombre.trim().length < 2) {
    errors.nombre = 'Ingresa tu nombre completo.';
  }
  if (!isClient && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.correo.trim())) {
    errors.correo = 'Ingresa un correo válido.';
  }
  if (!isClient && !/^\d{10}$/.test(contact.telefono.trim())) {
    errors.telefono = 'El teléfono debe tener exactamente 10 dígitos.';
  }
  return errors;
};

export const validateQuoteItem = (item, products = [], techniques = []) => {
  if (!['CATALOGO', 'OTRO'].includes(item.tipoProducto)) {
    return 'Selecciona el tipo de producto.';
  }
  if (item.tipoProducto === 'CATALOGO' && (!item.idProducto || Number(item.idProducto) <= 0)) {
    return 'Selecciona un producto del catálogo.';
  }
  if (item.tipoProducto === 'OTRO' && !item.nombrePersonalizado.trim()) {
    return 'Escribe qué producto quieres estampar.';
  }
  if (textTooLong(item.nombrePersonalizado, 150)) return 'El nombre admite máximo 150 caracteres.';
  if (textTooLong(item.descripcionPersonalizada, 500)) return 'La descripción admite máximo 500 caracteres.';
  if (textTooLong(item.materialReferencia, 255)) return 'El material admite máximo 255 caracteres.';
  if (textTooLong(item.imagenReferencia, 255)) return 'La URL de referencia admite máximo 255 caracteres.';
  if (textTooLong(item.observaciones, 255)) return 'Las observaciones admiten máximo 255 caracteres.';
  if (!isHttpUrl(item.imagenReferencia)) return 'La imagen de referencia debe ser una URL http o https.';
  if (!Number.isInteger(Number(item.cantidad)) || Number(item.cantidad) <= 0) {
    return 'La cantidad debe ser un número entero mayor a 0.';
  }
  if (!['PIXEL', 'CLIENTE'].includes(item.suministradoPor)) {
    return 'Selecciona quién suministra el producto.';
  }
  if ((item.estampados || []).length > MAX_ITEM_STAMPS) {
    return `Cada producto admite máximo ${MAX_ITEM_STAMPS} estampados.`;
  }
  if (item.tipoProducto === 'CATALOGO' && (item.estampados || []).length === 0) {
    return 'Agrega al menos un estampado al producto del catálogo.';
  }

  const selectedProduct = getProduct(products, item.idProducto);
  if (item.tipoProducto === 'CATALOGO' && selectedProduct?.requiereDiseno === false && item.requiereDiseno) {
    return 'Este producto está configurado como producto sin diseño.';
  }

  const requiresDesign = item.requiereDiseno !== false;
  if (requiresDesign && !DESIGN_OPTIONS.some(([value]) => value === item.origenDiseno)) {
    return 'Selecciona el origen del diseño.';
  }
  if (textTooLong(item.archivoDisenoInicialUrl, 255)) {
    return 'El enlace del diseño admite máximo 255 caracteres.';
  }
  if (requiresDesign && item.origenDiseno === 'CLIENTE' && !isHttpUrl(item.archivoDisenoInicialUrl)) {
    return 'El enlace del diseño debe comenzar por http:// o https://.';
  }

  for (let index = 0; index < (item.estampados || []).length; index += 1) {
    const stamp = item.estampados[index];
    const number = index + 1;
    if (textTooLong(stamp.ubicacion, 100)) return `La ubicación del estampado ${number} admite máximo 100 caracteres.`;
    if (textTooLong(stamp.descripcion, 500)) return `La descripción del estampado ${number} admite máximo 500 caracteres.`;
    if (textTooLong(stamp.observaciones, 500)) return `Las observaciones del estampado ${number} admiten máximo 500 caracteres.`;
    if (textTooLong(stamp.grupoDisenoCompartido, 100)) return `El grupo del estampado ${number} admite máximo 100 caracteres.`;

    const technique = getTechnique(techniques, stamp.idTecnica);
    if (technique?.requiereMedidas === true) {
      const width = Number(stamp.anchoCm);
      const height = Number(stamp.altoCm);
      const hasWidth = stamp.anchoCm !== '';
      const hasHeight = stamp.altoCm !== '';
      if (hasWidth !== hasHeight) {
        return `Completa ancho y alto del estampado ${number}.`;
      }
      if (
        hasWidth
        && (
          !Number.isFinite(width)
          || !Number.isFinite(height)
          || width <= 0
          || height <= 0
        )
      ) {
        return `Las medidas del estampado ${number} deben ser mayores que cero.`;
      }
      if (hasWidth && (width > 500 || height > 500)) {
        return 'Las medidas deben ser máximo de 500 cm.';
      }
    }
    if (!item.esDisenoGeneral && requiresDesign && !DESIGN_OPTIONS.some(([value]) => value === stamp.origenDiseno)) {
      return `Selecciona el origen del diseño del estampado ${number}.`;
    }
  }

  return null;
};

export const hydrateQuoteItem = (detail = {}) => ({
  ...createQuoteItem(),
  tipoProducto: detail.tipoProducto || (detail.idProducto ? 'CATALOGO' : 'OTRO'),
  idCategoriaProducto: detail.idCategoriaProducto
    || detail.producto?.idCategoriaProducto
    || detail.producto?.categoriaProducto?.idCategoriaProducto
    || '',
  idProducto: detail.idProducto || '',
  nombrePersonalizado: detail.nombrePersonalizado || '',
  descripcionPersonalizada: detail.descripcionPersonalizada || '',
  materialReferencia: detail.materialReferencia || '',
  imagenReferencia: detail.imagenReferencia || '',
  cantidad: detail.cantidad || 1,
  suministradoPor: detail.suministradoPor || 'PIXEL',
  observaciones: detail.observaciones || '',
  requiereDiseno: detail.requiereDiseno !== false,
  origenDiseno: detail.requiereDiseno === false
    ? 'NO_REQUIERE'
    : detail.origenDiseno || 'PENDIENTE_DEFINIR',
  archivoDisenoInicialUrl: detail.archivoDisenoInicialUrl || '',
  esDisenoGeneral: Boolean(detail.esDisenoGeneral),
  producto: detail.producto || null,
  descripcion: detail.descripcion || '',
  estampados: Array.isArray(detail.estampados)
    ? detail.estampados.map((stamp) => createStamp({
        idTecnica: stamp.idTecnica || '',
        ubicacion: stamp.ubicacion || 'FRENTE',
        anchoCm: stamp.anchoCm ?? '',
        altoCm: stamp.altoCm ?? '',
        medidasDesconocidas: Boolean(
          stamp.idTecnica
          && stamp.anchoCm == null
          && stamp.altoCm == null
        ),
        origenDiseno: stamp.origenDiseno || detail.origenDiseno || 'PENDIENTE_DEFINIR',
        grupoDisenoCompartido: stamp.grupoDisenoCompartido || '',
        descripcion: stamp.descripcion || '',
        observaciones: stamp.observaciones || '',
      }))
    : [],
});
