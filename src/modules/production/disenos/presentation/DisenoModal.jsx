/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { apiClient } from '../../../../core/services/apiService';
import './DisenosPage.css';

const styles = {
  overlay: 'disenos-overlay',
  modalContainer: 'disenos-modal-container',
  modalSm: 'disenos-modal-sm',
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

export const DisenoModal = ({ isOpen, onClose, onSubmit, diseno, isStaff, getPedidos }) => {
  const [idPedido, setIdPedido] = useState('');
  const [idDisenador, setIdDisenador] = useState('');
  const [archivoUrl, setArchivoUrl] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [disenadores, setDisenadores] = useState([]);
  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [loadingDisenadores, setLoadingDisenadores] = useState(false);
  const [pedidosError, setPedidosError] = useState('');
  const [previewError, setPreviewError] = useState(false);

  const isEditing = Boolean(diseno);

  useEffect(() => {
    if (diseno) {
      setIdPedido(diseno.idPedido || '');
      setIdDisenador(diseno.idDisenador || '');
      setArchivoUrl(diseno.archivoUrl || '');
      setDescripcion(diseno.descripcion || '');
      setObservaciones(diseno.observaciones || '');
    } else {
      setIdPedido('');
      setIdDisenador('');
      setArchivoUrl('');
      setDescripcion('');
      setObservaciones('');
    }
    setPedidosError('');
    setPreviewError(false);
  }, [diseno, isOpen]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await onSubmit({
        idPedido,
        idDisenador,
        archivoUrl,
        descripcion,
        observaciones,
      });
    } catch (error) {
      alert(error.message || 'No se pudo procesar el diseno.');
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalSm}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEditing ? `Editar diseno #${diseno.idDiseno}` : 'Registrar diseno'}
          </h3>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn}>x</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Pedido *</label>
            <select
              value={idPedido}
              onChange={event => setIdPedido(event.target.value)}
              className={styles.inputField}
              disabled={isEditing || loadingPedidos}
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
                  Pedido #{item.idPedido} - {item.cliente?.nombre || 'Cliente'} - {item.estadoPago}
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

          {isStaff && !isEditing && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Disenador asignado</label>
              <select
                value={idDisenador}
                onChange={event => setIdDisenador(event.target.value)}
                className={styles.inputField}
                disabled={loadingDisenadores}
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
            <label className={styles.inputLabel}>Archivo URL</label>
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

          <div className={styles.detailsInfoBox}>
            El backend validara que el pedido tenga abono inicial confirmado antes de crear el diseno.
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary}>
              {isEditing ? 'Guardar cambios' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
