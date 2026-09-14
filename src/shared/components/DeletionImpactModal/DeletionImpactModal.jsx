import { AlertTriangle, X } from 'lucide-react';
import './DeletionImpactModal.css';

const TYPE_LABELS = {
  usuarios: ['usuario', 'usuarios'],
  clientes: ['cliente', 'clientes'],
  cotizaciones: ['cotización', 'cotizaciones'],
  pedidos: ['pedido', 'pedidos'],
  disenos: ['diseño', 'diseños'],
  abonos: ['abono', 'abonos'],
  compras: ['compra', 'compras'],
  productos: ['producto', 'productos'],
  tecnicas: ['técnica', 'técnicas'],
  tarifas: ['tarifa', 'tarifas'],
  categorias: ['categoría', 'categorías'],
};

const ACTION_LABELS = {
  ELIMINAR: ['Se eliminará', 'Se eliminarán'],
  DESVINCULAR: ['Se desvinculará', 'Se desvincularán'],
  ACTUALIZAR: ['Se actualizará', 'Se actualizarán'],
};

const normalizeKey = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z]/g, '');

const describeAffectedGroup = (group) => {
  const quantity = Math.max(0, Number(group?.cantidad) || 0);
  const plural = quantity !== 1;
  const action = ACTION_LABELS[group?.accion] || ['Se modificará', 'Se modificarán'];
  const type = TYPE_LABELS[normalizeKey(group?.tipo)] || ['registro relacionado', 'registros relacionados'];
  return `${action[plural ? 1 : 0]} ${quantity} ${type[plural ? 1 : 0]}${TYPE_LABELS[normalizeKey(group?.tipo)] ? ' asociado' + (plural ? 's' : '') : ''}`;
};

const ImpactDetails = ({ impact, indirectWarning }) => {
  const totalAffected = Math.max(0, Number(impact?.totalAfectados) || 0);
  const groups = Array.isArray(impact?.afectados) ? impact.afectados : [];

  if (totalAffected === 0) {
    return (
      <div className="deletion-impact-empty">
        No se encontraron registros relacionados que vayan a ser afectados.
      </div>
    );
  }

  return (
    <>
      <p className="deletion-impact-lead">
        Esta acción también tendrá consecuencias sobre otros registros.
      </p>
      <div className="deletion-impact-groups">
        {groups.map((group, index) => (
          <article className="deletion-impact-group" key={`${normalizeKey(group?.tipo) || 'grupo'}-${index}`}>
            <strong>{describeAffectedGroup(group)}</strong>
            {Array.isArray(group?.registros) && group.registros.length > 0 && (
              <ul>
                {group.registros.map((record, recordIndex) => (
                  <li key={`${record?.nombre || 'registro'}-${recordIndex}`}>
                    {record?.nombre || 'Registro relacionado'}
                  </li>
                ))}
              </ul>
            )}
            {Number(group?.registrosOmitidos) > 0 && (
              <span className="deletion-impact-omitted">
                + {Number(group.registrosOmitidos)} registros adicionales
              </span>
            )}
          </article>
        ))}
      </div>
      {indirectWarning && <p className="deletion-impact-note">{indirectWarning}</p>}
    </>
  );
};

export const DeletionImpactModal = ({
  isOpen,
  entityLabel,
  entityName,
  stage = 'impact',
  impact,
  loadingImpact = false,
  impactError = '',
  impactErrorDetail = '',
  deleteError = '',
  deleting = false,
  indirectWarning = 'Algunas relaciones asociadas también pueden eliminarse o quedar desvinculadas.',
  onCancel,
  onRetryImpact,
  onContinue,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const canDelete = impact?.puedeEliminar === true;
  const totalAffected = Math.max(0, Number(impact?.totalAfectados) || 0);
  const title = stage === 'confirm' ? 'Confirmar eliminación' : `Eliminar ${entityLabel}`;

  return (
    <div className="deletion-impact-overlay" role="presentation">
      <section
        className="deletion-impact-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deletion-impact-title"
      >
        <header className="deletion-impact-header">
          <span className="deletion-impact-icon" aria-hidden="true">
            <AlertTriangle size={22} />
          </span>
          <div>
            <h2 id="deletion-impact-title">{title}</h2>
            {stage === 'impact' && (
              <p>Estás a punto de eliminar el {entityLabel} «{entityName}».</p>
            )}
          </div>
          <button
            type="button"
            className="deletion-impact-close"
            onClick={onCancel}
            disabled={deleting}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="deletion-impact-body">
          {stage === 'impact' ? (
            <>
              {loadingImpact && (
                <div className="deletion-impact-status" role="status">
                  Verificando la información relacionada...
                </div>
              )}

              {!loadingImpact && impactError && (
                <div className="deletion-impact-error" role="alert">
                  <strong>{impactError}</strong>
                  {impactErrorDetail && <span>{impactErrorDetail}</span>}
                </div>
              )}

              {!loadingImpact && !impactError && impact && (
                <>
                  <ImpactDetails impact={impact} indirectWarning={indirectWarning} />
                  {!canDelete && (
                    <div className="deletion-impact-blocked" role="alert">
                      <strong>No se puede eliminar este registro.</strong>
                      {(impact.motivoBloqueo || impact.explicacion) && (
                        <span>{impact.motivoBloqueo || impact.explicacion}</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="deletion-impact-final">
              <strong>Esta acción no se puede deshacer.</strong>
              {totalAffected > 0 && (
                <p>También se verán afectados {totalAffected} registros relacionados.</p>
              )}
              <p>¿Deseas eliminar definitivamente el {entityLabel} «{entityName}»?</p>
              {deleteError && <div className="deletion-impact-delete-error" role="alert">{deleteError}</div>}
            </div>
          )}
        </div>

        <footer className="deletion-impact-footer">
          <button type="button" className="deletion-impact-cancel" onClick={onCancel} disabled={deleting}>
            {stage === 'impact' && impact && !canDelete ? 'Entendido' : 'Cancelar'}
          </button>
          {stage === 'impact' && impactError && !loadingImpact && (
            <button type="button" className="deletion-impact-continue" onClick={onRetryImpact}>
              Reintentar
            </button>
          )}
          {stage === 'impact' && canDelete && !impactError && !loadingImpact && (
            <button type="button" className="deletion-impact-continue" onClick={onContinue}>
              Continuar
            </button>
          )}
          {stage === 'confirm' && (
            <button
              type="button"
              className="deletion-impact-confirm"
              onClick={onConfirm}
              disabled={deleting}
            >
              {deleting ? 'Eliminando...' : 'Sí, eliminar definitivamente'}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
};
