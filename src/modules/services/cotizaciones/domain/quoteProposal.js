const toFiniteNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toMoneyString = (value, fallback = '0') => {
  if (value === null || value === undefined || value === '') return fallback;
  return String(Math.max(0, Math.round(toFiniteNumber(value))));
};

const cleanText = (value) => String(value ?? '').trim();

const getProductName = (detail = {}) => (
  detail.producto?.nombre
  || detail.nombrePersonalizado
  || detail.descripcion
  || 'Producto no especificado'
);

const getTechniqueName = (stamp = {}, detail = {}) => (
  stamp.tecnica?.nombre
  || detail.tecnica?.nombre
  || 'Técnica por definir'
);

const getServiceSubtotal = (detail = {}) => toFiniteNumber(
  detail.subtotalServiciosOficial
  ?? detail.subtotalSugeridoInterno
  ?? detail.precioSugeridoInterno
  ?? detail.subtotalConDescuento
  ?? detail.subtotalFinal
  ?? detail.subtotal
  ?? 0
);

const getServiceGrossSubtotal = (detail = {}) => toFiniteNumber(
  detail.subtotalBruto
  ?? detail.subtotal
  ?? getServiceSubtotal(detail)
);

const getDesignIdentifier = (design = {}) => {
  const identifiers = [
    design.idDetalleCotizacion != null
      ? ['idDetalleCotizacion', Number(design.idDetalleCotizacion)]
      : null,
    design.idDetalleEstampadoCotizacion != null
      ? ['idDetalleEstampadoCotizacion', Number(design.idDetalleEstampadoCotizacion)]
      : null,
    cleanText(design.grupoDisenoCompartido)
      ? ['grupoDisenoCompartido', cleanText(design.grupoDisenoCompartido)]
      : null,
  ].filter(Boolean);

  return identifiers.length === 1 ? identifiers[0] : null;
};

const createDesignFromSource = (source, index) => {
  const identifier = cleanText(source.grupoDisenoCompartido)
    ? ['grupoDisenoCompartido', cleanText(source.grupoDisenoCompartido)]
    : source.idDetalleEstampadoCotizacion != null
      ? ['idDetalleEstampadoCotizacion', Number(source.idDetalleEstampadoCotizacion)]
      : source.idDetalleCotizacion != null
        ? ['idDetalleCotizacion', Number(source.idDetalleCotizacion)]
        : null;
  if (!identifier) return null;

  const [identifierType, identifierValue] = identifier;
  return {
    uiKey: `design-${identifierType}-${identifierValue}`,
    identifierType,
    identifierValue,
    idDetalleCotizacion: identifierType === 'idDetalleCotizacion' ? identifierValue : null,
    idDetalleEstampadoCotizacion: identifierType === 'idDetalleEstampadoCotizacion'
      ? identifierValue
      : null,
    grupoDisenoCompartido: identifierType === 'grupoDisenoCompartido'
      ? identifierValue
      : '',
    producto: source.producto?.nombre
      || source.productoNombre
      || source.detalleCotizacion?.producto?.nombre
      || source.detalle?.producto?.nombre
      || `Diseño ${index + 1}`,
    ubicacion: source.ubicacion || source.detalleEstampadoCotizacion?.ubicacion || '',
    tipo: identifierType === 'grupoDisenoCompartido'
      ? 'Diseño compartido'
      : identifierType === 'idDetalleCotizacion'
        ? 'Diseño general del producto'
        : 'Diseño individual',
    cubiertos: Array.isArray(source.estampadosCubiertos)
      ? source.estampadosCubiertos.map((item) => item.ubicacion || item.nombre).filter(Boolean)
      : [],
    descripcionVisible: source.descripcionVisible || 'Creación del diseño',
    costoDiseno: toMoneyString(source.costoDiseno ?? 0),
    visibleCliente: source.visibleCliente !== false,
  };
};

const deriveDesignsFromDetails = (details = []) => {
  const designs = [];
  const usedKeys = new Set();

  const addDesign = (source) => {
    const design = createDesignFromSource(source, designs.length);
    if (!design || usedKeys.has(design.uiKey)) return;
    usedKeys.add(design.uiKey);
    designs.push(design);
  };

  details.forEach((detail) => {
    if (
      detail.requiereDiseno === false
      || String(detail.origenDiseno || 'PIXEL').toUpperCase() !== 'PIXEL'
    ) {
      return;
    }

    const stamps = Array.isArray(detail.estampados) ? detail.estampados : [];
    const productName = getProductName(detail);

    if (detail.esDisenoGeneral || stamps.length === 0) {
      addDesign({
        idDetalleCotizacion: detail.idDetalleCotizacion,
        productoNombre: productName,
        costoDiseno: detail.costoDiseno,
        descripcionVisible: detail.descripcionVisibleDiseno,
      });
      return;
    }

    stamps.forEach((stamp) => {
      if (String(stamp.origenDiseno || detail.origenDiseno).toUpperCase() !== 'PIXEL') return;

      if (cleanText(stamp.grupoDisenoCompartido)) {
        const existing = designs.find(
          (design) => design.grupoDisenoCompartido === cleanText(stamp.grupoDisenoCompartido),
        );
        if (existing) {
          const coveredLabel = `${productName} · ${stamp.ubicacion || 'Ubicación por definir'}`;
          if (!existing.cubiertos.includes(coveredLabel)) existing.cubiertos.push(coveredLabel);
          return;
        }

        addDesign({
          grupoDisenoCompartido: stamp.grupoDisenoCompartido,
          productoNombre: productName,
          ubicacion: stamp.ubicacion,
          costoDiseno: stamp.costoDiseno,
          estampadosCubiertos: [{
            nombre: `${productName} · ${stamp.ubicacion || 'Ubicación por definir'}`,
          }],
        });
        return;
      }

      if (stamp.idDetalleEstampadoCotizacion != null) {
        addDesign({
          idDetalleEstampadoCotizacion: stamp.idDetalleEstampadoCotizacion,
          productoNombre: productName,
          ubicacion: stamp.ubicacion,
          costoDiseno: stamp.costoDiseno,
        });
        return;
      }

      addDesign({
        idDetalleCotizacion: detail.idDetalleCotizacion,
        productoNombre: productName,
        ubicacion: stamp.ubicacion,
        costoDiseno: detail.costoDiseno,
      });
    });
  });

  return designs;
};

const getExistingProposal = (quote = {}) => quote.propuesta || quote.propuestaActual || null;

export const createProposalForm = (quote = {}, now = new Date()) => {
  const existingProposal = getExistingProposal(quote);
  const validity = new Date(now);
  validity.setDate(validity.getDate() + 7);
  validity.setHours(23, 59, 0, 0);

  const items = (quote.detalles || []).map((detail) => {
    const existingProposalItems = existingProposal?.items
      || existingProposal?.desgloseVisible?.items
      || [];
    const existingItem = existingProposalItems.find(
      (item) => Number(item.idDetalleCotizacion) === Number(detail.idDetalleCotizacion),
    );
    const subtotalServicios = toFiniteNumber(
      existingItem?.subtotalServiciosOficial ?? getServiceSubtotal(detail),
    );
    const suppliedByClient = String(detail.suministradoPor || 'PIXEL').toUpperCase() === 'CLIENTE';
    const costoProducto = suppliedByClient
      ? 0
      : toFiniteNumber(existingItem?.costoProducto ?? detail.costoProducto ?? 0);
    const otrosCostosItem = toFiniteNumber(
      existingItem?.otrosCostosItem ?? detail.otrosCostosItem ?? 0,
    );
    const suggestedOfficial = subtotalServicios + costoProducto + otrosCostosItem;
    const subtotalOficial = toFiniteNumber(
      existingItem?.subtotalOficial
      ?? existingItem?.subtotal
      ?? detail.subtotalOficial
      ?? suggestedOfficial,
    );
    const stamps = Array.isArray(detail.estampados) ? detail.estampados : [];

    return {
      idDetalleCotizacion: Number(detail.idDetalleCotizacion),
      nombre: getProductName(detail),
      cantidad: toFiniteNumber(detail.cantidad, 1),
      suministradoPor: suppliedByClient ? 'CLIENTE' : 'PIXEL',
      tecnicas: stamps.length > 0
        ? [...new Set(stamps.map((stamp) => getTechniqueName(stamp, detail)))]
        : [getTechniqueName({}, detail)],
      medidas: stamps
        .filter((stamp) => stamp.anchoCm && stamp.altoCm)
        .map((stamp) => `${stamp.anchoCm} × ${stamp.altoCm} cm`),
      subtotalServiciosBruto: getServiceGrossSubtotal(detail),
      descuentoPorcentaje: detail.descuentoPorcentaje,
      descuentoTotalServicios: toFiniteNumber(detail.descuentoTotal ?? 0),
      subtotalServiciosOficial: toMoneyString(subtotalServicios),
      costoProducto: toMoneyString(costoProducto),
      otrosCostosItem: toMoneyString(otrosCostosItem),
      subtotalOficial: toMoneyString(subtotalOficial),
      subtotalModificado: subtotalOficial !== suggestedOfficial,
      requiereRevisionPrecio: Boolean(detail.requiereRevisionPrecio),
      motivosRevision: Array.isArray(detail.motivosRevision) ? detail.motivosRevision : [],
    };
  });

  const sourceDesigns = existingProposal?.disenos
    || existingProposal?.desgloseVisible?.disenos
    || quote.disenosPropuesta
    || quote.disenosCotizables
    || quote.disenos
    || [];
  const designs = Array.isArray(sourceDesigns) && sourceDesigns.length > 0
    ? sourceDesigns.map(createDesignFromSource).filter(Boolean)
    : deriveDesignsFromDetails(quote.detalles || []);

  const legacyAdditional = toFiniteNumber(existingProposal?.costosAdicionales ?? 0);
  const sourceConcepts = existingProposal?.conceptosAdicionales
    || existingProposal?.desgloseVisible?.conceptosAdicionales
    || quote.conceptosAdicionales
    || [];
  const conceptosAdicionales = Array.isArray(sourceConcepts) && sourceConcepts.length > 0
    ? sourceConcepts.map((concept, index) => ({
        localId: `concept-${index + 1}`,
        concepto: concept.concepto || '',
        valor: toMoneyString(concept.valor ?? 0),
        visibleCliente: concept.visibleCliente !== false,
      }))
    : legacyAdditional > 0
      ? [{
          localId: 'concept-legacy',
          concepto: 'Costos adicionales',
          valor: toMoneyString(legacyAdditional),
          visibleCliente: true,
        }]
      : [];

  const validitySource = existingProposal?.validaHasta
    ? new Date(existingProposal.validaHasta)
    : validity;
  const validDate = Number.isNaN(validitySource.getTime()) ? validity : validitySource;
  const pad = (value) => String(value).padStart(2, '0');
  const localValidity = `${validDate.getFullYear()}-${pad(validDate.getMonth() + 1)}-${pad(validDate.getDate())}T${pad(validDate.getHours())}:${pad(validDate.getMinutes())}`;

  const baseForm = {
    precioFinal: '',
    descuentoManual: toMoneyString(existingProposal?.descuentoManual ?? 0),
    validaHasta: localValidity,
    motivoAjusteManual: existingProposal?.motivoAjusteManual || '',
    mensajeCliente: existingProposal?.mensajeCliente || '',
    observacionesCliente: existingProposal?.observacionesCliente
      || existingProposal?.observacionesVisibles
      || '',
    observacionesInternas: existingProposal?.observacionesInternas
      || quote.observacionesInternas
      || '',
    items,
    disenos: designs,
    conceptosAdicionales,
  };

  const suggestedPrice = toFiniteNumber(
    existingProposal?.precioFinal
    ?? quote.precioSugeridoSistema
    ?? quote.precioSugeridoInterno
    ?? 0,
  );
  const breakdown = calculateProposalBreakdown(baseForm);

  return {
    ...baseForm,
    precioFinal: toMoneyString(suggestedPrice > 0 ? suggestedPrice : breakdown.subtotalDesglose, ''),
  };
};

export const calculateProposalBreakdown = (form = {}) => {
  const itemsTotal = (form.items || []).reduce(
    (sum, item) => sum + toFiniteNumber(item.subtotalOficial),
    0,
  );
  const designsTotal = (form.disenos || []).reduce(
    (sum, design) => sum + toFiniteNumber(design.costoDiseno),
    0,
  );
  const conceptsTotal = (form.conceptosAdicionales || []).reduce(
    (sum, concept) => sum + toFiniteNumber(concept.valor),
    0,
  );
  const discount = toFiniteNumber(form.descuentoManual);
  const subtotalBeforeDiscount = itemsTotal + designsTotal + conceptsTotal;
  const subtotalDesglose = subtotalBeforeDiscount - discount;
  const finalPrice = toFiniteNumber(form.precioFinal);

  return {
    itemsTotal,
    designsTotal,
    conceptsTotal,
    discount,
    subtotalBeforeDiscount,
    subtotalDesglose,
    finalPrice,
    ajusteManual: finalPrice - subtotalDesglose,
  };
};

export const getSuggestedItemSubtotal = (item = {}) => (
  toFiniteNumber(item.subtotalServiciosOficial)
  + (item.suministradoPor === 'CLIENTE' ? 0 : toFiniteNumber(item.costoProducto))
  + toFiniteNumber(item.otrosCostosItem)
);

export const sanitizeMoneyInput = (value) => {
  const digits = String(value ?? '').replace(/[^\d]/g, '');
  return digits.replace(/^0+(?=\d)/, '') || (digits ? '0' : '');
};

export const formatMoneyInput = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  return `$ ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(toFiniteNumber(value))}`;
};

export const datetimeLocalToIso = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
    || date.getHours() !== hour
    || date.getMinutes() !== minute
  ) {
    return null;
  }
  return date.toISOString();
};

export const validateProposalForm = (form, now = new Date()) => {
  const errors = {};
  const breakdown = calculateProposalBreakdown(form);
  const validityIso = datetimeLocalToIso(form.validaHasta);

  if (!Number.isFinite(breakdown.finalPrice) || breakdown.finalPrice <= 0) {
    errors.precioFinal = 'Define un precio final mayor que cero.';
  }
  if (!validityIso || new Date(validityIso).getTime() <= now.getTime()) {
    errors.validaHasta = 'Selecciona una fecha y hora futuras.';
  }
  if (!Array.isArray(form.items) || form.items.length === 0) {
    errors.items = 'La propuesta debe incluir al menos un producto.';
  } else if (form.items.some((item) => (
    !Number.isInteger(Number(item.idDetalleCotizacion))
    || Number(item.idDetalleCotizacion) <= 0
    || toFiniteNumber(item.subtotalServiciosOficial, -1) < 0
    || toFiniteNumber(item.costoProducto, -1) < 0
    || toFiniteNumber(item.otrosCostosItem, -1) < 0
    || toFiniteNumber(item.subtotalOficial, -1) < 0
  ))) {
    errors.items = 'Revisa los valores de los productos antes de enviar.';
  }
  if ((form.disenos || []).some((design) => (
    !getDesignIdentifier(design)
    || toFiniteNumber(design.costoDiseno, -1) < 0
    || !cleanText(design.descripcionVisible)
  ))) {
    errors.disenos = 'Revisa la identificación, descripción y costo de los diseños.';
  }
  if ((form.conceptosAdicionales || []).some((concept) => (
    !cleanText(concept.concepto) || toFiniteNumber(concept.valor, -1) < 0
  ))) {
    errors.conceptosAdicionales = 'Completa o elimina los conceptos adicionales vacíos.';
  }
  if (breakdown.subtotalDesglose < 0) {
    errors.descuentoManual = 'El descuento no puede superar el valor del desglose.';
  }
  if (breakdown.ajusteManual !== 0 && !cleanText(form.motivoAjusteManual)) {
    errors.motivoAjusteManual = 'Explica por qué el precio final es diferente.';
  }

  return { errors, validityIso, breakdown, isValid: Object.keys(errors).length === 0 };
};

export const getProposalDesignIdentifier = getDesignIdentifier;
