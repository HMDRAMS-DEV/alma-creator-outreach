import { NextRequest, NextResponse } from 'next/server'

// Mock data for now - will be replaced with database
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let filteredCreators = [...mockCreators]

    // Apply filters
    if (status && status !== 'all') {
      filteredCreators = filteredCreators.filter(creator => creator.status === status)
    }

    if (platform && platform !== 'all') {
      filteredCreators = filteredCreators.filter(creator => creator.platform === platform)
    }

    // Apply pagination
    const total = filteredCreators.length
    const paginatedCreators = filteredCreators.slice(offset, offset + limit)

    // Calculate stats
    const stats = {
      total,
      qualified: mockCreators.filter(c => c.status === 'qualified').length,
      contacted: mockCreators.filter(c => c.status === 'contacted').length,
      responded: mockCreators.filter(c => c.status === 'responded').length,
      interested: mockCreators.filter(c => c.status === 'interested').length,
      negotiating: mockCreators.filter(c => c.status === 'negotiating').length,
      averageScore: mockCreators.reduce((sum, c) => sum + c.score, 0) / mockCreators.length,
      platforms: {
        instagram: mockCreators.filter(c => c.platform === 'instagram').length,
        tiktok: mockCreators.filter(c => c.platform === 'tiktok').length
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        creators: paginatedCreators,
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
    console.error('Get creators error:', error)
    return NextResponse.json({
      error: 'Failed to fetch creators',
      message: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      username, 
      platform, 
      followers, 
      engagementRate, 
      bio, 
      tags,
      score,
      status = 'discovered'
    } = body

    if (!username || !platform) {
      return NextResponse.json(
        { error: 'Username and platform are required' },
        { status: 400 }
      )
    }

    // Check for duplicates
    const existingCreator = mockCreators.find(
      c => c.username === username && c.platform === platform
    )

    if (existingCreator) {
      return NextResponse.json(
        { error: 'Creator already exists' },
        { status: 409 }
      )
    }

    const newCreator = {
      id: Math.max(...mockCreators.map(c => c.id)) + 1,
      username,
      platform,
      followers: followers || 0,
      engagementRate: engagementRate || 0,
      status,
      lastContact: null,
      score: score || 0,
      bio: bio || '',
      tags: tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    mockCreators.push(newCreator)

    return NextResponse.json({
      success: true,
      data: { creator: newCreator },
      message: 'Creator added successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Create creator error:', error)
    return NextResponse.json({
      error: 'Failed to create creator',
      message: error.message
    }, { status: 500 })
  }
}