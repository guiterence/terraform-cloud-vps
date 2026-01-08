const AUTH_TOKEN_KEY = 'auth_token';
const N8N_API_KEY_KEY = 'n8n_api_key';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export function decodeJWT(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );

    // Verificar se expirou
    if (payload.exp * 1000 < Date.now()) {
      return null; // Token expirado
    }

    return {
      id: payload.sub || payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch (error) {
    console.error('Erro ao decodificar JWT:', error);
    return null;
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getN8NApiKey(): string | null {
  return localStorage.getItem(N8N_API_KEY_KEY);
}

export function setN8NApiKey(apiKey: string): void {
  localStorage.setItem(N8N_API_KEY_KEY, apiKey);
}

export function removeN8NApiKey(): void {
  localStorage.removeItem(N8N_API_KEY_KEY);
}

// Supabase Service Key
const SUPABASE_SERVICE_KEY_KEY = 'supabase_service_key';

export function getSupabaseServiceKey(): string | null {
  return localStorage.getItem(SUPABASE_SERVICE_KEY_KEY);
}

export function setSupabaseServiceKey(serviceKey: string): void {
  localStorage.setItem(SUPABASE_SERVICE_KEY_KEY, serviceKey);
}

export function removeSupabaseServiceKey(): void {
  localStorage.removeItem(SUPABASE_SERVICE_KEY_KEY);
}

export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  
  const user = decodeJWT(token);
  return user !== null;
}

export function getCurrentUser(): AuthUser | null {
  const token = getAuthToken();
  if (!token) return null;
  
  return decodeJWT(token);
}

export function signOut(): void {
  removeAuthToken();
  removeN8NApiKey();
  // Não remover Supabase Service Key pois é uma configuração do sistema
  // removeSupabaseServiceKey();
}

