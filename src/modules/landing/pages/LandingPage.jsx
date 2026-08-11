import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './LandingPage.css';
import { scrollToCurrentHash } from '../../../core/utils/landingNavigation';
import PublicNavbar from '../components/PublicNavbar';
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  YoutubeIcon,
} from '../components/BrandIcons';
import {
  Upload,
  Palette,
  Zap,
  Package,
  Sparkles,
  Droplets,
  Printer,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [contactForm, setContactForm] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    mensaje: '',
  });

  useEffect(() => {
    if (!location.hash) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      scrollToCurrentHash(location.hash);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [location.hash]);

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const updateContactForm = (field, value) => {
    setContactForm((current) => ({ ...current, [field]: value }));
  };

  const handleContactSubmit = (event) => {
    event.preventDefault();
    const subject = encodeURIComponent(`Consulta general de ${contactForm.nombre.trim()}`);
    const body = encodeURIComponent([
      `Nombre: ${contactForm.nombre.trim()}`,
      `Correo: ${contactForm.correo.trim()}`,
      `Telefono: ${contactForm.telefono.trim()}`,
      '',
      contactForm.mensaje.trim(),
    ].join('\n'));
    window.location.assign(`mailto:contacto@pixel.com?subject=${subject}&body=${body}`);
  };

  return (
    <div>
      <PublicNavbar />

      {/* Hero / contenido principal */}
      <section id="inicio" className="hero-section">

      {/* Background */}
      <div className="hero-background">

        <div className="hero-image"></div>

        <div className="hero-overlay"></div>

      </div>

      {/* Content */}
      <div
        className="hero-container"
      >
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

            <button
              type="button"
              className="hero-btn-primary"
              onClick={() => scrollToSection('servicios')}
            >
              Explorar Servicios
            </button>

            <button
              type="button"
              className="hero-btn-secondary"
              onClick={() => navigate('/cotizar')}
            >
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

{/* ===== ¿Cómo funciona? ===== */}

    <section 
      id="como-funciona"
      className="how-section"
    >

      <div
        className="how-container"
      >

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
            <div
              className="how-card"
            >
            

              <div className="step-number purple">
                <span>01</span>
              </div>

              <div className="step-icon-wrapper">

                <div className="step-icon purple">
                  <Upload className="step-svg-icon" />
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
            <div
              className="how-card"
            >

              <div className="step-number blue">
                <span>02</span>
              </div>

              <div className="step-icon-wrapper">

                <div className="step-icon blue">
                  <Palette className="step-svg-icon" />
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
            <div
              className="how-card"
            >

              <div className="step-number pink">
                <span>03</span>
              </div>

              <div className="step-icon-wrapper">

                <div className="step-icon pink">
                  <Zap className="step-svg-icon" />
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
            <div
              className="how-card"
            >

              <div className="step-number yellow">
                <span>04</span>
              </div>

              <div className="step-icon-wrapper">

                <div className="step-icon yellow">
                  <Package className="step-svg-icon" />
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


    {/* ===== SERVICES SECTION ===== */}

<section
      id="servicios"
      className="services-section"
    >

      <div
        className="services-container"
      >

    {/* Header */}
    <div className="services-header">

      <h2 className="services-title">
        Nuestros Servicios
      </h2>

      <p className="services-subtitle">
        Descubre la técnica de estampado perfecta para tu proyecto
      </p>

    </div>

    {/* Grid */}
    <div className="services-grid">

      {/* CARD 1 */}
      <div
        className="service-card"
      >

        <div className="service-image-wrapper">

          <img
            src="https://images.unsplash.com/photo-1676113421481-4eea8fe93948?auto=format&crop=entropy&cs=tinysrgb&fit=max&q=80&w=720"
            srcSet="https://images.unsplash.com/photo-1676113421481-4eea8fe93948?auto=format&crop=entropy&cs=tinysrgb&fit=max&q=80&w=480 480w, https://images.unsplash.com/photo-1676113421481-4eea8fe93948?auto=format&crop=entropy&cs=tinysrgb&fit=max&q=80&w=720 720w, https://images.unsplash.com/photo-1676113421481-4eea8fe93948?auto=format&crop=entropy&cs=tinysrgb&fit=max&q=80&w=1080 1080w"
            sizes="(max-width: 768px) calc(100vw - 32px), (max-width: 1200px) 50vw, 536px"
            alt="Serigrafía"
            className="service-image"
            loading="lazy"
            decoding="async"
          />

          <div className="service-overlay purple-gradient"></div>

          <div className="service-icon">
            <Palette className="service-svg-icon" />
          </div>

        </div>

        <div className="service-content">

          <h3 className="service-card-title">
            Serigrafía
          </h3>

          <p className="service-description">
            Técnica tradicional perfecta para grandes tirajes
            con colores sólidos y duraderos.
          </p>

          <ul className="service-features">

            <li>
              <span className="feature-dot purple-gradient"></span>
              Alta durabilidad
            </li>

            <li>
              <span className="feature-dot purple-gradient"></span>
              Ideal para grandes cantidades
            </li>

            <li>
              <span className="feature-dot purple-gradient"></span>
              Colores vibrantes
            </li>

            <li>
              <span className="feature-dot purple-gradient"></span>
              Económico en volumen
            </li>

          </ul>

        </div>

      </div>

      {/* CARD 2 */}
      <div
        className="service-card"
      >

        <div className="service-image-wrapper">

          <img
            src="https://images.unsplash.com/photo-1693031630177-b897fb9d7154?auto=format&crop=entropy&cs=tinysrgb&fit=max&q=80&w=720"
            srcSet="https://images.unsplash.com/photo-1693031630177-b897fb9d7154?auto=format&crop=entropy&cs=tinysrgb&fit=max&q=80&w=480 480w, https://images.unsplash.com/photo-1693031630177-b897fb9d7154?auto=format&crop=entropy&cs=tinysrgb&fit=max&q=80&w=720 720w, https://images.unsplash.com/photo-1693031630177-b897fb9d7154?auto=format&crop=entropy&cs=tinysrgb&fit=max&q=80&w=1080 1080w"
            sizes="(max-width: 768px) calc(100vw - 32px), (max-width: 1200px) 50vw, 536px"
            alt="DTF"
            className="service-image"
            loading="lazy"
            decoding="async"
          />

          <div className="service-overlay blue-gradient"></div>

          <div className="service-icon">
            <Sparkles className="service-svg-icon" />
          </div>

        </div>

        <div className="service-content">

          <h3 className="service-card-title">
            DTF (Direct to Film)
          </h3>

          <p className="service-description">
            Tecnología moderna que permite estampados
            de alta calidad con detalles increíbles.
          </p>

          <ul className="service-features">

            <li>
              <span className="feature-dot blue-gradient"></span>
              Detalles ultra precisos
            </li>

            <li>
              <span className="feature-dot blue-gradient"></span>
              Colores ilimitados
            </li>

            <li>
              <span className="feature-dot blue-gradient"></span>
              Flexible en tejidos
            </li>

            <li>
              <span className="feature-dot blue-gradient"></span>
              Sin pedido mínimo
            </li>

          </ul>

        </div>

      </div>

      {/* CARD 3 */}
      <div
        className="service-card"
      >

        <div className="service-image-wrapper">

          <img
            src="https://images.unsplash.com/photo-1744298975124-58594b6d742b?auto=format&crop=entropy&cs=tinysrgb&fit=max&q=80&w=720"
            srcSet="https://images.unsplash.com/photo-1744298975124-58594b6d742b?auto=format&crop=entropy&cs=tinysrgb&fit=max&q=80&w=480 480w, https://images.unsplash.com/photo-1744298975124-58594b6d742b?auto=format&crop=entropy&cs=tinysrgb&fit=max&q=80&w=720 720w, https://images.unsplash.com/photo-1744298975124-58594b6d742b?auto=format&crop=entropy&cs=tinysrgb&fit=max&q=80&w=1080 1080w"
            sizes="(max-width: 768px) calc(100vw - 32px), (max-width: 1200px) 50vw, 536px"
            alt="Sublimación"
            className="service-image"
            loading="lazy"
            decoding="async"
          />

          <div className="service-overlay pink-gradient"></div>

          <div className="service-icon">
            <Droplets className="service-svg-icon" />
          </div>
        </div>

        <div className="service-content">

          <h3 className="service-card-title">
            Sublimación
          </h3>

          <p className="service-description">
            Estampado a todo color con acabado suave,
            ideal para diseños fotográficos.
          </p>

          <ul className="service-features">

            <li>
              <span className="feature-dot pink-gradient"></span>
              Colores brillantes
            </li>

            <li>
              <span className="feature-dot pink-gradient"></span>
              No se siente al tacto
            </li>

            <li>
              <span className="feature-dot pink-gradient"></span>
              Ideal para poliéster
            </li>

            <li>
              <span className="feature-dot pink-gradient"></span>
              Durabilidad extrema
            </li>

          </ul>

        </div>

      </div>

      {/* CARD 4 */}
      <div
        className="service-card"
      >

        <div className="service-image-wrapper">

          <img
            src="https://images.unsplash.com/photo-1724490056260-44bf1de2617e?auto=format&crop=entropy&cs=tinysrgb&fit=max&q=80&w=720"
            srcSet="https://images.unsplash.com/photo-1724490056260-44bf1de2617e?auto=format&crop=entropy&cs=tinysrgb&fit=max&q=80&w=480 480w, https://images.unsplash.com/photo-1724490056260-44bf1de2617e?auto=format&crop=entropy&cs=tinysrgb&fit=max&q=80&w=720 720w, https://images.unsplash.com/photo-1724490056260-44bf1de2617e?auto=format&crop=entropy&cs=tinysrgb&fit=max&q=80&w=1080 1080w"
            sizes="(max-width: 768px) calc(100vw - 32px), (max-width: 1200px) 50vw, 536px"
            alt="Estampado Digital"
            className="service-image"
            loading="lazy"
            decoding="async"
          />

          <div className="service-overlay yellow-gradient"></div>

          <div className="service-icon">
            <Printer className="service-svg-icon" />
          </div>

        </div>

        <div className="service-content">

          <h3 className="service-card-title">
            Estampado Digital
          </h3>

          <p className="service-description">
            Impresión directa en tela para diseños complejos
            y producciones personalizadas.
          </p>

          <ul className="service-features">

            <li>
              <span className="feature-dot yellow-gradient"></span>
              Diseños personalizados
            </li>

            <li>
              <span className="feature-dot yellow-gradient"></span>
              Producciones pequeñas
            </li>

            <li>
              <span className="feature-dot yellow-gradient"></span>
              Alta resolución
            </li>

            <li>
              <span className="feature-dot yellow-gradient"></span>
              Rápida producción
            </li>

          </ul>

        </div>

      </div>

    </div>

  </div>

</section>





{/* ===== COMPARATIVO SECTION ===== */}

<section
      id="comparativo"
      className="comparative-section"
    >

      <div
        className="comparative-container"
      >

    {/* HEADER */}
    <div className="comparative-header">

      <h2 className="comparative-title">
        Comparativa de Técnicas
      </h2>

      <p className="comparative-subtitle">
        Elige la técnica perfecta para tu proyecto
        conociendo sus ventajas
      </p>

    </div>

    {/* GRID */}
    <div className="comparative-grid">

      {/* CARD 1 */}
      <div
        className="comparative-card"
      >
      

        <div className="comparative-top-line purple-gradient"></div>

        <div className="comparative-card-header">

          <h3 className="comparative-card-title">

            <span className="comparative-dot purple-bg"></span>

            Serigrafía

          </h3>

        </div>

        <div className="comparative-card-content">

          {/* PROS */}
          <div className="comparative-list-block">

            <h4 className="comparative-pros-title">
              Ventajas
            </h4>

            <ul className="comparative-list">

              <li>
                <span className="comparative-check">✔</span>
                Excelente para grandes cantidades
              </li>

              <li>
                <span className="comparative-check">✔</span>
                Muy económico en volumen
              </li>

              <li>
                <span className="comparative-check">✔</span>
                Colores sólidos y vibrantes
              </li>

              <li>
                <span className="comparative-check">✔</span>
                Alta durabilidad
              </li>

              <li>
                <span className="comparative-check">✔</span>
                Acabado profesional
              </li>

            </ul>

          </div>

          {/* CONS */}
          <div className="comparative-list-block">

            <h4 className="comparative-cons-title">
              Consideraciones
            </h4>

            <ul className="comparative-list">

              <li>
                <span className="comparative-x">✖</span>
                Costo alto en pocas unidades
              </li>

              <li>
                <span className="comparative-x">✖</span>
                No ideal para diseños complejos
              </li>

              <li>
                <span className="comparative-x">✖</span>
                Tiempo de preparación mayor
              </li>

            </ul>

          </div>

        </div>

      </div>

      {/* CARD 2 */}
      <div
        className="comparative-card"
      >

        <div className="comparative-top-line blue-gradient"></div>

        <div className="comparative-card-header">

          <h3 className="comparative-card-title">

            <span className="comparative-dot blue-bg"></span>

            DTF

          </h3>

        </div>

        <div className="comparative-card-content">

          <div className="comparative-list-block">

            <h4 className="comparative-pros-title">
              Ventajas
            </h4>

            <ul className="comparative-list">

              <li><span className="comparative-check">✔</span>Detalles ultra precisos</li>

              <li><span className="comparative-check">✔</span>Sin mínimo de pedido</li>

              <li><span className="comparative-check">✔</span>Colores ilimitados</li>

              <li><span className="comparative-check">✔</span>Ideal para diseños complejos</li>

              <li><span className="comparative-check">✔</span>Versátil en tejidos</li>

            </ul>

          </div>

          <div className="comparative-list-block">

            <h4 className="comparative-cons-title">
              Consideraciones
            </h4>

            <ul className="comparative-list">

              <li><span className="comparative-x">✖</span>Costo medio-alto por unidad</li>

              <li><span className="comparative-x">✖</span>Requiere equipo especializado</li>

            </ul>

          </div>

        </div>

      </div>

      {/* CARD 3 */}
      <div
        className="comparative-card"
      >

        <div className="comparative-top-line pink-gradient"></div>

        <div className="comparative-card-header">

          <h3 className="comparative-card-title">

            <span className="comparative-dot pink-bg"></span>

            Sublimación

          </h3>

        </div>

        <div className="comparative-card-content">

          <div className="comparative-list-block">

            <h4 className="comparative-pros-title">
              Ventajas
            </h4>

            <ul className="comparative-list">

              <li><span className="comparative-check">✔</span>Colores brillantes infinitos</li>

              <li><span className="comparative-check">✔</span>No se siente al tacto</li>

              <li><span className="comparative-check">✔</span>Ideal para fotos y degradados</li>

              <li><span className="comparative-check">✔</span>Durabilidad excepcional</li>

              <li><span className="comparative-check">✔</span>No se agrieta ni descascara</li>

            </ul>

          </div>

          <div className="comparative-list-block">

            <h4 className="comparative-cons-title">
              Consideraciones
            </h4>

            <ul className="comparative-list">

              <li><span className="comparative-x">✖</span>Solo funciona en poliéster</li>

              <li><span className="comparative-x">✖</span>Limitado a telas claras</li>

              <li><span className="comparative-x">✖</span>Inversión inicial alta</li>

            </ul>

          </div>

        </div>

      </div>

      {/* CARD 4 */}
      <div
        className="comparative-card"
      >

        <div className="comparative-top-line yellow-gradient"></div>

        <div className="comparative-card-header">

          <h3 className="comparative-card-title">

            <span className="comparative-dot yellow-bg"></span>

            Digital

          </h3>

        </div>

        <div className="comparative-card-content">

          <div className="comparative-list-block">

            <h4 className="comparative-pros-title">
              Ventajas
            </h4>

            <ul className="comparative-list">

              <li><span className="comparative-check">✔</span>Personalización total</li>

              <li><span className="comparative-check">✔</span>Ideal para prototipos</li>

              <li><span className="comparative-check">✔</span>Sin costos de configuración</li>

              <li><span className="comparative-check">✔</span>Producción rápida</li>

              <li><span className="comparative-check">✔</span>Alta calidad fotográfica</li>

            </ul>

          </div>

          <div className="comparative-list-block">

            <h4 className="comparative-cons-title">
              Consideraciones
            </h4>

            <ul className="comparative-list">

              <li><span className="comparative-x">✖</span>Costo por unidad más alto</li>

              <li><span className="comparative-x">✖</span>Menos duradero</li>

              <li><span className="comparative-x">✖</span>Limitado en algunos tejidos</li>

            </ul>

          </div>

        </div>

      </div>

    </div>

  </div>

</section>


{/* ===== PRODUCTOS SECTION ===== */}

<section
      id="productos"
      className="products-section"
    >

      <div
        className="products-container"
      >

    {/* HEADER */}
    <div className="products-header">

      <h2 className="products-title">
        Productos
      </h2>

      <p className="products-subtitle">
        Servicios profesionales de estampado y personalización
        para todas tus necesidades
      </p>

    </div>

    {/* GRID */}
    <div className="products-grid">

      {/* CARD 1 */}
      <div
        className="product-card"
      >
      

        {/* IMAGE */}
        <div className="product-image-wrapper">

          <img
            src="https://imgs.search.brave.com/ArJcuNDlACoUa979GxUQhIB-pxtgWjIu55TiGGvyOW0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbmti/b3JkYWRvc3llc3Rh/bXBhZG9zLmNvbS9j/ZG4vc2hvcC9wcm9k/dWN0cy9XaGF0c0Fw/cEltYWdlMjAyMy0w/MS0yNmF0MTIuMjUu/MDlfMS5qcGc_dj0x/NzQzNDQyMzAxJndp/ZHRoPTE0NDU"
            alt="DTF"
            className="product-image"
            loading="lazy"
            decoding="async"
          />

          <span className="product-badge purple-bg">
            Textil
          </span>

        </div>

        {/* CONTENT */}
        <div className="product-content">

          <h3 className="product-card-title">
            Estampación Textil DTF
          </h3>

          <p className="product-description">
            Impresión de alta calidad con tecnología DTF
            para diseños vibrantes y duraderos.
          </p>

          <Link to="/cotizar" className="product-btn">
            Solicitar cotización
          </Link>

        </div>

      </div>

      {/* CARD 2 */}
      <div
        className="product-card"
      >

        <div className="product-image-wrapper">

          <img
            src="https://imgs.search.brave.com/U3jTxYoBiYLzXfwSphNXOE8gwu8YssrI_BIN_HhRc4A/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/aW1wcmVudGFvbmxp/bmUubmV0L2Jsb2cv/d3AtY29udGVudC91/cGxvYWRzL3Nlcmln/cmFmaWEtMS0xLnBu/Zw"
            alt="Serigrafía"
            className="product-image"
            loading="lazy"
            decoding="async"
          />

          <span className="product-badge purple-bg">
            Textil
          </span>

        </div>

        <div className="product-content">

          <h3 className="product-card-title">
            Serigrafía Textil
          </h3>

          <p className="product-description">
            Técnica clásica de estampado para grandes tirajes
            con acabados profesionales y colores sólidos.
          </p>

          <Link to="/cotizar" className="product-btn">
            Solicitar cotización
          </Link>

        </div>

      </div>

      {/* CARD 3 */}
      <div
        className="product-card"
      >

        <div className="product-image-wrapper">

          <img
            src="https://imgs.search.brave.com/Wi9oQCFuGS-A4uJDkOAETUIR9HNBoc6pzUS30wtxut4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZS5yb2xhbmRkZ2Eu/Y29tLy0vbWVkaWEv/cm9sYW5kLWRnL2lt/YWdlcy9hcHBsaWNh/dGlvbnMvdXYtZHRm/L2Jhbm5lci91di1k/dGYtYmFubmVyLW1v/YmlsZS5qcGc_cmV2/PWU4OGMzZmY5MDM3/YzQ4N2Q4YzViZjNl/MDUyMDkwZTU2Jmxh/PWVzLTQxOSZoPTUz/MyZ3PTgwMCZoYXNo/PTM3Q0YyRTBBOTI1/NUVBRDg3RTI0MTQx/MTVGRUM3QTk5"
            alt="DTF UV"
            className="product-image"
            loading="lazy"
            decoding="async"
          />

          <span className="product-badge blue-bg">
            Superficies
          </span>

        </div>

        <div className="product-content">

          <h3 className="product-card-title">
            DTF UV para Superficies
          </h3>

          <p className="product-description">
            Impresión UV sobre superficies rígidas como
            madera, plástico, vidrio y más.
          </p>

          <Link to="/cotizar" className="product-btn">
            Solicitar cotización
          </Link>

        </div>

      </div>

      {/* CARD 4 */}
      <div
        className="product-card"
      >

        <div className="product-image-wrapper">

          <img
            src="https://imgs.search.brave.com/2GuZ1BT7LDyzhEs5foLm3m5FjjkS4-RVSSJlnAZdOf8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/Zm90b3MtcHJlbWl1/bS9tdWplci1lc3R1/ZGlhbnRlLWJyYXpv/LW1vZGVsby1yb2Jv/dF8xMDE2Njc1LTE3/OTAuanBnP3NlbXQ9/YWlzX2h5YnJpZCZ3/PTc0MCZxPTgw"
            alt="Sublimación"
            className="product-image"
            loading="lazy"
            decoding="async"
          />

          <span className="product-badge pink-bg">
            Sublimación
          </span>

        </div>

        <div className="product-content">

          <h3 className="product-card-title">
            Sublimación y Artículos
          </h3>

          <p className="product-description">
            Sublimación textil y elaboración de artículos
            personalizados como mugs, termos y más.
          </p>

          <Link to="/cotizar" className="product-btn">
            Solicitar cotización
          </Link>

        </div>

      </div>

    </div>

    {/* BUTTON */}
    <div className="products-action">

      <Link to="/cotizar" className="products-main-btn">
        Solicitar cotización
      </Link>

    </div>

  </div>

</section>

<section id="contacto" className="contact-section">

  {/* Background Shapes */}
  <div className="contact-bg-shape contact-shape-1"></div>
  <div className="contact-bg-shape contact-shape-2"></div>


  <div
    className="contact-container"
  >

    <div className="contact-grid">

      {/* Left Content */}
      <div className="contact-info">

        <h2 className="contact-title">
          Contáctanos
        </h2>

        <p className="contact-description">
          Estamos aquí para ayudarte con tu proyecto de estampado.
          Conversemos sobre tus ideas y necesidades.
        </p>

        <div className="contact-items">

          {/* Email */}
          <div className="contact-item">

            <div className="contact-icon">
              <Mail className="contact-svg-icon" />
            </div>

            <div>
              <p className="contact-label">
                Email
              </p>

              <p className="contact-text">
                contacto@pixel.com
              </p>
            </div>

          </div>

          {/* Phone */}
          <div className="contact-item">

            <div className="contact-icon">
              <Phone className="contact-svg-icon" />
            </div>

            <div>
              <p className="contact-label">
                Teléfono
              </p>

              <p className="contact-text">
                +57 313 701 9456
              </p>
            </div>

          </div>

          {/* Location */}
          <div className="contact-item">

            <div className="contact-icon">
            <MapPin className="contact-svg-icon" />
          </div>

            <div>
              <p className="contact-label">
                Ubicación
              </p>

              <p className="contact-text">
                Medellín, Colombia
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* General contact */}
      <div className="contact-form-card">

        <h3 className="contact-form-title">
          Escríbenos
        </h3>

        <p className="contact-form-copy">
          Este espacio es para preguntas generales. Si ya tienes claro lo que
          necesitas, usa el cotizador para configurar productos, estampados y diseños.
        </p>

        <form className="contact-form" onSubmit={handleContactSubmit}>
          <div className="quote-contact-grid">
            <label className="contact-field quote-name-field">
              <span className="contact-field-label">Nombre completo</span>
              <input
                className="contact-input"
                type="text"
                value={contactForm.nombre}
                onChange={(event) => updateContactForm('nombre', event.target.value)}
                placeholder="Tu nombre completo"
                required
              />
            </label>
            <label className="contact-field">
              <span className="contact-field-label">Correo</span>
              <input
                className="contact-input"
                type="email"
                value={contactForm.correo}
                onChange={(event) => updateContactForm('correo', event.target.value)}
                placeholder="tu@email.com"
                required
              />
            </label>
            <label className="contact-field">
              <span className="contact-field-label">Teléfono</span>
              <input
                className="contact-input"
                type="tel"
                inputMode="numeric"
                value={contactForm.telefono}
                onChange={(event) => updateContactForm('telefono', event.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="3000000000"
                minLength={10}
                maxLength={10}
                required
              />
            </label>
          </div>
          <label className="contact-field">
            <span className="contact-field-label">Mensaje</span>
            <textarea
              className="contact-textarea"
              value={contactForm.mensaje}
              onChange={(event) => updateContactForm('mensaje', event.target.value)}
              placeholder="Cuéntanos cómo podemos ayudarte"
              maxLength={1000}
              required
            />
          </label>
          <button type="submit" className="contact-submit-btn">
            Enviar mensaje
          </button>
        </form>

        <div className="contact-direct-actions contact-secondary-actions">
          <a
            className="contact-email-link"
            href="mailto:contacto@pixel.com?subject=Consulta%20general%20PIXEL"
          >
            <Mail size={18} aria-hidden="true" />
            Enviar consulta por correo directamente
          </a>
          <Link className="contact-quote-link" to="/cotizar">
            Crear solicitud de cotización
          </Link>
        </div>

      </div>

    </div>

  </div>

</section>




<footer className="footer">

  <div
    className="footer-container"
  >

    {/* Top */}
    <div className="footer-grid">

      {/* Brand */}
      <div className="footer-brand">

        <h3 className="footer-logo">
          PIXEL
        </h3>

        <p className="footer-description">
          Transformando ideas en prendas únicas desde 2020
        </p>

        {/* Social */}
        <div className="footer-socials">

          <a href="#" className="footer-social-link" aria-label="Instagram">
            <InstagramIcon className="footer-social-icon" />
          </a>

          <a href="#" className="footer-social-link" aria-label="Facebook">
            <FacebookIcon className="footer-social-icon" />
          </a>

          <a href="#" className="footer-social-link" aria-label="Twitter">
            <TwitterIcon className="footer-social-icon" />
          </a>

          <a href="#" className="footer-social-link" aria-label="YouTube">
            <YoutubeIcon className="footer-social-icon" />
          </a>

        </div>

      </div>

      {/* Servicios */}
      <div className="footer-column">

        <h4 className="footer-servicios-tittle">
          Servicios
        </h4>

        <ul className="footer-links">

          <li>
            <a href="#">Serigrafía</a>
          </li>

          <li>
            <a href="#">DTF</a>
          </li>

          <li>
            <a href="#">Sublimación</a>
          </li>

          <li>
            <a href="#">Digital</a>
          </li>

        </ul>

      </div>

      {/* Productos */}
      <div className="footer-column">

        <h4 className="footer-productos-tittle">
          Productos
        </h4>

        <ul className="footer-links">

          <li>
            <a href="#">Camisetas</a>
          </li>

          <li>
            <a href="#">Sudaderas</a>
          </li>

          <li>
            <a href="#">Gorras</a>
          </li>

          <li>
            <a href="#">Accesorios</a>
          </li>

        </ul>

      </div>

      {/* Empresa */}
      <div className="footer-column">

        <h4 className="footer-empresa-tittle">
          Empresa
        </h4>

        <ul className="footer-links">

          <li>
            <a href="#">Sobre Nosotros</a>
          </li>

          <li>
            <a href="#">Blog</a>
          </li>

          <li>
            <a href="#">Testimonios</a>
          </li>

          <li>
            <a href="#">Contacto</a>
          </li>

        </ul>

      </div>

      {/* Legal */}
      <div className="footer-column">

        <h4 className="footer-legal-tittle">
          Legal
        </h4>

        <ul className="footer-links">

          <li>
            <a href="#">Términos</a>
          </li>

          <li>
            <a href="#">Privacidad</a>
          </li>

          <li>
            <a href="#">Envíos</a>
          </li>

          <li>
            <a href="#">Devoluciones</a>
          </li>

        </ul>

      </div>

    </div>

    {/* Bottom */}
    <div className="footer-bottom">

      <p>
        © 2026 Pixel. Todos los derechos reservados.
      </p>

    </div>

  </div>
</footer>
    </div>
  );
};

export default LandingPage;
