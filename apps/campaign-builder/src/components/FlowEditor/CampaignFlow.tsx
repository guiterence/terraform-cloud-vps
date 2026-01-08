import React, { useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { nodeTypes } from './NodeTypes';
// N8N removido - campanhas serão salvas diretamente no PostgreSQL via Supabase

interface CampaignFlowProps {
  campaignName: string;
  onNameChange: (name: string) => void;
  onNodeAdd?: (type: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
  selectedNode?: Node | null;
  onNodeSelect?: (node: Node | null) => void;
  onNodeUpdate?: (nodeId: string, data: any) => void;
}

export default function CampaignFlow({ 
  campaignName, 
  onNameChange,
  onNodeAdd: externalOnNodeAdd,
  onSave: externalOnSave,
  isSaving: externalIsSaving,
  selectedNode: externalSelectedNode,
  onNodeSelect: externalOnNodeSelect,
  onNodeUpdate: externalOnNodeUpdate,
}: CampaignFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [internalSelectedNode, setInternalSelectedNode] = useState<Node | null>(null);
  const nodeIdRef = useRef(0);

  // Usar selectedNode externo se fornecido, senão usar interno
  const currentSelectedNode = externalSelectedNode !== undefined ? externalSelectedNode : internalSelectedNode;
  
  const setSelectedNode = (node: Node | null) => {
    if (externalOnNodeSelect) {
      externalOnNodeSelect(node);
    } else {
      setInternalSelectedNode(node);
    }
  };

  const handleNodeUpdate = (nodeId: string, data: any) => {
    if (externalOnNodeUpdate) {
      externalOnNodeUpdate(nodeId, data);
    } else {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } }
            : node
        )
      );
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `node-${nodeIdRef.current++}`,
        type,
        position,
        data: {
          label: type === 'trigger' ? 'Webhook Trigger' : 
                type === 'schedule' ? 'Agendamento' :
                type === 'targetGroup' ? 'Target Group' :
                type === 'email' ? 'Enviar Email' :
                type === 'sms' ? 'Enviar SMS' :
                type === 'phone' ? 'Ligar Telefone' :
                type === 'delay' ? 'Aguardar' :
                type === 'split' ? 'A/B Test' :
                'Condição',
          parameters: {},
          delay: type === 'delay' ? { value: 1, unit: 'days' } : undefined,
          splitType: type === 'split' ? 'percentage' : undefined,
          variants: type === 'split' ? [
            { name: 'Variante A', percentage: 50 },
            { name: 'Variante B', percentage: 50 },
          ] : undefined,
          schedule: type === 'schedule' ? {
            startDate: new Date().toISOString().split('T')[0],
            startTime: '09:00',
            timezone: 'America/Sao_Paulo',
            recurrence: { type: 'once' },
          } : undefined,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeAdd = useCallback((type: string) => {
    if (!reactFlowInstance) return;

    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
    };

    const newNode: Node = {
      id: `node-${nodeIdRef.current++}`,
      type,
      position,
        data: {
          label: type === 'trigger' ? 'Webhook Trigger' : 
              type === 'schedule' ? 'Agendamento' :
              type === 'targetGroup' ? 'Target Group' :
              type === 'email' ? 'Enviar Email' :
              type === 'sms' ? 'Enviar SMS' :
              type === 'phone' ? 'Ligar Telefone' :
              type === 'delay' ? 'Aguardar' :
              type === 'split' ? 'A/B Test' :
              type === 'targetGroup' ? 'Target Group' :
              'Condição',
          parameters: {},
          webhookUrl: type === 'trigger' 
            ? `/api/campaigns/${Date.now()}/webhook` // TODO: Implementar webhook via Supabase Edge Functions
            : undefined,
          delay: type === 'delay' ? { value: 1, unit: 'days' } : undefined,
          splitType: type === 'split' ? 'percentage' : undefined,
          variants: type === 'split' ? [
            { name: 'Variante A', percentage: 50 },
            { name: 'Variante B', percentage: 50 },
          ] : undefined,
          schedule: type === 'schedule' ? {
            startDate: new Date().toISOString().split('T')[0],
            startTime: '09:00',
            timezone: 'America/Sao_Paulo',
            recurrence: { type: 'once' },
          } : undefined,
          targetGroupId: type === 'targetGroup' ? undefined : undefined,
          targetGroupName: type === 'targetGroup' ? undefined : undefined,
          targetGroupTable: type === 'targetGroup' ? undefined : undefined,
        },
    };

    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes]);

  // Expor onNodeAdd para componente pai
  useEffect(() => {
    if (externalOnNodeAdd) {
      (window as any).__campaignFlowOnNodeAdd = onNodeAdd;
    }
  }, [onNodeAdd, externalOnNodeAdd]);

  const onSave = useCallback(async () => {
    if (nodes.length === 0) {
      alert('Adicione pelo menos um nó à campanha.');
      return;
    }

    setIsSaving(true);
    try {
      // Importar dinamicamente para evitar erro se não estiver configurado
      const { default: CampaignsApiClient } = await import('../../services/campaignsApi');
      const { getSupabaseServiceKey } = await import('../../services/auth');

      const serviceKey = getSupabaseServiceKey();
      if (!serviceKey) {
        alert('Por favor, configure a Supabase Service Key nas configurações (⚙️).');
        setIsSaving(false);
        return;
      }

      const apiClient = new CampaignsApiClient(serviceKey);

      const campaignData = {
        name: campaignName,
        workflow_data: {
          nodes: nodes.map(n => ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: n.data,
          })),
          edges: edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
          })),
        },
        status: 'draft' as const,
      };

      const result = await apiClient.createCampaign(campaignData);
      console.log('Campanha salva:', result);
      alert('Campanha salva com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert(`Erro ao salvar campanha: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, campaignName]);

  // Expor onSave para componente pai
  useEffect(() => {
    if (externalOnSave) {
      (window as any).__campaignFlowOnSave = onSave;
      (window as any).__campaignFlowIsSaving = isSaving;
    }
  }, [onSave, isSaving, externalOnSave]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        style={{ flex: 1 }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

