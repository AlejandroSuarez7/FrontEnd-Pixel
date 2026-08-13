import { describe, expect, it } from 'vitest';
import {
  analyzeReceiptText,
  detectPaymentPlatform,
  extractPaymentDate,
  extractPaymentReference,
  parseGenericReceipt,
  parseColombianMoney,
  rankAmountCandidates,
  rankReferenceCandidates,
} from './receiptAnalysis.parsers';

describe('receiptAnalysis parsers', () => {
  it.each([
    ['$ 100.000', 100000],
    ['$100.000', 100000],
    ['COP 100.000', 100000],
    ['100.000', 100000],
    ['100,000', 100000],
    ['100000', 100000],
    ['$39.329,00', 39329],
    ['$115.786', 115786],
    ['$1.500.000', 1500000],
    ['1.500.000,00', 1500000],
    ['1,500,000', 1500000],
    ['50 000', 50000],
    ['COP 75.000', 75000],
    ['Valor enviado: $50.000', 50000],
  ])('parses Colombian money from %s', (rawValue, expected) => {
    expect(parseColombianMoney(rawValue)).toBe(expected);
  });

  it('uses the closest label when transfer, balance and tax share a receipt', () => {
    const candidates = rankAmountCandidates(`
      Valor de la transferencia: $50.000
      Saldo disponible: $2.450.000
      Impuesto 4x1000: $200
    `);

    expect(candidates[0].value).toBe(50000);
    expect(candidates[0].score).toBeGreaterThan(candidates.find(item => item.value === 2450000).score);
  });

  it.each([
    ['Bancolombia', 'Bancolombia'],
    ['Transferencia exitosa Nequi', 'Nequi'],
    ['Comprobante Davivienda', 'Davivienda'],
    ['Pago desde DaviPlata', 'Daviplata'],
    ['Banco de BogotÃ¡', 'Banco de Bogota'],
    ['BBVA Colombia', 'BBVA'],
    ['Scotiabank Colpatria', 'Scotiabank Colpatria'],
    ['ItaÃº', 'Itau'],
    ['Transferencia por Dale!', 'Dale'],
    ['MOVii', 'Movii'],
    ['Pago PSE', 'PSE'],
    ['Transferencia por Transfiya', 'Transfiya'],
  ])('detects %s as %s', (text, expected) => {
    expect(detectPaymentPlatform(text)).toBe(expected);
  });

  it.each([
    {
      name: 'NU real format',
      text: 'Nu\nLa cantidad de $39.329,00\nFecha 10/08/2026\nCUS 555187588',
      amount: 39329,
      reference: '555187588',
      date: '2026-08-10',
      bank: 'Nu',
    },
    {
      name: 'Bancolombia real format',
      text: 'Bancolombia\nValor de la transferencia $115.786\nComprobante No. 0000019900\nFecha 21 May 2026',
      amount: 115786,
      reference: '0000019900',
      date: '2026-05-21',
      bank: 'Bancolombia',
    },
    {
      name: 'Nequi',
      text: 'Nequi\nMonto enviado COP 75.000\nReferencia NQ778899\nEnviado el 21 agosto 2026',
      amount: 75000,
      reference: 'NQ778899',
      date: '2026-08-21',
      bank: 'Nequi',
    },
    {
      name: 'Davivienda',
      text: 'Davivienda\nValor de la operaciÃ³n $ 120.000\nNÃºmero de operaciÃ³n DV445566\nFecha de operaciÃ³n 2026-08-19',
      amount: 120000,
      reference: 'DV445566',
      date: '2026-08-19',
      bank: 'Davivienda',
    },
    {
      name: 'Daviplata',
      text: 'DaviPlata\nEnviaste $ 64.500\nID de transacciÃ³n DP123987\n18-08-2026',
      amount: 64500,
      reference: 'DP123987',
      date: '2026-08-18',
      bank: 'Daviplata',
    },
    {
      name: 'Banco de Bogota',
      text: 'Banco de BogotÃ¡\nTotal pagado $90.000\nAutorizaciÃ³n BG778811\n17 agosto 2026',
      amount: 90000,
      reference: 'BG778811',
      date: '2026-08-17',
      bank: 'Banco de Bogota',
    },
    {
      name: 'BBVA',
      text: 'BBVA\nMonto transferido 150 000\nNÃºmero de referencia BB667700\nFecha 16/08/2026',
      amount: 150000,
      reference: 'BB667700',
      date: '2026-08-16',
      bank: 'BBVA',
    },
    {
      name: 'PSE',
      text: 'PSE\nValor pagado COP 83.200\nCUS 99887766\n15 agosto 2026',
      amount: 83200,
      reference: '99887766',
      date: '2026-08-15',
      bank: 'PSE',
    },
    {
      name: 'unknown platform',
      text: 'Transferencia aprobada\nMonto enviado $71.300\nCÃ³digo de operaciÃ³n ZX554433\n14 agosto 2026',
      amount: 71300,
      reference: 'ZX554433',
      date: '2026-08-14',
      bank: null,
    },
  ])('parses $name through contextual candidates', ({ text, amount, reference, date, bank }) => {
    const result = analyzeReceiptText(text, 88);
    expect(result).toMatchObject({
      montoDetectado: amount,
      referenciaDetectada: reference,
      fechaDetectada: date,
      bancoDetectado: bank,
    });
  });

  it('continues with the generic parser when no platform is present', () => {
    const result = parseGenericReceipt(`
      Pago realizado
      Monto enviado: $ 45.000
      Referencia de pago: PAY445566
      Fecha del pago: 22 agosto 2026
    `, 86);

    expect(result.montoDetectado).toBe(45000);
    expect(result.bancoDetectado).toBeNull();
    expect(result.requiereRevisionManual).toBe(false);
  });

  it('does not confuse an account, phone or document with the payment reference', () => {
    const candidates = rankReferenceCandidates(`
      Cuenta: 123456789012
      TelÃ©fono: 3001234567
      Documento: 1012345678
      Referencia de transferencia: TRX889900
    `);

    expect(candidates[0].value).toBe('TRX889900');
    expect(extractPaymentReference('Cuenta: 123456789012')).toBeNull();
  });

  it.each([
    ['Fecha de transacciÃ³n 10/08/2026 08:45', '2026-08-10'],
    ['Fecha 10-08-2026', '2026-08-10'],
    ['Realizado el 2026-08-10', '2026-08-10'],
    ['Enviado el 10 ago 2026', '2026-08-10'],
    ['Fecha del pago 10 agosto 2026', '2026-08-10'],
    ['Transferencia realizada 21 May 2026', '2026-05-21'],
    ['Payment date 21 mayo 2026 14:30', '2026-05-21'],
  ])('normalizes date from %s', (text, expected) => {
    expect(extractPaymentDate(text)).toBe(expected);
  });

  it('finds a labeled amount near the end of a long vertical receipt', () => {
    const noise = Array.from({ length: 80 }, (_, index) => `Detalle informativo ${index + 1}`).join('\n');
    const result = analyzeReceiptText(`${noise}\nMonto transferido\n$ 205.000\nReferencia LONG7788`, 72);

    expect(result.montoDetectado).toBe(205000);
    expect(result.referenciaDetectada).toBe('LONG7788');
  });

  it('keeps incomplete or fragmented text in manual review', () => {
    const result = analyzeReceiptText('M0nt0 ?\ntexto fragmentado\n123', 22);
    expect(result.montoDetectado).toBeNull();
    expect(result.requiereRevisionManual).toBe(true);
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
