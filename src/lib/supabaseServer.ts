import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase server environment variables')
}

// Server-side Supabase client with service role key
export const supabaseServer = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper to verify JWT token and get user
export const verifyAuthToken = async (authHeader: string | undefined) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')
  
  try {
    const { data: { user } } = await supabaseServer.auth.getUser(token)
    return { user, error: null }
  } catch {
    return { user: null, error: 'Invalid token' }
  }
}

// Helper to get user from request
export const getUserFromRequest = async (req: { headers: { authorization?: string } }) => {
  const authHeader = req.headers.authorization
  return await verifyAuthToken(authHeader)
}