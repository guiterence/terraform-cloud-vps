import { N8NWorkflow } from '../types/workflow';

const N8N_BASE_URL = process.env.REACT_APP_N8N_URL || 'https://n8n.terenceconsultoria.com.br/api/v1';
const WEBHOOK_BASE_URL = process.env.REACT_APP_N8N_WEBHOOK_URL || 'https://n8n.terenceconsultoria.com.br/webhook';

export class N8NApiClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${N8N_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async createWorkflow(workflow: N8NWorkflow) {
    return this.request('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
  }

  async updateWorkflow(id: string, workflow: N8NWorkflow) {
    return this.request(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflow),
    });
  }

  async getWorkflow(id: string) {
    return this.request(`/workflows/${id}`);
  }

  async listWorkflows() {
    return this.request('/workflows');
  }

  async deleteWorkflow(id: string) {
    return this.request(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  async executeWorkflow(id: string, inputData?: any) {
    return this.request(`/workflows/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ data: inputData }),
    });
  }

  async activateWorkflow(id: string) {
    return this.request(`/workflows/${id}/activate`, {
      method: 'POST',
    });
  }

  async deactivateWorkflow(id: string) {
    return this.request(`/workflows/${id}/deactivate`, {
      method: 'POST',
    });
  }

  getWebhookUrl(path: string): string {
    return `${WEBHOOK_BASE_URL}/${path}`;
  }
}

