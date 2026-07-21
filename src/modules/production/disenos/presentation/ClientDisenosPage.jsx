/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { notifications } from '../../../../core/utils/notifications';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { useConfirm } from '../../../../shared/components/ConfirmDialog/ConfirmProvider';
import { useAuth } from '../../../../store/AuthContext';
import { formatDate } from '../../../../core/utils/fechaFormato';
import { disenoRepository } from '../infrastructure/diseno.repository';
import { DisenoViewModal } from './DisenoViewModal';
import './DisenosPage.css';

const styles = {
  pageContainer: 'disenos-page-container',
  headerWrapper: 'disenos-header-wrapper',
  breadcrumb: 'disenos-breadcrumb',
  pageTitle: 'disenos-page-title',
  pageSubtitle: 'disenos-page-subtitle',
  tableContainer: 'disenos-table-container',
  loadingText: 'disenos-loading-text',
  clientGrid: 'disenos-client-grid',
  clientCard: 'disenos-client-card',
  clientCardHeader: 'disenos-client-card-header',
  statusBadge: 'disenos-status-badge',
  estadoPagoParcial: 'disenos-status-warning',
  estadoPedidoEnProceso: 'disenos-status-info',
  estadoPagoCompleto: 'disenos-status-success',
  estadoRechazado: 'disenos-status-danger',
  detailsInfoBox: 'disenos-details-info-box',
  clientActions: 'disenos-client-actions',
  btnSecondary: 'disenos-btn-secondary',
  btnPrimary: 'disenos-btn-primary',
};

const ESTADO_CLASS = {
  PENDIENTE: styles.estadoPagoParcial,
  ENVIADO: styles.estadoPedidoEnProceso,
  APROBADO: styles.estadoPagoCompleto,
  RECHAZADO: styles.estadoRechazado,
};

const normalizeStatus = (value = '') => String(value || '').toUpperCase();
const formatDesignOrigin = (origen = '') => normalizeStatus(origen) === 'CLIENTE'
  ? 'Enviado por cliente'
  : 'Equipo PIXEL';
const canRespondDesign = (estado) => [
  'ENVIADO',
  'PENDIENTE_APROBACION',
  'PENDIENTE_DE_APROBACION',
  'POR_APROBAR',
  'EN_REVISION',
].includes(normalizeStatus(estado));

export const ClientDisenosPage = () => {
  const { hasPermission } = useAuth();
  const confirm = useConfirm();
  const { isLocked, runLocked } = useAsyncLock();
  const [disenos, setDisenos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDiseno, setSelectedDiseno] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [pendingActionId, setPendingActionId] = useState(null);

  const canApprove = hasPermission('disenos.cliente.aprobar');
  const canReject = hasPermission('disenos.cliente.rechazar');

  const fetchDisenos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await disenoRepository.listClientDesigns();
      setDisenos(data);
    } catch (error) {
      setDisenos([]);
      notifications.error(error.message || 'No se pudieron cargar tus disenos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisenos();
  }, [fetchDisenos]);

  const counts = useMemo(() => ({
    total: disenos.length,
    pendientes: disenos.filter((item) => canRespondDesign(item.estado)).length,
    aprobados: disenos.filter((item) => normalizeStatus(item.estado) === 'APROBADO').length,
    rechazados: disenos.filter((item) => normalizeStatus(item.estado) === 'RECHAZADO').length,
  }), [disenos]);

  const openDetail = async (diseno) => {
    setSelectedDiseno(diseno);
    setIsViewOpen(true);

    try {
      const detail = await disenoRepository.getClientDesign(diseno.idDiseno);
      setSelectedDiseno(detail || diseno);
    } catch (error) {
      notifications.error(error.message || 'No se pudo cargar el detalle del diseno.');
    }
  };

  const handleApprove = async (diseno) => {
    const accepted = await confirm({
      title: 'Aprobar diseno',
      message: 'Al aprobarlo, el pedido podra avanzar a produccion.',
      confirmText: 'Aprobar diseno',
      variant: 'success',
    });

    if (!accepted) return false;

    return runLocked(async () => {
      setPendingActionId(diseno.idDiseno);
      try {
        const response = await disenoRepository.approveClientDesign(diseno.idDiseno);
        notifications.success(response.message || 'Diseno aprobado. El pedido entro en produccion y el cliente sera notificado por correo.');
        await fetchDisenos();
        return true;
      } catch (error) {
        notifications.error(error.message || 'No se pudo aprobar el diseno.');
      } finally {
        setPendingActionId(null);
      }
    });
  };

  const handleReject = async (diseno) => {
    const result = await confirm({
      title: 'Solicitar cambios',
      message: 'Indica que cambios necesitas para este diseno.',
      confirmText: 'Enviar cambios',
      variant: 'danger',
      input: true,
      inputLabel: 'Cambios solicitados',
      inputPlaceholder: 'Ej: Cambiar color, tamano o ubicacion del logo...',
      requiredInput: true,
    });

    if (!result.confirmed) return false;

    return runLocked(async () => {
      setPendingActionId(diseno.idDiseno);
      try {
        const response = await disenoRepository.rejectClientDesign(diseno.idDiseno, {
          observacionesCliente: result.value,
        });
        notifications.success(response.message || 'Solicitud de cambios enviada correctamente.');
        await fetchDisenos();
        return true;
      } catch (error) {
        notifications.error(error.message || 'No se pudo rechazar el diseno.');
      } finally {
        setPendingActionId(null);
      }
    });
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Panel cliente / Disenos</span>
          <h1 className={styles.pageTitle}>Mis disenos</h1>
          <p className={styles.pageSubtitle}>
            Revisa las propuestas enviadas y aprueba o solicita cambios cuando corresponda.
          </p>
        </div>
      </div>

      <div className="disenos-kpi-grid">
        <div className="disenos-kpi-card"><span className="disenos-kpi-label">Total</span><span className="disenos-kpi-value">{counts.total}</span></div>
        <div className="disenos-kpi-card disenos-kpi-card-info"><span className="disenos-kpi-label">Por revisar</span><span className="disenos-kpi-value disenos-kpi-value-info">{counts.pendientes}</span></div>
        <div className="disenos-kpi-card disenos-kpi-card-success"><span className="disenos-kpi-label">Aprobados</span><span className="disenos-kpi-value disenos-kpi-value-success">{counts.aprobados}</span></div>
        <div className="disenos-kpi-card disenos-kpi-card-warning"><span className="disenos-kpi-label">Con cambios</span><span className="disenos-kpi-value disenos-kpi-value-warning">{counts.rechazados}</span></div>
      </div>

      <section className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando tus disenos...</p>
        ) : disenos.length === 0 ? (
          <p className={styles.loadingText}>Aun no tienes disenos enviados para revisar.</p>
        ) : (
          <div className={styles.clientGrid}>
            {disenos.map((diseno) => {
              const isPending = pendingActionId === diseno.idDiseno || isLocked;
              const canRespond = canRespondDesign(diseno.estado);
              const producto = diseno.pedido?.detalles?.[0]?.descripcion || diseno.descripcion || 'Producto no especificado';

              return (
                <article
                  key={diseno.idDiseno}
                  className={styles.clientCard}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(diseno)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openDetail(diseno);
                    }
                  }}
                  aria-label={`Ver detalle del diseno ${diseno.idDiseno}`}
                >
                  <div className={styles.clientCardHeader}>
                    <div>
                      <strong>Diseno #{diseno.idDiseno}</strong>
                      <span>Pedido #{diseno.idPedido} | {formatDate(diseno.fechaEnvio || diseno.fechaCreacion)}</span>
                    </div>
                    <span className={`${styles.statusBadge} ${ESTADO_CLASS[normalizeStatus(diseno.estado)] || ''}`}>
                      {diseno.estado}
                    </span>
                  </div>

                  <div className={styles.detailsInfoBox}>
                    <strong>Producto:</strong> {producto}
                  </div>

                  <div className={styles.detailsInfoBox}>
                    <strong>Origen:</strong> {formatDesignOrigin(diseno.origenDiseno)}
                    {diseno.medioRecepcion ? ` | ${diseno.medioRecepcion}` : ''}
                  </div>

                  {normalizeStatus(diseno.estado) === 'RECHAZADO' && (
                    <div className={styles.detailsInfoBox}>
                      <strong>Cambios solicitados:</strong> {diseno.observacionesCliente || 'Sin observaciones registradas'}
                    </div>
                  )}

                  <div className={styles.clientActions}>
                    {canRespond && canReject && (
                      <button type="button" className={styles.btnSecondary} onClick={(event) => { event.stopPropagation(); handleReject(diseno); }} disabled={isPending}>
                        {pendingActionId === diseno.idDiseno ? 'Enviando...' : 'Solicitar cambios'}
                      </button>
                    )}
                    {canRespond && canApprove && (
                      <button type="button" className={styles.btnPrimary} onClick={(event) => { event.stopPropagation(); handleApprove(diseno); }} disabled={isPending}>
                        {pendingActionId === diseno.idDiseno ? 'Aprobando...' : 'Aprobar'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <DisenoViewModal
        isOpen={isViewOpen}
        onClose={() => { setIsViewOpen(false); setSelectedDiseno(null); }}
        diseno={selectedDiseno}
        pendingAction={Boolean(pendingActionId) || isLocked}
        onApprove={canApprove ? async () => {
          const completed = await handleApprove(selectedDiseno);
          if (completed) {
            setIsViewOpen(false);
            setSelectedDiseno(null);
          }
        } : undefined}
        onReject={canReject ? async () => {
          const completed = await handleReject(selectedDiseno);
          if (completed) {
            setIsViewOpen(false);
            setSelectedDiseno(null);
          }
        } : undefined}
      />
    </div>
  );
};
