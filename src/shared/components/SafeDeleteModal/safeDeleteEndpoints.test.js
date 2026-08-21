import { describe, expect, it } from 'vitest';
import { SAFE_DELETE_IMPACT_ENDPOINTS } from './safeDeleteEndpoints';

describe('SAFE_DELETE_IMPACT_ENDPOINTS', () => {
  it('matches the twelve confirmed backend impact routes', () => {
    expect(Object.fromEntries(
      Object.entries(SAFE_DELETE_IMPACT_ENDPOINTS).map(([key, builder]) => [key, builder(17)]),
    )).toEqual({
      role: '/api/roles/17/impacto-eliminacion',
      user: '/api/usuarios/17/impacto-eliminacion',
      client: '/api/clientes/17/impacto-eliminacion',
      quote: '/api/cotizaciones/17/impacto-eliminacion',
      technique: '/api/tecnicas/17/impacto-eliminacion',
      product: '/api/productos/17/impacto-eliminacion',
      category: '/api/categorias-producto/17/impacto-eliminacion',
      purchase: '/api/compras/17/impacto-eliminacion',
      tariff: '/api/tarifas-tecnicas/17/impacto-eliminacion',
      payment: '/api/abonos/17/impacto-eliminacion',
      design: '/api/disenos/17/impacto-eliminacion',
      provider: '/api/proveedores/17/impacto-eliminacion',
    });
  });
});
