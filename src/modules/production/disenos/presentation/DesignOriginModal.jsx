import { useState } from 'react';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { notifications } from '../../../../core/utils/notifications';
import './DisenosPage.css';

const ORIGIN_OPTIONS = [
  {
    value: 'CLIENTE',
    title: 'El cliente entrega el diseño',
    description: 'El requerimiento quedara pendiente de recibir el archivo del cliente.',
  },
  {
    value: 'PIXEL',
    title: 'PIXEL crea el diseño',
    description: 'El equipo PIXEL podrá crear y registrar el diseño para este requerimiento.',
  },
];

const DesignOriginModalContent = ({ requirement, pedido, onClose, onSubmit }) => {
  const [origin, setOrigin] = useState('');
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();

  const handleSubmit = async event => {
    event.preventDefault();
    await runLocked(async () => {
      if (!origin) return;
      try {
        await onSubmit(origin);
      } catch (error) {
        notifications.error(error.message || 'No pudimos guardar el cambio. Intenta nuevamente.');
      }
    });
  };

  return (
    <div className="disenos-overlay" role="presentation">
      <div className="disenos-origin-modal" role="dialog" aria-modal="true" aria-labelledby="design-origin-title">
        <header className="disenos-modal-header">
          <div>
            <h3 id="design-origin-title" className="disenos-modal-title">Definir quién entrega el diseño</h3>
            <p className="disenos-modal-subtitle">
              Pedido #{pedido?.idPedido || requirement.idPedido}
            </p>
          </div>
          <button
            type="button"
            className="disenos-modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar"
          >
            x
          </button>
        </header>

        <form onSubmit={handleSubmit} className="disenos-origin-form">
          <p className="disenos-origin-help">
            Elige quién se encargará de entregar este diseño. Esta decisión actualizará las acciones disponibles en el expediente.
          </p>

          <div className="disenos-origin-options" role="radiogroup" aria-label="Quién entrega el diseño">
            {ORIGIN_OPTIONS.map(option => (
              <label
                key={option.value}
                className={`disenos-origin-option ${origin === option.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="design-origin"
                  value={option.value}
                  checked={origin === option.value}
                  onChange={event => setOrigin(event.target.value)}
                  disabled={isSubmitting}
                />
                <span>
                  <strong>{option.title}</strong>
                  <small>{option.description}</small>
                </span>
              </label>
            ))}
          </div>

          <footer className="disenos-modal-footer">
            <button type="button" className="disenos-btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="disenos-btn-primary" disabled={isSubmitting || !origin}>
              {isSubmitting ? 'Guardando...' : 'Guardar seleccion'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export const DesignOriginModal = props => {
  if (!props.isOpen || !props.requirement) return null;
  return <DesignOriginModalContent {...props} />;
};
