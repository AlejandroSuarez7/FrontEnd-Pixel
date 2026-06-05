// shared/layouts/DashboardLayout/Sidebar.jsx
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { PATHS } from '../../../routes/paths';
import { SIDEBAR_BY_ROLE } from '../../../routes/SIDEBAR_CONFIG';

const Sidebar = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const [openMenu, setOpenMenu]   = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  // Lee el usuario y rol desde localStorage (guardado por authService.login)
  const session  = JSON.parse(localStorage.getItem('pixel_user') || '{}');
  const userRole = session?.rol?.nombre || 'Cliente';
  const userName = session?.nombre || 'Usuario';

  // Inicial del nombre para el avatar
  const avatarLetter = userName.charAt(0).toUpperCase();

  // Menú filtrado según el rol — fallback a menú de Cliente si el rol no existe
  const menu = SIDEBAR_BY_ROLE[userRole] ?? SIDEBAR_BY_ROLE['Cliente'];

  // Abre automáticamente la sección activa al navegar
  const activeSection = menu.find((section) =>
    section.items?.some((item) => location.pathname.startsWith(item.to)) ||
    section.to === location.pathname
  );

  useEffect(() => {
    if (activeSection?.key) {
      setOpenMenu(activeSection.key);
    }
  }, [activeSection?.key]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('pixel_user');
    navigate('/login');
  };

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
                    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                  >
                    <span className="sidebar-icon material-symbols-outlined">{section.icon}</span>
                    <span className="sidebar-label">{section.label}</span>
                  </NavLink>
                ) : (
                  <button
                    type="button"
                    title={section.label}
                    className={isSectionActive ? 'menu-toggle active' : 'menu-toggle'}
                    onClick={() => setOpenMenu(openMenu === section.key ? null : section.key)}
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

      {/* Perfil con nombre real y botón de logout */}
      <div className={`sidebar-profile${collapsed ? ' collapsed' : ''}`}>
        <div className="avatar">{avatarLetter}</div>
        {!collapsed && (
          <div className="sidebar-profile-info">
            <p>{userName}</p>
            <small>{userRole}</small>
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;