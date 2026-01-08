import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

export interface Route {
  path: string;
  handler: (req: Request) => Promise<Response>;
}

export class EdgeFunctionServer {
  private routes: Map<string, (req: Request) => Promise<Response>> = new Map();

  register(path: string, handler: (req: Request) => Promise<Response>) {
    this.routes.set(path, handler);
  }

  async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Find matching route
    for (const [routePath, handler] of this.routes.entries()) {
      if (path.startsWith(routePath)) {
        try {
          const response = await handler(req);
          // Add CORS headers to response
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          return response;
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    }

    // 404 if no route matches
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  start(port: number = 8000) {
    serve((req) => this.handleRequest(req), { port });
  }
}

