let rangeSequence = 0;

export const createDiscountRange = (source = {}) => ({
  localId: source.localId || `range-${Date.now()}-${rangeSequence += 1}`,
  cantidadMinima: source.cantidadMinima ?? source.cantidadMin ?? '',
  porcentaje: source.porcentaje ?? source.descuentoPorcentaje ?? '',
  estado: source.estado !== false,
});

export const normalizeDiscountRanges = (ranges = []) => (
  (Array.isArray(ranges) ? ranges : [])
    .map(createDiscountRange)
    .sort((left, right) => Number(left.cantidadMinima) - Number(right.cantidadMinima))
);

export const validateDiscountRanges = (ranges = []) => {
  const errors = {};
  const quantities = new Map();

  ranges.forEach((range, index) => {
    const rowErrors = {};
    const quantity = Number(range.cantidadMinima);
    const percentage = Number(String(range.porcentaje).replace(',', '.'));

    if (!Number.isInteger(quantity) || quantity <= 0) {
      rowErrors.cantidadMinima = 'Debe ser un entero mayor a 0.';
    } else if (quantities.has(quantity)) {
      rowErrors.cantidadMinima = 'Esta cantidad mínima está repetida.';
      const previousIndex = quantities.get(quantity);
      errors[previousIndex] = {
        ...(errors[previousIndex] || {}),
        cantidadMinima: 'Esta cantidad mínima está repetida.',
      };
    } else {
      quantities.set(quantity, index);
    }

    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      rowErrors.porcentaje = 'Debe estar entre 0 y 100.';
    }

    if (Object.keys(rowErrors).length > 0) errors[index] = rowErrors;
  });

  return errors;
};

export const hasDiscountRangeErrors = (errors = {}) => Object.keys(errors).length > 0;

export const toDiscountRangePayload = (ranges = []) => (
  ranges
    .map((range) => ({
      cantidadMinima: Number(range.cantidadMinima),
      porcentaje: Number(String(range.porcentaje).replace(',', '.')),
      estado: Boolean(range.estado),
    }))
    .sort((left, right) => left.cantidadMinima - right.cantidadMinima)
);
