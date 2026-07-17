import { useEffect, useState } from 'react';
import { notifications } from '../../../core/utils/notifications';
import styles from '../../users/presentation/users.module.css';

const emptyRange = { cantidadMin: 1, descuentoPorcentaje: 0, estado: true };

const parseDecimal = (value) => Number(String(value).replace(',', '.'));

const normalizeRanges = (rangos) => rangos.map(rango => ({
  ...rango,
  cantidadMin: Number(rango.cantidadMin),
  descuentoPorcentaje: parseDecimal(rango.descuentoPorcentaje),
}));

export const ProductModal = ({ isOpen, onClose, onSubmit, onSaveRanges, product, canManagePrices, categories = [] }) => {
  const [form, setForm] = useState({
    nombre: '',
    idCategoriaProducto: '',
    descripcion: '',
    precioBase: '',
    estado: true,
  });
  const [rangos, setRangos] = useState([emptyRange]);
  const isEditing = Boolean(product);

  useEffect(() => {
    if (!isOpen) return;

    setForm({
      nombre: product?.nombre || '',
      idCategoriaProducto: product?.idCategoriaProducto || '',
      descripcion: product?.descripcion || '',
      precioBase: product?.precioBase || '',
      estado: product?.estado ?? true,
    });
    setRangos(product?.rangos?.length ? product.rangos.map(rango => ({
      cantidadMin: rango.cantidadMin,
      descuentoPorcentaje: rango.descuentoPorcentaje,
      estado: rango.estado ?? true,
    })) : [emptyRange]);
  }, [isOpen, product]);

  if (!isOpen) return null;

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateRange = (index, field, value) => {
    setRangos(prev => prev.map((rango, rangoIndex) => (
      rangoIndex === index ? { ...rango, [field]: value } : rango
    )));
  };

  const addRange = () => setRangos(prev => [...prev, { ...emptyRange }]);
  const removeRange = (index) => setRangos(prev => prev.length > 1 ? prev.filter((_, itemIndex) => itemIndex !== index) : prev);

  const validate = () => {
    if (form.nombre.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (!form.idCategoriaProducto) return 'Selecciona una categoria activa.';
    if (Number(form.precioBase) <= 0) return 'El precio base debe ser mayor a 0.';
    if (canManagePrices) {
      const invalidRange = rangos.find(rango =>
        Number(rango.cantidadMin) <= 0 ||
        Number.isNaN(parseDecimal(rango.descuentoPorcentaje)) ||
        parseDecimal(rango.descuentoPorcentaje) < 0 ||
        parseDecimal(rango.descuentoPorcentaje) > 100
      );
      if (invalidRange) return 'Los rangos deben tener cantidad positiva y descuento entre 0 y 100.';
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      notifications.warning(validationError);
      return;
    }

    const savedProduct = await onSubmit({
      ...form,
      precioBase: Number(form.precioBase),
      estado: Boolean(form.estado),
    });

    const idProducto = product?.idProducto || savedProduct?.idProducto;

    if (canManagePrices && idProducto) {
      await onSaveRanges(idProducto, normalizeRanges(rangos));
    } else {
      onClose();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalMd}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{isEditing ? 'Editar producto cotizable' : 'Nuevo producto cotizable'}</h3>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn}>X</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Nombre *</label>
            <input className={styles.inputField} value={form.nombre} onChange={event => updateField('nombre', event.target.value)} required />
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Categoria *</label>
              <select
                className={styles.selectField}
                value={form.idCategoriaProducto}
                onChange={event => updateField('idCategoriaProducto', event.target.value)}
                required
              >
                <option value="">Selecciona una categoria</option>
                {categories.map(category => (
                  <option key={category.idCategoriaProducto} value={category.idCategoriaProducto}>
                    {category.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Precio base *</label>
              <input type="number" min="1" className={styles.inputField} value={form.precioBase} onChange={event => updateField('precioBase', event.target.value)} required />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Estado</label>
              <select className={styles.selectField} value={String(form.estado)} onChange={event => updateField('estado', event.target.value === 'true')}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Descripcion</label>
            <textarea className={styles.inputField} value={form.descripcion} onChange={event => updateField('descripcion', event.target.value)} rows={3} />
          </div>

          {canManagePrices && (
            <div className={styles.rangeSection}>
              <div className={styles.rangeTitleRow}>
                <div>
                  <label className={styles.inputLabel}>Rangos de descuento</label>
                  <p className={styles.rangeHelp}>Define desde que cantidad aplica cada descuento. Ej: 12 unidades = 7,14%.</p>
                </div>
                <button type="button" className={styles.btnSecondary} onClick={addRange}>Agregar rango</button>
              </div>

              <div className={styles.rangeHeader}>
                <span>Cantidad minima</span>
                <span>Descuento %</span>
                <span>Estado</span>
                <span>Accion</span>
              </div>

              {rangos.map((rango, index) => (
                <div className={styles.rangeRow} key={`rango-${index}`}>
                  <input type="number" min="1" step="1" className={styles.inputField} value={rango.cantidadMin} onChange={event => updateRange(index, 'cantidadMin', event.target.value)} placeholder="Ej: 12" />
                  <input type="text" inputMode="decimal" className={styles.inputField} value={rango.descuentoPorcentaje} onChange={event => updateRange(index, 'descuentoPorcentaje', event.target.value)} placeholder="Ej: 7,14" />
                  <select className={styles.selectField} value={String(rango.estado)} onChange={event => updateRange(index, 'estado', event.target.value === 'true')}>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                  <button type="button" className={styles.btnSecondary} onClick={() => removeRange(index)} disabled={rangos.length === 1}>Quitar</button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary}>{isEditing ? 'Guardar cambios' : 'Crear producto'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
