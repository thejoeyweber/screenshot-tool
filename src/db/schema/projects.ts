/**
 * Projects Schema
 * Defines the structure for project data
 */
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { type InferModel } from 'drizzle-orm'
import { organizations } from './organizations'
import { users } from './users'

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  projectName: text('project_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Zod schemas for type validation
export const insertProjectSchema = createInsertSchema(projects)
export const selectProjectSchema = createSelectSchema(projects)

// Drizzle inferred types
export type Project = InferModel<typeof projects>
export type NewProject = InferModel<typeof projects, 'insert'> 