import { NextResponse } from 'next/server'
import { TikTokScraper } from '@/services/tiktok-scraper'
import { CreatorScoringEngine } from '@/services/creator-scoring'
import type { DiscoveryCriteria } from '@/types/creator'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { hashtags, maxPosts = 15 } = body

    if (!hashtags || !Array.isArray(hashtags) || hashtags.length === 0) {
      return NextResponse.json(
        { error: 'Hashtags are required' },
        { status: 400 }
      )
    }

    console.log('🚀 Starting TikTok discovery via API...')

    const scraper = new TikTokScraper({
      headless: true,
      maxPostsPerHashtag: Math.min(maxPosts, 10), // Cap at 10 for safety
      timeout: 300000 // 5 minutes
    })

    const scoringEngine = new CreatorScoringEngine()

    // Create discovery criteria
    const criteria: DiscoveryCriteria = {
      platforms: ['tiktok'],
      hashtags,
      followerRange: [1000, 100000],
      minEngagementRate: 0.03,
      maxContactAttempts: 0
    }

    // Discover creators
    const result = await scraper.discoverCreators(criteria)

    if (result.creators.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No TikTok creators found - this is common due to anti-bot protection',
        data: result,
        note: 'TikTok actively blocks scrapers. Consider using their official API or manual research.'
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

    const targetNiches = ['productivity', 'business', 'entrepreneur', 'tech', 'lifestyle']
    const scoredCreators = await scoringEngine.scoreCreators(result.creators, postsMap, targetNiches)

    // Filter for qualified creators (TikTok typically has higher engagement)
    const qualifiedCreators = scoredCreators.filter(creator => creator.score.overall >= 0.40)

    console.log(`✅ TikTok discovery completed: ${qualifiedCreators.length} qualified creators`)

    return NextResponse.json({
      success: true,
      message: `Found ${qualifiedCreators.length} qualified TikTok creators`,
      data: {
        ...result,
        creators: qualifiedCreators,
        scoring: {
          totalAnalyzed: scoredCreators.length,
          qualified: qualifiedCreators.length,
          averageScore: scoredCreators.length > 0 
            ? scoredCreators.reduce((sum, c) => sum + c.score.overall, 0) / scoredCreators.length 
            : 0
        }
      }
    })

  } catch (error) {
    console.error('❌ TikTok discovery API error:', error)
    
    return NextResponse.json(
      { 
        error: 'TikTok discovery failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        note: 'TikTok discovery often fails due to anti-scraping measures. This is expected.'
      },
      { status: 500 }
    )
  }
}