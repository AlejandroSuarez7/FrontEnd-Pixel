import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../../store/AuthContext';
import { isClientUser } from '../../../core/utils/permissions';
import '../pages/LandingPage.css';

const PUBLIC_NAV_ITEMS = [
  { label: 'Inicio', to: '/#inicio', hash: '#inicio', section: 'inicio' },
  { label: '¿Cómo funciona?', to: '/#como-funciona', hash: '#como-funciona', section: 'como-funciona' },
  { label: 'Servicios', to: '/#servicios', hash: '#servicios', section: 'servicios' },
  { label: 'Comparativo', to: '/#comparativo', hash: '#comparativo', section: 'comparativo' },
  { label: 'Productos', to: '/#productos', hash: '#productos', section: 'productos' },
  { label: 'Cotizar', to: '/cotizar', quote: true, section: 'cotizar' },
  { label: 'Contacto', to: '/#contacto', hash: '#contacto', section: 'contacto' },
];

const LANDING_SECTIONS = PUBLIC_NAV_ITEMS.filter((item) => !item.quote);

const getSectionFromHash = (hash) => {
  const section = String(hash || '').replace(/^#/, '');
  return LANDING_SECTIONS.some((item) => item.section === section) ? section : 'inicio';
};

const replaceLandingHash = (section) => {
  const hash = `#${section}`;
  if (window.location.hash === hash) return;
  window.history.replaceState(window.history.state, '', `/${hash}`);
};

const PublicNavbar = () => {
  const { user, permissions, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname || window.location.pathname || '/';
  const currentHash = location.hash || window.location.hash || '';
  const routeKey = `${pathname}${currentHash}`;
  const [profileState, setProfileState] = useState({ routeKey, open: false });
  const [mobileMenuState, setMobileMenuState] = useState({ routeKey, open: false });
  const initialSection = pathname === '/cotizar' ? 'cotizar' : getSectionFromHash(currentHash);
  const [activeSectionState, setActiveSectionState] = useState({ pathname, section: initialSection });
  const activeSectionRef = useRef(initialSection);
  const currentHashRef = useRef(currentHash);
  const pendingSectionRef = useRef(pathname === '/' && currentHash ? initialSection : null);
  const pendingTimerRef = useRef(null);
  const profileOpen = profileState.routeKey === routeKey && profileState.open;
  const mobileMenuOpen = mobileMenuState.routeKey === routeKey && mobileMenuState.open;
  const activeSection = pathname === '/cotizar'
    ? 'cotizar'
    : activeSectionState.pathname === pathname
      ? activeSectionState.section
      : initialSection;
  const isLoggedIn = Boolean(user);
  const isClient = isClientUser(user, permissions);
  const userName = user?.nombre || 'Usuario';
  const avatarLetter = userName.charAt(0).toUpperCase();

  useEffect(() => {
    currentHashRef.current = currentHash;
  }, [currentHash]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') setMobileMenuState({ routeKey, open: false });
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen, routeKey]);

  useEffect(() => {
    if (pathname !== '/' || typeof window.IntersectionObserver !== 'function') return undefined;

    const sections = LANDING_SECTIONS
      .map((item) => document.getElementById(item.section))
      .filter(Boolean);
    if (sections.length === 0) return undefined;

    const directHash = currentHashRef.current || window.location.hash;
    const directSection = getSectionFromHash(directHash);
    pendingSectionRef.current = directHash && directSection !== 'inicio' ? directSection : null;
    activeSectionRef.current = directSection;
    setActiveSectionState((current) => (
      current.pathname === pathname && current.section === directSection
        ? current
        : { pathname, section: directSection }
    ));

    const visibleSections = new Map();
    const navbarHeight = document.querySelector('[data-testid="public-navbar"]')
      ?.getBoundingClientRect().height || 80;

    const activateSection = (section) => {
      if (activeSectionRef.current === section) return;
      activeSectionRef.current = section;
      setActiveSectionState({ pathname, section });
    };

    const observer = new window.IntersectionObserver((entries) => {
      entries.forEach((entry) => visibleSections.set(entry.target.id, entry));

      const pendingSection = pendingSectionRef.current;
      if (pendingSection) {
        const pendingEntry = visibleSections.get(pendingSection);
        if (!pendingEntry?.isIntersecting) return;
        pendingSectionRef.current = null;
        if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
        activateSection(pendingSection);
        return;
      }

      const visibleEntries = [];
      sections.forEach((section) => {
        const entry = visibleSections.get(section.id);
        if (entry?.isIntersecting) visibleEntries.push(entry);
      });
      if (visibleEntries.length === 0) return;

      const nearPageEnd = window.innerHeight + window.scrollY
        >= document.documentElement.scrollHeight - 12;
      const contactEntry = visibleSections.get('contacto');
      if (nearPageEnd && contactEntry?.isIntersecting) {
        activateSection('contacto');
        return;
      }

      const detectionLine = navbarHeight + 12;
      let closestEntry = visibleEntries[0];
      let closestDistance = Math.abs(closestEntry.boundingClientRect.top - detectionLine);

      for (let index = 1; index < visibleEntries.length; index += 1) {
        const entry = visibleEntries[index];
        const distance = Math.abs(entry.boundingClientRect.top - detectionLine);
        if (distance < closestDistance) {
          closestEntry = entry;
          closestDistance = distance;
        }
      }

      activateSection(closestEntry.target.id);
    }, {
      rootMargin: `-${Math.ceil(navbarHeight + 8)}px 0px -65% 0px`,
      threshold: [0, 0.01],
    });

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
      pendingSectionRef.current = null;
    };
  }, [pathname]);

  const isItemActive = (item) => item.section === activeSection;

  const handleNavigation = (event, item) => {
    setMobileMenuState({ routeKey, open: false });
    setProfileState({ routeKey, open: false });

    if (item.quote || pathname !== '/') return;

    event.preventDefault();
    pendingSectionRef.current = item.section;
    if (activeSectionRef.current !== item.section) {
      activeSectionRef.current = item.section;
      setActiveSectionState({ pathname, section: item.section });
    }
    replaceLandingHash(item.section);

    if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
    pendingTimerRef.current = window.setTimeout(() => {
      pendingSectionRef.current = null;
      pendingTimerRef.current = null;
    }, 1400);

    document.getElementById(item.section)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleGoDashboard = () => {
    setProfileState({ routeKey, open: false });
    setMobileMenuState({ routeKey, open: false });
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setProfileState({ routeKey, open: false });
    setMobileMenuState({ routeKey, open: false });
    logout();
    navigate('/');
  };

  return (
    <>
      <header className="landing-header" data-testid="public-navbar">
        <div className="landing-container">
          <div className="landing-flex">
            <Link className="landing-logo" to="/" aria-label="PIXEL, volver al inicio">
              PIXEL
            </Link>

            <nav className="landing-nav" aria-label="Navegación pública">
              {PUBLIC_NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  className={`landing-nav-link${isItemActive(item) ? ' active' : ''}`}
                  to={item.to}
                  aria-current={isItemActive(item) ? 'page' : undefined}
                  onClick={(event) => handleNavigation(event, item)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="landing-header-actions">
              {!isLoggedIn ? (
                <Link to="/login" className="btn-login">
                  <span className="btn-login-text">Iniciar Sesión</span>
                </Link>
              ) : (
                <div className="landing-profile-wrapper">
                  <button
                    type="button"
                    className="landing-profile-button"
                    onClick={() => setProfileState({ routeKey, open: !profileOpen })}
                    aria-expanded={profileOpen}
                  >
                    <span className="landing-profile-avatar">{avatarLetter}</span>
                    <span className="landing-profile-label">Perfil</span>
                  </button>

                  {profileOpen && (
                    <div className="landing-profile-menu">
                      <p className="landing-profile-name">{userName}</p>
                      <button type="button" onClick={handleGoDashboard} className="landing-profile-menu-btn">
                        {isClient ? 'Mis pedidos' : 'Ir al Dashboard'}
                      </button>
                      <button type="button" onClick={handleLogout} className="landing-profile-menu-btn danger">
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                className="hamburger-btn"
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuState({ routeKey, open: !mobileMenuOpen })}
              >
                {mobileMenuOpen ? <X className="menu-icon" /> : <Menu className="menu-icon" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <button
        type="button"
        className={`landing-mobile-backdrop${mobileMenuOpen ? ' open' : ''}`}
        aria-label="Cerrar menú"
        tabIndex={mobileMenuOpen ? 0 : -1}
        onClick={() => setMobileMenuState({ routeKey, open: false })}
      />

      <aside className={`sheet-container${mobileMenuOpen ? ' open' : ''}`} aria-hidden={!mobileMenuOpen}>
        <div className="mobile-menu-heading">
          <button type="button" className="mobile-menu-close" onClick={() => setMobileMenuState({ routeKey, open: false })} aria-label="Cerrar menú">
            <X size={21} />
          </button>
        </div>
        <nav className="mobile-nav" aria-label="Navegación pública móvil">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              className={`mobile-nav-link${isItemActive(item) ? ' active' : ''}`}
              to={item.to}
              aria-current={isItemActive(item) ? 'page' : undefined}
              onClick={(event) => handleNavigation(event, item)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mobile-user-section">
          {!isLoggedIn ? (
            <Link className="mobile-login-btn" to="/login">Iniciar Sesión</Link>
          ) : (
            <>
              <p className="mobile-profile-name">{userName}</p>
              <button type="button" className="mobile-login-btn" onClick={handleGoDashboard}>
                {isClient ? 'Mis pedidos' : 'Ir al Dashboard'}
              </button>
              <button type="button" className="mobile-login-btn mobile-logout-btn" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default PublicNavbar;
