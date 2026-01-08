import React, { useState } from 'react';
import { ScheduleConfig } from '../../types/workflow';

interface SchedulePanelProps {
  schedule: ScheduleConfig | null;
  onScheduleChange: (schedule: ScheduleConfig | null) => void;
}

export default function SchedulePanel({ schedule, onScheduleChange }: SchedulePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSchedule, setLocalSchedule] = useState<ScheduleConfig>(
    schedule || {
      enabled: false,
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      timezone: 'America/Sao_Paulo',
      recurrence: {
        type: 'once',
        interval: 1,
        endDate: null,
        occurrences: null,
      },
    }
  );

  const handleSave = () => {
    onScheduleChange(localSchedule.enabled ? localSchedule : null);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalSchedule(schedule || {
      enabled: false,
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      timezone: 'America/Sao_Paulo',
      recurrence: {
        type: 'once',
        interval: 1,
        endDate: null,
        occurrences: null,
      },
    });
    setIsOpen(false);
  };

  const getRecurrenceText = () => {
    if (!localSchedule.enabled) return 'Desativado';
    if (localSchedule.recurrence.type === 'once') return 'Uma vez';
    if (localSchedule.recurrence.type === 'daily') {
      const interval = localSchedule.recurrence.interval || 1;
      return `A cada ${interval} ${interval === 1 ? 'dia' : 'dias'}`;
    }
    if (localSchedule.recurrence.type === 'weekly') {
      const interval = localSchedule.recurrence.interval || 1;
      return `A cada ${interval} ${interval === 1 ? 'semana' : 'semanas'}`;
    }
    if (localSchedule.recurrence.type === 'monthly') {
      const interval = localSchedule.recurrence.interval || 1;
      return `A cada ${interval} ${interval === 1 ? 'mês' : 'meses'}`;
    }
    return 'Personalizado';
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: isOpen ? '400px' : '50px',
      height: '100%',
      background: '#fff',
      borderRight: '1px solid #e0e0e0',
      transition: 'width 0.3s ease',
      zIndex: 10,
      boxShadow: isOpen ? '2px 0 8px rgba(0,0,0,0.1)' : 'none',
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          right: isOpen ? '-40px' : '10px',
          top: '20px',
          padding: '8px 12px',
          background: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold',
        }}
      >
        {isOpen ? '▶' : '📅'}
      </button>

      {isOpen && (
        <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
            📅 Agendamento
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={localSchedule.enabled}
                onChange={(e) => setLocalSchedule({ ...localSchedule, enabled: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <strong>Ativar agendamento</strong>
            </label>
          </div>

          {localSchedule.enabled && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                  Data de Início
                </label>
                <input
                  type="date"
                  value={localSchedule.startDate}
                  onChange={(e) => setLocalSchedule({ ...localSchedule, startDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                  Horário
                </label>
                <input
                  type="time"
                  value={localSchedule.startTime}
                  onChange={(e) => setLocalSchedule({ ...localSchedule, startTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                  Fuso Horário
                </label>
                <select
                  value={localSchedule.timezone}
                  onChange={(e) => setLocalSchedule({ ...localSchedule, timezone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                >
                  <option value="America/Sao_Paulo">America/Sao_Paulo (BRT)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                  Recorrência
                </label>
                <select
                  value={localSchedule.recurrence.type}
                  onChange={(e) => setLocalSchedule({
                    ...localSchedule,
                    recurrence: {
                      ...localSchedule.recurrence,
                      type: e.target.value as any,
                      endDate: null,
                      occurrences: null,
                    },
                  })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginBottom: '10px',
                  }}
                >
                  <option value="once">Uma vez</option>
                  <option value="daily">Diariamente</option>
                  <option value="weekly">Semanalmente</option>
                  <option value="monthly">Mensalmente</option>
                </select>

                {localSchedule.recurrence.type !== 'once' && (
                  <>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px' }}>
                        Intervalo
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={localSchedule.recurrence.interval || 1}
                        onChange={(e) => setLocalSchedule({
                          ...localSchedule,
                          recurrence: {
                            ...localSchedule.recurrence,
                            interval: parseInt(e.target.value) || 1,
                          },
                        })}
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                        <input
                          type="radio"
                          name="endType"
                          checked={!localSchedule.recurrence.endDate && !localSchedule.recurrence.occurrences}
                          onChange={() => setLocalSchedule({
                            ...localSchedule,
                            recurrence: {
                              ...localSchedule.recurrence,
                              endDate: null,
                              occurrences: null,
                            },
                          })}
                        />
                        Sem fim
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', marginTop: '5px' }}>
                        <input
                          type="radio"
                          name="endType"
                          checked={!!localSchedule.recurrence.endDate}
                          onChange={() => setLocalSchedule({
                            ...localSchedule,
                            recurrence: {
                              ...localSchedule.recurrence,
                              endDate: new Date().toISOString().split('T')[0],
                              occurrences: null,
                            },
                          })}
                        />
                        Até data específica
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', marginTop: '5px' }}>
                        <input
                          type="radio"
                          name="endType"
                          checked={!!localSchedule.recurrence.occurrences}
                          onChange={() => setLocalSchedule({
                            ...localSchedule,
                            recurrence: {
                              ...localSchedule.recurrence,
                              endDate: null,
                              occurrences: 10,
                            },
                          })}
                        />
                        Número de ocorrências
                      </label>
                    </div>

                    {localSchedule.recurrence.endDate && (
                      <div style={{ marginBottom: '10px' }}>
                        <input
                          type="date"
                          value={localSchedule.recurrence.endDate}
                          onChange={(e) => setLocalSchedule({
                            ...localSchedule,
                            recurrence: {
                              ...localSchedule.recurrence,
                              endDate: e.target.value,
                            },
                          })}
                          style={{
                            width: '100%',
                            padding: '6px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    )}

                    {localSchedule.recurrence.occurrences && (
                      <div style={{ marginBottom: '10px' }}>
                        <input
                          type="number"
                          min="1"
                          value={localSchedule.recurrence.occurrences}
                          onChange={(e) => setLocalSchedule({
                            ...localSchedule,
                            recurrence: {
                              ...localSchedule.recurrence,
                              occurrences: parseInt(e.target.value) || 1,
                            },
                          })}
                          style={{
                            width: '100%',
                            padding: '6px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{
                background: '#e3f2fd',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '12px',
              }}>
                <strong>Resumo:</strong>
                <div style={{ marginTop: '5px' }}>
                  {localSchedule.startDate} às {localSchedule.startTime} ({localSchedule.timezone})
                </div>
                <div>
                  {getRecurrenceText()}
                  {localSchedule.recurrence.endDate && ` até ${localSchedule.recurrence.endDate}`}
                  {localSchedule.recurrence.occurrences && ` por ${localSchedule.recurrence.occurrences} ocorrências`}
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '10px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Salvar
            </button>
            <button
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: '10px',
                background: '#999',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

