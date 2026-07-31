import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../../../core/services/apiService';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { notifications } from '../../../../core/utils/notifications';
import {
  canCreatePixelDesign,
  formatDesignRequirementLabel,
  formatDesignRequirementStatus,
  getPreviousDesignVersion,
  getRequirementLocation,
  getRequirementMeasures,
  getRequirementProductName,
  getRequirementTechnique,
  normalizeDesignRequirement,
} from '../domain/designRequirement';
import './DisenosPage.css';

const styles = {
  overlay: 'disenos-overlay',
  modalContainer: 'disenos-modal-container',
  modalCompact: 'disenos-modal-compact',
  modalHeader: 'disenos-modal-header',
  modalTitle: 'disenos-modal-title',
  modalCloseBtn: 'disenos-modal-close-btn',
  form: 'disenos-form',
  inputGroup: 'disenos-input-group',
  inputLabel: 'disenos-input-label',
  inputField: 'disenos-input-field',
  detailsInfoBox: 'disenos-details-info-box',
  imagePreview: 'disenos-image-preview',
  imagePreviewMedia: 'disenos-image-preview-media',
  imagePreviewLink: 'disenos-image-preview-link',
  modalFooter: 'disenos-modal-footer',
  btnSecondary: 'disenos-btn-secondary',
  btnPrimary: 'disenos-btn-primary',
};

const isHttpUrl = value => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const getCoveredStampLabel = stamp => {
  const product = stamp?.producto?.nombre || stamp?.nombreProducto || 'Producto';
  const location = stamp?.ubicacion || 'Ubicacion por definir';
  const technique = stamp?.tecnica?.nombre || stamp?.nombreTecnica || 'Servicio por definir';
  return `${product} - ${location} - ${technique}`;
};

const DisenoModalContent = ({
  onClose,
  onSubmit,
  diseno,
  isStaff,
  getPedidos,
  getRequerimientosDiseno,
  presetPedido = null,
  presetRequirement = null,
  presetRequirementId = '',
  lockPedido = false,
}) => {
  const initialPresetRequirement = useMemo(
    () => (presetRequirement ? normalizeDesignRequirement(presetRequirement) : null),
    [presetRequirement],
  );
  const initialPedidoId = String(
    diseno?.idPedido || presetPedido?.idPedido || initialPresetRequirement?.idPedido || '',
  );
  const initialRequirementId = String(
    presetRequirementId || initialPresetRequirement?.idRequerimientoDiseno || '',
  );
  const isEditing = Boolean(diseno);
  const [idPedido, setIdPedido] = useState(initialPedidoId);
  const [idRequirement, setIdRequirement] = useState(initialRequirementId);
  const [requirements, setRequirements] = useState(
    initialPresetRequirement ? [initialPresetRequirement] : [],
  );
  const [requirementsSummary, setRequirementsSummary] = useState(null);
  const [loadingRequirements, setLoadingRequirements] = useState(
    Boolean(!isEditing && initialPedidoId && getRequerimientosDiseno),
  );
  const [requirementsError, setRequirementsError] = useState('');
  const [requirementsRetry, setRequirementsRetry] = useState(0);
  const [idDisenador, setIdDisenador] = useState(diseno?.idDisenador || '');
  const [archivoUrl, setArchivoUrl] = useState(diseno?.archivoUrl || '');
  const [descripcion, setDescripcion] = useState(diseno?.descripcion || '');
  const [observaciones, setObservaciones] = useState(diseno?.observaciones || '');
  const [disenadores, setDisenadores] = useState([]);
  const [pedidosDisponibles, setPedidosDisponibles] = useState(
    presetPedido ? [presetPedido] : [],
  );
  const [loadingPedidos, setLoadingPedidos] = useState(
    Boolean(!isEditing && getPedidos && !lockPedido),
  );
  const [loadingDisenadores, setLoadingDisenadores] = useState(
    Boolean(isStaff && !isEditing),
  );
  const [pedidosError, setPedidosError] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();

  const normalizedPreset = initialPresetRequirement;
  const availableRequirements = useMemo(
    () => requirements.filter(canCreatePixelDesign),
    [requirements],
  );
  const selectedRequirement = useMemo(() => (
    requirements.find(item => item.idRequerimientoDiseno === idRequirement)
    || (
      normalizedPreset?.idRequerimientoDiseno === idRequirement
        ? normalizedPreset
        : null
    )
  ), [idRequirement, normalizedPreset, requirements]);
  const previousVersion = selectedRequirement
    ? getPreviousDesignVersion(selectedRequirement)
    : null;
  const isCorrectionVersion = Boolean(selectedRequirement?.puedeCargarCorreccion);
  const selectedPedido = presetPedido
    || pedidosDisponibles.find(item => String(item.idPedido) === String(idPedido))
    || diseno?.pedido
    || null;

  useEffect(() => {
    if (isEditing || !getPedidos || lockPedido) return undefined;

    let active = true;

    getPedidos()
      .then(data => {
        if (!active) return;
        setPedidosDisponibles((data || []).filter(item => (
          item.estadoPedido !== 'FINALIZADO' && item.estadoPedido !== 'ANULADO'
        )));
      })
      .catch(error => {
        if (!active) return;
        setPedidosDisponibles([]);
        setPedidosError(error.message || 'No se pudieron consultar los pedidos disponibles.');
      })
      .finally(() => {
        if (active) setLoadingPedidos(false);
      });

    return () => {
      active = false;
    };
  }, [getPedidos, isEditing, lockPedido]);

  useEffect(() => {
    if (isEditing || !idPedido || !getRequerimientosDiseno) return undefined;

    const controller = new AbortController();

    getRequerimientosDiseno(idPedido, { signal: controller.signal })
      .then(result => {
        if (controller.signal.aborted) return;
        const nextRequirements = result?.requerimientos || [];
        const mergedRequirements = normalizedPreset
          && !nextRequirements.some(item => (
            item.idRequerimientoDiseno === normalizedPreset.idRequerimientoDiseno
          ))
          ? [normalizedPreset, ...nextRequirements]
          : nextRequirements;
        const eligibleRequirements = mergedRequirements.filter(canCreatePixelDesign);

        setRequirements(mergedRequirements);
        setRequirementsSummary(result?.resumen || null);
        setIdRequirement(previousId => {
          const preferredId = String(
            presetRequirementId
            || normalizedPreset?.idRequerimientoDiseno
            || previousId,
          );
          if (eligibleRequirements.some(item => item.idRequerimientoDiseno === preferredId)) {
            return preferredId;
          }
          return eligibleRequirements.length === 1
            ? eligibleRequirements[0].idRequerimientoDiseno
            : '';
        });
      })
      .catch(error => {
        if (controller.signal.aborted) return;
        setRequirements(normalizedPreset ? [normalizedPreset] : []);
        setRequirementsError(error.message || 'No pudimos cargar los disenos pendientes.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingRequirements(false);
      });

    return () => controller.abort();
  }, [
    getRequerimientosDiseno,
    idPedido,
    isEditing,
    normalizedPreset,
    presetRequirementId,
    requirementsRetry,
  ]);

  useEffect(() => {
    if (!isStaff || isEditing) return undefined;

    let active = true;
    apiClient.get('api/usuarios')
      .then(({ data }) => {
        if (!active) return;
        setDisenadores((data.data || []).filter(user => (
          user.estado === true && user.rol?.nombre?.toLowerCase().includes('dise')
        )));
      })
      .catch(() => {
        if (active) setDisenadores([]);
      })
      .finally(() => {
        if (active) setLoadingDisenadores(false);
      });

    return () => {
      active = false;
    };
  }, [isEditing, isStaff]);

  const handlePedidoChange = event => {
    const nextPedidoId = event.target.value;
    setIdPedido(nextPedidoId);
    setIdRequirement('');
    setRequirements([]);
    setRequirementsSummary(null);
    setRequirementsError('');
    setLoadingRequirements(Boolean(nextPedidoId));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    await runLocked(async () => {
      try {
        if (!isEditing && !selectedRequirement) {
          notifications.error('Selecciona el diseno pendiente que vas a registrar.');
          return;
        }
        if (!isEditing && !canCreatePixelDesign(selectedRequirement)) {
          notifications.error('Este requerimiento no permite crear un diseno del equipo PIXEL.');
          return;
        }
        if (!isHttpUrl(archivoUrl.trim())) {
          notifications.error('Ingresa un enlace http o https valido.');
          return;
        }

        await onSubmit({
          ...(isEditing
            ? {
              idPedido,
              archivoUrl,
              descripcion,
              observaciones,
            }
            : {
              requirement: selectedRequirement,
              idPedido: selectedRequirement.idPedido,
              idDisenador,
              archivoUrl,
              descripcion,
              observaciones,
            }),
        });
      } catch (error) {
        notifications.error(error.message || 'No se pudo procesar el diseno.');
      }
    });
  };

  const submitLabel = isSubmitting
    ? 'Guardando...'
    : isEditing
      ? 'Guardar cambios'
      : isCorrectionVersion
        ? 'Cargar diseno corregido'
        : 'Registrar diseno';

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalCompact}`}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>
              {isEditing
                ? `Editar diseno #${diseno.idDiseno}`
                : isCorrectionVersion
                  ? 'Cargar diseno corregido'
                  : 'Registrar diseno'}
            </h3>
            {!isEditing && (
              <p className="disenos-modal-subtitle">
                Selecciona el objetivo indicado por el pedido y registra una sola version.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.modalCloseBtn}
            disabled={isSubmitting}
            aria-label="Cerrar"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <section className="disenos-modal-section">
            <span className="disenos-modal-section-title">A. Pedido y diseno pendiente</span>

            {lockPedido && selectedPedido ? (
              <div className="disenos-locked-context">
                <div><span>Pedido</span><strong>#{selectedPedido.idPedido}</strong></div>
                <div><span>Cliente</span><strong>{selectedPedido.cliente?.nombre || 'Cliente no especificado'}</strong></div>
              </div>
            ) : (
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="diseno-pedido">Pedido *</label>
                <select
                  id="diseno-pedido"
                  value={idPedido}
                  onChange={handlePedidoChange}
                  className={styles.inputField}
                  disabled={isSubmitting || isEditing || loadingPedidos}
                  required={!isEditing}
                >
                  <option value="">
                    {loadingPedidos ? 'Cargando pedidos...' : 'Selecciona un pedido'}
                  </option>
                  {isEditing && idPedido ? <option value={idPedido}>Pedido #{idPedido}</option> : null}
                  {pedidosDisponibles.map(item => (
                    <option key={item.idPedido} value={item.idPedido}>
                      Pedido #{item.idPedido} - {item.cliente?.nombre || 'Cliente no especificado'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {pedidosError && <p className={styles.detailsInfoBox}>{pedidosError}</p>}

            {!isEditing && idPedido && (
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="diseno-requirement">
                  ¿Que diseno vas a registrar? *
                </label>
                <select
                  id="diseno-requirement"
                  value={idRequirement}
                  onChange={event => setIdRequirement(event.target.value)}
                  className={styles.inputField}
                  disabled={
                    isSubmitting
                    || loadingRequirements
                    || lockPedido
                    || availableRequirements.length === 1
                  }
                  required
                >
                  <option value="">
                    {loadingRequirements
                      ? 'Consultando disenos pendientes...'
                      : 'Selecciona un diseno pendiente'}
                  </option>
                  {availableRequirements.map(requirement => (
                    <option
                      key={requirement.idRequerimientoDiseno}
                      value={requirement.idRequerimientoDiseno}
                    >
                      {formatDesignRequirementLabel(requirement)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!isEditing && loadingRequirements && (
              <p className={styles.detailsInfoBox}>Consultando disenos pendientes...</p>
            )}
            {!isEditing && requirementsError && (
              <div className="disenos-requirement-error">
                <p>No pudimos cargar los disenos pendientes.</p>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => {
                    setRequirementsError('');
                    setLoadingRequirements(true);
                    setRequirementsRetry(value => value + 1);
                  }}
                >
                  Reintentar
                </button>
              </div>
            )}
            {!isEditing
              && idPedido
              && !loadingRequirements
              && !requirementsError
              && availableRequirements.length === 0 && (
              <p className={styles.detailsInfoBox}>
                Este pedido no tiene disenos pendientes de creacion o correccion.
              </p>
            )}

            {selectedRequirement && (
              <div className="disenos-requirement-context">
                <strong>{formatDesignRequirementLabel(selectedRequirement)}</strong>
                <div className="disenos-locked-context">
                  <div><span>Producto</span><strong>{getRequirementProductName(selectedRequirement)}</strong></div>
                  <div><span>Tipo</span><strong>{formatDesignRequirementLabel(selectedRequirement)}</strong></div>
                  {selectedRequirement.tipo === 'ESTAMPADO' && (
                    <>
                      <div><span>Ubicacion</span><strong>{getRequirementLocation(selectedRequirement)}</strong></div>
                      <div><span>Tecnica</span><strong>{getRequirementTechnique(selectedRequirement)}</strong></div>
                      <div><span>Medidas</span><strong>{getRequirementMeasures(selectedRequirement)}</strong></div>
                    </>
                  )}
                  <div><span>Origen</span><strong>Equipo PIXEL</strong></div>
                  <div><span>Estado</span><strong>{formatDesignRequirementStatus(selectedRequirement)}</strong></div>
                </div>

                {selectedRequirement.tipo === 'GRUPO_COMPARTIDO'
                  && selectedRequirement.estampadosCubiertos.length > 0 && (
                  <div className="disenos-covered-list">
                    <span>Este diseno cubrira:</span>
                    <ul>
                      {selectedRequirement.estampadosCubiertos.map((stamp, index) => (
                        <li key={stamp.idEstampadoPedido || stamp.idDetalleEstampadoPedido || index}>
                          {getCoveredStampLabel(stamp)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {isCorrectionVersion && (
                  <div className="disenos-correction-version">
                    <strong>Nueva version para revision</strong>
                    <span>La version rechazada se conserva en el historial.</span>
                    {(previousVersion?.archivoUrl || previousVersion?.fileUrl) && (
                      <a
                        href={previousVersion.archivoUrl || previousVersion.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver version anterior
                      </a>
                    )}
                    {(previousVersion?.observacionesCliente || previousVersion?.observaciones) && (
                      <span>
                        Cambios solicitados: {previousVersion.observacionesCliente || previousVersion.observaciones}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {requirementsSummary && (
              <small className="disenos-requirement-summary">
                {requirementsSummary.totalDisenosAprobados || 0} de {requirementsSummary.totalDisenosRequeridos || 0} disenos aprobados
              </small>
            )}
          </section>

          <section className="disenos-modal-section">
            <span className="disenos-modal-section-title">B. Archivo y responsable</span>
            {!isEditing && (
              <p className={styles.detailsInfoBox}>Diseno a cargo del equipo PIXEL.</p>
            )}

            {isStaff && !isEditing && (
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="diseno-disenador">Disenador asignado</label>
                <select
                  id="diseno-disenador"
                  value={idDisenador}
                  onChange={event => setIdDisenador(event.target.value)}
                  className={styles.inputField}
                  disabled={isSubmitting || loadingDisenadores}
                >
                  <option value="">
                    {loadingDisenadores ? 'Cargando disenadores...' : 'Sin asignar'}
                  </option>
                  {disenadores.map(user => (
                    <option key={user.idUsuario} value={user.idUsuario}>
                      {user.nombre} ({user.correo})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="diseno-url">Enlace del diseno</label>
              <input
                id="diseno-url"
                type="url"
                value={archivoUrl}
                onChange={event => {
                  setArchivoUrl(event.target.value);
                  setPreviewError(false);
                }}
                className={styles.inputField}
                maxLength={500}
                placeholder="https://drive.google.com/... o enlace accesible"
              />
            </div>

            {archivoUrl.trim() && (
              <div className={styles.imagePreview}>
                {!previewError ? (
                  <img
                    src={archivoUrl.trim()}
                    alt="Vista previa del diseno"
                    className={styles.imagePreviewMedia}
                    onError={() => setPreviewError(true)}
                  />
                ) : (
                  <div className={styles.detailsInfoBox}>
                    No se pudo previsualizar la imagen. El enlace seguira disponible.
                  </div>
                )}
                <a
                  href={archivoUrl.trim()}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.imagePreviewLink}
                >
                  Abrir enlace
                </a>
              </div>
            )}
          </section>

          <section className="disenos-modal-section">
            <span className="disenos-modal-section-title">C. Informacion del diseno</span>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="diseno-descripcion">Descripcion</label>
              <textarea
                id="diseno-descripcion"
                value={descripcion}
                onChange={event => setDescripcion(event.target.value)}
                className={styles.inputField}
                rows={3}
                maxLength={500}
                placeholder="Describe el montaje o la version que se entrega."
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="diseno-observaciones">Observaciones</label>
              <textarea
                id="diseno-observaciones"
                value={observaciones}
                onChange={event => setObservaciones(event.target.value)}
                className={styles.inputField}
                rows={3}
                maxLength={500}
                placeholder="Notas internas para el equipo."
              />
            </div>
          </section>

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
              disabled={
                isSubmitting
                || loadingPedidos
                || loadingDisenadores
                || loadingRequirements
                || (!isEditing && !selectedRequirement)
              }
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const DisenoModal = props => {
  if (!props.isOpen) return null;
  return <DisenoModalContent {...props} />;
};
