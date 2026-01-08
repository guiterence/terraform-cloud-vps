import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import TargetGroupsApiClient, { TargetGroup } from '../../services/targetGroupsApi';

interface NodeEditorModalProps {
  node: Node | null;
  onClose: () => void;
  onSave: (nodeId: string, data: any) => void;
  targetGroupsApi?: TargetGroupsApiClient;
}

export default function NodeEditorModal({ node, onClose, onSave, targetGroupsApi }: NodeEditorModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [targetGroups, setTargetGroups] = useState<TargetGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (node) {
      setFormData(node.data || {});
    }

    // Carregar target groups se disponível
    if (targetGroupsApi && (node?.type === 'trigger' || node?.type === 'email' || node?.type === 'sms' || node?.type === 'phone')) {
      loadTargetGroups();
    }
  }, [node, targetGroupsApi]);

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
    if (!node) return;
    onSave(node.id, formData);
    onClose();
  };

  if (!node) return null;

  const renderEditor = () => {
    switch (node.type) {
      case 'email':
        return (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                }}
              />
            </div>
          </div>
        );

      case 'sms':
        return (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {(formData.message || '').length}/160 caracteres
              </div>
            </div>
          </div>
        );

      case 'phone':
        return (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                }}
              >
                <option value="outbound">Saída</option>
                <option value="inbound">Entrada</option>
                <option value="callback">Callback</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                }}
              />
            </div>
          </div>
        );

      case 'trigger':
        return (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                }}
              />
            </div>
          </div>
        );

      case 'delay':
        return (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                }}
              />
            </div>
          </div>
        );

      default:
        return <div>Editor não disponível para este tipo de nó</div>;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '24px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>
            Configurar {node.type === 'email' ? 'Email' :
                       node.type === 'sms' ? 'SMS' :
                       node.type === 'phone' ? 'Telefone' :
                       node.type === 'trigger' ? 'Trigger' :
                       node.type === 'delay' ? 'Aguardar' :
                       node.type === 'condition' ? 'Condição' :
                       'Nó'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            ×
          </button>
        </div>

        {renderEditor()}

        {/* Target Group Selector - aparece para nós que precisam */}
        {(node.type === 'trigger' || node.type === 'email' || node.type === 'sms' || node.type === 'phone') && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              Target Group
            </label>
            {loading ? (
              <div style={{ color: '#666', fontSize: '14px' }}>Carregando target groups...</div>
            ) : targetGroups.length === 0 ? (
              <div style={{ color: '#999', fontSize: '14px', fontStyle: 'italic' }}>
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
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                Tabela: <code>{formData.targetGroupTable}</code>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#999',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

