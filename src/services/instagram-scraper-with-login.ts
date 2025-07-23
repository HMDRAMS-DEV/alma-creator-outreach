import { chromium, Browser, Page } from 'playwright'
import type { Creator, InstagramPost, CreatorStatus, DiscoveryCriteria, ScrapingResult } from '@/types/creator'

interface LoginCredentials {
  username: string
  password: string
}

interface InstagramScraperOptions {
  headless?: boolean
  userAgent?: string
  viewport?: { width: number; height: number }
  slowMo?: number
  credentials?: LoginCredentials
}

export class InstagramScraperWithLogin {
  private browser: Browser | null = null
  private page: Page | null = null
  private options: InstagramScraperOptions
  private isLoggedIn = false
  private requestCount = 0
  private lastRequestTime = 0

  constructor(options: InstagramScraperOptions = {}) {
    this.options = {
      headless: true,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      slowMo: 2000, // Slower for safety
      ...options
    }
  }

  async initialize(): Promise<void> {
    console.log('🔧 Initializing Instagram scraper with anti-detection measures...')
    
    this.browser = await chromium.launch({
      headless: this.options.headless,
      slowMo: this.options.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check'
      ]
    })

    this.page = await this.browser.newPage({
      userAgent: this.options.userAgent,
      viewport: this.options.viewport,
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
      }
    })

    // Remove automation indicators
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      })
    })

    // Block images and videos to reduce load and appear more human-like
    await this.page.route('**/*.{png,jpg,jpeg,gif,webp,svg,mp4,mov,avi}', route => {
      route.abort()
    })

    console.log('✅ Scraper initialized with stealth mode')
  }

  async login(): Promise<boolean> {
    if (!this.page || !this.options.credentials) {
      throw new Error('Page not initialized or no credentials provided')
    }

    console.log('🔐 Logging into Instagram...')
    
    try {
      // Navigate to login page
      await this.page.goto('https://www.instagram.com/accounts/login/', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })

      // Wait for login form
      await this.page.waitForSelector('input[name="username"]', { timeout: 10000 })
      
      // Human-like typing with delays
      await this.humanType('input[name="username"]', this.options.credentials.username)
      await this.randomDelay(1000, 2000)
      
      await this.humanType('input[name="password"]', this.options.credentials.password)
      await this.randomDelay(1000, 2000)

      // Click login button
      await this.page.click('button[type="submit"]')
      
      // Wait for navigation or 2FA prompt
      await Promise.race([
        this.page.waitForURL('https://www.instagram.com/', { timeout: 15000 }),
        this.page.waitForSelector('input[name="verificationCode"]', { timeout: 15000 }).catch(() => null)
      ])

      // Check if we need 2FA
      const twoFAInput = await this.page.$('input[name="verificationCode"]')
      if (twoFAInput) {
        console.log('⚠️ 2FA required - please handle manually in the browser')
        console.log('⏳ Waiting for manual 2FA completion...')
        
        // Wait for successful login (up to 2 minutes for manual intervention)
        await this.page.waitForURL('https://www.instagram.com/', { timeout: 120000 })
      }

      // Dismiss any popups (save login info, notifications, etc.)
      await this.dismissPopups()

      this.isLoggedIn = true
      console.log('✅ Successfully logged into Instagram')
      
      // Wait after login to appear more human
      await this.randomDelay(3000, 5000)
      
      return true
    } catch (error) {
      console.error('❌ Login failed:', error)
      return false
    }
  }

  private async humanType(selector: string, text: string): Promise<void> {
    if (!this.page) return

    await this.page.click(selector)
    await this.randomDelay(100, 300)
    
    // Type character by character with human-like delays
    for (const char of text) {
      await this.page.keyboard.type(char)
      await this.randomDelay(50, 200) // Random typing speed
    }
  }

  private async dismissPopups(): Promise<void> {
    if (!this.page) return

    // Common popup dismissal
    const popupSelectors = [
      'button:has-text("Not Now")',
      'button:has-text("Not now")', 
      'button:has-text("Maybe Later")',
      'button:has-text("Dismiss")',
      '[aria-label="Close"]'
    ]

    for (const selector of popupSelectors) {
      try {
        const element = await this.page.$(selector)
        if (element) {
          await element.click()
          await this.randomDelay(500, 1000)
        }
      } catch {
        // Ignore errors, popups may not exist
      }
    }
  }

  private async respectRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    const minDelay = 8000 // Minimum 8 seconds between requests
    const maxRequestsPerMinute = 5 // Very conservative

    // Reset counter every minute
    if (timeSinceLastRequest > 60000) {
      this.requestCount = 0
    }

    // Enforce rate limit
    if (this.requestCount >= maxRequestsPerMinute) {
      const waitTime = 60000 - timeSinceLastRequest
      console.log(`🐌 Rate limit reached, waiting ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      this.requestCount = 0
    }

    // Ensure minimum delay between requests
    if (timeSinceLastRequest < minDelay) {
      const waitTime = minDelay - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.requestCount++
    this.lastRequestTime = Date.now()
  }

  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  async scrapeHashtag(hashtag: string, maxPosts: number = 20): Promise<ScrapingResult> {
    if (!this.page || !this.isLoggedIn) {
      throw new Error('Not logged in or page not initialized')
    }

    console.log(`🔍 Scraping Instagram hashtag: #${hashtag} (max ${maxPosts} posts)`)
    const startTime = Date.now()
    const posts: InstagramPost[] = []
    const creators: Creator[] = []
    const errors: string[] = []
    const seenUsernames = new Set<string>()

    try {
      await this.respectRateLimit()

      // Navigate to hashtag page
      const url = `https://www.instagram.com/explore/tags/${hashtag}/`
      await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      
      // Wait for posts to load
      await this.page.waitForSelector('article', { timeout: 15000 })

      // Get initial posts (first 9-12 posts are usually visible)
      const postLinks = await this.page.$$eval(
        'article a[href*="/p/"]',
        links => links.slice(0, 12).map(link => link.getAttribute('href')).filter(Boolean)
      )

      console.log(`Found ${postLinks.length} initial post links`)

      // Process each post (with strict limits)
      const postsToProcess = postLinks.slice(0, Math.min(maxPosts, 10)) // Max 10 posts per hashtag
      
      for (let i = 0; i < postsToProcess.length; i++) {
        const postUrl = postsToProcess[i]
        if (!postUrl) continue

        console.log(`Processing post ${i + 1}/${postsToProcess.length}: ${postUrl}`)

        try {
          await this.respectRateLimit() // Rate limit each request

          const postData = await this.scrapePostData(postUrl)
          if (postData) {
            posts.push(postData)
            
            // Track unique creators (but don't fetch their profiles to avoid more requests)
            if (!seenUsernames.has(postData.username)) {
              seenUsernames.add(postData.username)
              
              // Create basic creator info from post data only
              const creator: Creator = {
                username: postData.username,
                platform: 'instagram',
                estimatedFollowers: 0, // Will need separate call to get this
                engagementRate: 0,
                status: 'discovered' as CreatorStatus,
                contactAttempts: 0,
                createdAt: new Date(),
                updatedAt: new Date()
              }
              
              creators.push(creator)
            }
          }

          // Extra delay between posts
          await this.randomDelay(2000, 4000)

        } catch (error) {
          errors.push(`Error scraping post ${postUrl}: ${error}`)
          console.log(`⚠️ Error with post, continuing...`)
        }
      }

    } catch (error) {
      errors.push(`Hashtag scraping error: ${error}`)
    }

    const timeElapsed = Date.now() - startTime
    console.log(`✅ Finished scraping #${hashtag}: ${posts.length} posts, ${creators.length} creators`)

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
      await this.page.goto(`https://www.instagram.com${postUrl}`, { 
        waitUntil: 'domcontentloaded',
        timeout: 20000
      })
      
      // Wait for post content
      await this.page.waitForSelector('article', { timeout: 10000 })

      // Extract post data with error handling
      const postData = await this.page.evaluate((url) => {
        try {
          const article = document.querySelector('article')
          if (!article) return null

          // Get username - try multiple selectors
          let username = ''
          const usernameSelectors = [
            'header a[role="link"] span',
            'header a span',
            'a[href^="/"] span'
          ]
          
          for (const selector of usernameSelectors) {
            const element = article.querySelector(selector)
            if (element && element.textContent) {
              username = element.textContent.trim()
              break
            }
          }

          // Get caption with fallback
          let caption = ''
          const captionSelectors = [
            'div[data-testid="post-caption"] span',
            'article span[dir="auto"]',
            'article div[data-testid="post-caption"]'
          ]
          
          for (const selector of captionSelectors) {
            const element = article.querySelector(selector)
            if (element && element.textContent) {
              caption = element.textContent.trim()
              break
            }
          }

          // Simple engagement extraction (Instagram hides exact numbers)
          const likeElements = article.querySelectorAll('span[dir="auto"]')
          let likes = 0
          let comments = 0
          
          for (let i = 0; i < likeElements.length; i++) {
            const element = likeElements[i]
            const text = element.textContent || ''
            if (text.includes('like')) {
              const match = text.match(/(\d+)/)
              if (match) likes = parseInt(match[1])
            }
            if (text.includes('comment')) {
              const match = text.match(/(\d+)/)
              if (match) comments = parseInt(match[1])
            }
          }

          // Extract hashtags from caption
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
        } catch (error) {
          console.error('Error in page evaluation:', error)
          return null
        }
      }, postUrl)

      return postData as InstagramPost
    } catch (error) {
      console.error(`Error scraping post ${postUrl}:`, error)
      return null
    }
  }

  async discoverCreators(criteria: DiscoveryCriteria): Promise<ScrapingResult> {
    if (!this.isLoggedIn) {
      throw new Error('Must be logged in to discover creators')
    }

    console.log('🎯 Starting conservative creator discovery...')
    const allResults: ScrapingResult = {
      creators: [],
      posts: [],
      errors: [],
      stats: { totalScraped: 0, qualified: 0, duplicates: 0, timeElapsed: 0 }
    }

    // Process hashtags one by one with delays
    for (let i = 0; i < criteria.hashtags.length; i++) {
      const hashtag = criteria.hashtags[i]
      
      console.log(`\n📍 Processing hashtag ${i + 1}/${criteria.hashtags.length}: #${hashtag}`)
      
      try {
        const result = await this.scrapeHashtag(hashtag, 10) // Only 10 posts per hashtag
        
        // Merge results
        allResults.creators.push(...result.creators)
        allResults.posts.push(...result.posts)
        allResults.errors.push(...result.errors)
        allResults.stats.totalScraped += result.stats.totalScraped
        
        // Long delay between hashtags (30-60 seconds)
        if (i < criteria.hashtags.length - 1) {
          const delay = 30000 + Math.random() * 30000 // 30-60 seconds
          console.log(`🕐 Waiting ${Math.round(delay/1000)}s before next hashtag...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        
      } catch (error) {
        allResults.errors.push(`Error processing hashtag ${hashtag}: ${error}`)
      }
    }

    // Remove duplicates
    const uniqueCreators = allResults.creators.filter((creator, index, self) => 
      index === self.findIndex(c => c.username === creator.username)
    )

    allResults.creators = uniqueCreators
    allResults.stats.qualified = uniqueCreators.length
    allResults.stats.duplicates = allResults.creators.length - uniqueCreators.length

    console.log('\n🎉 Discovery completed successfully!')
    return allResults
  }

  async close(): Promise<void> {
    if (this.page) await this.page.close()
    if (this.browser) await this.browser.close()
    console.log('🔒 Browser closed')
  }
}