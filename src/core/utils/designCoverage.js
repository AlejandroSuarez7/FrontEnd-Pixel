export const DESIGN_COVERAGE_LABELS = {
  NO_REQUIERE_DISENO: 'No requiere diseno',
  PENDIENTE_CREACION_PIXEL: 'Pendiente de creacion por PIXEL',
  PENDIENTE_ARCHIVO_CLIENTE: 'Pendiente de archivo del cliente',
  DISENO_CLIENTE_PENDIENTE_VINCULACION: 'Diseno del cliente pendiente de revision',
  DISENO_ENTREGADO_POR_CLIENTE: 'Diseno entregado por el cliente',
  DISENO_GENERAL_ENTREGADO_POR_CLIENTE: 'Diseno general entregado por el cliente',
  DISENO_ENVIADO: 'Diseno enviado para revision',
  DISENO_GENERAL_ENVIADO: 'Diseno general enviado para revision',
  DISENO_APROBADO: 'Diseno aprobado',
  DISENO_RECHAZADO: 'Correcciones solicitadas',
  DISENO_GENERAL_RECHAZADO: 'Correcciones solicitadas',
  CUBIERTO_POR_DISENO_GENERAL: 'Cubierto por diseno general',
};

export const getDesignCoverageState = (detail = {}) => {
  if (detail.estadoCoberturaDiseno) return detail.estadoCoberturaDiseno;
  if (detail.requiereDiseno === false) return 'NO_REQUIERE_DISENO';
  if (detail.cubiertoPorDiseno) {
    return detail.diseno?.esDisenoGeneral ? 'CUBIERTO_POR_DISENO_GENERAL' : 'DISENO_APROBADO';
  }
  if (detail.diseno?.estado === 'APROBADO') return 'DISENO_APROBADO';
  if (detail.diseno?.estado === 'RECHAZADO') return 'DISENO_RECHAZADO';
  if (detail.diseno?.estado === 'ENVIADO' && detail.diseno?.origenDiseno === 'CLIENTE') {
    return 'DISENO_ENTREGADO_POR_CLIENTE';
  }
  if (detail.diseno?.estado === 'ENVIADO') return 'DISENO_ENVIADO';
  if (String(detail.origenDiseno || '').toUpperCase() === 'CLIENTE') {
    return detail.archivoDisenoInicialUrl
      ? 'DISENO_CLIENTE_PENDIENTE_VINCULACION'
      : 'PENDIENTE_ARCHIVO_CLIENTE';
  }
  return 'PENDIENTE_CREACION_PIXEL';
};

export const getDesignCoverageInfo = (detail = {}) => {
  const state = getDesignCoverageState(detail);
  const design = detail.diseno || null;

  return {
    state,
    label: DESIGN_COVERAGE_LABELS[state] || state.replaceAll('_', ' ').toLowerCase(),
    message: detail.mensajeEstadoDiseno || DESIGN_COVERAGE_LABELS[state] || '',
    covered: detail.cubiertoPorDiseno === true || [
      'NO_REQUIERE_DISENO',
      'DISENO_APROBADO',
      'CUBIERTO_POR_DISENO_GENERAL',
    ].includes(state),
    canCreate: state === 'PENDIENTE_CREACION_PIXEL',
    canReview: [
      'DISENO_ENTREGADO_POR_CLIENTE',
      'DISENO_GENERAL_ENTREGADO_POR_CLIENTE',
      'DISENO_ENVIADO',
      'DISENO_GENERAL_ENVIADO',
      'DISENO_RECHAZADO',
      'DISENO_GENERAL_RECHAZADO',
      'DISENO_APROBADO',
      'CUBIERTO_POR_DISENO_GENERAL',
    ].includes(state),
    waitingForClient: state === 'PENDIENTE_ARCHIVO_CLIENTE',
    noDesignRequired: state === 'NO_REQUIERE_DISENO',
    isGeneral: Boolean(design?.esDisenoGeneral || detail.esDisenoGeneral),
    design,
    fileUrl: design?.archivoUrl || detail.archivoDisenoInicialUrl || '',
  };
};

export const canCreateDesignForDetail = detail => getDesignCoverageInfo(detail).canCreate;
