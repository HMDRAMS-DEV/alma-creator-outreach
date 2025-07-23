import type { Creator, CreatorScore, CreatorMetrics, InstagramPost, TikTokVideo } from '@/types/creator'

export interface ScoringWeights {
  growthPotential: number
  engagementQuality: number
  contentConsistency: number
  audienceQuality: number
  nicheRelevance: number
}

export class CreatorScoringEngine {
  private weights: ScoringWeights

  constructor(weights?: Partial<ScoringWeights>) {
    this.weights = {
      growthPotential: 0.30,
      engagementQuality: 0.25,
      contentConsistency: 0.20,
      audienceQuality: 0.15,
      nicheRelevance: 0.10,
      ...weights
    }
  }

  async scoreCreator(
    creator: Creator,
    posts: (InstagramPost | TikTokVideo)[] = [],
    targetNiches: string[] = []
  ): Promise<Creator & { score: CreatorScore; metrics: CreatorMetrics }> {
    
    const metrics = this.calculateMetrics(creator, posts)
    const score = this.calculateScore(creator, metrics, posts, targetNiches)

    return {
      ...creator,
      metrics,
      score
    }
  }

  private calculateMetrics(creator: Creator, posts: (InstagramPost | TikTokVideo)[]): CreatorMetrics {
    if (posts.length === 0) {
      return {
        avgLikes: 0,
        avgComments: 0,
        avgViews: 0,
        postFrequency: 0,
        contentQuality: 0,
        engagement30Day: 0
      }
    }

    // Calculate averages
    const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0)
    const totalComments = posts.reduce((sum, post) => sum + post.comments, 0)
    const avgLikes = totalLikes / posts.length
    const avgComments = totalComments / posts.length

    // Calculate average views (TikTok specific)
    let avgViews = 0
    const tikTokPosts = posts.filter(post => 'plays' in post) as TikTokVideo[]
    if (tikTokPosts.length > 0) {
      const totalViews = tikTokPosts.reduce((sum, post) => sum + post.plays, 0)
      avgViews = totalViews / tikTokPosts.length
    }

    // Calculate post frequency (posts per week)
    const postFrequency = this.calculatePostFrequency(posts)

    // Calculate content quality score
    const contentQuality = this.calculateContentQuality(posts)

    // Calculate 30-day engagement rate
    const engagement30Day = this.calculate30DayEngagement(creator, posts)

    return {
      avgLikes,
      avgComments,
      avgViews,
      postFrequency,
      contentQuality,
      engagement30Day
    }
  }

  private calculateScore(
    creator: Creator, 
    metrics: CreatorMetrics, 
    posts: (InstagramPost | TikTokVideo)[],
    targetNiches: string[]
  ): CreatorScore {
    
    const growthPotential = this.scoreGrowthPotential(creator, metrics)
    const engagementQuality = this.scoreEngagementQuality(creator, metrics)
    const contentConsistency = this.scoreContentConsistency(metrics)
    const audienceQuality = this.scoreAudienceQuality(creator, metrics)
    const nicheRelevance = this.scoreNicheRelevance(posts, targetNiches)

    const overall = (
      growthPotential * this.weights.growthPotential +
      engagementQuality * this.weights.engagementQuality +
      contentConsistency * this.weights.contentConsistency +
      audienceQuality * this.weights.audienceQuality +
      nicheRelevance * this.weights.nicheRelevance
    )

    return {
      overall: Math.min(1, Math.max(0, overall)), // Clamp between 0-1
      growthPotential,
      engagementQuality,
      contentConsistency,
      audienceQuality,
      nicheRelevance
    }
  }

  private scoreGrowthPotential(creator: Creator, metrics: CreatorMetrics): number {
    let score = 0

    // Sweet spot for nano/micro influencers
    const followers = creator.estimatedFollowers
    if (followers >= 1000 && followers <= 50000) {
      // Peak score for 5K-20K range
      if (followers >= 5000 && followers <= 20000) {
        score += 0.4
      } else {
        score += 0.3
      }
    } else if (followers < 1000) {
      score += 0.1 // Very small accounts
    } else {
      score += 0.2 // Larger accounts (less growth potential)
    }

    // High engagement suggests growth potential
    if (metrics.engagement30Day > 0.05) score += 0.3  // >5%
    else if (metrics.engagement30Day > 0.03) score += 0.2  // >3%
    else if (metrics.engagement30Day > 0.01) score += 0.1  // >1%

    // Consistent posting indicates active growth
    if (metrics.postFrequency >= 3) score += 0.2      // 3+ posts/week
    else if (metrics.postFrequency >= 1) score += 0.1 // 1+ posts/week

    // Quality content suggests sustainable growth
    if (metrics.contentQuality >= 0.7) score += 0.1
    else if (metrics.contentQuality >= 0.5) score += 0.05

    return Math.min(1, score)
  }

  private scoreEngagementQuality(creator: Creator, metrics: CreatorMetrics): number {
    let score = 0
    
    const engagementRate = metrics.engagement30Day

    // Engagement rate scoring (adjusted for platform)
    if (creator.platform === 'instagram') {
      if (engagementRate >= 0.06) score += 0.4      // >6% (excellent)
      else if (engagementRate >= 0.03) score += 0.3 // >3% (good)
      else if (engagementRate >= 0.01) score += 0.2 // >1% (average)
      else score += 0.1                             // <1% (poor)
    } else if (creator.platform === 'tiktok') {
      if (engagementRate >= 0.09) score += 0.4      // >9% (excellent)
      else if (engagementRate >= 0.06) score += 0.3 // >6% (good)  
      else if (engagementRate >= 0.03) score += 0.2 // >3% (average)
      else score += 0.1                             // <3% (poor)
    }

    // Comment-to-like ratio (indicates genuine engagement)
    const commentRatio = metrics.avgLikes > 0 ? metrics.avgComments / metrics.avgLikes : 0
    if (commentRatio >= 0.05) score += 0.2        // >5% comment ratio
    else if (commentRatio >= 0.02) score += 0.1   // >2% comment ratio

    // Consistent engagement across posts
    if (metrics.contentQuality >= 0.6) score += 0.2
    else if (metrics.contentQuality >= 0.4) score += 0.1

    // Bonus for authentic engagement patterns
    if (metrics.avgComments >= 10) score += 0.2   // Meaningful discussion

    return Math.min(1, score)
  }

  private scoreContentConsistency(metrics: CreatorMetrics): number {
    let score = 0

    // Posting frequency
    if (metrics.postFrequency >= 5) score += 0.4      // Very active
    else if (metrics.postFrequency >= 3) score += 0.3 // Active
    else if (metrics.postFrequency >= 1) score += 0.2 // Regular
    else if (metrics.postFrequency >= 0.5) score += 0.1 // Occasional

    // Content quality consistency
    if (metrics.contentQuality >= 0.8) score += 0.3
    else if (metrics.contentQuality >= 0.6) score += 0.2
    else if (metrics.contentQuality >= 0.4) score += 0.1

    // Engagement consistency bonus
    if (metrics.engagement30Day > 0 && metrics.avgLikes > 0) {
      score += 0.3
    }

    return Math.min(1, score)
  }

  private scoreAudienceQuality(creator: Creator, metrics: CreatorMetrics): number {
    let score = 0.5 // Base score

    // Exclude bots/fake accounts indicators
    if (creator.isVerified) {
      score += 0.2 // Verified accounts likely have real audiences
    }

    // Bio quality (indicates real person)
    if (creator.bio && creator.bio.length > 20) {
      score += 0.1
    }

    // Engagement authenticity
    const engagementRate = metrics.engagement30Day
    if (engagementRate > 0.01 && engagementRate < 0.15) {
      score += 0.2 // Realistic engagement rates
    } else if (engagementRate >= 0.15) {
      score -= 0.2 // Suspiciously high engagement
    }

    return Math.min(1, Math.max(0, score))
  }

  private scoreNicheRelevance(posts: (InstagramPost | TikTokVideo)[], targetNiches: string[]): number {
    if (targetNiches.length === 0 || posts.length === 0) return 0.5

    let relevantPosts = 0
    
    for (const post of posts) {
      const content = this.getPostContent(post).toLowerCase()
      
      for (const niche of targetNiches) {
        if (content.includes(niche.toLowerCase())) {
          relevantPosts++
          break
        }
      }
    }

    const relevanceRatio = relevantPosts / posts.length
    return relevanceRatio
  }

  private calculatePostFrequency(posts: (InstagramPost | TikTokVideo)[]): number {
    if (posts.length === 0) return 0

    // Calculate time span in days
    const timestamps = posts.map(post => new Date(post.timestamp).getTime())
    const minTime = Math.min(...timestamps)
    const maxTime = Math.max(...timestamps)
    const daySpan = (maxTime - minTime) / (1000 * 60 * 60 * 24)

    if (daySpan === 0) return posts.length * 7 // If all same day, assume weekly rate

    // Return posts per week
    return (posts.length / daySpan) * 7
  }

  private calculateContentQuality(posts: (InstagramPost | TikTokVideo)[]): number {
    if (posts.length === 0) return 0

    let qualityScore = 0

    for (const post of posts) {
      let postScore = 0

      // Caption quality
      const content = this.getPostContent(post)
      if (content.length > 50) postScore += 0.2
      if (content.length > 150) postScore += 0.2

      // Hashtag usage (good but not excessive)
      const hashtags = this.getPostHashtags(post)
      if (hashtags.length >= 3 && hashtags.length <= 10) postScore += 0.2
      else if (hashtags.length > 0) postScore += 0.1

      // Engagement quality
      const engagementRatio = post.comments / Math.max(post.likes, 1)
      if (engagementRatio >= 0.02) postScore += 0.2
      else if (engagementRatio >= 0.01) postScore += 0.1

      // Minimum engagement threshold
      if (post.likes >= 10) postScore += 0.2

      qualityScore += Math.min(1, postScore)
    }

    return qualityScore / posts.length
  }

  private calculate30DayEngagement(creator: Creator, posts: (InstagramPost | TikTokVideo)[]): number {
    if (posts.length === 0 || !creator.estimatedFollowers) return 0

    // Filter posts from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentPosts = posts.filter(post => new Date(post.timestamp) >= thirtyDaysAgo)
    if (recentPosts.length === 0) return 0

    const totalEngagement = recentPosts.reduce((sum, post) => sum + post.likes + post.comments, 0)
    const avgEngagementPerPost = totalEngagement / recentPosts.length
    
    return avgEngagementPerPost / creator.estimatedFollowers
  }

  private getPostContent(post: InstagramPost | TikTokVideo): string {
    if ('caption' in post) return post.caption || ''
    if ('description' in post) return post.description || ''
    return ''
  }

  private getPostHashtags(post: InstagramPost | TikTokVideo): string[] {
    return post.hashtags || []
  }

  // Utility method to batch score multiple creators
  async scoreCreators(
    creators: Creator[],
    postsMap: Map<string, (InstagramPost | TikTokVideo)[]>,
    targetNiches: string[] = []
  ): Promise<(Creator & { score: CreatorScore; metrics: CreatorMetrics })[]> {
    
    const scoredCreators = []

    for (const creator of creators) {
      const posts = postsMap.get(creator.username) || []
      const scoredCreator = await this.scoreCreator(creator, posts, targetNiches)
      scoredCreators.push(scoredCreator)
    }

    // Sort by overall score (highest first)
    return scoredCreators.sort((a, b) => b.score.overall - a.score.overall)
  }

  // Get qualification thresholds for different tiers
  getQualificationThreshold(tier: 'premium' | 'good' | 'acceptable'): number {
    switch (tier) {
      case 'premium': return 0.75
      case 'good': return 0.60
      case 'acceptable': return 0.45
      default: return 0.60
    }
  }
}