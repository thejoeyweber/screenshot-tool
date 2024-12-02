/**
 * Screenshots Schema
 * Defines the structure for screenshot data
 */
import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { type InferModel } from 'drizzle-orm'
import { media } from './media'

export const screenshotTypes = ['key_frame', 'size_variant'] as const
export type ScreenshotType = typeof screenshotTypes[number]

export const screenshots = pgTable('screenshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaId: uuid('media_id').references(() => media.id),
  screenshotType: text('screenshot_type', { enum: screenshotTypes }).notNull(),
  filePath: text('file_path').notNull(),
  metadata: jsonb('metadata').$type<{
    resolution?: { width: number; height: number }
    size?: number
    frameTimestamp?: number
    annotations?: Array<{
      type: string
      content: string
      position: { x: number; y: number }
    }>
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Zod schemas for type validation
export const insertScreenshotSchema = createInsertSchema(screenshots)
export const selectScreenshotSchema = createSelectSchema(screenshots)

// Drizzle inferred types
export type Screenshot = InferModel<typeof screenshots>
export type NewScreenshot = InferModel<typeof screenshots, 'insert'> 