'use client'

import { useState, useEffect } from 'react'

interface DashboardStats {
  totalCreators: number
  creatorsDiscoveredToday: number
  messagesSesentToday: number
  responseRate: number
  activeConversations: number
  qualifiedLeads: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCreators: 0,
    creatorsDiscoveredToday: 0,
    messagesSesentToday: 0,
    responseRate: 0,
    activeConversations: 0,
    qualifiedLeads: 0
  })

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading stats
    setTimeout(() => {
      setStats({
        totalCreators: 247,
        creatorsDiscoveredToday: 18,
        messagesSesentToday: 12,
        responseRate: 8.5,
        activeConversations: 5,
        qualifiedLeads: 3
      })
      setIsLoading(false)
    }, 1000)
  }, [])

  const statCards = [
    {
      title: 'Total Creators',
      value: stats.totalCreators,
      subtitle: '+18 today',
      color: 'blue'
    },
    {
      title: 'Messages Sent Today',
      value: stats.messagesSesentToday,
      subtitle: 'Within daily limits',
      color: 'green'
    },
    {
      title: 'Response Rate',
      value: `${stats.responseRate}%`,
      subtitle: 'Last 30 days',
      color: 'purple'
    },
    {
      title: 'Active Conversations',
      value: stats.activeConversations,
      subtitle: '3 need attention',
      color: 'orange'
    },
    {
      title: 'Qualified Leads',
      value: stats.qualifiedLeads,
      subtitle: 'Ready for human review',
      color: 'pink'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Creator Outreach Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Monitor your automated creator discovery and outreach campaigns
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full bg-${card.color}-100 flex items-center justify-center`}>
                    <div className={`w-3 h-3 rounded-full bg-${card.color}-500`}></div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.title}
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {isLoading ? '...' : card.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-500">{card.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <span>🔍</span>
              <span className="ml-2">Run Creator Discovery</span>
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <span>📨</span>
              <span className="ml-2">Send Outreach Batch</span>
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <span>💬</span>
              <span className="ml-2">Check Conversations</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {[
                {
                  icon: '🎯',
                  text: 'Discovered 5 new creators from #productivity hashtag',
                  time: '2 hours ago',
                  type: 'discovery'
                },
                {
                  icon: '📨',
                  text: 'Sent outreach message to @productivepro',
                  time: '3 hours ago',
                  type: 'outreach'
                },
                {
                  icon: '💬',
                  text: '@entrepreneurlife responded to initial message',
                  time: '4 hours ago',
                  type: 'response'
                },
                {
                  icon: '🤖',
                  text: 'AI handled 3 conversations automatically',
                  time: '5 hours ago',
                  type: 'ai'
                },
                {
                  icon: '⭐',
                  text: 'New qualified lead: @sidehustler99',
                  time: '6 hours ago',
                  type: 'lead'
                }
              ].map((activity, activityIdx) => (
                <li key={activityIdx}>
                  <div className="relative pb-8">
                    {activityIdx !== 4 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full flex items-center justify-center text-sm bg-gray-100">
                          {activity.icon}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">{activity.text}</p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time>{activity.time}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">System Status</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Instagram Scraper</p>
                <p className="text-xs text-gray-500">Running normally</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">TikTok Scraper</p>
                <p className="text-xs text-gray-500">Ready</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">AI Conversation Handler</p>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Daily Limits</p>
                <p className="text-xs text-gray-500">12/50 messages sent</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}