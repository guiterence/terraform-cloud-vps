const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://supabase.terenceconsultoria.com.br';
const SUPABASE_SERVICE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_KEY || '';

export interface Campaign {
  id?: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  workflow_data: {
    nodes: any[];
    edges: any[];
  };
  created_at?: string;
  updated_at?: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
}

export interface CreateCampaignData {
  name: string;
  description?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed';
  workflow_data: {
    nodes: any[];
    edges: any[];
  };
  scheduled_at?: string;
}

export interface UpdateCampaignData {
  name?: string;
  description?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed';
  workflow_data?: {
    nodes: any[];
    edges: any[];
  };
  scheduled_at?: string;
}

class CampaignsApiClient {
  private serviceKey: string;
  private baseUrl: string;

  constructor(serviceKey: string) {
    this.serviceKey = serviceKey;
    this.baseUrl = `${SUPABASE_URL}/functions/v1/campaigns`;
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

  async listCampaigns(): Promise<Campaign[]> {
    try {
      return await this.request('');
    } catch (error) {
      console.error('Erro ao listar campanhas:', error);
      throw error;
    }
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    try {
      return await this.request(`/${id}`);
    } catch (error) {
      console.error('Erro ao buscar campanha:', error);
      return null;
    }
  }

  async createCampaign(data: CreateCampaignData): Promise<Campaign> {
    try {
      return await this.request('', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      throw error;
    }
  }

  async updateCampaign(id: string, data: UpdateCampaignData): Promise<Campaign> {
    try {
      return await this.request(`/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Erro ao atualizar campanha:', error);
      throw error;
    }
  }

  async deleteCampaign(id: string): Promise<void> {
    try {
      await this.request(`/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Erro ao deletar campanha:', error);
      throw error;
    }
  }
}

export default CampaignsApiClient;

