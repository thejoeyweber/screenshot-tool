/**
 * Database Configuration
 * Sets up and exports database client
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

// Connection string from environment variable
const connectionString = process.env.DATABASE_URL

// Create postgres connection
const client = postgres(connectionString)

// Create drizzle database instance
export const db = drizzle(client, { schema })

// Export schema for use in other files
export * from './schema/index' 