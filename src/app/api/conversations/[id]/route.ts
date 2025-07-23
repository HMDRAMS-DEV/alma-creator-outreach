import { NextRequest, NextResponse } from 'next/server'

// Mock conversation data - same as main route
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
  },
  {
    id: 2,
    creatorId: 2,
    creatorUsername: 'sidehustlequeen',
    platform: 'instagram',
    status: 'awaiting_response',
    lastMessage: "Hi! I saw your content about side hustles and thought you'd be perfect for a collaboration with our productivity app. Would you be interested in learning more?",
    lastMessageTime: '2025-01-22T15:45:00Z',
    messageCount: 1,
    isFromCreator: false,
    intent: 'discovery',
    qualificationScore: 0,
    tags: ['initial_outreach'],
    createdAt: '2025-01-22T15:45:00Z',
    updatedAt: '2025-01-22T15:45:00Z'
  },
  {
    id: 3,
    creatorId: 3,
    creatorUsername: 'techstartuplife',
    platform: 'tiktok',
    status: 'qualified_lead',
    lastMessage: "Yes, I'm definitely interested! What are your typical rates for sponsored content?",
    lastMessageTime: '2025-01-21T09:15:00Z',
    messageCount: 6,
    isFromCreator: true,
    intent: 'pricing_inquiry',
    qualificationScore: 92,
    tags: ['qualified', 'pricing_discussion', 'escalate_to_human'],
    createdAt: '2025-01-19T14:00:00Z',
    updatedAt: '2025-01-21T09:15:00Z'
  }
]

// Mock messages for conversations
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
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid conversation ID' },
        { status: 400 }
      )
    }

    const conversation = mockConversations.find(c => c.id === id)

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get messages for this conversation
    const messages = mockMessages[id as keyof typeof mockMessages] || []

    return NextResponse.json({
      success: true,
      data: {
        conversation,
        messages
      }
    })

  } catch (error) {
    console.error('Get conversation error:', error)
    return NextResponse.json({
      error: 'Failed to fetch conversation',
      message: error.message
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid conversation ID' },
        { status: 400 }
      )
    }

    const conversationIndex = mockConversations.findIndex(c => c.id === id)

    if (conversationIndex === -1) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const allowedUpdates = [
      'status', 'intent', 'qualificationScore', 'tags'
    ]

    // Filter only allowed updates
    const updates = {}
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key]
      }
    }

    // Update the conversation
    mockConversations[conversationIndex] = {
      ...mockConversations[conversationIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: { conversation: mockConversations[conversationIndex] },
      message: 'Conversation updated successfully'
    })

  } catch (error) {
    console.error('Update conversation error:', error)
    return NextResponse.json({
      error: 'Failed to update conversation',
      message: error.message
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid conversation ID' },
        { status: 400 }
      )
    }

    const conversationIndex = mockConversations.findIndex(c => c.id === id)

    if (conversationIndex === -1) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const deletedConversation = mockConversations.splice(conversationIndex, 1)[0]

    // Also remove messages
    delete (mockMessages as any)[id]

    return NextResponse.json({
      success: true,
      data: { conversation: deletedConversation },
      message: 'Conversation deleted successfully'
    })

  } catch (error) {
    console.error('Delete conversation error:', error)
    return NextResponse.json({
      error: 'Failed to delete conversation',
      message: error.message
    }, { status: 500 })
  }
}