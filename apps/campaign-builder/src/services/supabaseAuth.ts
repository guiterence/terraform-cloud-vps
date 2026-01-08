// Serviço de autenticação usando tabela public.users
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://supabase.terenceconsultoria.com.br';
const SUPABASE_SERVICE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_KEY || '';

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

export async function signIn(email: string, password: string, remember?: boolean): Promise<AuthResponse> {
  let response: Response;
  
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        email,
        password,
        remember: remember || false,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Erro ao fazer login';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || `Erro ${response.status}: ${response.statusText}`;
      } catch {
        if (response.status === 0 || response.status >= 500) {
          errorMessage = 'Servidor indisponível. Verifique sua conexão ou tente novamente mais tarde.';
        } else if (response.status === 401) {
          errorMessage = 'Credenciais inválidas. Verifique seu email e senha.';
        } else if (response.status === 404) {
          errorMessage = 'Serviço de autenticação não encontrado. Contate o suporte.';
        } else {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data) {
      throw new Error('Resposta inválida do servidor');
    }

    if (!data.user) {
      throw new Error('Resposta inválida do servidor: objeto user não encontrado');
    }

    const userData = data.user || {};

    return {
      access_token: data.access_token || '',
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in || 3600,
      user: {
        id: String(userData.id || ''),
        email: String(userData.email || email || ''),
        name: String(userData.name || userData.email?.split('@')[0] || email?.split('@')[0] || 'Usuário'),
      },
    };
  } catch (err: any) {
    if (err.message && err.message !== 'Failed to fetch') {
      throw err;
    }
    // Erro de rede ou CORS
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão com a internet e se o serviço está disponível.');
  }
}

export async function signUp(email: string, password: string, name?: string): Promise<AuthResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({
      email,
      password,
      name: name || undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao criar conta' }));
    throw new Error(error.error || error.message || 'Erro ao criar conta');
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    token_type: data.token_type || 'bearer',
    expires_in: data.expires_in || 3600,
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name || name || data.user.email?.split('@')[0],
    },
  };
}

export async function signOut(token: string): Promise<void> {
  // Implementação futura para logout
  // Por enquanto, apenas limpar o token localmente
  localStorage.removeItem('auth_token');
}

export async function refreshToken(refreshToken: string): Promise<AuthResponse> {
  // Implementação futura para refresh token
  // Por enquanto, retornar erro
  throw new Error('Refresh token não implementado ainda');
}

