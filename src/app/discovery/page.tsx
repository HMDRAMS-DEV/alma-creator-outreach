'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="border-b pb-5">
        <h1 className="text-3xl font-bold">Creator Discovery</h1>
        <p className="text-muted-foreground mt-2">
          Find and analyze rising creators on Instagram and TikTok using shadcn/ui
        </p>
      </div>

      {/* Discovery Form */}
      <Card>
        <CardHeader>
          <CardTitle>Run Discovery</CardTitle>
          <CardDescription>Configure your creator discovery settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Platform Selection */}
          <div className="space-y-3">
            <Label>Platform</Label>
            <RadioGroup 
              value={platform} 
              onValueChange={(value) => setPlatform(value as 'instagram' | 'tiktok')}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="instagram" id="instagram" />
                <Label htmlFor="instagram">Instagram</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tiktok" id="tiktok" />
                <Label htmlFor="tiktok">TikTok</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label htmlFor="hashtags">Hashtags (comma-separated)</Label>
            <Input
              id="hashtags"
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="productivity, entrepreneur, sidehustle"
            />
            <p className="text-sm text-muted-foreground">
              Enter hashtags without the # symbol
            </p>
          </div>

          {/* Instagram Credentials */}
          {platform === 'instagram' && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <span className="text-sm text-yellow-800">
                    Instagram credentials required for scraping
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>
                <p className="text-xs text-yellow-700 mt-4">
                  Credentials are not stored and only used for this session
                </p>
              </CardContent>
            </Card>
          )}

          {/* Run Button */}
          <Button 
            onClick={runDiscovery} 
            disabled={isRunning}
            className="w-full"
            size="lg"
          >
            {isRunning ? 'Running Discovery...' : 'Start Discovery'}
          </Button>
        </CardContent>
      </Card>

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