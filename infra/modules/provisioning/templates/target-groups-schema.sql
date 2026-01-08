-- Tabela de mapeamento de Target Groups
-- Esta tabela faz o DE-PARA entre o nome do Target Group no CRM e a tabela no PostgreSQL

CREATE TABLE IF NOT EXISTS target_group_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crm_name VARCHAR(255) NOT NULL UNIQUE, -- Nome do Target Group no CRM
    postgres_table VARCHAR(255) NOT NULL UNIQUE, -- Nome da tabela no PostgreSQL
    description TEXT,
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

-- Permissões para Supabase
GRANT SELECT, INSERT, UPDATE, DELETE ON target_group_mappings TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Comentários
COMMENT ON TABLE target_group_mappings IS 'Mapeamento entre Target Groups do CRM e tabelas no PostgreSQL';
COMMENT ON COLUMN target_group_mappings.crm_name IS 'Nome do Target Group como aparece no CRM';
COMMENT ON COLUMN target_group_mappings.postgres_table IS 'Nome da tabela no PostgreSQL que contém os dados dos clientes deste Target Group';

