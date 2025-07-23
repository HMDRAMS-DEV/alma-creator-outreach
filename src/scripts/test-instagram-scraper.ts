import { InstagramScraper } from '../services/instagram-scraper'
import { CreatorScoringEngine } from '../services/creator-scoring'
import type { DiscoveryCriteria } from '../types/creator'

async function testInstagramScraper() {
  console.log('🚀 Testing Instagram Scraper...\n')
  
  const scraper = new InstagramScraper({
    headless: false, // Set to true in production
    slowMo: 500
  })

  const scoringEngine = new CreatorScoringEngine()

  try {
    await scraper.initialize()
    console.log('✅ Scraper initialized')

    // Define discovery criteria
    const criteria: DiscoveryCriteria = {
      platforms: ['instagram'],
      hashtags: ['productivity', 'entrepreneur', 'sidehustle'],
      followerRange: [1000, 50000],
      minEngagementRate: 0.01,
      maxContactAttempts: 0,
      excludeVerified: true
    }

    console.log('🔍 Starting discovery with criteria:', JSON.stringify(criteria, null, 2))

    // Discover creators
    const result = await scraper.discoverCreators(criteria)
    
    console.log('\n📊 Scraping Results:')
    console.log(`- Total posts scraped: ${result.stats.totalScraped}`)
    console.log(`- Unique creators found: ${result.creators.length}`)
    console.log(`- Qualified creators: ${result.stats.qualified}`)
    console.log(`- Time elapsed: ${result.stats.timeElapsed}ms`)
    
    if (result.errors.length > 0) {
      console.log(`- Errors encountered: ${result.errors.length}`)
      result.errors.forEach(error => console.log(`  ⚠️ ${error}`))
    }

    // Score the creators
    if (result.creators.length > 0) {
      console.log('\n🏆 Scoring creators...')
      
      // Group posts by creator
      const postsMap = new Map()
      for (const post of result.posts) {
        if (!postsMap.has(post.username)) {
          postsMap.set(post.username, [])
        }
        postsMap.get(post.username).push(post)
      }

      const targetNiches = ['productivity', 'business', 'entrepreneur', 'tech', 'startup']
      const scoredCreators = await scoringEngine.scoreCreators(result.creators, postsMap, targetNiches)

      console.log('\n🎯 Top 5 Creators:')
      for (const creator of scoredCreators.slice(0, 5)) {
        console.log(`\n@${creator.username} (${creator.platform})`)
        console.log(`  Overall Score: ${(creator.score.overall * 100).toFixed(1)}%`)
        console.log(`  Followers: ${creator.estimatedFollowers.toLocaleString()}`)
        console.log(`  Engagement Rate: ${(creator.metrics.engagement30Day * 100).toFixed(2)}%`)
        console.log(`  Post Frequency: ${creator.metrics.postFrequency.toFixed(1)} posts/week`)
        console.log(`  Content Quality: ${(creator.metrics.contentQuality * 100).toFixed(1)}%`)
        console.log(`  Bio: ${creator.bio?.substring(0, 100)}...`)
        
        const posts = postsMap.get(creator.username) || []
        console.log(`  Recent Posts: ${posts.length}`)
        if (posts.length > 0) {
          const avgLikes = posts.reduce((sum: number, post: any) => sum + post.likes, 0) / posts.length
          const avgComments = posts.reduce((sum: number, post: any) => sum + post.comments, 0) / posts.length
          console.log(`  Avg Likes: ${avgLikes.toFixed(0)}, Avg Comments: ${avgComments.toFixed(0)}`)
        }
      }

      // Show qualification summary
      const premiumThreshold = scoringEngine.getQualificationThreshold('premium')
      const goodThreshold = scoringEngine.getQualificationThreshold('good')
      const acceptableThreshold = scoringEngine.getQualificationThreshold('acceptable')

      const premiumCount = scoredCreators.filter(c => c.score.overall >= premiumThreshold).length
      const goodCount = scoredCreators.filter(c => c.score.overall >= goodThreshold && c.score.overall < premiumThreshold).length
      const acceptableCount = scoredCreators.filter(c => c.score.overall >= acceptableThreshold && c.score.overall < goodThreshold).length

      console.log('\n📈 Qualification Summary:')
      console.log(`  🏆 Premium (${premiumThreshold}+): ${premiumCount} creators`)
      console.log(`  ⭐ Good (${goodThreshold}-${premiumThreshold}): ${goodCount} creators`)
      console.log(`  ✅ Acceptable (${acceptableThreshold}-${goodThreshold}): ${acceptableCount} creators`)
      console.log(`  ❌ Below threshold: ${scoredCreators.length - premiumCount - goodCount - acceptableCount} creators`)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await scraper.close()
    console.log('\n✅ Scraper closed')
  }
}

// Run the test
if (require.main === module) {
  testInstagramScraper().catch(console.error)
}

export { testInstagramScraper }