import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div>
      <header className="landing-header">
        <div className="landing-container">
          <div className="landing-flex">

            {/* Logo */}
            <div className="landing-logo">PIXEL</div>

            {/* Navegación Desktop */}
            <nav className="landing-nav">
              <a className="landing-nav-link" href="#inicio">Inicio</a>
              <a className="landing-nav-link" href="#como-funciona">¿Cómo funciona?</a>
              <a className="landing-nav-link" href="#servicios">Servicios</a>
              <a className="landing-nav-link" href="#comparativo">Comparativo</a>
              <a className="landing-nav-link" href="#productos">Productos</a>
              <a className="landing-nav-link" href="#contacto">Contacto</a>
            </nav>

            {/* Acciones (Login + Botón móvil) */}
            <div className="actions">
              <Link to="/login" className="btn-login">
                <span className="btn-login-text">
                 Iniciar Sesión
               </span>
              </Link>

              <button className="hamburger-btn" aria-label="Abrir menú">
                <svg xmlns="http://www.w3.org/2000/svg" className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </header>











      {/* Hero / contenido principal */}
      <section id="inicio" className="hero-section">

      {/* Background */}
      <div className="hero-background">

        <div className="hero-image"></div>

        <div className="hero-overlay"></div>

      </div>

      {/* Content */}
      <div className="hero-container">

        <div className="hero-content">

          <h1 className="hero-title">
            PIXEL
          </h1>

          <p className="hero-subtitle">
            Dale vida a tus ideas con estampados de calidad
          </p>

          <p className="hero-description">
            Especialistas en serigrafía, DTF, sublimación y estampado digital.
            Transformamos tu creatividad en prendas únicas.
          </p>

          {/* Buttons */}
          <div className="hero-buttons">

            <button className="hero-btn-primary">
              Explorar Servicios
            </button>

            <button className="hero-btn-secondary">
              Solicitar Cotización
            </button>

          </div>

          {/* Scroll Indicator */}
          <div className="scroll-indicator">

            <div className="scroll-mouse">

              <div className="scroll-dot"></div>

            </div>

          </div>

        </div>

      </div>

    </section>




{/* ===== HOW IT WORKS ===== */}

    <section 
      id="como-funciona"
      className="how-section"
    >

      <div className="how-container">

        {/* Header */}
        <div className="how-header">

          <h2 className="how-title">
            ¿Cómo funciona?
          </h2>

          <p className="how-subtitle">
            Un proceso simple y transparente de la idea al producto final
          </p>

        </div>

        {/* Steps */}
        <div className="how-steps-wrapper">

          {/* Connection Line */}
          <div className="how-line"></div>

          <div className="how-grid">

            {/* Step 1 */}
            <div className="how-card">

              <div className="step-number purple">
                <span>01</span>
              </div>

              <div className="step-icon-wrapper">

                <div className="step-icon purple">
                  📤
                </div>

              </div>

              <h3 className="step-title">
                Sube tu diseño
              </h3>

              <p className="step-description">
                Envíanos tu idea o diseño en cualquier formato.
                Nuestro equipo te asesorará.
              </p>

            </div>

            {/* Step 2 */}
            <div className="how-card">

              <div className="step-number blue">
                <span>02</span>
              </div>

              <div className="step-icon-wrapper">

                <div className="step-icon blue">
                  🎨
                </div>

              </div>

              <h3 className="step-title">
                Elige tu técnica
              </h3>

              <p className="step-description">
                Selecciona el método de estampado ideal según
                tus necesidades y presupuesto.
              </p>

            </div>

            {/* Step 3 */}
            <div className="how-card">

              <div className="step-number pink">
                <span>03</span>
              </div>

              <div className="step-icon-wrapper">

                <div className="step-icon pink">
                  ⚡
                </div>

              </div>

              <h3 className="step-title">
                Producción
              </h3>

              <p className="step-description">
                Nuestro equipo experto se encarga de dar vida
                a tu diseño con la máxima calidad.
              </p>

            </div>

            {/* Step 4 */}
            <div className="how-card">

              <div className="step-number yellow">
                <span>04</span>
              </div>

              <div className="step-icon-wrapper">

                <div className="step-icon yellow">
                  📦
                </div>

              </div>

              <h3 className="step-title">
                Recibe tu pedido
              </h3>

              <p className="step-description">
                Entrega rápida y segura.
                Tu creatividad lista para usar o vender.
              </p>

            </div>

          </div>

        </div>

      </div>

    </section>








      {/* Sheet lateral móvil (estilos en CSS, comportamiento JS opcional) */}
      <aside className="sheet-container" aria-hidden="true">
        <nav className="mobile-nav">
          <a className="mobile-nav-link" href="#inicio">Inicio</a>
          <a className="mobile-nav-link" href="#como-funciona">¿Cómo funciona?</a>
          <a className="mobile-nav-link" href="#servicios">Servicios</a>
          <a className="mobile-nav-link" href="#comparativo">Comparativo</a>
          <a className="mobile-nav-link" href="#productos">Productos</a>
          <a className="mobile-nav-link" href="#contacto">Contacto</a>
        </nav>

        <div className="mobile-user-section">
          <Link className="mobile-login-btn" to="/login">Iniciar Sesión</Link>
        </div>
      </aside>
    </div>
  );
};

export default LandingPage;