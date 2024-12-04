/**
 * Test Storage API Route
 * 
 * Purpose: Testing endpoint for storage functionality
 * Note: This endpoint is for development/testing only
 */
import { NextResponse } from 'next/server'
import { StorageService } from '@/services/storage'
import path from 'path'

// Create a singleton instance
const storage = new StorageService()

export async function GET() {
  const results = {
    steps: [] as string[],
    errors: [] as string[],
    success: false
  }

  try {
    // Initialize storage
    results.steps.push('Initializing storage...')
    const basePath = path.join(process.cwd(), 'tmp', 'screenshots')
    results.steps.push(`Base path: ${basePath}`)
    await storage.init()
    
    // Create a test session
    results.steps.push('Creating session...')
    const session = await storage.createSession()
    results.steps.push(`Session created: ${session.id}`)
    results.steps.push(`Session path: ${session.path}`)
    
    // Get storage stats
    results.steps.push('Getting storage stats...')
    const stats = await storage.getStats()
    results.steps.push(`Storage stats: ${JSON.stringify(stats, null, 2)}`)

    results.success = true
    return NextResponse.json({
      success: true,
      results,
      session,
      stats
    })
  } catch (error) {
    results.errors.push(error instanceof Error ? error.message : String(error))
    console.error('Storage test error:', error)
    return NextResponse.json({ 
      success: false,
      results,
      error: 'Storage test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 