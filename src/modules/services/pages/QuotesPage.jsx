// presentation/pages/QuotesPage.jsx
import React, { useState } from 'react';
import { Pagination } from '../../../core/components/Pagination';
import { usePagination } from '../../../core/hooks/usePagination';
import { TableActions } from '../../../shared/components/TableActions/TableActions';
import { useQuotes } from '../cotizaciones/application/useQuotes';
import { QuoteFormModal } from '../cotizaciones/presentation/QuoteFormModal';
import { QuoteDetailsModal } from '../cotizaciones/presentation/QuoteDetailsModal';
import styles from '../cotizaciones/presentation/quotes.module.css';

const QuotesPage = () => {
  const session  = JSON.parse(localStorage.getItem('pixel_user') || '{}');
  const userRole = session?.rol?.nombre || 'Cliente';
  const isStaff  = userRole === 'Admin' || userRole === 'Secretaria';

  const [searchTerm, setSearchTerm] = useState('');

  const {
    quotes,
    loading,
    handleCreate,
    handleUpdate,
    handleApprove,
    handleCancel,
    handleHardDelete,
  } = useQuotes({ search: searchTerm });

  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const [isDetailsOpen, setIsDetailsOpen]                     = useState(false);
  const [selectedQuoteForDetails, setSelectedQuoteForDetails] = useState(null);
  const {
    currentPage,
    pageSize,
    paginatedItems: paginatedQuotes,
    setCurrentPage,
    totalPages,
  } = usePagination(quotes);

  const handleOpenCreate = () => {
    setSelectedQuote(null);
    setIsModalOpen(true);
  };

  const handleOpenEditOrPrice = (quote) => {
    setSelectedQuote(quote);
    setIsModalOpen(true);
  };

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
    if (isStaff) return true;
    return Number(quote.total) === 0;
  };

  // Solo el cliente puede aprobar, y solo cuando ya tiene precios asignados (total > 0).
  const canBeApproved = (quote) => {
    return quote.estado === 'PENDIENTE' && Number(quote.total) > 0;
  };

  // Solo se puede anular si está PENDIENTE.
  const canBeCancelled = (quote) => quote.estado === 'PENDIENTE';

  const cotizacionAprobada = (quote) => quote.estado === 'APROBADA';


  // Solo Staff puede eliminar permanentemente una cotización
  const onApproveClick = (idCotizacion) => {
    if (window.confirm(
      '¿Estás seguro de que deseas APROBAR esta cotización?\n\nEsta acción generará un pedido de producción y no se puede deshacer.'
    )) {
      handleApprove(idCotizacion).catch(err => alert(err.message));
    }
  };

  const onCancelClick = (idCotizacion) => {
    if (window.confirm('¿Estás seguro de que deseas ANULAR esta cotización?')) {
      handleCancel(idCotizacion).catch(err => alert(err.message));
    }
  };

  const onEliminarClick = (idCotizacion) => {
    if (window.confirm(
      '¿Estás seguro de que deseas ELIMINAR permanentemente esta cotización?\n\nEsta acción no se puede deshacer.'
    )) {
      handleHardDelete(idCotizacion).catch(err => alert(err.message));
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
        <button onClick={handleOpenCreate} className={styles.primaryButton}>
          {isStaff ? 'Nueva cotización presencial' : 'Solicitar cotización'}
        </button>
      </div>

      {/* BUSCADOR */}
      <div className={styles.filterSection}>
        <input
          type="text"
          placeholder="Buscar por cliente, descripción..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
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
                  <th className={styles.tableHeader}>Tipo</th>
                  <th className={styles.tableHeader}>Estado</th>
                  <th className={styles.tableHeader}>Total</th>
                  <th className={styles.tableHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQuotes.map((quote) => (
                  <tr key={quote.idCotizacion} className={styles.tableBodyRow}>

                    <td className={styles.tableCellId}>#{quote.idCotizacion}</td>

                    <td className={styles.tableCell}>
                      <span className={styles.clientName}>{quote.cliente?.nombre || 'N/A'}</span>
                      <span className={styles.clientEmail}>{quote.cliente?.correo || ''}</span>
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
                          isStaff && !cotizacionAprobada(quote) && { label: 'Eliminar', onClick: () => onEliminarClick(quote.idCotizacion), variant: 'danger' },
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
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          totalItems={quotes.length}
          totalPages={totalPages}
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
