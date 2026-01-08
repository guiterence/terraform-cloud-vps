# Campaign Builder

Frontend React com ReactFlow para criar campanhas de envio de mensagens (Email, SMS, Telefone) integrado com N8N.

## Estrutura

```
apps/campaign-builder/
├── src/
│   ├── components/
│   │   ├── FlowEditor/        # Editor principal com ReactFlow
│   │   ├── Sidebar/           # Paleta de componentes
│   │   └── Toolbar/           # Barra de ações
│   ├── services/
│   │   ├── n8nApi.ts         # Cliente da API do N8N
│   │   ├── workflowMapper.ts # Conversão ReactFlow <-> N8N
│   │   └── auth.ts           # Autenticação JWT
│   └── types/
│       └── workflow.ts       # Tipos TypeScript
```

## Instalação

```bash
cd apps/campaign-builder
npm install
```

## Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
REACT_APP_N8N_URL=https://n8n.terenceconsultoria.com.br/api/v1
REACT_APP_N8N_WEBHOOK_URL=https://n8n.terenceconsultoria.com.br/webhook
```

## Executar

```bash
npm start
```

O app estará disponível em `http://localhost:3000`

## Uso

1. **Configurar API Key do N8N**: 
   - Acesse o N8N: `https://n8n.terenceconsultoria.com.br`
   - Vá em Settings → API
   - Gere uma API Key
   - No frontend, configure a API Key (será salva no localStorage)

2. **Criar Campanha**:
   - Arraste componentes da paleta lateral para o canvas
   - Conecte os nós arrastando das saídas para as entradas
   - Configure cada nó clicando nele
   - Defina o nome da campanha na barra superior
   - Clique em "Salvar no N8N"

3. **Webhook**:
   - O webhook será criado automaticamente: `/webhook/campaign-builder/{timestamp}`
   - Use este webhook para disparar a campanha

## Desenvolvimento

O projeto usa:
- React 18
- TypeScript
- ReactFlow (reactflow-renderer)
- N8N API v1

## Build para Produção

```bash
npm run build
```

Os arquivos estarão em `build/` e podem ser servidos por qualquer servidor web estático.

