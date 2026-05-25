// presentation/QuoteModal.jsx
import React, { useState } from 'react';
import styles from './quotes.module.css';

export const QuoteModal = ({ isOpen, onClose, onSubmit }) => {
  const [idCliente, setIdCliente]             = useState('');
  const [observaciones, setObservaciones]     = useState('');
  const [costosAdicionales, setCostosAdicionales] = useState(0);
  const [detalles, setDetalles]               = useState([]);

  const [currDetalle, setCurrDetalle] = useState({
    idTecnica: 1,
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
    costoDiseno: 0,
    observaciones: '',
  });

  if (!isOpen) return null;

  const handleAddDetalle = () => {
    if (!currDetalle.descripcion.trim()) return alert('Por favor, escribe una descripción para el ítem.');
    if (Number(currDetalle.cantidad) <= 0) return alert('La cantidad debe ser mayor a 0.');
    if (Number(currDetalle.precioUnitario) < 0) return alert('El precio unitario no puede ser negativo.');

    const subtotalItem =
      Number(currDetalle.cantidad) * Number(currDetalle.precioUnitario) +
      Number(currDetalle.costoDiseno || 0);

    setDetalles([...detalles, { ...currDetalle, subtotal: subtotalItem }]);
    setCurrDetalle({ idTecnica: 1, descripcion: '', cantidad: 1, precioUnitario: 0, costoDiseno: 0, observaciones: '' });
  };

  const handleRemoveDetalle = (indexToRemove) => {
    setDetalles(detalles.filter((_, i) => i !== indexToRemove));
  };

  const subtotalGeneral = detalles.reduce((sum, item) => sum + item.subtotal, 0);
  const totalGeneral    = subtotalGeneral + Number(costosAdicionales || 0);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (detalles.length === 0) return alert('Debes agregar por lo menos un ítem al detalle de la cotización.');

    onSubmit({ idCliente, observaciones, costosAdicionales, detalles });
    setIdCliente(''); setObservaciones(''); setCostosAdicionales(0); setDetalles([]);
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalMd}`}>

        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Nueva cotización estándar</h3>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn}>✕</button>
        </div>

        <form onSubmit={handleFormSubmit} className={styles.form}>

          {/* ID Cliente */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>ID del cliente *</label>
            <input
              type="number"
              value={idCliente}
              onChange={e => setIdCliente(e.target.value)}
              required
              className={styles.inputField}
              placeholder="Ej: 4"
            />
          </div>

          {/* Sub-formulario de ítems */}
          <div className={styles.detalleSection}>
            <p className={styles.detalleSectionTitle}>Ítems de la cotización</p>

            <div className={styles.formRow}>
              <div className={`${styles.inputGroup}`} style={{ flex: 2 }}>
                <label className={styles.inputLabel}>Descripción *</label>
                <input
                  type="text"
                  value={currDetalle.descripcion}
                  onChange={e => setCurrDetalle({ ...currDetalle, descripcion: e.target.value })}
                  className={styles.inputField}
                  placeholder="Ej: Camiseta estampada negra"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Técnica ID</label>
                <input
                  type="number"
                  value={currDetalle.idTecnica}
                  onChange={e => setCurrDetalle({ ...currDetalle, idTecnica: e.target.value })}
                  className={styles.inputField}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.inputGroup} style={{ flex: '0 0 auto' }}>
                <label className={styles.inputLabel}>Cant. *</label>
                <input
                  type="number"
                  value={currDetalle.cantidad}
                  onChange={e => setCurrDetalle({ ...currDetalle, cantidad: e.target.value })}
                  className={`${styles.inputField} ${styles.inputFieldSm}`}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Precio unitario *</label>
                <input
                  type="number"
                  value={currDetalle.precioUnitario}
                  onChange={e => setCurrDetalle({ ...currDetalle, precioUnitario: e.target.value })}
                  className={styles.inputField}
                  placeholder="0.00"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Costo diseño</label>
                <input
                  type="number"
                  value={currDetalle.costoDiseno}
                  onChange={e => setCurrDetalle({ ...currDetalle, costoDiseno: e.target.value })}
                  className={styles.inputField}
                  placeholder="0.00"
                />
              </div>
              <button type="button" onClick={handleAddDetalle} className={styles.btnAddItem}>
                Añadir
              </button>
            </div>

            {/* Lista de ítems agregados */}
            {detalles.length > 0 && (
              <table className={styles.subTable}>
                <thead className={styles.subTableHead}>
                  <tr>
                    <th className={styles.subTableTh}>Descripción</th>
                    <th className={styles.subTableTh}>Cant.</th>
                    <th className={styles.subTableTh}>Subtotal</th>
                    <th className={styles.subTableTh}></th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.map((det, index) => (
                    <tr key={index} className={styles.subTableRow}>
                      <td className={styles.subTableTd}>{det.descripcion}</td>
                      <td className={styles.subTableTd}>{det.cantidad}</td>
                      <td className={styles.subTableTd}>${det.subtotal.toLocaleString('es-CO')}</td>
                      <td className={styles.subTableTd} style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveDetalle(index)}
                          className={styles.removeItemBtn}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Observaciones */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Observaciones generales</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              className={styles.textareaField}
              placeholder="Condiciones de entrega, acuerdos adicionales..."
            />
          </div>

          {/* Costos adicionales + total */}
          <div className={styles.formRow} style={{ alignItems: 'flex-end' }}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Costos adicionales</label>
              <input
                type="number"
                value={costosAdicionales}
                onChange={e => setCostosAdicionales(e.target.value)}
                className={styles.inputField}
                placeholder="0.00"
              />
            </div>
            <div className={styles.totalBox}>
              <span className={styles.totalLabel}>Total estimado</span>
              <span className={styles.totalValue}>${totalGeneral.toLocaleString('es-CO')}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary}>
              Registrar cotización
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};