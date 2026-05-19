// quotes/presentation/EditQuoteModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './quotes.module.css';

export const EditQuoteModal = ({ isOpen, onClose, onSubmit, quote }) => {
  const [observaciones, setObservaciones]       = useState('');
  const [costosAdicionales, setCostosAdicionales] = useState(0);

  useEffect(() => {
    if (quote) {
      setObservaciones(quote.observaciones || '');
      setCostosAdicionales(quote.costos_adicionales || 0);
    }
  }, [quote, isOpen]);

  if (!isOpen || !quote) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(quote.id, {
      observaciones,
      costosAdicionales: Number(costosAdicionales),
    });
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalSm}`}>

        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Editar cotización #{quote.id}</h3>
          </div>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn}>✕</button>
        </div>

        <form onSubmit={handleFormSubmit} className={styles.form}>

          {/* Información de solo lectura */}
          <div className={styles.readOnlySection}>
            <p className={styles.readOnlyItem}>
              <strong>Cliente ID:</strong> {quote.id_cliente}
            </p>
            <p className={styles.readOnlyItem}>
              <strong>Tipo:</strong> {quote.tipo_cotizacion}
            </p>
            <p className={styles.readOnlyItem}>
              <strong>Subtotal base:</strong> ${quote.subtotal?.toLocaleString('es-CO')}
            </p>
          </div>

          {/* Costos adicionales */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Costos adicionales ($) *</label>
            <input
              type="number"
              value={costosAdicionales}
              onChange={e => setCostosAdicionales(e.target.value)}
              className={styles.inputField}
              placeholder="0.00"
              required
              min="0"
            />
            <span className={styles.helperText}>
              El backend recalculará el total sumando esto al subtotal base de los ítems.
            </span>
          </div>

          {/* Observaciones */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Observaciones / Notas generales</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              className={styles.textareaField}
              placeholder="Añade o modifica los detalles finales de esta cotización..."
              maxLength={500}
            />
          </div>

          {/* Acciones */}
          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary}>
              Guardar cambios
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};