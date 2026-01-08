// Main entry point for all Edge Functions
import { serve as stdServe } from 'https://deno.land/std@0.168.0/http/server.ts';

// Lazy imports para evitar problemas de inicialização
let targetGroupsHandler: ((req: Request) => Promise<Response>) | null = null;
let campaignsHandler: ((req: Request) => Promise<Response>) | null = null;
let authHandler: ((req: Request) => Promise<Response>) | null = null;
let customerAttributesHandler: ((req: Request) => Promise<Response>) | null = null;
let customer360Handler: ((req: Request) => Promise<Response>) | null = null;

async function loadTargetGroupsHandler() {
  if (!targetGroupsHandler) {
    const module = await import('./target-groups/index.ts');
    targetGroupsHandler = module.serve;
  }
  return targetGroupsHandler;
}

async function loadCampaignsHandler() {
  if (!campaignsHandler) {
    try {
      const module = await import('./campaigns/index.ts');
      campaignsHandler = module.serve;
    } catch (error) {
      console.error('[ROUTER] Erro ao carregar campaigns handler:', error);
      // Retornar handler que sempre retorna erro 503
      campaignsHandler = async () => new Response(
        JSON.stringify({ error: 'Campaigns handler não disponível', details: error.message }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
  return campaignsHandler;
}

async function loadAuthHandler() {
  if (!authHandler) {
    try {
      const module = await import('./auth/index.ts');
      authHandler = module.serve;
    } catch (error) {
      console.error('[ROUTER] Erro ao carregar auth handler:', error);
      // Retornar handler que sempre retorna erro 503
      authHandler = async () => new Response(
        JSON.stringify({ error: 'Auth handler não disponível', details: error.message }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
  return authHandler;
}

async function loadCustomerAttributesHandler() {
  if (!customerAttributesHandler) {
    try {
      const module = await import('./customer-attributes/index.ts');
      customerAttributesHandler = module.serve;
    } catch (error) {
      console.error('[ROUTER] Erro ao carregar customer-attributes handler:', error);
      customerAttributesHandler = async () => new Response(
        JSON.stringify({ error: 'Customer Attributes handler não disponível', details: error.message }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
  return customerAttributesHandler;
}

async function loadCustomer360Handler() {
  if (!customer360Handler) {
    try {
      const module = await import('./customer-360/index.ts');
      customer360Handler = module.serve;
    } catch (error) {
      console.error('[ROUTER] Erro ao carregar customer-360 handler:', error);
      customer360Handler = async () => new Response(
        JSON.stringify({ error: 'Customer 360 handler não disponível', details: error.message }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
  return customer360Handler;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

async function router(req: Request): Promise<Response> {
  try {
    // Handle CORS preflight - DEVE ser a PRIMEIRA coisa, antes de QUALQUER processamento
    // Não processar URL nem nada, apenas responder imediatamente
    if (req.method === 'OPTIONS') {
      console.log('[ROUTER] OPTIONS request recebido');
      return new Response(null, { 
        status: 204,
        headers: corsHeaders 
      });
    }

    const url = new URL(req.url);
    let path = url.pathname;

    console.log('[ROUTER] Request recebido:', req.method, path);

    // Remove /functions/v1 prefix if present (Traefik should strip it, but handle both cases)
    if (path.startsWith('/functions/v1')) {
      path = path.replace('/functions/v1', '');
      console.log('[ROUTER] Path após remover /functions/v1:', path);
    }

    // Route to appropriate handler
    if (path.startsWith('/target-groups')) {
      console.log('[ROUTER] Roteando para target-groups');
      try {
        const handler = await loadTargetGroupsHandler();
        const newUrl = new URL(req.url);
        newUrl.pathname = path.replace('/target-groups', '') || '/';
        const newReq = new Request(newUrl.toString(), req);
        return await handler(newReq);
      } catch (error) {
        console.error('[ROUTER] Erro ao processar target-groups:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao processar requisição', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (path.startsWith('/campaigns')) {
      console.log('[ROUTER] Roteando para campaigns');
      try {
        const handler = await loadCampaignsHandler();
        const newUrl = new URL(req.url);
        newUrl.pathname = path.replace('/campaigns', '') || '/';
        const newReq = new Request(newUrl.toString(), req);
        return await handler(newReq);
      } catch (error) {
        console.error('[ROUTER] Erro ao processar campaigns:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao processar requisição', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (path.startsWith('/auth')) {
      console.log('[ROUTER] Roteando para auth, path final:', path.replace('/auth', '') || '/');
      try {
        const handler = await loadAuthHandler();
        const newUrl = new URL(req.url);
        newUrl.pathname = path.replace('/auth', '') || '/';
        const newReq = new Request(newUrl.toString(), req);
        return await handler(newReq);
      } catch (error) {
        console.error('[ROUTER] Erro ao processar auth:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao processar requisição', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (path.startsWith('/customer-attributes')) {
      console.log('[ROUTER] Roteando para customer-attributes');
      try {
        const handler = await loadCustomerAttributesHandler();
        const newUrl = new URL(req.url);
        newUrl.pathname = path.replace('/customer-attributes', '') || '/';
        const newReq = new Request(newUrl.toString(), req);
        return await handler(newReq);
      } catch (error) {
        console.error('[ROUTER] Erro ao processar customer-attributes:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao processar requisição', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (path.startsWith('/customer-360')) {
      console.log('[ROUTER] Roteando para customer-360');
      try {
        const handler = await loadCustomer360Handler();
        const newUrl = new URL(req.url);
        newUrl.pathname = path.replace('/customer-360', '') || '/';
        const newReq = new Request(newUrl.toString(), req);
        return await handler(newReq);
      } catch (error) {
        console.error('[ROUTER] Erro ao processar customer-360:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao processar requisição', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 404
    console.log('[ROUTER] 404 - Path não encontrado:', path);
    return new Response(
      JSON.stringify({ error: 'Not found', path }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ROUTER] Erro fatal:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Start server
const port = parseInt(Deno.env.get('PORT') || '8000');
stdServe(router, { port });

console.log(`Edge Functions server running on port ${port}`);

