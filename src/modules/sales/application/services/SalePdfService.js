import { jsPDF } from 'jspdf';
import { formatCurrency, formatShortDate } from '../../../../core/utils/formatters.js';

export const generateSalePdf = (sale) => {
  if (!sale) return;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const leftMargin = 40;
  let y = 50;

  doc.setFontSize(24);
  doc.text('PIXEL', leftMargin, y);
  doc.setFontSize(10);
  doc.text('Gestión de Ventas - Documento de Venta', leftMargin, y + 20);
  doc.setFontSize(9);
  doc.text('Empresa PIXEL', leftMargin, y + 38);
  doc.text('Cali, Colombia', leftMargin, y + 50);
  doc.line(leftMargin, y + 60, 555, y + 60);

  doc.setFontSize(12);
  doc.text(`Número de venta: ${sale.id}`, leftMargin, y + 85);
  doc.text(`Fecha: ${formatShortDate(sale.saleDate)}`, leftMargin, y + 100);
  doc.text(`Cliente: ${sale.clientName}`, leftMargin, y + 115);
  doc.text(`Método pago: ${sale.paymentMethod}`, leftMargin, y + 130);
  doc.text(`Estado: ${sale.status}`, leftMargin, y + 145);
  doc.text(`Usuario: ${sale.responsible}`, leftMargin, y + 160);

  y = 190;
  doc.setFontSize(11);
  doc.text('Productos', leftMargin, y);
  doc.setFontSize(9);
  doc.text('Cant.', 300, y);
  doc.text('Precio Unit.', 350, y);
  doc.text('Subtotal', 470, y);
  y += 14;
  doc.line(leftMargin, y, 555, y);
  y += 18;

  sale.items.forEach((item) => {
    doc.text(item.nombreProducto, leftMargin, y);
    doc.text(String(item.quantity), 300, y);
    doc.text(formatCurrency(item.unitPrice), 350, y);
    doc.text(formatCurrency(item.subtotal), 470, y);
    y += 18;
  });

  y += 10;
  doc.line(leftMargin, y, 555, y);
  y += 18;
  doc.text(`Subtotal: ${formatCurrency(sale.subtotal)}`, 350, y);
  y += 15;
  doc.text(`IVA (19%): ${formatCurrency(sale.tax)}`, 350, y);
  y += 15;
  doc.setFontSize(12);
  doc.text(`Total: ${formatCurrency(sale.total)}`, 350, y);

  y += 35;
  doc.setFontSize(10);
  doc.text('Observaciones:', leftMargin, y);
  doc.setFontSize(9);
  doc.text(sale.observations || 'Sin observaciones', leftMargin, y + 15);

  doc.save(`venta_${sale.id}.pdf`);
};
