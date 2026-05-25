import React from 'react';

export const QuotesTable = ({ quotes, onDelete, onEdit }) => {
  return (
    <div style={{ overflowX: 'auto', marginTop: '20px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '12px' }}>Cliente</th>
            <th style={{ padding: '12px' }}>Fecha</th>
            <th style={{ padding: '12px' }}>Total</th>
            <th style={{ padding: '12px' }}>Estado</th>
            <th style={{ padding: '12px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {quotes.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ padding: '12px', textAlign: 'center' }}>No hay cotizaciones registradas.</td>
            </tr>
          ) : (
            quotes.map((quote) => (
              <tr key={quote.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{quote.clientName}</td>
                <td style={{ padding: '12px' }}>{quote.date}</td>
                <td style={{ padding: '12px' }}>${quote.total.toLocaleString()}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: quote.status === 'approved' ? '#d4edda' : '#fff3cd',
                    color: quote.status === 'approved' ? '#155724' : '#856404'
                  }}>
                    {quote.status}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <button onClick={() => onEdit(quote)} style={{ marginRight: '8px', cursor: 'pointer' }}>✏️ Editar</button>
                  <button onClick={() => onDelete(quote.id)} style={{ color: 'red', cursor: 'pointer' }}>🗑️ Eliminar</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};