import { apiClient } from '../../../core/services/apiService';
import { createRequestError } from '../../../core/utils/requestError';
import { getReportDefinition } from '../domain/reportDefinitions';

const REPORT_ENDPOINTS = Object.freeze({
  ventas: 'api/reportes/ventas',
  pedidos: 'api/reportes/pedidos',
  cotizaciones: 'api/reportes/cotizaciones',
  abonos: 'api/reportes/abonos',
});

const cleanParams = (filters = {}, { includePagination = true } = {}) => {
  const params = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (!includePagination && (key === 'page' || key === 'limit')) return;
    if (value === '' || value === null || value === undefined) return;
    params[key] = value;
  });

  return params;
};

const getHeader = (headers, name) => headers?.get?.(name) ?? headers?.[name];

export const getReportFilename = (headers, fallback) => {
  const disposition = getHeader(headers, 'content-disposition') || '';
  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
  const rawFilename = encodedMatch?.[1] || plainMatch?.[1];

  if (!rawFilename) return fallback;

  try {
    return decodeURIComponent(rawFilename).replace(/[\\/:*?"<>|]/g, '-');
  } catch {
    return rawFilename.replace(/[\\/:*?"<>|]/g, '-');
  }
};

const readBlobError = async (error) => {
  const responseData = error?.response?.data;
  if (!(responseData instanceof Blob)) return error;

  try {
    const text = await responseData.text();
    const payload = JSON.parse(text);
    const parsed = new Error(payload?.message || error.message);
    parsed.status = error.status ?? error.response?.status;
    parsed.payload = payload;
    parsed.response = error.response;
    return parsed;
  } catch {
    return error;
  }
};

const getEndpoint = (type) => {
  getReportDefinition(type);
  return REPORT_ENDPOINTS[type];
};

export const reportRepository = {
  async get(type, filters = {}, options = {}) {
    try {
      const { data } = await apiClient.get(getEndpoint(type), {
        params: cleanParams(filters),
        signal: options.signal,
      });
      return data?.data ?? data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo cargar el reporte.');
    }
  },

  async downloadPdf(type, filters = {}) {
    const definition = getReportDefinition(type);
    try {
      const response = await apiClient.get(`${getEndpoint(type)}/pdf`, {
        params: cleanParams(filters, { includePagination: false }),
        responseType: 'blob',
      });

      return {
        blob: response.data,
        filename: getReportFilename(response.headers, definition.fallbackFilename),
      };
    } catch (rawError) {
      const error = await readBlobError(rawError);
      throw createRequestError(error, 'No se pudo descargar el PDF.');
    }
  },
};

export { cleanParams as buildReportParams };
