// presentation/presentation/ServiceDetailsModal.jsx
import styles from './services.module.css';

export const ServiceDetailsModal = ({ isOpen, onClose, service }) => {
  if (!isOpen || !service) return null;

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalSm}`}>

        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Servicio #{service.id}</h3>
          <button onClick={onClose} className={styles.modalCloseBtn}>✕</button>
        </div>

        <div className={styles.detailsBody}>

          <div className={styles.detailsRow}>
            <span className={styles.detailsFieldLabel}>Nombre de la técnica</span>
            <span className={styles.detailsFieldValue}>{service.nombre}</span>
          </div>

          <div className={styles.detailsRow}>
            <span className={styles.detailsFieldLabel}>Estado del catálogo</span>
            <span className={`${styles.statusBadge} ${service.estado ? styles.statusActive : styles.statusInactive}`}>
              {service.estado ? 'Disponible para cotizar' : 'Inactivo / Descontinuado'}
            </span>
          </div>

          <div className={styles.detailsDescriptionBlock}>
            <span className={styles.detailsFieldLabel}>Descripción completa</span>
            <p className={styles.detailsDescriptionText}>
              {service.descripcion || 'Este servicio no cuenta con una descripción detallada en el sistema.'}
            </p>
          </div>

          {service.fechaCreacion && (
            <div className={styles.detailsMeta}>
              <p className={styles.detailsMetaText}>
                <strong>Fecha de registro:</strong>{' '}
                {new Date(service.fechaCreacion).toLocaleDateString('es-CO')}
              </p>
            </div>
          )}

        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnPrimary}>
            Cerrar vista
          </button>
        </div>

      </div>
    </div>
  );
};
