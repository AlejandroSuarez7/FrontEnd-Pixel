import { describe, expect, it } from 'vitest';
import {
  canRespondToProposal,
  getProposalStatusLabel,
  getQuoteDecisionLabel,
  getResponseMediumLabel,
} from './quoteWorkflow.utils';

describe('quote workflow labels and response rules', () => {
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
