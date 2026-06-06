export const formatDate = (dateString) => {
  if (!dateString) return 'Sin fecha';
  
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  
  // Usamos el Intl.DateTimeFormat nativo de JavaScript
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    // Si también quieres la hora, desccomenta la línea de abajo:
    // hour: '2-digit', minute: '2-digit', hour12: true
  }).format(date);
};
