import { NextResponse } from 'next/server'
import { InstagramScraperWithLogin } from '@/services/instagram-scraper-with-login'
import { CreatorScoringEngine } from '@/services/creator-scoring'
import type { DiscoveryCriteria } from '@/types/creator'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { hashtags, credentials, maxPosts = 20 } = body

    if (!hashtags || !Array.isArray(hashtags) || hashtags.length === 0) {
      return NextResponse.json(
        { error: 'Hashtags are required' },
        { status: 400 }
      )
    }

    if (!credentials?.username || !credentials?.password) {
      return NextResponse.json(
        { error: 'Instagram credentials are required' },
        { status: 400 }
      )
    }

    console.log('🚀 Starting Instagram discovery via API...')

    const scraper = new InstagramScraperWithLogin({
      headless: true, // Always headless for API
      credentials
    })

    const scoringEngine = new CreatorScoringEngine()

    // Create discovery criteria
    const criteria: DiscoveryCriteria = {
      platforms: ['instagram'],
      hashtags,
      followerRange: [1000, 50000],
      minEngagementRate: 0.01,
      maxContactAttempts: 0,
      excludeVerified: false
    }

    await scraper.initialize()
    
    // Login
    const loginSuccess = await scraper.login()
    if (!loginSuccess) {
      await scraper.close()
      return NextResponse.json(
        { error: 'Failed to login to Instagram' },
        { status: 401 }
      )
    }

    // Discover creators
    const result = await scraper.discoverCreators(criteria)
    await scraper.close()

    if (result.creators.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No creators found',
        data: result
      })
    }

    // Score the creators
    const postsMap = new Map()
    for (const post of result.posts) {
      if (!postsMap.has(post.username)) {
        postsMap.set(post.username, [])
      }
      postsMap.get(post.username).push(post)
    }

    const targetNiches = ['productivity', 'business', 'entrepreneur', 'tech']
    const scoredCreators = await scoringEngine.scoreCreators(result.creators, postsMap, targetNiches)

    // Filter for qualified creators
    const qualifiedCreators = scoredCreators.filter(creator => creator.score.overall >= 0.45)

    console.log(`✅ Instagram discovery completed: ${qualifiedCreators.length} qualified creators`)

    return NextResponse.json({
      success: true,
      message: `Found ${qualifiedCreators.length} qualified creators`,
      data: {
        ...result,
        creators: qualifiedCreators,
        scoring: {
          totalAnalyzed: scoredCreators.length,
          qualified: qualifiedCreators.length,
          averageScore: scoredCreators.reduce((sum, c) => sum + c.score.overall, 0) / scoredCreators.length
        }
      }
    })

  } catch (error) {
    console.error('❌ Instagram discovery API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Instagram discovery failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}