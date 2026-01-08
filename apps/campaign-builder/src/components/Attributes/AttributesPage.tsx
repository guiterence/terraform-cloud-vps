import React, { useState, useEffect } from 'react';
import { getSupabaseServiceKey } from '../../services/auth';
import './AttributesPage.css';

interface CustomerAttribute {
  id: string;
  attribute_name: string;
  display_name: string;
  data_type: string;
  description: string | null;
  category: string | null;
  is_filterable: boolean;
  is_searchable: boolean;
  is_required: boolean;
  default_value: string | null;
  validation_rules: any;
  created_at: string;
  updated_at: string;
}

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://supabase.terenceconsultoria.com.br';

class AttributesApiClient {
  private serviceKey: string;
  private baseUrl: string;

  constructor(serviceKey: string) {
    this.serviceKey = serviceKey;
    this.baseUrl = `${SUPABASE_URL}/functions/v1/customer-attributes`;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.serviceKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  async listAttributes(): Promise<CustomerAttribute[]> {
    return await this.request('');
  }

  async getAttribute(name: string): Promise<CustomerAttribute> {
    return await this.request(`/${name}`);
  }

  async createAttribute(data: {
    attribute_name: string;
    display_name: string;
    data_type: string;
    category?: string;
    description?: string;
    default_value?: string;
  }): Promise<CustomerAttribute> {
    return await this.request('', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAttribute(name: string, data: {
    display_name?: string;
    data_type?: string;
    category?: string;
    description?: string;
    default_value?: string;
  }): Promise<CustomerAttribute> {
    return await this.request(`/${name}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAttribute(name: string): Promise<void> {
    await this.request(`/${name}`, {
      method: 'DELETE',
    });
  }

  async syncAttributes(): Promise<CustomerAttribute[]> {
    return await this.request('/sync', {
      method: 'POST',
    });
  }
}

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<CustomerAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiClient, setApiClient] = useState<AttributesApiClient | null>(null);
  const [hasServiceKey, setHasServiceKey] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<CustomerAttribute | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const serviceKey = getSupabaseServiceKey();
    if (serviceKey) {
      setApiClient(new AttributesApiClient(serviceKey));
      setHasServiceKey(true);
    } else {
      setHasServiceKey(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (apiClient) {
      loadAttributes();
    }
  }, [apiClient]);

  const loadAttributes = async () => {
    if (!apiClient) return;
    
    setLoading(true);
    try {
      const attrs = await apiClient.listAttributes();
      setAttributes(attrs);
    } catch (error) {
      console.error('Erro ao carregar atributos:', error);
      alert('Erro ao carregar atributos: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!apiClient) return;
    
    try {
      setLoading(true);
      const attrs = await apiClient.syncAttributes();
      setAttributes(attrs);
      alert('Atributos sincronizados com sucesso!');
    } catch (error) {
      console.error('Erro ao sincronizar atributos:', error);
      alert('Erro ao sincronizar: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!apiClient) return;
    
    if (!window.confirm(`Tem certeza que deseja deletar o atributo "${name}"? Isso removerá a coluna de customer_360!`)) {
      return;
    }

    try {
      await apiClient.deleteAttribute(name);
      await loadAttributes();
      alert('Atributo deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar atributo:', error);
      alert('Erro ao deletar: ' + (error as Error).message);
    }
  };

  const categories = ['all', ...Array.from(new Set(attributes.map(a => a.category).filter((cat): cat is string => cat !== null)))];
  const filteredAttributes = attributes.filter(attr => {
    const matchesCategory = filterCategory === 'all' || attr.category === filterCategory;
    const matchesSearch = searchTerm === '' || 
      attr.attribute_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attr.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!hasServiceKey) {
    return (
      <div className="attributes-page">
        <div className="attributes-container">
          <div className="error-message">
            <h2>Configuração Necessária</h2>
            <p>Configure a Supabase Service Key em Settings para gerenciar atributos.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && attributes.length === 0) {
    return (
      <div className="attributes-page">
        <div className="attributes-container">
          <div className="loading">Carregando atributos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="attributes-page">
      <div className="attributes-container">
        <div className="attributes-header">
          <div>
            <h1>Customer Attributes</h1>
            <p className="subtitle">Gerencie as colunas da tabela customer_360. Adicionar/editar aqui altera automaticamente a tabela.</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-secondary" 
              onClick={handleSync}
              disabled={loading}
            >
              🔄 Sincronizar
            </button>
            <button 
              className="btn-primary" 
              onClick={() => setShowCreateModal(true)}
            >
              + Novo Atributo
            </button>
          </div>
        </div>

        <div className="attributes-filters">
          <input
            type="text"
            placeholder="Buscar atributo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="category-filter"
          >
            {categories.map(cat => (
              <option key={cat} value={cat || ''}>
                {cat === 'all' ? 'Todas as Categorias' : (cat || 'Sem categoria')}
              </option>
            ))}
          </select>
        </div>

        <div className="attributes-grid">
          {filteredAttributes.map(attr => (
            <div key={attr.id} className="attribute-card">
              <div className="attribute-header">
                <div>
                  <h3>{attr.display_name}</h3>
                  <code className="attribute-name">{attr.attribute_name}</code>
                </div>
                <div className="attribute-badges">
                  <span className={`badge badge-${attr.category}`}>{attr.category}</span>
                  <span className="badge badge-type">{attr.data_type}</span>
                </div>
              </div>
              
              {attr.description && (
                <p className="attribute-description">{attr.description}</p>
              )}

              <div className="attribute-properties">
                <div className="property">
                  <span className="property-label">Filtrável:</span>
                  <span className={attr.is_filterable ? 'property-value yes' : 'property-value no'}>
                    {attr.is_filterable ? 'Sim' : 'Não'}
                  </span>
                </div>
                <div className="property">
                  <span className="property-label">Pesquisável:</span>
                  <span className={attr.is_searchable ? 'property-value yes' : 'property-value no'}>
                    {attr.is_searchable ? 'Sim' : 'Não'}
                  </span>
                </div>
                {attr.default_value && (
                  <div className="property">
                    <span className="property-label">Valor Padrão:</span>
                    <span className="property-value">{attr.default_value}</span>
                  </div>
                )}
              </div>

              <div className="attribute-actions">
                <button 
                  className="btn-edit"
                  onClick={() => setEditingAttribute(attr)}
                >
                  Editar
                </button>
                {!attr.is_required && (
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(attr.attribute_name)}
                  >
                    Deletar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredAttributes.length === 0 && (
          <div className="empty-state">
            <p>Nenhum atributo encontrado.</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateAttributeModal
          onClose={() => setShowCreateModal(false)}
          onCreate={async (data) => {
            if (!apiClient) return;
            try {
              await apiClient.createAttribute(data);
              await loadAttributes();
              setShowCreateModal(false);
              alert('Atributo criado com sucesso! Coluna adicionada em customer_360.');
            } catch (error) {
              alert('Erro ao criar atributo: ' + (error as Error).message);
            }
          }}
        />
      )}

      {editingAttribute && (
        <EditAttributeModal
          attribute={editingAttribute}
          onClose={() => setEditingAttribute(null)}
          onUpdate={async (data) => {
            if (!apiClient) return;
            try {
              await apiClient.updateAttribute(editingAttribute.attribute_name, data);
              await loadAttributes();
              setEditingAttribute(null);
              alert('Atributo atualizado com sucesso!');
            } catch (error) {
              alert('Erro ao atualizar atributo: ' + (error as Error).message);
            }
          }}
        />
      )}
    </div>
  );
}

interface CreateAttributeModalProps {
  onClose: () => void;
  onCreate: (data: {
    attribute_name: string;
    display_name: string;
    data_type: string;
    category?: string;
    description?: string;
    default_value?: string;
  }) => void;
}

function CreateAttributeModal({ onClose, onCreate }: CreateAttributeModalProps) {
  const [formData, setFormData] = useState({
    attribute_name: '',
    display_name: '',
    data_type: 'TEXT',
    category: 'custom',
    description: '',
    default_value: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.attribute_name || !formData.display_name) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    onCreate({
      ...formData,
      default_value: formData.default_value || undefined,
      description: formData.description || undefined,
    });
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Novo Atributo</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="field">
            <label>Nome do Atributo (coluna) *</label>
            <input
              type="text"
              value={formData.attribute_name}
              onChange={(e) => setFormData({ ...formData, attribute_name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
              placeholder="ex: customer_score"
              required
              pattern="^[a-z][a-z0-9_]*$"
            />
            <small>Use apenas letras minúsculas, números e underscore. Deve começar com letra.</small>
          </div>

          <div className="field">
            <label>Nome para Exibição *</label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="ex: Customer Score"
              required
            />
          </div>

          <div className="field">
            <label>Tipo de Dado *</label>
            <select
              value={formData.data_type}
              onChange={(e) => setFormData({ ...formData, data_type: e.target.value })}
              required
            >
              <option value="TEXT">TEXT</option>
              <option value="INTEGER">INTEGER</option>
              <option value="NUMERIC">NUMERIC</option>
              <option value="BOOLEAN">BOOLEAN</option>
              <option value="DATE">DATE</option>
              <option value="TIMESTAMP">TIMESTAMP</option>
              <option value="JSONB">JSONB</option>
            </select>
          </div>

          <div className="field">
            <label>Categoria</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="custom">Custom</option>
              <option value="identidade">Identidade</option>
              <option value="pessoal">Pessoal</option>
              <option value="demografia">Demografia</option>
              <option value="financeiro">Financeiro</option>
              <option value="comportamento">Comportamento</option>
              <option value="marketing">Marketing</option>
              <option value="scores">Scores</option>
              <option value="flags">Flags</option>
            </select>
          </div>

          <div className="field">
            <label>Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="field">
            <label>Valor Padrão</label>
            <input
              type="text"
              value={formData.default_value}
              onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
              placeholder="ex: 0, true, 'default'"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Criar Atributo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditAttributeModalProps {
  attribute: CustomerAttribute;
  onClose: () => void;
  onUpdate: (data: {
    display_name?: string;
    data_type?: string;
    category?: string;
    description?: string;
    default_value?: string;
  }) => void;
}

function EditAttributeModal({ attribute, onClose, onUpdate }: EditAttributeModalProps) {
  const [formData, setFormData] = useState({
    display_name: attribute.display_name,
    data_type: attribute.data_type,
    category: attribute.category || 'custom',
    description: attribute.description || '',
    default_value: attribute.default_value || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...formData,
      default_value: formData.default_value || undefined,
      description: formData.description || undefined,
    });
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Atributo: {attribute.attribute_name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="field">
            <label>Nome do Atributo</label>
            <input type="text" value={attribute.attribute_name} disabled />
            <small>O nome da coluna não pode ser alterado.</small>
          </div>

          <div className="field">
            <label>Nome para Exibição *</label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label>Tipo de Dado *</label>
            <select
              value={formData.data_type}
              onChange={(e) => setFormData({ ...formData, data_type: e.target.value })}
              required
            >
              <option value="TEXT">TEXT</option>
              <option value="INTEGER">INTEGER</option>
              <option value="NUMERIC">NUMERIC</option>
              <option value="BOOLEAN">BOOLEAN</option>
              <option value="DATE">DATE</option>
              <option value="TIMESTAMP">TIMESTAMP</option>
              <option value="JSONB">JSONB</option>
            </select>
            <small>⚠️ Alterar o tipo pode causar perda de dados se incompatível!</small>
          </div>

          <div className="field">
            <label>Categoria</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="custom">Custom</option>
              <option value="identidade">Identidade</option>
              <option value="pessoal">Pessoal</option>
              <option value="demografia">Demografia</option>
              <option value="financeiro">Financeiro</option>
              <option value="comportamento">Comportamento</option>
              <option value="marketing">Marketing</option>
              <option value="scores">Scores</option>
              <option value="flags">Flags</option>
            </select>
          </div>

          <div className="field">
            <label>Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="field">
            <label>Valor Padrão</label>
            <input
              type="text"
              value={formData.default_value}
              onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Atualizar Atributo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

