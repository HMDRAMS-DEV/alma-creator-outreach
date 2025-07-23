'use client'

import { useState, useEffect } from 'react'

export default function Creators() {
  const [creators] = useState([
    {
      id: 1,
      username: 'productivitypro',
      platform: 'instagram',
      followers: 15432,
      engagementRate: 4.2,
      status: 'qualified',
      lastContact: '2025-01-20',
      score: 85,
      bio: 'Helping entrepreneurs stay organized and focused 📊 Productivity tips daily',
      tags: ['productivity', 'business', 'entrepreneur']
    },
    {
      id: 2,
      username: 'sidehustlequeen',
      platform: 'instagram', 
      followers: 8901,
      engagementRate: 6.1,
      status: 'contacted',
      lastContact: '2025-01-22',
      score: 92,
      bio: 'Building multiple income streams 💰 Side hustle mentor',
      tags: ['sidehustle', 'entrepreneur', 'finance']
    },
    {
      id: 3,
      username: 'techstartuplife',
      platform: 'tiktok',
      followers: 23456,
      engagementRate: 8.3,
      status: 'responded',
      lastContact: '2025-01-21',
      score: 88,
      bio: 'Startup founder sharing the journey 🚀 Tech tips & insights',
      tags: ['tech', 'startup', 'business']
    },
    {
      id: 4,
      username: 'workfromhomepro',
      platform: 'instagram',
      followers: 12750,
      engagementRate: 3.8,
      status: 'interested',
      lastContact: '2025-01-19',
      score: 79,
      bio: 'Remote work expert 🏠 Productivity & wellness tips',
      tags: ['remote', 'productivity', 'wellness']
    },
    {
      id: 5,
      username: 'entrepreneurmind',
      platform: 'tiktok',
      followers: 45120,
      engagementRate: 5.7,
      status: 'negotiating',
      lastContact: '2025-01-23',
      score: 94,
      bio: 'Business mindset coach 🧠 Helping you think like an entrepreneur',
      tags: ['entrepreneur', 'mindset', 'business']
    }
  ])

  const [filter, setFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'qualified': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'responded': return 'bg-green-100 text-green-800'
      case 'interested': return 'bg-purple-100 text-purple-800'
      case 'negotiating': return 'bg-orange-100 text-orange-800'
      case 'partnered': return 'bg-green-200 text-green-900'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlatformIcon = (platform: string) => {
    return platform === 'instagram' ? '📷' : '📱'
  }

  const filteredCreators = creators.filter(creator => {
    const statusMatch = filter === 'all' || creator.status === filter
    const platformMatch = platformFilter === 'all' || creator.platform === platformFilter
    return statusMatch && platformMatch
  })

  const statusCounts = {
    all: creators.length,
    qualified: creators.filter(c => c.status === 'qualified').length,
    contacted: creators.filter(c => c.status === 'contacted').length,
    responded: creators.filter(c => c.status === 'responded').length,
    interested: creators.filter(c => c.status === 'interested').length,
    negotiating: creators.filter(c => c.status === 'negotiating').length,
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Creator Database
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage and track all discovered creators and their outreach status
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Creators', value: creators.length, color: 'blue' },
          { label: 'Avg Score', value: Math.round(creators.reduce((sum, c) => sum + c.score, 0) / creators.length) + '%', color: 'purple' },
          { label: 'Active Conversations', value: creators.filter(c => ['responded', 'interested', 'negotiating'].includes(c.status)).length, color: 'green' },
          { label: 'This Week', value: 12, color: 'orange' }
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

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Filters</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="all">All ({statusCounts.all})</option>
                <option value="qualified">Qualified ({statusCounts.qualified})</option>
                <option value="contacted">Contacted ({statusCounts.contacted})</option>
                <option value="responded">Responded ({statusCounts.responded})</option>
                <option value="interested">Interested ({statusCounts.interested})</option>
                <option value="negotiating">Negotiating ({statusCounts.negotiating})</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Platform
              </label>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="all">All Platforms</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Creator List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Creators ({filteredCreators.length})
          </h2>
        </div>
        <div className="overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredCreators.map((creator) => (
              <div key={creator.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl">
                        {getPlatformIcon(creator.platform)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          @{creator.username}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(creator.status)}`}>
                          {creator.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {creator.platform} • {creator.followers.toLocaleString()} followers • {creator.engagementRate}% engagement
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        {creator.bio}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        {creator.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl font-bold text-indigo-600">
                        {creator.score}%
                      </div>
                      <div className="text-xs text-gray-500">
                        Score
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Last contact: {creator.lastContact}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    View Profile
                  </button>
                  <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Send Message
                  </button>
                  <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    View Conversation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {filteredCreators.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👤</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No creators found</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? 'No creators have been discovered yet. Run a discovery to find new creators.'
              : `No creators match the current filter: ${filter}`
            }
          </p>
        </div>
      )}
    </div>
  )
}