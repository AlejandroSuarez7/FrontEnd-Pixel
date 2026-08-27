export const ADMIN_TRENDS_PRESETS = {
  SEVEN_DAYS: '7_DIAS',
  THIRTY_DAYS: '30_DIAS',
  CURRENT_MONTH: 'ESTE_MES',
  CURRENT_YEAR: 'ESTE_ANIO',
  CUSTOM: 'PERSONALIZADO',
};

export const ADMIN_TRENDS_GRANULARITIES = ['DIA', 'SEMANA', 'MES', 'ANIO'];

const TIME_ZONE = 'America/Bogota';

const padDatePart = (value) => String(value).padStart(2, '0');

const formatDateParts = ({ year, month, day }) => (
  `${year}-${padDatePart(month)}-${padDatePart(day)}`
);

const parseCalendarDate = (value) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));

  if (
    date.getUTCFullYear() !== parts.year
    || date.getUTCMonth() !== parts.month - 1
    || date.getUTCDate() !== parts.day
  ) return null;

  return parts;
};

const getBogotaCalendarDate = (value = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return formatDateParts({
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  });
};

const shiftCalendarDate = (value, days) => {
  const parts = parseCalendarDate(value);
  if (!parts) return '';

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  date.setUTCDate(date.getUTCDate() + days);

  return formatDateParts({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
};

export const buildAdminTrendPeriod = (
  preset = ADMIN_TRENDS_PRESETS.THIRTY_DAYS,
  now = new Date(),
) => {
  const fechaFin = getBogotaCalendarDate(now);
  const today = parseCalendarDate(fechaFin);

  if (preset === ADMIN_TRENDS_PRESETS.SEVEN_DAYS) {
    return { fechaInicio: shiftCalendarDate(fechaFin, -6), fechaFin, granularidad: 'DIA' };
  }

  if (preset === ADMIN_TRENDS_PRESETS.CURRENT_MONTH) {
    return {
      fechaInicio: formatDateParts({ ...today, day: 1 }),
      fechaFin,
      granularidad: 'DIA',
    };
  }

  if (preset === ADMIN_TRENDS_PRESETS.CURRENT_YEAR) {
    return {
      fechaInicio: formatDateParts({ year: today.year, month: 1, day: 1 }),
      fechaFin,
      granularidad: 'MES',
    };
  }

  return { fechaInicio: shiftCalendarDate(fechaFin, -29), fechaFin, granularidad: 'DIA' };
};

const toDisplayDate = (value) => {
  const parts = parseCalendarDate(value);
  if (!parts) return null;
  return new Date(parts.year, parts.month - 1, parts.day);
};

const capitalize = (value) => value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : '';

const formatShortMonth = (date) => {
  const month = new Intl.DateTimeFormat('es-CO', { month: 'short' })
    .format(date)
    .replace(/\.$/, '');
  return `${month}.`;
};

export const formatAdminTrendAxisDate = (value, granularity = 'DIA') => {
  const date = toDisplayDate(value);
  if (!date) return 'Fecha no disponible';

  if (granularity === 'ANIO') return String(date.getFullYear());

  if (granularity === 'MES') {
    return `${capitalize(formatShortMonth(date))} ${date.getFullYear()}`;
  }

  const shortDate = `${date.getDate()} ${formatShortMonth(date)}`;

  return granularity === 'SEMANA' ? `Semana del ${shortDate}` : shortDate;
};

export const formatAdminTrendTooltipDate = (value) => {
  const date = toDisplayDate(value);
  if (!date) return 'Fecha no disponible';

  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const isCompleteAdminTrendPeriod = (period = {}) => (
  Boolean(parseCalendarDate(period.fechaInicio))
  && Boolean(parseCalendarDate(period.fechaFin))
  && period.fechaInicio <= period.fechaFin
  && ADMIN_TRENDS_GRANULARITIES.includes(period.granularidad)
);
