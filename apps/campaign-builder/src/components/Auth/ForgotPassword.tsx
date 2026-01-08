import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://supabase.terenceconsultoria.com.br';
      const SUPABASE_SERVICE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_KEY || '';

      const response = await fetch(`${SUPABASE_URL}/functions/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao processar solicitação' }));
        throw new Error(errorData.error || errorData.message || 'Erro ao processar solicitação');
      }

      const data = await response.json();
      setMessage(data.message || 'Se o email estiver cadastrado, o administrador será notificado.');
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      {/* Elementos decorativos animados */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
      </div>

      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <div className="logo-container">
            <div className="logo-icon">◆</div>
            <div className="logo-text">NEXORA</div>
          </div>
        </div>

        <div className="forgot-password-body">
          <h2>Esqueceu sua senha?</h2>
          <p className="description">
            Digite seu email e o administrador será notificado para redefinir sua senha.
          </p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <span>📧</span>
              <input
                type="email"
                name="email"
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || !!message}
              />
            </div>

            <button
              className="submit-button"
              type="submit"
              disabled={loading || !!message}
            >
              {loading ? 'Enviando...' : message ? 'Solicitação Enviada' : 'Enviar Solicitação'}
            </button>
          </form>

          <div className="footer">
            <a href="/login" onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}>
              ← Voltar para o login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

