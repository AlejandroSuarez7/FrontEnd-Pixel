import { describe, expect, it } from 'vitest';
import { formatPaymentOrigin } from './paymentOrigin';

describe('formatPaymentOrigin', () => {
  it('prefers the human label returned by the backend', () => {
    expect(formatPaymentOrigin({
      origenRegistroCodigo: 'FRONTEND',
      origenRegistroLabel: 'Cargado por el cliente',
    })).toBe('Cargado por el cliente');
  });

  it('never exposes internal origin codes as the visible fallback', () => {
    expect(formatPaymentOrigin('FRONTEND')).toBe('Enviado desde el portal del cliente');
    expect(formatPaymentOrigin('BACKEND')).toBe('Procesamiento interno');
    expect(formatPaymentOrigin('MANUAL')).toBe('Revision manual');
  });
});
