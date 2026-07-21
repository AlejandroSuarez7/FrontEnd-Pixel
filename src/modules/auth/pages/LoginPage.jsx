import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';
import { getDefaultProtectedPath } from '../../../routes/SIDEBAR_CONFIG';
import { useAsyncLock } from '../../../core/hooks/useAsyncLock';
import { notifications } from '../../../core/utils/notifications';
import { isClientUser } from '../../../core/utils/permissions';
import { authService } from '../services/authService';
import { motion } from 'motion/react';
const LoginPage = () => {
  const [correo, setCorreo]       = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const { isLocked: isLoginLocked, runLocked: runLoginLocked } = useAsyncLock();
  const { isLocked: isForgotLocked, runLocked: runForgotLocked } = useAsyncLock();

  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await runLoginLocked(async () => {
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login(correo, contrasena);
      const nextPath = isClientUser(loggedInUser, loggedInUser.codigos)
        ? '/dashboard'
        : getDefaultProtectedPath(loggedInUser.codigos, loggedInUser) || '/dashboard';
      navigate(nextPath);
    } catch (err) {
      const message = err.message || 'Credenciales incorrectas';
      setError(message);
      notifications.error(message);
    } finally {
      setLoading(false);
    }
    });
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    await runForgotLocked(async () => {
    setForgotLoading(true);

    try {
      await authService.forgotPassword(forgotEmail);
      notifications.info('Si el correo existe, recibiras instrucciones para recuperar tu contrasena. Si no lo encuentras, revisa SPAM o correo no deseado.');
      setForgotOpen(false);
      setForgotEmail('');
    } catch {
      notifications.info('Si el correo existe, recibiras instrucciones para recuperar tu contrasena. Si no lo encuentras, revisa SPAM o correo no deseado.');
    } finally {
      setForgotLoading(false);
    }
    });
  };

  return (
    <div className="login-container">
      <button
        type="button"
        className="btn-explore-back"
        onClick={() => navigate('/')}
      >
        Seguir explorando
      </button>

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
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => {
                    setForgotEmail(correo);
                    setForgotOpen(true);
                  }}
                >
                  Olvide mi contrasena
                </button>
              </div>

              <button type="submit" className="btn-primary" disabled={loading || isLoginLocked}>
                {loading || isLoginLocked ? 'Ingresando...' : 'Iniciar Sesión'}
              </button>

            </form>

            <p className="register-link" hidden>
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

      {forgotOpen && (
        <div className="auth-modal-overlay">
          <div className="auth-modal-card">
            <h3>Recuperar contrasena</h3>
            <p>Escribe tu correo y te enviaremos instrucciones si existe una cuenta asociada.</p>
            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label htmlFor="forgotEmail">Correo electronico</label>
                <input
                  type="email"
                  id="forgotEmail"
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                  required
                />
              </div>
              <div className="auth-modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setForgotOpen(false)} disabled={forgotLoading || isForgotLocked}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={forgotLoading || isForgotLocked}>
                  {forgotLoading || isForgotLocked ? 'Enviando...' : 'Enviar instrucciones'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
