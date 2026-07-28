import { describe, expect, it } from 'vitest';
import {
  analyzeReceiptText,
  detectPaymentPlatform,
  extractPaymentDate,
  extractPaymentReference,
  parseColombianMoney,
  rankAmountCandidates,
} from './receiptAnalysis.parsers';

describe('receiptAnalysis parsers', () => {
  it.each([
    ['$ 100.000', 100000],
    ['$100.000', 100000],
    ['COP 100.000', 100000],
    ['100.000', 100000],
    ['100,000', 100000],
    ['100000', 100000],
    ['Valor enviado: $50.000', 50000],
  ])('parses Colombian money from %s', (rawValue, expected) => {
    expect(parseColombianMoney(rawValue)).toBe(expected);
  });

  it('ranks a transfer amount above balances, references and phone numbers', () => {
    const candidates = rankAmountCandidates(`
      Nequi
      Valor enviado: $ 150.000
      Saldo disponible: $ 2.300.000
      Referencia: 9988776655
      Telefono: 3001234567
    `);

    expect(candidates[0].value).toBe(150000);
  });

  it('extracts reference, date and payment platform', () => {
    const text = `
      Transferencia exitosa Nequi
      Referencia: M123456
      Fecha: 26/07/2026
      Total pagado $ 100.000
    `;

    expect(extractPaymentReference(text)).toBe('M123456');
    expect(extractPaymentDate(text)).toBe('2026-07-26');
    expect(detectPaymentPlatform(text)).toBe('Nequi');
  });

  it('marks ambiguous amounts for manual review while retaining internal candidates', () => {
    const analysis = analyzeReceiptText(`
      Valor enviado: $ 100.000
      Total pagado: $ 80.000
      Referencia: ABCD1234
      Bancolombia
      2026-07-26
    `, 90);

    expect(analysis.montoDetectado).toBe(100000);
    expect(analysis.amountCandidates.length).toBeGreaterThan(1);
    expect(analysis.requiereRevisionManual).toBe(true);
    expect(analysis.origenAnalisis).toBe('FRONTEND');
  });

  it('returns nullable suggestions instead of invalid values', () => {
    const analysis = analyzeReceiptText('Comprobante ilegible', 15);

    expect(analysis).toMatchObject({
      montoDetectado: null,
      referenciaDetectada: null,
      fechaDetectada: null,
      bancoDetectado: null,
      requiereRevisionManual: true,
      origenAnalisis: 'FRONTEND',
    });
    expect(analysis.calidadLectura).toBeGreaterThanOrEqual(0);
    expect(analysis.calidadLectura).toBeLessThanOrEqual(100);
  });
});
