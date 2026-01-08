import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DeleteButton } from './DeleteButton';

export default function ScheduleNode({ data, id }: NodeProps) {
  const schedule = data.schedule || {
    startDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    timezone: 'America/Sao_Paulo',
    recurrence: { type: 'once' },
  };

  const getRecurrenceText = () => {
    if (schedule.recurrence.type === 'once') return 'Uma vez';
    if (schedule.recurrence.type === 'daily') {
      const interval = schedule.recurrence.interval || 1;
      return `A cada ${interval} ${interval === 1 ? 'dia' : 'dias'}`;
    }
    if (schedule.recurrence.type === 'weekly') {
      const interval = schedule.recurrence.interval || 1;
      return `A cada ${interval} ${interval === 1 ? 'semana' : 'semanas'}`;
    }
    if (schedule.recurrence.type === 'monthly') {
      const interval = schedule.recurrence.interval || 1;
      return `A cada ${interval} ${interval === 1 ? 'mês' : 'meses'}`;
    }
    return 'Personalizado';
  };

  return (
    <div
      style={{
        background: '#fff',
        border: '2px solid #2196F3',
        borderRadius: '8px',
        padding: '15px',
        minWidth: '220px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'relative',
      }}
    >
      <DeleteButton nodeId={id} />
      <Handle type="target" position={Position.Top} />
      
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>📅</span>
        <strong>Agendamento</strong>
      </div>
      
      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        <div style={{ marginBottom: '4px' }}>
          <strong>Data:</strong> {schedule.startDate}
        </div>
        <div style={{ marginBottom: '4px' }}>
          <strong>Horário:</strong> {schedule.startTime}
        </div>
        <div style={{ marginBottom: '4px' }}>
          <strong>Recorrência:</strong> {getRecurrenceText()}
        </div>
        {schedule.recurrence.endDate && (
          <div style={{ marginBottom: '4px', fontSize: '11px', color: '#999' }}>
            Até: {schedule.recurrence.endDate}
          </div>
        )}
        {schedule.recurrence.occurrences && (
          <div style={{ marginBottom: '4px', fontSize: '11px', color: '#999' }}>
            {schedule.recurrence.occurrences} ocorrências
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

