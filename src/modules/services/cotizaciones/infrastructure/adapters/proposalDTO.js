import {
  datetimeLocalToIso,
  getProposalDesignIdentifier,
} from '../../domain/quoteProposal.js';

const cleanOptionalText = (value) => {
  const text = String(value ?? '').trim();
  return text || null;
};

const cleanMoney = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

const compact = (object) => Object.fromEntries(
  Object.entries(object).filter(([, value]) => value !== undefined && value !== null),
);

export const proposalDTO = {
  toApi(proposal = {}) {
    const validity = proposal.validaHasta?.includes('T') && !proposal.validaHasta.endsWith('Z')
      ? datetimeLocalToIso(proposal.validaHasta)
      : proposal.validaHasta;

    const payload = {
      precioFinal: cleanMoney(proposal.precioFinal),
      ...(validity ? { validaHasta: validity } : {}),
      descuentoManual: cleanMoney(proposal.descuentoManual),
      ...(cleanOptionalText(proposal.motivoAjusteManual)
        ? { motivoAjusteManual: cleanOptionalText(proposal.motivoAjusteManual) }
        : {}),
      ...(cleanOptionalText(proposal.mensajeCliente)
        ? { mensajeCliente: cleanOptionalText(proposal.mensajeCliente) }
        : {}),
      ...(cleanOptionalText(proposal.observacionesCliente)
        ? { observacionesCliente: cleanOptionalText(proposal.observacionesCliente) }
        : {}),
      ...(cleanOptionalText(proposal.observacionesInternas)
        ? { observacionesInternas: cleanOptionalText(proposal.observacionesInternas) }
        : {}),
      items: (proposal.items || []).map((item) => ({
        idDetalleCotizacion: Number(item.idDetalleCotizacion),
        subtotalServiciosOficial: cleanMoney(item.subtotalServiciosOficial),
        costoProducto: cleanMoney(item.costoProducto),
        otrosCostosItem: cleanMoney(item.otrosCostosItem),
        subtotalOficial: cleanMoney(item.subtotalOficial),
      })),
      disenos: (proposal.disenos || []).map((design) => {
        const identifier = getProposalDesignIdentifier(design);
        const identifierField = identifier ? { [identifier[0]]: identifier[1] } : {};
        return {
          ...identifierField,
          descripcionVisible: String(design.descripcionVisible || '').trim(),
          costoDiseno: cleanMoney(design.costoDiseno),
          visibleCliente: Boolean(design.visibleCliente),
        };
      }),
      conceptosAdicionales: (proposal.conceptosAdicionales || []).map((concept) => ({
        concepto: String(concept.concepto || '').trim(),
        valor: cleanMoney(concept.valor),
        visibleCliente: Boolean(concept.visibleCliente),
      })),
    };

    return compact(payload);
  },
};

