import { NextRequest, NextResponse } from 'next/server'
import { AIConversationHandler } from '@/services/ai-conversation-simplified'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, context } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message text is required' },
        { status: 400 }
      )
    }

    const aiHandler = new AIConversationHandler()
    
    // Classify the intent of the message
    const classification = await aiHandler.classifyIntent(message, context)

    return NextResponse.json({
      success: true,
      data: {
        intent: classification.intent,
        confidence: classification.confidence,
        category: classification.category,
        sentiment: classification.sentiment,
        keywords: classification.keywords,
        urgency: classification.urgency,
        actionRequired: classification.actionRequired,
        suggestedResponse: classification.suggestedResponse
      },
      message: 'Intent classified successfully'
    })

  } catch (error) {
    console.error('Intent classification error:', error)
    
    return NextResponse.json({
      error: 'Failed to classify intent',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 })
  }
}