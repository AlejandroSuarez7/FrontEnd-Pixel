import { describe, expect, it } from 'vitest';
import {
  canRespondToProposal,
  getCurrentQuoteVersion,
  getProposalStatusLabel,
  getQuoteDecisionLabel,
  getResponseMediumLabel,
} from './quoteWorkflow.utils';

describe('quote workflow labels and response rules', () => {
  it('prioritizes propuestaActual over historical proposal fields', () => {
    const propuestaActual = { idVersion: 12, precioFinal: 850000, esVigente: true };
    expect(getCurrentQuoteVersion({
      propuestaActual,
      propuesta: { idVersion: 9, precioFinal: 700000 },
      versiones: [{ idVersion: 8, esVigente: true }],
    })).toBe(propuestaActual);
  });

  it('converts workflow enums into human labels', () => {
    expect(getProposalStatusLabel('ENVIADA')).toBe('Enviada al cliente');
    expect(getQuoteDecisionLabel('SOLICITAR_AJUSTE')).toBe('Ajuste solicitado');
    expect(getResponseMediumLabel('SISTEMA')).toBe('Portal del cliente');
    expect(getResponseMediumLabel('WHATSAPP')).toBe('WhatsApp');
  });

  it('only allows responding to the current valid proposal', () => {
    expect(canRespondToProposal({
      estado: 'PENDIENTE_APROBACION_CLIENTE',
      propuesta: {
        idVersion: 8,
        estado: 'ENVIADA',
        validaHasta: '2099-08-06T23:59:59.000Z',
        respuesta: null,
      },
    })).toBe(true);

    expect(canRespondToProposal({
      estado: 'PENDIENTE_APROBACION_CLIENTE',
      propuesta: {
        idVersion: 8,
        estado: 'ENVIADA',
        validaHasta: '2020-08-06T23:59:59.000Z',
        respuesta: null,
      },
    })).toBe(false);
  });
});
