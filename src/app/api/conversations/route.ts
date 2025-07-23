import { NextRequest, NextResponse } from 'next/server'

// Mock conversation data
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
  },
  {
    id: 4,
    creatorId: 4,
    creatorUsername: 'workfromhomepro',
    platform: 'instagram',
    status: 'not_interested',
    lastMessage: "Thanks for reaching out, but I'm not taking on new partnerships right now.",
    lastMessageTime: '2025-01-20T14:20:00Z',
    messageCount: 3,
    isFromCreator: true,
    intent: 'rejection',
    qualificationScore: 0,
    tags: ['not_interested', 'polite_decline'],
    createdAt: '2025-01-19T11:30:00Z',
    updatedAt: '2025-01-20T14:20:00Z'
  },
  {
    id: 5,
    creatorId: 5,
    creatorUsername: 'entrepreneurmind',
    platform: 'tiktok',
    status: 'escalated',
    lastMessage: "I'd love to discuss this further. Can we set up a call to talk about the details?",
    lastMessageTime: '2025-01-23T16:00:00Z',
    messageCount: 8,
    isFromCreator: true,
    intent: 'interested',
    qualificationScore: 94,
    tags: ['escalated', 'qualified_lead', 'schedule_call'],
    createdAt: '2025-01-18T10:15:00Z',
    updatedAt: '2025-01-23T16:00:00Z'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const intent = searchParams.get('intent')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let filteredConversations = [...mockConversations]

    // Apply filters
    if (status && status !== 'all') {
      filteredConversations = filteredConversations.filter(conv => conv.status === status)
    }

    if (platform && platform !== 'all') {
      filteredConversations = filteredConversations.filter(conv => conv.platform === platform)
    }

    if (intent && intent !== 'all') {
      filteredConversations = filteredConversations.filter(conv => conv.intent === intent)
    }

    // Apply pagination
    const total = filteredConversations.length
    const paginatedConversations = filteredConversations
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(offset, offset + limit)

    // Calculate stats
    const stats = {
      total: mockConversations.length,
      in_progress: mockConversations.filter(c => c.status === 'in_progress').length,
      awaiting_response: mockConversations.filter(c => c.status === 'awaiting_response').length,
      qualified_lead: mockConversations.filter(c => c.status === 'qualified_lead').length,
      escalated: mockConversations.filter(c => c.status === 'escalated').length,
      not_interested: mockConversations.filter(c => c.status === 'not_interested').length,
      averageScore: mockConversations
        .filter(c => c.qualificationScore > 0)
        .reduce((sum, c) => sum + c.qualificationScore, 0) / 
        Math.max(mockConversations.filter(c => c.qualificationScore > 0).length, 1),
      responseRate: Math.round((mockConversations.filter(c => c.messageCount > 1).length / mockConversations.length) * 100)
    }

    return NextResponse.json({
      success: true,
      data: {
        conversations: paginatedConversations,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        stats
      }
    })

  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json({
      error: 'Failed to fetch conversations',
      message: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      creatorId,
      creatorUsername,
      platform,
      initialMessage,
      status = 'awaiting_response'
    } = body

    if (!creatorId || !creatorUsername || !platform) {
      return NextResponse.json(
        { error: 'creatorId, creatorUsername, and platform are required' },
        { status: 400 }
      )
    }

    // Check if conversation already exists
    const existingConversation = mockConversations.find(
      c => c.creatorId === creatorId
    )

    if (existingConversation) {
      return NextResponse.json(
        { error: 'Conversation already exists for this creator' },
        { status: 409 }
      )
    }

    const newConversation = {
      id: Math.max(...mockConversations.map(c => c.id)) + 1,
      creatorId,
      creatorUsername,
      platform,
      status,
      lastMessage: initialMessage || 'Initial outreach sent',
      lastMessageTime: new Date().toISOString(),
      messageCount: 1,
      isFromCreator: false,
      intent: 'discovery',
      qualificationScore: 0,
      tags: ['initial_outreach'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    mockConversations.push(newConversation)

    return NextResponse.json({
      success: true,
      data: { conversation: newConversation },
      message: 'Conversation created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json({
      error: 'Failed to create conversation',
      message: error.message
    }, { status: 500 })
  }
}