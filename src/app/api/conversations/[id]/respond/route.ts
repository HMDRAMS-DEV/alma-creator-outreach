import { NextRequest, NextResponse } from 'next/server'
import { AIConversationHandler } from '@/services/ai-conversation-simplified'

// Mock data - same as other conversation routes
const mockConversations = [
  {
    id: 1,
    creatorId: 1,
    creatorUsername: 'productivitypro',
    platform: 'instagram',
    status: 'in_progress',
    lastMessage: "That sounds interesting! Can you tell me more about the partnership terms?",
    lastMessageTime: '2025-01-23T10:30:00Z',
    messageCount: 4,
    isFromCreator: true,
    intent: 'interested',
    qualificationScore: 85,
    tags: ['interested', 'partnership_discussion'],
    createdAt: '2025-01-20T09:00:00Z',
    updatedAt: '2025-01-23T10:30:00Z'
  }
]

const mockMessages = {
  1: [
    {
      id: 1,
      conversationId: 1,
      content: "Hi! I saw your content about productivity and thought you'd be perfect for a collaboration with our app. Would you be interested in learning more?",
      isFromAI: true,
      intent: 'discovery',
      createdAt: '2025-01-20T09:00:00Z'
    },
    {
      id: 2,
      conversationId: 1,
      content: "Hi there! Thanks for reaching out. I'm always interested in productivity tools. What kind of collaboration did you have in mind?",
      isFromAI: false,
      intent: 'interested',
      createdAt: '2025-01-20T14:30:00Z'
    },
    {
      id: 3,
      conversationId: 1,
      content: "Great! We're a productivity app that helps entrepreneurs stay organized. We're looking for creators to showcase real-world usage. The partnership would include product access, potential revenue sharing, and content collaboration opportunities.",
      isFromAI: true,
      intent: 'information',
      createdAt: '2025-01-22T10:15:00Z'
    },
    {
      id: 4,
      conversationId: 1,
      content: "That sounds interesting! Can you tell me more about the partnership terms?",
      isFromAI: false,
      intent: 'interested',
      createdAt: '2025-01-23T10:30:00Z'
    }
  ]
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = parseInt(params.id)
    
    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: 'Invalid conversation ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { 
      responseType = 'auto', // 'auto' | 'manual'
      customMessage,
      systemPrompt
    } = body

    // Find the conversation
    const conversation = mockConversations.find(c => c.id === conversationId)
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get conversation messages
    const messages = mockMessages[conversationId as keyof typeof mockMessages] || []

    let responseContent: string
    let aiResponse: any = null

    if (responseType === 'manual' && customMessage) {
      // Use provided custom message
      responseContent = customMessage
    } else {
      // Generate AI response
      try {
        const aiHandler = new AIConversationHandler()
        
        const conversationContext = {
          id: conversationId,
          creatorUsername: conversation.creatorUsername,
          platform: conversation.platform,
          creatorBio: '', // Would fetch from creator data
          creatorFollowers: 0, // Would fetch from creator data
          messages: messages.map(msg => ({
            content: msg.content,
            isFromAI: msg.isFromAI,
            timestamp: msg.createdAt,
            intent: msg.intent
          }))
        }

        const latestMessage = messages[messages.length - 1]
        if (!latestMessage) {
          return NextResponse.json(
            { error: 'No messages found in conversation' },
            { status: 400 }
          )
        }

        aiResponse = await aiHandler.generateResponse(
          conversationContext,
          latestMessage,
          systemPrompt
        )

        responseContent = aiResponse.content
      } catch (aiError) {
        console.error('AI response generation failed:', aiError)
        return NextResponse.json({
          error: 'Failed to generate AI response',
          message: aiError instanceof Error ? aiError.message : 'AI generation failed'
        }, { status: 500 })
      }
    }

    // Add the new message to the conversation
    const newMessageId = Math.max(...Object.values(mockMessages).flat().map(m => m.id)) + 1
    const newMessage = {
      id: newMessageId,
      conversationId,
      content: responseContent,
      isFromAI: responseType === 'auto',
      intent: aiResponse?.intent || 'response',
      createdAt: new Date().toISOString()
    }

    if (!(conversationId in mockMessages)) {
      (mockMessages as any)[conversationId] = []
    }
    ;(mockMessages as any)[conversationId].push(newMessage)

    // Update conversation metadata
    const conversationIndex = mockConversations.findIndex(c => c.id === conversationId)
    if (conversationIndex !== -1) {
      mockConversations[conversationIndex] = {
        ...mockConversations[conversationIndex],
        lastMessage: responseContent,
        lastMessageTime: newMessage.createdAt,
        messageCount: (mockMessages as any)[conversationId].length,
        isFromCreator: false,
        intent: aiResponse?.intent || conversation.intent,
        qualificationScore: aiResponse?.qualificationScore || conversation.qualificationScore,
        updatedAt: newMessage.createdAt
      }

      // Update status based on AI recommendation
      if (aiResponse?.shouldEscalate) {
        mockConversations[conversationIndex].status = 'escalated'
        const existingTags = conversation.tags
        const newTags = ['escalated', 'qualified_lead']
        const uniqueTags = Array.from(new Set([...existingTags, ...newTags]))
        mockConversations[conversationIndex].tags = uniqueTags
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: newMessage,
        conversation: mockConversations[conversationIndex],
        aiMetadata: aiResponse ? {
          confidence: aiResponse.confidence,
          shouldEscalate: aiResponse.shouldEscalate,
          qualificationScore: aiResponse.qualificationScore,
          suggestedActions: aiResponse.suggestedActions
        } : null
      },
      message: 'Response sent successfully'
    })

  } catch (error) {
    console.error('Send response error:', error)
    return NextResponse.json({
      error: 'Failed to send response',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 })
  }
}