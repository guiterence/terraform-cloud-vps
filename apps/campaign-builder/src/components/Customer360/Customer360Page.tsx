import React, { useState, useEffect } from 'react';
import { getCustomer360DetailApiClient, Customer360Detail } from '../../services/customer360DetailApi';
import { getSupabaseServiceKey } from '../../services/auth';
import { getCurrentUser } from '../../services/auth';
import './Customer360Page.css';

export default function Customer360Page() {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer360Detail[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer360Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasServiceKey, setHasServiceKey] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const serviceKey = getSupabaseServiceKey();
    if (!serviceKey) {
      setHasServiceKey(false);
    }
  }, []);

  useEffect(() => {
    if (hasServiceKey) {
      loadCustomers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasServiceKey, page]);

  const loadCustomers = async () => {
    if (!hasServiceKey) return;
    
    setLoading(true);
    try {
      const apiClient = getCustomer360DetailApiClient();
      const response = await apiClient.searchCustomers(searchQuery, page, 20);
      
      console.log('Response completo:', response);
      console.log('Response.data:', response?.data);
      console.log('Response.pagination:', response?.pagination);
      
      // Garantir que temos dados válidos
      const customers = Array.isArray(response?.data) ? response.data : [];
      
      // Tratar paginação com validação robusta
      let pagination;
      if (response?.pagination && typeof response.pagination === 'object') {
        pagination = {
          page: response.pagination.page || page,
          limit: response.pagination.limit || 20,
          total: response.pagination.total || customers.length,
          totalPages: response.pagination.totalPages || Math.max(1, Math.ceil((response.pagination.total || customers.length) / (response.pagination.limit || 20)))
        };
      } else {
        pagination = {
          page: page,
          limit: 20,
          total: customers.length,
          totalPages: Math.max(1, Math.ceil(customers.length / 20))
        };
      }
      
      console.log('Pagination final:', pagination);
      
      setCustomers(customers);
      setTotalPages(pagination.totalPages);
      
      // Selecionar primeiro cliente se houver resultados e nenhum estiver selecionado
      if (customers.length > 0 && !selectedCustomer) {
        setSelectedCustomer(customers[0]);
      } else if (customers.length === 0) {
        setSelectedCustomer(null);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Erro ao carregar clientes: ' + errorMessage);
      setCustomers([]);
      setTotalPages(1);
      setSelectedCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadCustomers();
  };

  const handleSelectCustomer = async (customer: Customer360Detail) => {
    setSelectedCustomer(customer);
  };

  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') return 'R$ 0,00';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDaysAgo = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return '1 dia atrás';
    return `${diffDays} dias atrás`;
  };

  if (!hasServiceKey) {
    return (
      <div className="customer-360">
        <div className="error-message">
          <h2>Configuração Necessária</h2>
          <p>Configure a Supabase Service Key em Settings para visualizar dados de Customer 360.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-360">
      <div className="topbar">
        <h1>Customer 360</h1>
        <div>👤 {getCurrentUser()?.name || getCurrentUser()?.email?.split('@')[0] || 'Usuário'}</div>
      </div>

      {/* SEARCH */}
      <div className="search">
        <input
          type="text"
          placeholder="Buscar por ID, email ou nome"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      <div className="customer-360-content">
        {/* LISTA DE CLIENTES */}
        <div className="customers-list">
          <h3>Clientes {customers.length > 0 && `(${customers.length})`}</h3>
          {loading && customers.length === 0 ? (
            <div className="loading">Carregando clientes...</div>
          ) : customers.length === 0 ? (
            <div className="empty-state">Nenhum cliente encontrado</div>
          ) : (
            <>
              <div className="customers-scroll">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className={`customer-item ${selectedCustomer?.id === customer.id ? 'selected' : ''}`}
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <div className="customer-item-header">
                      <strong>{customer.full_name || customer.email || 'Sem nome'}</strong>
                      <span className={`status-badge ${customer.is_active ? 'active' : 'inactive'}`}>
                        {customer.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="customer-item-info">
                      <span className="customer-email">{customer.email || 'Sem email'}</span>
                      {customer.segment_label && (
                        <span className="customer-segment">{customer.segment_label}</span>
                      )}
                    </div>
                    <div className="customer-item-kpi">
                      <span>LTV: {formatCurrency(customer.net_revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    disabled={page === 1}
                  >
                    Anterior
                  </button>
                  <span>Página {page} de {totalPages}</span>
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                    disabled={page === totalPages}
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* DETALHES DO CLIENTE */}
        {selectedCustomer ? (
          <div className="customer-details">
            <div className="profile">
              <div className="card">
                <h2>
                  {selectedCustomer.full_name || selectedCustomer.email || 'Cliente sem nome'}
                  <span className={`badge ${selectedCustomer.is_active ? 'active' : 'inactive'}`}>
                    {selectedCustomer.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </h2>
                <div className="info">
                  <p><strong>ID:</strong> {selectedCustomer.id}</p>
                  {selectedCustomer.external_id && (
                    <p><strong>External ID:</strong> {selectedCustomer.external_id}</p>
                  )}
                  {selectedCustomer.email && (
                    <p><strong>Email:</strong> {selectedCustomer.email}</p>
                  )}
                  {selectedCustomer.phone && (
                    <p><strong>Telefone:</strong> {selectedCustomer.phone}</p>
                  )}
                  {selectedCustomer.segment_label && (
                    <p><strong>Segmento:</strong> {selectedCustomer.segment_label}</p>
                  )}
                  {selectedCustomer.tier && (
                    <p><strong>Tier:</strong> {selectedCustomer.tier.toUpperCase()}</p>
                  )}
                  {selectedCustomer.lifecycle_stage && (
                    <p><strong>Lifecycle:</strong> {selectedCustomer.lifecycle_stage}</p>
                  )}
                  {selectedCustomer.is_churn_risk && (
                    <p><strong>Churn Risk:</strong> <span className="churn-risk">Alto</span></p>
                  )}
                  {selectedCustomer.city && selectedCustomer.uf && (
                    <p><strong>Localização:</strong> {selectedCustomer.city}, {selectedCustomer.uf}</p>
                  )}
                </div>
              </div>

              <div className="card">
                <h2>Customer KPIs</h2>
                <div className="kpis">
                  <div className="kpi">
                    <h4>LTV (Net Revenue)</h4>
                    <p>{formatCurrency(selectedCustomer.net_revenue)}</p>
                  </div>
                  <div className="kpi">
                    <h4>Total Deposit</h4>
                    <p>{formatCurrency(selectedCustomer.total_deposit)}</p>
                  </div>
                  <div className="kpi">
                    <h4>Total Withdraw</h4>
                    <p>{formatCurrency(selectedCustomer.total_withdraw)}</p>
                  </div>
                  <div className="kpi">
                    <h4>Last Activity</h4>
                    <p>{formatDaysAgo(selectedCustomer.last_activity_at)}</p>
                  </div>
                  {selectedCustomer.churn_score !== null && selectedCustomer.churn_score !== undefined && (
                    <div className="kpi">
                      <h4>Churn Score</h4>
                      <p>{Number(selectedCustomer.churn_score).toFixed(1)}</p>
                    </div>
                  )}
                  {selectedCustomer.engagement_score !== null && selectedCustomer.engagement_score !== undefined && (
                    <div className="kpi">
                      <h4>Engagement Score</h4>
                      <p>{Number(selectedCustomer.engagement_score).toFixed(1)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TIMELINE */}
            <div className="card">
              <h2>Behavior Timeline</h2>
              <div className="timeline">
                {selectedCustomer.last_login_at && (
                  <div className="timeline-item">
                    🟢 Login — {formatDaysAgo(selectedCustomer.last_login_at)}
                  </div>
                )}
                {selectedCustomer.last_deposit_at && (
                  <div className="timeline-item">
                    💰 Depósito {formatCurrency(selectedCustomer.avg_deposit)} — {formatDaysAgo(selectedCustomer.last_deposit_at)}
                  </div>
                )}
                {selectedCustomer.last_withdraw_at && (
                  <div className="timeline-item">
                    💸 Saque {formatCurrency(selectedCustomer.avg_withdraw)} — {formatDaysAgo(selectedCustomer.last_withdraw_at)}
                  </div>
                )}
                {selectedCustomer.last_campaign_at && (
                  <div className="timeline-item">
                    📣 Última campanha — {formatDaysAgo(selectedCustomer.last_campaign_at)}
                  </div>
                )}
                {selectedCustomer.first_activity_at && (
                  <div className="timeline-item">
                    🎯 Primeira atividade — {formatDate(selectedCustomer.first_activity_at)}
                  </div>
                )}
                {selectedCustomer.created_at && (
                  <div className="timeline-item">
                    ✨ Cliente criado — {formatDate(selectedCustomer.created_at)}
                  </div>
                )}
                {(!selectedCustomer.last_login_at && 
                  !selectedCustomer.last_deposit_at && 
                  !selectedCustomer.last_withdraw_at && 
                  !selectedCustomer.last_campaign_at) && (
                  <div className="timeline-item">Nenhuma atividade recente</div>
                )}
              </div>
            </div>

            {/* INFORMAÇÕES ADICIONAIS */}
            <div className="card">
              <h2>Informações Adicionais</h2>
              <div className="additional-info">
                <div className="info-row">
                  <span className="info-label">Depósitos:</span>
                  <span className="info-value">{selectedCustomer.deposit_count} transações</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Saques:</span>
                  <span className="info-value">{selectedCustomer.withdraw_count} transações</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Sessões (30d):</span>
                  <span className="info-value">{selectedCustomer.sessions_last_30d || 0}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Ações (30d):</span>
                  <span className="info-value">{selectedCustomer.actions_last_30d || 0}</span>
                </div>
                {selectedCustomer.acquisition_channel && (
                  <div className="info-row">
                    <span className="info-label">Canal de Aquisição:</span>
                    <span className="info-value">{selectedCustomer.acquisition_channel}</span>
                  </div>
                )}
                {selectedCustomer.persona && (
                  <div className="info-row">
                    <span className="info-label">Persona:</span>
                    <span className="info-value">{selectedCustomer.persona}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="customer-details">
            <div className="empty-state-large">
              <p>Selecione um cliente da lista para ver os detalhes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
