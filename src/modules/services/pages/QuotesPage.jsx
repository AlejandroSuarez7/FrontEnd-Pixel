// presentation/pages/QuotesPage.jsx
import React, { useState } from 'react';
import { useQuotes } from '../cotizaciones/application/useQuotes';
import { QuoteFormModal } from '../cotizaciones/presentation/QuoteFormModal';
import { QuoteDetailsModal } from '../cotizaciones/presentation/QuoteDetailsModal';

const QuotesPage = () => {
  // Lee el usuario guardado en localStorage después del login
  const session = JSON.parse(localStorage.getItem('pixel_user') || '{}');
  const userRole = session?.rol?.nombre || 'Cliente';

  const [searchTerm, setSearchTerm] = useState('');
  const { quotes, loading, handleCreate, handleUpdate, handleApprove, handleReject, handleCancel } = useQuotes({ search: searchTerm });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const [selectedQuoteForDetails, setSelectedQuoteForDetails] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const isStaff = userRole === "Admin" || userRole === "Secretaria";

  const handleOpenCreate = () => {
    setSelectedQuote(null);
    setIsModalOpen(true);
  };

  const handleOpenEditOrPrice = (quote) => {
    setSelectedQuote(quote);
    setIsModalOpen(true);
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Módulo de Cotizaciones</h1>
          <p style={styles.subtitle}>Seguimiento de pedidos, asignación de presupuestos y técnicas de estampado.</p>
        </div>
        <button onClick={handleOpenCreate} style={styles.createBtn}>
          📋 {isStaff ? "Nueva Cotización Presencial" : "Solicitar Nueva Cotización"}
        </button>
      </div>

      <div style={styles.filterSection}>
        <input
          type="text"
          placeholder="🔍 Buscar cotizaciones por ID u observaciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.tableCard}>
        {loading ? (
          <p style={styles.loadingText}>Cargando registros del servidor...</p>
        ) : quotes.length === 0 ? (
          <p style={styles.emptyText}>No se registran cotizaciones actualmente.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id} style={styles.tableBodyRow}>
                  <td style={styles.td}><strong>#{quote.id}</strong></td>
                  <td style={styles.td}>{quote.tipoCotizacion}</td>
                  <td style={styles.td}>
                    {quote.total > 0 ? `$${quote.total.toLocaleString('es-CO')}` : <em style={{ color: '#8f9bb3' }}>Por cotizar</em>}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor:
                        quote.estado === 'APROBADA' ? '#e3fcef' :
                        quote.estado === 'SOLICITADA' ? '#eef2f5' :
                        quote.estado === 'COTIZADA' ? '#e2f0ff' : '#ffe2e6',
                      color:
                        quote.estado === 'APROBADA' ? '#2bc475' :
                        quote.estado === 'SOLICITADA' ? '#4f5e74' :
                        quote.estado === 'COTIZADA' ? '#276cf2' : '#ff3d71'
                    }}>
                      {quote.estado}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {/* Botones contextuales de CLIENTE */}
                    {!isStaff && quote.estado === 'SOLICITADA' && (
                      <button onClick={() => handleOpenEditOrPrice(quote)} style={{ ...styles.actionBtn, color: '#e3a100' }}>✏️ Editar</button>
                    )}
                    {!isStaff && quote.estado === 'COTIZADA' && (
                      <>
                        <button onClick={() => handleApprove(quote.id)} style={{ ...styles.actionBtn, color: '#2bc475' }}>✅ Aprobar</button>
                        <button onClick={() => handleReject(quote.id)} style={{ ...styles.actionBtn, color: '#ff3d71', marginLeft: '10px' }}>❌ Rechazar</button>
                      </>
                    )}
                    {quote.estado !== 'ANULADA' && quote.estado !== 'RECHAZADA' && quote.estado !== 'APROBADA' && (
                      <button onClick={() => handleCancel(quote.id)} style={{ ...styles.actionBtn, color: '#ff3d71', marginLeft: '10px' }}>🚫 Anular</button>
                    )}

                    {/* Botones contextuales de EMPLEADO */}
                    {isStaff && quote.estado === 'SOLICITADA' && (
                      <button onClick={() => handleOpenEditOrPrice(quote)} style={{ ...styles.actionBtn, color: '#276cf2' }}>💰 Cotizar Precios</button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedQuoteForDetails(quote);
                        setIsDetailsOpen(true);
                      }}
                      style={{ ...styles.actionBtn, color: '#276cf2', marginLeft: '10px' }}
                      title="Ver detalles"
                    >
                      👁 Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <QuoteFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={selectedQuote ? handleUpdate : handleCreate}
        quote={selectedQuote}
        isStaff={isStaff}
      />

      <QuoteDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedQuoteForDetails(null);
        }}
        quote={selectedQuoteForDetails}
      />
    </div>
  );
};

const styles = {
  pageContainer: { padding: '24px', backgroundColor: '#f7f9fc', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { margin: 0, fontSize: '26px', color: '#222b45', fontWeight: '800' },
  subtitle: { margin: '4px 0 0 0', fontSize: '14px', color: '#8f9bb3' },
  createBtn: { padding: '10px 20px', backgroundColor: '#276cf2', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  filterSection: { marginBottom: '16px' },
  searchInput: { width: '100%', maxWidth: '400px', padding: '12px 16px', borderRadius: '8px', border: '1px solid #edf1f7' },
  tableCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  tableHeadRow: { borderBottom: '2px solid #edf1f7' },
  th: { padding: '12px 16px', fontSize: '13px', color: '#8f9bb3', fontWeight: '700' },
  tableBodyRow: { borderBottom: '1px solid #edf1f7' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#222b45' },
  statusBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },
  actionBtn: { background: 'none', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  loadingText: { textAlign: 'center', color: '#8f9bb3', padding: '24px' },
  emptyText: { textAlign: 'center', color: '#8f9bb3', padding: '24px' }
};

export default QuotesPage;