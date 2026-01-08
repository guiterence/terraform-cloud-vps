-- ============================================
-- RPC FUNCTIONS PARA CUSTOMER_360
-- Funções para agregar dados do customer_360 para dashboards
-- ============================================

-- Função para obter estatísticas gerais do customer_360
CREATE OR REPLACE FUNCTION get_customer_360_stats()
RETURNS TABLE (
  total_customers BIGINT,
  active_customers BIGINT,
  total_revenue NUMERIC,
  total_deposits NUMERIC,
  total_withdraws NUMERIC,
  avg_ltv NUMERIC,
  avg_deposit NUMERIC,
  churn_risk_count BIGINT,
  high_value_count BIGINT,
  avg_churn_score NUMERIC,
  avg_engagement_score NUMERIC,
  avg_value_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_customers,
    COUNT(*) FILTER (WHERE is_active = true)::BIGINT as active_customers,
    COALESCE(SUM(net_revenue), 0)::NUMERIC as total_revenue,
    COALESCE(SUM(total_deposit), 0)::NUMERIC as total_deposits,
    COALESCE(SUM(total_withdraw), 0)::NUMERIC as total_withdraws,
    COALESCE(AVG(net_revenue), 0)::NUMERIC as avg_ltv,
    COALESCE(AVG(total_deposit), 0)::NUMERIC as avg_deposit,
    COUNT(*) FILTER (WHERE is_churn_risk = true)::BIGINT as churn_risk_count,
    COUNT(*) FILTER (WHERE is_high_value = true)::BIGINT as high_value_count,
    COALESCE(AVG(churn_score), 0)::NUMERIC as avg_churn_score,
    COALESCE(AVG(engagement_score), 0)::NUMERIC as avg_engagement_score,
    COALESCE(AVG(value_score), 0)::NUMERIC as avg_value_score
  FROM customer_360;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para distribuição por segmento
CREATE OR REPLACE FUNCTION get_segment_distribution()
RETURNS TABLE (
  segment TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(segment_label, 'Sem Segmento')::TEXT as segment,
    COUNT(*)::BIGINT as count
  FROM customer_360
  GROUP BY segment_label
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para distribuição por tier
CREATE OR REPLACE FUNCTION get_tier_distribution()
RETURNS TABLE (
  tier TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(tier, 'Sem Tier')::TEXT as tier,
    COUNT(*)::BIGINT as count
  FROM customer_360
  GROUP BY tier
  ORDER BY 
    CASE tier
      WHEN 'platinum' THEN 1
      WHEN 'gold' THEN 2
      WHEN 'silver' THEN 3
      WHEN 'bronze' THEN 4
      ELSE 5
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para receita por mês (últimos 6 meses)
CREATE OR REPLACE FUNCTION get_revenue_by_month()
RETURNS TABLE (
  month TEXT,
  revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', last_deposit_at), 'Mon')::TEXT as month,
    COALESCE(SUM(net_revenue), 0)::NUMERIC as revenue
  FROM customer_360
  WHERE last_deposit_at >= NOW() - INTERVAL '6 months'
    AND last_deposit_at IS NOT NULL
  GROUP BY DATE_TRUNC('month', last_deposit_at)
  ORDER BY DATE_TRUNC('month', last_deposit_at) DESC
  LIMIT 6;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para top segmentos por receita
CREATE OR REPLACE FUNCTION get_top_segments_by_revenue()
RETURNS TABLE (
  segment TEXT,
  revenue NUMERIC,
  customers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(segment_label, 'Sem Segmento')::TEXT as segment,
    COALESCE(SUM(net_revenue), 0)::NUMERIC as revenue,
    COUNT(*)::BIGINT as customers
  FROM customer_360
  GROUP BY segment_label
  ORDER BY revenue DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para distribuição por canal de aquisição
CREATE OR REPLACE FUNCTION get_acquisition_channel_distribution()
RETURNS TABLE (
  channel TEXT,
  count BIGINT,
  revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(acquisition_channel, 'Não informado')::TEXT as channel,
    COUNT(*)::BIGINT as count,
    COALESCE(SUM(net_revenue), 0)::NUMERIC as revenue
  FROM customer_360
  GROUP BY acquisition_channel
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para distribuição por lifecycle stage
CREATE OR REPLACE FUNCTION get_lifecycle_distribution()
RETURNS TABLE (
  stage TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(lifecycle_stage, 'Não definido')::TEXT as stage,
    COUNT(*)::BIGINT as count
  FROM customer_360
  GROUP BY lifecycle_stage
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para receita por UF (top 10)
CREATE OR REPLACE FUNCTION get_revenue_by_uf()
RETURNS TABLE (
  uf TEXT,
  revenue NUMERIC,
  customers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(uf, 'Não informado')::TEXT as uf,
    COALESCE(SUM(net_revenue), 0)::NUMERIC as revenue,
    COUNT(*)::BIGINT as customers
  FROM customer_360
  WHERE uf IS NOT NULL
  GROUP BY uf
  ORDER BY revenue DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões
GRANT EXECUTE ON FUNCTION get_customer_360_stats() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_segment_distribution() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_tier_distribution() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_revenue_by_month() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_top_segments_by_revenue() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_acquisition_channel_distribution() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_lifecycle_distribution() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_revenue_by_uf() TO anon, authenticated, service_role;

