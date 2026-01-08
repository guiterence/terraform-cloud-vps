import React, { useState, useEffect } from 'react';
import TargetGroupsApiClient from '../../services/targetGroupsApi';
import { getSupabaseServiceKey } from '../../services/auth';
import CreateTargetGroupModal from './CreateTargetGroupModal';
import './TargetGroupsPage.css';

interface TargetGroup {
  id: string;
  name: string;
  description?: string;
  table_name: string;
  created_at: string;
  estimatedSize?: number;
}

export default function TargetGroupsPage() {
  const [targetGroups, setTargetGroups] = useState<TargetGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [apiClient, setApiClient] = useState<TargetGroupsApiClient | null>(null);
  const [hasServiceKey, setHasServiceKey] = useState<boolean>(true);

  useEffect(() => {
    const serviceKey = getSupabaseServiceKey();
    if (serviceKey) {
      setApiClient(new TargetGroupsApiClient(serviceKey));
      setHasServiceKey(true);
    } else {
      // Sem Service Key configurada, não tentar carregar e mostrar mensagem amigável
      setHasServiceKey(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (apiClient) {
      loadTargetGroups();
    }
  }, [apiClient]);

  const loadTargetGroups = async () => {
    if (!apiClient) return;
    
    setLoading(true);
    try {
      const groups = await apiClient.listTargetGroups();
      // Fetch estimated size for each group
      const groupsWithSize = await Promise.all(groups.map(async (group) => {
        try {
          const size = await apiClient.estimateTargetGroupSize(group.table_name);
          return { ...group, estimatedSize: size };
        } catch {
          return { ...group, estimatedSize: 0 };
        }
      }));
      setTargetGroups(groupsWithSize);
    } catch (error) {
      console.error('Erro ao carregar target groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: { crm_name: string; postgres_table: string; description?: string }) => {
    if (!apiClient) return;

    try {
      await apiClient.createTargetGroup(data);
      setShowCreateModal(false);
      loadTargetGroups();
    } catch (error: any) {
      alert(error.message || 'Erro ao criar Target Group');
    }
  };

  const handleDelete = async (id: string, tableName: string) => {
    if (!apiClient) return;
    if (!window.confirm(`Deseja realmente deletar este Target Group e a tabela '${tableName}'?`)) return;

    try {
      await apiClient.deleteTargetGroup(id);
      loadTargetGroups();
    } catch (error: any) {
      alert(error.message || 'Erro ao deletar Target Group');
    }
  };

  return (
    <div className="target-groups">
      <div className="topbar">
        <h1>Target Groups</h1>
        <button
          className="btn"
          onClick={() => setShowCreateModal(true)}
          disabled={!hasServiceKey}
          style={!hasServiceKey ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          + Create Target Group
        </button>
      </div>

      <div className="card">
        {!hasServiceKey ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#777', fontSize: 14 }}>
            Para criar Target Groups, primeiro configure a <strong>Supabase Service Key</strong> em{' '}
            <span style={{ fontWeight: 600 }}>Settings</span>.
          </div>
        ) : loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            Carregando...
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Customers</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {targetGroups.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    Nenhum Target Group criado ainda.
                  </td>
                </tr>
              ) : (
                targetGroups.map((group) => (
                  <tr key={group.id}>
                    <td>{group.name}</td>
                    <td>SQL Query</td>
                    <td>{group.estimatedSize !== undefined ? group.estimatedSize.toLocaleString() : '-'}</td>
                    <td>
                      <span className="badge">Active</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <CreateTargetGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

