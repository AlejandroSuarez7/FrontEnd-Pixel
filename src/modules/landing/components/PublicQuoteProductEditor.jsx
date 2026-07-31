import {
  ChevronDown,
  Copy,
  PackagePlus,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  DESIGN_OPTIONS,
  MAX_ITEM_STAMPS,
  SUPPLY_OPTIONS,
  createStamp,
  getItemName,
  getProduct,
  getTechnique,
} from '../domain/publicQuoteBuilder';

const LOCATION_SUGGESTIONS = [
  'Frente',
  'Espalda',
  'Manga derecha',
  'Manga izquierda',
  'Pecho',
];

export const PublicQuoteProductEditor = ({
  item,
  products,
  categories,
  techniques,
  designReferences,
  error,
  editingNumber,
  disabled,
  onPatch,
  onStampPatch,
  onAddStamp,
  onDuplicateStamp,
  onRemoveStamp,
  onShareDesign,
  onSubmit,
}) => {
  const [openStampId, setOpenStampId] = useState(item.estampados?.[0]?.localId || null);

  const selectedProduct = getProduct(products, item.idProducto);
  const filteredProducts = useMemo(() => (
    item.idCategoriaProducto
      ? products.filter((product) => (
          Number(product.idCategoriaProducto ?? product.categoriaProducto?.idCategoriaProducto)
          === Number(item.idCategoriaProducto)
        ))
      : products
  ), [item.idCategoriaProducto, products]);

  const changeType = (tipoProducto) => {
    if (tipoProducto === item.tipoProducto) return;
    if (tipoProducto === 'OTRO') {
      onPatch({
        tipoProducto,
        idCategoriaProducto: '',
        idProducto: '',
        producto: null,
      });
      return;
    }
    onPatch({
      tipoProducto,
      nombrePersonalizado: '',
      descripcionPersonalizada: '',
      materialReferencia: '',
      imagenReferencia: '',
      estampados: item.estampados?.length ? item.estampados : [createStamp()],
    });
  };

  const selectProduct = (idProducto) => {
    const product = getProduct(products, idProducto);
    const requiresDesign = product?.requiereDiseno !== false;
    onPatch({
      idProducto,
      producto: product || null,
      requiereDiseno: requiresDesign,
      origenDiseno: requiresDesign ? item.origenDiseno : 'NO_REQUIERE',
      esDisenoGeneral: requiresDesign ? item.esDisenoGeneral : false,
      archivoDisenoInicialUrl: requiresDesign ? item.archivoDisenoInicialUrl : '',
      estampados: item.estampados.map((stamp) => ({
        ...stamp,
        origenDiseno: requiresDesign ? stamp.origenDiseno : 'NO_REQUIERE',
        grupoDisenoCompartido: requiresDesign ? stamp.grupoDisenoCompartido : '',
      })),
    });
  };

  const setRequiresDesign = (requiresDesign) => {
    onPatch({
      requiereDiseno: requiresDesign,
      origenDiseno: requiresDesign ? 'PENDIENTE_DEFINIR' : 'NO_REQUIERE',
      esDisenoGeneral: false,
      archivoDisenoInicialUrl: '',
      estampados: item.estampados.map((stamp) => ({
        ...stamp,
        origenDiseno: requiresDesign ? 'PENDIENTE_DEFINIR' : 'NO_REQUIERE',
        grupoDisenoCompartido: '',
      })),
    });
  };

  const setGeneralDesign = (isGeneral) => {
    onPatch({
      esDisenoGeneral: isGeneral,
      estampados: item.estampados.map((stamp) => ({
        ...stamp,
        grupoDisenoCompartido: isGeneral ? '' : stamp.grupoDisenoCompartido,
      })),
    });
  };

  const selectTechnique = (stamp, idTecnica) => {
    const technique = getTechnique(techniques, idTecnica);
    onStampPatch(stamp.localId, {
      idTecnica,
      ...(!idTecnica || technique?.requiereMedidas === false
        ? { anchoCm: '', altoCm: '', medidasDesconocidas: false }
        : {}),
    });
  };

  const addStamp = () => {
    const stampId = onAddStamp();
    if (stampId) setOpenStampId(stampId);
  };

  const duplicateStamp = (stamp) => {
    const stampId = onDuplicateStamp(stamp.localId);
    if (stampId) setOpenStampId(stampId);
  };

  return (
    <section className="public-quote-editor-card" aria-labelledby="product-editor-title">
      <div className="public-quote-card-heading">
        <div>
          <span>{editingNumber ? `Editando producto ${editingNumber}` : 'Producto actual'}</span>
          <h2 id="product-editor-title">
            {editingNumber ? getItemName(item, products) : 'Configura un producto'}
          </h2>
        </div>
        {editingNumber && <span className="public-quote-editing-badge">Edición activa</span>}
      </div>

      {error && <div className="public-quote-inline-error" role="alert">{error}</div>}

      <div className="public-quote-mode-switch" aria-label="Tipo de producto">
        <button
          type="button"
          className={item.tipoProducto === 'CATALOGO' ? 'active' : ''}
          onClick={() => changeType('CATALOGO')}
          disabled={disabled}
        >
          Producto del catálogo
        </button>
        <button
          type="button"
          className={item.tipoProducto === 'OTRO' ? 'active' : ''}
          onClick={() => changeType('OTRO')}
          disabled={disabled}
        >
          Otro producto
        </button>
      </div>

      {item.tipoProducto === 'CATALOGO' ? (
        <>
          <div className="public-quote-field-grid two">
            <label>
              <span>Categoría</span>
              <select
                value={item.idCategoriaProducto}
                onChange={(event) => onPatch({
                  idCategoriaProducto: event.target.value,
                  idProducto: '',
                  producto: null,
                })}
                disabled={disabled}
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.idCategoriaProducto} value={category.idCategoriaProducto}>
                    {category.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Producto *</span>
              <select
                aria-label="Producto *"
                value={item.idProducto}
                onChange={(event) => selectProduct(event.target.value)}
                disabled={disabled}
              >
                <option value="">Selecciona un producto</option>
                {filteredProducts.map((product) => (
                  <option key={product.idProducto} value={product.idProducto}>{product.nombre}</option>
                ))}
              </select>
            </label>
          </div>
          {selectedProduct && (
            <div className="public-quote-product-info">
              <div>
                <strong>{selectedProduct.nombre}</strong>
                <span>{selectedProduct.categoriaProducto?.nombre || 'Producto cotizable'}</span>
              </div>
              <p>{selectedProduct.descripcion || 'Sin descripción pública.'}</p>
            </div>
          )}
        </>
      ) : (
        <div className="public-quote-special-product">
          <div className="public-quote-field-grid two">
            <label className="wide">
              <span>¿Qué producto quieres estampar? *</span>
              <input
                value={item.nombrePersonalizado}
                onChange={(event) => onPatch({ nombrePersonalizado: event.target.value })}
                maxLength={150}
                placeholder="Ej: Bolso artesanal"
                disabled={disabled}
              />
              <small>{item.nombrePersonalizado.length} / 150</small>
            </label>
            <label>
              <span>Descripción</span>
              <textarea
                value={item.descripcionPersonalizada}
                onChange={(event) => onPatch({ descripcionPersonalizada: event.target.value })}
                maxLength={500}
                placeholder="Forma, acabado o características"
                disabled={disabled}
              />
              <small>{item.descripcionPersonalizada.length} / 500</small>
            </label>
            <label>
              <span>Material o referencia</span>
              <textarea
                value={item.materialReferencia}
                onChange={(event) => onPatch({ materialReferencia: event.target.value })}
                maxLength={255}
                placeholder="Ej: lona gruesa"
                disabled={disabled}
              />
              <small>{item.materialReferencia.length} / 255</small>
            </label>
            <label className="wide">
              <span>Imagen de referencia mediante URL</span>
              <input
                type="url"
                value={item.imagenReferencia}
                onChange={(event) => onPatch({ imagenReferencia: event.target.value })}
                maxLength={255}
                placeholder="https://..."
                disabled={disabled}
              />
              <small>{item.imagenReferencia.length} / 255</small>
            </label>
          </div>
          <p className="public-quote-manual-note">
            PIXEL revisará la compatibilidad del producto antes de enviar la propuesta final.
          </p>
        </div>
      )}

      <div className="public-quote-field-grid two public-quote-core-fields">
        <label>
          <span>Cantidad *</span>
          <input
            className="public-quote-quantity-input"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={item.cantidad}
            onChange={(event) => onPatch({ cantidad: event.target.value })}
            disabled={disabled}
          />
        </label>
        <label>
          <span>¿Quién suministra el producto?</span>
          <select
            value={item.suministradoPor}
            onChange={(event) => onPatch({ suministradoPor: event.target.value })}
            disabled={disabled}
          >
            {SUPPLY_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="wide">
          <span>Observaciones del producto</span>
          <textarea
            value={item.observaciones}
            onChange={(event) => onPatch({ observaciones: event.target.value })}
            maxLength={255}
            placeholder="Color, talla, referencia o aclaración"
            disabled={disabled}
          />
          <small>{item.observaciones.length} / 255</small>
        </label>
      </div>

      <div className="public-quote-subsection-heading">
        <div>
          <span>Estampados</span>
          <strong>{item.estampados.length} de {MAX_ITEM_STAMPS}</strong>
        </div>
        <button
          type="button"
          className="public-quote-small-button"
          onClick={addStamp}
          disabled={disabled || item.estampados.length >= MAX_ITEM_STAMPS}
        >
          <Plus size={16} /> Agregar estampado
        </button>
      </div>

      {item.estampados.length === 0 ? (
        <div className="public-quote-no-stamps">
          <PackagePlus size={21} />
          <div>
            <strong>Sin estampados configurados</strong>
            <span>Este producto especial quedará para revisión manual.</span>
          </div>
        </div>
      ) : (
        <div className="public-quote-stamp-list">
          {item.estampados.map((stamp, index) => {
            const technique = getTechnique(techniques, stamp.idTecnica);
            const isOpen = openStampId === stamp.localId;
            const otherDesignReferences = designReferences.filter(
              (reference) => reference.stampId !== stamp.localId,
            );
            const currentReferenceIndex = designReferences.findIndex(
              (reference) => reference.stampId === stamp.localId,
            );
            const availableDesignReferences = currentReferenceIndex > 0
              ? designReferences.slice(0, currentReferenceIndex)
              : [];
            const sharedReference = stamp.grupoDisenoCompartido
              ? otherDesignReferences.find(
                  (reference) => reference.groupId === stamp.grupoDisenoCompartido,
                )
              : null;
            const measures = stamp.anchoCm && stamp.altoCm
              ? `${stamp.anchoCm} × ${stamp.altoCm} cm`
              : 'Medidas por definir';

            return (
              <article className={`public-quote-stamp-card ${isOpen ? 'open' : ''}`} key={stamp.localId}>
                <button
                  type="button"
                  className="public-quote-stamp-summary"
                  onClick={() => setOpenStampId(isOpen ? null : stamp.localId)}
                  aria-expanded={isOpen}
                >
                  <span className="public-quote-stamp-number">{index + 1}</span>
                  <span>
                    <strong>Estampado {index + 1}</strong>
                    <small>
                      {stamp.ubicacion || 'Ubicación pendiente'} · {technique?.nombre || 'Servicio por definir'}
                      {technique?.requiereMedidas ? ` · ${measures}` : ''}
                    </small>
                  </span>
                  <ChevronDown size={18} />
                </button>

                {isOpen && (
                  <div className="public-quote-stamp-body">
                    <div className="public-quote-field-grid two">
                      <label>
                        <span>Servicio o técnica</span>
                        <select
                          aria-label={`Técnica estampado ${index + 1}`}
                          value={stamp.idTecnica}
                          onChange={(event) => selectTechnique(stamp, event.target.value)}
                          disabled={disabled}
                        >
                          <option value="">No sé qué servicio necesito</option>
                          {techniques.map((itemTechnique) => (
                            <option key={itemTechnique.idTecnica} value={itemTechnique.idTecnica}>
                              {itemTechnique.nombre}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Ubicación</span>
                        <input
                          list="public-quote-locations"
                          value={stamp.ubicacion}
                          onChange={(event) => onStampPatch(stamp.localId, { ubicacion: event.target.value })}
                          maxLength={100}
                          placeholder="Ej: Frente"
                          disabled={disabled}
                        />
                      </label>
                      {technique?.requiereMedidas === true && (
                        <>
                          {!stamp.medidasDesconocidas && (
                            <>
                              <label>
                                <span>Ancho (cm)</span>
                                <input
                                  type="number"
                                  min="0.01"
                                  max="500"
                                  step="0.01"
                                  value={stamp.anchoCm}
                                  onChange={(event) => onStampPatch(stamp.localId, { anchoCm: event.target.value })}
                                  disabled={disabled}
                                />
                              </label>
                              <label>
                                <span>Alto (cm)</span>
                                <input
                                  type="number"
                                  min="0.01"
                                  max="500"
                                  step="0.01"
                                  value={stamp.altoCm}
                                  onChange={(event) => onStampPatch(stamp.localId, { altoCm: event.target.value })}
                                  disabled={disabled}
                                />
                              </label>
                            </>
                          )}
                          <label className="public-quote-checkbox-row wide compact">
                            <input
                              type="checkbox"
                              checked={Boolean(stamp.medidasDesconocidas)}
                              onChange={(event) => onStampPatch(stamp.localId, {
                                medidasDesconocidas: event.target.checked,
                                ...(event.target.checked ? { anchoCm: '', altoCm: '' } : {}),
                              })}
                              disabled={disabled}
                            />
                            <span>
                              <strong>No conozco las medidas</strong>
                              <small>PIXEL las confirmará antes de preparar la propuesta.</small>
                            </span>
                          </label>
                          <p className="public-quote-measure-note wide">
                            No te preocupes. El equipo de PIXEL te ayudará a definir el tamaño adecuado.
                          </p>
                        </>
                      )}
                      {!stamp.idTecnica && (
                        <p className="public-quote-measure-note wide">
                          PIXEL te recomendará la técnica más adecuada.
                        </p>
                      )}
                      <label className="wide">
                        <span>Descripción del estampado</span>
                        <textarea
                          value={stamp.descripcion}
                          onChange={(event) => onStampPatch(stamp.localId, { descripcion: event.target.value })}
                          maxLength={500}
                          placeholder="Ej: logo centrado, texto pequeño"
                          disabled={disabled}
                        />
                        <small>{stamp.descripcion.length} / 500</small>
                      </label>
                      <label className="wide">
                        <span>Observaciones del estampado</span>
                        <textarea
                          value={stamp.observaciones}
                          onChange={(event) => onStampPatch(stamp.localId, { observaciones: event.target.value })}
                          maxLength={500}
                          placeholder="Acabado, colores o aclaraciones"
                          disabled={disabled}
                        />
                        <small>{stamp.observaciones.length} / 500</small>
                      </label>
                    </div>

                    {!item.esDisenoGeneral && item.requiereDiseno && (
                      <div className="public-quote-stamp-design">
                        {availableDesignReferences.length > 0 && (
                          <label>
                            <span>¿Qué diseño utilizarás?</span>
                            <select
                              value={sharedReference?.key || ''}
                              onChange={(event) => onShareDesign(stamp.localId, event.target.value)}
                              disabled={disabled || stamp.origenDiseno === 'NO_REQUIERE'}
                            >
                              <option value="">Usar un diseño diferente</option>
                              {availableDesignReferences.map((reference) => (
                                <option key={reference.key} value={reference.key}>
                                  Usar el mismo diseño de {reference.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                        {sharedReference ? (
                          <p className="public-quote-shared-design-note">
                            Comparte diseño con {sharedReference.label}.
                          </p>
                        ) : (
                          <label>
                            <span>Diseño para este estampado</span>
                            <select
                              value={stamp.origenDiseno}
                              onChange={(event) => onStampPatch(stamp.localId, {
                                origenDiseno: event.target.value,
                                ...(event.target.value === 'NO_REQUIERE'
                                  ? { grupoDisenoCompartido: '' }
                                  : {}),
                              })}
                              disabled={disabled}
                            >
                              {DESIGN_OPTIONS.map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </label>
                        )}
                      </div>
                    )}

                    <div className="public-quote-stamp-actions">
                      <button
                        type="button"
                        onClick={() => duplicateStamp(stamp)}
                        disabled={disabled || item.estampados.length >= MAX_ITEM_STAMPS}
                      >
                        <Copy size={16} /> Duplicar
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => onRemoveStamp(stamp.localId)}
                        disabled={disabled || (item.tipoProducto === 'CATALOGO' && item.estampados.length === 1)}
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="public-quote-design-box">
        <div className="public-quote-subsection-heading compact">
          <div>
            <span>Diseño del producto</span>
            <strong>Define cómo llegará el arte</strong>
          </div>
        </div>
        <label className="public-quote-checkbox-row">
          <input
            type="checkbox"
            checked={item.requiereDiseno}
            onChange={(event) => setRequiresDesign(event.target.checked)}
            disabled={disabled || selectedProduct?.requiereDiseno === false}
          />
          <span>
            <strong>Este producto requiere diseño</strong>
            <small>Desactívalo únicamente cuando el estampado no necesite una pieza gráfica.</small>
          </span>
        </label>

        {item.requiereDiseno ? (
          <>
            <label className="public-quote-checkbox-row">
              <input
                type="checkbox"
                checked={item.esDisenoGeneral}
                onChange={(event) => setGeneralDesign(event.target.checked)}
                disabled={disabled}
              />
              <span>
                <strong>Usar el mismo diseño en todos los estampados de este producto</strong>
                <small>Configura una sola vez cómo llegará el diseño.</small>
              </span>
            </label>
            {item.esDisenoGeneral && (
              <div className="public-quote-field-grid two">
                <label>
                  <span>Origen del diseño general</span>
                  <select
                    value={item.origenDiseno}
                    onChange={(event) => onPatch({
                      origenDiseno: event.target.value,
                      ...(event.target.value !== 'CLIENTE' ? { archivoDisenoInicialUrl: '' } : {}),
                    })}
                    disabled={disabled}
                  >
                    {DESIGN_OPTIONS.filter(([value]) => value !== 'NO_REQUIERE').map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                {item.origenDiseno === 'CLIENTE' && (
                  <label>
                    <span>Enlace del diseño</span>
                    <input
                      type="url"
                      value={item.archivoDisenoInicialUrl}
                      onChange={(event) => onPatch({ archivoDisenoInicialUrl: event.target.value })}
                      maxLength={255}
                      placeholder="https://drive.google.com/..."
                      disabled={disabled}
                    />
                    <small>Puedes enviarlo después · {item.archivoDisenoInicialUrl.length} / 255</small>
                  </label>
                )}
              </div>
            )}
            {!item.esDisenoGeneral
              && item.estampados.some((stamp) => stamp.origenDiseno === 'CLIENTE')
              && (
                <div className="public-quote-field-grid two">
                  <label className="wide">
                    <span>Enlace del diseño</span>
                    <input
                      type="url"
                      value={item.archivoDisenoInicialUrl}
                      onChange={(event) => onPatch({ archivoDisenoInicialUrl: event.target.value })}
                      maxLength={255}
                      placeholder="https://drive.google.com/..."
                      disabled={disabled}
                    />
                    <small>
                      Puedes compartir un enlace accesible o enviarlo después ·{' '}
                      {item.archivoDisenoInicialUrl.length} / 255
                    </small>
                  </label>
                </div>
              )}
          </>
        ) : (
          <p className="public-quote-no-design-note">Este producto se enviará como “No requiere diseño”.</p>
        )}
      </div>

      <button
        type="button"
        className="public-quote-add-item-button"
        onClick={onSubmit}
        disabled={disabled}
      >
        {editingNumber ? <Save size={18} /> : <PackagePlus size={18} />}
        {editingNumber ? 'Guardar cambios' : 'Añadir a la cotización'}
      </button>

      <datalist id="public-quote-locations">
        {LOCATION_SUGGESTIONS.map((location) => <option key={location} value={location} />)}
      </datalist>
    </section>
  );
};
