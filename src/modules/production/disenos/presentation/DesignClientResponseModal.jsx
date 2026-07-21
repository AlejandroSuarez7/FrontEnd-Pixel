/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import './DisenosPage.css';

const MEDIOS = ['WHATSAPP', 'CORREO', 'LLAMADA', 'PRESENCIAL', 'OTRO'];

const styles = {
  overlay: 'disenos-overlay',
  modalContainer: 'disenos-modal-container',
  modalSm: 'disenos-modal-sm',
  modalHeader: 'disenos-modal-header',
  modalTitle: 'disenos-modal-title',
  modalSubtitle: 'disenos-modal-subtitle',
  modalCloseBtn: 'disenos-modal-close-btn',
  form: 'disenos-form',
  inputGroup: 'disenos-input-group',
  inputLabel: 'disenos-input-label',
  inputField: 'disenos-input-field',
  helpText: 'disenos-help-text',
  detailsInfoBox: 'disenos-details-info-box',
  modalFooter: 'disenos-modal-footer',
  btnSecondary: 'disenos-btn-secondary',
  btnPrimary: 'disenos-btn-primary',
};

export const DesignClientResponseModal = ({ isOpen, mode, diseno, onClose, onSubmit }) => {
  const [medio, setMedio] = useState('WHATSAPP');
  const [observaciones, setObservaciones] = useState('');
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();
  const isReject = mode === 'reject';

  useEffect(() => {
    if (!isOpen) return;
    setMedio('WHATSAPP');
    setObservaciones('');
  }, [isOpen, mode, diseno?.idDiseno]);

  if (!isOpen || !diseno) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isReject && !observaciones.trim()) return;

    await runLocked(() => onSubmit({
      medio,
      observaciones: observaciones.trim(),
    }));
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalSm}`}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>
              {isReject ? 'Rechazar por cliente' : 'Aprobar por cliente'}
            </h3>
            <p className={styles.modalSubtitle}>Diseno #{diseno.idDiseno} | Pedido #{diseno.idPedido}</p>
          </div>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn} disabled={isSubmitting}>x</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.detailsInfoBox}>
            {isReject
              ? 'Registra los cambios solicitados por el cliente.'
              : 'Usa esta opcion si el cliente aprobo el diseno por fuera del sistema.'}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              {isReject ? 'Medio de respuesta *' : 'Medio de aprobacion *'}
            </label>
            <select
              value={medio}
              onChange={(event) => setMedio(event.target.value)}
              className={styles.inputField}
              disabled={isSubmitting}
              required
            >
              {MEDIOS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              {isReject ? 'Cambios solicitados *' : 'Observaciones'}
            </label>
            <textarea
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              className={styles.inputField}
              rows={4}
              maxLength={700}
              placeholder={isReject
                ? 'Ej: Cambiar color, tamano, ubicacion del logo...'
                : 'Ej: El cliente aprobo por WhatsApp.'}
              disabled={isSubmitting}
              required={isReject}
            />
            {!isReject && (
              <span className={styles.helpText}>Opcional. Ayuda a dejar trazabilidad de la aprobacion.</span>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={isSubmitting}>
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={isSubmitting || (isReject && !observaciones.trim())}
            >
              {isSubmitting ? 'Guardando...' : isReject ? 'Registrar rechazo' : 'Registrar aprobacion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
