import { TikTokScraper, checkTikTokScraperSetup } from '../services/tiktok-scraper'
import { CreatorScoringEngine } from '../services/creator-scoring'

async function testTikTokScraper() {
  console.log('🚀 Testing TikTok Scraper...\n')

  // First check if dependencies are available
  console.log('🔧 Checking TikTok scraper setup...')
  const setupCheck = await checkTikTokScraperSetup()
  
  if (!setupCheck.ready) {
    console.log('❌ TikTok scraper not ready:', setupCheck.message)
    console.log('\n📋 To fix this, run:')
    console.log('   pip install playwright aiohttp')
    console.log('   playwright install')
    return
  }

  console.log('✅ TikTok scraper setup is ready\n')

  const scraper = new TikTokScraper({
    headless: false, // Keep browser visible for monitoring
    maxPostsPerHashtag: 5, // Very conservative for testing
    timeout: 180000 // 3 minutes timeout
  })

  const scoringEngine = new CreatorScoringEngine()

  try {
    console.log('🧪 Running quick test with #productivity hashtag...\n')
    
    const result = await scraper.quickTest('productivity')
    
    console.log('📊 TikTok Scraping Results:')
    console.log(`- Total posts scraped: ${result.stats.totalScraped}`)
    console.log(`- Unique creators found: ${result.creators.length}`)
    console.log(`- Time elapsed: ${Math.round(result.stats.timeElapsed/1000)}s`)
    
    if (result.errors.length > 0) {
      console.log(`- Errors encountered: ${result.errors.length}`)
      result.errors.slice(0, 3).forEach(error => console.log(`  ⚠️ ${error}`))
      if (result.errors.length > 3) {
        console.log(`  ... and ${result.errors.length - 3} more errors`)
      }
    }

    // Score the creators if we found any
    if (result.creators.length > 0) {
      console.log('\n🏆 Scoring TikTok creators...')
      
      // Group posts by creator
      const postsMap = new Map()
      for (const post of result.posts) {
        if (!postsMap.has(post.username)) {
          postsMap.set(post.username, [])
        }
        postsMap.get(post.username).push(post)
      }

      const targetNiches = ['productivity', 'business', 'entrepreneur', 'tech', 'lifestyle']
      const scoredCreators = await scoringEngine.scoreCreators(result.creators, postsMap, targetNiches)

      console.log(`\n🎯 Top ${Math.min(5, scoredCreators.length)} TikTok Creators:`)
      for (const creator of scoredCreators.slice(0, 5)) {
        const posts = postsMap.get(creator.username) || []
        
        console.log(`\n@${creator.username} (TikTok)`)
        console.log(`  📊 Overall Score: ${(creator.score.overall * 100).toFixed(1)}%`)
        console.log(`  📈 Growth Potential: ${(creator.score.growthPotential * 100).toFixed(1)}%`)
        console.log(`  💬 Engagement Quality: ${(creator.score.engagementQuality * 100).toFixed(1)}%`)
        console.log(`  🎬 Content Consistency: ${(creator.score.contentConsistency * 100).toFixed(1)}%`)
        console.log(`  👥 Estimated Followers: ${creator.estimatedFollowers.toLocaleString()}`)
        console.log(`  📝 Videos Analyzed: ${posts.length}`)
        
        if (posts.length > 0) {
          const avgLikes = posts.reduce((sum: number, post: any) => sum + post.likes, 0) / posts.length
          const avgComments = posts.reduce((sum: number, post: any) => sum + post.comments, 0) / posts.length
          const avgViews = posts.reduce((sum: number, post: any) => sum + (post.plays || 0), 0) / posts.length
          
          console.log(`  ❤️ Avg Engagement: ${avgLikes.toFixed(0)} likes, ${avgComments.toFixed(0)} comments`)
          console.log(`  👁️ Avg Views: ${avgViews.toLocaleString()}`)
          
          // Show a sample video
          const samplePost = posts[0]
          const sampleDesc = samplePost.description?.substring(0, 60) || 'No description'
          console.log(`  🎥 Sample: "${sampleDesc}${sampleDesc.length >= 60 ? '...' : ''}"`)
          
          if (samplePost.hashtags && samplePost.hashtags.length > 0) {
            console.log(`  🏷️ Tags: ${samplePost.hashtags.slice(0, 3).map((h: string) => '#' + h).join(', ')}`)
          }
        }
      }

      // Show qualification summary
      const premiumCount = scoredCreators.filter(c => c.score.overall >= 0.75).length
      const goodCount = scoredCreators.filter(c => c.score.overall >= 0.60 && c.score.overall < 0.75).length
      const acceptableCount = scoredCreators.filter(c => c.score.overall >= 0.45 && c.score.overall < 0.60).length

      console.log('\n📈 TikTok Qualification Summary:')
      console.log(`  🏆 Premium (75%+): ${premiumCount} creators`)
      console.log(`  ⭐ Good (60-75%): ${goodCount} creators`)
      console.log(`  ✅ Acceptable (45-60%): ${acceptableCount} creators`)
      console.log(`  ❌ Below threshold: ${scoredCreators.length - premiumCount - goodCount - acceptableCount} creators`)

      if (premiumCount > 0 || goodCount > 0) {
        console.log('\n🎉 SUCCESS: Found qualified TikTok creators for outreach!')
      } else {
        console.log('\n💡 TIP: Try different hashtags or adjust criteria for better TikTok matches')
      }

      // Compare with typical TikTok engagement rates
      console.log('\n📊 TikTok Engagement Analysis:')
      const avgEngagement = scoredCreators.reduce((sum, c) => sum + c.metrics.engagement30Day, 0) / scoredCreators.length
      console.log(`  📈 Average engagement rate: ${(avgEngagement * 100).toFixed(2)}%`)
      console.log(`  💡 Good TikTok engagement: >6%, Excellent: >9%`)

    } else {
      console.log('\n💭 No TikTok creators found. This could be due to:')
      console.log('   - Very conservative safety limits')
      console.log('   - TikTok anti-bot protection')
      console.log('   - Network issues or page structure changes')
      console.log('   - Try different hashtags or run again later')
    }

    console.log('\n🔍 TikTok vs Instagram Comparison:')
    console.log('   - TikTok: Generally higher engagement rates (5-15%)')
    console.log('   - TikTok: More discovery potential for new creators')
    console.log('   - TikTok: Younger audience demographic')
    console.log('   - TikTok: Video-first content format')

  } catch (error) {
    console.error('\n❌ TikTok test failed:', error)
    console.log('\n🛡️ This might be due to:')
    console.log('   - TikTok\'s anti-bot protection')
    console.log('   - Network connectivity issues')
    console.log('   - Missing Python dependencies')
    console.log('   - Page structure changes on TikTok')
    console.log('\n💡 Try again in a few minutes or check setup requirements')
  }

  console.log('\n✅ TikTok scraper test completed')
}

// Full discovery test with multiple hashtags
async function testTikTokFullDiscovery() {
  console.log('🚀 Testing TikTok Full Discovery...\n')

  const setupCheck = await checkTikTokScraperSetup()
  if (!setupCheck.ready) {
    console.log('❌ Setup required:', setupCheck.message)
    return
  }

  const scraper = new TikTokScraper({
    headless: true, // Run headless for full test
    maxPostsPerHashtag: 8,
    timeout: 300000 // 5 minutes
  })

  try {
    const criteria = {
      platforms: ['tiktok' as const],
      hashtags: ['productivity', 'entrepreneur'],
      followerRange: [1000, 50000] as [number, number],
      minEngagementRate: 0.03,
      maxContactAttempts: 0
    }

    console.log('🔍 Running full discovery with criteria:')
    console.log(`   Hashtags: ${criteria.hashtags.join(', ')}`)
    console.log(`   Follower range: ${criteria.followerRange[0].toLocaleString()}-${criteria.followerRange[1].toLocaleString()}`)
    console.log(`   Expected time: 3-5 minutes\n`)

    const result = await scraper.discoverCreators(criteria)

    console.log('🎯 Full Discovery Results:')
    console.log(`- Total creators: ${result.creators.length}`)
    console.log(`- Total posts: ${result.posts.length}`)
    console.log(`- Time taken: ${Math.round(result.stats.timeElapsed/1000)}s`)
    console.log(`- Success rate: ${result.errors.length === 0 ? '100%' : 'Partial'}`)

  } catch (error) {
    console.error('❌ Full discovery failed:', error)
  }
}

// Run the test
if (require.main === module) {
  const testType = process.argv[2] || 'quick'
  
  if (testType === 'full') {
    testTikTokFullDiscovery().catch(console.error)
  } else {
    testTikTokScraper().catch(console.error)
  }
}

export { testTikTokScraper, testTikTokFullDiscovery }