// presentation/presentation/QuoteFormModal.jsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../../core/services/apiService.js';

export const QuoteFormModal = ({ isOpen, onClose, onSubmit, quote, isStaff }) => {
  const [observaciones, setObservaciones] = useState('');
  const [costosAdicionales, setCostosAdicionales] = useState(0);
  const [idCliente, setIdCliente] = useState('');
  const [detalles, setDetalles] = useState([]);

  // Estado para el listado de clientes disponibles
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);

  // Banderas lógicas para facilitar el control de la interfaz
  const isEditing = !!quote;
  const isPricing = isStaff && isEditing; // Empleado asignando costos a una cotización existente

  // Carga la lista de usuarios con rol Cliente cuando el Staff abre el modal en modo creación
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
      setDetalles([{ idTecnica: '', descripcion: '', cantidad: 1, precioUnitario: 0, costoDiseno: 0 }]);
    }
  }, [quote, isOpen]);

  if (!isOpen) return null;

  // Solo el Staff puede agregar más de un detalle (el backend exige exactamente 1 por cotización para clientes)
  const handleAddDetail = () => {
    setDetalles([...detalles, { idTecnica: '', descripcion: '', cantidad: 1, precioUnitario: 0, costoDiseno: 0 }]);
  };

  const handleDetailChange = (index, field, value) => {
    const updated = [...detalles];
    updated[index][field] = value;
    setDetalles(updated);
  };

  const handleRemoveDetail = (index) => {
    if (detalles.length > 1) {
      setDetalles(detalles.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        if (isStaff) {
          // 1. El empleado envía precios de producción a una cotización existente
          await onSubmit(quote.idCotizacion || quote.id, {
            costosAdicionales: Number(costosAdicionales),
            observaciones: observaciones || undefined,
            detalles: detalles.map(d => ({
              idDetalleCotizacion: d.idDetalleCotizacion || d.idDetalle,
              precioUnitario: Number(d.precioUnitario || 0),
              costoDiseno: Number(d.costoDiseno || 0)
            }))
          }, true);
        } else {
          // 2. El cliente actualiza su propia solicitud básica (solo 1 detalle, con idDetalleCotizacion)
          await onSubmit(quote.idCotizacion || quote.id, {
            detalles: detalles.map(d => ({
              idDetalleCotizacion: d.idDetalleCotizacion || d.idDetalle,
              idTecnica: Number(d.idTecnica),
              descripcion: d.descripcion,
              cantidad: Number(d.cantidad)
            }))
          }, false);
        }
      } else {
        // 3. Creación desde cero de una nueva cotización
        const payload = {
          ...(isStaff && observaciones && { observaciones }),
          ...(isStaff && { idCliente: Number(idCliente) }),
          detalles: detalles.map(d => ({
            idTecnica: Number(d.idTecnica),
            descripcion: d.descripcion,
            cantidad: Number(d.cantidad),
            ...(isStaff && { precioUnitario: Number(d.precioUnitario || 0) }),
            ...(isStaff && { costoDiseno: Number(d.costoDiseno || 0) }),
          }))
        };

        await onSubmit(payload, isStaff);
      }
      onClose();
    } catch (error) {
      alert(error.message || "Ocurrió un error al procesar la cotización");
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalContainer}>
        <h3 style={styles.modalTitle}>
          {isEditing ? (isStaff ? "Asignar Precios de Producción" : "Editar Solicitud") : "Nueva Cotización"}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Selector de Cliente: solo Staff creando una cotización nueva */}
          {!isEditing && isStaff && (
            <label style={styles.label}>
              Cliente asociado:
              {loadingClientes ? (
                <p style={styles.loadingText}>Cargando clientes...</p>
              ) : clientes.length === 0 ? (
                <p style={styles.errorText}>⚠️ No hay clientes activos registrados.</p>
              ) : (
                <select
                  value={idCliente}
                  onChange={e => setIdCliente(e.target.value)}
                  style={styles.select}
                  required
                >
                  <option value="">— Selecciona un cliente —</option>
                  {clientes.map(c => (
                    <option key={c.idUsuario} value={c.idUsuario}>
                      {c.nombre} · {c.correo}
                    </option>
                  ))}
                </select>
              )}
            </label>
          )}

          {/* Observaciones generales: Solo para Staff */}
          {!isPricing && isStaff && (
            <label style={styles.label}>
              Observaciones Generales:
              <input
                type="text"
                placeholder="Indicaciones adicionales de la orden..."
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                style={styles.input}
              />
            </label>
          )}

          {/* Costos operacionales: Solo visibles para personal asignando precios */}
          {isPricing && (
            <label style={styles.label}>
              Costos Operacionales Adicionales ($):
              <input
                type="number"
                value={costosAdicionales}
                onChange={e => setCostosAdicionales(e.target.value)}
                style={styles.input}
                required
              />
            </label>
          )}

          {/* Lista de prendas */}
          <div>
            <p style={{ fontWeight: '700', fontSize: '13px', margin: '8px 0', color: '#1e293b' }}>
              {isStaff ? 'Ítems / Prendas a Estampar:' : 'Producto a Cotizar:'}
            </p>

            <div style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {detalles.map((detail, idx) => (
                <div key={idx} style={styles.detailRow}>
                  <input
                    type="number"
                    placeholder="ID Tec"
                    value={detail.idTecnica}
                    onChange={e => handleDetailChange(idx, 'idTecnica', e.target.value)}
                    style={{ ...styles.input, width: '70px' }}
                    disabled={isPricing}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Descripción (Ej: Camiseta Negra)"
                    value={detail.descripcion}
                    onChange={e => handleDetailChange(idx, 'descripcion', e.target.value)}
                    style={{ ...styles.input, flex: 1 }}
                    disabled={isPricing}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Cant"
                    value={detail.cantidad}
                    onChange={e => handleDetailChange(idx, 'cantidad', e.target.value)}
                    style={{ ...styles.input, width: '65px' }}
                    disabled={isPricing}
                    required
                  />

                  {/* Inputs de Precios exclusivos para el Staff */}
                  {isStaff && (
                    <>
                      <input
                        type="number"
                        placeholder="$ Unitario"
                        value={detail.precioUnitario}
                        onChange={e => handleDetailChange(idx, 'precioUnitario', e.target.value)}
                        style={{ ...styles.input, width: '95px', borderColor: '#276cf2', backgroundColor: '#f0f4ff' }}
                        required
                      />
                      <input
                        type="number"
                        placeholder="$ Diseño"
                        value={detail.costoDiseno}
                        onChange={e => handleDetailChange(idx, 'costoDiseno', e.target.value)}
                        style={{ ...styles.input, width: '95px', borderColor: '#276cf2', backgroundColor: '#f0f4ff' }}
                        required
                      />
                    </>
                  )}

                  {/* Botón para remover fila: Solo Staff puede tener múltiples filas */}
                  {!isPricing && isStaff && detalles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDetail(idx)}
                      style={styles.removeBtn}
                      title="Eliminar prenda"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Aviso informativo para el cliente: una cotización = un producto */}
            {!isStaff && !isEditing && (
              <p style={styles.infoNote}>
                💡 Cada cotización corresponde a un solo producto. Para otro artículo, crea una nueva cotización.
              </p>
            )}
          </div>

          {/* Botón añadir fila: Solo disponible para Staff */}
          {!isPricing && isStaff && (
            <button type="button" onClick={handleAddDetail} style={styles.addBtn}>
              ➕ Añadir otra prenda
            </button>
          )}

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Cancelar
            </button>
            <button type="submit" style={styles.submitBtn}>
              Procesar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(34, 43, 69, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 },
  modalContainer: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '750px', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' },
  modalTitle: { margin: '0 0 14px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' },
  label: { fontSize: '13px', fontWeight: '600', color: '#4f5e74', display: 'flex', flexDirection: 'column', gap: '5px' },
  input: { padding: '8px 10px', borderRadius: '6px', border: '1px solid #edf1f7', fontSize: '13px', outline: 'none' },
  select: { padding: '8px 10px', borderRadius: '6px', border: '1px solid #edf1f7', fontSize: '13px', outline: 'none', backgroundColor: '#fff', color: '#1e293b', cursor: 'pointer' },
  detailRow: { display: 'flex', gap: '6px', alignItems: 'center' },
  addBtn: { padding: '8px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#475569', alignSelf: 'flex-start' },
  removeBtn: { padding: '6px 10px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #edf1f7', paddingTop: '14px', marginTop: '6px' },
  cancelBtn: { padding: '9px 16px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#64748b' },
  submitBtn: { padding: '9px 16px', backgroundColor: '#276cf2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  infoNote: { fontSize: '12px', color: '#8f9bb3', margin: '8px 0 0 0', fontStyle: 'italic' },
  loadingText: { fontSize: '13px', color: '#8f9bb3', margin: '4px 0' },
  errorText: { fontSize: '13px', color: '#ef4444', margin: '4px 0' },
};