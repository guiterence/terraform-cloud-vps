import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DeleteButton } from './DeleteButton';

export default function DelayNode({ data, id }: NodeProps) {
  const delay = data.delay || { value: 1, unit: 'days' };

  return (
    <div
      style={{
        background: '#fff',
        border: '2px solid #FFC107',
        borderRadius: '8px',
        padding: '15px',
        minWidth: '180px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'relative',
      }}
    >
      <DeleteButton nodeId={id} />
      <Handle type="target" position={Position.Top} />
      
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>⏱️</span>
        <strong>Aguardar</strong>
      </div>
      
      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        <div>
          <strong>Duração:</strong> {delay.value} {delay.unit === 'days' ? 'dias' : delay.unit === 'hours' ? 'horas' : 'minutos'}
        </div>
        {data.description && (
          <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
            {data.description}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

