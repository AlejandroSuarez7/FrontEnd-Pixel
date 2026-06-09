import './ProveedoresPage.css';

const styles = {
  overlay: 'proveedores-overlay',
  modalContainer: 'proveedores-modal-container',
  modalSm: 'proveedores-modal-sm',
  modalHeader: 'proveedores-modal-header',
  modalTitle: 'proveedores-modal-title',
  modalCloseBtn: 'proveedores-modal-close-btn',
  form: 'proveedores-form',
  readOnlyGrid: 'proveedores-read-only-grid',
  readOnlyItem: 'proveedores-read-only-item',
  modalFooter: 'proveedores-modal-footer',
  btnPrimary: 'proveedores-btn-primary',
};

export const ProveedorViewModal = ({ isOpen, onClose, proveedor }) => {
  if (!isOpen || !proveedor) return null;

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalSm}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Proveedor #{proveedor.idProveedor}</h3>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn}>x</button>
        </div>

        <div className={styles.form}>
          <div className={styles.readOnlyGrid}>
            <div className={styles.readOnlyItem}>Nombre<strong>{proveedor.nombre}</strong></div>
            <div className={styles.readOnlyItem}>Estado<strong>{proveedor.estado ? 'Activo' : 'Inactivo'}</strong></div>
            <div className={styles.readOnlyItem}>Telefono<strong>{proveedor.telefono || 'Sin telefono'}</strong></div>
            <div className={styles.readOnlyItem}>Correo<strong>{proveedor.correo || 'Sin correo'}</strong></div>
            <div className={styles.readOnlyItem}>Direccion<strong>{proveedor.direccion || 'Sin direccion'}</strong></div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.btnPrimary}>
            Cerrar ventana
          </button>
        </div>
      </div>
    </div>
  );
};
