import { useState } from 'react';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { Pagination } from '../../../core/components/Pagination';
import { formatMoneyCOP } from '../../../core/utils/formatters';
import { notifications } from '../../../core/utils/notifications';
import { isClientUser } from '../../../core/utils/permissions';
import { DEFAULT_PAGE_SIZE } from '../../../core/utils/serverPagination';
import { useConfirm } from '../../../shared/components/ConfirmDialog/ConfirmProvider';
import { SafeDeleteModal } from '../../../shared/components/SafeDeleteModal/SafeDeleteModal';
import { SAFE_DELETE_IMPACT_ENDPOINTS } from '../../../shared/components/SafeDeleteModal/safeDeleteEndpoints';
import { TableActions } from '../../../shared/components/TableActions/TableActions';
import { useAuth } from '../../../store/AuthContext';
import { useQuotes } from '../cotizaciones/application/useQuotes';
import { QuoteFormModal } from '../cotizaciones/presentation/QuoteFormModal';
import { QuoteDetailsModal } from '../cotizaciones/presentation/QuoteDetailsModal';
import { QuoteProposalModal } from '../cotizaciones/presentation/QuoteProposalModal';
import { QuoteResponseModal } from '../cotizaciones/presentation/QuoteResponseModal';
import {
  canRespondToProposal,
  getClientVisibleQuoteTotal,
  getCurrentQuoteVersion,
  getQuoteStatusLabel,
  isEditableRequestStatus,
  isFinalQuoteStatus,
  isQuoteProposalExpired,
} from '../cotizaciones/presentation/quoteWorkflow.utils';
import styles from '../cotizaciones/presentation/quotes.module.css';

const STAFF_FINAL_STATUSES = new Set([
  'ANULADA',
  'CONVERTIDA_EN_PEDIDO',
  'ACEPTADA',
  'APROBADA',
]);

const getStatusClass = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (['ACEPTADA', 'CONVERTIDA_EN_PEDIDO', 'APROBADA'].includes(normalized)) {
    return styles.statusAprobada;
  }
  if (['ANULADA', 'RECHAZADA_CLIENTE', 'RECHAZADA'].includes(normalized)) {
    return styles.statusAnulada;
  }
  if (normalized === 'PENDIENTE_APROBACION_CLIENTE') return styles.statusCotizada;
  if (normalized === 'VENCIDA') return styles.statusNeutral;
  return styles.statusPendiente;
};

const getContactText = (cliente) => (
  [cliente?.correo, cliente?.telefono].filter(Boolean).join(' | ')
);

const getProductsText = (quote) => {
  if (quote.productosResumen) {
    const count = Number(quote.cantidadItems || quote.detalles?.length || 0);
    return count > 1
      ? `${quote.productosResumen} (${count} productos)`
      : quote.productosResumen;
  }

  const details = quote.detalles || [];
  if (details.length === 0) return 'Sin productos';
  const names = details
    .slice(0, 2)
    .map((detail) => detail.producto?.nombre || detail.nombrePersonalizado || detail.descripcion)
    .filter(Boolean)
    .join(', ');
  return details.length > 2 ? `${names} y ${details.length - 2} mas` : names;
};

const getQuoteDisplayTotal = (quote, isClient) => {
  if (isClient) return getClientVisibleQuoteTotal(quote);
  const currentProposal = getCurrentQuoteVersion(quote);
  const proposalValue = Number(currentProposal?.precioFinal);
  if (Number.isFinite(proposalValue) && proposalValue > 0) return proposalValue;
  const value = Number(quote.total);
  return Number.isFinite(value) && value > 0 ? value : null;
};

const QuotesPage = () => {
  const { user, permissions, hasPermission } = useAuth();
  const confirm = useConfirm();
  const isClient = isClientUser(user, permissions);
  const isStaff = !isClient;
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebounce(searchTerm, 350);

  const {
    quotes,
    loading,
    error,
    refetch,
    handleCreate,
    updateRequest,
    handleCancel,
    handleHardDelete,
    sendProposal,
    respondAsClient,
    respondAsStaff,
    paginationMeta,
  } = useQuotes({
    page: currentPage,
    limit: DEFAULT_PAGE_SIZE,
    search: debouncedSearch,
    sortBy: 'idCotizacion',
    order: 'desc',
  });

  const [formQuote, setFormQuote] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [detailsQuote, setDetailsQuote] = useState(null);
  const [proposalQuote, setProposalQuote] = useState(null);
  const [responseState, setResponseState] = useState(null);
  const [deletionQuote, setDeletionQuote] = useState(null);

  const canCreateStaffQuote = isStaff && hasPermission('cotizaciones.crear_presencial');
  const canSendProposal = isStaff && hasPermission('cotizaciones.propuesta.enviar');
  const canRegisterResponse = isStaff && hasPermission('cotizaciones.respuesta_cliente.registrar');
  const canClientRespond = isClient && hasPermission('cotizaciones.cliente.responder');

  const openCreate = () => {
    setFormQuote(null);
    setIsFormOpen(true);
  };

  const openEdit = (quote) => {
    setFormQuote(quote);
    setIsFormOpen(true);
  };

  const submitRequest = async (payload) => {
    const { immediateProposal, ...requestPayload } = payload;
    if (formQuote) {
      await updateRequest(formQuote.idCotizacion, requestPayload);
      notifications.success('Solicitud actualizada correctamente.');
    } else {
      const createdQuote = await handleCreate(requestPayload, true);
      if (immediateProposal?.enabled) {
        try {
          await sendProposal(createdQuote.idCotizacion, immediateProposal.payload);
          notifications.success('Cotizacion creada y propuesta enviada al cliente correctamente.');
        } catch {
          setIsFormOpen(false);
          setFormQuote(null);
          notifications.warning('La solicitud fue creada, pero no pudimos enviar la propuesta. Puedes retomarla desde Gestion de Cotizaciones.');
          return;
        }
      } else {
      notifications.success(
        'Cotizacion creada correctamente. El cliente sera notificado por correo. Recuerdale revisar SPAM o correo no deseado si no lo encuentra.'
      );
      }
    }
    setIsFormOpen(false);
    setFormQuote(null);
  };

  const submitProposal = async (payload) => {
    await sendProposal(proposalQuote.idCotizacion, payload);
    notifications.success('Propuesta enviada al cliente correctamente.');
  };

  const submitResponse = async (payload) => {
    const quote = responseState.quote;
    const result = isStaff
      ? await respondAsStaff(quote.idCotizacion, payload)
      : await respondAsClient(quote.idCotizacion, payload);

    if (payload.decision === 'ACEPTAR') {
      const orderId = result?.pedido?.idPedido || result?.idPedido;
      notifications.success(
        orderId
          ? `Propuesta aceptada. Se creo el pedido #${orderId}.`
          : 'Propuesta aceptada. El pedido fue creado correctamente.'
      );
    } else if (payload.decision === 'SOLICITAR_AJUSTE') {
      notifications.success('Solicitud de ajuste registrada.');
    } else {
      notifications.success('Propuesta rechazada correctamente.');
    }
  };

  const cancelQuote = async (quote) => {
    const accepted = await confirm({
      title: 'Anular cotizacion',
      message: `¿Confirmas anular la cotizacion #${quote.idCotizacion}?`,
      confirmText: 'Anular',
      variant: 'danger',
    });
    if (!accepted) return;

    try {
      await handleCancel(quote.idCotizacion);
      notifications.success('Cotizacion anulada correctamente.');
    } catch (requestError) {
      notifications.error(requestError.message || 'No se pudo anular la cotizacion.');
    }
  };

  const actionList = (quote) => {
    const status = String(quote.estado || '').toUpperCase();
    const currentVersion = getCurrentQuoteVersion(quote);
    const actions = [];

    if (isStaff) {
      if (
        hasPermission('cotizaciones.editar')
        && isEditableRequestStatus(status)
        && status !== 'PENDIENTE_APROBACION_CLIENTE'
      ) {
        actions.push({
          label: 'Editar solicitud',
          onClick: () => openEdit(quote),
          variant: 'warning',
        });
      }

      if (canSendProposal && !STAFF_FINAL_STATUSES.has(status)) {
        actions.push({
          label: currentVersion ? 'Enviar nueva propuesta' : 'Enviar propuesta',
          onClick: () => setProposalQuote(quote),
          variant: 'info',
        });
      }

      if (canRegisterResponse && canRespondToProposal(quote)) {
        actions.push({
          label: 'Registrar respuesta',
          onClick: () => setResponseState({ quote, version: currentVersion }),
          variant: 'success',
        });
      }

      if (hasPermission('cotizaciones.anular') && !isFinalQuoteStatus(status)) {
        actions.push({
          label: 'Anular',
          onClick: () => cancelQuote(quote),
          variant: 'danger',
        });
      }

      if (
        hasPermission('cotizaciones.eliminar')
        && !['APROBADA', 'ACEPTADA', 'CONVERTIDA_EN_PEDIDO'].includes(status)
      ) {
        actions.push({
          label: 'Eliminar',
          onClick: () => setDeletionQuote(quote),
          variant: 'danger',
        });
      }
    } else if (canClientRespond && canRespondToProposal(quote)) {
      actions.push({
        label: 'Responder propuesta',
        onClick: () => setResponseState({ quote, version: currentVersion }),
        variant: 'success',
      });
    }

    return actions;
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>
            {isClient ? 'Panel cliente / Cotizaciones' : 'Ventas / Cotizaciones'}
          </span>
          <h1 className={styles.pageTitle}>
            {isClient ? 'Mis cotizaciones' : 'Gestion de Cotizaciones'}
          </h1>
          <p className={styles.pageSubtitle}>
            {isClient
              ? 'Consulta tus solicitudes, revisa propuestas y responde al equipo de PIXEL.'
              : 'Revisa solicitudes, prepara propuestas oficiales y registra la respuesta del cliente.'}
          </p>
        </div>

        {canCreateStaffQuote && (
          <button type="button" onClick={openCreate} className={styles.primaryButton}>
            Nueva cotizacion presencial
          </button>
        )}
      </div>

      <div className={styles.filterSection}>
        <input
          type="search"
          placeholder={isClient ? 'Buscar por producto o estado...' : 'Buscar por cliente, producto o estado...'}
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setCurrentPage(1);
          }}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando cotizaciones...</p>
        ) : error && quotes.length === 0 ? (
          <div className={styles.loadingText}>
            <p>{error.message || 'No se pudieron cargar las cotizaciones.'}</p>
            <button type="button" className={styles.primaryButton} onClick={refetch}>
              Reintentar
            </button>
          </div>
        ) : quotes.length === 0 ? (
          <div className={styles.emptyQuotesState}>
            <strong>No hay cotizaciones para mostrar.</strong>
            <span>
              {isClient
                ? 'Cuando envies una solicitud aparecera aqui.'
                : 'Prueba con otra busqueda o crea una cotizacion presencial.'}
            </span>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeader}>ID</th>
                  {!isClient && <th className={styles.tableHeader}>Cliente</th>}
                  <th className={styles.tableHeader}>Productos</th>
                  <th className={styles.tableHeader}>Canal</th>
                  <th className={styles.tableHeader}>Estado</th>
                  <th className={styles.tableHeader}>Propuesta</th>
                  <th className={styles.tableHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => {
                  const proposal = getCurrentQuoteVersion(quote);
                  const displayTotal = getQuoteDisplayTotal(quote, isClient);
                  const expired = isQuoteProposalExpired(proposal);

                  return (
                    <tr key={quote.idCotizacion} className={styles.tableBodyRow}>
                      <td className={styles.tableCellId}>#{quote.idCotizacion}</td>
                      {!isClient && (
                        <td className={styles.tableCell}>
                          <span className={styles.clientName}>{quote.cliente?.nombre || 'Sin nombre'}</span>
                          <span className={styles.clientEmail} title={getContactText(quote.cliente)}>
                            {getContactText(quote.cliente) || 'Sin contacto'}
                          </span>
                        </td>
                      )}
                      <td className={styles.tableCell}>
                        <span className={styles.productSummary}>{getProductsText(quote)}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.typeBadge}>{quote.tipoCotizacion || 'Normal'}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.statusBadge} ${getStatusClass(quote.estado)}`}>
                          {getQuoteStatusLabel(quote.estado)}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <strong className={styles.totalPrice}>
                          {displayTotal == null
                            ? <span className={styles.pricePending}>Precio pendiente de confirmacion</span>
                            : formatMoneyCOP(displayTotal)}
                        </strong>
                        {proposal && (
                          <small className={styles.proposalMeta}>
                            {expired ? 'Propuesta vencida' : 'Propuesta vigente'}
                          </small>
                        )}
                      </td>
                      <td className={styles.actionsCell}>
                        <TableActions
                          primaryAction={{
                            label: 'Ver',
                            onClick: () => setDetailsQuote(quote),
                            variant: 'accent',
                          }}
                          actions={actionList(quote)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          classNames={styles}
          currentPage={currentPage}
          hasNextPage={paginationMeta.hasNextPage}
          hasPrevPage={paginationMeta.hasPrevPage}
          onPageChange={setCurrentPage}
          pageSize={paginationMeta.limit}
          totalItems={paginationMeta.total}
          totalPages={paginationMeta.totalPages}
        />
      </div>

      {isFormOpen && (
        <QuoteFormModal
          key={formQuote?.idCotizacion || 'new-request'}
          isOpen
          onClose={() => {
            setIsFormOpen(false);
            setFormQuote(null);
          }}
          onSubmit={submitRequest}
          quote={formQuote}
          isStaff
          mode="request"
        />
      )}

      {detailsQuote && (
        <QuoteDetailsModal
          key={detailsQuote.idCotizacion}
          isOpen
          onClose={() => setDetailsQuote(null)}
          quote={detailsQuote}
          isStaff={isStaff}
        />
      )}

      {proposalQuote && (
        <QuoteProposalModal
          key={proposalQuote.idCotizacion}
          open
          quote={proposalQuote}
          onClose={() => setProposalQuote(null)}
          onSubmit={submitProposal}
        />
      )}

      {responseState && (
        <QuoteResponseModal
          key={`${responseState.quote.idCotizacion}-${responseState.version.idVersion}`}
          open
          quote={responseState.quote}
          version={responseState.version}
          isStaff={isStaff}
          onClose={() => setResponseState(null)}
          onSubmit={submitResponse}
        />
      )}

      <SafeDeleteModal
        key={deletionQuote?.idCotizacion || 'quote-delete'}
        isOpen={Boolean(deletionQuote)}
        entityLabel="cotización"
        entityName={deletionQuote ? `Cotización #${deletionQuote.idCotizacion}` : ''}
        impactEndpoint={deletionQuote ? SAFE_DELETE_IMPACT_ENDPOINTS.quote(deletionQuote.idCotizacion) : ''}
        deleteAction={() => handleHardDelete(deletionQuote.idCotizacion)}
        successMessage="Cotización eliminada correctamente."
        onClose={() => setDeletionQuote(null)}
      />
    </div>
  );
};

export default QuotesPage;
