import {
  Copy,
  FileText,
  Layers3,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react';
import {
  DESIGN_OPTIONS,
  MAX_PUBLIC_QUOTE_ITEMS,
  SUPPLY_OPTIONS,
  getItemName,
  getTechnique,
} from '../domain/publicQuoteBuilder';
import { getStampSizeSummary } from '../domain/stampTariffs';

const labelFor = (options, value, fallback) => (
  options.find(([key]) => key === value)?.[1] || fallback
);

const formatLocation = (value) => {
  const normalized = String(value || 'Ubicación por definir')
    .replaceAll('_', ' ')
    .toLocaleLowerCase('es-CO');
  return normalized.charAt(0).toLocaleUpperCase('es-CO') + normalized.slice(1);
};

const stampSummary = (stamp, techniques) => {
  const technique = getTechnique(techniques, stamp.idTecnica);
  if (!technique) return 'Servicio y medidas por definir';

  const location = formatLocation(stamp.ubicacion);
  return `${technique.nombre} · ${location} · ${getStampSizeSummary(stamp)}`;
};

export const PublicQuoteSummary = ({
  items,
  products,
  techniques,
  designGroups,
  observations,
  manualReview,
  disabled,
  isSubmitting,
  canSubmit,
  onObservationsChange,
  onEdit,
  onDuplicate,
  onDelete,
  onSubmit,
}) => {
  const usedGroups = designGroups.filter((group) => (
    items.some((item) => item.estampados?.some(
      (stamp) => stamp.grupoDisenoCompartido === group.id,
    ))
  ));

  return (
    <aside className="public-quote-summary-card" aria-labelledby="quote-summary-title">
      <div className="public-quote-summary-heading">
        <div>
          <span>Tu solicitud</span>
          <h2 id="quote-summary-title">
            {items.length} {items.length === 1 ? 'producto agregado' : 'productos agregados'}
          </h2>
        </div>
        <span className="public-quote-count">{items.length}/{MAX_PUBLIC_QUOTE_ITEMS}</span>
      </div>

      <div className="public-quote-summary-list" data-testid="quote-summary-list">
        {items.length === 0 ? (
          <div className="public-quote-summary-empty">
            <Layers3 size={28} />
            <strong>Agrega el primer producto para comenzar.</strong>
            <span>Su resumen aparecerá aquí sin mostrar precios internos.</span>
          </div>
        ) : (
          items.map((item, index) => (
            <article className="public-quote-summary-item" key={item.localId}>
              <div className="public-quote-summary-item-head">
                <span className="public-quote-item-index">{index + 1}</span>
                <div>
                  <small>Producto {index + 1}</small>
                  <strong title={getItemName(item, products)}>
                    {getItemName(item, products)}
                  </strong>
                </div>
                {item.tipoProducto === 'OTRO' && (
                  <span className="public-quote-special-badge">Especial</span>
                )}
              </div>

              <dl className="public-quote-summary-facts">
                <div><dt>Cantidad</dt><dd>{item.cantidad || 'Por definir'}</dd></div>
                <div>
                  <dt>Suministro</dt>
                  <dd>{labelFor(SUPPLY_OPTIONS, item.suministradoPor, 'Por definir')}</dd>
                </div>
                <div>
                  <dt>Estampados</dt>
                  <dd>{item.estampados?.length || 0}</dd>
                </div>
              </dl>

              {item.estampados?.length > 0 && (
                <ul className="public-quote-summary-stamps">
                  {item.estampados.slice(0, 3).map((stamp) => (
                    <li key={stamp.localId}>{stampSummary(stamp, techniques)}</li>
                  ))}
                  {item.estampados.length > 3 && (
                    <li>+ {item.estampados.length - 3} estampados más</li>
                  )}
                </ul>
              )}

              <p className="public-quote-summary-design">
                <strong>Diseño:</strong>{' '}
                {item.requiereDiseno === false
                  ? 'No requiere diseño'
                  : item.esDisenoGeneral
                    ? `General · ${labelFor(DESIGN_OPTIONS, item.origenDiseno, 'Por definir')}`
                    : 'Configurado por estampado'}
              </p>

              {item.tipoProducto === 'OTRO' && (
                <p className="public-quote-special-warning">
                  PIXEL confirmará la compatibilidad de este producto.
                </p>
              )}

              <div className="public-quote-summary-actions">
                <button type="button" onClick={() => onEdit(item.localId)} disabled={disabled}>
                  <Pencil size={15} /> Editar
                </button>
                <button type="button" onClick={() => onDuplicate(item.localId)} disabled={disabled}>
                  <Copy size={15} /> Duplicar
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => onDelete(item.localId)}
                  disabled={disabled}
                >
                  <Trash2 size={15} /> Eliminar
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {usedGroups.length > 0 && (
        <section className="public-quote-shared-summary">
          <strong>Diseños compartidos</strong>
          <div>
            {usedGroups.map((group, index) => {
              const count = items.reduce((total, item) => (
                total + (item.estampados || []).filter(
                  (stamp) => stamp.grupoDisenoCompartido === group.id,
                ).length
              ), 0);
              return (
                <span key={group.id}>
                  Diseño compartido {index + 1} · {count} estampados
                </span>
              );
            })}
          </div>
        </section>
      )}

      <label className="public-quote-general-observations">
        <span>Observaciones generales de la solicitud</span>
        <textarea
          value={observations}
          onChange={(event) => onObservationsChange(event.target.value)}
          maxLength={255}
          placeholder="Entrega, urgencia o una aclaración general"
          disabled={disabled}
        />
        <small>{observations.length} / 255</small>
      </label>

      {manualReview && (
        <p className="public-quote-manual-review" role="status">
          PIXEL revisará algunos detalles manualmente antes de enviar la propuesta.
        </p>
      )}

      <div className="public-quote-summary-footer">
        <div className="public-quote-price-pending">
          <FileText size={19} />
          <div>
            <strong>Precio pendiente de confirmación</strong>
            <span>
              PIXEL revisará productos, técnicas, medidas y diseños antes de enviarte la propuesta.
            </span>
          </div>
        </div>
        <button
          type="button"
          className="public-quote-submit-button"
          onClick={onSubmit}
          disabled={!canSubmit || disabled || isSubmitting}
        >
          <Send size={18} />
          {isSubmitting ? 'Enviando solicitud…' : 'Enviar solicitud de cotización'}
        </button>
      </div>
    </aside>
  );
};
