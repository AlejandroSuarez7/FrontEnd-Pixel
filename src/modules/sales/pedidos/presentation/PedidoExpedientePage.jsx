import {
  ArrowLeft,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Factory,
  FileText,
  Package,
  PackageCheck,
  Palette,
  Receipt,
  UserRound,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLatestListRequest } from '../../../../core/hooks/useLatestListRequest';
import { notifications } from '../../../../core/utils/notifications';
import { formatCalendarDate, formatDate } from '../../../../core/utils/fechaFormato';
import { getDesignCoverageInfo } from '../../../../core/utils/designCoverage';
import { formatPaymentOrigin } from '../../../../core/utils/paymentOrigin';
import { getProductCategoryName } from '../../../../core/utils/productCategory';
import { useConfirm } from '../../../../shared/components/ConfirmDialog/ConfirmProvider';
import { useAuth } from '../../../../store/AuthContext';
import { abonoRepository } from '../../abonos/infrastructure/abono.repository';
import { AbonoModal } from '../../abonos/presentation/AbonoModal';
import { ReceiptPreviewModal } from '../../abonos/presentation/ReceiptPreviewModal';
import { ReviewConfirmAbonoModal } from '../../abonos/presentation/ReviewConfirmAbonoModal';
import { disenoRepository } from '../../../production/disenos/infrastructure/diseno.repository';
import { DisenoModal } from '../../../production/disenos/presentation/DisenoModal';
import { pedidoRepository } from '../infrastructure/pedido.repository';
import { RegisterClientDesignModal } from './RegisterClientDesignModal';
import './pedido-expediente.css';

const formatMoney = value => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const actionLabels = {
  REQUIERE_PRIMER_ABONO: 'Requiere primer abono',
  COMPROBANTE_PENDIENTE_REVISION: 'Comprobante pendiente de revision',
  REQUIERE_DISENO: 'Requiere diseno',
  DISENO_PENDIENTE_APROBACION: 'Diseno pendiente de aprobacion',
  LISTO_PARA_PRODUCCION: 'Listo para produccion',
  EN_PRODUCCION: 'En produccion',
  PENDIENTE_SALDO_FINAL: 'Pendiente saldo final',
  LISTO_PARA_ENTREGAR: 'Listo para entregar',
  ENTREGADO: 'Entregado',
  ANULADO: 'Anulado',
};

const historyLabels = {
  PEDIDO_CREADO: 'Pedido creado',
  PEDIDO_FINALIZADO: 'Pedido finalizado',
  PEDIDO_ENTREGADO: 'Pedido entregado',
  ABONO_PENDIENTE: 'Abono pendiente de revision',
  ABONO_CONFIRMADO: 'Abono confirmado',
  ABONO_RECHAZADO: 'Abono rechazado',
  DISENO_PENDIENTE: 'Diseno pendiente',
  DISENO_ENVIADO: 'Diseno enviado al cliente',
  DISENO_APROBADO: 'Diseno aprobado',
  DISENO_RECHAZADO: 'Cambios solicitados al diseno',
};

const historyIcons = {
  PEDIDO_CREADO: Package,
  PEDIDO_FINALIZADO: PackageCheck,
  PEDIDO_ENTREGADO: PackageCheck,
  ABONO_PENDIENTE: Clock3,
  ABONO_CONFIRMADO: BadgeDollarSign,
  ABONO_RECHAZADO: XCircle,
  DISENO_PENDIENTE: Palette,
  DISENO_ENVIADO: Palette,
  DISENO_APROBADO: CheckCircle2,
  DISENO_RECHAZADO: XCircle,
  PRODUCCION: Factory,
  EN_PRODUCCION: Factory,
};

const formatStatus = value => String(value || 'Sin estado')
  .replaceAll('_', ' ')
  .toLocaleLowerCase('es')
  .replace(/^\p{L}/u, letter => letter.toLocaleUpperCase('es'));

const getStatusTone = value => {
  const status = String(value || '').toUpperCase();
  if (status.includes('APROBAD') || status.includes('COMPLET') || status.includes('ENTREGAD') || status.includes('FINALIZAD')) return 'success';
  if (status.includes('RECHAZ') || status.includes('ANULAD')) return 'danger';
  if (status.includes('PENDIENTE') || status.includes('PARCIAL')) return 'warning';
  if (status.includes('PROCESO') || status.includes('ENVIADO')) return 'info';
  return 'neutral';
};

const tabs = [
  { id: 'resumen', label: 'Resumen', icon: PackageCheck },
  { id: 'abonos', label: 'Abonos', icon: Receipt },
  { id: 'disenos', label: 'Disenos', icon: Palette },
  { id: 'historial', label: 'Historial', icon: FileText },
];

const DesignCoverageCard = ({
  detail,
  index,
  canManage,
  canRegisterClientFile,
  onCreate,
  onRegisterClientFile,
  onReview,
}) => {
  const coverage = getDesignCoverageInfo(detail);
  return (
    <article className="expediente-design-card">
      <div className="expediente-design-card-heading">
        <span className="expediente-item-index">Producto {index + 1}</span>
        <strong>{detail.producto?.nombre || detail.descripcion || 'Producto no especificado'}</strong>
        <small>Categoria: {getProductCategoryName(detail)}</small>
        <small>{detail.tecnica?.nombre || 'Tecnica no especificada'} · Cantidad {Number(detail.cantidad || 0).toLocaleString('es-CO')}</small>
      </div>
      <span className={`expediente-status-badge ${getStatusTone(coverage.state)}`}>{coverage.label}</span>
      <small className="expediente-design-message">{coverage.message}</small>
      <small>Origen: {detail.origenDiseno === 'CLIENTE' ? 'Cliente' : 'PIXEL'} · Costo: {formatMoney(detail.costoDiseno)}</small>
      {coverage.isGeneral && <strong className="expediente-general-badge">Diseno general del pedido</strong>}
      <div className="expediente-card-actions">
        {coverage.fileUrl && <a className="expediente-button secondary" href={coverage.fileUrl} target="_blank" rel="noreferrer">Ver diseno <ExternalLink size={14} /></a>}
        {canManage && coverage.canCreate && (
          <button className="expediente-button primary" type="button" onClick={onCreate}>
            {coverage.isCorrection ? 'Cargar diseno corregido' : 'Crear o asignar diseno'}
          </button>
        )}
        {canRegisterClientFile && coverage.canRegisterClientFile && (
          <button className="expediente-button primary" type="button" onClick={onRegisterClientFile}>
            Registrar diseno recibido
          </button>
        )}
        {canManage && coverage.canReview && !coverage.fileUrl && <button className="expediente-button secondary" type="button" onClick={onReview}>Revisar diseno</button>}
      </div>
    </article>
  );
};

export const PedidoExpedientePage = () => {
  const { idPedido } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('resumen');
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [reviewPayment, setReviewPayment] = useState(null);
  const [pendingActionId, setPendingActionId] = useState(null);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [designModalContext, setDesignModalContext] = useState(null);
  const [clientDesignDetail, setClientDesignDetail] = useState(null);

  const {
    data: expediente,
    loading,
    error,
    refetch: loadExpediente,
  } = useLatestListRequest({
    queryKey: String(idPedido || ''),
    load: signal => pedidoRepository.getExpediente(idPedido, { signal }),
    initialData: null,
  });

  const loadReceipt = useCallback(
    () => abonoRepository.getAdminReceipt(receiptPayment?.idAbono),
    [receiptPayment?.idAbono],
  );

  const summary = useMemo(() => expediente?.resumenEconomico || {}, [expediente?.resumenEconomico]);
  const pedido = useMemo(() => expediente?.pedido || {}, [expediente?.pedido]);
  const client = useMemo(() => expediente?.cliente || {}, [expediente?.cliente]);
  const tabCounts = {
    abonos: expediente?.abonos?.length || 0,
    disenos: expediente?.detalles?.length || 0,
    historial: expediente?.historial?.length || 0,
  };
  const paymentById = useMemo(
    () => new Map((expediente?.abonos || []).map(item => [item.idAbono, item])),
    [expediente?.abonos],
  );
  const presetPedido = useMemo(() => ({
    ...pedido,
    idPedido: pedido.idPedido || Number(idPedido),
    cliente: client,
    detalles: expediente?.detalles || [],
    total: summary.total,
    totalPedido: summary.total,
    totalConfirmado: summary.totalConfirmado,
    totalPagado: summary.totalConfirmado,
    saldoPendiente: summary.saldoPendiente,
    estadoPago: summary.estadoPago || pedido.estadoPago,
    montoMinimoPrimerAbono:
      expediente?.montoMinimoPrimerAbono
      ?? summary.montoMinimoPrimerAbono
      ?? pedido.montoMinimoPrimerAbono,
  }), [client, expediente?.detalles, expediente?.montoMinimoPrimerAbono, idPedido, pedido, summary]);

  const handleCreatePayment = async payload => {
    await abonoRepository.create(payload);
    setShowAbonoModal(false);
    await loadExpediente();
    notifications.success('Abono registrado correctamente.');
  };

  const handleCreateDesign = async payload => {
    await disenoRepository.create(payload);
    setDesignModalContext(null);
    await loadExpediente();
    notifications.success('Diseno registrado correctamente.');
  };

  const handleRegisterClientDesign = async payload => {
    await pedidoRepository.registrarDisenoRecibidoCliente(
      pedido.idPedido,
      clientDesignDetail.idDetallePedido,
      payload,
    );
    await loadExpediente();
    setClientDesignDetail(null);
    notifications.success('Diseno recibido. Quedo pendiente de revision.');
  };

  const openDesignModal = detail => {
    const coverage = detail ? getDesignCoverageInfo(detail) : null;
    if (detail && !coverage?.canCreate) {
      notifications.info(coverage?.message || 'Este producto no admite un nuevo diseno.');
      return;
    }
    setDesignModalContext({ detailId: detail?.idDetallePedido || '' });
  };

  const handleRejectPayment = async payment => {
    const result = await confirm({
      title: 'Rechazar abono',
      message: `Indica por que se rechaza el comprobante del abono #${payment.idAbono}.`,
      confirmText: 'Rechazar',
      variant: 'danger',
      input: true,
      inputPlaceholder: 'Motivo de rechazo',
      requiredInput: true,
    });
    if (!result.confirmed) return;

    setPendingActionId(payment.idAbono);
    try {
      await abonoRepository.reject(payment.idAbono, result.value);
      await loadExpediente();
      notifications.success('Abono rechazado.');
    } catch (requestError) {
      notifications.error(requestError.message || 'No se pudo rechazar el abono.');
    } finally {
      setPendingActionId(null);
    }
  };

  if (loading) return <div className="expediente-state">Cargando expediente del pedido...</div>;
  if (error || !expediente) {
    return (
      <div className="expediente-state expediente-error">
        <p>{error?.message || 'Expediente no disponible.'}</p>
        <button type="button" className="expediente-back" onClick={loadExpediente}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <main className="expediente-page">
      <button type="button" className="expediente-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Volver a pedidos
      </button>

      <header className="expediente-header">
        <div className="expediente-header-main">
          <span className="expediente-eyebrow">Expediente central</span>
          <h1>Pedido #{pedido.idPedido}</h1>
          <div className="expediente-client">
            <span className="expediente-client-icon"><UserRound size={17} /></span>
            <div>
              <strong>{client.nombre || 'Cliente no especificado'}</strong>
              <p>{[client.correo, client.telefono].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</p>
            </div>
          </div>
        </div>
        <div className="expediente-header-badges">
          <div>
            <small>Estado del pedido</small>
            <span className={`expediente-status-badge ${getStatusTone(pedido.estadoPedido)}`}>{formatStatus(pedido.estadoPedido)}</span>
          </div>
          <div>
            <small>Estado del pago</small>
            <span className={`expediente-status-badge ${getStatusTone(summary.estadoPago || pedido.estadoPago)}`}>{formatStatus(summary.estadoPago || pedido.estadoPago || 'Pago pendiente')}</span>
          </div>
        </div>
      </header>

      <section className="expediente-kpis">
        <div><span className="expediente-kpi-icon purple"><CircleDollarSign size={19} /></span><div><span>Total</span><strong>{formatMoney(summary.total)}</strong></div></div>
        <div><span className="expediente-kpi-icon green"><WalletCards size={19} /></span><div><span>Pagado</span><strong>{formatMoney(summary.totalConfirmado)}</strong></div></div>
        <div><span className="expediente-kpi-icon orange"><BadgeDollarSign size={19} /></span><div><span>Saldo pendiente</span><strong>{formatMoney(summary.saldoPendiente)}</strong></div></div>
        <div><span className="expediente-kpi-icon blue"><CalendarDays size={19} /></span><div><span>Entrega estimada</span><strong>{formatCalendarDate(pedido.fechaEntregaEstimada)}</strong></div></div>
      </section>

      <nav className="expediente-tabs" aria-label="Secciones del expediente" role="tablist">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              <Icon size={17} /> <span>{tab.label}</span>
              {tabCounts[tab.id] != null && <small>{tabCounts[tab.id]}</small>}
            </button>
          );
        })}
      </nav>

      {activeTab === 'resumen' && (
        <section className="expediente-content">
          <div className="expediente-section-heading">
            <div><span>Productos</span><h2>Detalle del pedido</h2></div>
          </div>
          <div className="expediente-product-list">
            {(expediente.detalles || []).map((detail, index) => {
              const coverage = getDesignCoverageInfo(detail);
              return (
              <article className="expediente-product-card" key={detail.idDetallePedido || index}>
                <div className="expediente-product-main">
                  <span className="expediente-item-index">Producto {index + 1}</span>
                  <strong>{detail.producto?.nombre || detail.descripcion || 'Producto no especificado'}</strong>
                  <small>Categoria: {getProductCategoryName(detail)}</small>
                  <small>{detail.tecnica?.nombre || 'Tecnica no especificada'} · Cantidad {Number(detail.cantidad || 0).toLocaleString('es-CO')}</small>
                </div>
                <div className="expediente-product-design">
                  <span>Diseno</span>
                  <strong className={`expediente-status-badge ${getStatusTone(coverage.state)}`}>{coverage.label}</strong>
                  <small>{coverage.message}</small>
                </div>
                <div className="expediente-product-value">
                  <span>Valor</span>
                  <strong>{formatMoney(detail.subtotalConDescuento ?? detail.subtotalFinal ?? detail.subtotal)}</strong>
                  <div className="expediente-card-actions">
                    {coverage.fileUrl && <a className="expediente-button secondary" href={coverage.fileUrl} target="_blank" rel="noreferrer">Ver diseno</a>}
                    {(hasPermission('disenos.crear') || hasPermission('disenos.editar')) && coverage.canCreate && (
                      <button className="expediente-button primary" type="button" onClick={() => openDesignModal(detail)}>
                        {coverage.isCorrection ? 'Cargar diseno corregido' : 'Crear o asignar diseno'}
                      </button>
                    )}
                    {hasPermission('disenos.crear') && coverage.canRegisterClientFile && (
                      <button className="expediente-button primary" type="button" onClick={() => setClientDesignDetail(detail)}>
                        Registrar diseno recibido
                      </button>
                    )}
                  </div>
                </div>
              </article>
              );
            })}
          </div>

          <div className="expediente-summary-grid">
            <section>
              <h2>Proximas acciones</h2>
              <div className="expediente-actions-list">
                {(expediente.proximasAcciones || []).map(action => (
                  <span key={action}><CheckCircle2 size={16} /> {actionLabels[action] || action.replaceAll('_', ' ').toLowerCase()}</span>
                ))}
                {(expediente.proximasAcciones || []).length === 0 && <p>No hay acciones pendientes.</p>}
              </div>
            </section>
            <section>
              <h2>Venta asociada</h2>
              {expediente.venta ? (
                <div className="expediente-sale">
                  <strong>Venta #{expediente.venta.idVenta}</strong>
                  <span className={`expediente-status-badge ${getStatusTone(expediente.venta.estado)}`}>{formatStatus(expediente.venta.estado)}</span>
                  <span>Total pagado: {formatMoney(expediente.venta.totalPagado ?? summary.totalConfirmado)}</span>
                  <span>Saldo: {formatMoney(expediente.venta.saldoPendiente ?? summary.saldoPendiente)}</span>
                </div>
              ) : <p>La venta se creara cuando se confirme el primer abono.</p>}
            </section>
          </div>
        </section>
      )}

      {activeTab === 'abonos' && (
        <section className="expediente-content">
          <div className="expediente-section-heading">
            <div><span>Pagos</span><h2>Abonos del pedido</h2></div>
            {hasPermission('abonos.crear') && (
              <div className="expediente-heading-actions">
                <button type="button" onClick={() => setShowAbonoModal(true)}>Registrar abono</button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => navigate('/dashboard/sales/payments', {
                    state: {
                      idPedido: pedido.idPedido,
                      idCliente: client.idCliente || pedido.idCliente,
                    },
                  })}
                >
                  Ver todos <ExternalLink size={15} />
                </button>
              </div>
            )}
          </div>
          <div className="expediente-payment-list">
            {(expediente.abonos || []).map(payment => (
              <article className="expediente-payment-card" key={payment.idAbono}>
                <div className="expediente-payment-amount">
                  <span>Monto</span>
                  <strong>{payment.monto == null ? 'Monto pendiente de revision' : formatMoney(payment.monto)}</strong>
                  <small>Detectado: {payment.montoDetectadoOcr == null ? 'No identificado' : formatMoney(payment.montoDetectadoOcr)}</small>
                </div>
                <div><span className={`expediente-status-badge ${getStatusTone(payment.estado)}`}>{formatStatus(payment.estado)}</span><small>{payment.metodoPago || 'TRANSFERENCIA'} · {formatDate(payment.fechaCreacion)}</small></div>
                <div><span className="expediente-reference">{payment.referencia || payment.referenciaDetectadaOcr || 'Sin referencia'}</span><small>{payment.requiereRevisionManual ? 'Revision manual' : formatPaymentOrigin(payment)}</small></div>
                <div className="expediente-row-actions">
                  {payment.comprobanteDisponible && <button className="expediente-button secondary" type="button" onClick={() => setReceiptPayment(payment)}>Ver comprobante</button>}
                  {payment.estado === 'PENDIENTE' && hasPermission('abonos.confirmar') && (
                    <button className="expediente-button primary" type="button" disabled={pendingActionId === payment.idAbono} onClick={() => setReviewPayment(payment)}>Revisar y confirmar</button>
                  )}
                  {payment.estado === 'PENDIENTE' && hasPermission('abonos.rechazar') && (
                    <button type="button" className="expediente-button danger" disabled={pendingActionId === payment.idAbono} onClick={() => handleRejectPayment(payment)}>Rechazar</button>
                  )}
                </div>
              </article>
            ))}
            {(expediente.abonos || []).length === 0 && <p className="expediente-empty">No hay abonos registrados.</p>}
          </div>
        </section>
      )}

      {activeTab === 'disenos' && (
        <section className="expediente-content">
          <div className="expediente-section-heading">
            <div><span>Disenos</span><h2>Disenos por producto</h2></div>
            {hasPermission('disenos.ver') && (
              <div className="expediente-heading-actions">
                {hasPermission('disenos.crear') && <button type="button" onClick={() => openDesignModal(null)}>Nuevo diseno</button>}
                <button type="button" className="secondary" onClick={() => navigate('/dashboard/production/designs')}>Ver todos <ExternalLink size={15} /></button>
              </div>
            )}
          </div>
          <div className="expediente-design-grid">
            {(expediente.detalles || []).map((detail, index) => (
              <DesignCoverageCard
                key={detail.idDetallePedido || index}
                detail={detail}
                index={index}
                canManage={hasPermission('disenos.crear') || hasPermission('disenos.editar')}
                canRegisterClientFile={hasPermission('disenos.crear')}
                onCreate={() => openDesignModal(detail)}
                onRegisterClientFile={() => setClientDesignDetail(detail)}
                onReview={() => navigate('/dashboard/production/designs')}
              />
            ))}
            {(expediente.detalles || []).length === 0 && <p className="expediente-empty">No hay productos para revisar.</p>}
          </div>
        </section>
      )}

      {activeTab === 'historial' && (
        <section className="expediente-content">
          <div className="expediente-section-heading"><div><span>Actividad</span><h2>Historial del pedido</h2></div></div>
          <div className="expediente-history">
            {(expediente.historial || []).map((event, index) => {
              const EventIcon = historyIcons[event.tipo] || Clock3;
              return (
              <article className={`event-${getStatusTone(event.tipo)}`} key={`${event.tipo}-${event.fecha}-${index}`}>
                <span><EventIcon size={14} /></span>
                <div>
                  <strong>{historyLabels[event.tipo] || event.tipo.replaceAll('_', ' ').toLowerCase()}</strong>
                  <small>{formatDate(event.fecha)}</small>
                  {(event.detalle || event.descripcion || event.observaciones) && <p>{event.detalle || event.descripcion || event.observaciones}</p>}
                </div>
                {event.idAbono && <small>Abono #{paymentById.get(event.idAbono)?.idAbono || event.idAbono}</small>}
                {event.idDiseno && <small>Diseno #{event.idDiseno}</small>}
              </article>
              );
            })}
            {(expediente.historial || []).length === 0 && <p className="expediente-empty">Aun no hay eventos registrados para este pedido.</p>}
          </div>
        </section>
      )}

      <ReceiptPreviewModal
        isOpen={Boolean(receiptPayment)}
        onClose={() => setReceiptPayment(null)}
        loadReceipt={loadReceipt}
        title={`Comprobante del abono #${receiptPayment?.idAbono || ''}`}
      />
      <ReviewConfirmAbonoModal
        isOpen={Boolean(reviewPayment)}
        abono={reviewPayment}
        onClose={() => setReviewPayment(null)}
        onCompleted={loadExpediente}
        canReject={hasPermission('abonos.rechazar')}
      />
      {showAbonoModal && (
        <AbonoModal
          isOpen
          onClose={() => setShowAbonoModal(false)}
          onSubmit={handleCreatePayment}
          isStaff
          getPedido={abonoRepository.getPedido.bind(abonoRepository)}
          getAbonosByPedido={abonoRepository.listByPedido.bind(abonoRepository)}
          getPedidos={abonoRepository.listPedidos.bind(abonoRepository)}
          presetPedido={presetPedido}
          presetAbonos={expediente.abonos || []}
          lockPedido
        />
      )}
      <DisenoModal
        isOpen={Boolean(designModalContext)}
        onClose={() => setDesignModalContext(null)}
        onSubmit={handleCreateDesign}
        isStaff
        getPedidos={disenoRepository.listPedidos.bind(disenoRepository)}
        presetPedido={presetPedido}
        presetDetailId={designModalContext?.detailId || ''}
        lockPedido
      />
      <RegisterClientDesignModal
        isOpen={Boolean(clientDesignDetail)}
        pedido={pedido}
        detail={clientDesignDetail}
        onClose={() => setClientDesignDetail(null)}
        onSubmit={handleRegisterClientDesign}
      />
    </main>
  );
};
