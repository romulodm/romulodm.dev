import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { generatePresignedUpload, validateFileUpload } from '@/lib/s3'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { filename, contentType, kind } = await request.json()

    // Validate input
    if (!filename || !contentType || !kind) {
      return NextResponse.json(
        { error: 'Missing required fields: filename, contentType, kind' },
        { status: 400 }
      )
    }

    if (!['cover', 'inline'].includes(kind)) {
      return NextResponse.json(
        { error: 'Invalid kind. Must be "cover" or "inline"' },
        { status: 400 }
      )
    }

    // Validate file type
    try {
      validateFileUpload(contentType)
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 400 }
      )
    }

    // Generate presigned URL
    const result = await generatePresignedUpload(filename, contentType, kind)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Presign error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
