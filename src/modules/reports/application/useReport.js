import { useCallback, useEffect, useRef, useState } from 'react';
import { createEmptyReport, createReportFilters } from '../domain/reportDefinitions';
import { reportRepository } from '../infrastructure/report.repository';

export const validateReportDates = ({ fechaInicio, fechaFin }) => {
  if (fechaInicio && !fechaFin) return 'Selecciona también la fecha final.';
  if (fechaFin && !fechaInicio) return 'Selecciona también la fecha inicial.';
  if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
    return 'La fecha inicial no puede ser posterior a la fecha final.';
  }
  return '';
};

const getErrorMessage = (error, fallback) => {
  if (error?.status === 403) return 'No tienes permiso para consultar este reporte.';
  return error?.message || fallback;
};

const isPdfLimitError = (error) => {
  if (error?.status !== 400) return false;
  const message = String(error?.message || '').toLowerCase();
  return /1000|1\.000|demasiad|l[ií]mite|m[aá]ximo/.test(message);
};

export const useReport = (type) => {
  const requestControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const [filters, setFilters] = useState(() => createReportFilters(type));
  const [appliedFilters, setAppliedFilters] = useState(() => createReportFilters(type));
  const [report, setReport] = useState(createEmptyReport);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const loadReport = useCallback(async (nextFilters, page = 1) => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError('');

    try {
      const data = await reportRepository.get(type, {
        ...nextFilters,
        page,
        limit: 20,
      }, { signal: controller.signal });
      if (!controller.signal.aborted && requestId === requestIdRef.current) {
        setReport({ ...createEmptyReport(), ...data });
      }
    } catch (requestError) {
      if (controller.signal.aborted || requestError.code === 'ERR_CANCELED') return;
      if (requestId === requestIdRef.current) {
        setError(getErrorMessage(requestError, 'No se pudo cargar el reporte.'));
      }
    } finally {
      if (!controller.signal.aborted && requestId === requestIdRef.current) setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    requestControllerRef.current = controller;

    reportRepository.get(type, {
      ...createReportFilters(type),
      page: 1,
      limit: 20,
    }, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted && requestId === requestIdRef.current) {
          setReport({ ...createEmptyReport(), ...data });
        }
      })
      .catch((requestError) => {
        if (controller.signal.aborted || requestError.code === 'ERR_CANCELED') return;
        if (requestId === requestIdRef.current) {
          setError(getErrorMessage(requestError, 'No se pudo cargar el reporte.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted && requestId === requestIdRef.current) setLoading(false);
      });

    return () => controller.abort();
  }, [type]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setValidationError('');
    setPdfError('');
  };

  const applyFilters = () => {
    const dateError = validateReportDates(filters);
    if (dateError) {
      setValidationError(dateError);
      return false;
    }

    const nextFilters = { ...filters };
    setValidationError('');
    setAppliedFilters(nextFilters);
    loadReport(nextFilters, 1);
    return true;
  };

  const clearFilters = () => {
    const emptyFilters = createReportFilters(type);
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setValidationError('');
    setPdfError('');
    loadReport(emptyFilters, 1);
  };

  const changePage = (page) => {
    if (page < 1 || page === report.paginacion.page) return;
    loadReport(appliedFilters, page);
  };

  const downloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    setPdfError('');
    let objectUrl = '';

    try {
      const { blob, filename } = await reportRepository.downloadPdf(type, appliedFilters);
      objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (downloadError) {
      setPdfError(
        isPdfLimitError(downloadError)
          ? 'El reporte contiene demasiados registros. Reduce el rango de fechas o aplica más filtros.'
          : getErrorMessage(downloadError, 'No se pudo descargar el PDF.'),
      );
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setDownloading(false);
    }
  };

  return {
    filters,
    report,
    loading,
    error,
    validationError,
    downloading,
    pdfError,
    updateFilter,
    applyFilters,
    clearFilters,
    changePage,
    downloadPdf,
    retry: () => loadReport(appliedFilters, report.paginacion.page || 1),
  };
};
