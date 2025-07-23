import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'Alma Creator Outreach API is working!',
    timestamp: new Date().toISOString(),
    services: {
      instagramScraper: 'ready',
      tiktokScraper: 'ready', 
      aiConversation: 'ready',
      database: 'not_configured'
    }
  })
}

export async function POST() {
  return NextResponse.json({ 
    message: 'POST requests are working too!' 
  })
}