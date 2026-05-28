// presentation/pages/QuotesPage.jsx
import React, { useState } from 'react';
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
  } = useQuotes({ search: searchTerm });

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
    return !isStaff && quote.estado === 'PENDIENTE' && Number(quote.total) > 0;
  };

  // Solo se puede anular si está PENDIENTE.
  const canBeCancelled = (quote) => quote.estado === 'PENDIENTE';

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
                {quotes.map((quote) => (
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

                      {/* Cotizar (Staff) / Editar solicitud (Cliente sin precios aún) */}
                      {canBePricedOrEdited(quote) && (
                        <>
                          <button
                            onClick={() => handleOpenEditOrPrice(quote)}
                            className={`${styles.actionBtn} ${isStaff ? styles.actionBtnPrice : styles.actionBtnEdit}`}
                          >
                            {isStaff && Number(quote.total) === 0 ? 'Cotizar' : 'Editar'}
                          </button>
                          <span className={styles.actionDivider} />
                        </>
                      )}

                      {/* Aprobar — solo Cliente cuando ya tiene precios */}
                      {canBeApproved(quote) && (
                        <>
                          <button
                            onClick={() => handleApprove(quote.idCotizacion)}
                            className={`${styles.actionBtn} ${styles.actionBtnApprove}`}
                          >
                            Aprobar
                          </button>
                          <span className={styles.actionDivider} />
                        </>
                      )}

                      {/* Anular — solo mientras esté PENDIENTE */}
                      {canBeCancelled(quote) && (
                        <>
                          <button
                            onClick={() => handleCancel(quote.idCotizacion)}
                            className={`${styles.actionBtn} ${styles.actionBtnCancel}`}
                          >
                            Anular
                          </button>
                          <span className={styles.actionDivider} />
                        </>
                      )}

                      {/* Ver detalles — siempre visible */}
                      <button
                        onClick={() => { setSelectedQuoteForDetails(quote); setIsDetailsOpen(true); }}
                        className={`${styles.actionBtn} ${styles.actionBtnView}`}
                      >
                        Ver
                      </button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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