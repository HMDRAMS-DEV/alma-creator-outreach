import { NextRequest, NextResponse } from 'next/server';
import { ApifyService } from '@/services/apify-scraper';
import { CreatorScoringEngine } from '@/services/creator-scoring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hashtags, maxResults = 50 } = body;

    if (!hashtags || !Array.isArray(hashtags) || hashtags.length === 0) {
      return NextResponse.json(
        { error: 'Hashtags array is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const apifyService = new ApifyService();
    const scoringEngine = new CreatorScoringEngine();

    // Discover creators and their posts using Apify
    const { creators, postsMap } = await apifyService.discoverCreatorsByTikTokHashtag(hashtags, maxResults);

    // Score the discovered creators using their actual posts
    const scoredCreatorsPromises = creators.map(creator => {
      const creatorPosts = postsMap.get(creator.username) || [];
      return scoringEngine.scoreCreator(creator, creatorPosts, hashtags);
    });

    const scoredCreators = await Promise.all(scoredCreatorsPromises);

    // Sort by overall score and limit to the requested number
    const qualifiedCreators = scoredCreators
      .sort((a, b) => b.score.overall - a.score.overall)
      .slice(0, maxResults);

    const endTime = Date.now();
    const timeElapsed = endTime - startTime;

    return NextResponse.json({
      success: true,
      data: {
        creators: qualifiedCreators,
        stats: {
          timeElapsed: timeElapsed,
          qualifiedCount: qualifiedCreators.length,
          totalScraped: creators.length, // Total unique creators found before limiting
          hashtagsProcessed: hashtags.length,
        },
        scoring: {
          totalAnalyzed: qualifiedCreators.length,
          averageScore: qualifiedCreators.length > 0
            ? qualifiedCreators.reduce((sum, c) => sum + c.score.overall, 0) / qualifiedCreators.length
            : 0,
        },
      },
      message: `Discovered and scored ${qualifiedCreators.length} TikTok creators.`,
    });

  } catch (error) {
    console.error('Apify TikTok discovery error:', error);
    
    return NextResponse.json({
      error: 'TikTok discovery failed via Apify',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      note: 'This could be due to an issue with the Apify service or your API key.'
    }, { status: 500 });
  }
}
