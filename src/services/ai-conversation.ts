import Anthropic from '@anthropic-ai/sdk'
import type { 
  Conversation, 
  Message, 
  AIResponse, 
  ConversationStatus
} from '@/types/conversation'
import { ConversationIntent, MessageIntent } from '@/types/conversation'
import type { Creator } from '@/types/creator'

interface AIConversationOptions {
  apiKey: string
  model?: string
  maxTokens?: number
}

export class AIConversationHandler {
  private anthropic: Anthropic
  private model: string
  private maxTokens: number

  constructor(options: AIConversationOptions) {
    this.anthropic = new Anthropic({
      apiKey: options.apiKey
    })
    this.model = options.model || 'claude-3-5-sonnet-20241022'
    this.maxTokens = options.maxTokens || 300
  }

  async handleIncomingMessage(
    conversation: Conversation,
    newMessage: Message
  ): Promise<AIResponse> {
    console.log(`🤖 Processing message from @${conversation.creator?.username}: "${newMessage.content.substring(0, 50)}..."`)

    try {
      // First, classify the intent of the new message
      const intent = await this.classifyMessageIntent(newMessage.content, conversation)
      
      // Update message with detected intent
      newMessage.intent = intent
      
      // Determine conversation intent and whether to escalate
      const conversationIntent = this.determineConversationIntent(intent, conversation)
      const shouldEscalate = this.shouldEscalateConversation(intent, conversation)
      
      if (shouldEscalate) {
        return {
          content: this.getEscalationMessage(conversation),
          intent: conversationIntent,
          confidence: 1.0,
          shouldEscalate: true,
          suggestedActions: ['escalate_to_human', 'send_email_notification'],
          tags: ['escalation', 'human_review_needed']
        }
      }

      // Generate appropriate AI response
      const response = await this.generateResponse(conversation, newMessage)
      
      return {
        ...response,
        intent: conversationIntent,
        shouldEscalate: false
      }

    } catch (error) {
      console.error('❌ Error processing message:', error)
      
      return {
        content: "Thanks for your message! I'll make sure our team sees it and gets back to you soon.",
        intent: ConversationIntent.UNKNOWN,
        confidence: 0.5,
        shouldEscalate: true,
        suggestedActions: ['escalate_to_human'],
        tags: ['error', 'escalation']
      }
    }
  }

  private async classifyMessageIntent(message: string, conversation: Conversation): Promise<MessageIntent> {
    const systemPrompt = `You are an expert at classifying the intent of messages from social media creators who have been contacted about potential brand partnerships.

Classify the message into one of these categories:
- GREETING: Simple hello, acknowledgment, or introduction
- INTEREST: Shows interest in collaboration, wants to learn more
- REJECTION: Not interested, politely declining, or negative response
- REQUEST_INFO: Asking for more details about the partnership
- PRICING: Asking about rates, compensation, or payment
- AVAILABILITY: Discussing timeline, scheduling, or availability
- AGREEMENT: Agreeing to terms or showing commitment
- QUESTION: General questions about the brand or product
- COMPLAINT: Issues, concerns, or complaints
- SPAM: Irrelevant or spam content
- OTHER: Doesn't fit other categories

Respond with just the category name.`

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 50,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Classify this message: "${message}"`
        }]
      })

      const classification = response.content[0].type === 'text' 
        ? response.content[0].text.trim().toUpperCase()
        : 'OTHER'

      // Validate classification
      const validIntents = [
        'GREETING', 'INTEREST', 'REJECTION', 'REQUEST_INFO', 
        'PRICING', 'AVAILABILITY', 'AGREEMENT', 'QUESTION', 
        'COMPLAINT', 'SPAM', 'OTHER'
      ]

      return validIntents.includes(classification) 
        ? classification as MessageIntent 
        : MessageIntent.OTHER

    } catch (error) {
      console.error('Error classifying intent:', error)
      return MessageIntent.OTHER
    }
  }

  private async generateResponse(conversation: Conversation, newMessage: Message): Promise<Omit<AIResponse, 'intent' | 'shouldEscalate'>> {
    const creator = conversation.creator!
    
    const systemPrompt = `You are a friendly brand representative reaching out to social media creators for potential partnerships. 

Your goals:
1. Build rapport and trust with creators
2. Answer their questions about partnership opportunities
3. Qualify serious candidates for collaboration
4. Keep responses brief, personal, and professional

Context about our outreach:
- We partner with content creators to promote our productivity app
- We offer both commission-based partnerships and flat-rate collaborations
- We're looking for authentic creators who align with our brand values
- Our app helps people be more productive and organized

Guidelines:
- Keep responses under 2-3 sentences maximum
- Be warm and conversational, not corporate
- If they show interest, gather basic info (audience size, content type, rates)
- If they ask specific questions you can't answer, suggest escalating to our partnerships team
- Always include their username in responses when natural
- Don't make specific promises about payment or terms

Creator info:
- Username: @${creator.username}
- Platform: ${creator.platform}
- Estimated followers: ${creator.estimatedFollowers?.toLocaleString() || 'N/A'}
- Bio: ${creator.bio || 'N/A'}

Conversation history:
${this.formatConversationHistory(conversation)}`

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `The creator just sent: "${newMessage.content}"\n\nGenerate an appropriate response.`
        }]
      })

      const content = response.content[0].type === 'text' 
        ? response.content[0].text.trim()
        : "Thanks for your message! Let me connect you with our team for more details."

      return {
        content,
        confidence: 0.85,
        suggestedActions: this.getSuggestedActions(newMessage.intent!),
        tags: this.generateTags(newMessage.intent!, content)
      }

    } catch (error) {
      console.error('Error generating response:', error)
      
      return {
        content: "Thanks for reaching out! I'd love to learn more about potential collaboration opportunities with you.",
        confidence: 0.5,
        suggestedActions: ['follow_up'],
        tags: ['error_fallback']
      }
    }
  }

  private formatConversationHistory(conversation: Conversation): string {
    const messages = conversation.messages.slice(-5) // Last 5 messages
    
    return messages.map(msg => {
      const sender = msg.isFromAI ? 'Brand' : 'Creator'
      return `${sender}: ${msg.content}`
    }).join('\n')
  }

  private determineConversationIntent(messageIntent: MessageIntent, conversation: Conversation): ConversationIntent {
    // Map message intent to conversation intent
    switch (messageIntent) {
      case MessageIntent.INTEREST:
      case MessageIntent.REQUEST_INFO:
      case MessageIntent.PRICING:
        return ConversationIntent.INTERESTED
      case MessageIntent.REJECTION:
        return ConversationIntent.REJECTION
      case MessageIntent.AGREEMENT:
        return ConversationIntent.INTERESTED
      case MessageIntent.GREETING:
      case MessageIntent.QUESTION:
        return ConversationIntent.QUALIFICATION
      case MessageIntent.SPAM:
        return ConversationIntent.SPAM
      default:
        return ConversationIntent.UNKNOWN
    }
  }

  private shouldEscalateConversation(messageIntent: MessageIntent, conversation: Conversation): boolean {
    // Escalation triggers
    const escalationIntents = [MessageIntent.PRICING, MessageIntent.AGREEMENT, MessageIntent.COMPLAINT]
    
    if (escalationIntents.includes(messageIntent)) {
      return true
    }

    // Escalate if they've shown strong interest
    if (messageIntent === MessageIntent.INTEREST) {
      const interestMessages = conversation.messages.filter(
        msg => msg.intent === MessageIntent.INTEREST || msg.intent === MessageIntent.REQUEST_INFO
      )
      if (interestMessages.length >= 2) {
        return true
      }
    }

    // Escalate if conversation is getting long
    if (conversation.messages.length >= 6) {
      return true
    }

    return false
  }

  private getSuggestedActions(intent: MessageIntent): string[] {
    const actionMap: Record<MessageIntent, string[]> = {
      [MessageIntent.GREETING]: ['send_welcome_info', 'ask_about_content'],
      [MessageIntent.INTEREST]: ['gather_creator_info', 'send_partnership_details'],
      [MessageIntent.REJECTION]: ['mark_not_interested', 'archive_conversation'],
      [MessageIntent.REQUEST_INFO]: ['send_detailed_info', 'schedule_call'],
      [MessageIntent.PRICING]: ['escalate_to_human', 'send_rate_card'],
      [MessageIntent.AVAILABILITY]: ['check_calendar', 'schedule_call'],
      [MessageIntent.AGREEMENT]: ['escalate_to_human', 'send_contract'],
      [MessageIntent.QUESTION]: ['answer_question', 'send_faq'],
      [MessageIntent.COMPLAINT]: ['escalate_to_human', 'apologize'],
      [MessageIntent.SPAM]: ['block_user', 'archive_conversation'],
      [MessageIntent.OTHER]: ['follow_up', 'ask_clarification']
    }

    return actionMap[intent] || ['follow_up']
  }

  private generateTags(intent: MessageIntent, response: string): string[] {
    const tags = [intent.toLowerCase()]
    
    // Add contextual tags based on response content
    if (response.includes('team') || response.includes('connect')) {
      tags.push('escalation_mentioned')
    }
    
    if (response.includes('partnership') || response.includes('collaboration')) {
      tags.push('partnership_discussion')
    }
    
    if (response.includes('rates') || response.includes('payment')) {
      tags.push('pricing_discussion')
    }

    return tags
  }

  private getEscalationMessage(conversation: Conversation): string {
    const creator = conversation.creator!
    
    const escalationMessages = [
      `Hi ${creator.username}! You seem really interested in working together. Let me connect you with our partnerships team who can discuss the details and next steps with you directly.`,
      `Thanks for your interest, ${creator.username}! I'd love to have our partnerships team give you all the specifics about collaboration opportunities. They'll be in touch soon!`,
      `Great questions, ${creator.username}! Our partnerships team will be able to give you much better details about rates and opportunities. I'll make sure they reach out to you directly.`
    ]

    return escalationMessages[Math.floor(Math.random() * escalationMessages.length)]
  }

  // Batch process multiple conversations
  async processConversations(conversations: Conversation[]): Promise<Map<string, AIResponse>> {
    console.log(`🤖 Processing ${conversations.length} conversations`)
    
    const responses = new Map<string, AIResponse>()
    
    for (const conversation of conversations) {
      try {
        // Get the last message that needs a response
        const lastMessage = conversation.messages
          .filter(msg => !msg.isFromAI && msg.isFromCreator)
          .pop()

        if (!lastMessage) continue

        console.log(`Processing conversation with @${conversation.creator?.username}`)
        
        const aiResponse = await this.handleIncomingMessage(conversation, lastMessage)
        responses.set(conversation.id, aiResponse)
        
        // Small delay between processing to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.error(`Error processing conversation ${conversation.id}:`, error)
      }
    }

    console.log(`✅ Processed ${responses.size} conversations`)
    return responses
  }

  // Get conversation summary for human review
  async generateConversationSummary(conversation: Conversation): Promise<string> {
    const systemPrompt = `Summarize this conversation between a brand representative and a social media creator in 2-3 sentences. Focus on:
    - Creator's level of interest
    - Key questions or concerns raised
    - Current status and next steps needed`

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 150,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Conversation with @${conversation.creator?.username}:\n\n${this.formatConversationHistory(conversation)}`
        }]
      })

      return response.content[0].type === 'text' 
        ? response.content[0].text.trim()
        : 'Unable to generate summary'

    } catch (error) {
      console.error('Error generating summary:', error)
      return 'Error generating conversation summary'
    }
  }
}