import React, { useState, useEffect } from 'react';
import { getSupabaseServiceKey } from '../../services/auth';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://supabase.terenceconsultoria.com.br';

interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const serviceKey = getSupabaseServiceKey();
      if (!serviceKey) {
        setMessage({ type: 'error', text: 'Service Key não configurada' });
        return;
      }

      // Buscar usuários diretamente do Supabase
      const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,email,name,created_at&order=created_at.desc`, {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data || []);
      } else {
        setMessage({ type: 'error', text: 'Erro ao carregar usuários' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao carregar usuários' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const serviceKey = getSupabaseServiceKey();
      if (!serviceKey) {
        setMessage({ type: 'error', text: 'Service Key não configurada' });
        return;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/auth/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          name: newUser.name || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário');
      }

      setMessage({ type: 'success', text: 'Usuário criado com sucesso!' });
      setNewUser({ email: '', password: '', name: '' });
      setShowCreateForm(false);
      loadUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao criar usuário' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>Gerenciar Usuários</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '8px 16px',
            background: '#6a3093',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {showCreateForm ? 'Cancelar' : '+ Novo Usuário'}
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: '12px',
            marginBottom: '15px',
            borderRadius: '4px',
            background: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateUser} style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
          <h4 style={{ marginTop: 0 }}>Criar Novo Usuário</h4>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email *
            </label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              placeholder="usuario@exemplo.com"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Senha *
            </label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
              minLength={6}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              placeholder="Mínimo 6 caracteres"
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              A senha será criptografada (hasheada) antes de ser salva no banco de dados
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Nome (opcional)
            </label>
            <input
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              placeholder="Nome completo"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: loading ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Criando...' : 'Criar Usuário'}
          </button>
        </form>
      )}

      <div>
        <h4>Usuários Cadastrados ({users.length})</h4>
        {loading && !showCreateForm ? (
          <div>Carregando...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            Nenhum usuário cadastrado ainda
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Nome</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '10px' }}>{user.email}</td>
                  <td style={{ padding: '10px' }}>{user.name || '-'}</td>
                  <td style={{ padding: '10px' }}>
                    {new Date(user.created_at).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

