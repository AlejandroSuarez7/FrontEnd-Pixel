const asBoolean = value => value === true;

const firstDefined = (...values) => values.find(value => value !== undefined && value !== null);

export const normalizeDesignRequirement = (requirement = {}) => ({
  ...requirement,
  idRequerimientoDiseno: String(requirement.idRequerimientoDiseno || ''),
  tipo: String(requirement.tipo || ''),
  idPedido: requirement.idPedido ?? null,
  idDetallePedido: requirement.idDetallePedido ?? null,
  idEstampadoPedido: firstDefined(
    requirement.idEstampadoPedido,
    requirement.idDetalleEstampadoPedido,
  ) ?? null,
  grupoDisenoCompartido: requirement.grupoDisenoCompartido ?? null,
  producto: requirement.producto ?? null,
  estampadosCubiertos: Array.isArray(requirement.estampadosCubiertos)
    ? requirement.estampadosCubiertos
    : [],
  origenDiseno: String(requirement.origenDiseno || ''),
  estadoCoberturaDiseno: String(requirement.estadoCoberturaDiseno || ''),
  disenoVigente: requirement.disenoVigente ?? null,
  versiones: Array.isArray(requirement.versiones) ? requirement.versiones : [],
  puedeCrearDiseno: asBoolean(requirement.puedeCrearDiseno),
  puedeCargarCorreccion: asBoolean(requirement.puedeCargarCorreccion),
  puedeRegistrarDisenoCliente: asBoolean(requirement.puedeRegistrarDisenoCliente),
  puedeDefinirOrigen: asBoolean(requirement.puedeDefinirOrigen),
  puedeAprobar: asBoolean(requirement.puedeAprobar),
});

export const normalizeDesignRequirementsResponse = (payload = {}) => {
  const root = payload?.data?.data ?? payload?.data ?? payload;
  const requirements = Array.isArray(root?.requerimientos) ? root.requerimientos : [];

  return {
    requerimientos: requirements
      .map(normalizeDesignRequirement)
      .filter(requirement => requirement.idRequerimientoDiseno),
    resumen: root?.resumen ?? {
      totalDisenosRequeridos: 0,
      totalDisenosAprobados: 0,
      totalDisenosPendientes: 0,
      estadoCoberturaDiseno: '',
    },
  };
};

const getStampValue = (requirement, field) => (
  requirement?.[field]
  ?? requirement?.estampado?.[field]
  ?? requirement?.detalleEstampado?.[field]
  ?? requirement?.estampadosCubiertos?.[0]?.[field]
  ?? null
);

export const getRequirementProductName = requirement => (
  requirement?.producto?.nombre
  || requirement?.nombreProducto
  || requirement?.detallePedido?.producto?.nombre
  || 'Producto no especificado'
);

export const getRequirementLocation = requirement => (
  getStampValue(requirement, 'ubicacion') || 'Ubicacion por definir'
);

export const getRequirementTechnique = requirement => (
  getStampValue(requirement, 'tecnica')?.nombre
  || getStampValue(requirement, 'nombreTecnica')
  || 'Servicio por definir'
);

export const getRequirementMeasures = requirement => {
  const width = getStampValue(requirement, 'anchoCm');
  const height = getStampValue(requirement, 'altoCm');
  return width && height ? `${width} x ${height} cm` : 'Medidas por definir';
};

export const formatDesignRequirementLabel = requirement => {
  const product = getRequirementProductName(requirement);
  const coveredCount = requirement?.estampadosCubiertos?.length || 0;

  switch (requirement?.tipo) {
    case 'ESTAMPADO':
      return `${product} - ${getRequirementLocation(requirement)} - ${getRequirementTechnique(requirement)} - ${getRequirementMeasures(requirement)}`;
    case 'GRUPO_COMPARTIDO':
      return `Diseno compartido - ${coveredCount} estampado${coveredCount === 1 ? '' : 's'}`;
    case 'PRODUCTO_GENERAL':
      return `Diseno general - ${product}`;
    case 'PEDIDO_GENERAL':
      return 'Diseno general de todo el pedido';
    case 'LEGACY_PRODUCTO':
      return `${product} - Diseno del producto`;
    default:
      return product;
  }
};

export const DESIGN_REQUIREMENT_STATUS_LABELS = {
  NO_REQUIERE_DISENO: 'No requiere diseno',
  PENDIENTE_DEFINIR_ORIGEN: 'Pendiente de definir quien entrega el diseno',
  PENDIENTE_CREACION_PIXEL: 'Pendiente de creacion por PIXEL',
  PENDIENTE_ARCHIVO_CLIENTE: 'Pendiente de archivo del cliente',
  PENDIENTE_RECEPCION_CLIENTE: 'Pendiente de recibir diseno del cliente',
  DISENO_ENTREGADO_POR_CLIENTE: 'Diseno recibido',
  DISENO_ENVIADO: 'Pendiente de revision',
  ENVIADO: 'Pendiente de revision',
  DISENO_APROBADO: 'Diseno aprobado',
  DISENO_RECHAZADO: 'Correcciones solicitadas',
  CORRECCIONES_SOLICITADAS: 'Correcciones solicitadas',
  CUBIERTO_POR_DISENO_GENERAL: 'Cubierto por diseno general',
};

export const formatDesignRequirementStatus = requirement => (
  DESIGN_REQUIREMENT_STATUS_LABELS[requirement?.estadoCoberturaDiseno]
  || String(requirement?.estadoCoberturaDiseno || 'Estado por definir')
    .replaceAll('_', ' ')
    .toLocaleLowerCase('es')
);

export const canCreatePixelDesign = requirement => (
  requirement?.origenDiseno === 'PIXEL'
  && (requirement?.puedeCrearDiseno || requirement?.puedeCargarCorreccion)
);

export const getPreviousDesignVersion = requirement => (
  requirement?.disenoVigente
  || requirement?.versiones?.[0]
  || null
);

const cleanText = value => {
  const cleaned = value?.trim();
  return cleaned || null;
};

export const buildDesignTargetPayload = (requirement, formData = {}) => {
  if (!requirement?.tipo || !requirement?.idPedido) {
    throw new Error('Selecciona un diseno pendiente valido.');
  }

  const payload = {
    idPedido: Number(requirement.idPedido),
    tipoObjetivo: requirement.tipo,
  };

  switch (requirement.tipo) {
    case 'ESTAMPADO':
      if (!requirement.idDetallePedido || !requirement.idEstampadoPedido) {
        throw new Error('El estampado seleccionado no tiene un objetivo valido.');
      }
      payload.idDetallePedido = Number(requirement.idDetallePedido);
      payload.idEstampadoPedido = Number(requirement.idEstampadoPedido);
      break;
    case 'GRUPO_COMPARTIDO':
      if (!requirement.grupoDisenoCompartido) {
        throw new Error('El diseno compartido no tiene un grupo valido.');
      }
      payload.grupoDisenoCompartido = requirement.grupoDisenoCompartido;
      break;
    case 'PRODUCTO_GENERAL':
      if (!requirement.idDetallePedido) {
        throw new Error('El producto seleccionado no tiene un objetivo valido.');
      }
      payload.idDetallePedido = Number(requirement.idDetallePedido);
      payload.esDisenoGeneral = true;
      break;
    case 'PEDIDO_GENERAL':
      payload.esDisenoGeneral = true;
      break;
    case 'LEGACY_PRODUCTO':
      if (!requirement.idDetallePedido) {
        throw new Error('El producto historico no tiene un objetivo valido.');
      }
      payload.idDetallePedido = Number(requirement.idDetallePedido);
      break;
    default:
      throw new Error('El tipo de diseno seleccionado no es compatible.');
  }

  if (formData.idDisenador) payload.idDisenador = Number(formData.idDisenador);
  if (formData.origenDiseno) payload.origenDiseno = formData.origenDiseno;
  payload.descripcion = cleanText(formData.descripcion);
  payload.observaciones = cleanText(formData.observaciones);

  return payload;
};
