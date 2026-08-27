import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAsyncLock } from '../../../core/hooks/useAsyncLock';
import { notifications } from '../../../core/utils/notifications';
import { getPasswordRulesStatus, getPasswordValidationError } from '../../../core/utils/userValidation';
import { authService } from '../services/authService';

const getClientPasswordErrorMessage = (error) => {
  const message = String(error?.message || '').toLowerCase();

  if (message.includes('venc')) return 'El enlace ya vencio. Solicita uno nuevo.';
  if (message.includes('token') || message.includes('invalid')) return 'El enlace no es valido.';
  if (message.includes('password') || message.includes('contrasena')) return 'La contrasena no cumple los requisitos.';

  return error?.message || 'No se pudo crear la contrasena. Intenta nuevamente.';
};

const CreateClientPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();
  const rules = getPasswordRulesStatus(password);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await runLocked(async () => {

    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      notifications.warning(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      notifications.warning('Las contrasenas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await authService.createClientPassword(token, password);
      notifications.success('Contrasena creada correctamente. Ya puedes iniciar sesion.');
      navigate('/login');
    } catch (error) {
      notifications.error(getClientPasswordErrorMessage(error));
    } finally {
      setLoading(false);
    }
    });
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
            <h2>Crea tu contrasena</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="clientPassword">Nueva contrasena</label>
                <input
                  type="password"
                  id="clientPassword"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="clientConfirmPassword">Confirmar contrasena</label>
                <input
                  type="password"
                  id="clientConfirmPassword"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>

              {password.length > 0 && (
                <div className="password-rules">
                  {rules.map(rule => (
                    <div key={rule.id} className={`password-rule ${rule.passed ? 'rule-passed' : 'rule-failed'}`}>
                      <span className="rule-icon">{rule.passed ? 'OK' : 'X'}</span>
                      {rule.label}
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading || isSubmitting}>
                {loading || isSubmitting ? 'Creando...' : 'Crear contrasena'}
              </button>
            </form>
          </div>
        </div>

        <div className="auth-image-panel">
          <div className="auth-image-content">
            <h3>Consulta tu pedido</h3>
            <p>Con esta contrasena podras iniciar sesion y revisar el avance de tus solicitudes.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateClientPasswordPage;
