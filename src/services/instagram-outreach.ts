import { chromium, Browser, Page } from 'playwright'
import type { Creator } from '@/types/creator'
import type { Conversation, ConversationTemplate } from '@/types/conversation'

interface OutreachOptions {
  headless?: boolean
  slowMo?: number
  credentials: {
    username: string
    password: string
  }
}

interface OutreachResult {
  success: boolean
  messageId?: string
  error?: string
  creatorResponded?: boolean
}

export class InstagramOutreachService {
  private browser: Browser | null = null
  private page: Page | null = null
  private options: OutreachOptions
  private isLoggedIn = false
  private messageCount = 0
  private lastMessageTime = 0
  private dailyMessageLimit = 50 // Very conservative daily limit

  constructor(options: OutreachOptions) {
    this.options = {
      headless: true,
      slowMo: 3000, // Extra slow for outreach
      ...options
    }
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Instagram outreach service...')
    
    this.browser = await chromium.launch({
      headless: this.options.headless,
      slowMo: this.options.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled'
      ]
    })

    this.page = await this.browser.newPage({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 }
    })

    // Enhanced stealth mode
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] })
    })
  }

  async login(): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized')

    console.log('🔐 Logging in for outreach...')

    try {
      await this.page.goto('https://www.instagram.com/accounts/login/')
      await this.page.waitForSelector('input[name="username"]')

      // Human-like login
      await this.humanType('input[name="username"]', this.options.credentials.username)
      await this.randomDelay(1000, 2000)
      
      await this.humanType('input[name="password"]', this.options.credentials.password)
      await this.randomDelay(1500, 2500)

      await this.page.click('button[type="submit"]')
      
      await Promise.race([
        this.page.waitForURL('https://www.instagram.com/', { timeout: 20000 }),
        this.page.waitForSelector('input[name="verificationCode"]', { timeout: 20000 }).catch(() => null)
      ])

      // Handle 2FA if needed
      const twoFAInput = await this.page.$('input[name="verificationCode"]')
      if (twoFAInput) {
        console.log('⚠️ 2FA required for outreach - handle manually')
        await this.page.waitForURL('https://www.instagram.com/', { timeout: 120000 })
      }

      await this.dismissLoginPopups()
      this.isLoggedIn = true
      
      console.log('✅ Logged in successfully for outreach')
      return true
    } catch (error) {
      console.error('❌ Outreach login failed:', error)
      return false
    }
  }

  private async dismissLoginPopups(): Promise<void> {
    const popupSelectors = [
      'button:has-text("Not Now")',
      'button:has-text("Save Info")',
      'button:has-text("Turn on Notifications")',
      '[aria-label="Close"]'
    ]

    for (const selector of popupSelectors) {
      try {
        const element = await this.page?.$(selector)
        if (element) {
          await element.click()
          await this.randomDelay(1000, 2000)
        }
      } catch {
        // Ignore popup dismissal errors
      }
    }
  }

  async sendDirectMessage(
    creator: Creator, 
    template: ConversationTemplate
  ): Promise<OutreachResult> {
    if (!this.page || !this.isLoggedIn) {
      return { success: false, error: 'Not logged in' }
    }

    // Check rate limits
    const canSend = await this.checkRateLimit()
    if (!canSend) {
      return { success: false, error: 'Rate limit exceeded' }
    }

    console.log(`📨 Sending DM to @${creator.username}`)

    try {
      // Navigate to creator's profile
      await this.page.goto(`https://www.instagram.com/${creator.username}/`)
      await this.page.waitForLoadState('networkidle')
      await this.randomDelay(2000, 4000)

      // Check if profile exists and is accessible
      const profileNotFound = await this.page.$('h2:has-text("Sorry, this page isn\'t available.")')
      if (profileNotFound) {
        return { success: false, error: 'Profile not found or private' }
      }

      // Look for Message button
      const messageButton = await this.page.$('div[role="button"]:has-text("Message")')
      if (!messageButton) {
        // Try alternative selectors
        const altMessageButton = await this.page.$('button:has-text("Message")')
        if (!altMessageButton) {
          return { success: false, error: 'Message button not found - may be private account' }
        }
        await altMessageButton.click()
      } else {
        await messageButton.click()
      }

      await this.randomDelay(2000, 3000)

      // Wait for message compose area
      await this.page.waitForSelector('textarea[placeholder*="Message"]', { timeout: 10000 })
      
      // Generate personalized message
      const personalizedMessage = this.personalizeMessage(template, creator)
      
      console.log(`💬 Sending message: "${personalizedMessage.substring(0, 50)}..."`)

      // Type message with human-like behavior
      await this.humanTypeMessage('textarea[placeholder*="Message"]', personalizedMessage)
      await this.randomDelay(1000, 2000)

      // Send message
      const sendButton = await this.page.$('button[type="submit"]')
      if (sendButton) {
        await sendButton.click()
      } else {
        // Try pressing Enter
        await this.page.keyboard.press('Enter')
      }

      // Wait for message to be sent
      await this.randomDelay(2000, 3000)

      // Check if message was sent successfully
      const messageSent = await this.verifyMessageSent()
      
      if (messageSent) {
        this.messageCount++
        this.lastMessageTime = Date.now()
        
        console.log(`✅ Message sent successfully to @${creator.username}`)
        return { 
          success: true, 
          messageId: `${creator.username}_${Date.now()}` 
        }
      } else {
        return { success: false, error: 'Message may not have been sent' }
      }

    } catch (error) {
      console.error(`❌ Failed to send message to @${creator.username}:`, error)
      return { success: false, error: `Send failed: ${error}` }
    }
  }

  private async checkRateLimit(): Promise<boolean> {
    const now = Date.now()
    const hoursSinceLastMessage = (now - this.lastMessageTime) / (1000 * 60 * 60)
    
    // Reset daily counter if it's been more than 24 hours
    if (hoursSinceLastMessage > 24) {
      this.messageCount = 0
    }

    // Check daily limit
    if (this.messageCount >= this.dailyMessageLimit) {
      console.log(`🚫 Daily message limit reached (${this.dailyMessageLimit}). Waiting...`)
      return false
    }

    // Ensure minimum 2 minutes between messages
    const minDelay = 2 * 60 * 1000 // 2 minutes
    if (now - this.lastMessageTime < minDelay) {
      const waitTime = minDelay - (now - this.lastMessageTime)
      console.log(`⏳ Waiting ${Math.round(waitTime/1000)}s before next message...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    return true
  }

  private personalizeMessage(template: ConversationTemplate, creator: Creator): string {
    let message = template.content

    // Replace common variables
    const variables = {
      '{{username}}': creator.username,
      '{{follower_count}}': creator.estimatedFollowers?.toLocaleString() || 'your audience',
      '{{platform}}': 'Instagram',
      '{{engagement_rate}}': creator.engagementRate ? `${(creator.engagementRate * 100).toFixed(1)}%` : 'great',
      '{{bio}}': creator.bio?.substring(0, 50) || 'content',
      '{{first_name}}': this.extractFirstName(creator.username)
    }

    for (const [placeholder, value] of Object.entries(variables)) {
      message = message.replace(new RegExp(placeholder, 'g'), value)
    }

    return message
  }

  private extractFirstName(username: string): string {
    // Try to extract a reasonable first name from username
    const cleanUsername = username.replace(/[_\.]/g, '')
    if (cleanUsername.length > 0) {
      return cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1, 8).toLowerCase()
    }
    return username
  }

  private async humanType(selector: string, text: string): Promise<void> {
    if (!this.page) return

    await this.page.click(selector)
    await this.randomDelay(200, 500)
    
    for (const char of text) {
      await this.page.keyboard.type(char)
      await this.randomDelay(80, 200) // Slower typing for messages
    }
  }

  private async humanTypeMessage(selector: string, text: string): Promise<void> {
    if (!this.page) return

    await this.page.click(selector)
    await this.randomDelay(500, 1000)
    
    // Type message in chunks to simulate thinking pauses
    const chunks = this.splitIntoChunks(text, 10, 25)
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      
      for (const char of chunk) {
        await this.page.keyboard.type(char)
        await this.randomDelay(60, 180)
      }
      
      // Pause between chunks (thinking time)
      if (i < chunks.length - 1) {
        await this.randomDelay(800, 2000)
      }
    }
  }

  private splitIntoChunks(text: string, minSize: number, maxSize: number): string[] {
    const words = text.split(' ')
    const chunks: string[] = []
    let currentChunk = ''
    
    for (const word of words) {
      if (currentChunk.length + word.length + 1 <= maxSize) {
        currentChunk += (currentChunk ? ' ' : '') + word
      } else {
        if (currentChunk.length >= minSize) {
          chunks.push(currentChunk)
          currentChunk = word
        } else {
          currentChunk += (currentChunk ? ' ' : '') + word
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk)
    }
    
    return chunks
  }

  private async verifyMessageSent(): Promise<boolean> {
    if (!this.page) return false

    try {
      // Look for indicators that message was sent
      const sentIndicators = [
        'div[data-testid="message-text"]', // Message appears in thread
        'time', // Timestamp appears
        'svg[aria-label="Seen"]' // Seen indicator
      ]

      for (const selector of sentIndicators) {
        const element = await this.page.$(selector)
        if (element) return true
      }

      return false
    } catch {
      return false
    }
  }

  async checkForResponses(creators: Creator[]): Promise<Conversation[]> {
    if (!this.page || !this.isLoggedIn) return []

    console.log('📬 Checking for creator responses...')
    const conversations: Conversation[] = []

    try {
      // Navigate to direct messages
      await this.page.goto('https://www.instagram.com/direct/inbox/')
      await this.page.waitForLoadState('networkidle')
      await this.randomDelay(2000, 3000)

      // Get recent conversations
      const conversationElements = await this.page.$$('[role="listitem"]')
      
      for (const element of conversationElements.slice(0, 10)) { // Check top 10 conversations
        try {
          const usernameElement = await element.$('span')
          if (!usernameElement) continue

          const username = await usernameElement.textContent()
          if (!username) continue

          // Check if this is one of our target creators
          const targetCreator = creators.find(c => c.username === username.trim())
          if (!targetCreator) continue

          console.log(`💬 Found conversation with @${username}`)

          // Click on conversation
          await element.click()
          await this.randomDelay(1000, 2000)

          // Extract recent messages
          const messages = await this.extractMessages(targetCreator.id || username)
          
          if (messages.length > 0) {
            conversations.push({
              id: `${username}_conversation`,
              creatorId: targetCreator.id || username,
              creator: targetCreator,
              status: 'in_progress' as any,
              messages,
              intent: 'unknown' as any,
              tags: [],
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }

          await this.randomDelay(1000, 2000)
        } catch (error) {
          console.log(`⚠️ Error checking conversation: ${error}`)
        }
      }

    } catch (error) {
      console.error('❌ Error checking responses:', error)
    }

    console.log(`📊 Found ${conversations.length} active conversations`)
    return conversations
  }

  private async extractMessages(creatorId: string): Promise<any[]> {
    if (!this.page) return []

    try {
      const messageElements = await this.page.$$('[data-testid="message-text"]')
      const messages = []

      for (const element of messageElements.slice(-5)) { // Get last 5 messages
        const content = await element.textContent()
        if (content) {
          messages.push({
            id: `msg_${Date.now()}_${Math.random()}`,
            conversationId: `${creatorId}_conversation`,
            content,
            isFromAI: false,
            isFromCreator: true, // Assume messages we're reading are from creator
            timestamp: new Date()
          })
        }
      }

      return messages
    } catch {
      return []
    }
  }

  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  async close(): Promise<void> {
    if (this.page) await this.page.close()
    if (this.browser) await this.browser.close()
    console.log('🔒 Outreach service closed')
  }

  // Batch messaging with safety controls
  async sendBatchMessages(
    creators: Creator[],
    template: ConversationTemplate,
    maxMessages: number = 10
  ): Promise<OutreachResult[]> {
    console.log(`📮 Starting batch outreach to ${Math.min(creators.length, maxMessages)} creators`)
    
    const results: OutreachResult[] = []
    const batchSize = Math.min(creators.length, maxMessages, this.dailyMessageLimit - this.messageCount)
    
    if (batchSize <= 0) {
      console.log('🚫 Daily limit reached or no creators to message')
      return results
    }

    for (let i = 0; i < batchSize; i++) {
      const creator = creators[i]
      console.log(`\n📨 Message ${i + 1}/${batchSize}: @${creator.username}`)
      
      const result = await this.sendDirectMessage(creator, template)
      results.push(result)
      
      if (result.success) {
        console.log(`✅ Success: Message sent to @${creator.username}`)
      } else {
        console.log(`❌ Failed: ${result.error}`)
      }
      
      // Long delay between messages (2-5 minutes)
      if (i < batchSize - 1) {
        const delay = 2 * 60 * 1000 + Math.random() * 3 * 60 * 1000 // 2-5 minutes
        console.log(`⏳ Waiting ${Math.round(delay/60000)} minutes before next message...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    const successCount = results.filter(r => r.success).length
    console.log(`\n🎯 Batch complete: ${successCount}/${batchSize} messages sent successfully`)
    
    return results
  }
}