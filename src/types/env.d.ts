/**
 * Environment Variables Type Definitions
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string
      SUPABASE_SERVICE_ROLE_KEY: string
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string
      CLERK_SECRET_KEY: string
      DATABASE_URL: string
      OPENAI_API_KEY?: string
      VERCEL_URL?: string
      NODE_ENV: 'development' | 'production' | 'test'
    }
  }
} 