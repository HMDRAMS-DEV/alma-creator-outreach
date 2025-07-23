import { NextRequest, NextResponse } from 'next/server'
import { InstagramScraperService } from '@/services/instagram-scraper-simplified'
import { CreatorScoringService } from '@/services/creator-scoring'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hashtags, maxPosts = 20, credentials } = body

    if (!hashtags || !Array.isArray(hashtags) || hashtags.length === 0) {
      return NextResponse.json(
        { error: 'Hashtags array is required' },
        { status: 400 }
      )
    }

    if (!credentials || !credentials.username || !credentials.password) {
      return NextResponse.json(
        { error: 'Instagram credentials are required' },
        { status: 400 }
      )
    }

    const startTime = Date.now()
    const scraperService = new InstagramScraperService()
    const scoringService = new CreatorScoringService()

    // Initialize with credentials
    await scraperService.initialize()
    await scraperService.login(credentials.username, credentials.password)

    const allCreators = []
    const stats = {
      totalScraped: 0,
      hashtagsProcessed: 0,
      errors: []
    }

    // Process each hashtag
    for (const hashtag of hashtags) {
      try {
        console.log(`Processing hashtag: ${hashtag}`)
        
        const posts = await scraperService.scrapeHashtagPosts(hashtag, maxPosts)
        stats.totalScraped += posts.length
        stats.hashtagsProcessed++

        // Extract creators from posts
        const creators = await scraperService.extractCreatorsFromPosts(posts)
        
        // Score each creator
        for (const creator of creators) {
          const scoredCreator = await scoringService.scoreCreator(creator, posts.filter(p => p.username === creator.username), hashtags)
          allCreators.push(scoredCreator)
        }

        // Rate limiting between hashtags
        await new Promise(resolve => setTimeout(resolve, 5000))
        
      } catch (error) {
        console.error(`Error processing hashtag ${hashtag}:`, error)
        stats.errors.push(`${hashtag}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    await scraperService.cleanup()

    // Filter and deduplicate creators
    const qualifiedCreators = allCreators
      .filter(creator => creator.score.overall >= 0.6)
      .sort((a, b) => b.score.overall - a.score.overall)
      .slice(0, 50) // Top 50 creators

    const endTime = Date.now()
    
    return NextResponse.json({
      success: true,
      data: {
        creators: qualifiedCreators,
        stats: {
          ...stats,
          timeElapsed: endTime - startTime,
          qualifiedCount: qualifiedCreators.length
        },
        scoring: {
          totalAnalyzed: allCreators.length,
          averageScore: allCreators.length > 0 
            ? allCreators.reduce((sum, c) => sum + c.score.overall, 0) / allCreators.length 
            : 0
        }
      },
      message: `Discovered ${qualifiedCreators.length} qualified creators from ${stats.hashtagsProcessed} hashtags`
    })

  } catch (error) {
    console.error('Instagram discovery error:', error)
    
    return NextResponse.json({
      error: 'Instagram discovery failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      note: 'This may be due to Instagram rate limiting or authentication issues. Try again with different credentials or wait before retrying.'
    }, { status: 500 })
  }
}