import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const integrations = {
  role: 'src/modules/configuration/pages/RolesPage.jsx',
  user: 'src/modules/users/pages/UsersPage.jsx',
  client: 'src/modules/users/pages/ClientsPage.jsx',
  quote: 'src/modules/services/pages/QuotesPage.jsx',
  technique: 'src/modules/services/pages/ServicesPage.jsx',
  product: 'src/modules/products/pages/ProductsPage.jsx',
  category: 'src/modules/products/pages/ProductCategoriesPage.jsx',
  purchase: 'src/modules/purchases/compras/presentation/ComprasPage.jsx',
  tariff: 'src/modules/services/tarifas/pages/TechniqueRatesPage.jsx',
  payment: 'src/modules/sales/abonos/presentation/AbonosPage.jsx',
  design: 'src/modules/production/disenos/presentation/DisenosPage.jsx',
  provider: 'src/modules/purchases/proveedores/presentation/ProveedoresPage.jsx',
};

describe('safe delete page integrations', () => {
  it.each(Object.entries(integrations))('%s uses SafeDeleteModal and its confirmed impact endpoint', (key, file) => {
    const source = readFileSync(resolve(file), 'utf8');
    expect(source).toContain('<SafeDeleteModal');
    expect(source).toContain(`SAFE_DELETE_IMPACT_ENDPOINTS.${key}(`);
    expect(source).not.toContain('Eliminar definitivo');
  });

  it('does not introduce safe deletion into orders or sales', () => {
    const orderSource = readFileSync(resolve('src/modules/sales/pages/PedidosPage.jsx'), 'utf8');
    const salesSource = readFileSync(resolve('src/modules/sales/ventas/presentation/VentasPage.jsx'), 'utf8');

    expect(orderSource).not.toContain('SafeDeleteModal');
    expect(salesSource).not.toContain('SafeDeleteModal');
    expect(orderSource).not.toContain('SAFE_DELETE_IMPACT_ENDPOINTS');
    expect(salesSource).not.toContain('SAFE_DELETE_IMPACT_ENDPOINTS');
  });
});
