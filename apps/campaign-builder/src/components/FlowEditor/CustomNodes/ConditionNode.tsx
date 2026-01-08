import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DeleteButton } from './DeleteButton';

export default function ConditionNode({ data, id }: NodeProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '2px solid #F44336',
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
        <span style={{ fontSize: '20px' }}>🔀</span>
        <strong>Condição</strong>
      </div>
      
      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        {data.condition && (
          <div style={{ marginBottom: '4px' }}>
            <strong>Condição:</strong> {data.condition}
          </div>
        )}
        {!data.condition && (
          <div style={{ color: '#999', fontStyle: 'italic' }}>
            Clique para configurar
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Right} id="true" style={{ top: '30%' }}>
        <div style={{ fontSize: '10px', marginLeft: '5px' }}>Sim</div>
      </Handle>
      <Handle type="source" position={Position.Right} id="false" style={{ top: '70%' }}>
        <div style={{ fontSize: '10px', marginLeft: '5px' }}>Não</div>
      </Handle>
    </div>
  );
}

