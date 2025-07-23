'use client'

import { useState } from 'react'

export default function Discovery() {
  const [hashtags, setHashtags] = useState('')
  const [platform, setPlatform] = useState<'instagram' | 'tiktok'>('instagram')
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)

  const runDiscovery = async () => {
    setIsRunning(true)
    setResults(null)

    try {
      const hashtagList = hashtags.split(',').map(h => h.trim()).filter(h => h.length > 0)
      
      if (hashtagList.length === 0) {
        alert('Please enter at least one hashtag')
        setIsRunning(false)
        return
      }

      const endpoint = platform === 'instagram' ? '/api/discovery/instagram' : '/api/discovery/tiktok'
      const body: any = { hashtags: hashtagList, maxPosts: 20 }
      
      if (platform === 'instagram') {
        if (!credentials.username || !credentials.password) {
          alert('Instagram credentials are required')
          setIsRunning(false)
          return
        }
        body.credentials = credentials
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Discovery failed:', error)
      setResults({ error: 'Discovery failed', message: error?.toString() })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Creator Discovery
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Find and analyze rising creators on Instagram and TikTok
        </p>
      </div>

      {/* Discovery Form */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Run Discovery</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Platform Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700">Platform</label>
            <div className="mt-2 flex space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="instagram"
                  checked={platform === 'instagram'}
                  onChange={(e) => setPlatform(e.target.value as 'instagram')}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-900" style={{color: '#1f2937'}}>Instagram</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="tiktok"
                  checked={platform === 'tiktok'}
                  onChange={(e) => setPlatform(e.target.value as 'tiktok')}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-900" style={{color: '#1f2937'}}>TikTok</span>
              </label>
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hashtags (comma-separated)
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="productivity, entrepreneur, sidehustle"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter hashtags without the # symbol
            </p>
          </div>

          {/* Instagram Credentials */}
          {platform === 'instagram' && (
            <div className="space-y-4 p-4 bg-yellow-50 rounded-md">
              <div className="flex items-center">
                <span className="text-yellow-600 mr-2">⚠️</span>
                <span className="text-sm text-yellow-800">
                  Instagram credentials required for scraping
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <p className="text-xs text-yellow-700">
                Credentials are not stored and only used for this session
              </p>
            </div>
          )}

          {/* Run Button */}
          <div>
            <button
              onClick={runDiscovery}
              disabled={isRunning}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isRunning ? 'Running Discovery...' : 'Start Discovery'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Discovery Results</h2>
          </div>
          <div className="p-6">
            {results.error ? (
              <div className="text-red-600">
                <h3 className="font-medium">Error: {results.error}</h3>
                <p className="text-sm mt-1">{results.message}</p>
                {results.note && (
                  <p className="text-sm mt-2 text-orange-600">{results.note}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {results.data?.creators?.length || 0}
                    </div>
                    <div className="text-sm text-blue-600">Qualified Creators</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {results.data?.stats?.totalScraped || 0}
                    </div>
                    <div className="text-sm text-green-600">Posts Analyzed</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {results.data?.scoring?.averageScore ? 
                        Math.round(results.data.scoring.averageScore * 100) + '%' : 'N/A'
                      }
                    </div>
                    <div className="text-sm text-purple-600">Avg Score</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {results.data?.stats?.timeElapsed ? 
                        Math.round(results.data.stats.timeElapsed / 1000) + 's' : 'N/A'
                      }
                    </div>
                    <div className="text-sm text-orange-600">Time Taken</div>
                  </div>
                </div>

                {/* Creator List */}
                {results.data?.creators && results.data.creators.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Discovered Creators
                    </h3>
                    <div className="space-y-3">
                      {results.data.creators.slice(0, 10).map((creator: any, idx: number) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                @{creator.username}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {creator.platform} • {creator.estimatedFollowers?.toLocaleString()} followers
                              </p>
                              {creator.bio && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {creator.bio.substring(0, 100)}...
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              {creator.score && (
                                <div className="text-lg font-bold text-indigo-600">
                                  {Math.round(creator.score.overall * 100)}%
                                </div>
                              )}
                              <div className="text-sm text-gray-500">
                                Overall Score
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.message && (
                  <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md">
                    {results.message}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}