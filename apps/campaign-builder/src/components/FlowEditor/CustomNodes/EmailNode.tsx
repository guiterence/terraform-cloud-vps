import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DeleteButton } from './DeleteButton';

export default function EmailNode({ data, id }: NodeProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '2px solid #4CAF50',
        borderRadius: '8px',
        padding: '15px',
        minWidth: '200px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      <DeleteButton nodeId={id} />
      
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>📧</span>
        <strong>Enviar Email</strong>
      </div>
      
      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        {data.subject && (
          <div style={{ marginBottom: '4px' }}>
            <strong>Assunto:</strong> {data.subject}
          </div>
        )}
        {data.to && (
          <div style={{ marginBottom: '4px' }}>
            <strong>Para:</strong> {data.to}
          </div>
        )}
        {data.template && (
          <div style={{ marginBottom: '4px' }}>
            <strong>Template:</strong> {data.template}
          </div>
        )}
        {data.targetGroupName && (
          <div style={{ marginTop: '8px', padding: '6px', background: '#e3f2fd', borderRadius: '4px', fontSize: '11px' }}>
            <strong>Target:</strong> {data.targetGroupName}
          </div>
        )}
        {!data.subject && !data.to && (
          <div style={{ color: '#999', fontStyle: 'italic', marginTop: '8px' }}>
            Duplo clique para configurar
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

