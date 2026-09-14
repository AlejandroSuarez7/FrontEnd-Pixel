const impactEndpoint = (resource) => (id) => `/api/${resource}/${id}/impacto-eliminacion`;

export const SAFE_DELETE_IMPACT_ENDPOINTS = {
  role: impactEndpoint('roles'),
  user: impactEndpoint('usuarios'),
  client: impactEndpoint('clientes'),
  quote: impactEndpoint('cotizaciones'),
  technique: impactEndpoint('tecnicas'),
  product: impactEndpoint('productos'),
  category: impactEndpoint('categorias-producto'),
  purchase: impactEndpoint('compras'),
  tariff: impactEndpoint('tarifas-tecnicas'),
  payment: impactEndpoint('abonos'),
  design: impactEndpoint('disenos'),
  provider: impactEndpoint('proveedores'),
};
