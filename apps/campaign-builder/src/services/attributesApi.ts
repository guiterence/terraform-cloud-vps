import { getSupabaseServiceKey } from './auth';

export interface CustomerAttribute {
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
  private serviceKey: string | null;
  private baseUrl: string;

  constructor() {
    this.serviceKey = getSupabaseServiceKey();
    this.baseUrl = `${SUPABASE_URL}/functions/v1/customer-attributes`;
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
    return result.data || result;
  }

  async listAttributes(): Promise<CustomerAttribute[]> {
    return await this.request('');
  }

  async getFilterableAttributes(): Promise<CustomerAttribute[]> {
    const all = await this.listAttributes();
    return all.filter(attr => attr.is_filterable);
  }
}

// Singleton instance
let apiClient: AttributesApiClient | null = null;

export function getAttributesApiClient(): AttributesApiClient {
  if (!apiClient) {
    apiClient = new AttributesApiClient();
  }
  return apiClient;
}

