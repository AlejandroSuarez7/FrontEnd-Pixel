const ORIGIN_LABELS = {
  FRONTEND: 'Enviado desde el portal del cliente',
  BACKEND: 'Procesamiento interno',
  MANUAL: 'Revision manual',
};

export const formatPaymentOrigin = (paymentOrOrigin, fallback = 'Registro manual') => {
  if (paymentOrOrigin && typeof paymentOrOrigin === 'object') {
    const backendLabel = paymentOrOrigin.origenRegistroLabel
      || paymentOrOrigin.origenLabel
      || paymentOrOrigin.origenAnalisisLabel;
    if (backendLabel) return backendLabel;

    const code = paymentOrOrigin.origenRegistroCodigo
      || paymentOrOrigin.origenRegistro
      || paymentOrOrigin.origenAnalisis;
    return ORIGIN_LABELS[String(code || '').toUpperCase()] || fallback;
  }

  return ORIGIN_LABELS[String(paymentOrOrigin || '').toUpperCase()] || fallback;
};
