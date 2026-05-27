// cotizaciones/presentation/QuoteDetailsModal.jsx
import React from 'react';
import styles from './quotes.module.css';

export const QuoteDetailsModal = ({ isOpen, onClose, quote }) => {
  if (!isOpen || !quote) return null;

  const getStatusClass = (estado) => {
    switch (estado) {
      case 'APROBADA':  return styles.statusAprobada;
      case 'COTIZADA':  return styles.statusCotizada;
      case 'ANULADA':   return styles.statusAnulada;
      case 'RECHAZADA': return styles.statusRechazada;
      case 'PENDIENTE':
      default:          return styles.statusPendiente;
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalLg}`}>

        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Cotización #{quote.idCotizacion}</h3>
            <p className={styles.modalSubtitle}>
              Cliente: {quote.cliente?.nombre || 'N/A'} · Tipo: {quote.tipoCotizacion}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span className={`${styles.statusBadge} ${getStatusClass(quote.estado)}`}>
              {quote.estado}
            </span>
            <button onClick={onClose} className={styles.modalCloseBtn}>✕</button>
          </div>
        </div>

        <div className={styles.form}>

          {/* Observaciones */}
          <div className={styles.detailsInfoBox}>
            <strong>Observaciones generales:</strong>{' '}
            {quote.observaciones || 'Ninguna registrada'}
          </div>

          {/* Creado por */}
          {quote.creadoPor?.nombre && (
            <p className={styles.detailsCreatedBy}>
              Gestionada por: <strong>{quote.creadoPor.nombre}</strong>
              {quote.creadoPor.rol?.nombre ? ` · ${quote.creadoPor.rol.nombre}` : ''}
            </p>
          )}

          {/* Tabla de ítems */}
          <p className={styles.detailsSectionTitle}>Prendas / Servicios incluidos</p>

          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeader}>Descripción</th>
                  <th className={styles.tableHeader}>Cantidad</th>
                  <th className={styles.tableHeader}>Precio unitario</th>
                  <th className={styles.tableHeader}>Costo diseño</th>
                  <th className={styles.tableHeader}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {!quote.detalles || quote.detalles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className={styles.loadingText}>
                      Esta cotización no tiene ítems registrados.
                    </td>
                  </tr>
                ) : (
                  quote.detalles.map((det) => {
                    const precioUnitario = Number(det.precioUnitario || 0);
                    const costoDiseno    = Number(det.costoDiseno || 0);
                    const subtotal       = Number(det.subtotal || 0);

                    return (
                      <tr key={det.idDetalleCotizacion} className={styles.tableBodyRow}>
                        <td className={styles.tableCell}>
                          <span style={{ fontWeight: '500' }}>{det.descripcion}</span>
                          {det.observaciones && (
                            <small style={{ display: 'block', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              {det.observaciones}
                            </small>
                          )}
                        </td>
                        <td className={styles.tableCell}>{det.cantidad || 0}</td>
                        <td className={styles.tableCell}>
                          {precioUnitario > 0 ? `$${precioUnitario.toLocaleString('es-CO')}` : '—'}
                        </td>
                        <td className={styles.tableCell}>
                          {costoDiseno > 0 ? `$${costoDiseno.toLocaleString('es-CO')}` : '—'}
                        </td>
                        <td className={styles.tableCell}>
                          <strong>{subtotal > 0 ? `$${subtotal.toLocaleString('es-CO')}` : '—'}</strong>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className={styles.totalBlock}>
            <div className={styles.totalBlockRow}>
              <span>Subtotal general</span>
              <span>${Number(quote.subtotal || 0).toLocaleString('es-CO')}</span>
            </div>
            <div className={styles.totalBlockRow}>
              <span>Costos adicionales</span>
              <span>${Number(quote.costosAdicionales || 0).toLocaleString('es-CO')}</span>
            </div>
            <div className={styles.grandTotal}>
              <span>Total</span>
              <span>${Number(quote.total || 0).toLocaleString('es-CO')}</span>
            </div>
          </div>

        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnPrimary}>
            Cerrar ventana
          </button>
        </div>

      </div>
    </div>
  );
};