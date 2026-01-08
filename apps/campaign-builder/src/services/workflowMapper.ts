import { Node, Edge } from 'reactflow';
import { N8NWorkflow, N8NNode } from '../types/workflow';

export function mapReactFlowToN8N(
  nodes: Node[],
  edges: Edge[],
  campaignName: string
): N8NWorkflow {
  // Mapear nós do ReactFlow para formato N8N
  const n8nNodes: N8NNode[] = nodes.map((node) => {
    const nodeType = node.type || 'default';
    const baseNode: N8NNode = {
      id: node.id,
      name: node.data.label || nodeType,
      type: mapNodeTypeToN8N(nodeType),
      typeVersion: 1,
      position: [node.position.x, node.position.y],
      parameters: node.data.parameters || {},
    };

    // Adicionar credenciais específicas por tipo
    if (node.data.credentials) {
      baseNode.credentials = node.data.credentials;
    }

    // Adicionar webhookId para nós de trigger
    if (node.type === 'trigger' && node.data.webhookId) {
      baseNode.webhookId = node.data.webhookId;
    }

    return baseNode;
  });

  // Mapear conexões (edges) para formato N8N
  const connections: Record<string, any> = {};
  
  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) return;

    if (!connections[edge.source]) {
      connections[edge.source] = {};
    }

    const sourceOutput = edge.sourceHandle || 'main';
    const targetInput = edge.targetHandle || 'main';

    if (!connections[edge.source][sourceOutput]) {
      connections[edge.source][sourceOutput] = [];
    }

    connections[edge.source][sourceOutput].push([
      {
        node: edge.target,
        type: targetInput,
        index: 0,
      },
    ]);
  });

  return {
    name: campaignName,
    nodes: n8nNodes,
    connections,
    active: false, // Ativar manualmente após revisão
    settings: {
      executionOrder: 'v1',
    },
  };
}

function mapNodeTypeToN8N(reactFlowType: string): string {
  const typeMap: Record<string, string> = {
    'email': 'n8n-nodes-base.emailSend',
    'sms': 'n8n-nodes-base.httpRequest', // Para SMS via API (Twilio, etc)
    'phone': 'n8n-nodes-base.httpRequest', // Para chamadas via API
    'trigger': 'n8n-nodes-base.webhook',
    'condition': 'n8n-nodes-base.if',
  };

  return typeMap[reactFlowType] || 'n8n-nodes-base.stickyNote';
}

export function mapN8NToReactFlow(workflow: N8NWorkflow): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = workflow.nodes.map((n8nNode) => ({
    id: n8nNode.id,
    type: mapN8NTypeToReactFlow(n8nNode.type),
    position: { x: n8nNode.position[0], y: n8nNode.position[1] },
    data: {
      label: n8nNode.name,
      parameters: n8nNode.parameters,
      credentials: n8nNode.credentials,
      webhookId: n8nNode.webhookId,
    },
  }));

  const edges: Edge[] = [];
  Object.entries(workflow.connections).forEach(([sourceId, outputs]) => {
    Object.entries(outputs as Record<string, any[]>).forEach(([outputName, connections]) => {
      connections.forEach((connectionArray: any[]) => {
        connectionArray.forEach((connection: { node: string; type: string }) => {
          edges.push({
            id: `${sourceId}-${connection.node}`,
            source: sourceId,
            target: connection.node,
            sourceHandle: outputName,
            targetHandle: connection.type,
          });
        });
      });
    });
  });

  return { nodes, edges };
}

function mapN8NTypeToReactFlow(n8nType: string): string {
  if (n8nType.includes('emailSend')) return 'email';
  if (n8nType.includes('webhook')) return 'trigger';
  if (n8nType.includes('if')) return 'condition';
  if (n8nType.includes('httpRequest')) {
    // Precisaria verificar parâmetros para distinguir SMS de Phone
    return 'sms';
  }
  return 'trigger';
}

