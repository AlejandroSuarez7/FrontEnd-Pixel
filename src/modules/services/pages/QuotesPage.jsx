import React, { useState } from 'react';
import { useQuotes } from '../cotizaciones/application/useQuotes';
import { QuoteModal } from '../cotizaciones/presentation/QuoteModal';
import { QuoteDetailsModal } from '../cotizaciones/presentation/QuoteDetailsModal';
import { EditQuoteModal } from '../cotizaciones/presentation/EditQuoteModal';
import { formatDate } from '../../../core/utils/fechaFormato';
import styles from '../cotizaciones/presentation/quotes.module.css';

export const QuotesPage = () => {
  const { quotes, loading, handleUpdate, handleCreate, handleReject } = useQuotes();

  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isEditOpen, setIsEditOpen]     = useState(false);
  const [quoteToEdit, setQuoteToEdit]   = useState(null);

  const onModalSubmit = async (newQuoteData) => {
    await handleCreate(newQuoteData);
  };

  const onRejectClick = (idCotizacion) => {
    if (window.confirm(`¿Estás seguro de que deseas RECHAZAR la cotización #${idCotizacion}? Esta acción no se puede deshacer.`)) {
      handleReject(idCotizacion);
    }
  };

  const handleOpenEdit = (quote) => {
    setQuoteToEdit(quote);
    setIsEditOpen(true);
  };

  const handleOpenDetails = (quote) => {
    setSelectedQuote(quote);
    setIsDetailsOpen(true);
  };

  const getStatusClass = (estado) => {
    if (estado === 'APROBADA' || estado === 'approved') return styles.statusApproved;
    if (estado === 'RECHAZADA') return styles.statusRejected;
    return styles.statusPending;
  };

  const getStatusLabel = (estado) => {
    if (estado === 'APROBADA' || estado === 'approved') return 'Aprobada';
    if (estado === 'RECHAZADA') return 'Rechazada';
    return 'Pendiente';
  };

  return (
    <div className={styles.pageContainer}>

      {/* 1. HEADER */}
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Servicios / Gestión</span>
          <h1 className={styles.pageTitle}>Gestión de Cotizaciones</h1>
          <p className={styles.pageSubtitle}>
            Administra propuestas, presupuestos, estados y servicios a cotizar.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className={styles.primaryButton}>
          Nueva cotización
        </button>
      </div>

      {/* 2. KPIs */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Cotizaciones registradas</span>
          <h2 className={styles.kpiValue}>{quotes.length}</h2>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Aprobadas</span>
          <h2 className={styles.kpiValue}>
            {quotes.filter(q => q.estado === 'APROBADA' || q.estado === 'approved').length}
          </h2>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Pendientes</span>
          <h2 className={styles.kpiValue}>
            {quotes.filter(q => q.estado === 'PENDIENTE').length}
          </h2>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Rechazadas</span>
          <h2 className={styles.kpiValue}>
            {quotes.filter(q => q.estado === 'RECHAZADA').length}
          </h2>
        </div>
      </div>

      {/* 3. TABLA */}
      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando cotizaciones...</p>
        ) : quotes.length === 0 ? (
          <p className={styles.loadingText}>No hay cotizaciones registradas.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeader}>ID Cotización</th>
                  <th className={styles.tableHeader}>ID Cliente</th>
                  <th className={styles.tableHeader}>Cliente</th>
                  <th className={styles.tableHeader}>Fecha</th>
                  <th className={styles.tableHeader}>Total</th>
                  <th className={styles.tableHeader}>Estado</th>
                  <th className={styles.tableHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => {
                  const isPending = quote.estado === 'PENDIENTE';
                  return (
                    <tr key={quote.id} className={styles.tableBodyRow}>
                      <td className={styles.tableCell}>{quote.id}</td>
                      <td className={styles.tableCell}>{quote.cliente?.idUsuario}</td>
                      <td className={styles.tableCell}>{quote.cliente?.nombre}</td>
                      <td className={styles.tableCell}>{formatDate(quote.fechaCreacion)}</td>
                      <td className={styles.tableCell}>${quote.total.toLocaleString('es-CO')}</td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.statusBadge} ${getStatusClass(quote.estado)}`}>
                          {getStatusLabel(quote.estado)}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>
                        <button
                          onClick={() => handleOpenDetails(quote)}
                          className={`${styles.actionBtn} ${styles.actionBtnView}`}
                        >
                          Ver detalles
                        </button>

                        <span className={styles.actionDivider} />

                        <button
                          onClick={() => handleOpenEdit(quote)}
                          disabled={!isPending}
                          className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                          title={isPending ? 'Editar parámetros modificables' : 'No se puede editar una cotización aprobada/rechazada'}
                        >
                          Editar
                        </button>

                        <span className={styles.actionDivider} />

                        <button
                          onClick={() => onRejectClick(quote.id)}
                          disabled={!isPending}
                          className={`${styles.actionBtn} ${styles.actionBtnReject}`}
                          title={isPending ? 'Rechazar cotización' : 'Esta cotización ya fue procesada'}
                        >
                          Rechazar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODALES */}
      <QuoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onModalSubmit}
      />

      <QuoteDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setSelectedQuote(null); }}
        quote={selectedQuote}
      />

      <EditQuoteModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setQuoteToEdit(null); }}
        onSubmit={handleUpdate}
        quote={quoteToEdit}
      />
    </div>
  );
};

export default QuotesPage;