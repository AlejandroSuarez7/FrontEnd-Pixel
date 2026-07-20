import { useEffect, useMemo, useState } from 'react';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { notifications } from '../../../../core/utils/notifications';
import './ComprasPage.css';

const styles = {
  overlay: 'compras-overlay',
  modalContainer: 'compras-modal-container',
  modalLg: 'compras-modal-lg',
  modalHeader: 'compras-modal-header',
  modalTitle: 'compras-modal-title',
  modalCloseBtn: 'compras-modal-close-btn',
  form: 'compras-form',
  formRow: 'compras-form-row',
  inputGroup: 'compras-input-group',
  inputLabel: 'compras-input-label',
  inputField: 'compras-input-field',
  detailsInfoBox: 'compras-details-info-box',
  detailRow: 'compras-detail-row',
  actionBtn: 'compras-action-btn',
  actionBtnCancel: 'compras-action-btn-cancel',
  actionBtnView: 'compras-action-btn-view',
  modalFooter: 'compras-modal-footer',
  btnSecondary: 'compras-btn-secondary',
  btnPrimary: 'compras-btn-primary',
};

const emptyDetalle = { descripcionInsumo: '', cantidad: 1, costoUnitario: 0 };

export const CompraModal = ({
  isOpen,
  onClose,
  onSubmit,
  compra,
  getPedidos,
  getProveedoresActivos,
}) => {
  const [idPedido, setIdPedido] = useState('');
  const [idProveedor, setIdProveedor] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [detalles, setDetalles] = useState([emptyDetalle]);
  const [pedidos, setPedidos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();

  const isEditing = Boolean(compra);

  useEffect(() => {
    if (compra) {
      setIdPedido(compra.idPedido || '');
      setIdProveedor(compra.idProveedor || '');
      setObservaciones(compra.observaciones || '');
      setConfirmar(false);
      setDetalles(compra.detalles?.length ? compra.detalles.map(det => ({
        descripcionInsumo: det.descripcionInsumo || '',
        cantidad: det.cantidad || 1,
        costoUnitario: det.costoUnitario || 0,
      })) : [emptyDetalle]);
    } else {
      setIdPedido('');
      setIdProveedor('');
      setObservaciones('');
      setConfirmar(false);
      setDetalles([emptyDetalle]);
    }
  }, [compra, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoadingOptions(true);
    Promise.all([getPedidos(), getProveedoresActivos()])
      .then(([pedidosData, proveedoresData]) => {
        if (cancelled) return;
        setPedidos((pedidosData || []).filter(item =>
          item.estadoPedido === 'EN_PROCESO'
        ));
        setProveedores(proveedoresData || []);
      })
      .catch(() => {
        if (cancelled) return;
        setPedidos([]);
        setProveedores([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, getPedidos, getProveedoresActivos]);

  const totalEstimado = useMemo(() => detalles.reduce((sum, det) =>
    sum + Number(det.cantidad || 0) * Number(det.costoUnitario || 0), 0
  ), [detalles]);

  if (!isOpen) return null;

  const updateDetalle = (index, field, value) => {
    setDetalles(prev => prev.map((det, itemIndex) =>
      itemIndex === index ? { ...det, [field]: value } : det
    ));
  };

  const addDetalle = () => setDetalles(prev => [...prev, { ...emptyDetalle }]);
  const removeDetalle = (index) => setDetalles(prev => prev.filter((_, itemIndex) => itemIndex !== index));

  const handleSubmit = async (event) => {
    event.preventDefault();
    await runLocked(async () => {
    const detallesValidos = detalles.filter(det => det.descripcionInsumo.trim());

    if (!detallesValidos.length) {
      notifications.warning('La compra debe tener minimo un detalle.');
      return;
    }

    if (detallesValidos.some(det => Number(det.cantidad) <= 0 || Number(det.costoUnitario) <= 0)) {
      notifications.warning('Cantidad y costo unitario deben ser mayores a 0.');
      return;
    }

    try {
      await onSubmit({
        idPedido,
        idProveedor,
        observaciones,
        confirmar,
        detalles: detallesValidos,
      });
    } catch (error) {
      notifications.error(error.message || 'No se pudo procesar la compra.');
    }
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalLg}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{isEditing ? `Editar compra #${compra.idCompra}` : 'Registrar compra'}</h3>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn} disabled={isSubmitting}>x</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Pedido *</label>
              <select value={idPedido} onChange={event => setIdPedido(event.target.value)} className={styles.inputField} disabled={isSubmitting || isEditing || loadingOptions} required>
                <option value="">{loadingOptions ? 'Cargando pedidos...' : 'Selecciona un pedido'}</option>
                {isEditing && idPedido ? <option value={idPedido}>Pedido #{idPedido}</option> : null}
                {pedidos.map(pedido => (
                  <option key={pedido.idPedido} value={pedido.idPedido}>
                    Pedido #{pedido.idPedido} - {pedido.cliente?.nombre || 'Cliente'} - {pedido.estadoPedido}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Proveedor *</label>
              <select value={idProveedor} onChange={event => setIdProveedor(event.target.value)} className={styles.inputField} disabled={isSubmitting || loadingOptions} required>
                <option value="">{loadingOptions ? 'Cargando proveedores...' : 'Selecciona un proveedor'}</option>
                {proveedores.map(proveedor => (
                  <option key={proveedor.idProveedor} value={proveedor.idProveedor}>
                    {proveedor.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Observaciones</label>
            <textarea value={observaciones} onChange={event => setObservaciones(event.target.value)} className={styles.inputField} rows={2} maxLength={500} />
          </div>

          <div className={styles.detailsInfoBox}>
            Total estimado: <strong>${totalEstimado.toLocaleString('es-CO')}</strong>
          </div>

          {detalles.map((detalle, index) => (
            <div key={index} className={styles.detailRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Insumo</label>
                <input value={detalle.descripcionInsumo} onChange={event => updateDetalle(index, 'descripcionInsumo', event.target.value)} className={styles.inputField} placeholder="Descripcion insumo" required />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Cantidad</label>
                <input type="number" min="1" value={detalle.cantidad} onChange={event => updateDetalle(index, 'cantidad', event.target.value)} className={styles.inputField} placeholder="Ej: 2" required />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Costo unitario</label>
                <input type="number" min="1" value={detalle.costoUnitario} onChange={event => updateDetalle(index, 'costoUnitario', event.target.value)} className={styles.inputField} placeholder="Ej: 45000" required />
              </div>
              {detalles.length > 1 && (
                <button type="button" onClick={() => removeDetalle(index)} className={`${styles.actionBtn} ${styles.actionBtnCancel}`} disabled={isSubmitting}>Quitar</button>
              )}
            </div>
          ))}

          <button type="button" onClick={addDetalle} className={`${styles.actionBtn} ${styles.actionBtnView}`} disabled={isSubmitting}>
            Agregar insumo
          </button>

          {!isEditing && (
            <label className={styles.detailsInfoBox}>
              <span className={styles.inputLabel}>Confirmar al registrar</span>
              <input type="checkbox" checked={confirmar} onChange={event => setConfirmar(event.target.checked)} />
            </label>
          )}

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={isSubmitting || loadingOptions}>
              {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
