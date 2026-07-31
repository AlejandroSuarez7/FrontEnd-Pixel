const STATUS_LABELS = {
  SOLICITUD_RECIBIDA: 'Solicitud recibida',
  EN_REVISION: 'En revision',
  PENDIENTE_APROBACION_CLIENTE: 'Esperando respuesta',
  AJUSTE_SOLICITADO: 'Ajuste solicitado',
  ACEPTADA: 'Aceptada',
  RECHAZADA_CLIENTE: 'Rechazada',
  VENCIDA: 'Vencida',
  CONVERTIDA_EN_PEDIDO: 'Convertida en pedido',
  ANULADA: 'Anulada',
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
};

const PROPOSAL_STATUS_LABELS = {
  BORRADOR: 'Borrador',
  ENVIADA: 'Enviada al cliente',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
  AJUSTE_SOLICITADO: 'Ajuste solicitado',
  VENCIDA: 'Vencida',
  INVALIDADA: 'Reemplazada por una nueva version',
};

const DECISION_LABELS = {
  ACEPTAR: 'Propuesta aceptada',
  RECHAZAR: 'Propuesta rechazada',
  SOLICITAR_AJUSTE: 'Ajuste solicitado',
};

const RESPONSE_MEDIUM_LABELS = {
  SISTEMA: 'Portal del cliente',
  WHATSAPP: 'WhatsApp',
  LLAMADA: 'Llamada',
  CORREO: 'Correo',
  PRESENCIAL: 'Presencial',
  OTRO: 'Otro medio',
};

export const getQuoteStatusLabel = (status) => (
  STATUS_LABELS[String(status || '').toUpperCase()] || String(status || 'Pendiente')
);

export const getProposalStatusLabel = (status) => (
  PROPOSAL_STATUS_LABELS[String(status || '').toUpperCase()]
  || String(status || 'Sin estado').replaceAll('_', ' ').toLowerCase()
);

export const getQuoteDecisionLabel = (decision) => (
  DECISION_LABELS[String(decision || '').toUpperCase()]
  || String(decision || 'Sin respuesta').replaceAll('_', ' ').toLowerCase()
);

export const getResponseMediumLabel = (medium) => (
  RESPONSE_MEDIUM_LABELS[String(medium || '').toUpperCase()]
  || String(medium || 'No especificado').replaceAll('_', ' ').toLowerCase()
);

export const getCurrentQuoteVersion = (quote) => {
  if (quote?.propuesta) return quote.propuesta;
  if (!Array.isArray(quote?.versiones)) return null;
  return quote.versiones.find((version) => version?.esVigente) || null;
};

export const isQuoteProposalExpired = (proposal) => {
  if (!proposal?.validaHasta) return false;
  const expiration = new Date(proposal.validaHasta);
  return Number.isNaN(expiration.getTime()) || expiration.getTime() <= Date.now();
};

export const isFinalQuoteStatus = (status) => [
  'CONVERTIDA_EN_PEDIDO',
  'ANULADA',
  'ACEPTADA',
  'RECHAZADA_CLIENTE',
  'APROBADA',
].includes(String(status || '').toUpperCase());

export const isEditableRequestStatus = (status) => [
  'SOLICITUD_RECIBIDA',
  'EN_REVISION',
  'AJUSTE_SOLICITADO',
  'VENCIDA',
  'PENDIENTE',
].includes(String(status || '').toUpperCase());

export const canRespondToProposal = (quote) => {
  const proposal = getCurrentQuoteVersion(quote);
  return Boolean(
    proposal?.idVersion
    && proposal.estado === 'ENVIADA'
    && !proposal.respuesta
    && !isQuoteProposalExpired(proposal)
    && String(quote?.estado || '').toUpperCase() === 'PENDIENTE_APROBACION_CLIENTE'
  );
};

export const getClientVisibleQuoteTotal = (quote) => {
  const proposal = getCurrentQuoteVersion(quote);
  if (!proposal || proposal.precioFinal == null || proposal.precioFinal === '') return null;
  const value = Number(proposal.precioFinal);
  return Number.isFinite(value) ? value : null;
};
