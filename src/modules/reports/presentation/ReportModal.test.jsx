import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clientRepository } from '../../users/infrastructure/client.repository';
import { reportRepository } from '../infrastructure/report.repository';
import { ReportModal } from './ReportModal';

const makeReport = (overrides = {}) => ({
  reporte: 'prueba',
  generadoEn: '2026-09-23T12:00:00.000Z',
  zonaHoraria: 'America/Bogota',
  generadoPor: { idUsuario: 1, nombre: 'Admin Pixel' },
  periodo: {},
  filtros: {},
  resumen: {},
  registros: [],
  totalRegistros: 0,
  paginacion: {
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  ...overrides,
});

describe('ReportModal', () => {
  let getReportSpy;
  let downloadSpy;
  let clientListSpy;
  let anchorClickSpy;

  beforeEach(() => {
    getReportSpy = vi.spyOn(reportRepository, 'get').mockResolvedValue(makeReport());
    downloadSpy = vi.spyOn(reportRepository, 'downloadPdf');
    clientListSpy = vi.spyOn(clientRepository, 'list').mockResolvedValue({ items: [], meta: {} });
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:pixel-report'),
      revokeObjectURL: vi.fn(),
    });
    anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.style.overflow = '';
  });

  it.each([
    ['ventas', 'Reporte de Ventas', { cantidadVentas: 7, totalVendido: 765432, ticketPromedio: 109347, cantidadClientes: 5 }, 'Ventas realizadas', '7'],
    ['pedidos', 'Reporte de Pedidos', { totalPedidos: 12, pendientes: 2, enProceso: 3, pendientesSaldoFinal: 1, finalizados: 2, entregados: 3, anulados: 1 }, 'Total pedidos', '12'],
    ['cotizaciones', 'Reporte de Cotizaciones', { totalCotizaciones: 18, cantidadConvertidasPedido: 6, tasaConversion: 33.33 }, 'Tasa de conversión', '33,33%'],
    ['abonos', 'Reporte de Abonos', { cantidadAbonos: 9, cantidadConfirmados: 5, cantidadPendientes: 3, cantidadRechazados: 1, totalConfirmado: 500000, totalPendiente: 120000 }, 'Total de abonos', '9'],
  ])('muestra los KPIs entregados por backend para %s', async (type, title, resumen, label, expected) => {
    getReportSpy.mockResolvedValue(makeReport({ resumen }));
    render(<ReportModal type={type} onClose={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
    const card = screen.getByText(label).closest('article');
    expect(within(card).getByText(expected)).toBeInTheDocument();
  });

  it.each([
    ['ventas', 'Estado de pago', 'COMPLETO', 'estadoPago'],
    ['pedidos', 'Estado', 'ENTREGADO', 'estado'],
    ['cotizaciones', 'Estado', 'CONVERTIDA_EN_PEDIDO', 'estado'],
    ['abonos', 'Estado', 'RECHAZADO', 'estado'],
  ])('envía fechas, cliente y estado con las claves reales de %s', async (type, statusLabel, status, statusField) => {
    const user = userEvent.setup();
    clientListSpy.mockResolvedValue({ items: [{ idCliente: 8, nombre: 'Cliente Reporte' }], meta: {} });
    render(<ReportModal type={type} onClose={vi.fn()} />);
    await screen.findByRole('option', { name: 'Cliente Reporte' });

    fireEvent.change(screen.getByLabelText('Fecha inicial'), { target: { value: '2026-08-01' } });
    fireEvent.change(screen.getByLabelText('Fecha final'), { target: { value: '2026-08-31' } });
    await user.selectOptions(screen.getByLabelText('Seleccionar cliente'), '8');
    await user.selectOptions(screen.getByLabelText(statusLabel), status);
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    await waitFor(() => expect(getReportSpy).toHaveBeenLastCalledWith(type, expect.objectContaining({
      fechaInicio: '2026-08-01',
      fechaFin: '2026-08-31',
      idCliente: '8',
      [statusField]: status,
      page: 1,
      limit: 20,
    }), expect.any(Object)));
  });

  it.each([
    ['ventas', {
      idVenta: 12, idPedido: 34, fecha: '2026-09-20', cliente: { nombre: 'Cliente Venta' }, estadoPago: 'COMPLETO', estadoVenta: 'COMPLETA', total: 150000,
    }, ['Venta', 'Pedido', 'Estado de pago', '#12', '#34', 'Cliente Venta', 'Completo']],
    ['pedidos', {
      idPedido: 35, fechaCreacion: '2026-09-19', cliente: { nombre: 'Cliente Pedido' }, estadoPedido: 'EN_PROCESO', fechaEntregaEstimada: null, totalPedido: 500000,
    }, ['Pedido', 'Fecha entrega estimada', '#35', 'Cliente Pedido', 'En proceso', 'No aplica']],
    ['cotizaciones', {
      idCotizacion: 15, fechaCreacion: '2026-09-18', cliente: { nombre: 'Cliente Cotización' }, estado: 'CONVERTIDA_EN_PEDIDO', valorPropuestaVigente: 850000, idPedido: null,
    }, ['Cotización', 'Valor propuesta vigente', 'Pedido generado', '#15', 'Cliente Cotización', 'Convertida en pedido', 'No aplica']],
    ['abonos', {
      idAbono: 20, idPedido: 34, cliente: { nombre: 'Cliente Abono' }, fecha: '2026-09-17', monto: 100000, estado: 'CONFIRMADO', referencia: 'PIXEL-20',
    }, ['Abono', 'Referencia', '#20', '#34', 'Cliente Abono', 'Confirmado', 'PIXEL-20']],
  ])('renderiza las columnas y registros reales de %s', async (type, record, expectedTexts) => {
    getReportSpy.mockResolvedValue(makeReport({ registros: [record], totalRegistros: 1 }));
    render(<ReportModal type={type} onClose={vi.fn()} />);

    await screen.findByRole('table');
    expectedTexts.forEach((text) => expect(screen.getAllByText(text).length).toBeGreaterThan(0));
  });

  it('valida fechas parciales y rangos invertidos antes de consultar', async () => {
    const user = userEvent.setup();
    render(<ReportModal type="ventas" onClose={vi.fn()} />);
    await waitFor(() => expect(getReportSpy).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText('Fecha inicial'), { target: { value: '2026-09-20' } });
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona también la fecha final.');
    expect(getReportSpy).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('Fecha final'), { target: { value: '2026-09-10' } });
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    expect(screen.getByRole('alert')).toHaveTextContent('La fecha inicial no puede ser posterior a la fecha final.');
    expect(getReportSpy).toHaveBeenCalledTimes(1);
  });

  it('aplica todos los filtros de Abonos y limpiar vuelve a página 1 sin filtros', async () => {
    const user = userEvent.setup();
    clientListSpy.mockResolvedValue({
      items: [{ idCliente: 4, nombre: 'Cliente Pixel' }],
      meta: {},
    });
    render(<ReportModal type="abonos" onClose={vi.fn()} />);
    await screen.findByRole('option', { name: 'Cliente Pixel' });

    fireEvent.change(screen.getByLabelText('Fecha inicial'), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText('Fecha final'), { target: { value: '2026-09-30' } });
    await user.selectOptions(screen.getByLabelText('Seleccionar cliente'), '4');
    await user.selectOptions(screen.getByLabelText('Estado'), 'CONFIRMADO');
    await user.type(screen.getByLabelText('Pedido'), '34');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    await waitFor(() => expect(getReportSpy).toHaveBeenLastCalledWith('abonos', {
      fechaInicio: '2026-09-01',
      fechaFin: '2026-09-30',
      idCliente: '4',
      estado: 'CONFIRMADO',
      idPedido: '34',
      page: 1,
      limit: 20,
    }, expect.any(Object)));

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    await waitFor(() => expect(getReportSpy).toHaveBeenLastCalledWith('abonos', {
      fechaInicio: '',
      fechaFin: '',
      idCliente: '',
      estado: '',
      idPedido: '',
      page: 1,
      limit: 20,
    }, expect.any(Object)));
    expect(screen.getByLabelText('Pedido')).toHaveValue(null);
  });

  it('respeta page, totalPages y hasNextPage recibidos del backend', async () => {
    const user = userEvent.setup();
    getReportSpy
      .mockResolvedValueOnce(makeReport({
        totalRegistros: 45,
        registros: [{ idPedido: 1, fechaCreacion: '2026-09-01', cliente: { nombre: 'Cliente A' }, estadoPedido: 'PENDIENTE', totalPedido: 100000 }],
        paginacion: { page: 1, limit: 20, totalPages: 3, hasNextPage: true, hasPrevPage: false },
      }))
      .mockResolvedValueOnce(makeReport({
        totalRegistros: 45,
        registros: [{ idPedido: 21, fechaCreacion: '2026-08-01', cliente: { nombre: 'Cliente B' }, estadoPedido: 'FINALIZADO', totalPedido: 200000 }],
        paginacion: { page: 2, limit: 20, totalPages: 3, hasNextPage: true, hasPrevPage: true },
      }));
    render(<ReportModal type="pedidos" onClose={vi.fn()} />);

    expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => expect(getReportSpy).toHaveBeenLastCalledWith('pedidos', expect.objectContaining({ page: 2, limit: 20 }), expect.any(Object)));
    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument();
  });

  it('muestra estado vacío con KPIs en cero sin tratarlo como error', async () => {
    render(<ReportModal type="cotizaciones" onClose={vi.fn()} />);

    expect(await screen.findByText('No se encontraron registros para los filtros seleccionados.')).toBeInTheDocument();
    expect(screen.getByText('Total cotizaciones').closest('article')).toHaveTextContent('0');
    expect(screen.queryByText('No se pudo cargar el reporte.')).not.toBeInTheDocument();
  });

  it('descarga el Blob con filename y revoca la URL temporal', async () => {
    const user = userEvent.setup();
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    downloadSpy.mockResolvedValue({ blob, filename: 'reporte-ventas-2026.pdf' });
    render(<ReportModal type="ventas" onClose={vi.fn()} />);
    await waitFor(() => expect(getReportSpy).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: 'Descargar PDF' }));

    expect(downloadSpy).toHaveBeenCalledWith('ventas', {
      fechaInicio: '', fechaFin: '', idCliente: '', estadoPago: '',
    });
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(anchorClickSpy).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:pixel-report');
  });

  it('muestra el mensaje humano del límite PDF y no crea un archivo corrupto', async () => {
    const user = userEvent.setup();
    const limitError = new Error('El reporte supera el máximo de 1000 registros.');
    limitError.status = 400;
    downloadSpy.mockRejectedValue(limitError);
    render(<ReportModal type="abonos" onClose={vi.fn()} />);
    await waitFor(() => expect(getReportSpy).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: 'Descargar PDF' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El reporte contiene demasiados registros. Reduce el rango de fechas o aplica más filtros.',
    );
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(anchorClickSpy).not.toHaveBeenCalled();
  });
});
