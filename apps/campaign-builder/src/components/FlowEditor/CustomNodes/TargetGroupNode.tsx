import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DeleteButton } from './DeleteButton';

export default function TargetGroupNode({ data, id }: NodeProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '2px solid #E91E63',
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
        <span style={{ fontSize: '20px' }}>🎯</span>
        <strong>Target Group</strong>
      </div>
      
      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        {data.targetGroupName ? (
          <div>
            <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
              {data.targetGroupName}
            </div>
            {data.targetGroupTable && (
              <div style={{ fontSize: '11px', color: '#999' }}>
                Tabela: {data.targetGroupTable}
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: '#999', fontStyle: 'italic' }}>
            Selecione um target group
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

