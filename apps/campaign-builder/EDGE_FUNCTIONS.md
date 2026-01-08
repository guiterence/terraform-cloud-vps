# Supabase Edge Functions

Edge Functions para gerenciar Target Groups e outras operações do CRM.

## Arquitetura

```
Frontend (React)
  ↓
Supabase Edge Functions (Deno)
  ↓
PostgreSQL (via Supabase REST API)
```

## Estrutura

```
supabase/
  functions/
    target-groups/     # CRUD de Target Groups
      index.ts
    _shared/           # Código compartilhado
      cors.ts          # Headers CORS
      db.ts            # Cliente de banco de dados
      types.ts         # Tipos TypeScript
```

## Funções Disponíveis

### `target-groups`

Gerencia Target Groups (CRUD completo).

**Base URL:** `https://supabase.terenceconsultoria.com.br/functions/v1/target-groups`

**Endpoints:**
- `GET /target-groups` - Lista todos
- `GET /target-groups/{id}` - Busca por ID
- `POST /target-groups` - Cria novo
- `PUT /target-groups/{id}` - Atualiza
- `DELETE /target-groups/{id}` - Deleta

**Exemplo de uso no Frontend:**

```typescript
import TargetGroupsApiClient from './services/targetGroupsApi';
import { getSupabaseServiceKey } from './services/auth';

const api = new TargetGroupsApiClient(getSupabaseServiceKey()!);

// Listar todos
const groups = await api.listTargetGroups();

// Criar novo
const newGroup = await api.createTargetGroup({
  crm_name: 'High Value Buyers',
  postgres_table: 'target_high_value_buyers',
  description: 'Clientes com alto valor de compra'
});

// Atualizar
await api.updateTargetGroup(id, {
  crm_name: 'Updated Name',
  description: 'New description'
});

// Deletar
await api.deleteTargetGroup(id);
```

## Deploy

### Opção 1: Via Docker Compose (Self-hosted)

As Edge Functions podem ser executadas via Docker Compose usando Deno:

```bash
cd /opt/docker/supabase-functions
docker-compose up -d
```

### Opção 2: Via Supabase CLI (Cloud)

Se você tiver acesso ao Supabase Cloud:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref seu-project-ref

# Deploy
supabase functions deploy target-groups
```

## Variáveis de Ambiente

As seguintes variáveis são necessárias:
- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key para acesso admin

## Notas

- As Edge Functions rodam em Deno (não Node.js)
- Use imports de URLs (ESM) ao invés de npm packages
- CORS está habilitado por padrão
- Service Role Key é necessário para operações admin
- A função `create_target_group_table` deve existir no PostgreSQL (criada via `supabase-init.sql`)

## Função SQL Necessária

A função `create_target_group_table` é criada automaticamente pelo `supabase-init.sql.tpl`:

```sql
CREATE OR REPLACE FUNCTION create_target_group_table(
    table_name TEXT,
    crm_name TEXT
)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255),
            name VARCHAR(255),
            phone VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        -- ... índices e comentários
    ', table_name, ...);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

