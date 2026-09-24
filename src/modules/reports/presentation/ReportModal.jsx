import { useEffect, useId, useState } from 'react';
import { Download, FileBarChart2, RotateCcw, X } from 'lucide-react';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { formatCalendarDate } from '../../../core/utils/fechaFormato';
import { formatMoneyCOP, formatPercentage } from '../../../core/utils/formatters';
import { clientRepository } from '../../users/infrastructure/client.repository';
import { useReport } from '../application/useReport';
import { getReportDefinition } from '../domain/reportDefinitions';
import './ReportModal.css';

const getPathValue = (source, path) => path
  .split('.')
  .reduce((value, key) => value?.[key], source);

const formatStatus = (value) => {
  const text = String(value || 'Sin estado').replaceAll('_', ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const formatValue = (value, column) => {
  if (column.format === 'currency') return formatMoneyCOP(value);
  if (column.format === 'percentage') return formatPercentage(value, '0%');
  if (column.format === 'date') return formatCalendarDate(value);
  if (column.format === 'dateOptional') return formatCalendarDate(value, 'No aplica');
  if (column.format === 'status') return formatStatus(value);
  if (column.format === 'id') return value === null || value === undefined ? 'No aplica' : `#${value}`;
  if (column.format === 'optionalId') return value ? `#${value}` : 'No aplica';
  return value === null || value === undefined || value === ''
    ? column.fallback || 'No aplica'
    : String(value);
};

export const ReportModal = ({ type, onClose }) => {
  const definition = getReportDefinition(type);
  const titleId = useId();
  const fieldPrefix = useId().replaceAll(':', '');
  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState('');
  const debouncedClientSearch = useDebounce(clientSearch, 350);
  const {
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
    retry,
  } = useReport(type);

  useEffect(() => {
    const controller = new AbortController();
    clientRepository.list({
      page: 1,
      limit: 10,
      search: debouncedClientSearch,
      sortBy: 'nombre',
      order: 'asc',
    }, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setClients(result.items);
        setClientsError('');
      })
      .catch((requestError) => {
        if (controller.signal.aborted || requestError.code === 'ERR_CANCELED') return;
        setClients([]);
        setClientsError('No se pudieron cargar los clientes. Puedes filtrar por fecha o estado.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingClients(false);
      });

    return () => controller.abort();
  }, [debouncedClientSearch]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const pagination = report.paginacion || {};
  const records = Array.isArray(report.registros) ? report.registros : [];
  const summary = report.resumen || {};

  return (
    <div
      className="report-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="report-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="report-modal-header">
          <div>
            <span className="report-modal-eyebrow"><FileBarChart2 size={16} aria-hidden="true" /> Reportes</span>
            <h2 id={titleId}>{definition.title}</h2>
            <p>Los indicadores corresponden a todo el conjunto filtrado.</p>
          </div>
          <button type="button" className="report-modal-close" onClick={onClose} aria-label="Cerrar reporte">
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        <form
          className="report-filters"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
        >
          <label className="report-field" htmlFor={`${fieldPrefix}-fecha-inicio`}>
            <span>Fecha inicial</span>
            <input
              id={`${fieldPrefix}-fecha-inicio`}
              type="date"
              value={filters.fechaInicio}
              onChange={(event) => updateFilter('fechaInicio', event.target.value)}
            />
          </label>
          <label className="report-field" htmlFor={`${fieldPrefix}-fecha-fin`}>
            <span>Fecha final</span>
            <input
              id={`${fieldPrefix}-fecha-fin`}
              type="date"
              value={filters.fechaFin}
              onChange={(event) => updateFilter('fechaFin', event.target.value)}
            />
          </label>
          <div className="report-field report-client-field">
            <label htmlFor={`${fieldPrefix}-cliente-search`}>Cliente</label>
            <input
              id={`${fieldPrefix}-cliente-search`}
              type="search"
              placeholder="Buscar cliente..."
              value={clientSearch}
              onChange={(event) => {
                setClientSearch(event.target.value);
                setLoadingClients(true);
              }}
            />
            <label className="report-sr-only" htmlFor={`${fieldPrefix}-cliente`}>Seleccionar cliente</label>
            <select
              id={`${fieldPrefix}-cliente`}
              value={filters.idCliente}
              onChange={(event) => updateFilter('idCliente', event.target.value)}
            >
              <option value="">{loadingClients ? 'Cargando clientes...' : 'Todos los clientes'}</option>
              {filters.idCliente && !clients.some((client) => String(client.idCliente) === String(filters.idCliente)) && (
                <option value={filters.idCliente}>Cliente #{filters.idCliente}</option>
              )}
              {clients.map((client) => (
                <option key={client.idCliente} value={client.idCliente}>{client.nombre}</option>
              ))}
            </select>
          </div>
          <label className="report-field" htmlFor={`${fieldPrefix}-estado`}>
            <span>{definition.statusLabel}</span>
            <select
              id={`${fieldPrefix}-estado`}
              value={filters[definition.statusField]}
              onChange={(event) => updateFilter(definition.statusField, event.target.value)}
            >
              <option value="">Todos</option>
              {definition.statusOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          {definition.hasOrderFilter && (
            <label className="report-field" htmlFor={`${fieldPrefix}-pedido`}>
              <span>Pedido</span>
              <input
                id={`${fieldPrefix}-pedido`}
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="Número de pedido"
                value={filters.idPedido}
                onChange={(event) => updateFilter('idPedido', event.target.value)}
              />
            </label>
          )}
          <div className="report-filter-actions">
            <button type="submit" className="report-primary-button">Aplicar filtros</button>
            <button type="button" className="report-secondary-button" onClick={clearFilters}>
              <RotateCcw size={15} aria-hidden="true" /> Limpiar filtros
            </button>
          </div>
          {(validationError || clientsError) && (
            <p className="report-filter-message" role={validationError ? 'alert' : 'status'}>
              {validationError || clientsError}
            </p>
          )}
        </form>

        <div className="report-summary" aria-label="Resumen del reporte">
          {definition.summary.map((item) => (
            <article className="report-kpi" key={item.key}>
              <span>{item.label}</span>
              <strong>{formatValue(summary[item.key] ?? 0, item)}</strong>
            </article>
          ))}
        </div>

        <div className="report-results">
          <div className="report-results-heading">
            <div>
              <h3>Resultados</h3>
              <span>{Number(report.totalRegistros || 0).toLocaleString('es-CO')} registros</span>
            </div>
            <button
              type="button"
              className="report-download-button"
              onClick={downloadPdf}
              disabled={downloading}
            >
              <Download size={17} aria-hidden="true" />
              {downloading ? 'Generando PDF...' : 'Descargar PDF'}
            </button>
          </div>

          {pdfError && <p className="report-error" role="alert">{pdfError}</p>}
          {loading ? (
            <div className="report-loading" role="status"><span /> Cargando reporte...</div>
          ) : error ? (
            <div className="report-error-state" role="alert">
              <p>{error}</p>
              <button type="button" className="report-secondary-button" onClick={retry}>Reintentar</button>
            </div>
          ) : records.length === 0 ? (
            <p className="report-empty">No se encontraron registros para los filtros seleccionados.</p>
          ) : (
            <div className="report-table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>{definition.columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
                </thead>
                <tbody>
                  {records.map((record, index) => (
                    <tr key={`${getPathValue(record, definition.columns[0].key) ?? 'record'}-${index}`}>
                      {definition.columns.map((column) => (
                        <td key={column.key}>{formatValue(getPathValue(record, column.key), column)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && Number(pagination.totalPages || 0) > 1 && (
            <nav className="report-pagination" aria-label="Paginación del reporte">
              <span>Página {pagination.page} de {pagination.totalPages}</span>
              <div>
                <button
                  type="button"
                  className="report-secondary-button"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => changePage(Number(pagination.page) - 1)}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  className="report-secondary-button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => changePage(Number(pagination.page) + 1)}
                >
                  Siguiente
                </button>
              </div>
            </nav>
          )}
        </div>
      </section>
    </div>
  );
};
