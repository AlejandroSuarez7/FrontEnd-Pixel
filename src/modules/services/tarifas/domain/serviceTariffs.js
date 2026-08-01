let tariffSequence = 0;

export const createServiceTariff = (source = {}, requiresMeasures = true) => ({
  localId: source.localId || `tariff-${Date.now()}-${tariffSequence += 1}`,
  idTarifa: source.idTarifa || source.idTarifaTecnica
    ? Number(source.idTarifa ?? source.idTarifaTecnica)
    : null,
  nombre: source.nombre ?? (
    requiresMeasures
      ? (source.anchoHastaCm && source.altoHastaCm
          ? `Hasta ${source.anchoHastaCm} × ${source.altoHastaCm} cm`
          : '')
      : 'Tarifa general'
  ),
  anchoHastaCm: requiresMeasures ? source.anchoHastaCm ?? '' : '',
  altoHastaCm: requiresMeasures ? source.altoHastaCm ?? '' : '',
  esGeneral: requiresMeasures ? false : source.esGeneral !== false,
  precioUnitario: source.precioUnitario ?? '',
  estado: source.estado !== false,
  dirty: Boolean(source.dirty),
  removed: Boolean(source.removed),
});

export const normalizeServiceTariffs = (tariffs = [], requiresMeasures = true) => (
  (Array.isArray(tariffs) ? tariffs : [])
    .map((tariff) => createServiceTariff({
      ...tariff,
      esGeneral: tariff.esGeneral ?? (
        tariff.anchoHastaCm == null && tariff.altoHastaCm == null
      ),
      dirty: false,
    }, requiresMeasures))
    .sort((left, right) => {
      if (left.esGeneral) return -1;
      if (right.esGeneral) return 1;
      return Number(left.anchoHastaCm) - Number(right.anchoHastaCm)
        || Number(left.altoHastaCm) - Number(right.altoHastaCm);
    })
);

const positiveDecimal = (value) => {
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0;
};

export const validateServiceTariffs = (tariffs = [], requiresMeasures = true) => {
  const errors = {};
  const activeRows = tariffs.filter((tariff) => !tariff.removed);

  if (!requiresMeasures && activeRows.length > 1) {
    activeRows.forEach((tariff) => {
      errors[tariff.localId] = {
        general: 'Este servicio solo puede tener un precio general.',
      };
    });
  }

  const dimensions = new Map();
  activeRows.forEach((tariff) => {
    const rowErrors = { ...(errors[tariff.localId] || {}) };
    const name = String(tariff.nombre ?? '').trim();
    if (!name) rowErrors.nombre = 'El nombre del tamaño es obligatorio.';
    else if (name.length > 100) rowErrors.nombre = 'El nombre admite máximo 100 caracteres.';
    if (!positiveDecimal(tariff.precioUnitario)) {
      rowErrors.precioUnitario = 'El precio debe ser mayor a 0.';
    }

    if (requiresMeasures) {
      if (!positiveDecimal(tariff.anchoHastaCm)) {
        rowErrors.anchoHastaCm = 'Ingresa un ancho mayor a 0.';
      }
      if (!positiveDecimal(tariff.altoHastaCm)) {
        rowErrors.altoHastaCm = 'Ingresa un alto mayor a 0.';
      }

      if (!rowErrors.anchoHastaCm && !rowErrors.altoHastaCm) {
        const dimensionKey = `${Number(tariff.anchoHastaCm)}x${Number(tariff.altoHastaCm)}`;
        if (dimensions.has(dimensionKey)) {
          rowErrors.general = 'Ya existe una tarifa para estas dimensiones.';
          const previousId = dimensions.get(dimensionKey);
          errors[previousId] = {
            ...(errors[previousId] || {}),
            general: 'Ya existe una tarifa para estas dimensiones.',
          };
        } else {
          dimensions.set(dimensionKey, tariff.localId);
        }
      }
    }

    if (Object.keys(rowErrors).length > 0) errors[tariff.localId] = rowErrors;
  });

  return errors;
};

export const hasServiceTariffErrors = (errors = {}) => Object.keys(errors).length > 0;

export const toServiceTariffPayload = (tariff, idTecnica, requiresMeasures) => ({
  idTecnica: Number(idTecnica),
  nombre: String(tariff.nombre ?? '').trim(),
  anchoHastaCm: requiresMeasures
    ? Number(String(tariff.anchoHastaCm).replace(',', '.'))
    : null,
  altoHastaCm: requiresMeasures
    ? Number(String(tariff.altoHastaCm).replace(',', '.'))
    : null,
  esGeneral: !requiresMeasures,
  precioUnitario: Number(String(tariff.precioUnitario).replace(',', '.')),
  estado: Boolean(tariff.estado),
});
