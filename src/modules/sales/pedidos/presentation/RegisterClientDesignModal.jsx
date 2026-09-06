import { useState } from 'react';
import { X } from 'lucide-react';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { notifications } from '../../../../core/utils/notifications';
import { validateDesignFile } from '../../../../core/utils/designFile';
import { DesignFileUploader } from '../../../../shared/components/DesignFileUploader/DesignFileUploader';

const RECEIPT_METHODS = ['WHATSAPP', 'CORREO', 'PRESENCIAL', 'OTRO'];

const RegisterClientDesignModalContent = ({
  pedido,
  detail,
  onClose,
  onSubmit,
}) => {
  const [archivo, setArchivo] = useState(null);
  const [medioRecepcion, setMedioRecepcion] = useState('WHATSAPP');
  const [observaciones, setObservaciones] = useState('');
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();

  const productName = detail.producto?.nombre || detail.descripcion || 'Producto no especificado';

  const handleSubmit = (event) => {
    event.preventDefault();
    const fileError = validateDesignFile(archivo);
    if (fileError) {
      notifications.warning(fileError);
      return;
    }
    if (!RECEIPT_METHODS.includes(medioRecepcion)) {
      notifications.warning('Selecciona el medio de recepcion.');
      return;
    }

    runLocked(async () => {
      try {
        await onSubmit({
          archivo,
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

          <DesignFileUploader
            file={archivo}
            onFileChange={setArchivo}
            disabled={isSubmitting}
            loading={isSubmitting}
          />

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
            <button type="submit" className="primary" disabled={isSubmitting || !archivo}>
              {isSubmitting ? 'Registrando...' : 'Registrar diseno recibido'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export const RegisterClientDesignModal = props => {
  if (!props.isOpen || !props.detail) return null;
  return (
    <RegisterClientDesignModalContent
      key={props.detail.idRequerimientoDiseno || props.detail.idDetallePedido}
      {...props}
    />
  );
};
