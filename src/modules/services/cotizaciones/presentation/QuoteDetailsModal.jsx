// quotes/presentation/QuoteDetailsModal.jsx
import React from 'react';
import styles from './quotes.module.css';

export const QuoteDetailsModal = ({ isOpen, onClose, quote }) => {
  if (!isOpen || !quote) return null;

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
          <button onClick={onClose} className={styles.modalCloseBtn}>✕</button>
        </div>

        <div>
          {/* Observaciones generales */}
          <div className={styles.detailsInfoBox}>
            <strong>Observaciones:</strong>{' '}
            {quote.observaciones || 'Ninguna'}
          </div>

          {/* Creado por */}
          {quote.creadoPor?.nombre && (
            <p className={styles.detailsCreatedBy}>
              Cotización gestionada por: <strong>{quote.creadoPor.nombre}</strong>
            </p>
          )}

          {/* Tabla de ítems */}
          <p className={styles.detailsSectionTitle}>Ítems / Servicios incluidos</p>

          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeader}>Descripción</th>
                  <th className={styles.tableHeader}>Cantidad</th>
                  <th className={styles.tableHeader}>Precio unit.</th>
                  <th className={styles.tableHeader}>Costo diseño</th>
                  <th className={styles.tableHeader}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {!quote.detalles || quote.detalles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className={styles.loadingText}>
                      Esta cotización no tiene ítems detallados asignados.
                    </td>
                  </tr>
                ) : (
                  quote.detalles.map((det, index) => {
                    const precioUnitario = Number(det.precioUnitario || 0);
                    const costoDiseno    = Number(det.costoDiseno || 0);
                    const subtotal       = Number(det.subtotal || 0);

                    return (
                      <tr key={det.idDetalleCotizacion || index} className={styles.tableBodyRow}>
                        <td className={styles.tableCell}>{det.descripcion || 'Sin descripción'}</td>
                        <td className={styles.tableCell}>{det.cantidad || 0}</td>
                        <td className={styles.tableCell}>${precioUnitario.toLocaleString('es-CO')}</td>
                        <td className={styles.tableCell}>${costoDiseno.toLocaleString('es-CO')}</td>
                        <td className={styles.tableCell}>
                          <strong>${subtotal.toLocaleString('es-CO')}</strong>
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