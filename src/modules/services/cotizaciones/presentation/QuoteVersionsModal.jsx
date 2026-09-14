import { useEffect, useState } from 'react';
import { Clock3, X } from 'lucide-react';
import { formatMoneyCOP } from '../../../../core/utils/formatters';
import { formatCalendarDate } from '../../../../core/utils/fechaFormato';
import { QuoteApiRepository } from '../infrastructure/quote.repository';
import {
  getProposalStatusLabel,
  getQuoteDecisionLabel,
  getResponseMediumLabel,
} from './quoteWorkflow.utils';
import styles from './quoteWorkflow.module.css';

const repository = new QuoteApiRepository();

export const QuoteVersionsModal = ({ open, quote, onClose }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !quote?.idCotizacion) return undefined;
    const controller = new AbortController();
    repository.listVersions(quote.idCotizacion, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setVersions(data);
      })
      .catch((requestError) => {
        if (!controller.signal.aborted && requestError?.code !== 'ERR_CANCELED') {
          setError(requestError.message || 'No se pudieron cargar las propuestas.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [open, quote?.idCotizacion]);

  if (!open || !quote) return null;

  return (
    <div className={styles.overlay} role="presentation">
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="versions-title">
        <header className={styles.header}>
          <div>
            <span>Historial de propuestas</span>
            <h2 id="versions-title">Cotización #{quote.idCotizacion}</h2>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Cerrar"><X size={19} /></button>
        </header>
        <div className={styles.body}>
          {loading ? (
            <p className={styles.stateMessage}>Cargando propuestas...</p>
          ) : error ? (
            <p className={styles.errorMessage}>{error}</p>
          ) : versions.length === 0 ? (
            <p className={styles.stateMessage}>Esta cotización aún no tiene propuestas enviadas.</p>
          ) : (
            <div className={styles.versionList}>
              {versions.map((version) => (
                <article className={`${styles.versionCard} ${version.esVigente ? styles.currentVersion : ''}`} key={version.idVersion}>
                  <div>
                    <span>{version.esVigente ? 'Propuesta vigente' : 'Propuesta historica'}</span>
                    <strong>{formatMoneyCOP(version.precioFinal)}</strong>
                  </div>
                  <div className={styles.versionMeta}>
                    <span className={styles.statusChip}>{getProposalStatusLabel(version.estado)}</span>
                    {version.esVigente && <span className={styles.currentChip}>Vigente</span>}
                    <small><Clock3 size={14} /> Enviada: {formatCalendarDate(version.enviadaAt)}</small>
                    <small>Válida hasta: {formatCalendarDate(version.validaHasta)}</small>
                  </div>
                  {version.respuesta && (
                    <div className={styles.responseSummary}>
                      <strong>{getQuoteDecisionLabel(version.respuesta.decision)}</strong>
                      <span>
                        {getResponseMediumLabel(version.respuesta.medio)}
                        {' - '}
                        {formatCalendarDate(version.respuesta.fechaRespuesta)}
                      </span>
                      {version.respuesta.usuarioInterno?.nombre && <small>Registrada por {version.respuesta.usuarioInterno.nombre}</small>}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
        <footer className={styles.footer}>
          <button type="button" className={styles.primaryButton} onClick={onClose}>Cerrar</button>
        </footer>
      </section>
    </div>
  );
};
