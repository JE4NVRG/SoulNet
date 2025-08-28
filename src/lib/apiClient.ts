import { supabase } from './supabaseClient';
import { toast } from 'sonner';

/**
 * Cliente API que automaticamente injeta o access_token do Supabase
 * e trata erros 401 com redirecionamento para login
 */
export async function apiFetch(path: string, init: RequestInit = {}) {
  try {
    // Obter sessão atual do Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    // Preparar headers
    const headers = new Headers(init.headers || {});
    
    // Injetar token de autorização se disponível
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Definir Content-Type padrão se não especificado
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }

    // Fazer a requisição
    const response = await fetch(path, {
      ...init,
      headers,
    });

    // Tratar erros HTTP (status >= 400)
    if (response.status >= 400) {
      let errorMessage = 'Erro no servidor. Tente novamente.';
      
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Se falhar ao parsear JSON, usar mensagem padrão
        console.warn('Failed to parse error response as JSON');
      }
      
      // Tratar erro 401 especificamente
      if (response.status === 401) {
        toast.error('Sua sessão expirou. Entre novamente.', {
          duration: 4000,
        });
        
        // Limpar sessão do Supabase
        await supabase.auth.signOut();
        
        // Redirecionar para login
        window.location.href = '/login?reason=unauthorized';
        
        return Promise.reject(new Error('Unauthorized'));
      }
      
      // Para outros erros, exibir toast com mensagem
      toast.error(errorMessage, {
        duration: 4000,
      });
      
      return Promise.reject(new Error(errorMessage));
    }

    return response;
  } catch (error) {
    // Se o erro não for de rede, re-lançar
    if (error instanceof Error && error.message === 'Unauthorized') {
      throw error;
    }
    
    // Para outros erros de rede, exibir toast genérico
    toast.error('Erro de conexão. Tente novamente.', {
      duration: 3000,
    });
    
    throw error;
  }
}

/**
 * Wrapper para requisições GET
 */
export async function apiGet(path: string, params?: Record<string, string>) {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  const response = await apiFetch(url.toString());
  return response.json();
}

/**
 * Wrapper para requisições POST
 */
export async function apiPost(path: string, data?: any) {
  const response = await apiFetch(path, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
}

/**
 * Wrapper para requisições PUT
 */
export async function apiPut(path: string, data?: any) {
  const response = await apiFetch(path, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
}

/**
 * Wrapper para requisições DELETE
 */
export async function apiDelete(path: string) {
  const response = await apiFetch(path, {
    method: 'DELETE',
  });
  return response.json();
}