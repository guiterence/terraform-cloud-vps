# Provisionamento de Schema do CRM

Este diretório contém scripts para provisionar todas as tabelas necessárias para o CRM/Campaign Builder.

## Arquivos

- `provision-schema.sql` - Script SQL completo para criar todas as tabelas, índices, funções e views

## Tabelas Criadas

### 1. `target_group_mappings`
Mapeia Target Groups do CRM para tabelas no PostgreSQL.

**Colunas:**
- `id` (UUID) - ID único
- `crm_name` (TEXT) - Nome do Target Group no CRM
- `postgres_table` (TEXT) - Nome da tabela no PostgreSQL
- `description` (TEXT) - Descrição opcional
- `created_at`, `updated_at` (TIMESTAMPTZ) - Timestamps

### 2. `campaigns`
Armazena campanhas de marketing criadas no Campaign Builder.

**Colunas:**
- `id` (UUID) - ID único
- `name` (TEXT) - Nome da campanha
- `description` (TEXT) - Descrição opcional
- `status` (TEXT) - Status: 'draft', 'active', 'paused', 'completed'
- `workflow_data` (JSONB) - Dados do workflow (nodes e edges do ReactFlow)
- `created_by` (UUID) - Referência ao usuário criador
- `scheduled_at`, `started_at`, `completed_at` (TIMESTAMPTZ) - Timestamps de execução

### 3. `campaign_executions`
Registra execuções de campanhas (para histórico e analytics).

**Colunas:**
- `id` (UUID) - ID único
- `campaign_id` (UUID) - Referência à campanha
- `execution_type` (TEXT) - Tipo: 'manual', 'scheduled', 'triggered'
- `status` (TEXT) - Status: 'running', 'completed', 'failed', 'cancelled'
- `execution_data` (JSONB) - Dados da execução
- `metrics` (JSONB) - Métricas da execução

### 4. `campaign_recipients`
Registra destinatários de campanhas com tracking de status.

**Colunas:**
- `id` (UUID) - ID único
- `campaign_id` (UUID) - Referência à campanha
- `execution_id` (UUID) - Referência à execução
- `customer_id`, `email`, `phone` (TEXT) - Dados do destinatário
- `channel` (TEXT) - Canal: 'email', 'sms', 'phone', 'push'
- `status` (TEXT) - Status: 'pending', 'sent', 'delivered', 'opened', 'clicked', 'failed'
- `sent_at`, `delivered_at`, `opened_at`, `clicked_at` (TIMESTAMPTZ) - Timestamps de eventos

### 5. `customer_360`
Dados consolidados de Customer 360.

**Colunas:**
- `id` (UUID) - ID único
- `customer_id` (TEXT) - ID único do cliente
- `email`, `name`, `phone` (TEXT) - Dados básicos
- `segment` (TEXT) - Segmento do cliente
- `churn_risk` (TEXT) - Risco de churn: 'low', 'medium', 'high'
- `ltv` (NUMERIC) - Lifetime Value
- `total_deposit`, `total_withdraw` (NUMERIC) - Valores financeiros
- `last_activity_at` (TIMESTAMPTZ) - Última atividade
- `metadata` (JSONB) - Dados adicionais

### 6. `customer_activities`
Timeline de atividades dos clientes.

**Colunas:**
- `id` (UUID) - ID único
- `customer_id` (TEXT) - ID do cliente
- `activity_type` (TEXT) - Tipo de atividade
- `activity_description` (TEXT) - Descrição
- `activity_data` (JSONB) - Dados da atividade
- `created_at` (TIMESTAMPTZ) - Timestamp

## Views Criadas

### 1. `active_campaigns`
View com campanhas ativas e contagens de destinatários.

### 2. `campaign_metrics`
View com métricas detalhadas de campanhas (taxa de abertura, clique, etc).

## Como Executar

### Opção 1: Via psql direto
```bash
psql -U guilhermeterence -d postgres -f provision-schema.sql
```

### Opção 2: Via Docker
```bash
# Copiar arquivo para o container
docker cp provision-schema.sql postgres:/tmp/provision-schema.sql

# Executar
docker exec -i postgres psql -U guilhermeterence -d postgres -f /tmp/provision-schema.sql
```

### Opção 3: Via Terraform (recomendado)
O script já está integrado no `supabase-init.sql.tpl` e será executado automaticamente durante o provisionamento.

## Verificação

Após executar o script, verifique as tabelas criadas:

```sql
-- Listar todas as tabelas
\dt

-- Listar todas as views
\dv

-- Verificar uma tabela específica
\d campaigns

-- Verificar dados
SELECT COUNT(*) FROM campaigns;
SELECT COUNT(*) FROM target_group_mappings;
```

## Permissões

Todas as tabelas têm permissões configuradas para:
- `anon` - Acesso anônimo (via Supabase)
- `authenticated` - Usuários autenticados
- `service_role` - Acesso completo (Edge Functions)

## Notas

- Todas as tabelas usam UUID como chave primária
- Timestamps são atualizados automaticamente via triggers
- Índices são criados para otimizar consultas comuns
- JSONB é usado para dados flexíveis (workflow_data, metadata, etc)

