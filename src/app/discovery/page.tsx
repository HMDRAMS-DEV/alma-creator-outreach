'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Creator } from '@/types/creator'

export default function Discovery() {
  const [hashtags, setHashtags] = useState('nutrition')
  const [platform, setPlatform] = useState<'instagram' | 'tiktok'>('instagram')
  const [maxCreators, setMaxCreators] = useState(20)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [savedCreators, setSavedCreators] = useState<Set<string>>(new Set())

  const handleSaveCreator = async (creator: Creator) => {
    try {
      await fetch('/api/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creator),
      });
      setSavedCreators(prev => new Set(prev).add(creator.username));
    } catch (error) {
      console.error('Failed to save creator:', error);
      // Optionally, show an error toast to the user
    }
  };

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
      const body = { 
        hashtags: hashtagList,
        maxResults: maxCreators,
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'The request failed.')
      }

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Discovery failed:', error)
      setResults({ error: 'Discovery failed', message: error instanceof Error ? error.message : String(error) })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="border-b pb-5">
        <h1 className="text-3xl font-bold">Creator Discovery</h1>
        <p className="text-muted-foreground mt-2">
          Find and analyze rising creators on Instagram and TikTok.
        </p>
      </div>

      {/* Discovery Form */}
      <Card>
        <CardHeader>
          <CardTitle>Run Discovery</CardTitle>
          <CardDescription>Configure your creator discovery settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="space-y-2">
              <Label htmlFor="max-creators">Max Creators</Label>
              <Input
                id="max-creators"
                type="number"
                value={maxCreators}
                onChange={(e) => setMaxCreators(Number(e.target.value))}
                placeholder="e.g., 50"
                min="1"
                max="200"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hashtags">Hashtags (comma-separated)</Label>
            <Input
              id="hashtags"
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="nutrition, fitness, lifestyle"
            />
          </div>
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
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Discovery Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.error ? (
              <div className="text-red-600">
                <h3 className="font-medium">Error: {results.error}</h3>
                <p className="text-sm mt-1">{results.message}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Stats Cards */}
                </div>
                <div className="space-y-3">
                  {results.data?.creators?.map((creator: Creator) => (
                    <div key={creator.username} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <a
                          href={`https://www.${creator.platform}.com/${creator.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline"
                        >
                          @{creator.username}
                        </a>
                        <p className="text-sm text-muted-foreground">
                          Score: {creator.score ? `${Math.round(creator.score.overall * 100)}%` : 'N/A'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSaveCreator(creator)}
                        disabled={savedCreators.has(creator.username)}
                      >
                        {savedCreators.has(creator.username) ? 'Saved' : 'Save'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
