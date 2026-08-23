import { useState } from 'react';
import { toCalendarDateInput } from '../../../../core/utils/fechaFormato';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { notifications } from '../../../../core/utils/notifications';
import styles from './pedidos.module.css';

export const PedidoEditModal = ({ isOpen, onClose, onSubmit, pedido }) => {
  const [fechaEntregaEstimada, setFechaEntregaEstimada] = useState(
    () => toCalendarDateInput(pedido?.fechaEntregaEstimada),
  );
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();

  if (!isOpen || !pedido) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    await runLocked(async () => {
      try {
        await onSubmit(pedido.idPedido, fechaEntregaEstimada || null);
        notifications.success('Fecha estimada de entrega actualizada.');
        onClose();
      } catch (error) {
        notifications.error(error.message || 'No se pudo actualizar la fecha estimada de entrega.');
      }
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalSm}`}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>
              {pedido.fechaEntregaEstimada ? 'Editar fecha estimada de entrega' : 'Asignar fecha estimada de entrega'}
            </h3>
            <p className={styles.modalSubtitle}>Pedido #{pedido.idPedido}</p>
          </div>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn} disabled={isSubmitting}>X</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Fecha estimada de entrega</label>
            <input
              type="date"
              value={fechaEntregaEstimada}
              onChange={(event) => setFechaEntregaEstimada(event.target.value)}
              className={styles.inputField}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Actualizar fecha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
