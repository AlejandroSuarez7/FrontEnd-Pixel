// shared/layouts/DashboardLayout/Sidebar.jsx
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { filterSidebarByPermissions } from '../../../routes/SIDEBAR_CONFIG';
import { useAuth } from '../../../store/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, permissions, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState(null);
  const [collapsed, setCollapsed] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  ));

  const userRole = user?.rol?.nombre || user?.rol || user?.nombreRol || 'Cliente';
  const userName = user?.nombre || user?.correo || 'Usuario';
  const avatarLetter = userName.charAt(0).toUpperCase();
  const menu = filterSidebarByPermissions(permissions);

  const activeSection = menu.find((section) =>
    section.items?.some((item) => location.pathname.startsWith(item.to)) ||
    section.to === location.pathname
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const isMobileOpen = typeof window !== 'undefined' && window.innerWidth <= 768 && !collapsed;
    document.body.classList.toggle('sidebar-mobile-open', isMobileOpen);

    return () => document.body.classList.remove('sidebar-mobile-open');
  }, [collapsed]);

  const closeMobileSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setCollapsed(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <button
        type="button"
        className="mobile-sidebar-button"
        onClick={() => setCollapsed(false)}
        aria-label="Abrir menu"
        aria-expanded={!collapsed}
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      <button
        type="button"
        className={`mobile-sidebar-backdrop${collapsed ? ' hidden' : ''}`}
        onClick={() => setCollapsed(true)}
        aria-label="Cerrar menu"
      />

      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <div>
          <div className="sidebar-header">
            <h2 className="sidebar-title">{collapsed ? 'P' : 'PIXEL'}</h2>
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? 'Expandir menu' : 'Cerrar menu'}
            >
              <span className="material-symbols-outlined sidebar-toggle-icon">
                {collapsed ? 'menu' : 'close'}
              </span>
            </button>
          </div>

          <nav>
            {menu.map((section) => {
              const isSectionActive = section.key && activeSection?.key === section.key;
              const isMenuOpen = openMenu === section.key || isSectionActive;

              return (
                <div key={section.label} className="sidebar-section">
                  {section.to ? (
                    <NavLink
                      to={section.to}
                      end
                      title={section.label}
                      onClick={closeMobileSidebar}
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
                      onClick={() => setOpenMenu(isMenuOpen ? null : section.key)}
                    >
                      <span className="sidebar-icon material-symbols-outlined">{section.icon}</span>
                      <span className="sidebar-label">{section.label}</span>
                    </button>
                  )}

                  {!collapsed && section.items && isMenuOpen && (
                    <div className="submenu">
                      {section.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end
                          onClick={closeMobileSidebar}
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
          <div className="avatar">{avatarLetter}</div>
          {!collapsed && (
            <div className="sidebar-profile-info">
              <p>{userName}</p>
              <small>{userRole}</small>
              <button
                type="button"
                className="sidebar-logout-btn"
                onClick={handleLogout}
                title="Cerrar sesion"
              >
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
