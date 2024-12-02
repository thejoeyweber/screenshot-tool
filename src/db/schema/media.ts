/**
 * Media Schema
 * Defines the structure for media data (websites, animated ads, videos, emails)
 */
import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { type InferModel } from 'drizzle-orm'
import { projects } from './projects'

export const mediaTypes = ['website', 'animated_ad', 'video', 'email'] as const
export type MediaType = typeof mediaTypes[number]

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id),
  mediaType: text('media_type', { enum: mediaTypes }).notNull(),
  metadata: jsonb('metadata').$type<{
    url?: string
    adSizes?: string[]
    emailVariables?: Record<string, string>
    duration?: number
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Zod schemas for type validation
export const insertMediaSchema = createInsertSchema(media)
export const selectMediaSchema = createSelectSchema(media)

// Drizzle inferred types
export type Media = InferModel<typeof media>
export type NewMedia = InferModel<typeof media, 'insert'> 