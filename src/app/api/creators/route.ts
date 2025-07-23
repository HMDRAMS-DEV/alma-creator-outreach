// app/api/creators/route.ts
import { NextResponse } from 'next/server';
import { put, list, del, head } from '@vercel/blob';
import type { Creator } from '@/types/creator';

const BLOB_KEY = 'creators.json';

// GET all saved creators
export async function GET() {
  try {
    const blob = await head(BLOB_KEY);
    if (!blob.url) {
      // If the blob doesn't exist, return an empty array
      return NextResponse.json([], { status: 200 });
    }
    
    const response = await fetch(blob.url);
    const creators: Creator[] = await response.json();
    
    return NextResponse.json(creators, { status: 200 });
  } catch (error: any) {
    if (error.status === 404) {
      return NextResponse.json([], { status: 200 });
    }
    console.error('Error fetching creators:', error);
    return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 });
  }
}

// POST a new creator to save
export async function POST(request: Request) {
  try {
    const newCreator = (await request.json()) as Creator;

    // 1. Get the current list of creators
    let creators: Creator[] = [];
    try {
      const blob = await head(BLOB_KEY);
      if (blob.url) {
        const response = await fetch(blob.url);
        creators = await response.json();
      }
    } catch (error: any) {
      if (error.status !== 404) throw error;
      // If 404, creators array is already initialized as empty, so we continue
    }

    // 2. Check for duplicates and add the new creator
    const isDuplicate = creators.some(c => c.username === newCreator.username && c.platform === newCreator.platform);
    if (isDuplicate) {
      return NextResponse.json({ message: 'Creator already saved' }, { status: 200 });
    }
    creators.push(newCreator);

    // 3. Upload the updated list back to the blob
    await put(BLOB_KEY, JSON.stringify(creators), {
      access: 'public',
      contentType: 'application/json',
    });

    return NextResponse.json({ success: true, creator: newCreator }, { status: 201 });
  } catch (error) {
    console.error('Error saving creator:', error);
    return NextResponse.json({ error: 'Failed to save creator' }, { status: 500 });
  }
}
