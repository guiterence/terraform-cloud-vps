// Edge Function para gerenciar Target Groups
// Endpoints:
// GET /target-groups - Lista todos os target groups
// GET /target-groups/{id} - Busca um target group específico
// POST /target-groups - Cria um novo target group
// PUT /target-groups/{id} - Atualiza um target group
// DELETE /target-groups/{id} - Deleta um target group

import { serve as stdServe } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface CreateTargetGroupRequest {
  crm_name: string;
  postgres_table: string;
  description?: string;
  sql_query?: string;
}

interface UpdateTargetGroupRequest {
  crm_name?: string;
  description?: string;
  sql_query?: string;
}

interface TargetGroupMapping {
  id: string;
  crm_name: string;
  postgres_table: string;
  description: string | null;
  sql_query: string | null;
  created_at: string;
  updated_at: string;
}

// Função auxiliar para criar conexão PostgreSQL
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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Extrair ID se existir (último segmento que não seja "target-groups")
    let targetGroupId: string | null = null;
    const targetGroupsIndex = pathParts.indexOf("target-groups");
    if (targetGroupsIndex >= 0 && pathParts.length > targetGroupsIndex + 1) {
      targetGroupId = pathParts[targetGroupsIndex + 1];
    }

    // Criar cliente PostgreSQL
    const pgClient = createPgClient();
    
    try {
      await Promise.race([
        pgClient.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout na conexão PostgreSQL")), 5000))
      ]);

      // GET /target-groups - Listar todos
      if (req.method === "GET" && !targetGroupId) {
        const result = await pgClient.queryObject<TargetGroupMapping>(
          `SELECT id, crm_name, postgres_table, description, sql_query, created_at, updated_at 
           FROM target_group_mappings 
           ORDER BY created_at DESC`
        );

        return new Response(
          JSON.stringify({ success: true, data: result.rows }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // GET /target-groups/{id} - Buscar por ID
      if (req.method === "GET" && targetGroupId) {
        const result = await pgClient.queryObject<TargetGroupMapping>(
          `SELECT id, crm_name, postgres_table, description, sql_query, created_at, updated_at 
           FROM target_group_mappings 
           WHERE id = $1`,
          [targetGroupId]
        );

        if (result.rows.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: "Target Group não encontrado" }),
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

      // POST /target-groups - Criar novo
      if (req.method === "POST") {
        const body: CreateTargetGroupRequest = await req.json();

        // Validações
        if (!body.crm_name || !body.postgres_table) {
          return new Response(
            JSON.stringify({ success: false, error: "crm_name e postgres_table são obrigatórios" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }

        // Validar formato da tabela
        if (!/^[a-z0-9_]+$/.test(body.postgres_table)) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Nome da tabela inválido. Use apenas letras minúsculas, números e underscore." 
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }

        // Verificar se já existe (crm_name ou postgres_table)
        const checkResult = await pgClient.queryObject<{ count: number }>(
          `SELECT COUNT(*) as count 
           FROM target_group_mappings 
           WHERE crm_name = $1 OR postgres_table = $2`,
          [body.crm_name, body.postgres_table]
        );

        if (parseInt(checkResult.rows[0]?.count?.toString() || "0") > 0) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Target Group com este nome ou tabela já existe" 
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 409,
            }
          );
        }

        // Validar query SQL se fornecida (mas NÃO criar tabela automaticamente)
        if (body.sql_query) {
          const queryUpper = body.sql_query.trim().toUpperCase();
          if (!queryUpper.startsWith('SELECT')) {
            return new Response(
              JSON.stringify({ success: false, error: "A query SQL deve ser um SELECT" }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
              }
            );
          }
          // Query será armazenada no mapeamento e executada quando necessário
          // Não criamos tabelas automaticamente - tudo vem de customer_360
        }

        // Inserir mapeamento na tabela target_group_mappings (sem criar tabela física)
        const insertResult = await pgClient.queryObject<TargetGroupMapping>(
          `INSERT INTO target_group_mappings (crm_name, postgres_table, description, sql_query)
           VALUES ($1, $2, $3, $4)
           RETURNING id, crm_name, postgres_table, description, sql_query, created_at, updated_at`,
          [body.crm_name, body.postgres_table, body.description || null, body.sql_query || null]
        );

        return new Response(
          JSON.stringify({ success: true, data: insertResult.rows[0] }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 201,
          }
        );
      }

      // PUT /target-groups/{id} - Atualizar
      if (req.method === "PUT" && targetGroupId) {
        const body: UpdateTargetGroupRequest = await req.json();

        // Verificar se existe
        const checkResult = await pgClient.queryObject<{ count: number }>(
          `SELECT COUNT(*) as count 
           FROM target_group_mappings 
           WHERE id = $1`,
          [targetGroupId]
        );

        if (parseInt(checkResult.rows[0]?.count?.toString() || "0") === 0) {
          return new Response(
            JSON.stringify({ success: false, error: "Target Group não encontrado" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 404,
            }
          );
        }

        // Construir query de update dinamicamente
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (body.crm_name) {
          updates.push(`crm_name = $${paramIndex}`);
          values.push(body.crm_name);
          paramIndex++;
        }

        if (body.description !== undefined) {
          updates.push(`description = $${paramIndex}`);
          values.push(body.description);
          paramIndex++;
        }

        if (body.sql_query !== undefined) {
          updates.push(`sql_query = $${paramIndex}`);
          values.push(body.sql_query);
          paramIndex++;
        }

        if (updates.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: "Nenhum campo para atualizar" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }

        values.push(targetGroupId);
        const updateQuery = `
          UPDATE target_group_mappings 
          SET ${updates.join(", ")}, updated_at = NOW()
          WHERE id = $${paramIndex}
          RETURNING id, crm_name, postgres_table, description, sql_query, created_at, updated_at
        `;

        const updateResult = await pgClient.queryObject<TargetGroupMapping>(updateQuery, values);

        return new Response(
          JSON.stringify({ success: true, data: updateResult.rows[0] }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // DELETE /target-groups/{id} - Deletar
      if (req.method === "DELETE" && targetGroupId) {
        // Primeiro buscar o registro para pegar o nome da tabela
        const fetchResult = await pgClient.queryObject<{ postgres_table: string }>(
          `SELECT postgres_table 
           FROM target_group_mappings 
           WHERE id = $1`,
          [targetGroupId]
        );

        if (fetchResult.rows.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: "Target Group não encontrado" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 404,
            }
          );
        }

        const postgresTable = fetchResult.rows[0].postgres_table;

        // Deletar o mapeamento
        await pgClient.queryObject(
          `DELETE FROM target_group_mappings WHERE id = $1`,
          [targetGroupId]
        );

        // Opcional: Deletar a tabela também (CUIDADO!)
        // Por padrão, vamos apenas deletar o mapeamento
        // A tabela pode ser deletada manualmente se necessário

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Target Group deletado com sucesso",
            deleted_table: postgresTable 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // Método não suportado
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

// Standalone mode (if called directly)
if (import.meta.main) {
  stdServe(serve);
}
