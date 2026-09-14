import { useEffect, useMemo, useState } from 'react';
import { formatMoneyCOP } from '../../../../core/utils/formatters';
import { tariffRepository } from '../../tarifas/infrastructure/tariff.repository';
import styles from './services.module.css';

const isCanceledRequest = (error) => (
  error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError'
);

const formatDimension = (value) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString('es-CO', { maximumFractionDigits: 2 })
    : null;
};

const getTariffName = (tariff) => {
  const name = String(tariff?.nombre || '').trim();
  if (name) return name;
  if (tariff?.esGeneral) return 'Tarifa general';
  return 'Precio por dimensiones';
};

export const ServiceDetailsModal = ({ isOpen, onClose, service }) => {
  const [retryVersion, setRetryVersion] = useState(0);
  const [requestState, setRequestState] = useState({
    requestKey: null,
    tariffs: [],
    failed: false,
  });
  const serviceId = Number(service?.id);
  const requestKey = `${serviceId}:${retryVersion}`;

  useEffect(() => {
    if (!isOpen || !Number.isInteger(serviceId) || serviceId <= 0) return undefined;

    const controller = new AbortController();
    tariffRepository.list({
      idTecnica: serviceId,
      page: 1,
      limit: 100,
    }, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setRequestState({
          requestKey,
          tariffs: Array.isArray(result?.items) ? result.items : [],
          failed: false,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted || isCanceledRequest(error)) return;
        setRequestState({ requestKey, tariffs: [], failed: true });
      });

    return () => controller.abort();
  }, [isOpen, requestKey, serviceId]);

  const isCurrentRequest = requestState.requestKey === requestKey;
  const loadingTariffs = isOpen && !isCurrentRequest;
  const tariffError = isCurrentRequest && requestState.failed;
  const tariffs = useMemo(
    () => (isCurrentRequest && !requestState.failed ? requestState.tariffs : []),
    [isCurrentRequest, requestState.failed, requestState.tariffs],
  );

  if (!isOpen || !service) return null;

  return (
    <div className={styles.overlay}>
      <section
        className={`${styles.modalContainer} ${styles.serviceDetailsModal}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-details-title"
      >
        <header className={styles.modalHeader}>
          <div>
            <span className={styles.modalEyebrow}>Detalle del servicio</span>
            <h3 id="service-details-title" className={styles.modalTitle}>Servicio #{service.id}</h3>
          </div>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn} aria-label="Cerrar">×</button>
        </header>

        <div className={styles.serviceDetailsBody}>
          <div className={styles.detailsBody}>
            <div className={styles.detailsRow}>
              <span className={styles.detailsFieldLabel}>Nombre de la técnica</span>
              <span className={styles.detailsFieldValue}>{service.nombre || 'Servicio sin nombre'}</span>
            </div>

            <div className={styles.detailsRow}>
              <span className={styles.detailsFieldLabel}>Estado del catálogo</span>
              <span className={`${styles.statusBadge} ${service.estado ? styles.statusActive : styles.statusInactive}`}>
                {service.estado ? 'Disponible para cotizar' : 'Inactivo / Descontinuado'}
              </span>
            </div>

            <div className={styles.detailsDescriptionBlock}>
              <span className={styles.detailsFieldLabel}>Descripción completa</span>
              <p className={styles.detailsDescriptionText}>
                {service.descripcion || 'Este servicio no cuenta con una descripción detallada en el sistema.'}
              </p>
            </div>

            {service.fechaCreacion && (
              <div className={styles.detailsMeta}>
                <p className={styles.detailsMetaText}>
                  <strong>Fecha de registro:</strong>{' '}
                  {new Date(service.fechaCreacion).toLocaleDateString('es-CO')}
                </p>
              </div>
            )}
          </div>

          <section className={styles.servicePricesSection} aria-labelledby="service-prices-title">
            <div className={styles.servicePricesHeading}>
              <div>
                <span>Tarifas del servicio</span>
                <h4 id="service-prices-title">Precios configurados</h4>
              </div>
              {!loadingTariffs && !tariffError && (
                <strong>{tariffs.length} precio(s)</strong>
              )}
            </div>

            {loadingTariffs ? (
              <div className={styles.servicePricesState} aria-live="polite">
                <span className={styles.servicePricesLoader} aria-hidden="true" />
                <p>Cargando precios configurados...</p>
              </div>
            ) : tariffError ? (
              <div className={`${styles.servicePricesState} ${styles.servicePricesError}`} role="alert">
                <p>No pudimos cargar los precios configurados.</p>
                <button type="button" className={styles.btnSecondary} onClick={() => setRetryVersion((value) => value + 1)}>
                  Reintentar
                </button>
              </div>
            ) : tariffs.length === 0 ? (
              <div className={styles.servicePricesState}>
                <p>No hay precios configurados para este servicio.</p>
              </div>
            ) : (
              <div className={styles.servicePricesGrid}>
                {tariffs.map((tariff) => {
                  const width = formatDimension(tariff.anchoHastaCm);
                  const height = formatDimension(tariff.altoHastaCm);
                  const isGeneral = Boolean(tariff.esGeneral || (!width && !height));
                  return (
                    <article key={tariff.idTarifa} className={styles.servicePriceCard}>
                      <header>
                        <div>
                          <span>{isGeneral ? 'Precio general' : 'Precio por tamaño'}</span>
                          <h5>{getTariffName({ ...tariff, esGeneral: isGeneral })}</h5>
                        </div>
                        <span className={`${styles.statusBadge} ${tariff.estado ? styles.statusActive : styles.statusInactive}`}>
                          {tariff.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </header>
                      <dl>
                        {!isGeneral && (
                          <div>
                            <dt>Hasta</dt>
                            <dd>{width && height ? `${width} × ${height} cm` : 'Dimensiones no especificadas'}</dd>
                          </div>
                        )}
                        <div>
                          <dt>Precio unitario</dt>
                          <dd>{formatMoneyCOP(tariff.precioUnitario, 'No especificado')}</dd>
                        </div>
                      </dl>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <footer className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.btnPrimary}>
            Cerrar vista
          </button>
        </footer>
      </section>
    </div>
  );
};
