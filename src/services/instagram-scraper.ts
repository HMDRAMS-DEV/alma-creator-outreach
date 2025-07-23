import { chromium, Browser, Page } from 'playwright'
import type { Creator, InstagramPost, CreatorStatus, DiscoveryCriteria, ScrapingResult } from '@/types/creator'

interface InstagramScraperOptions {
  headless?: boolean
  userAgent?: string
  viewport?: { width: number; height: number }
  slowMo?: number
}

export class InstagramScraper {
  private browser: Browser | null = null
  private page: Page | null = null
  private options: InstagramScraperOptions

  constructor(options: InstagramScraperOptions = {}) {
    this.options = {
      headless: true,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      slowMo: 1000,
      ...options
    }
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.options.headless,
      slowMo: this.options.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    })

    this.page = await this.browser.newPage({
      userAgent: this.options.userAgent,
      viewport: this.options.viewport
    })

    // Block unnecessary resources to speed up scraping
    await this.page.route('**/*.{png,jpg,jpeg,gif,webp,svg,ico,woff,woff2}', route => route.abort())
  }

  async scrapeHashtag(hashtag: string, maxPosts: number = 100): Promise<ScrapingResult> {
    if (!this.page) throw new Error('Scraper not initialized')

    const startTime = Date.now()
    const posts: InstagramPost[] = []
    const creators: Creator[] = []
    const errors: string[] = []
    const seenUsernames = new Set<string>()

    try {
      console.log(`🔍 Scraping Instagram hashtag: #${hashtag}`)
      
      // Navigate to hashtag page
      const url = `https://www.instagram.com/explore/tags/${hashtag}/`
      await this.page.goto(url, { waitUntil: 'networkidle' })
      
      // Wait for posts to load
      await this.page.waitForSelector('article', { timeout: 10000 })

      let scrollAttempts = 0
      const maxScrolls = Math.ceil(maxPosts / 12) // ~12 posts per scroll
      
      while (posts.length < maxPosts && scrollAttempts < maxScrolls) {
        // Get post elements
        const postElements = await this.page.$$('article a[href*="/p/"]')
        
        for (const postElement of postElements.slice(posts.length)) {
          if (posts.length >= maxPosts) break
          
          try {
            const href = await postElement.getAttribute('href')
            if (!href) continue

            const postData = await this.scrapePostData(href)
            if (postData) {
              posts.push(postData)
              
              // Track unique creators
              if (!seenUsernames.has(postData.username)) {
                seenUsernames.add(postData.username)
                
                const creatorData = await this.getCreatorBasicInfo(postData.username)
                if (creatorData) {
                  creators.push(creatorData)
                }
              }
            }
          } catch (error) {
            errors.push(`Error scraping post: ${error}`)
          }
        }

        // Scroll to load more posts
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
        await this.page.waitForTimeout(2000 + Math.random() * 2000) // Random delay
        scrollAttempts++
      }

    } catch (error) {
      errors.push(`Hashtag scraping error: ${error}`)
    }

    const timeElapsed = Date.now() - startTime
    
    return {
      creators,
      posts,
      errors,
      stats: {
        totalScraped: posts.length,
        qualified: creators.length,
        duplicates: posts.length - seenUsernames.size,
        timeElapsed
      }
    }
  }

  private async scrapePostData(postUrl: string): Promise<InstagramPost | null> {
    if (!this.page) return null

    try {
      // Visit post page
      await this.page.goto(`https://www.instagram.com${postUrl}`, { waitUntil: 'domcontentloaded' })
      
      // Wait for post content
      await this.page.waitForSelector('article', { timeout: 5000 })

      // Extract post data
      const postData = await this.page.evaluate((url) => {
        const article = document.querySelector('article')
        if (!article) return null

        // Get username
        const usernameEl = article.querySelector('header a[role="link"]')
        const username = usernameEl?.textContent?.trim() || ''

        // Get caption
        const captionEl = article.querySelector('div[data-testid="post-caption"] span')
        const caption = captionEl?.textContent?.trim() || ''

        // Get engagement metrics from buttons
        const likeButton = article.querySelector('button[aria-label*="like"]')
        const likeText = likeButton?.getAttribute('aria-label') || '0'
        const likes = extractNumber(likeText)

        const commentButton = article.querySelector('button[aria-label*="comment"]')
        const commentText = commentButton?.getAttribute('aria-label') || '0'
        const comments = extractNumber(commentText)

        // Extract hashtags
        const hashtags = (caption.match(/#[a-zA-Z0-9_]+/g) || []).map(tag => tag.substring(1))
        
        // Extract mentions
        const mentions = (caption.match(/@[a-zA-Z0-9_.]+/g) || []).map(mention => mention.substring(1))

        // Determine media type
        const hasVideo = article.querySelector('video')
        const hasCarousel = article.querySelector('button[aria-label*="Next"]')
        const mediaType = hasVideo ? 'video' : hasCarousel ? 'carousel' : 'photo'

        return {
          id: url.split('/p/')[1]?.split('/')[0] || '',
          username,
          caption,
          likes,
          comments,
          hashtags,
          mentions,
          mediaType,
          timestamp: new Date()
        }
      }, postUrl)

      return postData as InstagramPost
    } catch (error) {
      console.error(`Error scraping post ${postUrl}:`, error)
      return null
    }
  }

  private async getCreatorBasicInfo(username: string): Promise<Creator | null> {
    if (!this.page) return null

    try {
      await this.page.goto(`https://www.instagram.com/${username}/`, { waitUntil: 'domcontentloaded' })
      
      const creatorData = await this.page.evaluate(() => {
        // Try to extract data from meta tags first
        const getMetaContent = (property: string) => {
          const meta = document.querySelector(`meta[property="${property}"]`)
          return meta?.getAttribute('content') || ''
        }

        const description = getMetaContent('og:description')
        
        // Parse follower count from description (format: "X Followers, Y Following, Z Posts")
        const followerMatch = description.match(/([\d,]+)\s+Followers/)
        const followerText = followerMatch?.[1] || '0'
        const followerCount = parseInt(followerText.replace(/,/g, ''))

        const postMatch = description.match(/([\d,]+)\s+Posts/)
        const postText = postMatch?.[1] || '0'
        const postCount = parseInt(postText.replace(/,/g, ''))

        // Try to get bio
        const bioEl = document.querySelector('div[data-testid="user-bio"] span')
        const bio = bioEl?.textContent?.trim() || ''

        // Check if verified
        const verificationEl = document.querySelector('svg[aria-label*="Verified"]')
        const isVerified = !!verificationEl

        return {
          followerCount: isNaN(followerCount) ? 0 : followerCount,
          postCount: isNaN(postCount) ? 0 : postCount,
          bio,
          isVerified
        }
      })

      const creator: Creator = {
        username,
        platform: 'instagram',
        followerCount: creatorData.followerCount,
        estimatedFollowers: creatorData.followerCount,
        engagementRate: 0, // Will be calculated later
        bio: creatorData.bio,
        isVerified: creatorData.isVerified,
        postCount: creatorData.postCount,
        status: 'discovered' as CreatorStatus,
        contactAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      return creator
    } catch (error) {
      console.error(`Error getting creator info for ${username}:`, error)
      return null
    }
  }

  async discoverCreators(criteria: DiscoveryCriteria): Promise<ScrapingResult> {
    const allResults: ScrapingResult = {
      creators: [],
      posts: [],
      errors: [],
      stats: { totalScraped: 0, qualified: 0, duplicates: 0, timeElapsed: 0 }
    }

    for (const hashtag of criteria.hashtags) {
      try {
        const result = await this.scrapeHashtag(hashtag, 50) // 50 posts per hashtag
        
        // Merge results
        allResults.creators.push(...result.creators)
        allResults.posts.push(...result.posts)
        allResults.errors.push(...result.errors)
        allResults.stats.totalScraped += result.stats.totalScraped
        
        // Add delay between hashtags
        await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000))
      } catch (error) {
        allResults.errors.push(`Error processing hashtag ${hashtag}: ${error}`)
      }
    }

    // Filter creators based on criteria
    const qualifiedCreators = allResults.creators.filter(creator => 
      this.meetsDiscoveryCriteria(creator, criteria)
    )

    allResults.creators = qualifiedCreators
    allResults.stats.qualified = qualifiedCreators.length
    allResults.stats.duplicates = allResults.creators.length - qualifiedCreators.length

    return allResults
  }

  private meetsDiscoveryCriteria(creator: Creator, criteria: DiscoveryCriteria): boolean {
    const { followerRange, excludeVerified } = criteria
    
    if (creator.followerCount === undefined) return false
    
    // Check follower count range
    if (creator.followerCount < followerRange[0] || creator.followerCount > followerRange[1]) {
      return false
    }

    // Exclude verified accounts if specified
    if (excludeVerified && creator.isVerified) {
      return false
    }

    return true
  }

  async close(): Promise<void> {
    if (this.page) await this.page.close()
    if (this.browser) await this.browser.close()
  }
}

// Helper function to extract numbers from text
function extractNumber(text: string): number {
  const match = text.match(/([\d,]+)/)
  if (!match) return 0
  return parseInt(match[1].replace(/,/g, ''))
}