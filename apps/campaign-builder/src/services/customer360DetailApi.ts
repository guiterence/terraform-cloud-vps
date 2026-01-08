// Serviço para buscar dados detalhados de clientes individuais do customer_360
import { getSupabaseServiceKey } from './auth';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://supabase.terenceconsultoria.com.br';

export interface Customer360Detail {
  id: string;
  external_id: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  birth_date: string | null;
  age: number | null;
  uf: string | null;
  city: string | null;
  country: string | null;
  is_active: boolean;
  is_verified: boolean;
  account_status: string | null;
  last_login_at: string | null;
  tier: string | null;
  lifecycle_stage: string | null;
  segment_label: string | null;
  persona: string | null;
  total_deposit: number | string;
  total_withdraw: number | string;
  net_revenue: number | string;
  deposit_count: number;
  withdraw_count: number;
  avg_deposit: number | string | null;
  avg_withdraw: number | string | null;
  first_deposit_at: string | null;
  last_deposit_at: string | null;
  last_withdraw_at: string | null;
  first_activity_at: string | null;
  last_activity_at: string | null;
  days_since_last_activity: number | null;
  activity_frequency: number | null;
  sessions_last_30d: number | null;
  actions_last_30d: number | null;
  acquisition_channel: string | null;
  acquisition_campaign: string | null;
  acquisition_source: string | null;
  last_campaign_at: string | null;
  churn_score: number | string | null;
  engagement_score: number | string | null;
  value_score: number | string | null;
  propensity_score: number | string | null;
  is_high_value: boolean;
  is_churn_risk: boolean;
  is_marketing_optin: boolean;
  attributes: any;
  created_at: string;
  updated_at: string;
}

export interface Customer360ListResponse {
  success: boolean;
  data: Customer360Detail[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class Customer360DetailApiClient {
  private serviceKey: string | null;
  private baseUrl: string;

  constructor() {
    this.serviceKey = getSupabaseServiceKey();
    this.baseUrl = `${SUPABASE_URL}/functions/v1/customer-360`;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    if (!this.serviceKey) {
      throw new Error('Supabase Service Key não configurada');
    }

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
    // Retornar o objeto completo (pode ter success, data, pagination)
    return result;
  }

  async getCustomer(id: string): Promise<Customer360Detail> {
    const result = await this.request(`/${id}`);
    // Se a resposta tiver success: true, retornar data, senão retornar o objeto completo
    if (result.success && result.data) {
      return result.data;
    }
    return result;
  }

  async searchCustomers(search: string = '', page: number = 1, limit: number = 20): Promise<Customer360ListResponse> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const result = await this.request(`?${params.toString()}`);
    
    console.log('Resultado da API customer-360:', result);
    
    // Se a resposta já tiver a estrutura esperada, retornar
    if (result && typeof result === 'object' && result.success !== undefined && result.data !== undefined && result.pagination !== undefined) {
      return result as Customer360ListResponse;
    }
    
    // Se a resposta não tiver o formato esperado, adaptar
    const data = Array.isArray(result) ? result : (result?.data || []);
    const pagination = result?.pagination || {
      page,
      limit,
      total: data.length,
      totalPages: Math.max(1, Math.ceil(data.length / limit))
    };
    
    return {
      success: true,
      data,
      pagination
    };
  }
}

// Singleton instance
let apiClient: Customer360DetailApiClient | null = null;

export function getCustomer360DetailApiClient(): Customer360DetailApiClient {
  if (!apiClient) {
    apiClient = new Customer360DetailApiClient();
  }
  return apiClient;
}

