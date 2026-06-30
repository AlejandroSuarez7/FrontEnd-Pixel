import { useEffect, useState } from 'react';
import { notifications } from '../../../../core/utils/notifications';
import './ProveedoresPage.css';

const styles = {
  overlay: 'proveedores-overlay',
  modalContainer: 'proveedores-modal-container',
  modalSm: 'proveedores-modal-sm',
  modalHeader: 'proveedores-modal-header',
  modalTitle: 'proveedores-modal-title',
  modalCloseBtn: 'proveedores-modal-close-btn',
  form: 'proveedores-form',
  formRow: 'proveedores-form-row',
  inputGroup: 'proveedores-input-group',
  inputLabel: 'proveedores-input-label',
  inputField: 'proveedores-input-field',
  detailsInfoBox: 'proveedores-details-info-box',
  modalFooter: 'proveedores-modal-footer',
  btnSecondary: 'proveedores-btn-secondary',
  btnPrimary: 'proveedores-btn-primary',
};

export const ProveedorModal = ({ isOpen, onClose, onSubmit, proveedor }) => {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [estado, setEstado] = useState(true);

  const isEditing = Boolean(proveedor);

  useEffect(() => {
    if (proveedor) {
      setNombre(proveedor.nombre || '');
      setTelefono(proveedor.telefono || '');
      setCorreo(proveedor.correo || '');
      setDireccion(proveedor.direccion || '');
      setEstado(proveedor.estado ?? true);
    } else {
      setNombre('');
      setTelefono('');
      setCorreo('');
      setDireccion('');
      setEstado(true);
    }
  }, [proveedor, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!nombre.trim()) {
      notifications.warning('El nombre del proveedor es obligatorio.');
      return;
    }

    try {
      await onSubmit({ nombre, telefono, correo, direccion, estado });
    } catch (error) {
      notifications.error(error.message || 'No se pudo procesar el proveedor.');
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalSm}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEditing ? `Editar proveedor #${proveedor.idProveedor}` : 'Registrar proveedor'}
          </h3>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn}>x</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={event => setNombre(event.target.value)}
              className={styles.inputField}
              maxLength={120}
              placeholder="Proveedor DTF Medellin"
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Telefono</label>
              <input
                type="text"
                value={telefono}
                onChange={event => setTelefono(event.target.value)}
                className={styles.inputField}
                maxLength={30}
                placeholder="3001234567"
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Correo</label>
              <input
                type="email"
                value={correo}
                onChange={event => setCorreo(event.target.value)}
                className={styles.inputField}
                maxLength={120}
                placeholder="proveedor@example.com"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Direccion</label>
            <input
              type="text"
              value={direccion}
              onChange={event => setDireccion(event.target.value)}
              className={styles.inputField}
              maxLength={180}
              placeholder="Centro"
            />
          </div>

          <label className={styles.detailsInfoBox}>
            <span className={styles.inputLabel}>Proveedor activo</span>
            <input
              type="checkbox"
              checked={estado}
              onChange={event => setEstado(event.target.checked)}
            />
          </label>

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
