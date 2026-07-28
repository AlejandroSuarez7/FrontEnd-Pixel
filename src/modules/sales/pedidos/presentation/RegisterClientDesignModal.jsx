/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { notifications } from '../../../../core/utils/notifications';

const RECEIPT_METHODS = ['WHATSAPP', 'CORREO', 'PRESENCIAL', 'OTRO'];

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const RegisterClientDesignModal = ({
  isOpen,
  pedido,
  detail,
  onClose,
  onSubmit,
}) => {
  const [archivoDisenoInicialUrl, setArchivoDisenoInicialUrl] = useState('');
  const [medioRecepcion, setMedioRecepcion] = useState('WHATSAPP');
  const [observaciones, setObservaciones] = useState('');
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();

  useEffect(() => {
    if (!isOpen) return;
    setArchivoDisenoInicialUrl(detail?.archivoDisenoInicialUrl || '');
    setMedioRecepcion('WHATSAPP');
    setObservaciones('');
  }, [detail?.archivoDisenoInicialUrl, detail?.idDetallePedido, isOpen]);

  if (!isOpen || !detail) return null;

  const productName = detail.producto?.nombre || detail.descripcion || 'Producto no especificado';

  const handleSubmit = (event) => {
    event.preventDefault();
    const url = archivoDisenoInicialUrl.trim();
    if (!isHttpUrl(url)) {
      notifications.warning('Ingresa una URL valida que comience por http:// o https://.');
      return;
    }
    if (!RECEIPT_METHODS.includes(medioRecepcion)) {
      notifications.warning('Selecciona el medio de recepcion.');
      return;
    }

    runLocked(async () => {
      try {
        await onSubmit({
          archivoDisenoInicialUrl: url,
          medioRecepcion,
          observaciones,
        });
      } catch (error) {
        if (!error.wasNotified) {
          notifications.error(error.message || 'No se pudo registrar el diseno recibido.');
        }
      }
    });
  };

  return (
    <div className="expediente-modal-overlay">
      <div className="expediente-client-design-modal" role="dialog" aria-modal="true" aria-labelledby="client-design-title">
        <header>
          <div>
            <span>Pedido #{pedido?.idPedido}</span>
            <h3 id="client-design-title">Registrar diseno recibido</h3>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <div className="expediente-client-design-context">
            <div><span>Producto</span><strong>{productName}</strong></div>
            <div><span>Cantidad</span><strong>{Number(detail.cantidad || 0).toLocaleString('es-CO')}</strong></div>
          </div>

          <label>
            <span>URL del diseno *</span>
            <input
              type="url"
              value={archivoDisenoInicialUrl}
              onChange={event => setArchivoDisenoInicialUrl(event.target.value)}
              placeholder="https://..."
              maxLength={500}
              disabled={isSubmitting}
              required
            />
          </label>

          <label>
            <span>Medio de recepcion *</span>
            <select
              value={medioRecepcion}
              onChange={event => setMedioRecepcion(event.target.value)}
              disabled={isSubmitting}
              required
            >
              {RECEIPT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
            </select>
          </label>

          <label>
            <span>Observaciones</span>
            <textarea
              value={observaciones}
              onChange={event => setObservaciones(event.target.value)}
              placeholder="Ej: Recibido por WhatsApp."
              maxLength={500}
              rows={3}
              disabled={isSubmitting}
            />
          </label>

          <p>El diseno quedara recibido y pendiente de revision. No se aprobara automaticamente.</p>

          <footer>
            <button type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Registrar diseno recibido'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
