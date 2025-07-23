export interface Message {
  id: string
  conversationId: string
  content: string
  isFromAI: boolean
  isFromCreator: boolean
  intent?: MessageIntent
  sentiment?: 'positive' | 'negative' | 'neutral'
  timestamp: Date
  metadata?: {
    platform: 'instagram' | 'tiktok'
    messageType: 'dm' | 'comment' | 'mention'
    originalMessageId?: string
  }
}

export interface Conversation {
  id: string
  creatorId: string
  creator?: Creator
  status: ConversationStatus
  messages: Message[]
  qualificationScore?: number
  intent: ConversationIntent
  nextAction?: string
  scheduledFollowUp?: Date
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export enum ConversationStatus {
  INITIAL_OUTREACH = 'initial_outreach',
  AWAITING_RESPONSE = 'awaiting_response',
  IN_PROGRESS = 'in_progress',
  QUALIFIED_LEAD = 'qualified_lead',
  NOT_INTERESTED = 'not_interested',
  ESCALATED = 'escalated',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export enum ConversationIntent {
  DISCOVERY = 'discovery',
  QUALIFICATION = 'qualification',
  INTERESTED = 'interested',
  NEEDS_INFO = 'needs_info',
  PRICING_INQUIRY = 'pricing_inquiry',
  REJECTION = 'rejection',
  SPAM = 'spam',
  UNKNOWN = 'unknown'
}

export enum MessageIntent {
  GREETING = 'greeting',
  QUESTION = 'question',
  INTEREST = 'interest',
  REJECTION = 'rejection',
  REQUEST_INFO = 'request_info',
  PRICING = 'pricing',
  AVAILABILITY = 'availability',
  AGREEMENT = 'agreement',
  COMPLAINT = 'complaint',
  SPAM = 'spam',
  OTHER = 'other'
}

export interface AIResponse {
  content: string
  intent: ConversationIntent
  confidence: number
  shouldEscalate: boolean
  suggestedActions: string[]
  followUpScheduled?: Date
  tags: string[]
}

export interface ConversationTemplate {
  id: string
  name: string
  platform: 'instagram' | 'tiktok' | 'both'
  type: 'initial_outreach' | 'follow_up' | 'response'
  subject?: string
  content: string
  variables: string[] // Available placeholders like {{username}}, {{follower_count}}
  conditions?: {
    minFollowers?: number
    maxFollowers?: number
    engagementRate?: number
    contentCategories?: string[]
  }
  isActive: boolean
  successRate?: number
  createdAt: Date
  updatedAt: Date
}

import { Creator } from './creator'