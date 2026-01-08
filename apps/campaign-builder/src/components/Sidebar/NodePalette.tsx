import React from 'react';

interface NodeTemplate {
  type: string;
  label: string;
  icon: string;
  color: string;
}

const nodeTemplates: NodeTemplate[] = [
  { type: 'trigger', label: 'Trigger', icon: '🔔', color: '#9C27B0' },
  { type: 'schedule', label: 'Agendamento', icon: '📅', color: '#2196F3' },
  { type: 'targetGroup', label: 'Target Group', icon: '🎯', color: '#E91E63' },
  { type: 'email', label: 'Email', icon: '📧', color: '#4CAF50' },
  { type: 'sms', label: 'SMS', icon: '💬', color: '#2196F3' },
  { type: 'phone', label: 'Telefone', icon: '📞', color: '#FF9800' },
  { type: 'condition', label: 'Condição', icon: '🔀', color: '#F44336' },
  { type: 'delay', label: 'Aguardar', icon: '⏱️', color: '#FFC107' },
  { type: 'split', label: 'A/B Test', icon: '🔀', color: '#9C27B0' },
];

interface NodePaletteProps {
  onNodeAdd: (type: string) => void;
}

export default function NodePalette({ onNodeAdd }: NodePaletteProps) {
  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      style={{
        width: '250px',
        height: '100vh',
        background: '#f5f5f5',
        borderRight: '1px solid #ddd',
        padding: '20px',
        overflowY: 'auto',
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px' }}>
        Componentes
      </h2>
      
      {nodeTemplates.map((template) => (
        <div
          key={template.type}
          draggable
          onDragStart={(e) => handleDragStart(e, template.type)}
          onClick={() => onNodeAdd(template.type)}
          style={{
            padding: '15px',
            margin: '10px 0',
            background: '#fff',
            border: `2px solid ${template.color}`,
            borderRadius: '8px',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.cursor = 'grab';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span style={{ fontSize: '24px' }}>{template.icon}</span>
          <span style={{ fontWeight: 'bold' }}>{template.label}</span>
        </div>
      ))}
      
      <div style={{ marginTop: '30px', padding: '15px', background: '#e3f2fd', borderRadius: '8px' }}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <strong>Dica:</strong> Arraste os componentes para o canvas ou clique para adicionar automaticamente.
        </div>
      </div>
    </div>
  );
}

