import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';

const PASSWORD_RULES = [
  { id: 'length',  label: 'Mínimo 8 caracteres',          test: (p) => p.length >= 8 },
  { id: 'upper',   label: 'Al menos una mayúscula',        test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'Al menos una minúscula',        test: (p) => /[a-z]/.test(p) },
  { id: 'number',  label: 'Al menos un número',            test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'Al menos un carácter especial', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nombre:              '',
    telefono:            '',
    correo:              '',
    contrasena:          '',
    confirmarContrasena: '',
  });
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showRules, setShowRules] = useState(false);

  const { register } = useAuth();
  const navigate     = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'telefono') {
      const soloNumeros = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, telefono: soloNumeros }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const passwordRulesStatus = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(formData.contrasena),
  }));

  const allRulesPassed = passwordRulesStatus.every((r) => r.passed);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.telefono.length !== 10) {
      setError('El teléfono debe tener exactamente 10 dígitos');
      return;
    }
    if (!allRulesPassed) {
      setError('La contraseña no cumple todos los requisitos');
      return;
    }
    if (formData.contrasena !== formData.confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await register({
        nombre:     formData.nombre,
        telefono:   formData.telefono,
        correo:     formData.correo,
        contrasena: formData.contrasena,
      });
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="auth-split">
        <div className="auth-form-panel">
          <div className="register-card">
            <span className="auth-badge"><div className="logo-forms">PIXEL</div></span>
            <h2>Registrarse</h2>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>

              {/* Fila 1: Nombre + Teléfono */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="nombre">Nombre completo</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Juan Pérez"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="telefono">
                    Teléfono
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

              {/* Fila 2: Correo (ancho completo) */}
              <div className="form-group">
                <label htmlFor="correo">Correo Electrónico</label>
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

              {/* Fila 3: Contraseña + Confirmar lado a lado */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="contrasena">Contraseña</label>
                  <input
                    type="password"
                    id="contrasena"
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleChange}
                    onFocus={() => setShowRules(true)}
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="confirmarContrasena">Confirmar Contraseña</label>
                  <input
                    type="password"
                    id="confirmarContrasena"
                    name="confirmarContrasena"
                    value={formData.confirmarContrasena}
                    onChange={handleChange}
                    placeholder="Repite tu contraseña"
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

              {/* Indicador de requisitos — se expande bajo las contraseñas */}
              {showRules && formData.contrasena.length > 0 && (
                <div className="password-rules">
                  {passwordRulesStatus.map((rule) => (
                    <div
                      key={rule.id}
                      className={`password-rule ${rule.passed ? 'rule-passed' : 'rule-failed'}`}
                    >
                      <span className="rule-icon">{rule.passed ? '✓' : '✗'}</span>
                      {rule.label}
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading}
                style={{ marginTop: '20px' }}>
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>

              <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
                Seguir explorando
              </button>
            </form>

            <p className="login-link">
              ¿Ya tienes cuenta? <a href="/login">Iniciar Sesión</a>
            </p>
          </div>
        </div>

        <div className="auth-image-panel">
          <div className="auth-image-content">
            <h3>Comienza tu viaje</h3>
            <p>Regístrate y lleva tu control de proyectos al siguiente nivel.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;