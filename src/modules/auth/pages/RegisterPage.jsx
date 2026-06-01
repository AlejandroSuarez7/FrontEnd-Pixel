import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nombre:              '',
    telefono:            '',
    correo:              '',
    contrasena:          '',
    confirmarContrasena: '',
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

    if (formData.contrasena !== formData.confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.contrasena.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres');
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
              <div className="form-group">
                <label htmlFor="nombre">Nombre completo</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="correo">Correo Electrónico</label>
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contrasena">Contraseña</label>
                <input
                  type="password"
                  id="contrasena"
                  name="contrasena"
                  value={formData.contrasena}
                  onChange={handleChange}
                  minLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmarContrasena">Confirmar Contraseña</label>
                <input
                  type="password"
                  id="confirmarContrasena"
                  name="confirmarContrasena"
                  value={formData.confirmarContrasena}
                  onChange={handleChange}
                  minLength={6}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
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