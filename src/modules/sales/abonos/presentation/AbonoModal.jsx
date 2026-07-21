/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { notifications } from '../../../../core/utils/notifications';
import './AbonosPage.css';

const styles = {
  overlay: 'abonos-overlay',
  modalContainer: 'abonos-modal-container',
  modalSm: 'abonos-modal-sm',
  modalHeader: 'abonos-modal-header',
  modalTitle: 'abonos-modal-title',
  modalCloseBtn: 'abonos-modal-close-btn',
  form: 'abonos-form',
  formRow: 'abonos-form-row',
  inputGroup: 'abonos-input-group',
  inputLabel: 'abonos-input-label',
  inputField: 'abonos-input-field',
  loadingText: 'abonos-loading-text',
  detailsInfoBox: 'abonos-details-info-box',
  paymentSummary: 'abonos-payment-summary',
  paymentSummaryItem: 'abonos-payment-summary-item',
  modalFooter: 'abonos-modal-footer',
  btnSecondary: 'abonos-btn-secondary',
  btnPrimary: 'abonos-btn-primary',
};

const METODOS_PAGO_STAFF = ['EFECTIVO', 'TRANSFERENCIA'];
const METODOS_PAGO_CLIENTE = ['TRANSFERENCIA'];

export const AbonoModal = ({
  isOpen,
  onClose,
  onSubmit,
  abono,
  isStaff,
  getPedido,
  getAbonosByPedido,
  getPedidos,
}) => {
  const [idPedido, setIdPedido] = useState('');
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('TRANSFERENCIA');
  const [referencia, setReferencia] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [pedido, setPedido] = useState(null);
  const [abonosPedido, setAbonosPedido] = useState([]);
  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [loadingPedido, setLoadingPedido] = useState(false);
  const [pedidoError, setPedidoError] = useState('');
  const [pedidosError, setPedidosError] = useState('');
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();

  const isEditing = Boolean(abono);
  const metodosPagoDisponibles = isStaff ? METODOS_PAGO_STAFF : METODOS_PAGO_CLIENTE;

  useEffect(() => {
    if (abono) {
      setIdPedido(abono.idPedido || '');
      setMonto(abono.monto || '');
      setMetodoPago(isStaff ? abono.metodoPago || 'TRANSFERENCIA' : 'TRANSFERENCIA');
      setReferencia(abono.referencia || '');
      setComprobanteUrl(abono.comprobanteUrl || '');
      setConfirmar(false);
    } else {
      setIdPedido('');
      setMonto('');
      setMetodoPago('TRANSFERENCIA');
      setReferencia('');
      setComprobanteUrl('');
      setConfirmar(false);
    }
    setPedido(null);
    setAbonosPedido([]);
    setPedidoError('');
    setPedidosError('');
  }, [abono, isOpen, isStaff]);

  useEffect(() => {
    if (!metodosPagoDisponibles.includes(metodoPago)) {
      setMetodoPago('TRANSFERENCIA');
    }
    if (metodoPago === 'EFECTIVO') {
      setComprobanteUrl('');
    }
  }, [metodoPago, metodosPagoDisponibles]);

  useEffect(() => {
    if (!isOpen || isEditing || !getPedidos) return;

    let cancelled = false;
    setLoadingPedidos(true);
    setPedidosError('');

    getPedidos()
      .then((data) => {
        if (cancelled) return;
        const pendientesPago = (data || []).filter(item =>
          Number(item.saldoPendiente || 0) > 0 &&
          item.estadoPago !== 'COMPLETO'
        );
        setPedidosDisponibles(pendientesPago);
      })
      .catch((error) => {
        if (cancelled) return;
        setPedidosDisponibles([]);
        setPedidosError(error.message || 'No se pudieron consultar los pedidos disponibles.');
      })
      .finally(() => {
        if (!cancelled) setLoadingPedidos(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, isEditing, getPedidos]);

  useEffect(() => {
    if (!isOpen || !idPedido || !Number.isInteger(Number(idPedido))) return;

    let cancelled = false;
    setLoadingPedido(true);
    setPedidoError('');

    Promise.all([getPedido(idPedido), getAbonosByPedido(idPedido)])
      .then(([pedidoData, abonosData]) => {
        if (cancelled) return;
        setPedido(pedidoData);
        setAbonosPedido(abonosData);
      })
      .catch((error) => {
        if (cancelled) return;
        setPedido(null);
        setAbonosPedido([]);
        setPedidoError(error.message || 'No se pudo consultar el pedido.');
      })
      .finally(() => {
        if (!cancelled) setLoadingPedido(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idPedido, isOpen, getPedido, getAbonosByPedido]);

  const resumenPago = useMemo(() => {
    const total = Number(pedido?.totalPedido ?? pedido?.total ?? 0);
    const confirmedFromAbonos = abonosPedido
      .filter(item => item.estado === 'CONFIRMADO')
      .reduce((sum, item) => sum + Number(item.monto || 0), 0);
    const confirmado = Number(pedido?.totalConfirmado ?? pedido?.totalPagado ?? confirmedFromAbonos);
    const saldo = Number(pedido?.saldoPendiente ?? Math.max(total - confirmado, 0));
    const primerAbonoConfirmado = confirmado > 0;
    const minimo = Number(pedido?.montoMinimoPrimerAbono ?? total * 0.5);
    const estadoPago = pedido?.estadoPago || (saldo <= 0 ? 'COMPLETO' : confirmado > 0 ? 'PARCIAL' : 'PENDIENTE');

    return { total, confirmado, saldo, primerAbonoConfirmado, minimo, estadoPago };
  }, [pedido, abonosPedido]);

  const montoNumber = Number(monto || 0);
  const superaSaldo = pedido && montoNumber > resumenPago.saldo;
  const incumplePrimerAbono =
    pedido &&
    !resumenPago.primerAbonoConfirmado &&
    montoNumber > 0 &&
    montoNumber < resumenPago.minimo;

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    await runLocked(async () => {

    if (superaSaldo) {
      notifications.warning('El abono no puede superar el saldo pendiente del pedido.');
      return;
    }

    if ((confirmar || isEditing) && incumplePrimerAbono) {
      notifications.warning('El primer abono confirmado debe ser minimo del 50% del total del pedido o el pago completo.');
      return;
    }

    const payload = {
      idPedido,
      monto,
      metodoPago,
      referencia,
      comprobanteUrl: metodoPago === 'EFECTIVO' ? '' : comprobanteUrl,
      ...(isStaff && !isEditing && { confirmar }),
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      notifications.error(error.message || 'No se pudo procesar el abono.');
    }
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalSm}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEditing ? `Editar abono #${abono.idAbono}` : 'Registrar abono'}
          </h3>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn} disabled={isSubmitting}>x</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Pedido *</label>
              <select
                value={idPedido}
                onChange={event => setIdPedido(event.target.value)}
                className={styles.inputField}
                disabled={isSubmitting || isEditing || loadingPedidos}
                required
              >
                <option value="">
                  {loadingPedidos ? 'Cargando pedidos...' : 'Selecciona un pedido'}
                </option>
                {isEditing && idPedido ? (
                  <option value={idPedido}>Pedido #{idPedido}</option>
                ) : null}
                {pedidosDisponibles.map(item => (
                  <option key={item.idPedido} value={item.idPedido}>
                    Pedido #{item.idPedido} - Saldo ${Number(item.saldoPendiente || 0).toLocaleString('es-CO')}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Monto *</label>
              <input
                type="number"
                min="1"
                value={monto}
                onChange={event => setMonto(event.target.value)}
                className={styles.inputField}
                placeholder="50000"
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Metodo de pago *</label>
            <select
              value={metodoPago}
              onChange={event => setMetodoPago(event.target.value)}
              className={styles.inputField}
              required
            >
              {metodosPagoDisponibles.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Referencia</label>
            <input
              type="text"
              value={referencia}
              onChange={event => setReferencia(event.target.value)}
              className={styles.inputField}
              maxLength={255}
              placeholder="Nequi 123, transferencia bancaria..."
            />
          </div>

          {metodoPago !== 'EFECTIVO' && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Comprobante URL</label>
              <input
                type="url"
                value={comprobanteUrl}
                onChange={event => setComprobanteUrl(event.target.value)}
                className={styles.inputField}
                maxLength={500}
                placeholder="https://..."
              />
            </div>
          )}

          {loadingPedido && <p className={styles.loadingText}>Consultando pedido...</p>}
          {pedidosError && <p className={styles.detailsInfoBox}>{pedidosError}</p>}
          {!isEditing && !loadingPedidos && pedidosDisponibles.length === 0 && !pedidosError && (
            <p className={styles.detailsInfoBox}>
              No tienes pedidos pendientes de pago disponibles para registrar abonos.
            </p>
          )}
          {pedidoError && <p className={styles.detailsInfoBox}>{pedidoError}</p>}
          {pedido && (
            <div className={styles.paymentSummary}>
              <div className={styles.paymentSummaryItem}><span>Total del pedido</span><strong>${resumenPago.total.toLocaleString('es-CO')}</strong></div>
              <div className={styles.paymentSummaryItem}><span>Confirmado</span><strong>${resumenPago.confirmado.toLocaleString('es-CO')}</strong></div>
              <div className={styles.paymentSummaryItem}><span>Saldo pendiente</span><strong>${resumenPago.saldo.toLocaleString('es-CO')}</strong></div>
              <div className={styles.paymentSummaryItem}><span>Minimo primer abono</span><strong>${resumenPago.minimo.toLocaleString('es-CO')}</strong></div>
              <div className={styles.paymentSummaryItem}><span>Estado de pago</span><strong>{resumenPago.estadoPago}</strong></div>
            </div>
          )}

          {incumplePrimerAbono && (
            <div className={styles.detailsInfoBox}>
              Este monto no cumple el minimo del primer abono confirmado.
            </div>
          )}

          {isStaff && !isEditing && (
            <label className={styles.detailsInfoBox}>
              <span className={styles.inputLabel}>Confirmar al registrar</span>
              <input
                type="checkbox"
                checked={confirmar}
                onChange={event => setConfirmar(event.target.checked)}
              />
            </label>
          )}

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={isSubmitting || loadingPedido || loadingPedidos}>
              {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
