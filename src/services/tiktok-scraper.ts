import { spawn } from 'child_process'
import * as path from 'path'
import type { Creator, TikTokVideo, DiscoveryCriteria, ScrapingResult } from '@/types/creator'

interface TikTokScraperOptions {
  headless?: boolean
  maxPostsPerHashtag?: number
  timeout?: number // milliseconds
}

export class TikTokScraper {
  private options: TikTokScraperOptions

  constructor(options: TikTokScraperOptions = {}) {
    this.options = {
      headless: true,
      maxPostsPerHashtag: 8,
      timeout: 300000, // 5 minutes
      ...options
    }
  }

  async discoverCreators(criteria: DiscoveryCriteria): Promise<ScrapingResult> {
    console.log('🚀 Starting TikTok creator discovery...')
    
    if (!criteria.hashtags.length) {
      throw new Error('No hashtags provided for TikTok discovery')
    }

    return new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), 'src/scripts/tiktok_scraper.py')
      
      // Build command arguments
      const args = [
        scriptPath,
        '--hashtags',
        ...criteria.hashtags,
        '--max-posts',
        this.options.maxPostsPerHashtag!.toString()
      ]

      if (this.options.headless) {
        args.push('--headless')
      }

      console.log(`🐍 Running Python scraper: python ${args.join(' ')}`)

      // Use Python from virtual environment
      const venvPath = path.join(process.cwd(), 'venv/bin/python')
      const pythonPath = venvPath
      
      console.log(`🐍 Using Python: ${pythonPath}`)
      
      // Spawn Python process
      const pythonProcess = spawn(pythonPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let stdout = ''
      let stderr = ''

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString()
        stdout += output
        
        // Log Python output in real-time
        const lines = output.split('\n').filter((line: string) => line.trim())
        lines.forEach((line: string) => {
          if (line.includes('INFO') || line.includes('ERROR') || line.includes('WARNING')) {
            console.log(`🐍 ${line}`)
          }
        })
      })

      pythonProcess.stderr.on('data', (data) => {
        const output = data.toString()
        stderr += output
        console.log(`🐍 STDERR: ${output}`)
      })

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`❌ Python scraper failed with code ${code}`)
          console.error('STDERR:', stderr)
          reject(new Error(`TikTok scraper failed: ${stderr || 'Unknown error'}`))
          return
        }

        try {
          // Parse JSON output from Python script
          const jsonMatch = stdout.match(/\{[\s\S]*\}/)
          if (!jsonMatch) {
            throw new Error('No JSON output found from Python scraper')
          }

          const rawResult = JSON.parse(jsonMatch[0])
          
          // Convert Python result to TypeScript types
          const result = this.convertPythonResult(rawResult)
          
          console.log('✅ TikTok discovery completed successfully')
          console.log(`📊 Results: ${result.creators.length} creators, ${result.posts.length} posts`)
          
          resolve(result)

        } catch (error) {
          console.error('❌ Error parsing Python output:', error)
          console.log('Raw stdout:', stdout)
          reject(new Error(`Failed to parse TikTok scraper output: ${error}`))
        }
      })

      pythonProcess.on('error', (error) => {
        console.error('❌ Failed to start Python process:', error)
        reject(new Error(`Failed to start TikTok scraper: ${error.message}`))
      })

      // Set timeout
      setTimeout(() => {
        pythonProcess.kill()
        reject(new Error(`TikTok scraper timed out after ${this.options.timeout}ms`))
      }, this.options.timeout!)
    })
  }

  private convertPythonResult(pythonResult: any): ScrapingResult {
    // Convert Python creators to TypeScript Creator objects
    const creators: Creator[] = pythonResult.creators.map((pyCreator: any) => ({
      username: pyCreator.username,
      platform: 'tiktok' as const,
      estimatedFollowers: pyCreator.estimatedFollowers || 0,
      engagementRate: pyCreator.engagementRate || 0,
      status: pyCreator.status || 'discovered',
      contactAttempts: pyCreator.contactAttempts || 0,
      createdAt: new Date(pyCreator.createdAt),
      updatedAt: new Date(pyCreator.updatedAt)
    }))

    // Convert Python posts to TypeScript TikTokVideo objects
    const posts: TikTokVideo[] = pythonResult.posts.map((pyPost: any) => ({
      id: pyPost.id,
      username: pyPost.username,
      description: pyPost.description || '',
      likes: pyPost.likes || 0,
      comments: pyPost.comments || 0,
      shares: pyPost.shares || 0,
      plays: pyPost.plays || 0,
      hashtags: pyPost.hashtags || [],
      timestamp: new Date(pyPost.timestamp)
    }))

    return {
      creators,
      posts,
      errors: pythonResult.errors || [],
      stats: {
        totalScraped: pythonResult.stats?.totalScraped || posts.length,
        qualified: pythonResult.stats?.qualified || creators.length,
        duplicates: pythonResult.stats?.duplicates || 0,
        timeElapsed: pythonResult.stats?.timeElapsed || 0
      }
    }
  }

  async testConnection(): Promise<boolean> {
    console.log('🧪 Testing TikTok scraper connection...')

    return new Promise((resolve) => {
      // Test if Python and required packages are available
      const venvPath = path.join(process.cwd(), 'venv/bin/python')
      const testProcess = spawn(venvPath, ['-c', 'import playwright; import aiohttp; print("OK")'])
      
      let output = ''
      testProcess.stdout.on('data', (data) => {
        output += data.toString()
      })

      testProcess.on('close', (code) => {
        if (code === 0 && output.includes('OK')) {
          console.log('✅ TikTok scraper dependencies available')
          resolve(true)
        } else {
          console.log('❌ TikTok scraper dependencies missing')
          console.log('💡 Install with: pip install playwright aiohttp && playwright install')
          resolve(false)
        }
      })

      testProcess.on('error', () => {
        console.log('❌ Python not available')
        resolve(false)
      })
    })
  }

  // Quick test with a single hashtag
  async quickTest(hashtag: string = 'productivity'): Promise<ScrapingResult> {
    console.log(`🧪 Running TikTok quick test with hashtag: ${hashtag}`)
    
    const testCriteria: DiscoveryCriteria = {
      platforms: ['tiktok'],
      hashtags: [hashtag],
      followerRange: [1000, 100000],
      minEngagementRate: 0.01,
      maxContactAttempts: 0
    }

    // Use non-headless mode for testing
    const testScraper = new TikTokScraper({
      headless: false,
      maxPostsPerHashtag: 5,
      timeout: 120000 // 2 minutes for quick test
    })

    return testScraper.discoverCreators(testCriteria)
  }
}

// Utility function to check if TikTok scraper is ready
export async function checkTikTokScraperSetup(): Promise<{ ready: boolean; message: string }> {
  try {
    const scraper = new TikTokScraper()
    const isReady = await scraper.testConnection()
    
    if (isReady) {
      return {
        ready: true,
        message: 'TikTok scraper is ready'
      }
    } else {
      return {
        ready: false,
        message: 'TikTok scraper dependencies missing. Run: pip install playwright aiohttp && playwright install'
      }
    }
  } catch (error) {
    return {
      ready: false,
      message: `TikTok scraper setup error: ${error}`
    }
  }
}