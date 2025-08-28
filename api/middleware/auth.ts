import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { getEnvConfig } from '../utils/assertEnv';
import { sendUnauthorized } from '../utils/apiResponse';

// Extend Express Request interface to include user and token
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
      token?: string;
    }
  }
}

// Get validated environment configuration
const envConfig = getEnvConfig();

// Create Supabase admin client for token validation
const supabaseAdmin = createClient(
  envConfig.VITE_SUPABASE_URL,
  envConfig.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Middleware to require authentication for protected routes
 * Validates JWT token from Authorization header using Supabase admin client
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    
    if (!token) {
      sendUnauthorized(res, 'Missing authorization token');
      return;
    }

    // Validate token using Supabase admin client
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !data?.user) {
      console.error('[AUTH ERROR] Token validation failed:', error?.message);
      sendUnauthorized(res, 'Invalid or expired token');
      return;
    }

    // Populate request with user info and token
    req.user = {
      id: data.user.id,
      email: data.user.email
    };
    req.token = token;
    
    next();
  } catch (error) {
    console.error('[AUTH MIDDLEWARE ERROR]', error);
    sendUnauthorized(res, 'Authentication failed');
  }
}

/**
 * Helper function to create user-scoped Supabase client with RLS
 * Uses ANON key + Authorization header to respect Row Level Security
 */
export function userScopedClient(token: string) {
  const envConfig = getEnvConfig();
  return createClient(
    envConfig.VITE_SUPABASE_URL,
    envConfig.VITE_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );
}