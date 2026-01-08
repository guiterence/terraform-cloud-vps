import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DeleteButton } from './DeleteButton';

export default function PhoneNode({ data, id }: NodeProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '2px solid #FF9800',
        borderRadius: '8px',
        padding: '15px',
        minWidth: '200px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'relative',
      }}
    >
      <DeleteButton nodeId={id} />
      <Handle type="target" position={Position.Top} />
      
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>📞</span>
        <strong>Ligar Telefone</strong>
      </div>
      
      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        {data.phone && (
          <div style={{ marginBottom: '4px' }}>
            <strong>Telefone:</strong> {data.phone}
          </div>
        )}
        {data.message && (
          <div style={{ marginBottom: '4px' }}>
            <strong>Mensagem:</strong> {data.message.substring(0, 30)}...
          </div>
        )}
        {data.targetGroupName && (
          <div style={{ marginTop: '8px', padding: '6px', background: '#e3f2fd', borderRadius: '4px', fontSize: '11px' }}>
            <strong>Target:</strong> {data.targetGroupName}
          </div>
        )}
        {!data.phone && !data.message && (
          <div style={{ color: '#999', fontStyle: 'italic', marginTop: '8px' }}>
            Duplo clique para configurar
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

