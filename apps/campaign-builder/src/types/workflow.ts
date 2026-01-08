export interface N8NWorkflow {
  id?: string;
  name: string;
  nodes: N8NNode[];
  connections: Record<string, any>;
  active: boolean;
  settings: {
    executionOrder: 'v1' | 'v2';
  };
  tags?: Array<{ id: string; name: string }>;
}

export interface N8NNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
  webhookId?: string;
}

export interface CampaignNode {
  id: string;
  type: 'email' | 'sms' | 'phone' | 'trigger' | 'condition';
  position: { x: number; y: number };
  data: {
    label: string;
    parameters: Record<string, any>;
    credentials?: Record<string, any>;
  };
}

export interface CampaignEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Campaign {
  id?: string;
  name: string;
  description?: string;
  nodes: CampaignNode[];
  edges: CampaignEdge[];
  status: 'draft' | 'active' | 'paused';
  createdAt?: string;
  updatedAt?: string;
  targetGroups?: TargetGroup[];
  abTestConfig?: ABTestConfig;
  schedule?: ScheduleConfig | null;
}

export interface ScheduleConfig {
  enabled: boolean;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  timezone: string;
  recurrence: RecurrenceConfig;
}

export interface RecurrenceConfig {
  type: 'once' | 'daily' | 'weekly' | 'monthly';
  interval?: number; // Para daily: a cada X dias, weekly: a cada X semanas, etc.
  endDate?: string | null; // YYYY-MM-DD
  occurrences?: number | null; // Número de vezes que será executado
}

export interface TargetGroup {
  id: string;
  name: string;
  description?: string;
  filters: TargetFilter[];
  estimatedSize?: number;
}

export interface TargetFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'in' | 'notIn';
  value: any;
}

export interface ABTestConfig {
  enabled: boolean;
  variants: ABTestVariant[];
  splitPercentage: number; // Porcentagem para cada variante
}

export interface ABTestVariant {
  id: string;
  name: string;
  percentage: number;
  nodes: string[]; // IDs dos nós que fazem parte desta variante
}

