import { useState } from 'react';
import { X } from 'lucide-react';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { formatMoneyCOP } from '../../../../core/utils/formatters';
import { notifications } from '../../../../core/utils/notifications';
import { getResponseMediumLabel } from './quoteWorkflow.utils';
import styles from './quoteWorkflow.module.css';

const DECISIONS = [
  { value: 'ACEPTAR', label: 'Aceptar propuesta' },
  { value: 'SOLICITAR_AJUSTE', label: 'Solicitar ajuste' },
  { value: 'RECHAZAR', label: 'Rechazar propuesta' },
];

const MEDIA = ['WHATSAPP', 'LLAMADA', 'CORREO', 'PRESENCIAL', 'OTRO'];

export const QuoteResponseModal = ({ open, quote, version, isStaff, onClose, onSubmit }) => {
  const [decision, setDecision] = useState('ACEPTAR');
  const [medio, setMedio] = useState('WHATSAPP');
  const [observaciones, setObservaciones] = useState('');
  const { isLocked: submitting, runLocked } = useAsyncLock();

  if (!open || !quote || !version) return null;

  const submit = async (event) => {
    event.preventDefault();
    if (decision === 'SOLICITAR_AJUSTE' && !observaciones.trim()) {
      notifications.warning('Indica el motivo del ajuste solicitado.');
      return;
    }

    await runLocked(async () => {
      try {
        await onSubmit({
          idVersion: version.idVersion,
          decision,
          ...(isStaff ? { medio } : {}),
          observaciones,
        });
        onClose();
      } catch (error) {
        notifications.error(error.message || 'No se pudo registrar la respuesta.');
      }
    });
  };

  return (
    <div className={styles.overlay} role="presentation">
      <section className={`${styles.modal} ${styles.responseModal}`} role="dialog" aria-modal="true" aria-labelledby="response-title">
        <header className={styles.header}>
          <div>
            <span>{isStaff ? 'Respuesta externa del cliente' : 'Tu respuesta'}</span>
            <h2 id="response-title">Cotización #{quote.idCotizacion}</h2>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} disabled={submitting} aria-label="Cerrar"><X size={19} /></button>
        </header>
        <form onSubmit={submit}>
          <div className={styles.body}>
            {isStaff && (
              <p className={styles.internalNotice}>Estás registrando esta decisión en nombre del cliente.</p>
            )}
            <div className={styles.proposalSummary}>
              <span>Propuesta oficial</span>
              <strong>{formatMoneyCOP(version.precioFinal)}</strong>
            </div>
            <label className={styles.stackField}>
              <span>Decisión *</span>
              <select value={decision} onChange={(event) => setDecision(event.target.value)}>
                {DECISIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            {isStaff && (
              <label className={styles.stackField}>
                <span>Medio de respuesta *</span>
                <select value={medio} onChange={(event) => setMedio(event.target.value)}>
                  {MEDIA.map((option) => (
                    <option key={option} value={option}>{getResponseMediumLabel(option)}</option>
                  ))}
                </select>
              </label>
            )}
            <label className={styles.stackField}>
              <span>{decision === 'SOLICITAR_AJUSTE' ? 'Motivo del ajuste *' : 'Observaciones'}</span>
              <textarea
                rows={4}
                value={observaciones}
                onChange={(event) => setObservaciones(event.target.value)}
                placeholder={decision === 'SOLICITAR_AJUSTE' ? 'Indica qué debe cambiar PIXEL...' : 'Observación opcional'}
              />
            </label>
          </div>
          <footer className={styles.footer}>
            <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={submitting}>Cancelar</button>
            <button type="submit" className={styles.primaryButton} disabled={submitting}>
              {submitting
                ? 'Registrando...'
                : isStaff && decision === 'ACEPTAR'
                  ? 'Registrar aceptación y crear pedido'
                  : 'Registrar respuesta'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};
