/**
 * User Queries
 * Database operations for users
 */
import { db } from '@/db'
import { users, type User, type NewUser } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getUserById(id: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.id, id))
  return result[0]
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.email, email))
  return result[0]
}

export async function createUser(user: NewUser): Promise<User> {
  const result = await db.insert(users).values(user).returning()
  return result[0]
}

export async function updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
  const result = await db.update(users).set(user).where(eq(users.id, id)).returning()
  return result[0]
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await db.delete(users).where(eq(users.id, id)).returning()
  return result.length > 0
} 