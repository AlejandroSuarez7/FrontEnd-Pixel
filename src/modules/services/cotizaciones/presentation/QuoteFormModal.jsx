// cotizaciones/presentation/QuoteFormModal.jsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../../core/services/apiService.js';
import styles from './quotes.module.css';

export const QuoteFormModal = ({ isOpen, onClose, onSubmit, quote, isStaff }) => {
  const [observaciones, setObservaciones]         = useState('');
  const [costosAdicionales, setCostosAdicionales] = useState(0);
  const [idCliente, setIdCliente]                 = useState('');
  const [detalles, setDetalles]                   = useState([]);

  const [clientes, setClientes]               = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);

  const isEditing = !!quote;
  const isPricing = isStaff && isEditing;

  // Carga clientes activos cuando el Staff crea una cotización
  useEffect(() => {
    if (isOpen && isStaff && !isEditing) {
      setLoadingClientes(true);
      apiClient
        .get('api/usuarios')
        .then(({ data }) => {
          const soloClientes = (data.data || []).filter(
            u => u.rol?.nombre === 'Cliente' && u.estado === true
          );
          setClientes(soloClientes);
        })
        .catch(err => {
          console.error('Error al cargar clientes:', err);
          setClientes([]);
        })
        .finally(() => setLoadingClientes(false));
    }
  }, [isOpen, isStaff, isEditing]);

  // Precarga los datos garantizando siempre un único ítem
  useEffect(() => {
    if (quote) {
      setObservaciones(quote.observaciones || '');
      setCostosAdicionales(quote.costosAdicionales || 0);
      setIdCliente(quote.idCliente || '');
      setDetalles(quote.detalles || []);
    } else {
      setObservaciones('');
      setCostosAdicionales(0);
      setIdCliente('');
      // Obligatorio: un único detalle vacío por defecto para la creación
      setDetalles([{ idTecnica: '', descripcion: '', cantidad: 1, observaciones: '' }]);
    }
  }, [quote, isOpen]);

  if (!isOpen) return null;

  const handleDetailChange = (index, field, value) => {
    const updated = [...detalles];
    updated[index][field] = value;
    setDetalles(updated);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const payload = {
      observaciones: observaciones.trim() || null,
      detalles,
      ...(isPricing && { costosAdicionales: Number(costosAdicionales || 0) }),
      ...(isStaff && !isEditing && idCliente && { idCliente: Number(idCliente) }),
    };

    await onSubmit(payload);
  } catch (err) {
    alert(err.message || 'Ocurrió un error al procesar el formulario.');
  }
};

  const modalTitle = isPricing
    ? `Asignar valores · Cotización #${quote?.idCotizacion}`
    : isEditing
      ? 'Editar solicitud'
      : 'Nueva solicitud de cotización';

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalSm}`}>

        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{modalTitle}</h3>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Selector de cliente — Solo Staff creando presencial */}
          {isStaff && !isEditing && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Cliente responsable *</label>
              {loadingClientes ? (
                <p className={styles.inlineLoadingText}>Cargando clientes...</p>
              ) : clientes.length === 0 ? (
                <p className={styles.inlineErrorText}>No hay clientes activos registrados.</p>
              ) : (
                <select
                  value={idCliente}
                  onChange={e => setIdCliente(e.target.value)}
                  className={styles.selectField}
                  required
                >
                  <option value="">— Seleccione un usuario —</option>
                  {clientes.map(c => (
                    <option key={c.idUsuario} value={c.idUsuario}>
                      {c.nombre} ({c.correo})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Observaciones generales */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Observaciones generales</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              className={styles.inputField}
              rows={2}
              placeholder="Detalles sobre la entrega, urgencia o empaque..."
            />
          </div>

          {/* Costos adicionales — Solo Staff en modo pricing */}
          {isPricing && (
            <div className={styles.inputGroup} style={{ maxWidth: '200px' }}>
              <label className={styles.inputLabel}>Costos adicionales ($)</label>
              <input
                type="number"
                value={costosAdicionales}
                onChange={e => setCostosAdicionales(e.target.value)}
                className={styles.inputFieldStaff}
                min="0"
              />
            </div>
          )}

          {/* Información del Producto Único */}
          <div>
            <p className={styles.detailsSectionLabel}>
              {isPricing ? 'Valores del producto' : 'Producto a cotizar'}
            </p>

            <div className={styles.detailRowsWrapper}>
              {detalles.map((det, idx) => (
                <div key={det.idDetalleCotizacion || idx} className={styles.detailRow}>
                  
                  {/* ID Técnica — Oculto en pricing, requerido al crear/editar */}
                  {!isPricing && (
                    <input
                      type="number"
                      placeholder="ID Téc."
                      value={det.idTecnica || ''}
                      onChange={e => handleDetailChange(idx, 'idTecnica', e.target.value)}
                      className={styles.detailRowInputSm}
                      title="ID de la técnica de personalización"
                      required
                    />
                  )}

                  <input
                    type="text"
                    placeholder="Descripción de la prenda o artículo"
                    value={det.descripcion || ''}
                    onChange={e => handleDetailChange(idx, 'descripcion', e.target.value)}
                    className={styles.detailRowInputFlex}
                    disabled={isPricing}
                    required
                  />

                  <input
                    type="number"
                    placeholder="Cant."
                    value={det.cantidad || 1}
                    onChange={e => handleDetailChange(idx, 'cantidad', e.target.value)}
                    className={styles.detailRowInputSm}
                    min="1"
                    disabled={isPricing}
                    required
                  />

                  {/* Campos de precios — Solo Staff cuando está cotizando */}
                  {isPricing && (
                    <>
                      <input
                        type="number"
                        placeholder="$ Unitario"
                        value={det.precioUnitario || ''}
                        onChange={e => handleDetailChange(idx, 'precioUnitario', e.target.value)}
                        className={styles.detailRowInputStaff}
                        min="0"
                        required
                      />
                      <input
                        type="number"
                        placeholder="$ Diseño"
                        value={det.costoDiseno || ''}
                        onChange={e => handleDetailChange(idx, 'costoDiseno', e.target.value)}
                        className={styles.detailRowInputStaff}
                        min="0"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>

            <p className={styles.infoNote}>
              Cada cotización corresponde estrictamente a un solo producto. Para solicitar valores de un artículo diferente, se debe procesar una nueva cotización por separado.
            </p>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary}>
              {isPricing ? 'Enviar precios' : 'Procesar solicitud'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};