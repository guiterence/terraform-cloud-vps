// Edge Function para buscar dados de customer_360
// Endpoints:
// GET /customer-360 - Lista clientes (com paginação e busca)
// GET /customer-360/{id} - Busca cliente específico por ID

import { serve as stdServe } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface Customer360 {
  id: string;
  external_id: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  birth_date: string | null;
  age: number | null;
  uf: string | null;
  city: string | null;
  country: string | null;
  is_active: boolean;
  is_verified: boolean;
  account_status: string | null;
  last_login_at: string | null;
  tier: string | null;
  lifecycle_stage: string | null;
  segment_label: string | null;
  persona: string | null;
  total_deposit: number;
  total_withdraw: number;
  net_revenue: number;
  deposit_count: number;
  withdraw_count: number;
  avg_deposit: number | null;
  avg_withdraw: number | null;
  first_deposit_at: string | null;
  last_deposit_at: string | null;
  last_withdraw_at: string | null;
  first_activity_at: string | null;
  last_activity_at: string | null;
  days_since_last_activity: number | null;
  activity_frequency: number | null;
  sessions_last_30d: number | null;
  actions_last_30d: number | null;
  acquisition_channel: string | null;
  acquisition_campaign: string | null;
  acquisition_source: string | null;
  last_campaign_at: string | null;
  churn_score: number | null;
  engagement_score: number | null;
  value_score: number | null;
  propensity_score: number | null;
  is_high_value: boolean;
  is_churn_risk: boolean;
  is_marketing_optin: boolean;
  attributes: any;
  created_at: string;
  updated_at: string;
}

function createPgClient(): Client {
  return new Client({
    user: Deno.env.get("POSTGRES_USER") || "guilhermeterence",
    password: Deno.env.get("POSTGRES_PASSWORD") || "",
    database: Deno.env.get("POSTGRES_DB") || "postgres",
    hostname: Deno.env.get("POSTGRES_HOST") || "postgres",
    port: parseInt(Deno.env.get("POSTGRES_PORT") || "5432"),
  });
}

export async function serve(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(req.url);
    let path = url.pathname;
    
    // Remover prefixo /functions/v1 se existir
    if (path.startsWith('/functions/v1')) {
      path = path.replace('/functions/v1', '');
    }
    
    // Remover prefixo /customer-360 se existir (vindo do router principal)
    if (path.startsWith('/customer-360')) {
      path = path.replace('/customer-360', '');
    }
    
    // Normalizar path
    path = path.replace(/^\/+|\/+$/g, '');
    const pathParts = path.split("/").filter(Boolean);
    
    const customerId = pathParts.length > 0 ? pathParts[0] : null;
    const searchParams = url.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const pgClient = createPgClient();
    
    try {
      await Promise.race([
        pgClient.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout na conexão PostgreSQL")), 5000))
      ]);

      // GET /customer-360/stats - Estatísticas agregadas para o dashboard
      if (req.method === "GET" && pathParts[0] === "stats") {
        // Query principal de estatísticas agregadas (equivalente a get_customer_360_stats)
        const totalStatsResult = await pgClient.queryObject<{
          total_customers: number;
          active_customers: number;
          total_revenue: string;
          total_deposits: string;
          total_withdraws: string;
          avg_ltv: string;
          avg_deposit: string;
          churn_risk_count: number;
          high_value_count: number;
          avg_churn_score: string;
          avg_engagement_score: string;
          avg_value_score: string;
        }>(`
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
        `);

        const totalStats = totalStatsResult.rows[0];

        // Distribuição por segmento
        const segmentStatsResult = await pgClient.queryObject<{ segment: string; count: number }>(`
          SELECT
            COALESCE(segment_label, 'Sem Segmento')::TEXT as segment,
            COUNT(*)::BIGINT as count
          FROM customer_360
          GROUP BY segment_label
          ORDER BY count DESC;
        `);

        // Distribuição por tier
        const tierStatsResult = await pgClient.queryObject<{ tier: string; count: number }>(`
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
        `);

        // Receita por mês (últimos 6 meses)
        const revenueStatsResult = await pgClient.queryObject<{ month: string; revenue: string }>(`
          SELECT
            TO_CHAR(DATE_TRUNC('month', last_deposit_at), 'Mon')::TEXT as month,
            COALESCE(SUM(net_revenue), 0)::NUMERIC as revenue
          FROM customer_360
          WHERE last_deposit_at >= NOW() - INTERVAL '6 months'
            AND last_deposit_at IS NOT NULL
          GROUP BY DATE_TRUNC('month', last_deposit_at)
          ORDER BY DATE_TRUNC('month', last_deposit_at) DESC
          LIMIT 6;
        `);

        // Top segmentos por receita
        const topSegmentsResult = await pgClient.queryObject<{ segment: string; revenue: string; customers: number }>(`
          SELECT
            COALESCE(segment_label, 'Sem Segmento')::TEXT as segment,
            COALESCE(SUM(net_revenue), 0)::NUMERIC as revenue,
            COUNT(*)::BIGINT as customers
          FROM customer_360
          GROUP BY segment_label
          ORDER BY revenue DESC
          LIMIT 5;
        `);

        const data = {
          totalCustomers: Number(totalStats?.total_customers || 0),
          activeCustomers: Number(totalStats?.active_customers || 0),
          totalRevenue: parseFloat(totalStats?.total_revenue || "0"),
          totalDeposits: parseFloat(totalStats?.total_deposits || "0"),
          totalWithdraws: parseFloat(totalStats?.total_withdraws || "0"),
          avgLTV: parseFloat(totalStats?.avg_ltv || "0"),
          avgDeposit: parseFloat(totalStats?.avg_deposit || "0"),
          churnRiskCount: Number(totalStats?.churn_risk_count || 0),
          highValueCount: Number(totalStats?.high_value_count || 0),
          avgChurnScore: parseFloat(totalStats?.avg_churn_score || "0"),
          avgEngagementScore: parseFloat(totalStats?.avg_engagement_score || "0"),
          avgValueScore: parseFloat(totalStats?.avg_value_score || "0"),
          segmentDistribution: segmentStatsResult.rows.map((s) => ({
            segment: s.segment,
            count: Number(s.count),
          })),
          tierDistribution: tierStatsResult.rows.map((t) => ({
            tier: t.tier,
            count: Number(t.count),
          })),
          revenueByMonth: revenueStatsResult.rows.map((r) => ({
            month: r.month,
            revenue: parseFloat(r.revenue || "0"),
          })),
          topSegments: topSegmentsResult.rows.map((s) => ({
            segment: s.segment,
            revenue: parseFloat(s.revenue || "0"),
            customers: Number(s.customers || 0),
          })),
        };

        return new Response(
          JSON.stringify({ success: true, data }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // GET /customer-360/{id} - Buscar cliente específico
      if (req.method === "GET" && customerId) {
        const result = await pgClient.queryObject<Customer360>(
          `SELECT * FROM customer_360 WHERE id = $1`,
          [customerId]
        );

        if (result.rows.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: "Cliente não encontrado" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 404,
            }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: result.rows[0] }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // GET /customer-360 - Listar clientes (com busca e paginação)
      if (req.method === "GET") {
        let query = `SELECT * FROM customer_360`;
        const conditions: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        // Busca por ID, email, nome ou external_id
        if (search) {
          conditions.push(`(
            email ILIKE $${paramIndex} OR 
            full_name ILIKE $${paramIndex} OR 
            external_id ILIKE $${paramIndex} OR
            id::text ILIKE $${paramIndex}
          )`);
          params.push(`%${search}%`);
          paramIndex++;
        }

        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        // Buscar clientes
        const result = await pgClient.queryObject<Customer360>(query, params);

        // Contar total (para paginação)
        let countQuery = `SELECT COUNT(*) as total FROM customer_360`;
        const countParams: any[] = [];
        let countParamIndex = 1;
        
        if (conditions.length > 0) {
          // Reconstruir condições para o COUNT sem os parâmetros de LIMIT/OFFSET
          const countConditions = conditions.map(cond => {
            if (cond.includes('ILIKE')) {
              const newCond = cond.replace(/\$\d+/, `$${countParamIndex}`);
              countParams.push(`%${search}%`);
              countParamIndex++;
              return newCond;
            }
            return cond;
          });
          countQuery += ` WHERE ${countConditions.join(' AND ')}`;
        }
        
        const countResult = await pgClient.queryObject<{ total: number }>(countQuery, countParams);
        const total = parseInt(countResult.rows[0]?.total?.toString() || "0");

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: result.rows,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit)
            }
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: "Método não suportado" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 405,
        }
      );
    } finally {
      await pgClient.end();
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro interno do servidor" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}

if (import.meta.main) {
  stdServe(serve);
}

