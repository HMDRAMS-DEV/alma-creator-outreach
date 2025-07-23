import { NextRequest, NextResponse } from 'next/server'
import { InstagramScraperService } from '@/services/instagram-scraper-simplified'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      creatorUsername,
      message,
      credentials,
      templateId
    } = body

    if (!creatorUsername || !message) {
      return NextResponse.json(
        { error: 'creatorUsername and message are required' },
        { status: 400 }
      )
    }

    if (!credentials || !credentials.username || !credentials.password) {
      return NextResponse.json(
        { error: 'Instagram credentials are required' },
        { status: 400 }
      )
    }

    const startTime = Date.now()
    const scraperService = new InstagramScraperService()

    try {
      // Initialize and login
      await scraperService.initialize()
      await scraperService.login(credentials.username, credentials.password)

      // Send direct message
      const result = await scraperService.sendDirectMessage(creatorUsername, message)

      if (!result.success) {
        return NextResponse.json({
          error: 'Failed to send Instagram DM',
          message: 'Unknown error occurred',
          details: result
        }, { status: 400 })
      }

      const endTime = Date.now()

      // Clean up
      await scraperService.cleanup()

      return NextResponse.json({
        success: true,
        data: {
          messageId: result.messageId,
          recipient: creatorUsername,
          sentAt: new Date().toISOString(),
          platform: 'instagram',
          templateId,
          processingTime: endTime - startTime
        },
        message: `Direct message sent to @${creatorUsername} successfully`
      })

    } catch (automationError) {
      await scraperService.cleanup()
      throw automationError
    }

  } catch (error) {
    console.error('Instagram outreach error:', error)
    
    // Handle specific Instagram errors
    const errorMessage = error instanceof Error ? error.message : ''
    if (errorMessage.includes('login failed')) {
      return NextResponse.json({
        error: 'Instagram authentication failed',
        message: 'Invalid credentials or account temporarily restricted'
      }, { status: 401 })
    }

    if (errorMessage.includes('rate limit')) {
      return NextResponse.json({
        error: 'Instagram rate limit exceeded',
        message: 'Too many requests. Please wait before sending more messages.'
      }, { status: 429 })
    }

    if (errorMessage.includes('user not found')) {
      return NextResponse.json({
        error: 'Creator not found',
        message: 'Instagram user does not exist or is private'
      }, { status: 404 })
    }

    if (errorMessage.includes('message blocked')) {
      return NextResponse.json({
        error: 'Message blocked by Instagram',
        message: 'Instagram detected the message as spam or violation of community guidelines'
      }, { status: 403 })
    }

    return NextResponse.json({
      error: 'Instagram outreach failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      note: 'This may be due to Instagram anti-automation measures. Consider using different credentials or waiting before retrying.'
    }, { status: 500 })
  }
}