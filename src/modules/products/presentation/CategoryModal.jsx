import { useEffect, useState } from 'react';
import { useAsyncLock } from '../../../core/hooks/useAsyncLock';
import { notifications } from '../../../core/utils/notifications';
import styles from '../../users/presentation/users.module.css';

export const CategoryModal = ({ isOpen, onClose, onSubmit, category }) => {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    estado: true,
  });
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();
  const isEditing = Boolean(category);

  useEffect(() => {
    if (!isOpen) return;

    setForm({
      nombre: category?.nombre || '',
      descripcion: category?.descripcion || '',
      estado: category?.estado ?? true,
    });
  }, [isOpen, category]);

  if (!isOpen) return null;

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await runLocked(async () => {

    if (form.nombre.trim().length < 2) {
      notifications.warning('El nombre de la categoria debe tener al menos 2 caracteres.');
      return;
    }

    try {
      await onSubmit(form);
    } catch (error) {
      notifications.error(error.message || 'No se pudo guardar la categoria.');
    }
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalMd}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{isEditing ? 'Editar categoria' : 'Nueva categoria'}</h3>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn}>X</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Nombre *</label>
            <input
              className={styles.inputField}
              value={form.nombre}
              onChange={event => updateField('nombre', event.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Descripcion</label>
            <textarea
              className={styles.inputField}
              value={form.descripcion}
              onChange={event => updateField('descripcion', event.target.value)}
              rows={3}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Estado</label>
            <select
              className={styles.selectField}
              value={String(form.estado)}
              onChange={event => updateField('estado', event.target.value === 'true')}
            >
              <option value="true">Activa</option>
              <option value="false">Inactiva</option>
            </select>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear categoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
