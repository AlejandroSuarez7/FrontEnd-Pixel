import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { PAYMENT_METHODS, SALE_STATUSES } from '../../domain/models/saleModel.js';
import ModalWrapper from './ModalWrapper.jsx';
import styles from './SaleFormModal.module.css';

const SaleFormModal = ({ open, onClose, onSubmit, defaultResponsible }) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      clientName: '',
      paymentMethod: PAYMENT_METHODS[0],
      status: SALE_STATUSES.PENDING,
      observations: '',
      responsible: defaultResponsible,
    },
  });

  useEffect(() => {
    setValue('responsible', defaultResponsible);
  }, [defaultResponsible, setValue]);

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <ModalWrapper open={open} title="Crear nueva venta" onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit(onFormSubmit)}>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Cliente</span>
            <input
              type="text"
              {...register('clientName', { required: 'El cliente es obligatorio' })}
            />
            {errors.clientName && <small>{errors.clientName.message}</small>}
          </label>

          <label className={styles.field}>
            <span>Método de pago</span>
            <select {...register('paymentMethod', { required: true })}>
              {PAYMENT_METHODS.map((payment) => (
                <option key={payment} value={payment}>
                  {payment}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Estado</span>
            <select {...register('status', { required: true })}>
              {Object.values(SALE_STATUSES).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Responsable</span>
            <input type="text" {...register('responsible', { required: true })} readOnly />
          </label>

          <label className={styles.fieldFull}>
            <span>Observaciones</span>
            <textarea {...register('observations')} rows="3" />
          </label>
        </div>


        <div className={styles.actionsRow}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className={styles.primaryButton}>
            Guardar venta
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default SaleFormModal;
