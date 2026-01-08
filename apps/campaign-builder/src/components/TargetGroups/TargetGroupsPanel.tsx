import React, { useState } from 'react';
import { TargetGroup, TargetFilter } from '../../types/workflow';

interface TargetGroupsPanelProps {
  targetGroups: TargetGroup[];
  onTargetGroupsChange: (groups: TargetGroup[]) => void;
}

export default function TargetGroupsPanel({ targetGroups, onTargetGroupsChange }: TargetGroupsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TargetGroup | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup: TargetGroup = {
      id: `tg-${Date.now()}`,
      name: newGroupName,
      description: newGroupDescription,
      filters: [],
      estimatedSize: 0,
    };

    onTargetGroupsChange([...targetGroups, newGroup]);
    setNewGroupName('');
    setNewGroupDescription('');
    setShowCreateForm(false);
  };

  const handleDeleteGroup = (id: string) => {
    onTargetGroupsChange(targetGroups.filter(g => g.id !== id));
  };

  const handleAddFilter = (groupId: string) => {
    const group = targetGroups.find(g => g.id === groupId);
    if (!group) return;

    const newFilter: TargetFilter = {
      field: 'email',
      operator: 'contains',
      value: '',
    };

    const updatedGroups = targetGroups.map(g =>
      g.id === groupId
        ? { ...g, filters: [...g.filters, newFilter] }
        : g
    );

    onTargetGroupsChange(updatedGroups);
  };

  const handleFilterChange = (groupId: string, filterIndex: number, updates: Partial<TargetFilter>) => {
    const updatedGroups = targetGroups.map(g => {
      if (g.id === groupId) {
        const updatedFilters = [...g.filters];
        updatedFilters[filterIndex] = { ...updatedFilters[filterIndex], ...updates };
        return { ...g, filters: updatedFilters };
      }
      return g;
    });

    onTargetGroupsChange(updatedGroups);
  };

  const handleRemoveFilter = (groupId: string, filterIndex: number) => {
    const updatedGroups = targetGroups.map(g => {
      if (g.id === groupId) {
        return { ...g, filters: g.filters.filter((_, i) => i !== filterIndex) };
      }
      return g;
    });

    onTargetGroupsChange(updatedGroups);
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: isOpen ? '400px' : '50px',
      height: '100%',
      background: '#fff',
      borderLeft: '1px solid #e0e0e0',
      transition: 'width 0.3s ease',
      zIndex: 10,
      boxShadow: isOpen ? '-2px 0 8px rgba(0,0,0,0.1)' : 'none',
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          left: isOpen ? '-40px' : '10px',
          top: '20px',
          padding: '8px 12px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold',
        }}
      >
        {isOpen ? '◀' : '🎯'}
      </button>

      {isOpen && (
        <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
            🎯 Target Groups
          </h3>

          {!showCreateForm ? (
            <>
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginBottom: '20px',
                  fontWeight: 'bold',
                }}
              >
                + Criar Target Group
              </button>

              {targetGroups.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                  <p>Nenhum target group criado</p>
                  <p style={{ fontSize: '12px' }}>Crie grupos para segmentar seus alvos</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {targetGroups.map((group) => (
                    <div
                      key={group.id}
                      style={{
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '15px',
                        background: selectedGroup?.id === group.id ? '#f5f5f5' : '#fff',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{group.name}</h4>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          style={{
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      {group.description && (
                        <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>{group.description}</p>
                      )}

                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Filtros:</div>
                        {group.filters.length === 0 ? (
                          <p style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>Nenhum filtro</p>
                        ) : (
                          group.filters.map((filter, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: '#f9f9f9',
                                padding: '8px',
                                borderRadius: '4px',
                                marginBottom: '5px',
                                fontSize: '11px',
                              }}
                            >
                              <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '5px' }}>
                                <select
                                  value={filter.field}
                                  onChange={(e) => handleFilterChange(group.id, idx, { field: e.target.value })}
                                  style={{ flex: 1, padding: '4px', fontSize: '11px' }}
                                >
                                  <option value="email">Email</option>
                                  <option value="name">Nome</option>
                                  <option value="age">Idade</option>
                                  <option value="city">Cidade</option>
                                  <option value="status">Status</option>
                                  <option value="lastPurchase">Última Compra</option>
                                </select>
                                <select
                                  value={filter.operator}
                                  onChange={(e) => handleFilterChange(group.id, idx, { operator: e.target.value as any })}
                                  style={{ flex: 1, padding: '4px', fontSize: '11px' }}
                                >
                                  <option value="equals">Igual a</option>
                                  <option value="contains">Contém</option>
                                  <option value="greaterThan">Maior que</option>
                                  <option value="lessThan">Menor que</option>
                                  <option value="in">Está em</option>
                                  <option value="notIn">Não está em</option>
                                </select>
                                <button
                                  onClick={() => handleRemoveFilter(group.id, idx)}
                                  style={{
                                    background: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '4px 6px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                              <input
                                type="text"
                                value={filter.value || ''}
                                onChange={(e) => handleFilterChange(group.id, idx, { value: e.target.value })}
                                placeholder="Valor"
                                style={{
                                  width: '100%',
                                  padding: '4px',
                                  fontSize: '11px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                }}
                              />
                            </div>
                          ))
                        )}
                        <button
                          onClick={() => handleAddFilter(group.id)}
                          style={{
                            width: '100%',
                            padding: '6px',
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            marginTop: '8px',
                          }}
                        >
                          + Adicionar Filtro
                        </button>
                      </div>

                      {group.estimatedSize !== undefined && (
                        <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
                          <strong>Estimativa:</strong> {group.estimatedSize.toLocaleString()} contatos
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div>
              <h4 style={{ marginTop: 0 }}>Criar Target Group</h4>
              <input
                type="text"
                placeholder="Nome do grupo"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              <textarea
                placeholder="Descrição (opcional)"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '60px',
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleCreateGroup}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Criar
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewGroupName('');
                    setNewGroupDescription('');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#999',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

