import { useEffect, useEffectEvent, useState } from 'react';
import {
  CUSTOM_TARIFF_VALUE,
  PENDING_TARIFF_VALUE,
  getTariffLabel,
  normalizePublicTariffs,
  reconcileStampTariff,
} from '../domain/stampTariffs';
import { publicQuoteRepository } from '../infrastructure/publicQuote.repository';

const isCanceled = (error) => error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError';

export const StampTariffSelector = ({
  stamp,
  technique,
  onPatch,
  disabled = false,
  labelClassName,
  selectClassName,
  wideClassName,
  messageClassName,
}) => {
  const [requestState, setRequestState] = useState({
    techniqueId: null,
    tariffs: [],
    loading: false,
    failed: false,
  });
  const reconcileLoadedTariffs = useEffectEvent((active) => {
    onPatch(reconcileStampTariff(stamp, active));
  });
  const selectPendingAfterFailure = useEffectEvent(() => {
    onPatch({
      idTarifaTecnica: null,
      nombreTarifa: '',
      tarifaEsGeneral: false,
      anchoCm: null,
      altoCm: null,
      medidasDesconocidas: true,
    });
  });

  useEffect(() => {
    if (!technique?.idTecnica) {
      return undefined;
    }
    const controller = new AbortController();
    publicQuoteRepository.listTechniqueTariffs(technique.idTecnica, { signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted) return;
        const active = normalizePublicTariffs(items);
        setRequestState({
          techniqueId: Number(technique.idTecnica),
          tariffs: active,
          loading: false,
          failed: false,
        });
        reconcileLoadedTariffs(active);
      })
      .catch((error) => {
        if (controller.signal.aborted || isCanceled(error)) return;
        setRequestState({
          techniqueId: Number(technique.idTecnica),
          tariffs: [],
          loading: false,
          failed: true,
        });
        selectPendingAfterFailure();
      })
    return () => controller.abort();
  }, [technique?.idTecnica]);

  if (!technique?.idTecnica) return null;

  const isCurrentRequest = requestState.techniqueId === Number(technique.idTecnica);
  const tariffs = isCurrentRequest ? requestState.tariffs : [];
  const loading = isCurrentRequest ? requestState.loading : true;
  const failed = isCurrentRequest ? requestState.failed : false;

  const selectedValue = stamp.idTarifaTecnica
    ? String(stamp.idTarifaTecnica)
    : stamp.nombreTarifa?.startsWith('Medida personalizada:')
      ? CUSTOM_TARIFF_VALUE
      : PENDING_TARIFF_VALUE;
  const allGeneral = tariffs.length > 0 && tariffs.every((tariff) => tariff.esGeneral);

  const selectTariff = (value) => {
    if (value === PENDING_TARIFF_VALUE) {
      onPatch({
        idTarifaTecnica: null,
        nombreTarifa: '',
        tarifaEsGeneral: false,
        anchoCm: null,
        altoCm: null,
        medidasDesconocidas: true,
      });
      return;
    }
    if (value === CUSTOM_TARIFF_VALUE) return;
    const tariff = tariffs.find((item) => String(item.idTarifaTecnica) === value);
    if (!tariff) return;
    onPatch({
      idTarifaTecnica: tariff.idTarifaTecnica,
      nombreTarifa: tariff.nombre || (tariff.esGeneral ? 'Tarifa general' : ''),
      tarifaEsGeneral: tariff.esGeneral,
      anchoCm: tariff.esGeneral ? null : tariff.anchoHastaCm,
      altoCm: tariff.esGeneral ? null : tariff.altoHastaCm,
      medidasDesconocidas: false,
    });
  };

  return (
    <>
      {allGeneral && stamp.idTarifaTecnica ? (
        <p className={`${messageClassName || ''} ${wideClassName || ''}`}>
          {stamp.nombreTarifa || 'Tarifa general'}
        </p>
      ) : (
        <label className={`${labelClassName || ''} ${wideClassName || ''}`}>
          <span>Tamaño del estampado</span>
          <select
            aria-label="Tamaño del estampado"
            value={selectedValue}
            onChange={(event) => selectTariff(event.target.value)}
            disabled={disabled || loading}
            className={selectClassName}
          >
            {loading && <option value={PENDING_TARIFF_VALUE}>Cargando tamaños...</option>}
            {!loading && stamp.nombreTarifa?.startsWith('Medida personalizada:') && (
              <option value={CUSTOM_TARIFF_VALUE}>{stamp.nombreTarifa}</option>
            )}
            {!loading && tariffs.map((tariff) => (
              <option key={tariff.idTarifaTecnica} value={tariff.idTarifaTecnica}>
                {getTariffLabel(tariff)}
              </option>
            ))}
            {!loading && <option value={PENDING_TARIFF_VALUE}>No conozco el tamaño</option>}
          </select>
        </label>
      )}
      {!loading && (failed || tariffs.length === 0) && (
        <p className={`${messageClassName || ''} ${wideClassName || ''}`}>
          No hay tamaños configurados para este servicio.
        </p>
      )}
      {!loading && !stamp.idTarifaTecnica && !stamp.nombreTarifa?.startsWith('Medida personalizada:') && (
        <p className={`${messageClassName || ''} ${wideClassName || ''}`}>
          PIXEL te ayudará a definir el tamaño adecuado.
        </p>
      )}
    </>
  );
};
