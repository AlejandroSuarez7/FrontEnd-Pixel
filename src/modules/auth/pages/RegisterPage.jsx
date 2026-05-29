import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name:            '',
    email:           '',
    password:        '',
    confirmPassword: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate     = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await register({
        name:     formData.name,
        email:    formData.email,
        password: formData.password,
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
              <div className="form-group">
                <label htmlFor="name">Nombre</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>

              <button type="button" className="btn-secondary" onClick={() => navigate('/')}>Seguir explorando</button>
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