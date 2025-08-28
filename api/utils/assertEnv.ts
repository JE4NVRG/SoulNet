/**
 * Utility for fail-fast environment variable validation
 * Ensures all required environment variables are present before starting the server
 */

interface EnvConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

/**
 * Validates that all required environment variables are present
 * Logs missing variables and throws an error if any are missing
 */
export function assertEnv(): EnvConfig {
  const requiredEnvs = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingEnvs: string[] = [];

  for (const envVar of requiredEnvs) {
    if (!process.env[envVar]) {
      missingEnvs.push(envVar);
    }
  }

  if (missingEnvs.length > 0) {
    console.error('[ENV MISSING] Required environment variables are missing:', missingEnvs.join(', '));
    throw new Error(`Missing required environment variables: ${missingEnvs.join(', ')}`);
  }

  return {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL!,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!
  };
}

/**
 * Validates environment variables and returns them in a safe way
 * Used by other modules to ensure env vars are available
 */
export function getEnvConfig(): EnvConfig {
  try {
    return assertEnv();
  } catch (error) {
    console.error('[ENV ERROR]', error);
    throw error;
  }
}