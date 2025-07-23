import { NextRequest, NextResponse } from 'next/server'
import { AIConversationHandler } from '@/services/ai-conversation-simplified'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      conversationId, 
      messages, 
      creatorContext,
      systemPrompt 
    } = body

    if (!conversationId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'conversationId and messages array are required' },
        { status: 400 }
      )
    }

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'At least one message is required' },
        { status: 400 }
      )
    }

    const aiHandler = new AIConversationHandler()
    
    // Prepare conversation context
    const conversationContext = {
      id: conversationId,
      creatorUsername: creatorContext?.username || 'creator',
      platform: creatorContext?.platform || 'instagram',
      creatorBio: creatorContext?.bio || '',
      creatorFollowers: creatorContext?.followers || 0,
      messages: messages.map(msg => ({
        content: msg.content,
        isFromAI: msg.isFromAI || false,
        timestamp: msg.createdAt || new Date().toISOString(),
        intent: msg.intent
      }))
    }

    // Get the latest message (what we're responding to)
    const latestMessage = messages[messages.length - 1]
    
    // Generate AI response
    const aiResponse = await aiHandler.generateResponse(
      conversationContext,
      latestMessage,
      systemPrompt
    )

    return NextResponse.json({
      success: true,
      data: {
        response: aiResponse.content,
        intent: aiResponse.intent,
        confidence: aiResponse.confidence,
        shouldEscalate: aiResponse.shouldEscalate,
        qualificationScore: aiResponse.qualificationScore,
        suggestedActions: aiResponse.suggestedActions,
        metadata: {
          model: aiResponse.model,
          tokensUsed: aiResponse.tokensUsed,
          processingTime: aiResponse.processingTime
        }
      },
      message: 'AI response generated successfully'
    })

  } catch (error) {
    console.error('AI response generation error:', error)
    
    // Handle specific API errors
    const errorMessage = error instanceof Error ? error.message : ''
    if (errorMessage.includes('API key')) {
      return NextResponse.json({
        error: 'AI service configuration error',
        message: 'Anthropic API key is not configured or invalid'
      }, { status: 503 })
    }

    if (errorMessage.includes('rate limit')) {
      return NextResponse.json({
        error: 'AI service rate limited',
        message: 'Too many requests to AI service. Please try again later.'
      }, { status: 429 })
    }

    return NextResponse.json({
      error: 'Failed to generate AI response',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 })
  }
}