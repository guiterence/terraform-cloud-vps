import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import { isAuthenticated } from './services/auth';
import MainLayout from './components/Layout/MainLayout';
import Login from './components/Auth/Login';
import ForgotPassword from './components/Auth/ForgotPassword';
import Dashboard from './components/Dashboard/Dashboard';
import TargetGroupsPage from './components/TargetGroups/TargetGroupsPage';
import Customer360Page from './components/Customer360/Customer360Page';
import CampaignFlow from './components/FlowEditor/CampaignFlow';
import NodePalette from './components/Sidebar/NodePalette';
import ActionBar from './components/Toolbar/ActionBar';
import NodeEditorPanel from './components/NodeEditor/NodeEditorPanel';
import SettingsPage from './components/Settings/SettingsPage';
import SettingsRoute from './components/Settings/SettingsRoute';
import AIInsightsPage from './components/AIInsights/AIInsightsPage';
import AttributesPage from './components/Attributes/AttributesPage';
import { Node } from 'reactflow';
import './App.css';
import './styles/theme.css';

// Componente de rota protegida
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function CampaignBuilderPage() {
  const [campaignName, setCampaignName] = useState('Nova Campanha');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState<'draft' | 'active' | 'paused'>('draft');
  const [schedule, setSchedule] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const handleNodeAdd = (type: string) => {
    const onNodeAdd = (window as any).__campaignFlowOnNodeAdd;
    if (onNodeAdd) {
      onNodeAdd(type);
    }
  };

  const handleSave = async () => {
    const onSave = (window as any).__campaignFlowOnSave;
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave();
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('✅ Teste concluído! Nenhuma comunicação foi enviada.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleStart = () => {
    if (window.confirm('Deseja iniciar esta campanha?')) {
      setStatus('active');
    }
  };

  const handlePause = () => {
    if (window.confirm('Deseja pausar esta campanha?')) {
      setStatus('paused');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
      <ActionBar
        campaignName={campaignName}
        onNameChange={setCampaignName}
        onSave={handleSave}
        onTest={handleTest}
        onStart={handleStart}
        onPause={handlePause}
        onSettings={() => setShowSettings(true)}
        isSaving={isSaving}
        isTesting={isTesting}
        status={status}
        schedule={schedule}
      />
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <NodePalette onNodeAdd={handleNodeAdd} />
        
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlowProvider>
            <CampaignFlow
              campaignName={campaignName}
              onNameChange={setCampaignName}
              onNodeAdd={handleNodeAdd}
              onSave={handleSave}
              isSaving={isSaving}
              selectedNode={selectedNode}
              onNodeSelect={setSelectedNode}
              onNodeUpdate={(nodeId, data) => {
                const updateFn = (window as any).__campaignFlowOnNodeUpdate;
                if (updateFn) {
                  updateFn(nodeId, data);
                }
                setTimeout(() => {
                  const node = (window as any).__campaignFlowNodes?.find((n: Node) => n.id === nodeId);
                  if (node) setSelectedNode(node);
                }, 50);
              }}
            />
          </ReactFlowProvider>
        </div>

        <NodeEditorPanel
          selectedNode={selectedNode}
          onNodeUpdate={(nodeId, data) => {
            const updateFn = (window as any).__campaignFlowOnNodeUpdate;
            if (updateFn) {
              updateFn(nodeId, data);
            }
          }}
          onClose={() => setSelectedNode(null)}
        />
      </div>

      <SettingsPage
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
                      <Route path="customer-360" element={<Customer360Page />} />
                      <Route path="attributes" element={<AttributesPage />} />
                      <Route path="target-groups" element={<TargetGroupsPage />} />
                      <Route path="campaign-builder" element={<CampaignBuilderPage />} />
                      <Route path="ai-insights" element={<AIInsightsPage />} />
                      <Route path="settings" element={<SettingsRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
