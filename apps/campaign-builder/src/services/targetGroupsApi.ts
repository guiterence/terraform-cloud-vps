const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://supabase.terenceconsultoria.com.br';
const SUPABASE_SERVICE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_KEY || '';

export interface TargetGroup {
  id: string;
  name: string;
  description?: string;
  table_name: string; // Nome da tabela no PostgreSQL
  created_at: string;
  updated_at: string;
}

export interface TargetGroupMapping {
  id: string;
  crm_name: string; // Nome no CRM
  postgres_table: string; // Nome da tabela no PostgreSQL (apenas referência, não cria tabela)
  description?: string; // Descrição opcional
  sql_query?: string | null; // Query SQL para filtrar/agregar dados
  created_at: string;
  updated_at?: string;
}

export interface CreateTargetGroupData {
  crm_name: string;
  postgres_table: string;
  description?: string;
  sql_query?: string;
}

export interface UpdateTargetGroupData {
  crm_name?: string;
  description?: string;
}

class TargetGroupsApiClient {
  private serviceKey: string;
  private baseUrl: string;

  constructor(serviceKey: string) {
    this.serviceKey = serviceKey;
    // Usar Edge Functions ao invés de REST API direta
    this.baseUrl = `${SUPABASE_URL}/functions/v1/target-groups`;
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

  /**
   * Lista todos os Target Groups
   */
  async listTargetGroups(): Promise<TargetGroup[]> {
    try {
      const mappings: TargetGroupMapping[] = await this.request('');
      
      // Converter mapeamentos para TargetGroup
      return mappings.map(mapping => ({
        id: mapping.id,
        name: mapping.crm_name,
        table_name: mapping.postgres_table,
        description: mapping.description,
        created_at: mapping.created_at,
        updated_at: mapping.updated_at || mapping.created_at,
      }));
    } catch (error) {
      console.error('Erro ao listar target groups:', error);
      throw error;
    }
  }

  /**
   * Busca informações de um target group específico
   */
  async getTargetGroup(id: string): Promise<TargetGroup | null> {
    try {
      const mapping: TargetGroupMapping = await this.request(`/${id}`);

      return {
        id: mapping.id,
        name: mapping.crm_name,
        table_name: mapping.postgres_table,
        description: mapping.description,
        created_at: mapping.created_at,
        updated_at: mapping.updated_at || mapping.created_at,
      };
    } catch (error) {
      console.error('Erro ao buscar target group:', error);
      return null;
    }
  }

  /**
   * Cria um novo Target Group
   */
  async createTargetGroup(data: CreateTargetGroupData): Promise<TargetGroup> {
    try {
      const mapping: TargetGroupMapping = await this.request('', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return {
        id: mapping.id,
        name: mapping.crm_name,
        table_name: mapping.postgres_table,
        description: mapping.description,
        created_at: mapping.created_at,
        updated_at: mapping.updated_at || mapping.created_at,
      };
    } catch (error) {
      console.error('Erro ao criar target group:', error);
      throw error;
    }
  }

  /**
   * Atualiza um Target Group
   */
  async updateTargetGroup(id: string, data: UpdateTargetGroupData): Promise<TargetGroup> {
    try {
      const mapping: TargetGroupMapping = await this.request(`/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      return {
        id: mapping.id,
        name: mapping.crm_name,
        table_name: mapping.postgres_table,
        description: mapping.description,
        created_at: mapping.created_at,
        updated_at: mapping.updated_at || mapping.created_at,
      };
    } catch (error) {
      console.error('Erro ao atualizar target group:', error);
      throw error;
    }
  }

  /**
   * Deleta um Target Group
   */
  async deleteTargetGroup(id: string): Promise<void> {
    try {
      await this.request(`/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Erro ao deletar target group:', error);
      throw error;
    }
  }

  /**
   * Estima o número de contatos em um target group
   */
  async estimateTargetGroupSize(tableName: string): Promise<number> {
    try {
      // Usar Supabase REST API direta para contar registros
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=id&limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.serviceKey,
          'Authorization': `Bearer ${this.serviceKey}`,
          'Prefer': 'count=exact',
        },
      });

      if (!response.ok) {
        return 0;
      }

      const count = response.headers.get('content-range')?.split('/')[1];
      return parseInt(count || '0', 10);
    } catch (error) {
      console.error('Erro ao estimar tamanho do target group:', error);
      return 0;
    }
  }
}

export default TargetGroupsApiClient;
