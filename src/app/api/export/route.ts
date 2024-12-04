import { NextResponse } from 'next/server'

// Extend RequestInit to include duplex option
interface ExtendedRequestInit extends RequestInit {
  duplex?: 'half'
}

export async function POST(request: Request) {
  try {
    // Clone the request before reading it
    const clonedRequest = request.clone()
    const { options } = await clonedRequest.json()
    
    // Get the request body as JSON string
    const body = await request.json()
    
    // Forward to appropriate endpoint
    const response = await fetch(
      `${request.url}/${options.format}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        duplex: 'half'
      } as ExtendedRequestInit
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `${options.format.toUpperCase()} export failed`)
    }

    const blob = await response.blob()
    return new NextResponse(blob, {
      headers: response.headers
    })
  } catch (error) {
    console.error('Export router error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
} 