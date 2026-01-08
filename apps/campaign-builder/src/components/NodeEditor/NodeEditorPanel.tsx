import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import TargetGroupsApiClient, { TargetGroup } from '../../services/targetGroupsApi';
import { getSupabaseServiceKey } from '../../services/auth';

interface NodeEditorPanelProps {
  selectedNode: Node | null;
  onNodeUpdate: (nodeId: string, data: any) => void;
  onClose: () => void;
}

export default function NodeEditorPanel({ selectedNode, onNodeUpdate, onClose }: NodeEditorPanelProps) {
  const [formData, setFormData] = useState<any>({});
  const [targetGroups, setTargetGroups] = useState<TargetGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [targetGroupsApi, setTargetGroupsApi] = useState<TargetGroupsApiClient | null>(null);

  // Inicializar API de Target Groups
  useEffect(() => {
    const serviceKey = getSupabaseServiceKey();
    if (serviceKey) {
      setTargetGroupsApi(new TargetGroupsApiClient(serviceKey));
    }
  }, []);

  useEffect(() => {
    if (selectedNode) {
      setFormData(selectedNode.data || {});
      
      // Carregar target groups se necessário
      if (targetGroupsApi && (selectedNode.type === 'trigger' || selectedNode.type === 'email' || selectedNode.type === 'sms' || selectedNode.type === 'phone' || selectedNode.type === 'targetGroup')) {
        loadTargetGroups();
      }
    }
  }, [selectedNode, targetGroupsApi]);

  const loadTargetGroups = async () => {
    if (!targetGroupsApi) return;
    
    setLoading(true);
    try {
      const groups = await targetGroupsApi.listTargetGroups();
      setTargetGroups(groups);
    } catch (error) {
      console.error('Erro ao carregar target groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!selectedNode) return;
    onNodeUpdate(selectedNode.id, formData);
  };

  if (!selectedNode) {
    return (
      <div style={{
        width: '350px',
        height: '100%',
        background: '#fff',
        borderLeft: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: '14px',
      }}>
        Selecione um nó para editar
      </div>
    );
  }

  const renderEditor = () => {
    switch (selectedNode.type) {
      case 'email':
        return (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Assunto
              </label>
              <input
                type="text"
                value={formData.subject || ''}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Assunto do email"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Para (Email)
              </label>
              <input
                type="email"
                value={formData.to || ''}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                placeholder="email@exemplo.com"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Template
              </label>
              <select
                value={formData.template || ''}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                <option value="">Selecione um template</option>
                <option value="newsletter">Newsletter</option>
                <option value="promocao">Promoção</option>
                <option value="boas_vindas">Boas-vindas</option>
                <option value="abandono">Carrinho Abandonado</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Corpo do Email
              </label>
              <textarea
                value={formData.body || ''}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Digite o conteúdo do email aqui..."
                rows={8}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>
        );

      case 'sms':
        return (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Número de Telefone
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+5511999999999"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Mensagem
              </label>
              <textarea
                value={formData.message || ''}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Digite a mensagem SMS aqui..."
                rows={6}
                maxLength={160}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                }}
              />
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                {(formData.message || '').length}/160 caracteres
              </div>
            </div>
          </div>
        );

      case 'phone':
        return (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Número de Telefone
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+5511999999999"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Tipo de Chamada
              </label>
              <select
                value={formData.callType || 'outbound'}
                onChange={(e) => setFormData({ ...formData, callType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                <option value="outbound">Saída</option>
                <option value="inbound">Entrada</option>
                <option value="callback">Callback</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Script da Chamada
              </label>
              <textarea
                value={formData.script || ''}
                onChange={(e) => setFormData({ ...formData, script: e.target.value })}
                placeholder="Digite o script da chamada aqui..."
                rows={6}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>
        );

      case 'trigger':
        return (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Método HTTP
              </label>
              <select
                value={formData.method || 'POST'}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Nome do Trigger
              </label>
              <input
                type="text"
                value={formData.triggerName || ''}
                onChange={(e) => setFormData({ ...formData, triggerName: e.target.value })}
                placeholder="Nome descritivo do trigger"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>
        );

      case 'delay':
        return (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Valor
              </label>
              <input
                type="number"
                min="1"
                value={formData.delay?.value || 1}
                onChange={(e) => setFormData({
                  ...formData,
                  delay: { ...formData.delay, value: parseInt(e.target.value) || 1 }
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Unidade
              </label>
              <select
                value={formData.delay?.unit || 'days'}
                onChange={(e) => setFormData({
                  ...formData,
                  delay: { ...formData.delay, unit: e.target.value }
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                <option value="minutes">Minutos</option>
                <option value="hours">Horas</option>
                <option value="days">Dias</option>
                <option value="weeks">Semanas</option>
              </select>
            </div>
          </div>
        );

      case 'condition':
        return (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Condição
              </label>
              <textarea
                value={formData.condition || ''}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                placeholder="Ex: user.age > 18 AND user.status == 'active'"
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Data de Início
              </label>
              <input
                type="date"
                value={formData.schedule?.startDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({
                  ...formData,
                  schedule: { ...formData.schedule, startDate: e.target.value }
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Horário
              </label>
              <input
                type="time"
                value={formData.schedule?.startTime || '09:00'}
                onChange={(e) => setFormData({
                  ...formData,
                  schedule: { ...formData.schedule, startTime: e.target.value }
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Fuso Horário
              </label>
              <select
                value={formData.schedule?.timezone || 'America/Sao_Paulo'}
                onChange={(e) => setFormData({
                  ...formData,
                  schedule: { ...formData.schedule, timezone: e.target.value }
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                <option value="America/Sao_Paulo">America/Sao_Paulo (BRT)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Recorrência
              </label>
              <select
                value={formData.schedule?.recurrence?.type || 'once'}
                onChange={(e) => setFormData({
                  ...formData,
                  schedule: {
                    ...formData.schedule,
                    recurrence: { ...formData.schedule?.recurrence, type: e.target.value }
                  }
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                <option value="once">Uma vez</option>
                <option value="daily">Diariamente</option>
                <option value="weekly">Semanalmente</option>
                <option value="monthly">Mensalmente</option>
              </select>
            </div>
          </div>
        );

      case 'split':
        return (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Tipo de Divisão
              </label>
              <select
                value={formData.splitType || 'percentage'}
                onChange={(e) => setFormData({ ...formData, splitType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                <option value="percentage">Porcentagem</option>
                <option value="random">Aleatório</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Variantes
              </label>
              {(formData.variants || [{ name: 'Variante A', percentage: 50 }, { name: 'Variante B', percentage: 50 }]).map((variant: any, idx: number) => (
                <div key={idx} style={{ marginBottom: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <input
                    type="text"
                    value={variant.name || ''}
                    onChange={(e) => {
                      const newVariants = [...(formData.variants || [])];
                      newVariants[idx] = { ...newVariants[idx], name: e.target.value };
                      setFormData({ ...formData, variants: newVariants });
                    }}
                    placeholder="Nome da variante"
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      marginBottom: '5px',
                      fontSize: '12px',
                    }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={variant.percentage || 50}
                    onChange={(e) => {
                      const newVariants = [...(formData.variants || [])];
                      newVariants[idx] = { ...newVariants[idx], percentage: parseInt(e.target.value) || 0 };
                      setFormData({ ...formData, variants: newVariants });
                    }}
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  />
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{variant.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'targetGroup':
        return (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                Selecionar Target Group
              </label>
              {loading ? (
                <div style={{ color: '#666', fontSize: '12px' }}>Carregando target groups...</div>
              ) : targetGroups.length === 0 ? (
                <div style={{ color: '#999', fontSize: '12px', fontStyle: 'italic', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                  Nenhum target group disponível. Crie um no CRM primeiro.
                </div>
              ) : (
                <select
                  value={formData.targetGroupId || ''}
                  onChange={(e) => {
                    const selectedGroup = targetGroups.find(g => g.id === e.target.value);
                    setFormData({
                      ...formData,
                      targetGroupId: e.target.value,
                      targetGroupName: selectedGroup?.name,
                      targetGroupTable: selectedGroup?.table_name,
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                >
                  <option value="">Selecione um Target Group</option>
                  {targetGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              )}
              {formData.targetGroupId && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#666', padding: '8px', background: '#e3f2fd', borderRadius: '4px' }}>
                  <strong>Tabela:</strong> <code>{formData.targetGroupTable}</code>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <div style={{ color: '#999', fontSize: '13px' }}>Editor não disponível para este tipo de nó</div>;
    }
  };

  const getNodeTitle = () => {
    if (!selectedNode || !selectedNode.type) return 'Nó';
    const titles: Record<string, string> = {
      'email': '📧 Email',
      'sms': '💬 SMS',
      'phone': '📞 Telefone',
      'trigger': '🔔 Trigger',
      'delay': '⏱️ Aguardar',
      'condition': '🔀 Condição',
      'schedule': '📅 Agendamento',
      'split': '🔀 A/B Test',
      'targetGroup': '🎯 Target Group',
    };
    return titles[selectedNode.type] || selectedNode.type;
  };

  return (
    <div style={{
      width: '350px',
      height: '100%',
      background: '#fff',
      borderLeft: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-2px 0 8px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
          {getNodeTitle()}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#666',
            padding: '0',
            width: '24px',
            height: '24px',
          }}
        >
          ×
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
      }}>
        {renderEditor()}

        {/* Target Group Selector - aparece para nós que precisam */}
        {(selectedNode.type === 'trigger' || selectedNode.type === 'email' || selectedNode.type === 'sms' || selectedNode.type === 'phone') && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '13px' }}>
              Target Group
            </label>
            {loading ? (
              <div style={{ color: '#666', fontSize: '12px' }}>Carregando target groups...</div>
            ) : targetGroups.length === 0 ? (
              <div style={{ color: '#999', fontSize: '12px', fontStyle: 'italic', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                Nenhum target group disponível. Crie um no CRM primeiro.
              </div>
            ) : (
              <select
                value={formData.targetGroupId || ''}
                onChange={(e) => {
                  const selectedGroup = targetGroups.find(g => g.id === e.target.value);
                  setFormData({
                    ...formData,
                    targetGroupId: e.target.value,
                    targetGroupName: selectedGroup?.name,
                    targetGroupTable: selectedGroup?.table_name,
                  });
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                <option value="">Selecione um Target Group</option>
                {targetGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.table_name})
                  </option>
                ))}
              </select>
            )}
            {formData.targetGroupId && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>
                Tabela: <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>{formData.targetGroupTable}</code>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{
        padding: '15px 20px',
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        gap: '10px',
      }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: '10px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
          }}
        >
          Salvar
        </button>
      </div>
    </div>
  );
}

