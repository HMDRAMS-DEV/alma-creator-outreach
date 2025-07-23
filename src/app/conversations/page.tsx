'use client'

import { useState } from 'react'

export default function Conversations() {
  const [conversations] = useState([
    {
      id: 1,
      creatorUsername: 'productivitypro',
      platform: 'instagram',
      status: 'in_progress',
      lastMessage: "That sounds interesting! Can you tell me more about the partnership terms?",
      lastMessageTime: '2025-01-23T10:30:00Z',
      messageCount: 4,
      isFromCreator: true,
      intent: 'interested',
      qualificationScore: 85,
      tags: ['interested', 'partnership_discussion']
    },
    {
      id: 2,
      creatorUsername: 'sidehustlequeen',
      platform: 'instagram',
      status: 'awaiting_response',
      lastMessage: "Hi! I saw your content about side hustles and thought you'd be perfect for a collaboration with our productivity app. Would you be interested in learning more?",
      lastMessageTime: '2025-01-22T15:45:00Z',
      messageCount: 1,
      isFromCreator: false,
      intent: 'discovery',
      qualificationScore: 0,
      tags: ['initial_outreach']
    },
    {
      id: 3,
      creatorUsername: 'techstartuplife',
      platform: 'tiktok',
      status: 'qualified_lead',
      lastMessage: "Yes, I'm definitely interested! What are your typical rates for sponsored content?",
      lastMessageTime: '2025-01-21T09:15:00Z',
      messageCount: 6,
      isFromCreator: true,
      intent: 'pricing_inquiry',
      qualificationScore: 92,
      tags: ['qualified', 'pricing_discussion', 'escalate_to_human']
    },
    {
      id: 4,
      creatorUsername: 'workfromhomepro',
      platform: 'instagram',
      status: 'not_interested',
      lastMessage: "Thanks for reaching out, but I'm not taking on new partnerships right now.",
      lastMessageTime: '2025-01-20T14:20:00Z',
      messageCount: 3,
      isFromCreator: true,
      intent: 'rejection',
      qualificationScore: 0,
      tags: ['not_interested', 'polite_decline']
    },
    {
      id: 5,
      creatorUsername: 'entrepreneurmind',
      platform: 'tiktok',
      status: 'escalated',
      lastMessage: "I'd love to discuss this further. Can we set up a call to talk about the details?",
      lastMessageTime: '2025-01-23T16:00:00Z',
      messageCount: 8,
      isFromCreator: true,
      intent: 'interested',
      qualificationScore: 94,
      tags: ['escalated', 'qualified_lead', 'schedule_call']
    }
  ])

  const [filter, setFilter] = useState('all')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'awaiting_response': return 'bg-yellow-100 text-yellow-800'
      case 'qualified_lead': return 'bg-green-100 text-green-800'
      case 'not_interested': return 'bg-red-100 text-red-800'
      case 'escalated': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'interested': return '💚'
      case 'pricing_inquiry': return '💰'
      case 'rejection': return '❌'
      case 'discovery': return '🔍'
      default: return '💬'
    }
  }

  const getPlatformIcon = (platform: string) => {
    return platform === 'instagram' ? '📷' : '📱'
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const filteredConversations = conversations.filter(conv => {
    if (filter === 'all') return true
    return conv.status === filter
  })

  const statusCounts = {
    all: conversations.length,
    in_progress: conversations.filter(c => c.status === 'in_progress').length,
    awaiting_response: conversations.filter(c => c.status === 'awaiting_response').length,
    qualified_lead: conversations.filter(c => c.status === 'qualified_lead').length,
    escalated: conversations.filter(c => c.status === 'escalated').length,
    not_interested: conversations.filter(c => c.status === 'not_interested').length,
  }

  const handleSendTestMessage = (conversationId: number) => {
    alert(`Test message functionality for conversation ${conversationId}`)
  }

  const handleEscalateToHuman = (conversationId: number) => {
    alert(`Escalating conversation ${conversationId} to human review`)
  }

  const handleMarkAsQualified = (conversationId: number) => {
    alert(`Marking conversation ${conversationId} as qualified lead`)
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Conversations
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Monitor and manage AI-handled conversations with creators
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Conversations', value: statusCounts.in_progress + statusCounts.awaiting_response, color: 'blue' },
          { label: 'Qualified Leads', value: statusCounts.qualified_lead + statusCounts.escalated, color: 'green' },
          { label: 'Response Rate', value: '67%', color: 'purple' },
          { label: 'Avg Score', value: Math.round(conversations.reduce((sum, c) => sum + c.qualificationScore, 0) / conversations.filter(c => c.qualificationScore > 0).length) + '%', color: 'orange' }
        ].map((stat, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full bg-${stat.color}-100 flex items-center justify-center`}>
                    <div className={`w-3 h-3 rounded-full bg-${stat.color}-500`}></div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.label}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Filter Conversations</h2>
        </div>
        <div className="p-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="all">All Conversations ({statusCounts.all})</option>
            <option value="in_progress">In Progress ({statusCounts.in_progress})</option>
            <option value="awaiting_response">Awaiting Response ({statusCounts.awaiting_response})</option>
            <option value="qualified_lead">Qualified Leads ({statusCounts.qualified_lead})</option>
            <option value="escalated">Escalated ({statusCounts.escalated})</option>
            <option value="not_interested">Not Interested ({statusCounts.not_interested})</option>
          </select>
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Conversations ({filteredConversations.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredConversations.map((conversation) => (
            <div key={conversation.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl">
                      {getPlatformIcon(conversation.platform)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        @{conversation.creatorUsername}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                        {conversation.status.replace('_', ' ')}
                      </span>
                      <span className="text-lg">
                        {getIntentIcon(conversation.intent)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">
                        {conversation.messageCount} messages
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatTime(conversation.lastMessageTime)}
                      </span>
                      {conversation.qualificationScore > 0 && (
                        <span className="text-sm font-medium text-indigo-600">
                          {conversation.qualificationScore}% score
                        </span>
                      )}
                    </div>
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        <span className={`font-medium ${conversation.isFromCreator ? 'text-green-600' : 'text-blue-600'}`}>
                          {conversation.isFromCreator ? 'Creator' : 'AI'}:
                        </span>
                        {' '}{conversation.lastMessage}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {conversation.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex space-x-3">
                <button 
                  onClick={() => handleSendTestMessage(conversation.id)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  💬 View Full Thread
                </button>
                
                {conversation.status === 'in_progress' && (
                  <button 
                    onClick={() => handleSendTestMessage(conversation.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    🤖 Send AI Response
                  </button>
                )}
                
                {conversation.qualificationScore >= 70 && conversation.status !== 'escalated' && (
                  <button 
                    onClick={() => handleEscalateToHuman(conversation.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-orange-300 shadow-sm text-xs font-medium rounded text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    👤 Escalate to Human
                  </button>
                )}
                
                {conversation.intent === 'interested' && conversation.status !== 'qualified_lead' && (
                  <button 
                    onClick={() => handleMarkAsQualified(conversation.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-green-300 shadow-sm text-xs font-medium rounded text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    ⭐ Mark as Qualified
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredConversations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations found</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? 'No conversations have been started yet. Begin outreach to start conversations.'
              : `No conversations match the current filter: ${filter.replace('_', ' ')}`
            }
          </p>
        </div>
      )}

      {/* AI Assistant Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">AI Assistant Status</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-sm font-medium text-gray-900">Claude AI Active</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Processing conversations automatically • Last active: 2 minutes ago
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">Response Time</div>
              <div className="text-xs text-gray-500">~30 seconds average</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">24</div>
              <div className="text-xs text-gray-500">Messages handled today</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">8</div>
              <div className="text-xs text-gray-500">Leads identified</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="text-xs text-gray-500">Human escalations</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}