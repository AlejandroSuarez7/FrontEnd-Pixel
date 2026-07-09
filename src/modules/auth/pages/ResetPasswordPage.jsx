import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { notifications } from '../../../core/utils/notifications';
import { getPasswordRulesStatus, getPasswordValidationError } from '../../../core/utils/userValidation';
import { authService } from '../services/authService';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const rules = getPasswordRulesStatus(password);

  const handleSubmit = async (event) => {
    event.preventDefault();

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
      await authService.resetPassword(token, password);
      notifications.success('Contrasena actualizada correctamente.');
      navigate('/login');
    } catch (error) {
      notifications.error(error.message || 'No se pudo actualizar la contrasena.');
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
            <h2>Nueva contrasena</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="password">Nueva contrasena</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar contrasena</label>
                <input
                  type="password"
                  id="confirmPassword"
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

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Actualizando...' : 'Actualizar contrasena'}
              </button>
            </form>
          </div>
        </div>

        <div className="auth-image-panel">
          <div className="auth-image-content">
            <h3>Recupera tu acceso</h3>
            <p>Crea una contrasena segura para volver al panel de PIXEL.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
