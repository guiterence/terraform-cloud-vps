import React from 'react';
import { useReactFlow } from 'reactflow';

interface DeleteButtonProps {
  nodeId: string;
}

export function DeleteButton({ nodeId }: DeleteButtonProps) {
  const { deleteElements } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Deseja remover este nó?')) {
      deleteElements({ nodes: [{ id: nodeId }] });
    }
  };

  return (
    <button
      onClick={handleDelete}
      style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        background: '#f44336',
        border: 'none',
        borderRadius: '4px',
        width: '24px',
        height: '24px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        color: 'white',
        padding: 0,
        zIndex: 10,
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#d32f2f';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#f44336';
      }}
      title="Deletar nó"
    >
      🗑️
    </button>
  );
}

