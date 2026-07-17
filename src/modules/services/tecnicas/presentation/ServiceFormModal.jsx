// presentation/presentation/ServiceFormModal.jsx
import { useState, useEffect } from 'react';
import { notifications } from '../../../../core/utils/notifications';
import styles from './services.module.css';

export const ServiceFormModal = ({ isOpen, onClose, onSubmit, service }) => {
  const [nombre, setNombre]           = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado]           = useState(true);

  const isEditMode = !!service;

  useEffect(() => {
    if (service) {
      setNombre(service.nombre || '');
      setDescripcion(service.descripcion || '');
      setEstado(service.estado ?? true);
    } else {
      setNombre('');
      setDescripcion('');
      setEstado(true);
    }
  }, [service, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await onSubmit(service.id, { nombre, descripcion, estado });
      } else {
        await onSubmit({ nombre, descripcion, estado });
      }
      onClose();
    } catch (error) {
      notifications.error(error.message || 'Error al procesar la solicitud.');
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalMd}`}>

        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEditMode ? `Editar servicio #${service.id}` : 'Crear nuevo servicio'}
          </h3>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Nombre del servicio / técnica *</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className={styles.inputField}
              placeholder="Ej: Sublimación, Bordado computarizado..."
              required
              maxLength={80}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Descripción / detalles del proceso</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              className={styles.textareaField}
              placeholder="Describe en qué consiste el servicio, materiales recomendados o notas..."
              maxLength={255}
            />
          </div>

          {isEditMode && (
            <div className={styles.switchGroup}>
              <span className={styles.switchLabel}>Estado del servicio</span>
              <button
                type="button"
                role="switch"
                aria-checked={estado}
                onClick={() => setEstado(prev => !prev)}
                className={`${styles.switchTrack} ${estado ? styles.switchTrackOn : styles.switchTrackOff}`}
              >
                <span className={`${styles.switchThumb} ${estado ? styles.switchThumbOn : styles.switchThumbOff}`} />
              </button>
              <span className={`${styles.switchStatus} ${estado ? styles.switchStatusOn : styles.switchStatusOff}`}>
                {estado ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          )}

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary}>
              {isEditMode ? 'Guardar cambios' : 'Registrar servicio'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
