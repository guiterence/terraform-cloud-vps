import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DeleteButton } from './DeleteButton';

export default function SplitNode({ data, id }: NodeProps) {
  const splitType = data.splitType || 'percentage';
  const variants = data.variants || [
    { name: 'Variante A', percentage: 50 },
    { name: 'Variante B', percentage: 50 },
  ];

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
      <Handle type="target" position={Position.Top} />
      
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>🔀</span>
        <strong>A/B Test</strong>
      </div>
      
      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>Tipo:</strong> {splitType === 'percentage' ? 'Porcentagem' : 'Aleatório'}
        </div>
        {variants.map((variant: any, idx: number) => (
          <div
            key={idx}
            style={{
              background: '#f5f5f5',
              padding: '6px',
              borderRadius: '4px',
              marginBottom: '4px',
              fontSize: '11px',
            }}
          >
            <strong>{variant.name}:</strong> {variant.percentage}%
          </div>
        ))}
      </div>
      
      {variants.map((_: any, idx: number) => (
        <Handle
          key={idx}
          type="source"
          position={Position.Bottom}
          id={`variant-${idx}`}
          style={{
            left: `${(idx + 1) * (100 / (variants.length + 1))}%`,
          }}
        />
      ))}
    </div>
  );
}

