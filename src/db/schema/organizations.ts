/**
 * Organizations Schema
 * Defines the structure for organization data
 */
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { type InferModel } from 'drizzle-orm'

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Zod schemas for type validation
export const insertOrganizationSchema = createInsertSchema(organizations)
export const selectOrganizationSchema = createSelectSchema(organizations)

// Drizzle inferred types
export type Organization = InferModel<typeof organizations>
export type NewOrganization = InferModel<typeof organizations, 'insert'> 