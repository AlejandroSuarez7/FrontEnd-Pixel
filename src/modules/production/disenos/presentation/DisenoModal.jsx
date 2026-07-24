/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { apiClient } from '../../../../core/services/apiService';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { notifications } from '../../../../core/utils/notifications';
import './DisenosPage.css';

const styles = {
  overlay: 'disenos-overlay',
  modalContainer: 'disenos-modal-container',
  modalSm: 'disenos-modal-sm',
  modalCompact: 'disenos-modal-compact',
  modalHeader: 'disenos-modal-header',
  modalTitle: 'disenos-modal-title',
  modalCloseBtn: 'disenos-modal-close-btn',
  form: 'disenos-form',
  inputGroup: 'disenos-input-group',
  inputLabel: 'disenos-input-label',
  inputField: 'disenos-input-field',
  loadingText: 'disenos-loading-text',
  detailsInfoBox: 'disenos-details-info-box',
  imagePreview: 'disenos-image-preview',
  imagePreviewMedia: 'disenos-image-preview-media',
  imagePreviewLink: 'disenos-image-preview-link',
  modalFooter: 'disenos-modal-footer',
  btnSecondary: 'disenos-btn-secondary',
  btnPrimary: 'disenos-btn-primary',
};

const getDetailProductName = (detalle) => (
  detalle?.producto?.nombre
  || detalle?.nombreProducto
  || detalle?.descripcion
  || 'Producto no especificado'
);

const getDetailTechniqueName = (detalle) => (
  detalle?.tecnica?.nombre
  || (detalle?.idTecnica ? `Tecnica #${detalle.idTecnica}` : 'Sin tecnica')
);

const formatDetailOption = (detalle, index) => (
  `Producto ${index + 1} - ${getDetailProductName(detalle)} - Cant. ${detalle?.cantidad || 0}`
);

export const DisenoModal = ({ isOpen, onClose, onSubmit, diseno, isStaff, getPedidos }) => {
  const [idPedido, setIdPedido] = useState('');
  const [idDetallePedido, setIdDetallePedido] = useState('');
  const [esDisenoGeneral, setEsDisenoGeneral] = useState(false);
  const [idDisenador, setIdDisenador] = useState('');
  const [archivoUrl, setArchivoUrl] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [origenDiseno, setOrigenDiseno] = useState('DISENADOR');
  const [medioRecepcion, setMedioRecepcion] = useState('WHATSAPP');
  const [observacionesCliente, setObservacionesCliente] = useState('');
  const [marcarAprobado, setMarcarAprobado] = useState(false);
  const [disenadores, setDisenadores] = useState([]);
  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [loadingDisenadores, setLoadingDisenadores] = useState(false);
  const [pedidosError, setPedidosError] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();

  const isEditing = Boolean(diseno);
  const selectedPedido = pedidosDisponibles.find((item) => String(item.idPedido) === String(idPedido)) || diseno?.pedido || null;
  const detallesPedido = Array.isArray(selectedPedido?.detalles) ? selectedPedido.detalles : [];
  const hasMultipleDetails = detallesPedido.length > 1;

  useEffect(() => {
    if (diseno) {
      setIdPedido(diseno.idPedido || '');
      setIdDetallePedido(diseno.idDetallePedido || '');
      setEsDisenoGeneral(Boolean(diseno.esDisenoGeneral));
      setIdDisenador(diseno.idDisenador || '');
      setArchivoUrl(diseno.archivoUrl || '');
      setDescripcion(diseno.descripcion || '');
      setObservaciones(diseno.observaciones || '');
      setOrigenDiseno(diseno.origenDiseno || 'DISENADOR');
      setMedioRecepcion(diseno.medioRecepcion || 'WHATSAPP');
      setObservacionesCliente(diseno.observacionesCliente || '');
      setMarcarAprobado(diseno.estado === 'APROBADO');
    } else {
      setIdPedido('');
      setIdDetallePedido('');
      setEsDisenoGeneral(false);
      setIdDisenador('');
      setArchivoUrl('');
      setDescripcion('');
      setObservaciones('');
      setOrigenDiseno('DISENADOR');
      setMedioRecepcion('WHATSAPP');
      setObservacionesCliente('');
      setMarcarAprobado(false);
    }
    setPedidosError('');
    setPreviewError(false);
  }, [diseno, isOpen]);

  useEffect(() => {
    if (!isOpen || isEditing || esDisenoGeneral) return;
    if (detallesPedido.length === 1) {
      setIdDetallePedido(detallesPedido[0].idDetallePedido || '');
    } else if (detallesPedido.length > 1 && !detallesPedido.some((detalle) => String(detalle.idDetallePedido) === String(idDetallePedido))) {
      setIdDetallePedido('');
    }
  }, [detallesPedido, esDisenoGeneral, idDetallePedido, isEditing, isOpen]);

  useEffect(() => {
    if (!isOpen || isEditing || !getPedidos) return;

    let cancelled = false;
    setLoadingPedidos(true);
    setPedidosError('');

    getPedidos()
      .then((data) => {
        if (cancelled) return;
        const pedidosActivos = (data || []).filter(item =>
          item.estadoPedido !== 'FINALIZADO' &&
          item.estadoPedido !== 'ANULADO'
        );
        setPedidosDisponibles(pedidosActivos);
      })
      .catch((error) => {
        if (cancelled) return;
        setPedidosDisponibles([]);
        setPedidosError(error.message || 'No se pudieron consultar los pedidos disponibles.');
      })
      .finally(() => {
        if (!cancelled) setLoadingPedidos(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, isEditing, getPedidos]);

  useEffect(() => {
    if (!isOpen || !isStaff || isEditing) return;

    setLoadingDisenadores(true);
    apiClient.get('api/usuarios')
      .then(({ data }) => {
        const items = (data.data || []).filter(user =>
          user.estado === true && user.rol?.nombre?.toLowerCase().includes('dise')
        );
        setDisenadores(items);
      })
      .catch(() => setDisenadores([]))
      .finally(() => setLoadingDisenadores(false));
  }, [isOpen, isStaff, isEditing]);

  if (!isOpen) return null;

  const archivoUrlLimpio = archivoUrl.trim();
  const isClientOrigin = origenDiseno === 'CLIENTE';

  const handleSubmit = async (event) => {
    event.preventDefault();
    await runLocked(async () => {
    try {
      if (!isEditing && !esDisenoGeneral && hasMultipleDetails && !idDetallePedido) {
        notifications.error('Selecciona el producto del pedido o marca que el diseno aplica para todo el pedido.');
        return;
      }
      await onSubmit({
        idPedido,
        idDetallePedido: esDisenoGeneral ? undefined : idDetallePedido,
        esDisenoGeneral,
        idDisenador,
        archivoUrl,
        descripcion,
        observaciones,
        origenDiseno,
        medioRecepcion: isClientOrigin ? medioRecepcion : undefined,
        observacionesCliente: isClientOrigin ? observacionesCliente : undefined,
        estado: isClientOrigin && marcarAprobado ? 'APROBADO' : undefined,
      });
    } catch (error) {
      notifications.error(error.message || 'No se pudo procesar el diseno.');
    }
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalSm} ${styles.modalCompact}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEditing ? `Editar diseno #${diseno.idDiseno}` : 'Registrar diseno'}
          </h3>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn} disabled={isSubmitting}>x</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Pedido *</label>
            <select
              value={idPedido}
              onChange={event => setIdPedido(event.target.value)}
              className={styles.inputField}
              disabled={isSubmitting || isEditing || loadingPedidos}
              required
            >
              <option value="">
                {loadingPedidos ? 'Cargando pedidos...' : 'Selecciona un pedido'}
              </option>
              {isEditing && idPedido ? (
                <option value={idPedido}>Pedido #{idPedido}</option>
              ) : null}
              {pedidosDisponibles.map(item => (
                <option key={item.idPedido} value={item.idPedido}>
                  Pedido #{item.idPedido} - {item.cliente?.nombre || 'Cliente no especificado'} - {item.estadoPago}
                </option>
              ))}
            </select>
          </div>

          {pedidosError && <p className={styles.detailsInfoBox}>{pedidosError}</p>}
          {!isEditing && !loadingPedidos && pedidosDisponibles.length === 0 && !pedidosError && (
            <p className={styles.detailsInfoBox}>
              No hay pedidos activos disponibles para registrar disenos.
            </p>
          )}

          {!isEditing && idPedido && (
            <div className={styles.inputGroup}>
              <label className="disenos-checkbox-row">
                <input
                  type="checkbox"
                  checked={esDisenoGeneral}
                  onChange={event => {
                    setEsDisenoGeneral(event.target.checked);
                    if (event.target.checked) setIdDetallePedido('');
                  }}
                  disabled={isSubmitting}
                />
                <span>Este diseno aplica para todo el pedido</span>
              </label>
            </div>
          )}

          {!isEditing && idPedido && !esDisenoGeneral && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Producto del pedido *</label>
              <select
                value={idDetallePedido}
                onChange={event => setIdDetallePedido(event.target.value)}
                className={styles.inputField}
                disabled={isSubmitting || detallesPedido.length === 1}
                required={hasMultipleDetails}
              >
                <option value="">
                  {detallesPedido.length === 0 ? 'El pedido no tiene productos cargados' : 'Selecciona un producto'}
                </option>
                {detallesPedido.map((detalle, index) => (
                  <option key={detalle.idDetallePedido || index} value={detalle.idDetallePedido || ''}>
                    {formatDetailOption(detalle, index)}
                  </option>
                ))}
              </select>
              {idDetallePedido && (
                <p className={styles.detailsInfoBox}>
                  {getDetailTechniqueName(detallesPedido.find((detalle) => String(detalle.idDetallePedido) === String(idDetallePedido)))}.
                </p>
              )}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Origen del diseno *</label>
            <select
              value={origenDiseno}
              onChange={event => {
                const nextOrigin = event.target.value;
                setOrigenDiseno(nextOrigin);
                if (nextOrigin === 'CLIENTE') setIdDisenador('');
              }}
              className={styles.inputField}
              disabled={isSubmitting || isEditing}
              required
            >
              <option value="DISENADOR">Equipo PIXEL / Disenador</option>
              <option value="CLIENTE">Cliente ya tiene diseno</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          {isClientOrigin && (
            <div className={styles.detailsInfoBox}>
              Usa esta opcion cuando el cliente ya tenga el diseno y lo haya enviado por WhatsApp, correo u otro medio.
            </div>
          )}

          {isStaff && !isEditing && !isClientOrigin && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Disenador asignado</label>
              <select
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

          {isClientOrigin && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Medio de recepcion *</label>
              <select
                value={medioRecepcion}
                onChange={event => setMedioRecepcion(event.target.value)}
                className={styles.inputField}
                disabled={isSubmitting}
                required
              >
                <option value="WHATSAPP">WHATSAPP</option>
                <option value="CORREO">CORREO</option>
                <option value="PRESENCIAL">PRESENCIAL</option>
                <option value="OTRO">OTRO</option>
              </select>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              {isClientOrigin ? 'URL o enlace del diseno enviado por el cliente' : 'Archivo URL'}
            </label>
            <input
              type="url"
              value={archivoUrl}
              onChange={event => {
                setArchivoUrl(event.target.value);
                setPreviewError(false);
              }}
              className={styles.inputField}
              maxLength={500}
              placeholder="https://archivo.com/diseno.png"
              required={isClientOrigin}
            />
          </div>

          {archivoUrlLimpio && (
            <div className={styles.imagePreview}>
              {!previewError ? (
                <img
                  src={archivoUrlLimpio}
                  alt="Vista previa del diseno"
                  className={styles.imagePreviewMedia}
                  onError={() => setPreviewError(true)}
                />
              ) : (
                <div className={styles.detailsInfoBox}>
                  No se pudo previsualizar la imagen. Revisa que el enlace sea una imagen publica.
                </div>
              )}
              <a href={archivoUrlLimpio} target="_blank" rel="noreferrer" className={styles.imagePreviewLink}>
                Abrir archivo
              </a>
            </div>
          )}

          {!isClientOrigin && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Descripcion</label>
                <textarea
                  value={descripcion}
                  onChange={event => setDescripcion(event.target.value)}
                  className={styles.inputField}
                  rows={3}
                  maxLength={500}
                  placeholder="Montaje frontal camiseta..."
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Observaciones</label>
                <textarea
                  value={observaciones}
                  onChange={event => setObservaciones(event.target.value)}
                  className={styles.inputField}
                  rows={2}
                  maxLength={500}
                  placeholder="Notas internas del diseno..."
                />
              </div>
            </>
          )}

          {isClientOrigin && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Observaciones del cliente</label>
                <textarea
                  value={observacionesCliente}
                  onChange={event => setObservacionesCliente(event.target.value)}
                  className={styles.inputField}
                  rows={3}
                  maxLength={700}
                  placeholder="Ej: El cliente envio el diseno por WhatsApp."
                />
              </div>

              <label className="disenos-checkbox-row">
                <input
                  type="checkbox"
                  checked={marcarAprobado}
                  onChange={event => setMarcarAprobado(event.target.checked)}
                  disabled={isSubmitting}
                />
                <span>Marcar como aprobado al crear</span>
              </label>
            </>
          )}

          <div className={styles.detailsInfoBox}>
            Se verificara que el pedido ya tenga el primer abono.
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={isSubmitting || loadingPedidos || loadingDisenadores}>
              {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
