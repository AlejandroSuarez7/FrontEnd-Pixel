import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { TECHNIQUE_OPTIONS, PAYMENT_METHODS, SALE_STATUSES } from '../../domain/models/saleModel.js';
import ModalWrapper from './ModalWrapper.jsx';
import styles from './SaleFormModal.module.css';
import { formatCurrency } from '../../../../core/utils/formatters.js';

const SaleFormModal = ({ open, onClose, onSubmit, defaultResponsible }) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      clientName: '',
      paymentMethod: PAYMENT_METHODS[0],
      status: SALE_STATUSES.PENDING,
      observations: '',
      responsible: defaultResponsible,
      items: [
        {
          idProducto: '',
          nombreProducto: '',
          tecnica: TECHNIQUE_OPTIONS[0],
          quantity: 1,
          unitPrice: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    setValue('responsible', defaultResponsible);
  }, [defaultResponsible, setValue]);

  const items = watch('items');

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0),
    [items]
  );

  const tax = Number((subtotal * 0.19).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  const handleAddItem = () => {
    append({ idProducto: '', nombreProducto: '', tecnica: TECHNIQUE_OPTIONS[0], quantity: 1, unitPrice: 0 });
  };

  const onFormSubmit = (data) => {
    const normalizedItems = data.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    }));
    onSubmit({ ...data, items: normalizedItems });
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

        <div className={styles.itemsHeader}>
          <h3>Productos agregados</h3>
          <button type="button" className={styles.secondaryButton} onClick={handleAddItem}>
            + Agregar producto
          </button>
        </div>

        <div className={styles.itemsTable}>
          <div className={styles.itemRowHeader}>
            <span>Referencia</span>
            <span>Nombre</span>
            <span>Técnica</span>
            <span>Cantidad</span>
            <span>Precio</span>
            <span>Subtotal</span>
            <span>Eliminar</span>
          </div>

          {fields.map((field, index) => {
            const quantity = Number(items?.[index]?.quantity || 0);
            const unitPrice = Number(items?.[index]?.unitPrice || 0);
            const itemSubtotal = Number((quantity * unitPrice).toFixed(2));

            return (
              <div key={field.id} className={styles.itemRow}>
                <input
                  type="text"
                  placeholder="ID" 
                  {...register(`items.${index}.idProducto`, { required: 'ID es obligatorio' })}
                />
                <input
                  type="text"
                  placeholder="Nombre"
                  {...register(`items.${index}.nombreProducto`, {
                    required: 'Nombre es obligatorio',
                  })}
                />
                <select {...register(`items.${index}.tecnica`, { required: true })}>
                  {TECHNIQUE_OPTIONS.map((technique) => (
                    <option key={technique} value={technique}>
                      {technique}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  {...register(`items.${index}.quantity`, {
                    required: 'Cantidad es obligatoria',
                    min: { value: 1, message: 'Mínimo 1' },
                  })}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register(`items.${index}.unitPrice`, {
                    required: 'Precio unitario es obligatorio',
                    min: { value: 0, message: 'Debe ser mayor o igual a cero' },
                  })}
                />
                <div className={styles.itemSubtotal}>{formatCurrency(itemSubtotal)}</div>
                <button type="button" className={styles.removeButton} onClick={() => remove(index)}>
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        <div className={styles.totalSummary}>
          <div>
            <p>Subtotal</p>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
          <div>
            <p>IVA 19%</p>
            <strong>{formatCurrency(tax)}</strong>
          </div>
          <div>
            <p>Total</p>
            <strong>{formatCurrency(total)}</strong>
          </div>
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
