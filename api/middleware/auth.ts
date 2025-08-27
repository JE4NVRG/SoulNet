import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

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

// Create Supabase admin client for token validation
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
      res.status(401).json({ error: 'Missing token' });
      return;
    }

    // Validate token using Supabase admin client
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !data?.user) {
      res.status(401).json({ error: 'Invalid token' });
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
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

/**
 * Helper function to create user-scoped Supabase client with RLS
 * Uses ANON key + Authorization header to respect Row Level Security
 */
export function userScopedClient(token: string) {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );
}