import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div>
      <header className="landing-header">
        <div className="landing-logo">PIXEL</div>

        <nav className="landing-nav">
          <a href="#inicio">Inicio</a>
          <a href="#como-funciona">¿Cómo funciona?</a>
          <a href="#servicios">Servicios</a>
          <a href="#comparativo">Comparativo</a>
          <a href="#productos">Productos</a>
          <a href="#contacto">Contacto</a>
        </nav>

        <div className="landing-actions">
          <Link className="btn-login" to="/login">
            Iniciar Sesión
          </Link>
        </div>
      </header>

      <section className="hero">
        <h2>Sistema empresarial Pixel</h2>
        <p>Plataforma de gestión empresarial</p>
      </section>
    </div>
  );
};

export default LandingPage;