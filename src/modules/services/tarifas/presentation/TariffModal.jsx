import { useState } from 'react';
import { X } from 'lucide-react';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { notifications } from '../../../../core/utils/notifications';
import styles from './tariffs.module.css';

const initialForm = {
  idTecnica: '',
  anchoHastaCm: '',
  altoHastaCm: '',
  precioUnitario: '',
  estado: true,
};

const positiveDecimal = (value) => {
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0;
};

const getInitialForm = (tariff) => (tariff ? {
  idTecnica: tariff.idTecnica,
  anchoHastaCm: tariff.anchoHastaCm,
  altoHastaCm: tariff.altoHastaCm,
  precioUnitario: tariff.precioUnitario,
  estado: tariff.estado,
} : initialForm);

export const TariffModal = ({ open, tariff, techniques, onClose, onSubmit }) => {
  const [form, setForm] = useState(() => getInitialForm(tariff));
  const { isLocked: saving, runLocked } = useAsyncLock();

  if (!open) return null;

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.idTecnica) {
      notifications.warning('Selecciona una técnica.');
      return;
    }
    if (!positiveDecimal(form.anchoHastaCm) || !positiveDecimal(form.altoHastaCm)) {
      notifications.warning('El ancho y el alto deben ser mayores a 0.');
      return;
    }
    if (!positiveDecimal(form.precioUnitario)) {
      notifications.warning('El precio unitario debe ser mayor a 0.');
      return;
    }

    await runLocked(async () => {
      try {
        await onSubmit(form);
        onClose();
      } catch (error) {
        notifications.error(error.message || 'No se pudo guardar la tarifa.');
      }
    });
  };

  return (
    <div className={styles.overlay} role="presentation">
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="tariff-title">
        <header className={styles.modalHeader}>
          <div>
            <span>Configuración de precios</span>
            <h2 id="tariff-title">{tariff ? 'Editar tarifa' : 'Nueva tarifa'}</h2>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} disabled={saving} aria-label="Cerrar">
            <X size={19} />
          </button>
        </header>

        <form onSubmit={submit}>
          <div className={styles.formGrid}>
            <label className={styles.fieldWide}>
              <span>Técnica *</span>
              <select value={form.idTecnica} onChange={(event) => update('idTecnica', event.target.value)} disabled={Boolean(tariff) || saving}>
                <option value="">Selecciona una técnica</option>
                {techniques.map((technique) => (
                  <option key={technique.idTecnica} value={technique.idTecnica}>{technique.nombre}</option>
                ))}
              </select>
              {tariff && <small>La técnica no cambia al editar una tarifa.</small>}
            </label>
            <label>
              <span>Ancho máximo (cm) *</span>
              <input inputMode="decimal" value={form.anchoHastaCm} onChange={(event) => update('anchoHastaCm', event.target.value)} placeholder="Ej: 20" />
            </label>
            <label>
              <span>Alto máximo (cm) *</span>
              <input inputMode="decimal" value={form.altoHastaCm} onChange={(event) => update('altoHastaCm', event.target.value)} placeholder="Ej: 30" />
            </label>
            <label>
              <span>Precio unitario (COP) *</span>
              <input inputMode="decimal" value={form.precioUnitario} onChange={(event) => update('precioUnitario', event.target.value)} placeholder="Ej: 12500" />
            </label>
            <label>
              <span>Estado</span>
              <select value={String(form.estado)} onChange={(event) => update('estado', event.target.value === 'true')}>
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </select>
            </label>
          </div>

          <footer className={styles.modalFooter}>
            <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className={styles.primaryButton} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar tarifa'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};
