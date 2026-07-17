// presentation/pages/QuotesPage.jsx
import { useState } from 'react';
import { Pagination } from '../../../core/components/Pagination';
import { notifications } from '../../../core/utils/notifications';
import { DEFAULT_PAGE_SIZE } from '../../../core/utils/serverPagination';
import { useConfirm } from '../../../shared/components/ConfirmDialog/ConfirmProvider';
import { TableActions } from '../../../shared/components/TableActions/TableActions';
import { useAuth } from '../../../store/AuthContext';
import { useQuotes } from '../cotizaciones/application/useQuotes';
import { QuoteFormModal } from '../cotizaciones/presentation/QuoteFormModal';
import { QuoteDetailsModal } from '../cotizaciones/presentation/QuoteDetailsModal';
import styles from '../cotizaciones/presentation/quotes.module.css';

const QuotesPage = () => {
  const { hasPermission } = useAuth();
  const confirm = useConfirm();
  const session  = JSON.parse(localStorage.getItem('pixel_user') || '{}');
  const userRole = session?.rol?.nombre || 'Cliente';
  const isStaff  = userRole === 'Admin' || userRole === 'Secretaria';

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    quotes,
    loading,
    handleCreate,
    handleUpdate,
    handleApprove,
    handleCancel,
    handleHardDelete,
    paginationMeta,
  } = useQuotes({
    page: currentPage,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm,
    sortBy: 'idCotizacion',
    order: 'desc',
  });

  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const [isDetailsOpen, setIsDetailsOpen]                     = useState(false);
  const [selectedQuoteForDetails, setSelectedQuoteForDetails] = useState(null);
  const handleOpenCreate = () => {
    setSelectedQuote(null);
    setIsModalOpen(true);
  };

  const handleOpenEditOrPrice = (quote) => {
    setSelectedQuote(quote);
    setIsModalOpen(true);
  };

  const canCreateQuote = isStaff
    ? hasPermission('cotizaciones.crear_presencial')
    : hasPermission('cotizaciones.crear_cliente');

  const handleSubmitForm = async (payload) => {
    if (selectedQuote) {
      await handleUpdate(selectedQuote.idCotizacion, payload, isStaff);
    } else {
      await handleCreate(payload, isStaff);
    }
    setIsModalOpen(false);
  };

  // Solo existen PENDIENTE, APROBADA y ANULADA en el backend.
  // Dentro de PENDIENTE distinguimos si ya tiene precios (total > 0) para mostrar badge distinto.
  const getStatusLabel = (quote) => {
    if (quote.estado === 'PENDIENTE' && Number(quote.total) > 0) return 'POR APROBAR';
    return quote.estado;
  };


  const getStatusClass = (quote) => {
    if (quote.estado === 'PENDIENTE' && Number(quote.total) > 0) return styles.statusCotizada;
    switch (quote.estado) {
      case 'PENDIENTE': return styles.statusPendiente;
      case 'APROBADA':  return styles.statusAprobada;
      case 'ANULADA':   return styles.statusAnulada;
      default:          return '';
    }
  };

  // Una cotización PENDIENTE es editable por el Staff siempre.
  // El cliente solo puede editar si todavía no tiene precios (total === 0).
  const canBePricedOrEdited = (quote) => {
    if (quote.estado !== 'PENDIENTE') return false;
    if (isStaff) return hasPermission('cotizaciones.cotizar') || hasPermission('cotizaciones.editar');
    return Number(quote.total) === 0 && hasPermission('cotizaciones.editar_cliente');
  };

  // Solo el cliente puede aprobar, y solo cuando ya tiene precios asignados (total > 0).
  const canBeApproved = (quote) => {
    return quote.estado === 'PENDIENTE' && Number(quote.total) > 0 && hasPermission('cotizaciones.aprobar');
  };

  // Solo se puede anular si está PENDIENTE.
  const canBeCancelled = (quote) => quote.estado === 'PENDIENTE' && hasPermission('cotizaciones.anular');

  const cotizacionAprobada = (quote) => quote.estado === 'APROBADA';

  const getContactText = (cliente) => [cliente?.correo, cliente?.telefono].filter(Boolean).join(' | ');
  const getProductsText = (quote) => quote.detalles?.map(det => `${det.descripcion} x${det.cantidad}`).join(', ') || 'Sin productos';


  // Solo Staff puede eliminar permanentemente una cotización
  const onApproveClick = async (idCotizacion) => {
    const accepted = await confirm({
      title: 'Aprobar cotizacion',
      message: 'Aprobar esta cotizacion? Se generara un pedido de produccion automaticamente.',
      confirmText: 'Aprobar',
      variant: 'success',
    });

    if (!accepted) return;

    try {
      await handleApprove(idCotizacion);
      notifications.success('Pedido creado correctamente. El cliente fue notificado por correo.');
    } catch (err) {
      notifications.error(err.message || 'No se pudo aprobar la cotizacion.');
    }
  };

  const onCancelClick = async (idCotizacion) => {
    const accepted = await confirm({
      title: 'Anular cotizacion',
      message: 'Anular esta cotizacion?',
      confirmText: 'Anular',
      variant: 'danger',
    });

    if (!accepted) return;

    try {
      await handleCancel(idCotizacion);
      notifications.success('Cotizacion anulada correctamente.');
    } catch (err) {
      notifications.error(err.message || 'No se pudo anular la cotizacion.');
    }
  };

  const onEliminarClick = async (idCotizacion) => {
    const accepted = await confirm({
      title: 'Eliminar cotizacion',
      message: 'Eliminar permanentemente esta cotizacion? Esta accion no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger',
    });

    if (!accepted) return;

    try {
      await handleHardDelete(idCotizacion);
      notifications.success('Cotizacion eliminada correctamente.');
    } catch (err) {
      notifications.error(err.message || 'No se pudo eliminar la cotizacion.');
    }
  };

  return (
    <div className={styles.pageContainer}>

      {/* HEADER */}
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Servicios / Cotizaciones</span>
          <h1 className={styles.pageTitle}>Gestión de Cotizaciones</h1>
          <p className={styles.pageSubtitle}>
            {isStaff
              ? 'Administra, cotiza y gestiona las solicitudes de los clientes.'
              : 'Solicita nuevas cotizaciones y revisa el estado de tus pedidos.'}
          </p>
        </div>
        {canCreateQuote && (
          <button onClick={handleOpenCreate} className={styles.primaryButton}>
            {isStaff ? 'Nueva cotización presencial' : 'Solicitar cotización'}
          </button>
        )}
      </div>

      {/* BUSCADOR */}
      <div className={styles.filterSection}>
        <input
          type="text"
          placeholder="Buscar por cliente, descripción..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.searchInput}
        />
      </div>

      {/* TABLA */}
      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando cotizaciones...</p>
        ) : quotes.length === 0 ? (
          <p className={styles.loadingText}>No se encontraron cotizaciones.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeader}>ID</th>
                  <th className={styles.tableHeader}>Cliente</th>
                  <th className={styles.tableHeader}>Productos</th>
                  <th className={styles.tableHeader}>Tipo</th>
                  <th className={styles.tableHeader}>Estado</th>
                  <th className={styles.tableHeader}>Total</th>
                  <th className={styles.tableHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={quote.idCotizacion} className={styles.tableBodyRow}>

                    <td className={styles.tableCellId}>#{quote.idCotizacion}</td>

                    <td className={styles.tableCell}>
                      <span className={styles.clientName}>{quote.cliente?.nombre || 'N/A'}</span>
                      <span className={styles.clientEmail}>{getContactText(quote.cliente)}</span>
                    </td>

                    <td className={styles.tableCell}>
                      <span className={styles.clientEmail}>{getProductsText(quote)}</span>
                    </td>

                    <td className={styles.tableCell}>
                      <span className={styles.typeBadge}>{quote.tipoCotizacion}</span>
                    </td>

                    <td className={styles.tableCell}>
                      <span className={`${styles.statusBadge} ${getStatusClass(quote)}`}>
                        {getStatusLabel(quote)}
                      </span>
                    </td>

                    <td className={styles.tableCell}>
                      <strong className={styles.totalPrice}>
                        {Number(quote.total) > 0
                          ? `$${Number(quote.total).toLocaleString('es-CO')}`
                          : <span className={styles.tableCellMuted}>Por cotizar</span>
                        }
                      </strong>
                    </td>

                    <td className={styles.actionsCell}>
                      <TableActions
                        primaryAction={{ label: 'Ver', onClick: () => { setSelectedQuoteForDetails(quote); setIsDetailsOpen(true); }, variant: 'accent' }}
                        actions={[
                          canBeApproved(quote) && { label: 'Aprobar', onClick: () => onApproveClick(quote.idCotizacion), variant: 'success' },
                          canBeCancelled(quote) && { label: 'Anular', onClick: () => onCancelClick(quote.idCotizacion), variant: 'danger' },
                          canBePricedOrEdited(quote) && {
                            label: isStaff && Number(quote.total) === 0 ? 'Cotizar' : 'Editar',
                            onClick: () => handleOpenEditOrPrice(quote),
                            variant: isStaff ? 'info' : 'warning',
                          },
                          hasPermission('cotizaciones.eliminar') && isStaff && !cotizacionAprobada(quote) && { label: 'Eliminar', onClick: () => onEliminarClick(quote.idCotizacion), variant: 'danger' },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
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

      {/* MODALES */}
      <QuoteFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedQuote(null); }}
        onSubmit={handleSubmitForm}
        quote={selectedQuote}
        isStaff={isStaff}
      />

      <QuoteDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setSelectedQuoteForDetails(null); }}
        quote={selectedQuoteForDetails}
      />
    </div>
  );
};

export default QuotesPage;
