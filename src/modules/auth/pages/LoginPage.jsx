import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';
import { notifications } from '../../../core/utils/notifications';
import { motion } from 'motion/react';
const LoginPage = () => {
  const [correo, setCorreo]       = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(correo, contrasena);
      navigate('/dashboard');
    } catch (err) {
      const message = err.message || 'Credenciales incorrectas';
      setError(message);
      notifications.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
    <motion.div
        className="auth-split"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.80, ease: 'easeOut' }}
      >
      
        <div className="auth-form-panel">
          <div className="login-card">
            <span className="auth-badge"><div className="logo-forms">PIXEL</div></span>
            <h2>Iniciar Sesión</h2>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  type="email"
                  id="correo"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <input
                  type="password"
                  id="contrasena"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Ingresando...' : 'Iniciar Sesión'}
              </button>

              <button type="button" className="btn-secondary" onClick={() => navigate('/')}>Seguir explorando</button>
            </form>

            <p className="register-link">
              ¿No tienes cuenta? <a href="/register">Registrarse</a>
            </p>
          </div>
        </div>

        <div className="auth-image-panel">
          <div className="auth-image-content">
            
            <h3>Bienvenido de vuelta</h3>
            <p>Accede a tu espacio creativo y gestiona tus proyectos con estilo.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
