import { NextRequest, NextResponse } from 'next/server'

// Mock messages data - same as in conversation route
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
  ],
  2: [
    {
      id: 5,
      conversationId: 2,
      content: "Hi! I saw your content about side hustles and thought you'd be perfect for a collaboration with our productivity app. Would you be interested in learning more?",
      isFromAI: true,
      intent: 'discovery',
      createdAt: '2025-01-22T15:45:00Z'
    }
  ],
  3: [
    {
      id: 6,
      conversationId: 3,
      content: "Hi! Your startup content is amazing. We'd love to explore a partnership with our productivity app. Are you open to collaborations?",
      isFromAI: true,
      intent: 'discovery',
      createdAt: '2025-01-19T14:00:00Z'
    },
    {
      id: 7,
      conversationId: 3,
      content: "Thanks! I'm definitely open to partnerships. What's your app about?",
      isFromAI: false,
      intent: 'interested',
      createdAt: '2025-01-19T18:20:00Z'
    },
    {
      id: 8,
      conversationId: 3,
      content: "We're a productivity platform for entrepreneurs. We help with task management, goal tracking, and workflow optimization. Perfect for your startup audience!",
      isFromAI: true,
      intent: 'information',
      createdAt: '2025-01-20T09:45:00Z'
    },
    {
      id: 9,
      conversationId: 3,
      content: "That sounds great! My audience would love that. What kind of partnership are you thinking?",
      isFromAI: false,
      intent: 'interested',
      createdAt: '2025-01-20T15:30:00Z'
    },
    {
      id: 10,
      conversationId: 3,
      content: "We offer sponsored content opportunities, affiliate partnerships, and product collaborations. The compensation varies based on your audience size and engagement.",
      isFromAI: true,
      intent: 'information',
      createdAt: '2025-01-21T08:00:00Z'
    },
    {
      id: 11,
      conversationId: 3,
      content: "Yes, I'm definitely interested! What are your typical rates for sponsored content?",
      isFromAI: false,
      intent: 'pricing_inquiry',
      createdAt: '2025-01-21T09:15:00Z'
    }
  ]
}

export async function GET(
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

    const messages = mockMessages[conversationId as keyof typeof mockMessages] || []

    // Sort by creation time
    const sortedMessages = messages.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    return NextResponse.json({
      success: true,
      data: {
        messages: sortedMessages,
        count: sortedMessages.length
      }
    })

  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json({
      error: 'Failed to fetch messages',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 })
  }
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
    const { content, isFromAI = false, intent } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Initialize messages array for conversation if it doesn't exist
    const key = conversationId as keyof typeof mockMessages
    if (!mockMessages[key]) {
      (mockMessages as any)[conversationId] = []
    }

    // Get the highest message ID across all conversations
    let maxId = 0
    Object.values(mockMessages).forEach(messages => {
      messages.forEach(msg => {
        if (msg.id > maxId) maxId = msg.id
      })
    })

    const newMessage = {
      id: maxId + 1,
      conversationId,
      content,
      isFromAI,
      intent: intent || (isFromAI ? 'information' : 'response'),
      createdAt: new Date().toISOString()
    }

    ;(mockMessages as any)[conversationId].push(newMessage)

    return NextResponse.json({
      success: true,
      data: { message: newMessage },
      message: 'Message added successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Add message error:', error)
    return NextResponse.json({
      error: 'Failed to add message',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 })
  }
}