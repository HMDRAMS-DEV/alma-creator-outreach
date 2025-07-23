# Technical Implementation Guide

## 🔧 Detailed Implementation Strategy

### TypeScript Architecture Choice

**Decision: TypeScript + Node.js over Python**
- Better tooling ecosystem for web dashboard
- Vercel deployment simplicity
- Strong typing for complex automation logic
- Easier integration with modern web APIs

## 📦 Core Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.20.0",
    "playwright": "^1.40.0",
    "prisma": "^5.7.0",
    "@prisma/client": "^5.7.0",
    "bullmq": "^4.15.0",
    "ioredis": "^5.3.2",
    "nodemailer": "^6.9.7",
    "zod": "^3.22.4",
    "next": "^14.0.0",
    "react": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "tsx": "^4.6.0"
  }
}
```

## 🏗️ Project Structure

```
alma-creator/
├── src/
│   ├── services/
│   │   ├── creator-discovery.ts      # API integrations for finding creators
│   │   ├── instagram-automation.ts   # Instagram outreach logic
│   │   ├── tiktok-automation.ts      # TikTok outreach logic
│   │   ├── ai-conversation.ts        # Claude API integration
│   │   └── notification.ts           # Email alerts
│   ├── types/
│   │   ├── creator.ts                # Creator data models
│   │   ├── conversation.ts           # Chat thread types
│   │   └── campaign.ts               # Campaign configuration
│   ├── utils/
│   │   ├── rate-limiting.ts          # Anti-detection utilities
│   │   ├── proxy-rotation.ts         # IP management
│   │   └── human-behavior.ts         # Randomization helpers
│   ├── workers/
│   │   ├── discovery-worker.ts       # Background creator discovery
│   │   ├── outreach-worker.ts        # Message sending queue
│   │   └── conversation-worker.ts    # AI response handling
│   └── web/
│       ├── pages/api/                # API endpoints
│       ├── components/               # Dashboard UI
│       └── pages/                    # Next.js pages
├── prisma/
│   ├── schema.prisma                 # Database schema
│   └── migrations/                   # Schema versions
└── docs/
    ├── project-specification.md
    └── technical-implementation-guide.md
```

## 🎯 Creator Discovery Implementation

### API Integration Strategy

```typescript
// src/services/creator-discovery.ts
interface CreatorDiscoveryService {
  findRisingCreators(criteria: DiscoveryCriteria): Promise<Creator[]>
  analyzeGrowthTrend(creator: Creator): Promise<GrowthAnalysis>
  scoreCreatorPotential(creator: Creator): Promise<number>
}

class ModashDiscoveryService implements CreatorDiscoveryService {
  private client: ModashClient
  
  async findRisingCreators(criteria: DiscoveryCriteria) {
    // Implementation using Modash API
    // Filter by follower growth rate, engagement metrics
    // Return prioritized creator list
  }
}
```

### Filtering Algorithm

```typescript
interface DiscoveryCriteria {
  platforms: ('instagram' | 'tiktok')[]
  followerRange: [number, number]
  minimumEngagementRate: number
  growthRateThreshold: number
  contentCategories: string[]
  locationFilter?: string
}

// Target Profile: Nano/Micro influencers
const DEFAULT_CRITERIA: DiscoveryCriteria = {
  platforms: ['instagram', 'tiktok'],
  followerRange: [1000, 50000],
  minimumEngagementRate: 0.03, // 3%
  growthRateThreshold: 0.10,   // 10% monthly growth
  contentCategories: ['lifestyle', 'tech', 'productivity']
}
```

## 🤖 Automation Implementation

### Instagram Automation

```typescript
// src/services/instagram-automation.ts
class InstagramOutreachService {
  private browser: Browser
  private proxyRotator: ProxyRotator
  
  async sendDirectMessage(creator: Creator, template: MessageTemplate) {
    // Use Playwright with stealth mode
    // Implement human-like behavior patterns
    // Handle rate limiting and detection avoidance
  }
  
  private async simulateHumanBehavior() {
    // Random delays between 30-300 seconds
    // Scroll behavior simulation
    // Random mouse movements
  }
}
```

### Safety Mechanisms

```typescript
// src/utils/rate-limiting.ts
class RateLimiter {
  private actionsPerHour = 15 // Conservative limit
  private dailyLimit = 100
  
  async canPerformAction(accountId: string): Promise<boolean> {
    // Check hourly and daily limits
    // Implement exponential backoff on failures
    // Account for different action types (DM, follow, like)
  }
}

// src/utils/human-behavior.ts  
class HumanBehaviorSimulator {
  generateRandomDelay(): number {
    // Weighted random delays: 30-300 seconds
    // Simulate natural user patterns
  }
  
  simulateTypingSpeed(message: string): number {
    // Calculate realistic typing duration
    // Add random pauses for "thinking"
  }
}
```

## 🧠 AI Conversation System

### Claude Integration

```typescript
// src/services/ai-conversation.ts
class AIConversationHandler {
  private claude: Anthropic
  
  async generateResponse(
    conversation: ConversationThread,
    newMessage: Message
  ): Promise<AIResponse> {
    const systemPrompt = `
      You are a brand representative reaching out to social media creators.
      Your goal is to:
      1. Determine if they're interested in a partnership
      2. Answer basic questions about our product
      3. Escalate qualified leads to human review
      
      Keep responses friendly, professional, and brief.
      If they show interest, collect basic info and escalate.
    `
    
    const response = await this.claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      system: systemPrompt,
      messages: this.formatConversationHistory(conversation),
      max_tokens: 200
    })
    
    return this.parseResponse(response)
  }
  
  private classifyIntent(message: string): Intent {
    // Use Claude to classify: INTERESTED | NOT_INTERESTED | NEEDS_INFO
  }
}
```

### Conversation Flow Logic

```typescript
enum ConversationState {
  INITIAL_OUTREACH = 'initial',
  AWAITING_RESPONSE = 'awaiting',
  INTERESTED = 'interested',
  QUALIFIED_LEAD = 'qualified',
  NOT_INTERESTED = 'rejected',
  ESCALATED = 'escalated'
}

class ConversationManager {
  async handleIncomingMessage(
    creatorId: string, 
    message: string
  ): Promise<ConversationAction> {
    
    const conversation = await this.getConversation(creatorId)
    const intent = await this.aiHandler.classifyIntent(message)
    
    switch (intent) {
      case Intent.INTERESTED:
        return await this.handleInterest(conversation)
      case Intent.NEEDS_INFO:
        return await this.provideInformation(conversation, message)
      case Intent.NOT_INTERESTED:
        return await this.handleRejection(conversation)
    }
  }
}
```

## 🗄️ Database Schema

```prisma
// prisma/schema.prisma
model Creator {
  id               String   @id @default(cuid())
  username         String
  platform         Platform
  followerCount    Int
  engagementRate   Float
  growthRate       Float?
  lastOutreach     DateTime?
  status           CreatorStatus @default(DISCOVERED)
  
  conversations    Conversation[]
  campaigns        CampaignTarget[]
  
  @@unique([username, platform])
}

model Conversation {
  id            String   @id @default(cuid())
  creatorId     String
  creator       Creator  @relation(fields: [creatorId], references: [id])
  
  messages      Message[]
  state         ConversationState @default(INITIAL_OUTREACH)
  qualificationScore Int?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Message {
  id              String   @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  
  content         String
  isFromAI        Boolean  @default(false)
  intent          Intent?
  
  createdAt       DateTime @default(now())
}

enum Platform {
  INSTAGRAM
  TIKTOK
}

enum CreatorStatus {
  DISCOVERED
  CONTACTED
  RESPONDED
  INTERESTED
  QUALIFIED
  REJECTED
}
```

## 🔄 Background Worker System

### Queue Management

```typescript
// src/workers/outreach-worker.ts
import { Worker, Job } from 'bullmq'

const outreachWorker = new Worker('outreach', async (job: Job) => {
  const { creatorId, templateId, accountId } = job.data
  
  try {
    // Rate limiting check
    const canSend = await rateLimiter.canPerformAction(accountId)
    if (!canSend) {
      throw new Error('Rate limit exceeded')
    }
    
    // Execute outreach
    const result = await instagramService.sendDirectMessage(
      creatorId, 
      templateId
    )
    
    // Update database
    await updateCreatorStatus(creatorId, 'CONTACTED')
    
    return result
  } catch (error) {
    // Handle errors and retry logic
    if (error.message.includes('rate limit')) {
      throw new Error('Rate limited - retry later')
    }
    throw error
  }
}, {
  connection: redis,
  concurrency: 1, // Process one at a time for safety
})
```

## 📧 Email Notification System

```typescript
// src/services/notification.ts
class NotificationService {
  private emailClient: Nodemailer.Transporter
  
  async sendQualifiedLeadAlert(creator: Creator, conversation: Conversation) {
    const subject = `New Qualified Creator Lead: @${creator.username}`
    
    const html = `
      <h2>New Creator Interest!</h2>
      <p><strong>Creator:</strong> @${creator.username} (${creator.platform})</p>
      <p><strong>Followers:</strong> ${creator.followerCount.toLocaleString()}</p>
      <p><strong>Engagement Rate:</strong> ${(creator.engagementRate * 100).toFixed(1)}%</p>
      
      <h3>Conversation Summary:</h3>
      ${this.formatConversationHTML(conversation)}
      
      <p><a href="${this.getDashboardURL(creator.id)}">View in Dashboard</a></p>
    `
    
    await this.emailClient.sendMail({
      to: process.env.NOTIFICATION_EMAIL,
      subject,
      html
    })
  }
}
```

## 🚀 Deployment Strategy

### Vercel Configuration

```javascript
// vercel.json
{
  "functions": {
    "pages/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cron/discover-creators",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/process-conversations", 
      "schedule": "*/15 * * * *"
    }
  ]
}
```

### Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
ANTHROPIC_API_KEY="sk-ant-..."
MODASH_API_KEY="..."
EMAIL_SMTP_URL="smtp://..."
NOTIFICATION_EMAIL="alerts@yourcompany.com"
PROXY_SERVICE_URL="..."

# Security
ENCRYPTION_KEY="..."
JWT_SECRET="..."
```

This implementation guide provides the technical foundation for building a compliant, scalable creator outreach automation system using TypeScript, modern APIs, and best practices for social media automation.