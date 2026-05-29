import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PATHS } from '../../../routes/paths';

const Sidebar = () => {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const menu = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      to: PATHS.DASHBOARD,
    },
    {
      label: 'Configuración',
      icon: 'settings',
      key: 'config',
      items: [
        { label: 'Roles', to: PATHS.ROLES },
      ],
    },
    {
      label: 'Usuarios',
      icon: 'groups',
      key: 'users',
      items: [
        { label: 'Gestión de Usuarios', to: PATHS.USERS },
        { label: 'Gestión de Empleados', to: PATHS.USERS_EMPLOYEES },
        { label: 'Gestión de Accesos', to: PATHS.USERS_ACCESS },
        { label: 'Gestión de Clientes', to: PATHS.USERS_CLIENTS },
      ],
    },
    {
      label: 'Compras',
      icon: 'shopping_cart',
      key: 'purchases',
      items: [
        { label: 'Gestión de Compras', to: PATHS.PURCHASES },
        { label: 'Gestión de Proveedores', to: PATHS.PURCHASES_PROVIDERS },
        { label: 'Gestión de Insumos', to: PATHS.PURCHASES_SUPPLIES },
        { label: 'Categoría Insumos', to: PATHS.PURCHASES_CATEGORIES },
      ],
    },
    {
      label: 'Ventas',
      icon: 'sell',
      key: 'sales',
      items: [
        { label: 'Gestión de Productos', to: PATHS.SALES_PRODUCTS },
        { label: 'Categoría de Productos', to: PATHS.SALES_CATEGORIES },
        { label: 'Gestión de Ventas', to: PATHS.SALES },
        { label: 'Gestión de Abonos', to: PATHS.SALES_PAYMENTS },
        { label: 'Gestión de Devoluciones', to: PATHS.SALES_RETURNS },
        { label: 'Gestión de Pedidos', to: PATHS.ORDERS },
      ],
    },
    {
      label: 'Servicios',
      icon: 'build',
      key: 'services',
      items: [
        { label: 'Gestión de Servicios', to: PATHS.SERVICES },
        { label: 'Gestión de Cotizaciones', to: PATHS.SERVICES_QUOTES },
      ],
    },
    {
      label: 'Producción',
      icon: 'engineering',
      key: 'production',
      items: [
        { label: 'Gestión de Producción', to: PATHS.PRODUCTION },
        { label: 'Gestión de Diseños', to: PATHS.PRODUCTION_DESIGNS },
        { label: 'Gestión de Entrega de Productos', to: PATHS.PRODUCTION_DELIVERY },
      ],
    },
  ];

  const activeSection = menu.find((section) =>
    section.items?.some((item) => location.pathname.startsWith(item.to)) ||
    section.to === location.pathname
  );

  useEffect(() => {
    if (activeSection?.key) {
      setOpenMenu(activeSection.key);
    }
  }, [activeSection?.key]);

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div>
        <div className="sidebar-header">
          <h2 className="sidebar-title">{collapsed ? 'P' : 'PIXEL'}</h2>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <span className="material-symbols-outlined sidebar-toggle-icon">
              {collapsed ? 'menu' : 'close'}
            </span>
          </button>
        </div>

        <nav>
          {menu.map((section) => {
            const isSectionActive = section.key && activeSection?.key === section.key;

            return (
              <div key={section.label} className="sidebar-section">
                {section.to ? (
                  <NavLink
                    to={section.to}
                    end
                    title={section.label}
                    className={({ isActive }) =>
                      isActive ? 'nav-link active' : 'nav-link'
                    }
                  >
                    <span className="sidebar-icon material-symbols-outlined">{section.icon}</span>
                    <span className="sidebar-label">{section.label}</span>
                  </NavLink>
                ) : (
                  <button
                    type="button"
                    title={section.label}
                    className={isSectionActive ? 'menu-toggle active' : 'menu-toggle'}
                    onClick={() =>
                      setOpenMenu(openMenu === section.key ? null : section.key)
                    }
                  >
                    <span className="sidebar-icon material-symbols-outlined">{section.icon}</span>
                    <span className="sidebar-label">{section.label}</span>
                  </button>
                )}

                {!collapsed && section.items && openMenu === section.key && (
                  <div className="submenu">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end
                        className={({ isActive }) =>
                          isActive ? 'nav-link sublink active' : 'nav-link sublink'
                        }
                      >
                        <span className="sidebar-label">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className={`sidebar-profile${collapsed ? ' collapsed' : ''}`}>
        <div className="avatar">A</div>
        {!collapsed && (
          <div>
            <p>Administrador</p>
            <small>Perfil activo</small>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;