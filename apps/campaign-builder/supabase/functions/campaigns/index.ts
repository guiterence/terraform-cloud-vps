import { serve as stdServe } from 'https://deno.land/std@0.168.0/http/server.ts';
// Removido import do Supabase client - usando conexão direta ao PostgreSQL quando necessário

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface Campaign {
  id?: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  workflow_data: {
    nodes: any[];
    edges: any[];
  };
  scheduled_at?: string;
  created_by?: string;
}

export async function serve(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // TODO: Implementar usando conexão direta ao PostgreSQL
  // Por enquanto, retornar erro 503
  return new Response(
    JSON.stringify({ error: 'Campaigns handler em manutenção. Use conexão direta ao PostgreSQL.' }),
    {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Standalone mode (if called directly)
if (import.meta.main) {
  stdServe(serve);
}

