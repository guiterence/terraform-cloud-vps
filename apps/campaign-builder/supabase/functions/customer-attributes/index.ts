// Edge Function para gerenciar Customer Attributes
// Endpoints:
// GET /customer-attributes - Lista todos os atributos
// GET /customer-attributes/{name} - Busca um atributo específico
// POST /customer-attributes - Cria um novo atributo (adiciona coluna em customer_360)
// PUT /customer-attributes/{name} - Atualiza um atributo (altera coluna em customer_360)
// DELETE /customer-attributes/{name} - Deleta um atributo (remove coluna de customer_360)
// POST /customer-attributes/sync - Sincroniza atributos com schema de customer_360

import { serve as stdServe } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface CustomerAttribute {
  id: string;
  attribute_name: string;
  display_name: string;
  data_type: string;
  description: string | null;
  category: string | null;
  is_filterable: boolean;
  is_searchable: boolean;
  is_required: boolean;
  default_value: string | null;
  validation_rules: any;
  created_at: string;
  updated_at: string;
}

interface CreateAttributeRequest {
  attribute_name: string;
  display_name: string;
  data_type: string;
  category?: string;
  description?: string;
  default_value?: string;
  is_filterable?: boolean;
  is_searchable?: boolean;
}

interface UpdateAttributeRequest {
  display_name?: string;
  data_type?: string;
  category?: string;
  description?: string;
  default_value?: string;
  is_filterable?: boolean;
  is_searchable?: boolean;
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
    
    // Remover prefixo /customer-attributes se existir (vindo do router principal)
    if (path.startsWith('/customer-attributes')) {
      path = path.replace('/customer-attributes', '');
    }
    
    // Normalizar path (remover barras iniciais/finais)
    path = path.replace(/^\/+|\/+$/g, '');
    const pathParts = path.split("/").filter(Boolean);
    
    let attributeName: string | null = null;
    
    // Se há partes no path e não é "sync", a primeira parte é o nome do atributo
    if (pathParts.length > 0 && pathParts[0] !== "sync") {
      attributeName = pathParts[0];
    }

    const pgClient = createPgClient();
    
    try {
      await Promise.race([
        pgClient.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout na conexão PostgreSQL")), 5000))
      ]);

      // POST /customer-attributes/sync - Sincronizar com schema
      if (req.method === "POST" && pathParts.includes("sync")) {
        await pgClient.queryObject("SELECT sync_customer_attributes_from_schema()");
        
        const result = await pgClient.queryObject<CustomerAttribute>(
          `SELECT id, attribute_name, display_name, data_type, description, category,
                  is_filterable, is_searchable, is_required, default_value, validation_rules,
                  created_at, updated_at
           FROM customer_attributes 
           ORDER BY category, display_name`
        );

        return new Response(
          JSON.stringify({ success: true, data: result.rows, message: "Atributos sincronizados com sucesso" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // GET /customer-attributes - Listar todos
      if (req.method === "GET" && !attributeName) {
        const result = await pgClient.queryObject<CustomerAttribute>(
          `SELECT id, attribute_name, display_name, data_type, description, category,
                  is_filterable, is_searchable, is_required, default_value, validation_rules,
                  created_at, updated_at
           FROM customer_attributes 
           ORDER BY category, display_name`
        );

        return new Response(
          JSON.stringify({ success: true, data: result.rows }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // GET /customer-attributes/{name} - Buscar por nome
      if (req.method === "GET" && attributeName) {
        const result = await pgClient.queryObject<CustomerAttribute>(
          `SELECT id, attribute_name, display_name, data_type, description, category,
                  is_filterable, is_searchable, is_required, default_value, validation_rules,
                  created_at, updated_at
           FROM customer_attributes 
           WHERE attribute_name = $1`,
          [attributeName]
        );

        if (result.rows.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: "Atributo não encontrado" }),
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

      // POST /customer-attributes - Criar novo (adiciona coluna em customer_360)
      if (req.method === "POST") {
        const body: CreateAttributeRequest = await req.json();

        if (!body.attribute_name || !body.display_name || !body.data_type) {
          return new Response(
            JSON.stringify({ success: false, error: "attribute_name, display_name e data_type são obrigatórios" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }

        // Validar nome do atributo (deve ser válido para nome de coluna)
        if (!/^[a-z][a-z0-9_]*$/.test(body.attribute_name)) {
          return new Response(
            JSON.stringify({ success: false, error: "Nome do atributo inválido. Use apenas letras minúsculas, números e underscore, começando com letra." }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }

        // Usar função RPC para adicionar atributo
        await pgClient.queryObject(
          `SELECT add_customer_attribute($1, $2, $3, $4, $5)`,
          [
            body.attribute_name,
            body.display_name,
            body.data_type,
            body.category || 'custom',
            body.default_value || null
          ]
        );

        // Buscar atributo criado
        const result = await pgClient.queryObject<CustomerAttribute>(
          `SELECT id, attribute_name, display_name, data_type, description, category,
                  is_filterable, is_searchable, is_required, default_value, validation_rules,
                  created_at, updated_at
           FROM customer_attributes 
           WHERE attribute_name = $1`,
          [body.attribute_name]
        );

        return new Response(
          JSON.stringify({ success: true, data: result.rows[0] }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 201,
          }
        );
      }

      // PUT /customer-attributes/{name} - Atualizar
      if (req.method === "PUT" && attributeName) {
        const body: UpdateAttributeRequest = await req.json();

        // Usar função RPC para atualizar atributo
        await pgClient.queryObject(
          `SELECT update_customer_attribute($1, $2, $3, $4, $5, $6)`,
          [
            attributeName,
            body.display_name || null,
            body.data_type || null,
            body.category || null,
            body.default_value || null,
            body.description || null
          ]
        );

        // Buscar atributo atualizado
        const result = await pgClient.queryObject<CustomerAttribute>(
          `SELECT id, attribute_name, display_name, data_type, description, category,
                  is_filterable, is_searchable, is_required, default_value, validation_rules,
                  created_at, updated_at
           FROM customer_attributes 
           WHERE attribute_name = $1`,
          [attributeName]
        );

        return new Response(
          JSON.stringify({ success: true, data: result.rows[0] }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // DELETE /customer-attributes/{name} - Deletar (remove coluna de customer_360)
      if (req.method === "DELETE") {
        if (!attributeName) {
          return new Response(
            JSON.stringify({ success: false, error: "Nome do atributo é obrigatório" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }

        try {
          // Usar função RPC para deletar atributo (remove coluna de customer_360)
          await pgClient.queryObject(
            `SELECT delete_customer_attribute($1)`,
            [attributeName]
          );

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Atributo deletado com sucesso. Coluna removida de customer_360." 
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        } catch (error) {
          console.error('[CUSTOMER-ATTRIBUTES] Erro ao deletar atributo:', error);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: error.message || "Erro ao deletar atributo" 
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 500,
            }
          );
        }
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

