import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseServiceKey, setSupabaseServiceKey } from '../../services/auth';
import UserManagement from './UserManagement';
import './SettingsPage.css';

interface ApiConfig {
  supabase: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  email: string;
  webhook: string;
}

export default function SettingsRoute() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'api' | 'users' | 'webhooks'>('api');
  
  // Debug: garantir que o componente renderiza
  console.log('SettingsRoute renderizando');
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState<ApiConfig>(() => {
    try {
      return {
        supabase: getSupabaseServiceKey() || '',
        whatsapp: localStorage.getItem('whatsapp_api_key') || '',
        facebook: localStorage.getItem('facebook_api_key') || '',
        instagram: localStorage.getItem('instagram_api_key') || '',
        tiktok: localStorage.getItem('tiktok_api_key') || '',
        email: localStorage.getItem('email_api_key') || '',
        webhook: localStorage.getItem('webhook_url') || '',
      };
    } catch (e) {
      return {
        supabase: '',
        whatsapp: '',
        facebook: '',
        instagram: '',
        tiktok: '',
        email: '',
        webhook: '',
      };
    }
  });

  const handleSave = () => {
    if (config.supabase.trim()) {
      setSupabaseServiceKey(config.supabase.trim());
    }
    localStorage.setItem('whatsapp_api_key', config.whatsapp);
    localStorage.setItem('facebook_api_key', config.facebook);
    localStorage.setItem('instagram_api_key', config.instagram);
    localStorage.setItem('tiktok_api_key', config.tiktok);
    localStorage.setItem('email_api_key', config.email);
    localStorage.setItem('webhook_url', config.webhook);
    
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const handleChange = (key: keyof ApiConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div 
      className="settings-page-container" 
      style={{ 
        minHeight: '100vh', 
        padding: '20px',
        width: '100%',
        backgroundColor: '#f5f6fa',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center'
      }}
    >
      <div 
        className="settings-panel settings-panel-full" 
        style={{ 
          margin: '0 auto',
          maxWidth: '1200px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="settings-header" style={{ 
          padding: '24px',
          background: 'linear-gradient(135deg, #8a2be2, #9370db)',
          color: '#ffffff',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>⚙️ Configurações</h2>
          <button 
            className="settings-close" 
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            🔑 API Keys
          </button>
          <button
            className={`settings-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Usuários
          </button>
          <button
            className={`settings-tab ${activeTab === 'webhooks' ? 'active' : ''}`}
            onClick={() => setActiveTab('webhooks')}
          >
            🔗 Webhooks
          </button>
        </div>

        {saved && (
          <div className="settings-message success">
            ✅ Configurações salvas com sucesso!
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api' && (
          <div className="settings-content">
            <div className="settings-section">
              <h3>🔐 Supabase</h3>
              <div className="settings-field">
                <label>Service Key</label>
                <input
                  type="password"
                  value={config.supabase}
                  onChange={(e) => handleChange('supabase', e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                />
                <small>Necessário para acessar dados do PostgreSQL</small>
              </div>
            </div>

            <div className="settings-section">
              <h3>💬 WhatsApp Business API</h3>
              <div className="settings-field">
                <label>API Key / Access Token</label>
                <input
                  type="password"
                  value={config.whatsapp}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  placeholder="EAAxxxxxxxxxxxxx"
                />
                <small>Token de acesso da API do WhatsApp Business</small>
              </div>
            </div>

            <div className="settings-section">
              <h3>📘 Facebook</h3>
              <div className="settings-field">
                <label>Access Token</label>
                <input
                  type="password"
                  value={config.facebook}
                  onChange={(e) => handleChange('facebook', e.target.value)}
                  placeholder="EAAxxxxxxxxxxxxx"
                />
                <small>Token de acesso do Facebook Graph API</small>
              </div>
            </div>

            <div className="settings-section">
              <h3>📷 Instagram</h3>
              <div className="settings-field">
                <label>Access Token</label>
                <input
                  type="password"
                  value={config.instagram}
                  onChange={(e) => handleChange('instagram', e.target.value)}
                  placeholder="IGQVJxxxxxxxxxxxxx"
                />
                <small>Token de acesso da Instagram Graph API</small>
              </div>
            </div>

            <div className="settings-section">
              <h3>🎵 TikTok</h3>
              <div className="settings-field">
                <label>Access Token</label>
                <input
                  type="password"
                  value={config.tiktok}
                  onChange={(e) => handleChange('tiktok', e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
                <small>Token de acesso da TikTok Marketing API</small>
              </div>
            </div>

            <div className="settings-section">
              <h3>📧 Email</h3>
              <div className="settings-field">
                <label>SMTP / API Key</label>
                <input
                  type="password"
                  value={config.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="SG.xxxxxxxxxxxxx ou SMTP config"
                />
                <small>Chave da API de email (SendGrid, Mailgun, etc.) ou configuração SMTP</small>
              </div>
            </div>

            <div className="settings-actions">
              <button className="settings-btn secondary" onClick={() => navigate(-1)}>
                Cancelar
              </button>
              <button className="settings-btn primary" onClick={handleSave}>
                💾 Salvar Configurações
              </button>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="settings-content">
            <UserManagement />
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="settings-content">
            <div className="settings-section">
              <h3>🔗 Webhook URL</h3>
              <div className="settings-field">
                <label>URL do Webhook</label>
                <input
                  type="url"
                  value={config.webhook}
                  onChange={(e) => handleChange('webhook', e.target.value)}
                  placeholder="https://seu-servidor.com/webhook"
                />
                <small>URL para receber notificações de eventos (campanhas, clientes, etc.)</small>
              </div>
            </div>

            <div className="settings-section">
              <h3>📋 Eventos Disponíveis</h3>
              <div className="webhook-events">
                <label className="webhook-event">
                  <input type="checkbox" defaultChecked />
                  <span>Nova campanha criada</span>
                </label>
                <label className="webhook-event">
                  <input type="checkbox" defaultChecked />
                  <span>Campanha iniciada</span>
                </label>
                <label className="webhook-event">
                  <input type="checkbox" defaultChecked />
                  <span>Campanha concluída</span>
                </label>
                <label className="webhook-event">
                  <input type="checkbox" />
                  <span>Novo cliente cadastrado</span>
                </label>
                <label className="webhook-event">
                  <input type="checkbox" />
                  <span>Cliente com risco de churn</span>
                </label>
                <label className="webhook-event">
                  <input type="checkbox" />
                  <span>Target group atualizado</span>
                </label>
              </div>
            </div>

            <div className="settings-actions">
              <button className="settings-btn secondary" onClick={() => navigate(-1)}>
                Cancelar
              </button>
              <button className="settings-btn primary" onClick={handleSave}>
                💾 Salvar Configurações
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

