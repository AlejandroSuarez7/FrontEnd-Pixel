import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAsyncLock } from '../../../core/hooks/useAsyncLock';
import { notifications } from '../../../core/utils/notifications';
import {
  createDiscountRange,
  hasDiscountRangeErrors,
  normalizeDiscountRanges,
  validateDiscountRanges,
} from '../domain/productDiscountRanges';
import styles from '../../users/presentation/users.module.css';

const getInitialForm = (product) => ({
  nombre: product?.nombre || '',
  idCategoriaProducto: product?.idCategoriaProducto || '',
  descripcion: product?.descripcion || '',
  requiereDiseno: product?.requiereDiseno ?? true,
  estado: product?.estado ?? true,
});

const getInitialRanges = (product, canManageDiscounts) => {
  if (!canManageDiscounts) return [];
  const embedded = normalizeDiscountRanges(product?.rangosDescuento || product?.rangos || []);
  if (product) return embedded;
  return [createDiscountRange({ cantidadMinima: 1, porcentaje: 0 })];
};

export const ProductModal = ({
  isOpen,
  onClose,
  onSubmit,
  onLoadRanges,
  product,
  categories = [],
  canManageDiscounts = false,
}) => {
  const [form, setForm] = useState(() => getInitialForm(product));
  const [ranges, setRanges] = useState(() => getInitialRanges(product, canManageDiscounts));
  const [rangeErrors, setRangeErrors] = useState({});
  const [loadingRanges, setLoadingRanges] = useState(Boolean(product && canManageDiscounts));
  const [persistedProductId, setPersistedProductId] = useState(product?.idProducto || null);
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();
  const isEditing = Boolean(product);

  useEffect(() => {
    if (!product?.idProducto || !canManageDiscounts || !onLoadRanges) return undefined;
    const controller = new AbortController();

    onLoadRanges(product.idProducto, { signal: controller.signal })
      .then((loadedRanges) => {
        if (!controller.signal.aborted) setRanges(normalizeDiscountRanges(loadedRanges));
      })
      .catch((error) => {
        if (!controller.signal.aborted && error?.code !== 'ERR_CANCELED') {
          notifications.error(error.message || 'No se pudieron cargar los rangos de descuento.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingRanges(false);
      });

    return () => controller.abort();
  }, [canManageDiscounts, onLoadRanges, product?.idProducto]);

  if (!isOpen) return null;

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const updateRange = (localId, field, value) => {
    setRanges((current) => current.map((range) => (
      range.localId === localId ? { ...range, [field]: value } : range
    )));
    setRangeErrors({});
  };

  const validate = () => {
    if (form.nombre.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (!form.idCategoriaProducto) return 'Selecciona una categoría activa.';

    if (canManageDiscounts) {
      const errors = validateDiscountRanges(ranges);
      setRangeErrors(errors);
      if (hasDiscountRangeErrors(errors)) return 'Revisa los rangos de descuento.';
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await runLocked(async () => {
      const validationError = validate();
      if (validationError) {
        notifications.warning(validationError);
        return;
      }

      try {
        const savedProduct = await onSubmit({
          product: {
            ...form,
            requiereDiseno: Boolean(form.requiereDiseno),
            estado: Boolean(form.estado),
          },
          ranges,
          persistedProductId,
        });
        if (savedProduct?.idProducto) setPersistedProductId(savedProduct.idProducto);
        onClose();
      } catch (error) {
        if (error.persistedProductId) setPersistedProductId(error.persistedProductId);
        if (error.partial) {
          notifications.warning(error.message);
        } else {
          notifications.error(error.message || 'No se pudo guardar el producto.');
        }
      }
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalMd}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEditing ? 'Editar producto cotizable' : 'Nuevo producto cotizable'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={styles.modalCloseBtn}
            disabled={isSubmitting}
            aria-label="Cerrar"
          >
            X
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="product-name">Nombre *</label>
            <input
              id="product-name"
              className={styles.inputField}
              value={form.nombre}
              onChange={(event) => updateField('nombre', event.target.value)}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="product-category">Categoría *</label>
              <select
                id="product-category"
                className={styles.selectField}
                value={form.idCategoriaProducto}
                onChange={(event) => updateField('idCategoriaProducto', event.target.value)}
                required
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => (
                  <option key={category.idCategoriaProducto} value={category.idCategoriaProducto}>
                    {category.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="product-requires-design">
                Requiere diseño
              </label>
              <select
                id="product-requires-design"
                className={styles.selectField}
                value={String(form.requiereDiseno)}
                onChange={(event) => updateField('requiereDiseno', event.target.value === 'true')}
              >
                <option value="true">Sí, requiere diseño</option>
                <option value="false">No requiere diseño</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="product-status">Estado</label>
              <select
                id="product-status"
                className={styles.selectField}
                value={String(form.estado)}
                onChange={(event) => updateField('estado', event.target.value === 'true')}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="product-description">Descripción</label>
            <textarea
              id="product-description"
              className={styles.inputField}
              value={form.descripcion}
              onChange={(event) => updateField('descripcion', event.target.value)}
              rows={3}
            />
          </div>

          {canManageDiscounts && (
            <section className={styles.rangeSection}>
              <div className={styles.rangeTitleRow}>
                <div>
                  <strong>Rangos de descuento por cantidad</strong>
                  <p className={styles.rangeHelp}>
                    El descuento se aplica según la cantidad solicitada de este producto.
                    Los precios se configuran desde Gestión de Servicios.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setRanges((current) => [...current, createDiscountRange()])}
                  disabled={isSubmitting || loadingRanges}
                >
                  <Plus size={15} /> Agregar rango
                </button>
              </div>

              {loadingRanges ? (
                <p className={styles.rangeHelp}>Cargando rangos...</p>
              ) : ranges.length === 0 ? (
                <p className={styles.rangeHelp}>Este producto no tiene rangos configurados.</p>
              ) : (
                <>
                  <div className={styles.rangeHeader} aria-hidden="true">
                    <span>Cantidad mínima</span>
                    <span>Descuento %</span>
                    <span>Estado</span>
                    <span>Acción</span>
                  </div>
                  {ranges.map((range, index) => (
                    <div className={styles.rangeRow} key={range.localId}>
                      <label>
                        <span className={styles.rangeMobileLabel}>Cantidad mínima</span>
                        <input
                          className={styles.inputField}
                          type="number"
                          min="1"
                          step="1"
                          value={range.cantidadMinima}
                          onChange={(event) => updateRange(range.localId, 'cantidadMinima', event.target.value)}
                          aria-label={`Cantidad mínima rango ${index + 1}`}
                          disabled={isSubmitting}
                        />
                        {rangeErrors[index]?.cantidadMinima && (
                          <small className={styles.rangeFieldError}>
                            {rangeErrors[index].cantidadMinima}
                          </small>
                        )}
                      </label>
                      <label>
                        <span className={styles.rangeMobileLabel}>Descuento %</span>
                        <input
                          className={styles.inputField}
                          inputMode="decimal"
                          value={range.porcentaje}
                          onChange={(event) => updateRange(range.localId, 'porcentaje', event.target.value)}
                          aria-label={`Descuento rango ${index + 1}`}
                          disabled={isSubmitting}
                        />
                        {rangeErrors[index]?.porcentaje && (
                          <small className={styles.rangeFieldError}>
                            {rangeErrors[index].porcentaje}
                          </small>
                        )}
                      </label>
                      <label>
                        <span className={styles.rangeMobileLabel}>Estado</span>
                        <select
                          className={styles.selectField}
                          value={String(range.estado)}
                          onChange={(event) => updateRange(range.localId, 'estado', event.target.value === 'true')}
                          disabled={isSubmitting}
                        >
                          <option value="true">Activo</option>
                          <option value="false">Inactivo</option>
                        </select>
                      </label>
                      <button
                        type="button"
                        className={styles.rangeRemoveButton}
                        onClick={() => {
                          setRanges((current) => current.filter((item) => item.localId !== range.localId));
                          setRangeErrors({});
                        }}
                        disabled={isSubmitting}
                        aria-label={`Quitar rango ${index + 1}`}
                      >
                        <Trash2 size={15} /> Quitar
                      </button>
                    </div>
                  ))}
                </>
              )}
            </section>
          )}

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnSecondary}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={isSubmitting || loadingRanges}
            >
              {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
