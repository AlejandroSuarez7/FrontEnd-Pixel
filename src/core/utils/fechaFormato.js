export const formatDate = (dateString) => {
  if (!dateString) return 'Por definir';
  
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Por definir';
  
  // Usamos el Intl.DateTimeFormat nativo de JavaScript
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    // Si también quieres la hora, desccomenta la línea de abajo:
    // hour: '2-digit', minute: '2-digit', hour12: true
  }).format(date);
};

export const formatOptionalDate = (value, fallback = 'Por definir') => {
  if (value === null || value === undefined || value === '') return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const formatCalendarDate = (value, fallback = 'Por definir') => {
  if (value === null || value === undefined || value === '') return fallback;

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return formatOptionalDate(value, fallback);

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const toCalendarDateInput = (value) => {
  if (value === null || value === undefined || value === '') return '';

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
