/**
 * Sources Schema
 * Defines the structure for source data (pages, frames)
 */
import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { type InferModel } from 'drizzle-orm'
import { media } from './media'

export const sourceTypes = ['page', 'frame'] as const
export type SourceType = typeof sourceTypes[number]

export const sources = pgTable('sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaId: uuid('media_id').references(() => media.id),
  sourceType: text('source_type', { enum: sourceTypes }).notNull(),
  metadata: jsonb('metadata').$type<{
    url?: string
    frameDescription?: string
    timestamp?: number
    index?: number
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Zod schemas for type validation
export const insertSourceSchema = createInsertSchema(sources)
export const selectSourceSchema = createSelectSchema(sources)

// Drizzle inferred types
export type Source = InferModel<typeof sources>
export type NewSource = InferModel<typeof sources, 'insert'> 