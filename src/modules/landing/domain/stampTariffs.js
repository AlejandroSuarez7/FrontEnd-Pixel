export const PENDING_TARIFF_VALUE = 'PENDING';
export const CUSTOM_TARIFF_VALUE = 'CUSTOM';

export const normalizePublicTariff = (source = {}) => ({
  idTarifaTecnica: Number(source.idTarifaTecnica ?? source.idTarifa),
  nombre: String(source.nombre || (
    source.esGeneral
      ? 'Tarifa general'
      : `Hasta ${source.anchoHastaCm} × ${source.altoHastaCm} cm`
  )).trim(),
  anchoHastaCm: source.anchoHastaCm == null ? null : Number(source.anchoHastaCm),
  altoHastaCm: source.altoHastaCm == null ? null : Number(source.altoHastaCm),
  esGeneral: Boolean(source.esGeneral),
});

export const normalizePublicTariffs = (items = []) => (
  (Array.isArray(items) ? items : [])
    .map(normalizePublicTariff)
    .filter((tariff) => Number.isInteger(tariff.idTarifaTecnica) && tariff.idTarifaTecnica > 0)
);

export const getTariffLabel = (tariff) => {
  if (!tariff) return 'Tamaño por definir';
  if (tariff.esGeneral) return tariff.nombre || 'Tarifa general';
  return `${tariff.nombre} — hasta ${tariff.anchoHastaCm} × ${tariff.altoHastaCm} cm`;
};

export const getStampSizeSummary = (stamp = {}) => {
  if (stamp.tarifaEsGeneral) return stamp.nombreTarifa || 'Tarifa general';
  if (stamp.idTarifaTecnica && stamp.nombreTarifa) {
    return stamp.anchoCm != null && stamp.altoCm != null
      ? `${stamp.nombreTarifa} · ${stamp.anchoCm} × ${stamp.altoCm} cm`
      : stamp.nombreTarifa;
  }
  if (stamp.anchoCm !== '' && stamp.anchoCm != null && stamp.altoCm !== '' && stamp.altoCm != null) {
    return stamp.nombreTarifa || `Medida personalizada: ${stamp.anchoCm} × ${stamp.altoCm} cm`;
  }
  return 'Tamaño por definir';
};

export const reconcileStampTariff = (stamp = {}, tariffs = []) => {
  const selected = tariffs.find(
    (tariff) => Number(tariff.idTarifaTecnica) === Number(stamp.idTarifaTecnica),
  );
  const matchingDimensions = tariffs.find((tariff) => (
    !tariff.esGeneral
    && stamp.anchoCm !== ''
    && stamp.anchoCm != null
    && stamp.altoCm !== ''
    && stamp.altoCm != null
    && Number(tariff.anchoHastaCm) === Number(stamp.anchoCm)
    && Number(tariff.altoHastaCm) === Number(stamp.altoCm)
  ));
  const onlyGeneral = tariffs.length === 1 && tariffs[0].esGeneral ? tariffs[0] : null;
  const resolved = selected || matchingDimensions || onlyGeneral;

  if (resolved) {
    return {
      idTarifaTecnica: resolved.idTarifaTecnica,
      nombreTarifa: resolved.nombre || (resolved.esGeneral ? 'Tarifa general' : ''),
      tarifaEsGeneral: resolved.esGeneral,
      anchoCm: resolved.esGeneral ? null : resolved.anchoHastaCm,
      altoCm: resolved.esGeneral ? null : resolved.altoHastaCm,
      medidasDesconocidas: false,
    };
  }
  if (stamp.anchoCm !== '' && stamp.anchoCm != null && stamp.altoCm !== '' && stamp.altoCm != null) {
    return {
      idTarifaTecnica: null,
      nombreTarifa: `Medida personalizada: ${stamp.anchoCm} × ${stamp.altoCm} cm`,
      tarifaEsGeneral: false,
      anchoCm: stamp.anchoCm,
      altoCm: stamp.altoCm,
      medidasDesconocidas: false,
    };
  }
  return {
    idTarifaTecnica: null,
    nombreTarifa: '',
    tarifaEsGeneral: false,
    anchoCm: null,
    altoCm: null,
    medidasDesconocidas: true,
  };
};
