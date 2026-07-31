import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { notifications } from '../../../../core/utils/notifications';
import { useConfirm } from '../../../../shared/components/ConfirmDialog/ConfirmProvider';
import {
  createServiceTariff,
  hasServiceTariffErrors,
  normalizeServiceTariffs,
  toServiceTariffPayload,
  validateServiceTariffs,
} from '../../tarifas/domain/serviceTariffs';
import { tariffRepository } from '../../tarifas/infrastructure/tariff.repository';
import styles from './services.module.css';

const getInitialForm = (service) => ({
  nombre: service?.nombre || '',
  descripcion: service?.descripcion || '',
  estado: service?.estado ?? true,
  requiereMedidas: service?.requiereMedidas ?? true,
});

export const ServiceFormModal = ({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  service,
  tariffPermissions = {},
}) => {
  const [form, setForm] = useState(() => getInitialForm(service));
  const [tariffs, setTariffs] = useState([]);
  const [tariffErrors, setTariffErrors] = useState({});
  const [loadingTariffs, setLoadingTariffs] = useState(
    Boolean(service?.id && tariffPermissions.canView),
  );
  const [persistedServiceId, setPersistedServiceId] = useState(service?.id || null);
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();
  const confirm = useConfirm();
  const isEditMode = Boolean(service || persistedServiceId);
  const requiresMeasuresAtLoad = service?.requiereMedidas ?? true;

  useEffect(() => {
    if (!service?.id || !tariffPermissions.canView) return undefined;
    const controller = new AbortController();

    tariffRepository.list({
      idTecnica: service.id,
      page: 1,
      limit: 100,
      sortBy: 'anchoHastaCm',
      order: 'asc',
    }, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) {
          setTariffs(normalizeServiceTariffs(result.items, requiresMeasuresAtLoad));
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && error?.code !== 'ERR_CANCELED') {
          notifications.error(error.message || 'No se pudieron cargar los precios del servicio.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingTariffs(false);
      });

    return () => controller.abort();
  }, [requiresMeasuresAtLoad, service?.id, tariffPermissions.canView]);

  if (!isOpen) return null;

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateRequiresMeasures = (requiresMeasures) => {
    updateForm('requiereMedidas', requiresMeasures);
    setTariffs((current) => current.map((tariff) => ({
      ...tariff,
      anchoHastaCm: requiresMeasures ? tariff.anchoHastaCm : '',
      altoHastaCm: requiresMeasures ? tariff.altoHastaCm : '',
      esGeneral: !requiresMeasures,
      dirty: true,
    })));
    setTariffErrors({});
  };

  const updateTariff = (localId, field, value) => {
    setTariffs((current) => current.map((tariff) => (
      tariff.localId === localId
        ? { ...tariff, [field]: value, dirty: true }
        : tariff
    )));
    setTariffErrors({});
  };

  const addTariff = () => {
    if (!form.requiereMedidas && tariffs.some((tariff) => !tariff.removed)) {
      notifications.warning('Este servicio solo puede tener un precio general.');
      return;
    }
    setTariffs((current) => [
      ...current,
      createServiceTariff({}, form.requiereMedidas),
    ]);
  };

  const removeTariff = async (tariff) => {
    const accepted = await confirm({
      title: 'Quitar precio',
      message: tariff.idTarifa
        ? 'Este precio se eliminará al guardar el servicio.'
        : '¿Quieres quitar este precio del formulario?',
      confirmText: 'Quitar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!accepted) return;

    setTariffs((current) => (
      tariff.idTarifa
        ? current.map((item) => (
            item.localId === tariff.localId ? { ...item, removed: true } : item
          ))
        : current.filter((item) => item.localId !== tariff.localId)
    ));
    setTariffErrors({});
  };

  const syncTariffs = async (idTecnica) => {
    const removed = tariffs.filter((tariff) => tariff.removed && tariff.idTarifa);
    const active = tariffs.filter((tariff) => !tariff.removed);

    for (const tariff of removed) {
      await tariffRepository.remove(tariff.idTarifa);
      setTariffs((current) => current.filter((item) => item.localId !== tariff.localId));
    }

    for (const tariff of active) {
      const payload = toServiceTariffPayload(tariff, idTecnica, form.requiereMedidas);
      if (!tariff.idTarifa) {
        const created = await tariffRepository.create(payload);
        setTariffs((current) => current.map((item) => (
          item.localId === tariff.localId
            ? { ...createServiceTariff(created, form.requiereMedidas), localId: item.localId }
            : item
        )));
      } else if (tariff.dirty) {
        const updated = await tariffRepository.update(tariff.idTarifa, payload);
        setTariffs((current) => current.map((item) => (
          item.localId === tariff.localId
            ? { ...createServiceTariff(updated, form.requiereMedidas), localId: item.localId }
            : item
        )));
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.nombre.trim().length < 2) {
      notifications.warning('Escribe un nombre válido para el servicio.');
      return;
    }

    if (tariffPermissions.canView) {
      const errors = validateServiceTariffs(tariffs, form.requiereMedidas);
      setTariffErrors(errors);
      if (hasServiceTariffErrors(errors)) {
        notifications.warning('Revisa los precios configurados.');
        return;
      }
    }

    await runLocked(async () => {
      let idTecnica = persistedServiceId || service?.id;
      try {
        const saved = idTecnica
          ? await onUpdate(idTecnica, form)
          : await onCreate(form);
        idTecnica = Number(saved?.id || saved?.idTecnica || idTecnica);
        setPersistedServiceId(idTecnica);

        if (tariffPermissions.canView) {
          try {
            await syncTariffs(idTecnica);
          } catch (error) {
            notifications.warning(
              `El servicio se guardó, pero uno de sus precios falló: ${error.message || 'revisa los datos y vuelve a guardar.'}`,
            );
            return;
          }
        }

        notifications.success(
          service || persistedServiceId
            ? 'Servicio y precios actualizados correctamente.'
            : 'Servicio y precios creados correctamente.',
        );
        onClose();
      } catch (error) {
        notifications.error(error.message || 'No se pudo guardar el servicio.');
      }
    });
  };

  const visibleTariffs = tariffs.filter((tariff) => !tariff.removed);

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalLg}`}>
        <div className={styles.modalHeader}>
          <div>
            <span className={styles.modalEyebrow}>Gestión de servicios</span>
            <h3 className={styles.modalTitle}>
              {isEditMode ? `Editar servicio #${persistedServiceId || service?.id}` : 'Crear nuevo servicio'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.modalCloseBtn}
            disabled={isSubmitting}
            aria-label="Cerrar"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.serviceForm}>
          <section className={styles.serviceFormSection}>
            <div className={styles.serviceSectionHeading}>
              <div>
                <span>Datos generales</span>
                <strong>Información visible del servicio</strong>
              </div>
            </div>

            <div className={styles.serviceGeneralGrid}>
              <label className={styles.inputGroup}>
                <span className={styles.inputLabel}>Nombre del servicio / técnica *</span>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(event) => updateForm('nombre', event.target.value)}
                  className={styles.inputField}
                  placeholder="Ej: Sublimación, Bordado computarizado"
                  required
                  maxLength={80}
                />
              </label>
              <label className={styles.inputGroup}>
                <span className={styles.inputLabel}>Estado</span>
                <select
                  className={styles.inputField}
                  value={String(form.estado)}
                  onChange={(event) => updateForm('estado', event.target.value === 'true')}
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </label>
              <label className={`${styles.inputGroup} ${styles.serviceWideField}`}>
                <span className={styles.inputLabel}>Descripción / detalles del proceso</span>
                <textarea
                  value={form.descripcion}
                  onChange={(event) => updateForm('descripcion', event.target.value)}
                  className={styles.textareaField}
                  placeholder="Describe el servicio, materiales recomendados o notas"
                  maxLength={255}
                />
              </label>
              <label className={`${styles.serviceMeasureToggle} ${styles.serviceWideField}`}>
                <input
                  type="checkbox"
                  checked={form.requiereMedidas}
                  onChange={(event) => updateRequiresMeasures(event.target.checked)}
                  disabled={isSubmitting}
                />
                <span>
                  <strong>Este servicio requiere ancho y alto</strong>
                  <small>Desactívalo cuando el servicio tenga un único precio general.</small>
                </span>
              </label>
            </div>
          </section>

          {tariffPermissions.canView && (
            <section className={styles.serviceFormSection}>
              <div className={styles.serviceSectionHeading}>
                <div>
                  <span>
                    {form.requiereMedidas
                      ? 'Precios por dimensiones'
                      : 'Precio general del servicio'}
                  </span>
                  <strong>
                    {form.requiereMedidas
                      ? 'Cada fila cubre medidas hasta el límite indicado.'
                      : 'Solo puede existir una tarifa general.'}
                  </strong>
                </div>
                {tariffPermissions.canCreate && (
                  <button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={addTariff}
                    disabled={isSubmitting || loadingTariffs}
                  >
                    <Plus size={15} />
                    {form.requiereMedidas ? 'Agregar dimensión' : 'Agregar precio'}
                  </button>
                )}
              </div>

              {loadingTariffs ? (
                <p className={styles.serviceTariffState}>Cargando precios...</p>
              ) : visibleTariffs.length === 0 ? (
                <p className={styles.serviceTariffState}>
                  No hay precios configurados para este servicio.
                </p>
              ) : (
                <div className={styles.serviceTariffList}>
                  {visibleTariffs.map((tariff, index) => {
                    const canEdit = tariff.idTarifa
                      ? tariffPermissions.canEdit
                      : tariffPermissions.canCreate;
                    return (
                      <div
                        className={`${styles.serviceTariffRow} ${form.requiereMedidas ? '' : styles.general}`}
                        key={tariff.localId}
                      >
                        {form.requiereMedidas && (
                          <>
                            <label>
                              <span>Hasta ancho (cm)</span>
                              <input
                                inputMode="decimal"
                                value={tariff.anchoHastaCm}
                                onChange={(event) => updateTariff(
                                  tariff.localId,
                                  'anchoHastaCm',
                                  event.target.value,
                                )}
                                disabled={!canEdit || isSubmitting}
                                aria-label={`Ancho máximo tarifa ${index + 1}`}
                              />
                              {tariffErrors[tariff.localId]?.anchoHastaCm && (
                                <small>{tariffErrors[tariff.localId].anchoHastaCm}</small>
                              )}
                            </label>
                            <label>
                              <span>Hasta alto (cm)</span>
                              <input
                                inputMode="decimal"
                                value={tariff.altoHastaCm}
                                onChange={(event) => updateTariff(
                                  tariff.localId,
                                  'altoHastaCm',
                                  event.target.value,
                                )}
                                disabled={!canEdit || isSubmitting}
                                aria-label={`Alto máximo tarifa ${index + 1}`}
                              />
                              {tariffErrors[tariff.localId]?.altoHastaCm && (
                                <small>{tariffErrors[tariff.localId].altoHastaCm}</small>
                              )}
                            </label>
                          </>
                        )}
                        <label>
                          <span>Precio unitario (COP)</span>
                          <input
                            inputMode="decimal"
                            value={tariff.precioUnitario}
                            onChange={(event) => updateTariff(
                              tariff.localId,
                              'precioUnitario',
                              event.target.value,
                            )}
                            disabled={!canEdit || isSubmitting}
                            aria-label={`Precio tarifa ${index + 1}`}
                          />
                          {tariffErrors[tariff.localId]?.precioUnitario && (
                            <small>{tariffErrors[tariff.localId].precioUnitario}</small>
                          )}
                        </label>
                        <label>
                          <span>Estado</span>
                          <select
                            value={String(tariff.estado)}
                            onChange={(event) => updateTariff(
                              tariff.localId,
                              'estado',
                              event.target.value === 'true',
                            )}
                            disabled={!canEdit || isSubmitting}
                          >
                            <option value="true">Activo</option>
                            <option value="false">Inactivo</option>
                          </select>
                        </label>
                        {(tariff.idTarifa
                          ? tariffPermissions.canDelete
                          : tariffPermissions.canCreate) && (
                          <button
                            type="button"
                            className={styles.serviceTariffRemove}
                            onClick={() => removeTariff(tariff)}
                            disabled={isSubmitting}
                            aria-label={`Quitar tarifa ${index + 1}`}
                          >
                            <Trash2 size={15} /> Quitar
                          </button>
                        )}
                        {tariffErrors[tariff.localId]?.general && (
                          <p className={styles.serviceTariffError}>
                            {tariffErrors[tariff.localId].general}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnSecondary}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={isSubmitting || loadingTariffs}
            >
              {isSubmitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Registrar servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
