// pedidos/presentation/PedidoEditModal.jsx
import React, { useState, useEffect } from 'react';
import { notifications } from '../../../../core/utils/notifications';
import styles from './pedidos.module.css';

export const PedidoEditModal = ({ isOpen, onClose, onSubmit, pedido, isStaff }) => {
  const [observaciones, setObservaciones]             = useState('');
  const [fechaEntregaEstimada, setFechaEntregaEstimada] = useState('');

  useEffect(() => {
    if (pedido) {
      setObservaciones(pedido.observaciones || '');
      // Formateamos la fecha ISO a yyyy-MM-dd para el input date
      setFechaEntregaEstimada(pedido.fechaEntregaEstimada)
    } else {
      setObservaciones('');
      setFechaEntregaEstimada('');
    }
  }, [pedido, isOpen]);

  if (!isOpen || !pedido) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        observaciones: observaciones.trim() || null,
        ...(isStaff && { fechaEntregaEstimada: fechaEntregaEstimada || null }),
      };
      await onSubmit(pedido.idPedido, payload);
      onClose();
    } catch (err) {
      notifications.error(err.message || 'Error al actualizar el pedido.');
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalSm}`}>

        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Editar pedido #{pedido.idPedido}</h3>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Fecha estimada — solo Staff */}
          {isStaff && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Fecha de entrega estimada</label>
              <input
                type="date"
                value={fechaEntregaEstimada}
                onChange={e => setFechaEntregaEstimada(e.target.value)}
                className={styles.inputField}
              />
            </div>
          )}

          {/* Observaciones */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Observaciones</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              className={styles.inputField}
              rows={3}
              placeholder="Notas adicionales sobre el pedido..."
            />
          </div>

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
