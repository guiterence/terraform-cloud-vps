import React, { useState } from 'react';

interface ActionBarProps {
  campaignName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onTest?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onSettings?: () => void;
  isSaving?: boolean;
  isTesting?: boolean;
  status?: 'draft' | 'active' | 'paused';
  schedule?: { enabled: boolean; startDate: string; startTime: string } | null;
}

export default function ActionBar({
  campaignName,
  onNameChange,
  onSave,
  onTest,
  onStart,
  onPause,
  onSettings,
  isSaving = false,
  isTesting = false,
  status = 'draft',
  schedule = null,
}: ActionBarProps) {
  const handleStartPause = () => {
    if (status === 'active') {
      onPause?.();
    } else {
      onStart?.();
    }
  };

  return (
    <div style={{
      padding: '15px 20px',
      background: '#fff',
      borderBottom: '2px solid #e0e0e0',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    }}>
      <input
        type="text"
        value={campaignName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Nome da Campanha"
        style={{
          padding: '10px 15px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '14px',
          minWidth: '250px',
          fontWeight: '500',
        }}
      />

      <div style={{
        display: 'flex',
        gap: '10px',
        marginLeft: 'auto',
        alignItems: 'center',
      }}>
        {/* Schedule Badge */}
        {schedule?.enabled && (
          <div style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 'bold',
            background: '#2196F3',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span>📅</span>
            <span>{schedule.startDate} {schedule.startTime}</span>
          </div>
        )}

        {/* Status Badge */}
        <div style={{
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          background:
            status === 'active' ? '#4CAF50' :
            status === 'paused' ? '#FF9800' :
            '#9E9E9E',
          color: 'white',
        }}>
          {status === 'active' ? '● ATIVA' :
           status === 'paused' ? '⏸ PAUSADA' :
           '📝 RASCUNHO'}
        </div>

        {/* Test Button */}
        {onTest && (
          <button
            onClick={onTest}
            disabled={isTesting || isSaving}
            style={{
              padding: '10px 20px',
              background: isTesting ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (isTesting || isSaving) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {isTesting ? '⏳ Testando...' : '🧪 TESTAR'}
          </button>
        )}

        {/* Start/Pause Button */}
        {onStart && (
          <button
            onClick={handleStartPause}
            disabled={isSaving || isTesting || status === 'draft'}
            style={{
              padding: '10px 20px',
              background:
                status === 'active' ? '#FF9800' :
                status === 'paused' ? '#4CAF50' :
                '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (isSaving || isTesting || status === 'draft') ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {status === 'active' ? '⏸ PAUSAR' : '▶ INICIAR'}
          </button>
        )}

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving || isTesting}
          style={{
            padding: '10px 20px',
            background: isSaving ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: (isSaving || isTesting) ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          {isSaving ? '⏳ Salvando...' : '💾 SALVAR'}
        </button>

        {/* Settings Button */}
        {onSettings && (
          <button
            onClick={onSettings}
            style={{
              padding: '10px',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '18px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
            title="Configurações"
          >
            ⚙️
          </button>
        )}
      </div>
    </div>
  );
}
