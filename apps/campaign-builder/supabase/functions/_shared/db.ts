// Cliente de banco de dados compartilhado para Edge Functions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function getDatabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function executeQuery(query: string, params: any[] = []) {
  const supabase = getDatabaseClient();
  
  // Usar RPC para executar queries SQL diretas
  const { data, error } = await supabase.rpc("exec_sql", {
    query_text: query,
    query_params: params,
  });

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

