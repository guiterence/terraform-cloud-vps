-- ============================================
-- PROVISIONAMENTO DE SCHEMA DO CRM
-- ============================================
-- Este script cria todas as tabelas necessárias para o CRM/Campaign Builder
-- Execute este script no PostgreSQL após a inicialização do Supabase
--
-- Uso:
--   psql -U guilhermeterence -d postgres -f provision-schema.sql
--   ou
--   docker exec -i postgres psql -U guilhermeterence -d postgres -f /tmp/provision-schema.sql
-- ============================================

-- ============================================
-- USERS TABLE
-- ============================================
-- Tabela de usuários para autenticação
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON public.users;
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- Funções para hash e verificação de senha usando pgcrypto
CREATE OR REPLACE FUNCTION hash_password(p_password TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(p_password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_password_hash(p_password TEXT, p_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN crypt(p_password, p_hash) = p_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION hash_password(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION verify_password_hash(TEXT, TEXT) TO anon, authenticated, service_role;

COMMENT ON TABLE public.users IS 'Usuários do sistema para autenticação';
COMMENT ON COLUMN public.users.password_hash IS 'Hash da senha usando bcrypt (pgcrypto)';

-- ============================================
-- TARGET GROUP MAPPINGS
-- ============================================
-- Mapeia Target Groups do CRM para tabelas no PostgreSQL
CREATE TABLE IF NOT EXISTS target_group_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crm_name TEXT NOT NULL UNIQUE,
    postgres_table TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_target_group_mappings_crm_name ON target_group_mappings(crm_name);
CREATE INDEX IF NOT EXISTS idx_target_group_mappings_postgres_table ON target_group_mappings(postgres_table);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_target_group_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_target_group_mappings_updated_at ON target_group_mappings;
CREATE TRIGGER trigger_update_target_group_mappings_updated_at
    BEFORE UPDATE ON target_group_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_target_group_mappings_updated_at();

-- Função para criar tabela de target group dinamicamente
CREATE OR REPLACE FUNCTION create_target_group_table(
    table_name TEXT,
    crm_name TEXT
)
RETURNS VOID AS $$
DECLARE
    safe_table_name TEXT;
BEGIN
    -- Validar nome da tabela (apenas letras minúsculas, números e underscore)
    IF table_name !~ '^[a-z0-9_]+$' THEN
        RAISE EXCEPTION 'Nome da tabela inválido: %. Use apenas letras minúsculas, números e underscore.', table_name;
    END IF;

    safe_table_name := quote_ident(table_name);

    -- Criar tabela com estrutura padrão para dados de clientes
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id TEXT,
            email TEXT,
            name TEXT,
            phone TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            metadata JSONB DEFAULT ''{}''::jsonb
        )', safe_table_name);

    -- Criar índices padrão
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_customer_id ON %I(customer_id)', safe_table_name, safe_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_email ON %I(email)', safe_table_name, safe_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_created_at ON %I(created_at DESC)', safe_table_name, safe_table_name);

    -- Permitir acesso via Supabase roles
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO anon, authenticated, service_role', safe_table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões
GRANT EXECUTE ON FUNCTION create_target_group_table(TEXT, TEXT) TO service_role, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON target_group_mappings TO anon, authenticated, service_role;

COMMENT ON TABLE target_group_mappings IS 'Mapeamento entre Target Groups do CRM e tabelas no PostgreSQL';
COMMENT ON COLUMN target_group_mappings.crm_name IS 'Nome do Target Group como aparece no CRM';
COMMENT ON COLUMN target_group_mappings.postgres_table IS 'Nome da tabela no PostgreSQL que contém os dados dos clientes deste Target Group';

-- ============================================
-- CAMPAIGNS
-- ============================================
-- Armazena campanhas de marketing criadas no Campaign Builder
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    workflow_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_workflow_data ON campaigns USING GIN (workflow_data);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_campaigns_updated_at ON campaigns;
CREATE TRIGGER trigger_update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_campaigns_updated_at();

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON campaigns TO anon, authenticated, service_role;

COMMENT ON TABLE campaigns IS 'Campanhas de marketing criadas no Campaign Builder';
COMMENT ON COLUMN campaigns.workflow_data IS 'JSON contendo nodes e edges do ReactFlow';
COMMENT ON COLUMN campaigns.status IS 'Status da campanha: draft, active, paused, completed';

-- ============================================
-- CAMPAIGN EXECUTIONS
-- ============================================
-- Registra execuções de campanhas (para histórico e analytics)
CREATE TABLE IF NOT EXISTS campaign_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    execution_type TEXT NOT NULL DEFAULT 'manual' CHECK (execution_type IN ('manual', 'scheduled', 'triggered')),
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    execution_data JSONB DEFAULT '{}'::jsonb,
    metrics JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_campaign_executions_campaign_id ON campaign_executions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_executions_status ON campaign_executions(status);
CREATE INDEX IF NOT EXISTS idx_campaign_executions_started_at ON campaign_executions(started_at DESC);

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON campaign_executions TO anon, authenticated, service_role;

COMMENT ON TABLE campaign_executions IS 'Histórico de execuções de campanhas';
COMMENT ON COLUMN campaign_executions.execution_data IS 'Dados da execução (input/output)';
COMMENT ON COLUMN campaign_executions.metrics IS 'Métricas da execução (emails enviados, SMS enviados, etc)';

-- ============================================
-- CAMPAIGN RECIPIENTS
-- ============================================
-- Registra destinatários de campanhas (para tracking e analytics)
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    execution_id UUID REFERENCES campaign_executions(id) ON DELETE SET NULL,
    customer_id TEXT,
    email TEXT,
    phone TEXT,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'phone', 'push')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'failed')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_execution_id ON campaign_recipients(execution_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_customer_id ON campaign_recipients(customer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_email ON campaign_recipients(email);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_channel ON campaign_recipients(channel);

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON campaign_recipients TO anon, authenticated, service_role;

COMMENT ON TABLE campaign_recipients IS 'Destinatários de campanhas com tracking de status';
COMMENT ON COLUMN campaign_recipients.metadata IS 'Metadados adicionais (template usado, personalizações, etc)';

-- ============================================
-- CUSTOMER 360 DATA
-- ============================================
-- Tabela principal para dados de Customer 360 (pode ser expandida conforme necessário)
CREATE TABLE IF NOT EXISTS customer_360 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL UNIQUE,
    email TEXT,
    name TEXT,
    phone TEXT,
    segment TEXT,
    churn_risk TEXT DEFAULT 'low' CHECK (churn_risk IN ('low', 'medium', 'high')),
    ltv NUMERIC(12, 2) DEFAULT 0,
    total_deposit NUMERIC(12, 2) DEFAULT 0,
    total_withdraw NUMERIC(12, 2) DEFAULT 0,
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_customer_360_customer_id ON customer_360(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_360_email ON customer_360(email);
CREATE INDEX IF NOT EXISTS idx_customer_360_segment ON customer_360(segment);
CREATE INDEX IF NOT EXISTS idx_customer_360_churn_risk ON customer_360(churn_risk);
CREATE INDEX IF NOT EXISTS idx_customer_360_last_activity ON customer_360(last_activity_at DESC);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_customer_360_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_360_updated_at ON customer_360;
CREATE TRIGGER trigger_update_customer_360_updated_at
    BEFORE UPDATE ON customer_360
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_360_updated_at();

-- Função para calcular days_since_last_activity automaticamente
CREATE OR REPLACE FUNCTION update_customer_360_days_since_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_activity_at IS NOT NULL THEN
        NEW.days_since_last_activity = EXTRACT(DAY FROM (NOW() - NEW.last_activity_at))::INTEGER;
    ELSE
        NEW.days_since_last_activity = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_360_days_since_activity ON customer_360;
CREATE TRIGGER trigger_update_customer_360_days_since_activity
    BEFORE INSERT OR UPDATE ON customer_360
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_360_days_since_activity();

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_360 TO anon, authenticated, service_role;

COMMENT ON TABLE customer_360 IS 'Tabela consolidada de Customer 360 - 1 linha = 1 cliente, tudo que campanhas precisam';
COMMENT ON COLUMN customer_360.net_revenue IS 'Receita líquida (deposit - withdraw) calculada automaticamente';
COMMENT ON COLUMN customer_360.attributes IS 'Campos customizados e futuros em formato JSON';

-- ============================================
-- CUSTOMER ACTIVITIES
-- ============================================
-- Registra atividades dos clientes (para timeline do Customer 360)
CREATE TABLE IF NOT EXISTS customer_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    activity_description TEXT,
    activity_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_activities_customer_id ON customer_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_type ON customer_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_customer_activities_created_at ON customer_activities(created_at DESC);

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_activities TO anon, authenticated, service_role;

COMMENT ON TABLE customer_activities IS 'Timeline de atividades dos clientes';
COMMENT ON COLUMN customer_activities.activity_type IS 'Tipo de atividade (login, deposit, purchase, campaign_entry, etc)';

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View para campanhas ativas
CREATE OR REPLACE VIEW active_campaigns AS
SELECT 
    c.*,
    COUNT(DISTINCT cr.id) as total_recipients,
    COUNT(DISTINCT CASE WHEN cr.status = 'sent' THEN cr.id END) as sent_count,
    COUNT(DISTINCT CASE WHEN cr.status = 'delivered' THEN cr.id END) as delivered_count,
    COUNT(DISTINCT CASE WHEN cr.status = 'opened' THEN cr.id END) as opened_count
FROM campaigns c
LEFT JOIN campaign_recipients cr ON c.id = cr.campaign_id
WHERE c.status = 'active'
GROUP BY c.id;

-- View para métricas de campanhas
CREATE OR REPLACE VIEW campaign_metrics AS
SELECT 
    c.id,
    c.name,
    c.status,
    COUNT(DISTINCT ce.id) as execution_count,
    COUNT(DISTINCT cr.id) as total_recipients,
    COUNT(DISTINCT CASE WHEN cr.status = 'sent' THEN cr.id END) as sent_count,
    COUNT(DISTINCT CASE WHEN cr.status = 'delivered' THEN cr.id END) as delivered_count,
    COUNT(DISTINCT CASE WHEN cr.status = 'opened' THEN cr.id END) as opened_count,
    COUNT(DISTINCT CASE WHEN cr.status = 'clicked' THEN cr.id END) as clicked_count,
    COUNT(DISTINCT CASE WHEN cr.status = 'failed' THEN cr.id END) as failed_count,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT CASE WHEN cr.status = 'sent' THEN cr.id END) > 0 
            THEN (COUNT(DISTINCT CASE WHEN cr.status = 'opened' THEN cr.id END)::NUMERIC / 
                  COUNT(DISTINCT CASE WHEN cr.status = 'sent' THEN cr.id END)::NUMERIC) * 100
            ELSE 0
        END, 2
    ) as open_rate,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT CASE WHEN cr.status = 'opened' THEN cr.id END) > 0 
            THEN (COUNT(DISTINCT CASE WHEN cr.status = 'clicked' THEN cr.id END)::NUMERIC / 
                  COUNT(DISTINCT CASE WHEN cr.status = 'opened' THEN cr.id END)::NUMERIC) * 100
            ELSE 0
        END, 2
    ) as click_rate
FROM campaigns c
LEFT JOIN campaign_executions ce ON c.id = ce.campaign_id
LEFT JOIN campaign_recipients cr ON c.id = cr.campaign_id
GROUP BY c.id, c.name, c.status;

-- Permissões nas views
GRANT SELECT ON active_campaigns TO anon, authenticated, service_role;
GRANT SELECT ON campaign_metrics TO anon, authenticated, service_role;

-- ============================================
-- FIM DO PROVISIONAMENTO
-- ============================================
-- Todas as tabelas foram criadas com sucesso!
-- Verifique as tabelas com: \dt
-- Verifique as views com: \dv

