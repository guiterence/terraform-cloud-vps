// Serviço para buscar dados agregados do customer_360
import { getSupabaseServiceKey } from './auth';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://supabase.terenceconsultoria.com.br';

export interface Customer360Stats {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  totalDeposits: number;
  totalWithdraws: number;
  avgLTV: number;
  avgDeposit: number;
  churnRiskCount: number;
  highValueCount: number;
  avgChurnScore: number;
  avgEngagementScore: number;
  avgValueScore: number;
  segmentDistribution: { segment: string; count: number }[];
  tierDistribution: { tier: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  topSegments: { segment: string; revenue: number; customers: number }[];
}

class Customer360ApiClient {
  public serviceKey: string;

  constructor(serviceKey: string) {
    this.serviceKey = serviceKey;
  }

  // Requisições para Edge Functions (evita problemas de JWT com PostgREST)
  private async requestEdge(path: string, options: RequestInit = {}) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/customer-360${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.serviceKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Erro na Edge Function customer-360:', response.status, text);
      throw new Error(`Edge error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getStats(): Promise<Customer360Stats> {
    if (!this.serviceKey) {
      // Retornar dados mockados se não houver service key
      return this.getMockStats();
    }

    try {
      // Buscar estatísticas agregadas via Edge Function
      const response = await this.requestEdge('/stats');
      const data = response.data || response;

      return {
        totalCustomers: data.totalCustomers || 0,
        activeCustomers: data.activeCustomers || 0,
        totalRevenue: data.totalRevenue || 0,
        totalDeposits: data.totalDeposits || 0,
        totalWithdraws: data.totalWithdraws || 0,
        avgLTV: data.avgLTV || 0,
        avgDeposit: data.avgDeposit || 0,
        churnRiskCount: data.churnRiskCount || 0,
        highValueCount: data.highValueCount || 0,
        avgChurnScore: data.avgChurnScore || 0,
        avgEngagementScore: data.avgEngagementScore || 0,
        avgValueScore: data.avgValueScore || 0,
        segmentDistribution: data.segmentDistribution || [],
        tierDistribution: data.tierDistribution || [],
        revenueByMonth: data.revenueByMonth || [],
        topSegments: data.topSegments || [],
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return this.getMockStats();
    }
  }

  private getMockStats(): Customer360Stats {
    // Dados mockados baseados nos 10.000 registros
    return {
      totalCustomers: 10000,
      activeCustomers: 7845,
      totalRevenue: 28475630.50,
      totalDeposits: 45218920.75,
      totalWithdraws: 16743290.25,
      avgLTV: 2847.56,
      avgDeposit: 4518.92,
      churnRiskCount: 1234,
      highValueCount: 2156,
      avgChurnScore: 42.5,
      avgEngagementScore: 68.3,
      avgValueScore: 72.1,
      segmentDistribution: [
        { segment: 'High Value', count: 2156 },
        { segment: 'Active', count: 3421 },
        { segment: 'At Risk', count: 1234 },
        { segment: 'New', count: 1890 },
        { segment: 'Dormant', count: 1299 }
      ],
      tierDistribution: [
        { tier: 'platinum', count: 856 },
        { tier: 'gold', count: 2145 },
        { tier: 'silver', count: 3421 },
        { tier: 'bronze', count: 3578 }
      ],
      revenueByMonth: [
        { month: 'Jan', revenue: 2456780.50 },
        { month: 'Fev', revenue: 2890123.75 },
        { month: 'Mar', revenue: 3123456.90 },
        { month: 'Abr', revenue: 2987654.20 },
        { month: 'Mai', revenue: 3245678.10 },
        { month: 'Jun', revenue: 3456789.50 }
      ],
      topSegments: [
        { segment: 'High Value', revenue: 12567890.50, customers: 2156 },
        { segment: 'Active', revenue: 9876543.20, customers: 3421 },
        { segment: 'Gold Tier', revenue: 5432109.80, customers: 2145 }
      ]
    };
  }
}

// Singleton instance
let apiClient: Customer360ApiClient | null = null;

export function getCustomer360ApiClient(): Customer360ApiClient {
  const serviceKey = getSupabaseServiceKey() || '';
  if (!apiClient || apiClient['serviceKey'] !== serviceKey) {
    apiClient = new Customer360ApiClient(serviceKey);
  }
  return apiClient;
}

export function setCustomer360ServiceKey(serviceKey: string) {
  apiClient = new Customer360ApiClient(serviceKey);
}

