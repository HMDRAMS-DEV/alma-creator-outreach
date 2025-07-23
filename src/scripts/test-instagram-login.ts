import * as readline from 'readline'
import { InstagramScraperWithLogin } from '../services/instagram-scraper-with-login'
import { CreatorScoringEngine } from '../services/creator-scoring'
import type { DiscoveryCriteria } from '../types/creator'

function promptForCredentials(): Promise<{ username: string; password: string }> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question('Instagram username: ', (username) => {
      rl.question('Instagram password: ', (password) => {
        rl.close()
        console.log('') // Add newline after password input
        resolve({ username, password })
      })
    })
  })
}

async function testInstagramScraperWithLogin() {
  console.log('🚀 Testing Instagram Scraper with Login (SAFE MODE)\n')
  console.log('⚠️  SAFETY MEASURES ENABLED:')
  console.log('   - Maximum 10 posts per hashtag')
  console.log('   - 8+ second delays between requests')
  console.log('   - 30-60 second delays between hashtags')
  console.log('   - Anti-detection measures active')
  console.log('   - Conservative request patterns\n')
  
  // Get credentials
  const credentials = await promptForCredentials()
  
  const scraper = new InstagramScraperWithLogin({
    headless: false, // Keep browser visible for monitoring
    slowMo: 2000,    // 2 second delays for all actions
    credentials
  })

  const scoringEngine = new CreatorScoringEngine()

  try {
    await scraper.initialize()
    console.log('✅ Scraper initialized with anti-detection')

    // Login
    const loginSuccess = await scraper.login()
    if (!loginSuccess) {
      console.log('❌ Login failed, aborting test')
      return
    }

    // Define VERY conservative discovery criteria
    const criteria: DiscoveryCriteria = {
      platforms: ['instagram'],
      hashtags: ['productivity', 'entrepreneur'], // Only 2 hashtags for safety
      followerRange: [1000, 50000],
      minEngagementRate: 0.01,
      maxContactAttempts: 0,
      excludeVerified: true
    }

    console.log('🔍 Starting SAFE discovery with criteria:')
    console.log(`   Hashtags: ${criteria.hashtags.join(', ')}`)
    console.log(`   Expected time: ~2-3 minutes (with safety delays)\n`)

    // Discover creators
    const startTime = Date.now()
    const result = await scraper.discoverCreators(criteria)
    const totalTime = Date.now() - startTime
    
    console.log('\n📊 Scraping Results:')
    console.log(`- Total time: ${Math.round(totalTime/1000)}s`)
    console.log(`- Total posts scraped: ${result.stats.totalScraped}`)
    console.log(`- Unique creators found: ${result.creators.length}`)
    console.log(`- Average requests per minute: ${Math.round((result.stats.totalScraped / (totalTime/60000)) * 10) / 10}`)
    
    if (result.errors.length > 0) {
      console.log(`- Errors encountered: ${result.errors.length}`)
      result.errors.slice(0, 3).forEach(error => console.log(`  ⚠️ ${error}`))
      if (result.errors.length > 3) {
        console.log(`  ... and ${result.errors.length - 3} more`)
      }
    }

    // Score the creators if we found any
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

      console.log(`\n🎯 Top ${Math.min(5, scoredCreators.length)} Creators:`)
      for (const creator of scoredCreators.slice(0, 5)) {
        const posts = postsMap.get(creator.username) || []
        
        console.log(`\n@${creator.username}`)
        console.log(`  📊 Overall Score: ${(creator.score.overall * 100).toFixed(1)}%`)
        console.log(`  📈 Growth Potential: ${(creator.score.growthPotential * 100).toFixed(1)}%`)
        console.log(`  💬 Engagement Quality: ${(creator.score.engagementQuality * 100).toFixed(1)}%`)
        console.log(`  🎬 Content Consistency: ${(creator.score.contentConsistency * 100).toFixed(1)}%`)
        console.log(`  📝 Posts Analyzed: ${posts.length}`)
        
        if (posts.length > 0) {
          const avgLikes = posts.reduce((sum: number, post: any) => sum + post.likes, 0) / posts.length
          const avgComments = posts.reduce((sum: number, post: any) => sum + post.comments, 0) / posts.length
          console.log(`  ❤️ Avg Engagement: ${avgLikes.toFixed(0)} likes, ${avgComments.toFixed(0)} comments`)
          
          // Show a sample post
          const samplePost = posts[0]
          console.log(`  📄 Sample: "${samplePost.caption?.substring(0, 80)}..."`)
          if (samplePost.hashtags.length > 0) {
            console.log(`  🏷️ Tags: ${samplePost.hashtags.slice(0, 3).map((h: string) => '#' + h).join(', ')}`)
          }
        }
      }

      // Show qualification summary
      const premiumCount = scoredCreators.filter(c => c.score.overall >= 0.75).length
      const goodCount = scoredCreators.filter(c => c.score.overall >= 0.60 && c.score.overall < 0.75).length
      const acceptableCount = scoredCreators.filter(c => c.score.overall >= 0.45 && c.score.overall < 0.60).length

      console.log('\n📈 Qualification Summary:')
      console.log(`  🏆 Premium (75%+): ${premiumCount} creators`)
      console.log(`  ⭐ Good (60-75%): ${goodCount} creators`)
      console.log(`  ✅ Acceptable (45-60%): ${acceptableCount} creators`)
      console.log(`  ❌ Below threshold: ${scoredCreators.length - premiumCount - goodCount - acceptableCount} creators`)

      if (premiumCount > 0 || goodCount > 0) {
        console.log('\n🎉 SUCCESS: Found qualified creators for outreach!')
      } else {
        console.log('\n💡 TIP: Try different hashtags or adjust criteria to find better matches')
      }
    } else {
      console.log('\n💭 No creators found. This could be due to:')
      console.log('   - Very conservative safety limits')
      console.log('   - Instagram blocking or rate limiting')
      console.log('   - Try different hashtags or run again later')
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    console.log('\n🛡️ This might be Instagram\'s protection kicking in.')
    console.log('   - Wait 10-15 minutes before trying again')
    console.log('   - Consider using different hashtags')
    console.log('   - The scraper prioritizes safety over speed')
  } finally {
    await scraper.close()
    console.log('\n✅ Test completed - browser closed safely')
  }
}

// Run the test
if (require.main === module) {
  console.log('🔐 This test requires Instagram login credentials')
  console.log('💡 Your credentials are only used locally and not stored\n')
  
  testInstagramScraperWithLogin().catch(console.error)
}

export { testInstagramScraperWithLogin }