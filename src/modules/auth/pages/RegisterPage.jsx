import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { notifications } from '../../../core/utils/notifications';
import {
  getAuthFormValidationError,
  getPasswordRulesStatus,
  onlyDigits,
} from '../../../core/utils/userValidation';
import { useAuth } from '../../../store/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'telefono' ? onlyDigits(value) : value,
    }));
  };

  const passwordRulesStatus = getPasswordRulesStatus(formData.contrasena);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const validationError = getAuthFormValidationError(formData);
    if (validationError) {
      setError(validationError);
      notifications.warning(validationError);
      return;
    }

    setLoading(true);
    try {
      await register({
        nombre: formData.nombre,
        telefono: formData.telefono,
        correo: formData.correo,
        contrasena: formData.contrasena,
      });
      notifications.success('Registro creado correctamente. Ya puedes iniciar sesion.');
      navigate('/login');
    } catch (err) {
      const message = err.message || 'Error al registrarse';
      setError(message);
      notifications.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <motion.div
        className="auth-split"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.80, ease: 'easeOut' }}
      >
        <div className="auth-form-panel">
          <div className="register-card">
            <span className="auth-badge"><div className="logo-forms">PIXEL</div></span>
            <h2>Registrarse</h2>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="nombre">Nombre completo</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Juan Perez"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="telefono">
                    Telefono
                    <span className="field-hint">{formData.telefono.length}/10</span>
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="3001234567"
                    className={
                      formData.telefono.length > 0
                        ? formData.telefono.length === 10 ? 'input-valid' : 'input-invalid'
                        : ''
                    }
                    required
                  />
                </div>
              </div>

              <br />

              <div className="form-group">
                <label htmlFor="correo">Correo electronico</label>
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="contrasena">Contrasena</label>
                  <input
                    type="password"
                    id="contrasena"
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleChange}
                    onFocus={() => setShowRules(true)}
                    placeholder="Minimo 8 caracteres"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="confirmarContrasena">Confirmar contrasena</label>
                  <input
                    type="password"
                    id="confirmarContrasena"
                    name="confirmarContrasena"
                    value={formData.confirmarContrasena}
                    onChange={handleChange}
                    placeholder="Repite tu contrasena"
                    className={
                      formData.confirmarContrasena.length > 0
                        ? formData.contrasena === formData.confirmarContrasena ? 'input-valid' : 'input-invalid'
                        : ''
                    }
                    required
                  />
                  {formData.confirmarContrasena.length > 0 &&
                    formData.contrasena !== formData.confirmarContrasena && (
                      <span className="field-error-inline">No coinciden</span>
                    )
                  }
                </div>
              </div>

              {showRules && formData.contrasena.length > 0 && (
                <div className="password-rules">
                  {passwordRulesStatus.map((rule) => (
                    <div
                      key={rule.id}
                      className={`password-rule ${rule.passed ? 'rule-passed' : 'rule-failed'}`}
                    >
                      <span className="rule-icon">{rule.passed ? 'OK' : 'X'}</span>
                      {rule.label}
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '20px' }}>
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>

              <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
                Seguir explorando
              </button>
            </form>

            <p className="login-link">
              Ya tienes cuenta? <a href="/login">Iniciar sesion</a>
            </p>
          </div>
        </div>

        <div className="auth-image-panel">
          <div className="auth-image-content">
            <h3>Comienza tu viaje</h3>
            <p>Registrate y lleva tu control de proyectos al siguiente nivel.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
