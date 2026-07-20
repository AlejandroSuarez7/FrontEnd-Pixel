export const formatCurrency = (amount) => {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatMoneyCOP = (amount, fallback = '$0') => {
  if (amount === null || amount === undefined || amount === '') return fallback;
  const value = Number(amount);
  if (Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercentage = (value, fallback = 'No especificado') => {
  if (value === null || value === undefined || value === '') return fallback;
  const normalizedValue = typeof value === 'string' ? value.replace(',', '.') : value;
  const numberValue = Number(normalizedValue);
  if (Number.isNaN(numberValue)) return fallback;
  return `${numberValue.toLocaleString('es-CO', { maximumFractionDigits: 2 })}%`;
};

export const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const normalizedValue = typeof value === 'string' ? value.replace(',', '.') : value;
  const numberValue = Number(normalizedValue);
  return Number.isNaN(numberValue) ? null : numberValue;
};

export const getQuoteSubtotalBruto = (source = {}) => {
  return toNumberOrNull(source.subtotalBruto ?? source.subtotal) ?? 0;
};

export const getQuoteDiscountTotal = (source = {}) => {
  return toNumberOrNull(source.descuentoTotal ?? source.descuentoAplicado) ?? 0;
};

export const getQuoteSubtotalWithDiscount = (source = {}) => {
  const explicitSubtotal = toNumberOrNull(
    source.subtotalConDescuento
      ?? source.subtotalFinal
      ?? source.totalConDescuento
      ?? source.total
  );
  if (explicitSubtotal !== null) return explicitSubtotal;

  const subtotalBruto = getQuoteSubtotalBruto(source);
  const discountTotal = getQuoteDiscountTotal(source);
  return Math.max(subtotalBruto - discountTotal, 0);
};

export const getQuoteTotal = (source = {}) => {
  return toNumberOrNull(source.total)
    ?? (getQuoteSubtotalWithDiscount(source) + (toNumberOrNull(source.costosAdicionales) ?? 0));
};

export const formatShortDate = (isoDate) => {
  if (!isoDate) return '-';
  return new Date(isoDate).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

export const formatDateTime = (isoDate) => {
  if (!isoDate) return '-';
  return new Date(isoDate).toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
