import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate email
    const result = subscribeSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email } = result.data

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({
      where: { email },
    })

    if (existing) {
      if (existing.verified) {
        return NextResponse.json(
          { error: 'Email already subscribed' },
          { status: 400 }
        )
      }
      // Resend verification email
      // TODO: Implement email sending
      console.log(`Resending verification email to: ${email}`)
      return NextResponse.json({
        success: true,
        message: 'Verification email sent',
      })
    }

    // Create new subscriber
    const subscriber = await prisma.subscriber.create({
      data: { email },
    })

    // TODO: Send verification email
    console.log(`Verification email should be sent to: ${email}`)
    console.log(`Verification token: ${subscriber.unsubToken}`)

    return NextResponse.json({
      success: true,
      message: 'Subscription successful! Please check your email to verify.',
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
