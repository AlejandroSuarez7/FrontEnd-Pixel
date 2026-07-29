import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './LandingPage.css';
import { motion } from 'motion/react';
import { useAuth } from '../../../store/AuthContext';
import { isClientUser } from '../../../core/utils/permissions';
import { useAsyncLock } from '../../../core/hooks/useAsyncLock';
import {
  formatMoneyCOP,
  formatPercentage,
  getQuoteDiscountTotal,
  getQuoteSubtotalBruto,
  getQuoteSubtotalWithDiscount,
} from '../../../core/utils/formatters';
import { notifications } from '../../../core/utils/notifications';
import { scrollToCurrentHash } from '../../../core/utils/landingNavigation';
import { publicQuoteRepository } from '../infrastructure/publicQuote.repository';
import { useConfirm } from '../../../shared/components/ConfirmDialog/ConfirmProvider';
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
import {
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";

const createPublicQuoteItem = () => ({
  idCategoriaProducto: '',
  idProducto: '',
  idTecnica: '',
  cantidad: 1,
  detalleProducto: '',
  requiereDiseno: true,
  origenDiseno: 'PIXEL',
  esDisenoGeneral: false,
  archivoDisenoInicialUrl: '',
});

const LandingPage = () => {
  const { user, permissions, logout } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [publicProducts, setPublicProducts] = useState([]);
  const [publicCategories, setPublicCategories] = useState([]);
  const [publicTechniques, setPublicTechniques] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [calculatingQuote, setCalculatingQuote] = useState(false);
  const [sendingQuote, setSendingQuote] = useState(false);
  const [publicQuoteForm, setPublicQuoteForm] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    items: [createPublicQuoteItem()],
    observaciones: '',
  });
  const [publicQuoteCalculation, setPublicQuoteCalculation] = useState(null);
  const [activePublicQuoteIndex, setActivePublicQuoteIndex] = useState(0);
  const [quoteLoginRequired, setQuoteLoginRequired] = useState(false);
  const { isLocked: isQuoteSubmitting, runLocked: runQuoteLocked } = useAsyncLock();
  const isLoggedIn = Boolean(user);
  const isClient = isClientUser(user, permissions);
  const isLoggedNonClient = isLoggedIn && !isClient;
  const contactFieldsDisabled = isClient || isLoggedNonClient;
  const userName = user?.nombre || 'Usuario';
  const avatarLetter = userName.charAt(0).toUpperCase();
  const publicQuoteItems = publicQuoteForm.items;
  const calculationItems = publicQuoteCalculation?.items || publicQuoteCalculation?.detalles || [];
  const publicQuoteSubtotalBruto = publicQuoteCalculation?.subtotalBruto ?? getQuoteSubtotalBruto(publicQuoteCalculation || {});
  const publicQuoteDiscountTotal = publicQuoteCalculation?.descuentoTotal ?? getQuoteDiscountTotal(publicQuoteCalculation || {});
  const publicQuoteSubtotalWithDiscount = publicQuoteCalculation?.subtotalConDescuento
    ?? publicQuoteCalculation?.subtotalFinal
    ?? getQuoteSubtotalWithDiscount(publicQuoteCalculation || {});

  useEffect(() => {
    if (!location.hash) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      scrollToCurrentHash(location.hash);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [location.hash]);

  useEffect(() => {
    if (!isClient || !user) return;
    setPublicQuoteForm(prev => ({
      ...prev,
      nombre: user.nombre || prev.nombre,
      correo: user.correo || prev.correo,
      telefono: user.telefono || prev.telefono,
    }));
    setQuoteLoginRequired(false);
  }, [isClient, user]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      Promise.all([
        publicQuoteRepository.listCategories({ signal: controller.signal }),
        publicQuoteRepository.listTechniques({ signal: controller.signal }),
        publicQuoteRepository.listProductsByCategory(undefined, { signal: controller.signal }),
      ])
      .then(([categories, techniques, products]) => {
        if (controller.signal.aborted) return;
        setPublicCategories(categories);
        setPublicTechniques(techniques);
        setPublicProducts(products);
        setProductsError('');
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.code === 'ERR_CANCELED') return;
        const message = error.message || 'No se pudieron cargar los productos.';
        setProductsError(message);
        notifications.error(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingProducts(false);
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const validItems = publicQuoteItems
      .filter(item => item.idProducto && Number(item.cantidad) > 0)
      .map(item => ({
        idProducto: Number(item.idProducto),
        ...(item.idTecnica && { idTecnica: Number(item.idTecnica) }),
        cantidad: Number(item.cantidad),
        observaciones: item.detalleProducto?.trim() || null,
      }));

    if (validItems.length === 0) {
      setPublicQuoteCalculation(null);
      setCalculatingQuote(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setCalculatingQuote(true);
      publicQuoteRepository.calculate(validItems, { signal: controller.signal })
        .then((calculation) => {
          if (!controller.signal.aborted) {
            setPublicQuoteCalculation(calculation);
          }
        })
        .catch((error) => {
          if (controller.signal.aborted || error?.code === 'ERR_CANCELED') return;
          setPublicQuoteCalculation(null);
          notifications.error(error.message || 'No se pudo calcular la cotizacion.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setCalculatingQuote(false);
        });
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [publicQuoteItems]);

  const updatePublicQuoteField = (field, value) => {
    if (field === 'correo') setQuoteLoginRequired(false);
    setPublicQuoteForm(prev => ({ ...prev, [field]: value }));
  };

  const updatePublicQuoteItem = (index, field, value) => {
    setPublicQuoteForm(prev => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  };

  const addPublicQuoteItem = () => {
    setPublicQuoteForm(prev => ({
      ...prev,
      items: [...prev.items, createPublicQuoteItem()],
    }));
    setActivePublicQuoteIndex(publicQuoteItems.length);
  };

  const removePublicQuoteItem = (index) => {
    setPublicQuoteForm(prev => ({
      ...prev,
      items: prev.items.length > 1
        ? prev.items.filter((_, itemIndex) => itemIndex !== index)
        : prev.items,
    }));
    setActivePublicQuoteIndex(current => Math.max(0, Math.min(current >= index ? current - 1 : current, publicQuoteItems.length - 2)));
  };

  const resetPublicQuoteForm = () => {
    setPublicQuoteForm({
      nombre: isClient ? user?.nombre || '' : '',
      correo: isClient ? user?.correo || '' : '',
      telefono: isClient ? user?.telefono || '' : '',
      items: [createPublicQuoteItem()],
      observaciones: '',
    });
    setPublicQuoteCalculation(null);
    setActivePublicQuoteIndex(0);
  };

  const validatePublicQuote = () => {
    const telefonoLimpio = publicQuoteForm.telefono.trim();

    if (isLoggedNonClient) return 'Para cotizar como cliente, usa una cuenta de cliente o crea una cotizacion presencial desde el panel.';

    if (!isClient) {
      if (!publicQuoteForm.nombre.trim()) return 'El nombre completo es obligatorio.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(publicQuoteForm.correo.trim())) return 'Ingresa un email valido con @.';
      if (!/^\d{10}$/.test(telefonoLimpio)) return 'El telefono debe tener exactamente 10 digitos numericos.';
    }

    if (!publicQuoteItems.length) return 'Agrega al menos un producto para cotizar.';
    const invalidItemIndex = publicQuoteItems.findIndex(item => !item.idProducto || Number(item.cantidad) <= 0);
    if (invalidItemIndex >= 0) {
      setActivePublicQuoteIndex(invalidItemIndex);
      return `Completa el producto y la cantidad del item ${invalidItemIndex + 1}.`;
    }
    const missingTechniqueIndex = publicQuoteItems.findIndex(item => !item.idTecnica);
    if (missingTechniqueIndex >= 0) {
      setActivePublicQuoteIndex(missingTechniqueIndex);
      return `Selecciona la tecnica de estampacion del item ${missingTechniqueIndex + 1}.`;
    }
    return null;
  };

  const handlePublicQuoteSubmit = async (event) => {
    event.preventDefault();
    await runQuoteLocked(async () => {

    const validationError = validatePublicQuote();
    if (validationError) {
      notifications.warning(validationError);
      return;
    }

    setSendingQuote(true);
    try {
      const accepted = await confirm({
        title: 'Enviar solicitud',
        message: 'Tu solicitud sera enviada al equipo de PIXEL. Tambien enviaremos una copia a tu correo como constancia de cotizacion. Si no la encuentras, revisa SPAM o correo no deseado.',
        confirmText: 'Enviar solicitud',
        cancelText: 'Cancelar',
        variant: 'success',
      });

      if (!accepted) return;

      await publicQuoteRepository.create({
        cliente: {
          nombre: (isClient ? user?.nombre : publicQuoteForm.nombre)?.trim?.() || '',
          correo: ((isClient ? user?.correo : publicQuoteForm.correo) || '').trim().toLowerCase(),
          telefono: ((isClient ? user?.telefono : publicQuoteForm.telefono) || '').trim(),
        },
        items: publicQuoteItems.map(item => ({
          idProducto: Number(item.idProducto),
          idTecnica: Number(item.idTecnica),
          cantidad: Number(item.cantidad),
          observaciones: item.detalleProducto.trim() || null,
          requiereDiseno: item.requiereDiseno !== false,
          origenDiseno: item.origenDiseno === 'CLIENTE' ? 'CLIENTE' : 'PIXEL',
          esDisenoGeneral: Boolean(item.esDisenoGeneral),
          archivoDisenoInicialUrl: item.archivoDisenoInicialUrl.trim() || null,
        })),
        observaciones: publicQuoteForm.observaciones.trim() || null,
      });
      notifications.success('Solicitud enviada correctamente. Revisa tu correo para ver la constancia. Si no lo encuentras, revisa la carpeta de SPAM o correo no deseado.');
      resetPublicQuoteForm();
    } catch (error) {
      const errorCode = error.payload?.code || error.response?.data?.code;
      if (error.status === 409 && errorCode === 'EMAIL_REQUIRES_LOGIN') {
        setQuoteLoginRequired(true);
        notifications.warning('Este correo ya esta registrado. Inicia sesion para realizar una cotizacion con tu cuenta.', {
          duration: 8000,
          action: {
            label: 'Iniciar sesion',
            onClick: () => navigate('/login', { state: { redirectTo: '/#contacto' } }),
          },
        });
        return;
      }

      if (error.status === 401) {
        notifications.error('Tu sesion no es valida. Inicia sesion nuevamente.');
        logout();
        navigate('/login', { state: { redirectTo: '/#contacto' } });
        return;
      }

      notifications.error(error.message || 'No se pudo enviar la solicitud.');
    } finally {
      setSendingQuote(false);
    }
    });
  };

  const handleQuoteLoginRedirect = () => {
    navigate('/login', { state: { redirectTo: '/#contacto' } });
  };

  const handleGoDashboard = () => {
    setProfileOpen(false);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/');
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

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
              <a className="landing-nav-link" href="#contacto">Cotizar</a>
            </nav>

            {/* Acciones (Login + Botón móvil) */}
            <div className="actions">
              {!isLoggedIn ? (
              <Link to="/login" className="btn-login">
                <span className="btn-login-text">
                Iniciar Sesión
                </span>
              </Link>
              ) : (
                <>
              {/*

              <button className="hamburger-btn" aria-label="Abrir menú">
              */}
                <div className="landing-profile-wrapper">
                  <button
                    type="button"
                    className="landing-profile-button"
                    onClick={() => setProfileOpen(prev => !prev)}
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
                        Cerrar sesion
                      </button>
                    </div>
                  )}
                </div>
                </>
              )}

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
      <motion.div
        className="hero-container"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
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
              onClick={() => scrollToSection('contacto')}
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

      </motion.div>

    </section>

{/* ===== ¿Cómo funciona? ===== */}

    <section 
      id="como-funciona"
      className="how-section"
    >

      <motion.div
        className="how-container"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
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
            <motion.div
              className="how-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.20, ease: 'easeOut' }}
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

            </motion.div>

            {/* Step 2 */}
            <motion.div
              className="how-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.40, ease: 'easeOut' }}
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

            </motion.div>

            {/* Step 3 */}
            <motion.div
              className="how-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.60, ease: 'easeOut' }}
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

            </motion.div>

            {/* Step 4 */}
            <motion.div
              className="how-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.80, ease: 'easeOut' }}
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

            </motion.div>

          </div>

        </div>

      </motion.div>

    </section>


    {/* ===== SERVICES SECTION ===== */}

<section
      id="servicios"
      className="services-section"
    >

      <motion.div
        className="services-container"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
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
      <motion.div
        className="service-card"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.20, ease: 'easeOut' }}
      >

        <div className="service-image-wrapper">

          <img
            src="https://images.unsplash.com/photo-1676113421481-4eea8fe93948?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
            alt="Serigrafía"
            className="service-image"
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

      </motion.div>

      {/* CARD 2 */}
      <motion.div
        className="service-card"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.40, ease: 'easeOut' }}
      >

        <div className="service-image-wrapper">

          <img
            src="https://images.unsplash.com/photo-1693031630177-b897fb9d7154?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
            alt="DTF"
            className="service-image"
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

      </motion.div>

      {/* CARD 3 */}
      <motion.div
        className="service-card"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.60, ease: 'easeOut' }}
      >

        <div className="service-image-wrapper">

          <img
            src="https://images.unsplash.com/photo-1744298975124-58594b6d742b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
            alt="Sublimación"
            className="service-image"
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

      </motion.div>

      {/* CARD 4 */}
      <motion.div
        className="service-card"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.80, ease: 'easeOut' }}
      >

        <div className="service-image-wrapper">

          <img
            src="https://images.unsplash.com/photo-1724490056260-44bf1de2617e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
            alt="Estampado Digital"
            className="service-image"
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

      </motion.div>

    </div>

  </motion.div>

</section>





{/* ===== COMPARATIVO SECTION ===== */}

<section
      id="comparativo"
      className="comparative-section"
    >

      <motion.div
        className="comparative-container"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
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
      <motion.div
        className="comparative-card"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.20, ease: 'easeOut' }}
      >
      

        <div className="comparative-top-line purple-gradient"></div>

        <div className="comparative-card-header">

          <div className="comparative-card-title">

            <span className="comparative-dot purple-bg"></span>

            Serigrafía

          </div>

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

      </motion.div>

      {/* CARD 2 */}
      <motion.div
        className="comparative-card"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.40, ease: 'easeOut' }}
      >

        <div className="comparative-top-line blue-gradient"></div>

        <div className="comparative-card-header">

          <div className="comparative-card-title">

            <span className="comparative-dot blue-bg"></span>

            DTF

          </div>

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

      </motion.div>

      {/* CARD 3 */}
      <motion.div
        className="comparative-card"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.60, ease: 'easeOut' }}
      >

        <div className="comparative-top-line pink-gradient"></div>

        <div className="comparative-card-header">

          <div className="comparative-card-title">

            <span className="comparative-dot pink-bg"></span>

            Sublimación

          </div>

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

      </motion.div>

      {/* CARD 4 */}
      <motion.div
        className="comparative-card"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.80, ease: 'easeOut' }}
      >

        <div className="comparative-top-line yellow-gradient"></div>

        <div className="comparative-card-header">

          <div className="comparative-card-title">

            <span className="comparative-dot yellow-bg"></span>

            Digital

          </div>

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

      </motion.div>

    </div>

  </motion.div>

</section>


{/* ===== PRODUCTOS SECTION ===== */}

<section
      id="productos"
      className="products-section"
    >

      <motion.div
        className="products-container"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.20, ease: 'easeOut' }}
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
      <motion.div
        className="product-card"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.20, ease: 'easeOut' }}
      >
      

        {/* IMAGE */}
        <div className="product-image-wrapper">

          <img
            src="https://imgs.search.brave.com/ArJcuNDlACoUa979GxUQhIB-pxtgWjIu55TiGGvyOW0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbmti/b3JkYWRvc3llc3Rh/bXBhZG9zLmNvbS9j/ZG4vc2hvcC9wcm9k/dWN0cy9XaGF0c0Fw/cEltYWdlMjAyMy0w/MS0yNmF0MTIuMjUu/MDlfMS5qcGc_dj0x/NzQzNDQyMzAxJndp/ZHRoPTE0NDU"
            alt="DTF"
            className="product-image"
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

          <a href="https://www.instagram.com/pixel_arts.co" target="_blank" rel="noopener noreferrer" className="product-btn">
            <FaInstagram className="footer-social-icon" />
            Cotizar en Instagram
          </a>

        </div>

      </motion.div>

      {/* CARD 2 */}
      <motion.div
        className="product-card"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.40, ease: 'easeOut' }}
      >

        <div className="product-image-wrapper">

          <img
            src="https://imgs.search.brave.com/U3jTxYoBiYLzXfwSphNXOE8gwu8YssrI_BIN_HhRc4A/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/aW1wcmVudGFvbmxp/bmUubmV0L2Jsb2cv/d3AtY29udGVudC91/cGxvYWRzL3Nlcmln/cmFmaWEtMS0xLnBu/Zw"
            alt="Serigrafía"
            className="product-image"
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

          <a href="https://www.instagram.com/pixel_arts.co" target="_blank" rel="noopener noreferrer" className="product-btn">
            <FaInstagram className="footer-social-icon" />
            Cotizar en Instagram
          </a>

        </div>

      </motion.div>

      {/* CARD 3 */}
      <motion.div
        className="product-card"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.60, ease: 'easeOut' }}
      >

        <div className="product-image-wrapper">

          <img
            src="https://imgs.search.brave.com/Wi9oQCFuGS-A4uJDkOAETUIR9HNBoc6pzUS30wtxut4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZS5yb2xhbmRkZ2Eu/Y29tLy0vbWVkaWEv/cm9sYW5kLWRnL2lt/YWdlcy9hcHBsaWNh/dGlvbnMvdXYtZHRm/L2Jhbm5lci91di1k/dGYtYmFubmVyLW1v/YmlsZS5qcGc_cmV2/PWU4OGMzZmY5MDM3/YzQ4N2Q4YzViZjNl/MDUyMDkwZTU2Jmxh/PWVzLTQxOSZoPTUz/MyZ3PTgwMCZoYXNo/PTM3Q0YyRTBBOTI1/NUVBRDg3RTI0MTQx/MTVGRUM3QTk5"
            alt="DTF UV"
            className="product-image"
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

          <a href="https://www.instagram.com/pixel_arts.co" target="_blank" rel="noopener noreferrer" className="product-btn">
            <FaInstagram className="footer-social-icon" />
            Cotizar en Instagram
          </a>

        </div>

      </motion.div>

      {/* CARD 4 */}
      <motion.div
        className="product-card"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.80, ease: 'easeOut' }}
      >

        <div className="product-image-wrapper">

          <img
            src="https://imgs.search.brave.com/2GuZ1BT7LDyzhEs5foLm3m5FjjkS4-RVSSJlnAZdOf8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/Zm90b3MtcHJlbWl1/bS9tdWplci1lc3R1/ZGlhbnRlLWJyYXpv/LW1vZGVsby1yb2Jv/dF8xMDE2Njc1LTE3/OTAuanBnP3NlbXQ9/YWlzX2h5YnJpZCZ3/PTc0MCZxPTgw"
            alt="Sublimación"
            className="product-image"
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

          <a href="https://www.instagram.com/pixel_arts.co" target="_blank" rel="noopener noreferrer" className="product-btn">
            <FaInstagram className="footer-social-icon" />
            Cotizar en Instagram
          </a>

        </div>

      </motion.div>

    </div>

    {/* BUTTON */}
    <div className="products-action">

      <a href="https://www.instagram.com/pixel_arts.co" target="_blank" rel="noopener noreferrer" className="products-main-btn">
        <FaInstagram className="footer-social-icon" />
        Solicitar Cotización en Instagram
      </a>

    </div>

  </motion.div>

</section>

<section id="contacto" className="contact-section">

  {/* Background Shapes */}
  <div className="contact-bg-shape contact-shape-1"></div>
  <div className="contact-bg-shape contact-shape-2"></div>


  <motion.div
    className="contact-container"
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.25 }}
    transition={{ duration: 0.65, ease: 'easeOut' }}
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

      {/* Form */}
      <div className="contact-form-card">

        <h3 className="contact-form-title">
          Solicita tu cotización
        </h3>

        <form className="contact-form" onSubmit={handlePublicQuoteSubmit}>

          <div className="quote-contact-grid">
          {/* Nombre */}
          <div className="contact-field quote-name-field">

            <label className="contact-field-label">
              Nombre completo
            </label>

            <input
              type="text"
              placeholder="Nombre completo"
              className="contact-input"
              value={publicQuoteForm.nombre}
              onChange={(event) => updatePublicQuoteField('nombre', event.target.value)}
              disabled={contactFieldsDisabled}
              readOnly={contactFieldsDisabled}
            />

          </div>

          {/* Email */}
          <div className="contact-field">

            <label className="contact-field-label">
              Email
            </label>

            <input
              type="email"
              placeholder="tu@email.com"
              className="contact-input"
              value={publicQuoteForm.correo}
              onChange={(event) => updatePublicQuoteField('correo', event.target.value)}
              disabled={contactFieldsDisabled}
              readOnly={contactFieldsDisabled}
            />

          </div>

          {/* Teléfono */}
          <div className="contact-field">

            <label className="contact-field-label">
              Teléfono
            </label>

            <input
              type="tel"
              placeholder="3000000000"
              className="contact-input"
              inputMode="numeric"
              maxLength={10}
              value={publicQuoteForm.telefono}
              onChange={(event) => updatePublicQuoteField('telefono', event.target.value.replace(/\D/g, '').slice(0, 10))}
              disabled={contactFieldsDisabled}
              readOnly={contactFieldsDisabled}
            />

          </div>

          {isClient && (
            <div className="quote-account-notice">
              Cotizando con los datos de tu cuenta.
            </div>
          )}

          {isLoggedNonClient && (
            <div className="quote-account-notice warning">
              Para cotizar como cliente, usa una cuenta de cliente o crea una cotizacion presencial desde el panel.
            </div>
          )}

          {quoteLoginRequired && !isLoggedIn && (
            <div className="quote-login-required">
              <span>Este correo ya esta registrado. Inicia sesion para cotizar con tu cuenta.</span>
              <button type="button" onClick={handleQuoteLoginRedirect}>
                Iniciar sesion
              </button>
            </div>
          )}

          </div>

          <div className="quote-products-panel">
            <div className="quote-products-header">
              <label className="contact-field-label">Productos a cotizar</label>
              <button
                type="button"
                className="quote-add-product-btn"
                onClick={addPublicQuoteItem}
              >
                Agregar producto
              </button>
            </div>

            {loadingProducts ? (
              <p className="quote-helper-text">Cargando productos...</p>
            ) : productsError ? (
              <p className="quote-error-text">{productsError}</p>
            ) : publicProducts.length === 0 ? (
              <p className="quote-helper-text">No hay productos activos para cotizar por ahora.</p>
            ) : (
              <div className="quote-items-list">
                {publicQuoteItems.map((item, index) => {
                  const availableProducts = item.idCategoriaProducto
                    ? publicProducts.filter(product => Number(product.idCategoriaProducto || product.categoriaProducto?.idCategoriaProducto) === Number(item.idCategoriaProducto))
                    : publicProducts;
                  const calculationItem = calculationItems[index] || null;
                  const itemSubtotalBruto = getQuoteSubtotalBruto(calculationItem || {});
                  const itemDiscountTotal = getQuoteDiscountTotal(calculationItem || {});
                  const itemSubtotalWithDiscount = getQuoteSubtotalWithDiscount(calculationItem || {});
                  const selectedProduct = publicProducts.find(product => Number(product.idProducto) === Number(item.idProducto));
                  const selectedTechnique = publicTechniques.find(technique => Number(technique.idTecnica) === Number(item.idTecnica));
                  const isComplete = Boolean(item.idProducto && item.idTecnica && Number(item.cantidad || 0) > 0);
                  const isOpen = activePublicQuoteIndex === index;
                  const itemTitle = selectedProduct?.nombre || 'Falta seleccionar producto';

                  return (
                    <div className={`quote-item-card ${!isComplete ? 'quote-item-card-incomplete' : ''}`} key={`public-quote-item-${index}`}>
                      <div className="quote-item-card-header">
                        <button
                          type="button"
                          className="quote-item-summary-btn"
                          onClick={() => setActivePublicQuoteIndex(index)}
                          aria-expanded={isOpen}
                        >
                          <span>Producto {index + 1} - {itemTitle}</span>
                          <small>
                            Cant. {Number(item.cantidad || 0).toLocaleString('es-CO')} - {selectedTechnique?.nombre || 'Sin tecnica'} - {itemSubtotalWithDiscount > 0 ? formatMoneyCOP(itemSubtotalWithDiscount) : 'Por cotizar'}
                          </small>
                        </button>
                        <span className={`quote-item-status ${isComplete ? 'complete' : 'pending'}`}>
                          {isComplete ? 'Completo' : 'Falta informacion'}
                        </span>
                        <button
                          type="button"
                          className="quote-edit-product-btn"
                          onClick={() => setActivePublicQuoteIndex(index)}
                        >
                          {isOpen ? 'Editando' : 'Editar'}
                        </button>
                        {publicQuoteItems.length > 1 && (
                          <button
                            type="button"
                            className="quote-remove-product-btn"
                            onClick={() => removePublicQuoteItem(index)}
                          >
                            Quitar
                          </button>
                        )}
                      </div>

                      {isOpen && (
                        <div className="quote-item-card-body">
                      <div className="quote-select-grid">
                        {publicCategories.length > 0 && (
                          <select
                            className="contact-input quote-category-select"
                            value={item.idCategoriaProducto}
                            onChange={(event) => {
                              updatePublicQuoteItem(index, 'idCategoriaProducto', event.target.value);
                              updatePublicQuoteItem(index, 'idProducto', '');
                            }}
                          >
                            <option value="">Todas las categorias</option>
                            {publicCategories.map(category => (
                              <option key={category.idCategoriaProducto} value={category.idCategoriaProducto}>
                                {category.nombre}
                              </option>
                            ))}
                          </select>
                        )}
                        <select
                          className="contact-input quote-technique-select"
                          value={item.idTecnica}
                          onChange={(event) => updatePublicQuoteItem(index, 'idTecnica', event.target.value)}
                          required
                          disabled={publicTechniques.length === 0}
                        >
                          <option value="">
                            {publicTechniques.length === 0 ? 'Sin tecnicas disponibles' : 'Tecnica de estampacion'}
                          </option>
                          {publicTechniques.map(technique => (
                            <option key={technique.idTecnica} value={technique.idTecnica}>
                              {technique.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="quote-product-row">
                        <select
                          className="contact-input quote-product-select"
                          value={item.idProducto}
                          onChange={(event) => updatePublicQuoteItem(index, 'idProducto', event.target.value)}
                          required
                        >
                          <option value="">Selecciona un producto</option>
                          {availableProducts.map(product => (
                            <option key={product.idProducto} value={product.idProducto}>
                              {product.categoriaProducto?.nombre ? `${product.categoriaProducto.nombre} - ${product.nombre}` : product.nombre}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          className="contact-input quote-quantity-input"
                          value={item.cantidad}
                          onChange={(event) => updatePublicQuoteItem(index, 'cantidad', event.target.value)}
                          placeholder="Cantidad"
                          required
                        />
                        <input
                          type="text"
                          className="contact-input quote-item-note"
                          value={item.detalleProducto}
                          onChange={(event) => updatePublicQuoteItem(index, 'detalleProducto', event.target.value)}
                          placeholder="Color, talla o ubicacion del estampado"
                        />
                      </div>

                      <div className="quote-design-config">
                        <label>
                          <span>Como se manejara el diseno?</span>
                          <select
                            className="contact-input"
                            value={item.requiereDiseno === false ? 'NO_REQUIERE' : item.origenDiseno === 'CLIENTE' ? 'CLIENTE' : 'PIXEL'}
                            onChange={(event) => {
                              const mode = event.target.value;
                              updatePublicQuoteItem(index, 'requiereDiseno', mode !== 'NO_REQUIERE');
                              updatePublicQuoteItem(index, 'origenDiseno', mode === 'CLIENTE' ? 'CLIENTE' : 'PIXEL');
                              if (mode !== 'CLIENTE') updatePublicQuoteItem(index, 'archivoDisenoInicialUrl', '');
                            }}
                          >
                            <option value="CLIENTE">Ya tengo el diseno</option>
                            <option value="PIXEL">Quiero que PIXEL cree el diseno</option>
                            <option value="NO_REQUIERE">Este producto no requiere diseno</option>
                          </select>
                        </label>
                        {item.requiereDiseno !== false && item.origenDiseno === 'CLIENTE' && (
                          <label>
                            <span>Enlace del diseno (opcional)</span>
                            <input
                              type="url"
                              className="contact-input"
                              value={item.archivoDisenoInicialUrl}
                              onChange={event => updatePublicQuoteItem(index, 'archivoDisenoInicialUrl', event.target.value)}
                              placeholder="https://..."
                            />
                          </label>
                        )}
                        {item.requiereDiseno !== false && (
                          <label className="quote-general-design">
                            <input
                              type="checkbox"
                              checked={Boolean(item.esDisenoGeneral)}
                              onChange={event => updatePublicQuoteItem(index, 'esDisenoGeneral', event.target.checked)}
                            />
                            Este diseno aplica para todos los productos
                          </label>
                        )}
                      </div>

                      {calculationItem && (
                        <div className="quote-line-summary">
                          <span>Unitario: {formatMoneyCOP(calculationItem.precioUnitario ?? calculationItem.precioBase)}</span>
                          <span className="quote-discount-chip">
                            -{formatPercentage(calculationItem.descuentoPorcentaje, '0%')}
                          </span>
                          <span>Subtotal: {formatMoneyCOP(itemSubtotalBruto)}</span>
                          {itemDiscountTotal > 0 && <span>Descuento: -{formatMoneyCOP(itemDiscountTotal)}</span>}
                          <strong>Con descuento: {formatMoneyCOP(itemSubtotalWithDiscount)}</strong>
                        </div>
                      )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Proyecto */}
          <div className="contact-field">

            <label className="contact-field-label">
              Cuéntanos sobre tu proyecto
            </label>

            <textarea
              placeholder="Describe tu idea, referencias, colores, tallas o fecha deseada..."
              className="contact-textarea"
              value={publicQuoteForm.observaciones}
              onChange={(event) => updatePublicQuoteField('observaciones', event.target.value)}
            ></textarea>

          </div>

          <div className="quote-total-card">
            <div>
              <span className="quote-total-label">Total estimado</span>
              <strong className="quote-total-value">
                {formatMoneyCOP(publicQuoteCalculation?.total ?? 0)}
              </strong>
              {publicQuoteCalculation && (
                <small className="quote-total-breakdown">
                  Subtotal: {formatMoneyCOP(publicQuoteSubtotalBruto)} - Descuento: -{formatMoneyCOP(publicQuoteDiscountTotal)} - Con descuento: {formatMoneyCOP(publicQuoteSubtotalWithDiscount)}
                </small>
              )}
            </div>
            <span className="quote-helper-text">
              {calculatingQuote
                ? 'Calculando con precios reales...'
                : 'El valor final sera confirmado por nuestro equipo.'}
            </span>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="contact-submit-btn"
            disabled={isLoggedNonClient || sendingQuote || isQuoteSubmitting || loadingProducts || publicProducts.length === 0}
          >
            {sendingQuote || isQuoteSubmitting ? 'Enviando...' : 'Enviar solicitud'}
          </button>

        </form>

      </div>

    </div>

  </motion.div>

</section>




<footer className="footer">

  <motion.div
    className="footer-container"
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.65, ease: 'easeOut' }}
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
            <FaInstagram className="footer-social-icon" />
          </a>

          <a href="#" className="footer-social-link" aria-label="Facebook">
            <FaFacebookF className="footer-social-icon" />
          </a>

          <a href="#" className="footer-social-link" aria-label="Twitter">
            <FaTwitter className="footer-social-icon" />
          </a>

          <a href="#" className="footer-social-link" aria-label="YouTube">
            <FaYoutube className="footer-social-icon" />
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

  </motion.div>
</footer>


      {/* Sheet lateral móvil (estilos en CSS, comportamiento JS opcional) */}
      <aside className="sheet-container" aria-hidden="true">
        <nav className="mobile-nav">
          <a className="mobile-nav-link" href="#inicio">Inicio</a>
          <a className="mobile-nav-link" href="#como-funciona">¿Cómo funciona?</a>
          <a className="mobile-nav-link" href="#servicios">Servicios</a>
          <a className="mobile-nav-link" href="#comparativo">Comparativo</a>
          <a className="mobile-nav-link" href="#productos">Productos</a>
          <a className="mobile-nav-link" href="#contacto">Cotizar</a>
        </nav>

        <div className="mobile-user-section">
          {!isLoggedIn ? (
            <Link className="mobile-login-btn" to="/login">Iniciar Sesión</Link>
          ) : (
            <>
              <p className="mobile-profile-name">{userName}</p>
              <button type="button" className="mobile-login-btn" onClick={handleGoDashboard}>{isClient ? 'Mis pedidos' : 'Ir al Dashboard'}</button>
              <button type="button" className="mobile-login-btn mobile-logout-btn" onClick={handleLogout}>Cerrar sesion</button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};

export default LandingPage;
