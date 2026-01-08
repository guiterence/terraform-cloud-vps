import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthToken } from '../../services/auth';
import { signIn } from '../../services/supabaseAuth';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Autenticação via tabela public.users
      const authResponse = await signIn(email, password, remember);
      
      // Salvar token
      setAuthToken(authResponse.access_token);
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Elementos decorativos animados */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
      </div>

      <div className="login-container">
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">◆</div>
            <div className="logo-text">NEXORA</div>
          </div>
        </div>

        <div className="login-body">
          <h2>Bem-vindo de volta</h2>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <span>👤</span>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <span>🔒</span>
              <input
                type="password"
                name="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="options">
              <label>
                <input
                  type="checkbox"
                  name="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={loading}
                />
                Remember me
              </label>
              <a href="/forgot-password" onClick={(e) => {
                e.preventDefault();
                navigate('/forgot-password');
              }}>
                Forgot password?
              </a>
            </div>

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Login'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

