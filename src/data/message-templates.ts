import type { ConversationTemplate } from '@/types/conversation'

export const DEFAULT_TEMPLATES: ConversationTemplate[] = [
  {
    id: 'instagram_initial_productivity',
    name: 'Instagram Initial - Productivity Focus',
    platform: 'instagram',
    type: 'initial_outreach',
    content: `Hey {{first_name}}! 👋 

Love your content around {{niche_topic}}! Your {{follower_count}} followers clearly appreciate the value you bring.

I work with a productivity app that's helping thousands of people get more organized and focused. Would you be interested in exploring a potential collaboration? We work with creators who genuinely align with helping people be more productive.

No pressure at all - just thought there might be a good fit here! 

Would love to hear your thoughts! 🚀`,
    variables: [
      '{{first_name}}',
      '{{username}}',
      '{{follower_count}}',
      '{{niche_topic}}',
      '{{engagement_rate}}'
    ],
    conditions: {
      minFollowers: 1000,
      maxFollowers: 50000,
      contentCategories: ['productivity', 'business', 'entrepreneur', 'tech']
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  {
    id: 'instagram_initial_entrepreneur',
    name: 'Instagram Initial - Entrepreneur Focus',
    platform: 'instagram',
    type: 'initial_outreach',
    content: `Hi {{first_name}}! 

Just discovered your profile and I'm impressed by your entrepreneurship content! Your audience of {{follower_count}} is exactly the type of motivated people our app serves.

We've built a productivity tool that's helping entrepreneurs and side-hustlers stay organized and focused on their goals. I think there could be a great partnership opportunity here.

Would you be open to chatting about potential collaboration? Always looking to work with authentic creators who are actually using tools like ours! 

Let me know what you think! 💪`,
    variables: [
      '{{first_name}}',
      '{{username}}',
      '{{follower_count}}',
      '{{bio}}'
    ],
    conditions: {
      minFollowers: 1000,
      maxFollowers: 100000,
      contentCategories: ['entrepreneur', 'business', 'sidehustle', 'startup']
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    id: 'tiktok_initial_general',
    name: 'TikTok Initial - General Outreach',
    platform: 'tiktok',
    type: 'initial_outreach',
    content: `Hey {{first_name}}! 

Loved your recent content - especially your take on productivity and staying organized! 

I work with an app that helps people manage their tasks and goals more effectively. Your audience seems like they'd really benefit from this kind of tool.

Interested in exploring a potential partnership? We love working with creators who are genuinely passionate about helping people be more productive.

Let me know if you'd like to learn more! ⚡`,
    variables: [
      '{{first_name}}',
      '{{username}}',
      '{{follower_count}}'
    ],
    conditions: {
      minFollowers: 1000,
      maxFollowers: 75000
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    id: 'follow_up_interested',
    name: 'Follow-up - Showed Interest',
    platform: 'both',
    type: 'follow_up',
    content: `Hi {{first_name}}!

Thanks for your interest in working together! I'd love to learn a bit more about your content and audience to see how we might collaborate.

A few quick questions:
• What's your typical engagement rate?
• Do you currently work with other brands?
• What type of partnership interests you most?

Our app helps people organize their tasks, set goals, and stay focused. We typically offer both commission-based partnerships and flat-rate collaborations depending on the creator's preference.

Looking forward to hearing more about your work! 🌟`,
    variables: [
      '{{first_name}}',
      '{{username}}'
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    id: 'response_pricing_question',
    name: 'Response - Pricing Inquiry',
    platform: 'both',
    type: 'response',
    content: `Great question, {{first_name}}!

Our partnership rates vary based on several factors like audience size, engagement, and content type. We work with both commission-based partnerships (typically 15-25%) and flat-rate collaborations ($X-$Y range).

I'd love to connect you directly with our partnerships team who can give you specific details based on your profile and preferences. They'll be able to discuss exact rates and terms.

Should I have them reach out to you directly? They're much better with the specifics than I am! 😊`,
    variables: [
      '{{first_name}}',
      '{{username}}'
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    id: 'response_not_interested',
    name: 'Response - Polite Decline',
    platform: 'both',
    type: 'response',
    content: `No worries at all, {{first_name}}! 

Thanks for taking the time to respond. I totally understand - you probably get tons of partnership requests!

Keep up the awesome content! Your audience is lucky to have someone who's so thoughtful about what they promote. 

All the best! 🙌`,
    variables: [
      '{{first_name}}',
      '{{username}}'
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    id: 'response_questions',
    name: 'Response - Answering Questions',
    platform: 'both',
    type: 'response',
    content: `Happy to answer those questions, {{first_name}}!

Our app is all about helping people organize their daily tasks and achieve their goals more efficiently. Think of it as a combination of task management, goal tracking, and productivity coaching all in one.

We're particularly focused on entrepreneurs and busy professionals who need to juggle multiple projects and priorities.

As for partnership details, we're pretty flexible! We work with creators on sponsored posts, stories, longer-form reviews, or even ongoing partnerships depending on what feels most authentic to your audience.

What type of collaboration feels like the best fit for your content style? 🤔`,
    variables: [
      '{{first_name}}',
      '{{username}}'
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// Template selection logic
export class TemplateSelector {
  static selectInitialTemplate(creator: any, platform: 'instagram' | 'tiktok'): ConversationTemplate {
    const platformTemplates = DEFAULT_TEMPLATES.filter(
      t => t.type === 'initial_outreach' && (t.platform === platform || t.platform === 'both')
    )

    // Simple content-based selection
    const bio = (creator.bio || '').toLowerCase()
    const hasEntrepreneurKeywords = ['entrepreneur', 'business', 'startup', 'ceo', 'founder'].some(
      keyword => bio.includes(keyword)
    )

    if (hasEntrepreneurKeywords && platform === 'instagram') {
      return platformTemplates.find(t => t.id === 'instagram_initial_entrepreneur') || platformTemplates[0]
    }

    // Default to productivity focus
    const productivityTemplate = platformTemplates.find(t => t.id.includes('productivity'))
    return productivityTemplate || platformTemplates[0]
  }

  static selectResponseTemplate(messageIntent: string, platform: 'instagram' | 'tiktok'): ConversationTemplate {
    const responseTemplates = DEFAULT_TEMPLATES.filter(t => t.type === 'response')

    switch (messageIntent.toLowerCase()) {
      case 'pricing':
        return responseTemplates.find(t => t.id === 'response_pricing_question') || responseTemplates[0]
      case 'rejection':
      case 'not_interested':
        return responseTemplates.find(t => t.id === 'response_not_interested') || responseTemplates[0]
      case 'question':
      case 'request_info':
        return responseTemplates.find(t => t.id === 'response_questions') || responseTemplates[0]
      default:
        return responseTemplates[0]
    }
  }

  static selectFollowUpTemplate(conversationHistory: any[]): ConversationTemplate {
    const followUpTemplates = DEFAULT_TEMPLATES.filter(t => t.type === 'follow_up')
    
    // For now, use the general interested follow-up
    // Could add more sophisticated logic based on conversation analysis
    return followUpTemplates.find(t => t.id === 'follow_up_interested') || followUpTemplates[0]
  }
}