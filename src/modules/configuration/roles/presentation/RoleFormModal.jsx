// presentation/presentation/RoleFormModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './roles.module.css';

export const RoleFormModal = ({ isOpen, onClose, onSubmit, role }) => {
  const [nombre, setNombre]           = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado]           = useState(true);

  const isEditMode = !!role;
  const isCoreRole = isEditMode && (role.nombre === 'Admin' || role.nombre === 'Cliente');

  useEffect(() => {
    if (role) {
      setNombre(role.nombre || '');
      setDescripcion(role.descripcion || '');
      setEstado(role.estado ?? true);
    } else {
      setNombre('');
      setDescripcion('');
      setEstado(true);
    }
  }, [role, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await onSubmit(role.id, { nombre, descripcion, estado });
      } else {
        await onSubmit({ nombre, descripcion, estado });
      }
      onClose();
    } catch (error) {
      alert(error.message || 'Error al procesar el rol.');
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalContainer}>

        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEditMode ? `Modificar rol: ${role.nombre}` : 'Registrar nuevo rol'}
          </h3>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Nombre del rol *</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className={styles.inputField}
              placeholder="Ej: Administrador, Operario, Supervisor"
              required
              maxLength={50}
              disabled={isCoreRole}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Descripción de permisos</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              className={styles.textareaField}
              placeholder="Detalla qué vistas o procesos puede realizar este rol en el sistema..."
              maxLength={255}
            />
          </div>

          {isEditMode && (
            <div className={styles.switchGroup}>
              <span className={styles.switchLabel}>Estado del rol</span>
              <button
                type="button"
                role="switch"
                aria-checked={estado}
                disabled={role.nombre === 'Admin'}
                onClick={() => setEstado(prev => !prev)}
                className={`${styles.switchTrack} ${estado ? styles.switchTrackOn : styles.switchTrackOff} ${role.nombre === 'Admin' ? styles.switchDisabled : ''}`}
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
              {isEditMode ? 'Actualizar' : 'Guardar'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};