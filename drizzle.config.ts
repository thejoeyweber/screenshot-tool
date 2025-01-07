/**
 * Drizzle Configuration
 */
import type { Config } from 'drizzle-kit'
import * as dotenv from 'dotenv'

dotenv.config()

export default {
  schema: './src/db/schema/*',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
  } : {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'screenshot_tool',
  },
  verbose: true,
  strict: true,
} satisfies Config 