-- ============================================
-- SEED DATA: 10.000 REGISTROS DE EXEMPLO
-- ============================================
-- Insere 10.000 registros realistas na tabela customer_360
-- Para uso em desenvolvimento e testes

-- Arrays de dados para geração realista
DO $$
DECLARE
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
      external_id,
      first_name,
      last_name,
      full_name,
      email,
      phone,
      gender,
      birth_date,
      age,
      uf,
      city,
      country,
      is_active,
      is_verified,
      account_status,
      last_login_at,
      tier,
      lifecycle_stage,
      segment_label,
      persona,
      total_deposit,
      total_withdraw,
      deposit_count,
      withdraw_count,
      avg_deposit,
      avg_withdraw,
      first_deposit_at,
      last_deposit_at,
      last_withdraw_at,
      first_activity_at,
      last_activity_at,
      activity_frequency,
      sessions_last_30d,
      actions_last_30d,
      acquisition_channel,
      acquisition_campaign,
      acquisition_source,
      last_campaign_at,
      churn_score,
      engagement_score,
      value_score,
      propensity_score,
      is_high_value,
      is_churn_risk,
      is_marketing_optin,
      created_at
    ) VALUES (
      'EXT-' || lpad(i::text, 8, '0'),
      first_name,
      last_name,
      full_name,
      email,
      phone,
      gender,
      birth_date,
      age,
      uf,
      city,
      'BR',
      is_active,
      is_verified,
      account_status,
      last_login_at,
      tier,
      lifecycle_stage,
      segment_label,
      persona,
      total_deposit,
      total_withdraw,
      deposit_count,
      withdraw_count,
      avg_deposit,
      avg_withdraw,
      first_deposit_at,
      last_deposit_at,
      last_withdraw_at,
      first_activity_at,
      last_activity_at,
      activity_frequency,
      sessions_last_30d,
      actions_last_30d,
      acquisition_channel,
      'Campaign ' || acquisition_channel,
      acquisition_channel || '_source',
      last_campaign_at,
      churn_score,
      engagement_score,
      value_score,
      propensity_score,
      is_high_value,
      is_churn_risk,
      true, -- marketing_optin
      created_at
    );
    
    -- Log progresso a cada 1000 registros
    IF i % 1000 = 0 THEN
      RAISE NOTICE 'Inseridos % registros...', i;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Concluído! 10.000 registros inseridos na tabela customer_360.';
END $$;

-- Atualizar estatísticas da tabela
ANALYZE customer_360;

