// Definición de la estructura de datos que espera el Front
export const createQuoteModel = ({ id, clientName, total, status, date }) => ({
  id: id || '',
  clientName: clientName || '',
  total: total || 0,
  status: status || 'pending', // pending, approved, rejected
  date: date || new Date().toISOString().split('T')[0]
});