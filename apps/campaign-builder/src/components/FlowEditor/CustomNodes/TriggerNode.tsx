import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DeleteButton } from './DeleteButton';

export default function TriggerNode({ data, id }: NodeProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '2px solid #9C27B0',
        borderRadius: '8px',
        padding: '15px',
        minWidth: '200px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'relative',
      }}
    >
      <DeleteButton nodeId={id} />
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>🔔</span>
        <strong>Trigger</strong>
      </div>
      
      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        {data.method && (
          <div style={{ marginBottom: '4px' }}>
            <strong>Método:</strong> {data.method}
          </div>
        )}
        {data.targetGroupName && (
          <div style={{ marginTop: '8px', padding: '6px', background: '#e3f2fd', borderRadius: '4px', fontSize: '11px' }}>
            <strong>Target:</strong> {data.targetGroupName}
          </div>
        )}
        {!data.method && (
          <div style={{ color: '#999', fontStyle: 'italic', marginTop: '4px' }}>
            Duplo clique para configurar
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

