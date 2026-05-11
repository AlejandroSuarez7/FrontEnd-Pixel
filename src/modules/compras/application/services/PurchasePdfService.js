import { jsPDF } from 'jspdf';

const createHeader = (doc) => {
  doc.setFontSize(18);
  doc.text('PIXEL Estampados', 40, 60);
  doc.setFontSize(10);
  doc.text('Sistema administrativo de compras', 40, 75);
  doc.setFontSize(9);
  doc.text('NIT: 900123456-7 | Tel: +57 300 123 4567', 40, 90);
};

const addRow = (doc, row, y) => {
  row.forEach((text, index) => {
    doc.text(String(text), 40 + index * 110, y);
  });
};

export class PurchasePdfService {
  createPurchasePdf(purchase) {
    const doc = new jsPDF({ unit: 'pt' });
    createHeader(doc);

    doc.setFontSize(12);
    doc.text(`Factura: ${purchase.invoiceNumber}`, 40, 120);
    doc.text(`Compra: ${purchase.id}`, 40, 140);
    doc.text(`Proveedor: ${purchase.supplier}`, 40, 160);
    doc.text(`Fecha compra: ${purchase.purchaseDate}`, 40, 180);
    doc.text(`Método pago: ${purchase.paymentMethod}`, 40, 200);
    doc.text(`Estado: ${purchase.status}`, 40, 220);

    doc.setFontSize(11);
    doc.text('Detalle de insumos', 40, 250);
    addRow(doc, ['Nombre', 'Cantidad', 'Unidad', 'Precio', 'Subtotal'], 270);

    (purchase.items || []).forEach((item, index) => {
      const y = 290 + index * 20;
      addRow(doc, [item.nombreInsumo, item.cantidad, item.unidadMedida, `$${item.precioUnitario}`, `$${item.subtotal}`], y);
    });

    const footerY = 310 + (purchase.items || []).length * 20;
    doc.text(`Subtotal: $${purchase.subtotal}`, 40, footerY);
    doc.text(`IVA (19%): $${purchase.tax}`, 40, footerY + 20);
    doc.text(`Total: $${purchase.total}`, 40, footerY + 40);
    doc.text('Observaciones:', 40, footerY + 70);
    doc.text(purchase.notes || 'Sin observaciones', 40, footerY + 90);

    return doc.output('blob');
  }
}
