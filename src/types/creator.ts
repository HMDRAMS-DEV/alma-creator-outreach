export interface Creator {
  id?: string
  username: string
  platform: 'instagram' | 'tiktok'
  followerCount?: number
  estimatedFollowers: number
  engagementRate: number
  profileImageUrl?: string
  bio?: string
  isVerified?: boolean
  postCount?: number
  lastPostDate?: Date
  status: CreatorStatus
  contactAttempts: number
  lastContactDate?: Date
  createdAt: Date
  updatedAt: Date
  metrics?: CreatorMetrics
  score?: CreatorScore
  _tempData?: any
}

export interface CreatorMetrics {
  avgLikes: number
  avgComments: number
  avgViews?: number
  postFrequency: number // posts per week
  contentQuality: number // 0-1 score
  growthRate?: number // monthly growth rate
  engagement30Day: number
}

export interface CreatorScore {
  overall: number // 0-1
  growthPotential: number
  engagementQuality: number
  contentConsistency: number
  audienceQuality: number
  nicheRelevance: number
}

export interface InstagramPost {
  id: string
  username: string
  caption: string
  likes: number
  comments: number
  timestamp: Date
  mediaType: 'photo' | 'video' | 'carousel'
  hashtags: string[]
  mentions: string[]
  location?: string
}

export interface TikTokVideo {
  id: string
  username: string
  description: string
  likes: number
  comments: number
  shares: number
  plays: number
  timestamp: Date
  duration: number
  hashtags: string[]
  sounds?: string[]
}

export enum CreatorStatus {
  DISCOVERED = 'discovered',
  ANALYZING = 'analyzing',
  QUALIFIED = 'qualified',
  CONTACTED = 'contacted',
  RESPONDED = 'responded',
  INTERESTED = 'interested',
  NEGOTIATING = 'negotiating',
  PARTNERED = 'partnered',
  REJECTED = 'rejected',
  BLACKLISTED = 'blacklisted'
}

export interface DiscoveryCriteria {
  platforms: ('instagram' | 'tiktok')[]
  hashtags: string[]
  followerRange: [number, number]
  minEngagementRate: number
  maxContactAttempts: number
  excludeVerified?: boolean
  contentCategories?: string[]
  locationFilter?: string[]
  languages?: string[]
}

export interface ScrapingResult {
  creators: Creator[]
  posts: (InstagramPost | TikTokVideo)[]
  errors: string[]
  stats: {
    totalScraped: number
    qualified: number
    duplicates: number
    timeElapsed: number
  }
}