DO
$$
DECLARE
  pass text := '${password}';
BEGIN
  -- Create helper to upsert login role with password
  PERFORM 1 FROM pg_roles WHERE rolname = 'supabase_admin';
  IF NOT FOUND THEN
    EXECUTE 'CREATE ROLE supabase_admin LOGIN PASSWORD ' || quote_literal(pass);
  ELSE
    EXECUTE 'ALTER ROLE supabase_admin WITH PASSWORD ' || quote_literal(pass);
  END IF;

  PERFORM 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin';
  IF NOT FOUND THEN
    EXECUTE 'CREATE ROLE supabase_auth_admin LOGIN PASSWORD ' || quote_literal(pass);
  ELSE
    EXECUTE 'ALTER ROLE supabase_auth_admin WITH PASSWORD ' || quote_literal(pass);
  END IF;

  PERFORM 1 FROM pg_roles WHERE rolname = 'supabase_storage_admin';
  IF NOT FOUND THEN
    EXECUTE 'CREATE ROLE supabase_storage_admin LOGIN PASSWORD ' || quote_literal(pass);
  ELSE
    EXECUTE 'ALTER ROLE supabase_storage_admin WITH PASSWORD ' || quote_literal(pass);
  END IF;

  PERFORM 1 FROM pg_roles WHERE rolname = 'authenticator';
  IF NOT FOUND THEN
    EXECUTE 'CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD ' || quote_literal(pass);
  ELSE
    EXECUTE 'ALTER ROLE authenticator WITH PASSWORD ' || quote_literal(pass);
  END IF;

  PERFORM 1 FROM pg_roles WHERE rolname = 'anon';
  IF NOT FOUND THEN
    EXECUTE 'CREATE ROLE anon NOLOGIN';
  END IF;

  PERFORM 1 FROM pg_roles WHERE rolname = 'authenticated';
  IF NOT FOUND THEN
    EXECUTE 'CREATE ROLE authenticated NOLOGIN';
  END IF;

  PERFORM 1 FROM pg_roles WHERE rolname = 'service_role';
  IF NOT FOUND THEN
    EXECUTE 'CREATE ROLE service_role NOLOGIN';
  END IF;

  EXECUTE 'GRANT anon TO authenticator';
  EXECUTE 'GRANT authenticated TO authenticator';
  EXECUTE 'GRANT service_role TO authenticator';

  EXECUTE 'GRANT ALL PRIVILEGES ON DATABASE postgres TO supabase_admin';
END
$$;

-- Create extensions in the extensions schema (Supabase best practice)
CREATE SCHEMA IF NOT EXISTS extensions;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
-- pgjwt extension may not be available, skip if not found
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Extension pgjwt not available, skipping';
END $$;
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA extensions;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS realtime;
CREATE SCHEMA IF NOT EXISTS _realtime;

-- Grant permissions on schemas (using current user instead of postgres)
DO $$
DECLARE
  current_user_name text;
BEGIN
  SELECT current_user INTO current_user_name;
  -- Grant usage and create on schemas
  EXECUTE format('GRANT USAGE, CREATE ON SCHEMA auth TO %I, anon, authenticated, service_role, supabase_admin, supabase_auth_admin', current_user_name);
  EXECUTE format('GRANT USAGE, CREATE ON SCHEMA storage TO %I, anon, authenticated, service_role, supabase_admin, supabase_storage_admin', current_user_name);
  EXECUTE format('GRANT USAGE, CREATE ON SCHEMA extensions TO %I, anon, authenticated, service_role, supabase_admin', current_user_name);
  EXECUTE format('GRANT USAGE, CREATE ON SCHEMA realtime TO %I, anon, authenticated, service_role', current_user_name);
  EXECUTE format('GRANT USAGE, CREATE ON SCHEMA _realtime TO %I, anon, authenticated, service_role', current_user_name);
  -- Grant all privileges on schemas to admin roles
  EXECUTE format('GRANT ALL ON SCHEMA auth TO supabase_auth_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT ALL ON SCHEMA storage TO supabase_storage_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT ALL ON SCHEMA extensions TO supabase_admin, %I', current_user_name);
END $$;

-- Create auth.users table (basic structure)
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid,
  email text,
  encrypted_password text,
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  confirmation_token text,
  confirmation_sent_at timestamptz,
  recovery_token text,
  recovery_sent_at timestamptz,
  email_change_token_new text,
  email_change text,
  email_change_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  phone text,
  phone_confirmed_at timestamptz,
  phone_change text,
  phone_change_token text,
  phone_change_sent_at timestamptz,
  confirmed_at timestamptz GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
  email_change_token_current text,
  email_change_confirm_status smallint,
  banned_until timestamptz,
  reauthentication_token text,
  reauthentication_sent_at timestamptz,
  is_sso_user boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  is_anonymous boolean NOT NULL DEFAULT false
);

-- Create auth.sessions table
CREATE TABLE IF NOT EXISTS auth.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  factor_id uuid,
  aal text,
  not_after timestamptz
);

-- Create auth.identities table
CREATE TABLE IF NOT EXISTS auth.identities (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  identity_data jsonb NOT NULL,
  provider text NOT NULL,
  last_sign_in_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT identities_provider_unique UNIQUE (provider, id)
);

-- Create auth.refresh_tokens table
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
  id bigserial PRIMARY KEY,
  token text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  revoked boolean,
  parent text,
  session_id uuid REFERENCES auth.sessions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Create storage.buckets table
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

-- Create storage.objects table
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id),
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
  version text,
  owner_id text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users(email);
CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users(instance_id);
CREATE INDEX IF NOT EXISTS identities_user_id_idx ON auth.identities(user_id);
CREATE INDEX IF NOT EXISTS identities_provider_idx ON auth.identities(provider);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON auth.sessions(user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON auth.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_session_id_idx ON auth.refresh_tokens(session_id);
CREATE INDEX IF NOT EXISTS objects_bucket_id_idx ON storage.objects(bucket_id);
CREATE INDEX IF NOT EXISTS objects_name_idx ON storage.objects(name);

-- Grant permissions on tables
DO $$
DECLARE
  current_user_name text;
BEGIN
  SELECT current_user INTO current_user_name;
  -- Auth tables permissions
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated, service_role');
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users TO supabase_auth_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT SELECT ON auth.users TO anon, authenticated, service_role');
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON auth.identities TO supabase_auth_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT SELECT ON auth.identities TO anon, authenticated, service_role');
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON auth.sessions TO supabase_auth_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON auth.refresh_tokens TO supabase_auth_admin, supabase_admin, %I', current_user_name);
  
  -- Storage tables permissions
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA storage TO supabase_storage_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT SELECT ON ALL TABLES IN SCHEMA storage TO anon, authenticated, service_role');
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON storage.buckets TO supabase_storage_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT SELECT ON storage.buckets TO anon, authenticated, service_role');
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO supabase_storage_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT SELECT ON storage.objects TO anon, authenticated, service_role');
  
  -- Grant usage on sequences
  EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA storage TO supabase_storage_admin, supabase_admin, %I', current_user_name);
END $$;

-- Add missing column to auth.users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'is_anonymous'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN is_anonymous boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Grant permissions to access system catalogs (needed by supabase-meta and supabase-studio)
DO $$
DECLARE
  current_user_name text;
BEGIN
  SELECT current_user INTO current_user_name;
  -- Grant read access to system catalogs for performance monitoring
  EXECUTE format('GRANT SELECT ON pg_authid TO %I, supabase_admin, supabase_auth_admin, service_role, anon, authenticated', current_user_name);
  EXECUTE format('GRANT SELECT ON pg_roles TO %I, supabase_admin, supabase_auth_admin, service_role, anon, authenticated', current_user_name);
  EXECUTE format('GRANT SELECT ON pg_namespace TO %I, supabase_admin, supabase_auth_admin, service_role', current_user_name);
  EXECUTE format('GRANT SELECT ON pg_database TO %I, supabase_admin, supabase_auth_admin, service_role', current_user_name);
  -- Grant access to pg_stat_statements for query performance monitoring
  EXECUTE format('GRANT SELECT ON pg_stat_statements TO %I, supabase_admin, supabase_auth_admin, service_role', current_user_name);
  -- Grant usage on pg_catalog schema (needed for system catalog access)
  EXECUTE format('GRANT USAGE ON SCHEMA pg_catalog TO %I, supabase_admin, supabase_auth_admin, service_role', current_user_name);
END $$;

-- Allow roles to configure pg_stat_statements settings (must be done outside DO block)
-- Note: These settings apply to the roles, but the user connecting (guilhermeterence) also needs permission
ALTER ROLE supabase_admin SET pg_stat_statements.track = 'all';
ALTER ROLE supabase_auth_admin SET pg_stat_statements.track = 'all';
ALTER ROLE service_role SET pg_stat_statements.track = 'all';
-- Grant permission to the main database user used by supabase-meta
DO $$
DECLARE
  current_user_name text;
BEGIN
  SELECT current_user INTO current_user_name;
  EXECUTE format('ALTER ROLE %I SET pg_stat_statements.track = ''all''', current_user_name);
END $$;

-- Grant permissions on public schema for Supabase roles
DO $$
DECLARE
  current_user_name text;
BEGIN
  SELECT current_user INTO current_user_name;
  -- Grant usage and create on public schema
  EXECUTE format('GRANT USAGE, CREATE ON SCHEMA public TO %I, anon, authenticated, service_role, supabase_admin', current_user_name);
  
  -- Grant all privileges on existing tables in public schema
  EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA public TO %I, anon, authenticated, service_role, supabase_admin', current_user_name);
  
  -- Grant all privileges on existing sequences in public schema
  EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO %I, anon, authenticated, service_role, supabase_admin', current_user_name);
  
  -- Grant all privileges on existing functions in public schema
  EXECUTE format('GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO %I, anon, authenticated, service_role, supabase_admin', current_user_name);
  
  -- Set default privileges for future tables created by current user
  EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, supabase_admin', current_user_name);
  EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, supabase_admin', current_user_name);
  EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role, supabase_admin', current_user_name);
END $$;

-- Grant service_role full access (bypass RLS) - this is the admin role
ALTER ROLE service_role BYPASSRLS;

-- Tabela de mapeamento de Target Groups
-- Esta tabela faz o DE-PARA entre o nome do Target Group no CRM e a tabela no PostgreSQL

CREATE TABLE IF NOT EXISTS target_group_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crm_name VARCHAR(255) NOT NULL UNIQUE, -- Nome do Target Group no CRM
    postgres_table VARCHAR(255) NOT NULL UNIQUE, -- Nome da tabela no PostgreSQL (apenas referência, não cria tabela)
    description TEXT,
    sql_query TEXT, -- Query SQL para filtrar/agregar dados (pode usar qualquer tabela do schema public)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
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

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_target_group_mappings_updated_at ON target_group_mappings;
CREATE TRIGGER trigger_update_target_group_mappings_updated_at
    BEFORE UPDATE ON target_group_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_target_group_mappings_updated_at();

-- Função RPC para criar tabela de Target Group (usada pelas Edge Functions)
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

        CREATE INDEX IF NOT EXISTS idx_%I_email ON %I(email);

        COMMENT ON TABLE %I IS %L;
    ', table_name, table_name, table_name, table_name, 'Target Group: ' || crm_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_target_group_table(TEXT, TEXT) TO service_role, anon, authenticated;

-- Permissões para Supabase
GRANT SELECT, INSERT, UPDATE, DELETE ON target_group_mappings TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Comentários
COMMENT ON TABLE target_group_mappings IS 'Mapeamento entre Target Groups do CRM e tabelas no PostgreSQL';
COMMENT ON COLUMN target_group_mappings.crm_name IS 'Nome do Target Group como aparece no CRM';
COMMENT ON COLUMN target_group_mappings.postgres_table IS 'Nome da tabela no PostgreSQL que contém os dados dos clientes deste Target Group';

-- ============================================
-- CAMPAIGNS TABLE
-- ============================================
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
GRANT USAGE, SELECT ON SEQUENCE campaigns_id_seq TO anon, authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_campaigns_workflow_data ON campaigns USING GIN (workflow_data);

COMMENT ON TABLE campaigns IS 'Campanhas de marketing criadas no Campaign Builder';
COMMENT ON COLUMN campaigns.workflow_data IS 'JSON contendo nodes e edges do ReactFlow';
COMMENT ON COLUMN campaigns.status IS 'Status da campanha: draft, active, paused, completed';

-- ============================================
-- CAMPAIGN EXECUTIONS
-- ============================================
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

GRANT SELECT, INSERT, UPDATE, DELETE ON campaign_executions TO anon, authenticated, service_role;

COMMENT ON TABLE campaign_executions IS 'Histórico de execuções de campanhas';

-- ============================================
-- CAMPAIGN RECIPIENTS
-- ============================================
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

GRANT SELECT, INSERT, UPDATE, DELETE ON campaign_recipients TO anon, authenticated, service_role;

COMMENT ON TABLE campaign_recipients IS 'Destinatários de campanhas com tracking de status';

-- ============================================
-- CUSTOMER 360 (MODELO COMPLETO - 40+ COLUNAS)
-- ============================================
-- 1 linha = 1 cliente
-- Tudo que campanhas precisam está aqui
-- Queries simples, sem joins em tempo real
CREATE TABLE IF NOT EXISTS customer_360 (
  /* =========================
     IDENTIDADE
  ========================= */
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,                           -- ID externo (marketplace/app)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  /* =========================
     DADOS PESSOAIS
  ========================= */
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,

  /* =========================
     DEMOGRAFIA
  ========================= */
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  birth_date DATE,
  age INTEGER,
  uf CHAR(2),
  city TEXT,
  country TEXT DEFAULT 'BR',

  /* =========================
     STATUS DO CLIENTE
  ========================= */
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  account_status TEXT,                        -- active, blocked, closed
  last_login_at TIMESTAMP WITH TIME ZONE,

  /* =========================
     SEGMENTAÇÃO / TIERS
  ========================= */
  tier TEXT CHECK (tier IN ('bronze','silver','gold','platinum')),
  lifecycle_stage TEXT,                       -- lead, active, churn_risk, churned
  segment_label TEXT,                         -- label de negócio
  persona TEXT,                               -- ex: price_sensitive, premium

  /* =========================
     FINANCEIRO (AGREGADOS)
  ========================= */
  total_deposit NUMERIC(14,2) DEFAULT 0,
  total_withdraw NUMERIC(14,2) DEFAULT 0,
  net_revenue NUMERIC(14,2)
    GENERATED ALWAYS AS (total_deposit - total_withdraw) STORED,

  deposit_count INTEGER DEFAULT 0,
  withdraw_count INTEGER DEFAULT 0,

  avg_deposit NUMERIC(14,2),
  avg_withdraw NUMERIC(14,2),

  first_deposit_at TIMESTAMP WITH TIME ZONE,
  last_deposit_at TIMESTAMP WITH TIME ZONE,
  last_withdraw_at TIMESTAMP WITH TIME ZONE,

  /* =========================
     COMPORTAMENTO
  ========================= */
  first_activity_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  days_since_last_activity INTEGER,
  activity_frequency INTEGER,                 -- ações por período
  sessions_last_30d INTEGER,
  actions_last_30d INTEGER,

  /* =========================
     MARKETING / AQUISIÇÃO
  ========================= */
  acquisition_channel TEXT,                   -- organic, paid, referral
  acquisition_campaign TEXT,
  acquisition_source TEXT,
  last_campaign_at TIMESTAMP WITH TIME ZONE,

  /* =========================
     SCORES (DATA SCIENCE)
  ========================= */
  churn_score NUMERIC(5,2),                    -- 0–100
  engagement_score NUMERIC(5,2),
  value_score NUMERIC(5,2),
  propensity_score NUMERIC(5,2),

  /* =========================
     FLAGS DERIVADAS
  ========================= */
  is_high_value BOOLEAN DEFAULT false,
  is_churn_risk BOOLEAN DEFAULT false,
  is_marketing_optin BOOLEAN DEFAULT true,

  /* =========================
     FLEXIBILIDADE
  ========================= */
  attributes JSONB DEFAULT '{}'::jsonb         -- campos custom / futuros
);

-- ÍNDICES ESSENCIAIS (SEM ISSO, NÃO ESCALA)
CREATE INDEX IF NOT EXISTS idx_c360_email ON customer_360(email);
CREATE INDEX IF NOT EXISTS idx_c360_uf ON customer_360(uf);
CREATE INDEX IF NOT EXISTS idx_c360_tier ON customer_360(tier);
CREATE INDEX IF NOT EXISTS idx_c360_net_revenue ON customer_360(net_revenue);
CREATE INDEX IF NOT EXISTS idx_c360_churn ON customer_360(churn_score);
CREATE INDEX IF NOT EXISTS idx_c360_last_activity ON customer_360(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_c360_lifecycle ON customer_360(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_c360_external_id ON customer_360(external_id);
CREATE INDEX IF NOT EXISTS idx_c360_account_status ON customer_360(account_status);
CREATE INDEX IF NOT EXISTS idx_c360_acquisition_channel ON customer_360(acquisition_channel);

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

GRANT SELECT, INSERT, UPDATE, DELETE ON customer_360 TO anon, authenticated, service_role;

COMMENT ON TABLE customer_360 IS 'Tabela consolidada de Customer 360 - 1 linha = 1 cliente, tudo que campanhas precisam';
COMMENT ON COLUMN customer_360.net_revenue IS 'Receita líquida (deposit - withdraw) calculada automaticamente';
COMMENT ON COLUMN customer_360.attributes IS 'Campos customizados e futuros em formato JSON';

-- ============================================
-- CUSTOMER ATTRIBUTES (GERENCIAMENTO DE COLUNAS)
-- ============================================
-- Tabela que lista todas as colunas de customer_360
-- Adicionar/editar atributo = alterar automaticamente customer_360
CREATE TABLE IF NOT EXISTS customer_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_name VARCHAR(255) NOT NULL UNIQUE, -- Nome da coluna (ex: 'total_deposit', 'churn_score')
    display_name VARCHAR(255) NOT NULL, -- Nome para exibição (ex: 'Total Deposit', 'Churn Score')
    data_type VARCHAR(50) NOT NULL, -- Tipo de dado: TEXT, INTEGER, NUMERIC, BOOLEAN, DATE, TIMESTAMP, JSONB
    description TEXT, -- Descrição do atributo
    category VARCHAR(100), -- Categoria: 'identidade', 'pessoal', 'demografia', 'financeiro', 'comportamento', 'marketing', 'scores', 'flags', 'custom'
    is_filterable BOOLEAN DEFAULT true, -- Se pode ser usado em filtros/condições
    is_searchable BOOLEAN DEFAULT false, -- Se pode ser usado em buscas
    is_required BOOLEAN DEFAULT false, -- Se é obrigatório
    default_value TEXT, -- Valor padrão
    validation_rules JSONB DEFAULT '{}'::jsonb, -- Regras de validação (ex: min, max, pattern)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_customer_attributes_name ON customer_attributes(attribute_name);
CREATE INDEX IF NOT EXISTS idx_customer_attributes_category ON customer_attributes(category);
CREATE INDEX IF NOT EXISTS idx_customer_attributes_filterable ON customer_attributes(is_filterable);

-- Função para sincronizar colunas de customer_360 com customer_attributes
CREATE OR REPLACE FUNCTION sync_customer_attributes_from_schema()
RETURNS void AS $$
DECLARE
    col_record RECORD;
    category_name VARCHAR(100);
    display_name_text VARCHAR(255);
BEGIN
    -- Limpar atributos que não existem mais na tabela
    DELETE FROM customer_attributes 
    WHERE attribute_name NOT IN (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customer_360'
        AND column_name NOT IN ('id', 'created_at', 'updated_at') -- Colunas do sistema
    );

    -- Inserir ou atualizar atributos baseados nas colunas de customer_360
    FOR col_record IN 
        SELECT 
            column_name,
            data_type,
            column_default,
            is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'customer_360'
        AND column_name NOT IN ('id', 'created_at', 'updated_at')
    LOOP
        -- Determinar categoria baseado no nome da coluna
        category_name := CASE
            WHEN col_record.column_name IN ('external_id') THEN 'identidade'
            WHEN col_record.column_name IN ('first_name', 'last_name', 'full_name', 'email', 'phone') THEN 'pessoal'
            WHEN col_record.column_name IN ('gender', 'birth_date', 'age', 'uf', 'city', 'country') THEN 'demografia'
            WHEN col_record.column_name LIKE '%deposit%' OR col_record.column_name LIKE '%withdraw%' OR col_record.column_name LIKE '%revenue%' THEN 'financeiro'
            WHEN col_record.column_name LIKE '%activity%' OR col_record.column_name LIKE '%session%' OR col_record.column_name LIKE '%action%' THEN 'comportamento'
            WHEN col_record.column_name LIKE '%acquisition%' OR col_record.column_name LIKE '%campaign%' THEN 'marketing'
            WHEN col_record.column_name LIKE '%score%' THEN 'scores'
            WHEN col_record.column_name LIKE 'is_%' THEN 'flags'
            ELSE 'custom'
        END;

        -- Gerar display_name a partir do attribute_name
        display_name_text := INITCAP(REPLACE(col_record.column_name, '_', ' '));

        -- Mapear tipos do PostgreSQL para tipos simplificados
        INSERT INTO customer_attributes (
            attribute_name,
            display_name,
            data_type,
            category,
            is_filterable,
            is_searchable,
            is_required,
            default_value
        ) VALUES (
            col_record.column_name,
            display_name_text,
            CASE 
                WHEN col_record.data_type IN ('text', 'character varying', 'varchar', 'char', 'character') THEN 'TEXT'
                WHEN col_record.data_type IN ('integer', 'bigint', 'smallint') THEN 'INTEGER'
                WHEN col_record.data_type IN ('numeric', 'decimal', 'real', 'double precision') THEN 'NUMERIC'
                WHEN col_record.data_type = 'boolean' THEN 'BOOLEAN'
                WHEN col_record.data_type = 'date' THEN 'DATE'
                WHEN col_record.data_type IN ('timestamp without time zone', 'timestamp with time zone') THEN 'TIMESTAMP'
                WHEN col_record.data_type = 'jsonb' THEN 'JSONB'
                ELSE 'TEXT'
            END,
            category_name,
            true, -- Todos são filteráveis por padrão
            col_record.column_name IN ('email', 'full_name', 'external_id'), -- Apenas alguns são pesquisáveis
            col_record.is_nullable = 'NO' AND col_record.column_default IS NULL, -- Obrigatório se não nullable e sem default
            col_record.column_default
        )
        ON CONFLICT (attribute_name) 
        DO UPDATE SET
            data_type = EXCLUDED.data_type,
            default_value = EXCLUDED.default_value,
            updated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para adicionar nova coluna em customer_360 baseado em customer_attributes
CREATE OR REPLACE FUNCTION add_customer_attribute(
    p_attribute_name VARCHAR(255),
    p_display_name VARCHAR(255),
    p_data_type VARCHAR(50),
    p_category VARCHAR(100) DEFAULT 'custom',
    p_default_value TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    sql_type TEXT;
BEGIN
    -- Mapear tipo simplificado para tipo PostgreSQL
    sql_type := CASE p_data_type
        WHEN 'TEXT' THEN 'TEXT'
        WHEN 'INTEGER' THEN 'INTEGER'
        WHEN 'NUMERIC' THEN 'NUMERIC(14,2)'
        WHEN 'BOOLEAN' THEN 'BOOLEAN'
        WHEN 'DATE' THEN 'DATE'
        WHEN 'TIMESTAMP' THEN 'TIMESTAMP WITH TIME ZONE'
        WHEN 'JSONB' THEN 'JSONB'
        ELSE 'TEXT'
    END;

    -- Adicionar coluna em customer_360
    EXECUTE format('ALTER TABLE customer_360 ADD COLUMN IF NOT EXISTS %I %s %s',
        p_attribute_name,
        sql_type,
        CASE WHEN p_default_value IS NOT NULL THEN 'DEFAULT ' || quote_literal(p_default_value) ELSE '' END
    );

    -- Inserir ou atualizar em customer_attributes
    INSERT INTO customer_attributes (
        attribute_name,
        display_name,
        data_type,
        category,
        default_value
    ) VALUES (
        p_attribute_name,
        p_display_name,
        p_data_type,
        p_category,
        p_default_value
    )
    ON CONFLICT (attribute_name) 
    DO UPDATE SET
        display_name = EXCLUDED.display_name,
        data_type = EXCLUDED.data_type,
        category = EXCLUDED.category,
        default_value = EXCLUDED.default_value,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar atributo (pode alterar tipo, default, etc)
CREATE OR REPLACE FUNCTION update_customer_attribute(
    p_attribute_name VARCHAR(255),
    p_display_name VARCHAR(255),
    p_data_type VARCHAR(50),
    p_category VARCHAR(100),
    p_default_value TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    sql_type TEXT;
    current_type TEXT;
BEGIN
    -- Verificar se atributo existe
    IF NOT EXISTS (SELECT 1 FROM customer_attributes WHERE attribute_name = p_attribute_name) THEN
        RAISE EXCEPTION 'Atributo % não encontrado', p_attribute_name;
    END IF;

    -- Se o tipo mudou, alterar coluna em customer_360
    SELECT data_type INTO current_type FROM customer_attributes WHERE attribute_name = p_attribute_name;
    
    IF current_type != p_data_type THEN
        sql_type := CASE p_data_type
            WHEN 'TEXT' THEN 'TEXT'
            WHEN 'INTEGER' THEN 'INTEGER'
            WHEN 'NUMERIC' THEN 'NUMERIC(14,2)'
            WHEN 'BOOLEAN' THEN 'BOOLEAN'
            WHEN 'DATE' THEN 'DATE'
            WHEN 'TIMESTAMP' THEN 'TIMESTAMP WITH TIME ZONE'
            WHEN 'JSONB' THEN 'JSONB'
            ELSE 'TEXT'
        END;

        EXECUTE format('ALTER TABLE customer_360 ALTER COLUMN %I TYPE %s USING %I::%s',
            p_attribute_name,
            sql_type,
            p_attribute_name,
            sql_type
        );
    END IF;

    -- Atualizar default se fornecido
    IF p_default_value IS NOT NULL THEN
        EXECUTE format('ALTER TABLE customer_360 ALTER COLUMN %I SET DEFAULT %L',
            p_attribute_name,
            p_default_value
        );
    END IF;

    -- Atualizar customer_attributes
    UPDATE customer_attributes SET
        display_name = p_display_name,
        data_type = p_data_type,
        category = p_category,
        default_value = p_default_value,
        description = COALESCE(p_description, description),
        updated_at = NOW()
    WHERE attribute_name = p_attribute_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para remover atributo (remove coluna de customer_360)
CREATE OR REPLACE FUNCTION delete_customer_attribute(p_attribute_name VARCHAR(255))
RETURNS void AS $$
BEGIN
    -- Verificar se é uma coluna custom (não do sistema)
    IF p_attribute_name IN ('id', 'external_id', 'created_at', 'updated_at', 'email', 'full_name') THEN
        RAISE EXCEPTION 'Não é permitido remover colunas do sistema';
    END IF;

    -- Remover coluna de customer_360
    EXECUTE format('ALTER TABLE customer_360 DROP COLUMN IF EXISTS %I', p_attribute_name);

    -- Remover de customer_attributes
    DELETE FROM customer_attributes WHERE attribute_name = p_attribute_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_customer_attributes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_attributes_updated_at ON customer_attributes;
CREATE TRIGGER trigger_update_customer_attributes_updated_at
    BEFORE UPDATE ON customer_attributes
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_attributes_updated_at();

-- Sincronizar atributos iniciais
SELECT sync_customer_attributes_from_schema();

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_attributes TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION sync_customer_attributes_from_schema() TO service_role;
GRANT EXECUTE ON FUNCTION add_customer_attribute(VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION update_customer_attribute(VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, TEXT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION delete_customer_attribute(VARCHAR) TO service_role, authenticated;

COMMENT ON TABLE customer_attributes IS 'Gerenciamento de atributos/colunas da tabela customer_360. Adicionar/editar aqui altera automaticamente customer_360';

-- ============================================
-- AUTO-SEED: Popular customer_360 automaticamente se estiver vazia
-- ============================================
-- Função para popular customer_360 automaticamente
CREATE OR REPLACE FUNCTION auto_seed_customer_360()
RETURNS void AS $$
DECLARE
  row_count INTEGER;
  first_names TEXT[] := ARRAY['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Juliana', 'Fernando', 'Patricia', 'Ricardo', 'Camila', 'Lucas', 'Mariana', 'Rafael', 'Beatriz', 'Gabriel', 'Larissa', 'Thiago', 'Amanda', 'Bruno', 'Isabela'];
  last_names TEXT[] := ARRAY['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima', 'Araujo', 'Fernandes', 'Carvalho', 'Gomes', 'Martins', 'Ribeiro', 'Alves', 'Monteiro', 'Cardoso', 'Reis'];
  cities TEXT[] := ARRAY['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador', 'Curitiba', 'Fortaleza', 'Recife', 'Porto Alegre', 'Manaus', 'Belém', 'Goiânia', 'Guarulhos', 'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal', 'Teresina'];
  ufs TEXT[] := ARRAY['SP', 'RJ', 'MG', 'DF', 'BA', 'PR', 'CE', 'PE', 'RS', 'AM', 'PA', 'GO', 'SC', 'PB', 'ES', 'AL', 'MS', 'MT', 'SE', 'TO'];
  channels TEXT[] := ARRAY['organic', 'paid', 'referral', 'social', 'email', 'affiliate'];
  personas TEXT[] := ARRAY['price_sensitive', 'premium', 'value_seeker', 'loyal', 'newbie', 'veteran'];
  segments TEXT[] := ARRAY['High Value Buyer', 'Churn Risk', 'New Customer', 'VIP', 'Regular', 'Inactive'];
  tiers TEXT[] := ARRAY['bronze', 'silver', 'gold', 'platinum'];
  lifecycle_stages TEXT[] := ARRAY['lead', 'active', 'churn_risk', 'churned'];
  account_statuses TEXT[] := ARRAY['active', 'blocked', 'closed'];
  genders TEXT[] := ARRAY['male', 'female', 'other'];
  
  i INTEGER;
  first_name TEXT;
  last_name TEXT;
  full_name TEXT;
  email TEXT;
  phone TEXT;
  city TEXT;
  uf TEXT;
  gender TEXT;
  birth_date DATE;
  age INTEGER;
  tier TEXT;
  lifecycle_stage TEXT;
  segment_label TEXT;
  persona TEXT;
  acquisition_channel TEXT;
  total_deposit NUMERIC(14,2);
  total_withdraw NUMERIC(14,2);
  deposit_count INTEGER;
  withdraw_count INTEGER;
  avg_deposit NUMERIC(14,2);
  avg_withdraw NUMERIC(14,2);
  churn_score NUMERIC(5,2);
  engagement_score NUMERIC(5,2);
  value_score NUMERIC(5,2);
  propensity_score NUMERIC(5,2);
  is_high_value BOOLEAN;
  is_churn_risk BOOLEAN;
  first_deposit_at TIMESTAMP WITH TIME ZONE;
  last_deposit_at TIMESTAMP WITH TIME ZONE;
  last_withdraw_at TIMESTAMP WITH TIME ZONE;
  first_activity_at TIMESTAMP WITH TIME ZONE;
  last_activity_at TIMESTAMP WITH TIME ZONE;
  last_login_at TIMESTAMP WITH TIME ZONE;
  last_campaign_at TIMESTAMP WITH TIME ZONE;
  sessions_last_30d INTEGER;
  actions_last_30d INTEGER;
  activity_frequency INTEGER;
  is_active BOOLEAN;
  is_verified BOOLEAN;
  account_status TEXT;
  created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT COUNT(*) INTO row_count FROM customer_360;
  
  -- Se a tabela estiver vazia, popular com 10.000 registros
  IF row_count = 0 THEN
    RAISE NOTICE 'Tabela customer_360 está vazia. Iniciando seed automático de 10.000 registros...';
    
    FOR i IN 1..10000 LOOP
        -- Selecionar dados aleatórios
        first_name := first_names[1 + floor(random() * array_length(first_names, 1))::int];
        last_name := last_names[1 + floor(random() * array_length(last_names, 1))::int];
        full_name := first_name || ' ' || last_name;
        email := lower(first_name || '.' || last_name || i::text || '@example.com');
        phone := '(' || (10 + floor(random() * 90))::text || ') ' || (9000 + floor(random() * 10000))::text || '-' || (1000 + floor(random() * 9000))::text;
        city := cities[1 + floor(random() * array_length(cities, 1))::int];
        uf := ufs[1 + floor(random() * array_length(ufs, 1))::int];
        gender := genders[1 + floor(random() * array_length(genders, 1))::int];
        birth_date := CURRENT_DATE - INTERVAL '18 years' - INTERVAL '1 day' * floor(random() * 3650);
        age := EXTRACT(YEAR FROM age(birth_date))::INTEGER;
        
        -- Tier baseado em distribuição
        IF random() < 0.5 THEN
          tier := 'bronze';
        ELSIF random() < 0.8 THEN
          tier := 'silver';
        ELSIF random() < 0.95 THEN
          tier := 'gold';
        ELSE
          tier := 'platinum';
        END IF;
        
        -- Lifecycle stage
        lifecycle_stage := lifecycle_stages[1 + floor(random() * array_length(lifecycle_stages, 1))::int];
        segment_label := segments[1 + floor(random() * array_length(segments, 1))::int];
        persona := personas[1 + floor(random() * array_length(personas, 1))::int];
        acquisition_channel := channels[1 + floor(random() * array_length(channels, 1))::int];
        
        -- Dados financeiros realistas
        deposit_count := floor(random() * 50)::INTEGER;
        withdraw_count := floor(random() * 30)::INTEGER;
        
        IF deposit_count > 0 THEN
          total_deposit := (100 + random() * 50000)::NUMERIC(14,2);
          avg_deposit := total_deposit / deposit_count;
          first_deposit_at := CURRENT_TIMESTAMP - INTERVAL '1 day' * floor(random() * 365);
          last_deposit_at := CURRENT_TIMESTAMP - INTERVAL '1 day' * floor(random() * 30);
        ELSE
          total_deposit := 0;
          avg_deposit := NULL;
          first_deposit_at := NULL;
          last_deposit_at := NULL;
        END IF;
        
        IF withdraw_count > 0 THEN
          total_withdraw := (total_deposit * (0.1 + random() * 0.6))::NUMERIC(14,2);
          avg_withdraw := total_withdraw / withdraw_count;
          last_withdraw_at := CURRENT_TIMESTAMP - INTERVAL '1 day' * floor(random() * 60);
        ELSE
          total_withdraw := 0;
          avg_withdraw := NULL;
          last_withdraw_at := NULL;
        END IF;
        
        -- Scores (0-100)
        churn_score := (random() * 100)::NUMERIC(5,2);
        engagement_score := (random() * 100)::NUMERIC(5,2);
        value_score := (random() * 100)::NUMERIC(5,2);
        propensity_score := (random() * 100)::NUMERIC(5,2);
        
        -- Flags derivadas
        is_high_value := (total_deposit > 10000) OR (tier IN ('gold', 'platinum'));
        is_churn_risk := (churn_score > 70) OR (lifecycle_stage = 'churn_risk');
        
        -- Atividades
        first_activity_at := CURRENT_TIMESTAMP - INTERVAL '1 day' * floor(random() * 730);
        last_activity_at := CURRENT_TIMESTAMP - INTERVAL '1 day' * floor(random() * 90);
        last_login_at := CURRENT_TIMESTAMP - INTERVAL '1 day' * floor(random() * 7);
        last_campaign_at := CURRENT_TIMESTAMP - INTERVAL '1 day' * floor(random() * 60);
        
        sessions_last_30d := floor(random() * 50)::INTEGER;
        actions_last_30d := floor(random() * 200)::INTEGER;
        activity_frequency := floor(random() * 20)::INTEGER;
        
        -- Status
        is_active := (random() > 0.1); -- 90% ativos
        is_verified := (random() > 0.2); -- 80% verificados
        account_status := account_statuses[1 + floor(random() * array_length(account_statuses, 1))::int];
        IF NOT is_active THEN
          account_status := 'closed';
        END IF;
        
        created_at := CURRENT_TIMESTAMP - INTERVAL '1 day' * floor(random() * 1095); -- últimos 3 anos
        
        -- Inserir registro
        INSERT INTO customer_360 (
          external_id, first_name, last_name, full_name, email, phone, gender, birth_date, age,
          uf, city, country, is_active, is_verified, account_status, last_login_at, tier,
          lifecycle_stage, segment_label, persona, total_deposit, total_withdraw, deposit_count,
          withdraw_count, avg_deposit, avg_withdraw, first_deposit_at, last_deposit_at,
          last_withdraw_at, first_activity_at, last_activity_at, activity_frequency,
          sessions_last_30d, actions_last_30d, acquisition_channel, acquisition_campaign,
          acquisition_source, last_campaign_at, churn_score, engagement_score, value_score,
          propensity_score, is_high_value, is_churn_risk, is_marketing_optin, created_at
        ) VALUES (
          'EXT-' || lpad(i::text, 8, '0'), first_name, last_name, full_name, email, phone, gender,
          birth_date, age, uf, city, 'BR', is_active, is_verified, account_status, last_login_at,
          tier, lifecycle_stage, segment_label, persona, total_deposit, total_withdraw,
          deposit_count, withdraw_count, avg_deposit, avg_withdraw, first_deposit_at, last_deposit_at,
          last_withdraw_at, first_activity_at, last_activity_at, activity_frequency,
          sessions_last_30d, actions_last_30d, acquisition_channel, 'Campaign ' || acquisition_channel,
          acquisition_channel || '_source', last_campaign_at, churn_score, engagement_score,
          value_score, propensity_score, is_high_value, is_churn_risk, true, created_at
        );
        
      -- Log progresso a cada 1000 registros
      IF i % 1000 = 0 THEN
        RAISE NOTICE 'Seed automático: Inseridos % registros...', i;
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Seed automático concluído! 10.000 registros inseridos na tabela customer_360.';
    ANALYZE customer_360;
  ELSE
    RAISE NOTICE 'Tabela customer_360 já possui % registros. Seed automático não será executado.', row_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Executar seed automático após criação da tabela
SELECT auto_seed_customer_360();

-- ============================================
-- CUSTOMER ACTIVITIES
-- ============================================
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

GRANT SELECT, INSERT, UPDATE, DELETE ON customer_activities TO anon, authenticated, service_role;

COMMENT ON TABLE customer_activities IS 'Timeline de atividades dos clientes';

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

-- Garantir que a coluna updated_at existe (para tabelas criadas antes)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;

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

-- Função RPC para buscar usuário por email (para evitar problemas com PostgREST JWT)
CREATE OR REPLACE FUNCTION get_user_by_email(user_email TEXT)
RETURNS TABLE (
    id UUID,
    email TEXT,
    password_hash TEXT,
    name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.email, u.password_hash, u.name
    FROM public.users u
    WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_by_email(TEXT) TO anon, authenticated, service_role;

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION hash_password(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION verify_password_hash(TEXT, TEXT) TO anon, authenticated, service_role;

COMMENT ON TABLE public.users IS 'Usuários do sistema para autenticação';
COMMENT ON COLUMN public.users.password_hash IS 'Hash da senha usando bcrypt (pgcrypto)';
