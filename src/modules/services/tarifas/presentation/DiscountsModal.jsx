import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { notifications } from '../../../../core/utils/notifications';
import { tariffRepository } from '../infrastructure/tariff.repository';
import styles from './tariffs.module.css';

const emptyDiscount = () => ({ cantidadMinima: 1, porcentaje: '0', estado: true });
const parsePercentage = (value) => Number(String(value).replace(',', '.'));

export const DiscountsModal = ({ open, technique, onClose }) => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isLocked: saving, runLocked } = useAsyncLock();

  useEffect(() => {
    if (!open || !technique?.idTecnica) return undefined;
    const controller = new AbortController();

    tariffRepository.listDiscounts(technique.idTecnica, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setDiscounts(data);
      })
      .catch((requestError) => {
        if (!controller.signal.aborted && requestError?.code !== 'ERR_CANCELED') {
          setError(requestError.message || 'No se pudieron cargar los descuentos.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [open, technique?.idTecnica]);

  if (!open) return null;

  const update = (index, field, value) => {
    setDiscounts((current) => current.map((discount, itemIndex) => (
      itemIndex === index ? { ...discount, [field]: value } : discount
    )));
  };

  const save = async () => {
    const quantities = discounts.map((discount) => Number(discount.cantidadMinima));
    const invalid = discounts.some((discount) => (
      !Number.isInteger(Number(discount.cantidadMinima))
      || Number(discount.cantidadMinima) <= 0
      || !Number.isFinite(parsePercentage(discount.porcentaje))
      || parsePercentage(discount.porcentaje) < 0
      || parsePercentage(discount.porcentaje) > 100
    ));

    if (invalid) {
      notifications.warning('Usa cantidades positivas y porcentajes entre 0 y 100.');
      return;
    }
    if (new Set(quantities).size !== quantities.length) {
      notifications.warning('No puedes repetir una cantidad mínima.');
      return;
    }

    await runLocked(async () => {
      try {
        await tariffRepository.replaceDiscounts(technique.idTecnica, discounts);
        notifications.success('Descuentos de la técnica actualizados.');
        onClose();
      } catch (requestError) {
        notifications.error(requestError.message || 'No se pudieron guardar los descuentos.');
      }
    });
  };

  return (
    <div className={styles.overlay} role="presentation">
      <section className={`${styles.modal} ${styles.modalWide}`} role="dialog" aria-modal="true" aria-labelledby="discount-title">
        <header className={styles.modalHeader}>
          <div>
            <span>Descuentos por cantidad</span>
            <h2 id="discount-title">{technique?.nombre || 'Técnica'}</h2>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} disabled={saving} aria-label="Cerrar">
            <X size={19} />
          </button>
        </header>

        <div className={styles.discountIntro}>
          <p>El descuento se aplica desde la cantidad mínima indicada y pertenece a esta técnica.</p>
          <button type="button" className={styles.secondaryButton} onClick={() => setDiscounts((current) => [...current, emptyDiscount()])} disabled={saving}>
            <Plus size={16} /> Agregar descuento
          </button>
        </div>

        {loading ? (
          <p className={styles.stateMessage}>Cargando descuentos...</p>
        ) : error ? (
          <p className={styles.errorMessage}>{error}</p>
        ) : (
          <div className={styles.discountList}>
            {discounts.length === 0 && <p className={styles.stateMessage}>Esta técnica no tiene descuentos configurados.</p>}
            {discounts.map((discount, index) => (
              <div className={styles.discountRow} key={discount.idDescuento || `new-${index}`}>
                <label>
                  <span>Cantidad mínima</span>
                  <input type="number" min="1" step="1" value={discount.cantidadMinima} onChange={(event) => update(index, 'cantidadMinima', event.target.value)} />
                </label>
                <label>
                  <span>Descuento %</span>
                  <input inputMode="decimal" value={discount.porcentaje} onChange={(event) => update(index, 'porcentaje', event.target.value)} />
                </label>
                <label>
                  <span>Estado</span>
                  <select value={String(discount.estado)} onChange={(event) => update(index, 'estado', event.target.value === 'true')}>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </label>
                <button type="button" className={styles.removeButton} onClick={() => setDiscounts((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={saving} aria-label={`Quitar descuento ${index + 1}`}>
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        )}

        <footer className={styles.modalFooter}>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="button" className={styles.primaryButton} onClick={save} disabled={loading || saving}>
            {saving ? 'Guardando...' : 'Guardar descuentos'}
          </button>
        </footer>
      </section>
    </div>
  );
};
