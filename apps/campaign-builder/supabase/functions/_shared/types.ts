// Tipos compartilhados entre Edge Functions

export interface TargetGroupMapping {
  id: string;
  crm_name: string;
  postgres_table: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTargetGroupRequest {
  crm_name: string;
  postgres_table: string;
  description?: string;
}

export interface UpdateTargetGroupRequest {
  crm_name?: string;
  description?: string;
}

export interface DatabaseClient {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
}

