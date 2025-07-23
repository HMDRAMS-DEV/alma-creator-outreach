import { NextRequest, NextResponse } from 'next/server'

// Mock data - same as in main route
const mockCreators = [
  {
    id: 1,
    username: 'productivitypro',
    platform: 'instagram',
    followers: 15432,
    engagementRate: 4.2,
    status: 'qualified',
    lastContact: '2025-01-20',
    score: 85,
    bio: 'Helping entrepreneurs stay organized and focused 📊 Productivity tips daily',
    tags: ['productivity', 'business', 'entrepreneur'],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-20T15:30:00Z'
  },
  {
    id: 2,
    username: 'sidehustlequeen',
    platform: 'instagram', 
    followers: 8901,
    engagementRate: 6.1,
    status: 'contacted',
    lastContact: '2025-01-22',
    score: 92,
    bio: 'Building multiple income streams 💰 Side hustle mentor',
    tags: ['sidehustle', 'entrepreneur', 'finance'],
    createdAt: '2025-01-18T08:15:00Z',
    updatedAt: '2025-01-22T12:45:00Z'
  },
  {
    id: 3,
    username: 'techstartuplife',
    platform: 'tiktok',
    followers: 23456,
    engagementRate: 8.3,
    status: 'responded',
    lastContact: '2025-01-21',
    score: 88,
    bio: 'Startup founder sharing the journey 🚀 Tech tips & insights',
    tags: ['tech', 'startup', 'business'],
    createdAt: '2025-01-16T14:20:00Z',
    updatedAt: '2025-01-21T09:15:00Z'
  },
  {
    id: 4,
    username: 'workfromhomepro',
    platform: 'instagram',
    followers: 12750,
    engagementRate: 3.8,
    status: 'interested',
    lastContact: '2025-01-19',
    score: 79,
    bio: 'Remote work expert 🏠 Productivity & wellness tips',
    tags: ['remote', 'productivity', 'wellness'],
    createdAt: '2025-01-17T11:30:00Z',
    updatedAt: '2025-01-19T16:20:00Z'
  },
  {
    id: 5,
    username: 'entrepreneurmind',
    platform: 'tiktok',
    followers: 45120,
    engagementRate: 5.7,
    status: 'negotiating',
    lastContact: '2025-01-23',
    score: 94,
    bio: 'Business mindset coach 🧠 Helping you think like an entrepreneur',
    tags: ['entrepreneur', 'mindset', 'business'],
    createdAt: '2025-01-14T09:45:00Z',
    updatedAt: '2025-01-23T16:00:00Z'
  }
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid creator ID' },
        { status: 400 }
      )
    }

    const creator = mockCreators.find(c => c.id === id)

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { creator }
    })

  } catch (error) {
    console.error('Get creator error:', error)
    return NextResponse.json({
      error: 'Failed to fetch creator',
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
        { error: 'Invalid creator ID' },
        { status: 400 }
      )
    }

    const creatorIndex = mockCreators.findIndex(c => c.id === id)

    if (creatorIndex === -1) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const allowedUpdates = [
      'status', 'lastContact', 'score', 'bio', 'tags', 
      'followers', 'engagementRate'
    ]

    // Filter only allowed updates
    const updates = {}
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key]
      }
    }

    // Update the creator
    mockCreators[creatorIndex] = {
      ...mockCreators[creatorIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: { creator: mockCreators[creatorIndex] },
      message: 'Creator updated successfully'
    })

  } catch (error) {
    console.error('Update creator error:', error)
    return NextResponse.json({
      error: 'Failed to update creator',
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
        { error: 'Invalid creator ID' },
        { status: 400 }
      )
    }

    const creatorIndex = mockCreators.findIndex(c => c.id === id)

    if (creatorIndex === -1) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    const deletedCreator = mockCreators.splice(creatorIndex, 1)[0]

    return NextResponse.json({
      success: true,
      data: { creator: deletedCreator },
      message: 'Creator deleted successfully'
    })

  } catch (error) {
    console.error('Delete creator error:', error)
    return NextResponse.json({
      error: 'Failed to delete creator',
      message: error.message
    }, { status: 500 })
  }
}