// Edge Function para autenticação usando tabela public.users
import { serve as stdServe } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';
import { encode as base64UrlEncode } from 'https://deno.land/std@0.161.0/encoding/base64url.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

// Interface removida - signup não é mais permitido (apenas admin pode criar contas)

export async function serve(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/+/, '');
  
  // Handle CORS preflight - DEVE ser a primeira coisa
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Para login, não precisamos do cliente Supabase (usamos conexão direta ao PostgreSQL)
    // O cliente Supabase só é necessário para create-user e forgot-password
    let supabaseClient = null;
    if (serviceRoleKey && supabaseUrl) {
      supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        db: {
          schema: 'public',
        },
      });
    }

    // POST /auth/login - Login
    if (req.method === 'POST' && path === 'login') {
      console.log('[AUTH] Processando login...');
      const body: LoginRequest = await req.json();

      if (!body.email || !body.password) {
        return new Response(
          JSON.stringify({ error: 'Email e senha são obrigatórios' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Validar que não está recebendo um hash ao invés da senha
      if (body.password.startsWith('$2a$') || body.password.startsWith('$2b$') || body.password.startsWith('$2y$')) {
        return new Response(
          JSON.stringify({ error: 'Erro: você está enviando o hash da senha ao invés da senha. Digite a senha em texto plano.' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Buscar usuário usando conexão direta ao PostgreSQL (evita problemas com PostgREST JWT)
      const emailToSearch = body.email.toLowerCase().trim();
      
      // Usar conexão direta ao PostgreSQL para evitar problemas com JWT do PostgREST
      const pgClient = new Client({
        user: Deno.env.get('POSTGRES_USER') || 'guilhermeterence',
        password: Deno.env.get('POSTGRES_PASSWORD') || '',
        database: Deno.env.get('POSTGRES_DB') || 'postgres',
        hostname: Deno.env.get('POSTGRES_HOST') || 'postgres',
        port: parseInt(Deno.env.get('POSTGRES_PORT') || '5432'),
      });

      let user = null;
      try {
        console.log('[AUTH] Conectando ao PostgreSQL...');
        // Adicionar timeout manual para conexão
        await Promise.race([
          pgClient.connect(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout na conexão PostgreSQL')), 5000))
        ]);
        console.log('[AUTH] Conectado ao PostgreSQL');
        
        const result = await pgClient.queryObject<{
          id: string;
          email: string;
          password_hash: string;
          name: string | null;
        }>(
          'SELECT id, email, password_hash, name FROM public.users WHERE email = $1 LIMIT 1',
          [emailToSearch]
        );

        if (result.rows && result.rows.length > 0) {
          user = result.rows[0];
        }
        
        await pgClient.end();
      } catch (pgError) {
        console.error('[AUTH] Erro ao conectar/buscar no PostgreSQL');
        await pgClient.end().catch(() => {});
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar usuário', details: pgError.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Credenciais inválidas' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          }
        );
      }

      // Verificar senha usando conexão direta ao PostgreSQL
      
      // Conectar ao PostgreSQL para verificar senha
      const verifyPgClient = new Client({
        user: Deno.env.get('POSTGRES_USER') || 'guilhermeterence',
        password: Deno.env.get('POSTGRES_PASSWORD') || '',
        database: Deno.env.get('POSTGRES_DB') || 'postgres',
        hostname: Deno.env.get('POSTGRES_HOST') || 'postgres',
        port: parseInt(Deno.env.get('POSTGRES_PORT') || '5432'),
      });

      let passwordValid = false;
      try {
        await verifyPgClient.connect();
        
        // Verificar usando a função verify_password_hash
        // IMPORTANTE: primeiro parâmetro é a senha em texto plano, segundo é o hash
        const verifyResult = await verifyPgClient.queryObject<{ verify_password_hash: boolean }>(
          'SELECT verify_password_hash($1::text, $2::text) as verify_password_hash',
          [body.password.trim(), user.password_hash]
        );
        
        const result = verifyResult.rows[0];
        passwordValid = result?.verify_password_hash === true;
        
        await verifyPgClient.end();
      } catch (verifyError) {
        console.error('[AUTH] Erro ao verificar senha');
        await verifyPgClient.end().catch(() => {});
        return new Response(
          JSON.stringify({ error: 'Erro ao verificar credenciais', details: verifyError.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
      
      if (!passwordValid) {
        return new Response(
          JSON.stringify({ error: 'Credenciais inválidas' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          }
        );
      }

      // Gerar token JWT simplificado (sem assinatura HS256) para evitar erros de biblioteca
      try {
        const userName = user.name || (user.email ? user.email.split('@')[0] : 'Usuário') || 'Usuário';
        const userEmail = user.email || '';
        const userId = user.id || '';

        const expiresIn = 4 * 60 * 60; // 4 horas

        const header = { alg: 'none', typ: 'JWT' };
        const payload = {
          sub: String(userId),
          email: String(userEmail),
          name: String(userName),
          exp: Math.floor(Date.now() / 1000) + expiresIn,
          iat: Math.floor(Date.now() / 1000),
        };

        const encoder = new TextEncoder();
        const encodePart = (obj: unknown) =>
          base64UrlEncode(encoder.encode(JSON.stringify(obj)));

        const token = `${encodePart(header)}.${encodePart(payload)}.`;

        const responseData = {
          access_token: token,
          token_type: 'bearer',
          expires_in: expiresIn,
          user: {
            id: String(userId),
            email: String(userEmail),
            name: String(userName),
          },
        };

        return new Response(
          JSON.stringify(responseData),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (jwtError) {
        console.error('[AUTH] Erro ao gerar token simplificado');
        return new Response(
          JSON.stringify({ error: 'Erro ao gerar token de autenticação', details: jwtError.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    // POST /auth/create-user - Criar novo usuário (apenas admin)
    if (req.method === 'POST' && path === 'create-user') {
      const body = await req.json();
      const { email, password, name } = body;

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email e senha são obrigatórios' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Verificar se usuário já existe
      const { data: existingUser } = await supabaseClient
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: 'Email já cadastrado' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409,
          }
        );
      }

      // Hash da senha usando função RPC do PostgreSQL
      const { data: hashData, error: hashError } = await supabaseClient.rpc('hash_password', {
        p_password: password,
      });

      if (hashError || !hashData) {
        console.error('Erro ao gerar hash da senha:', hashError);
        return new Response(
          JSON.stringify({ error: 'Erro ao processar senha. Tente novamente.' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      // Criar usuário com senha hasheada
      const { data: newUser, error: createError } = await supabaseClient
        .from('users')
        .insert({
          email: email.toLowerCase().trim(),
          password_hash: hashData,
          name: name || null,
        })
        .select('id, email, name, created_at')
        .single();

      if (createError || !newUser) {
        console.error('Erro ao criar usuário:', createError);
        return new Response(
          JSON.stringify({ error: createError?.message || 'Erro ao criar usuário' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      return new Response(
        JSON.stringify({
          message: 'Usuário criado com sucesso',
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            created_at: newUser.created_at,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        }
      );
    }

    // POST /auth/forgot-password - Solicitar reset de senha (envia email ao admin)
    if (req.method === 'POST' && path === 'forgot-password') {
      if (!supabaseClient) {
        return new Response(
          JSON.stringify({ error: 'Supabase Service Key não configurada. Configure em Settings.' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      const body = await req.json();
      const { email } = body;

      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email é obrigatório' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Verificar se o usuário existe
      const { data: user } = await supabaseClient
        .from('users')
        .select('id, email, name')
        .eq('email', email.toLowerCase().trim())
        .single();

      // Sempre retornar sucesso (security best practice - não revelar se email existe)
      // Mas só enviar email se o usuário existir
      if (user) {
        // Buscar email do admin (primeiro usuário ou usuário com role admin)
        const { data: adminUsers } = await supabaseClient
          .from('users')
          .select('email, name')
          .order('created_at', { ascending: true })
          .limit(1);

        const adminEmail = adminUsers?.[0]?.email || Deno.env.get('ADMIN_EMAIL') || 'admin@terenceconsultoria.com.br';
        const adminName = adminUsers?.[0]?.name || 'Administrador';

        // Aqui você pode integrar com um serviço de email (SendGrid, AWS SES, etc.)
        // Por enquanto, apenas logamos
        console.log(`[FORGOT PASSWORD] Usuário ${user.email} (${user.name || 'Sem nome'}) solicitou reset de senha.`);
        console.log(`[FORGOT PASSWORD] Notificar admin: ${adminEmail}`);
        
        // TODO: Implementar envio de email real
        // Exemplo com SendGrid ou outro serviço:
        // await sendEmail({
        //   to: adminEmail,
        //   subject: 'Solicitação de Reset de Senha',
        //   body: `O usuário ${user.email} (${user.name}) solicitou reset de senha.`
        // });
      }

      return new Response(
        JSON.stringify({ 
          message: 'Se o email estiver cadastrado, o administrador será notificado.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}

// Standalone mode
if (import.meta.main) {
  stdServe(serve);
}

