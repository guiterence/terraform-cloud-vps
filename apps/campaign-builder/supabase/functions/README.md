# Supabase Edge Functions

Edge Functions para gerenciar Target Groups e outras operações do CRM.

## Estrutura

```
supabase/
  functions/
    target-groups/     # CRUD de Target Groups
    _shared/           # Código compartilhado
      cors.ts          # Headers CORS
      db.ts            # Cliente de banco de dados
      types.ts         # Tipos TypeScript
```

## Deploy

### Local (desenvolvimento)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref seu-project-ref

# Deploy de uma função
supabase functions deploy target-groups
```

### Via Terraform (produção)

As Edge Functions podem ser deployadas via Terraform usando o Supabase CLI ou API.

## Funções Disponíveis

### `target-groups`

Gerencia Target Groups (CRUD completo).

**Endpoints:**
- `GET /target-groups` - Lista todos
- `GET /target-groups/{id}` - Busca por ID
- `POST /target-groups` - Cria novo
- `PUT /target-groups/{id}` - Atualiza
- `DELETE /target-groups/{id}` - Deleta

**Exemplo de uso:**

```typescript
// Criar Target Group
const response = await fetch('https://seu-projeto.supabase.co/functions/v1/target-groups', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${serviceKey}`,
  },
  body: JSON.stringify({
    crm_name: 'High Value Buyers',
    postgres_table: 'target_high_value_buyers',
    description: 'Clientes com alto valor de compra'
  })
});
```

## Variáveis de Ambiente

As seguintes variáveis são necessárias (configuradas automaticamente pelo Supabase):
- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key para acesso admin

## Notas

- As Edge Functions rodam em Deno (não Node.js)
- Use imports de URLs (ESM) ao invés de npm packages
- CORS está habilitado por padrão
- Service Role Key é necessário para operações admin

