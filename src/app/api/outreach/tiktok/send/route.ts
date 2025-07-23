import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      creatorUsername,
      message,
      templateId
    } = body

    if (!creatorUsername || !message) {
      return NextResponse.json(
        { error: 'creatorUsername and message are required' },
        { status: 400 }
      )
    }

    const startTime = Date.now()
    
    // Create temporary files for input/output
    const tempInputFile = path.join('/tmp', `tiktok_outreach_input_${Date.now()}.json`)
    const tempOutputFile = path.join('/tmp', `tiktok_outreach_output_${Date.now()}.json`)
    
    // Prepare input data for Python script
    const inputData = {
      action: 'send_message',
      username: creatorUsername,
      message: message,
      templateId: templateId || null
    }

    // Write input data to temp file
    await fs.writeFile(tempInputFile, JSON.stringify(inputData))

    // Prepare arguments for Python script
    const scriptArgs = [
      path.join(process.cwd(), 'src/scripts/tiktok_outreach.py'),
      '--input', tempInputFile,
      '--output', tempOutputFile
    ]

    console.log('Running TikTok outreach with args:', scriptArgs)

    const pythonProcess = spawn('python3', scriptArgs)
    
    let stdout = ''
    let stderr = ''
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    // Wait for process to complete
    const exitCode = await new Promise((resolve) => {
      pythonProcess.on('close', resolve)
    })

    // Clean up input file
    await fs.unlink(tempInputFile).catch(() => {})

    if (exitCode !== 0) {
      console.error('TikTok outreach script failed:', stderr)
      return NextResponse.json({
        error: 'TikTok outreach failed',
        message: stderr || 'Python script execution failed',
        note: 'Make sure Python dependencies are installed and TikTok automation script is configured'
      }, { status: 500 })
    }

    // Read results from output file
    let results
    try {
      const resultsData = await fs.readFile(tempOutputFile, 'utf-8')
      results = JSON.parse(resultsData)
      
      // Clean up output file
      await fs.unlink(tempOutputFile).catch(() => {})
      
    } catch (error) {
      console.error('Failed to read TikTok outreach results:', error)
      return NextResponse.json({
        error: 'Failed to parse TikTok outreach results',
        message: 'Python script completed but results could not be read'
      }, { status: 500 })
    }

    const endTime = Date.now()

    if (!results.success) {
      return NextResponse.json({
        error: 'TikTok message sending failed',
        message: results.error || 'Unknown error occurred',
        details: results
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        messageId: results.messageId,
        recipient: creatorUsername,
        sentAt: new Date().toISOString(),
        platform: 'tiktok',
        templateId,
        processingTime: endTime - startTime,
        metadata: results.metadata || {}
      },
      message: `TikTok message sent to @${creatorUsername} successfully`
    })

  } catch (error) {
    console.error('TikTok outreach error:', error)
    
    return NextResponse.json({
      error: 'TikTok outreach failed',
      message: error.message || 'An unexpected error occurred',
      note: 'Make sure Python environment is set up with required TikTok automation dependencies'
    }, { status: 500 })
  }
}