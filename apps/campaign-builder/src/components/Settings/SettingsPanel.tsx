import React, { useState } from 'react';
import { getSupabaseServiceKey, setSupabaseServiceKey } from '../../services/auth';
import UserManagement from './UserManagement';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [supabaseKey, setSupabaseKey] = useState(getSupabaseServiceKey() || '');
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'users'>('config');

  const handleSave = () => {
    if (supabaseKey.trim()) {
      setSupabaseServiceKey(supabaseKey.trim());
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '24px',
          width: '90%',
          maxWidth: activeTab === 'users' ? '900px' : '500px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0 }}>Configurações</h2>
        
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('config')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'config' ? '2px solid #6a3093' : '2px solid transparent',
              color: activeTab === 'config' ? '#6a3093' : '#666',
              fontWeight: activeTab === 'config' ? 'bold' : 'normal',
            }}
          >
            Configurações
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'users' ? '2px solid #6a3093' : '2px solid transparent',
              color: activeTab === 'users' ? '#6a3093' : '#666',
              fontWeight: activeTab === 'users' ? 'bold' : 'normal',
            }}
          >
            Usuários
          </button>
        </div>

        {activeTab === 'config' && (
          <>
            <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Supabase Service Key
          </label>
          <input
            type="password"
            value={supabaseKey}
            onChange={(e) => setSupabaseKey(e.target.value)}
            placeholder="Cole aqui a Service Key do Supabase"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            Necessário para acessar Target Groups do PostgreSQL
          </div>
        </div>

            {saved && (
              <div style={{
                padding: '10px',
                background: '#4CAF50',
                color: 'white',
                borderRadius: '4px',
                marginBottom: '15px',
                textAlign: 'center',
              }}>
                ✅ Configuração salva!
              </div>
            )}
          </>
        )}

        {activeTab === 'users' && <UserManagement />}

        {activeTab === 'config' && (
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#999',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '10px 20px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Salvar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

