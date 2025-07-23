import { ApifyClient } from 'apify-client';
import type { Creator, InstagramPost, TikTokVideo } from '@/types/creator';
import { CreatorStatus } from '@/types/creator';

// Define the structure of the item returned by the Apify scrapers
interface ApifyInstagramPost {
  id: string;
  url: string;
  ownerUsername: string;
  ownerProfilePicUrl: string;
  likesCount: number;
  commentsCount: number;
  caption: string;
  timestamp: string;
  ownerId: string;
  [key: string]: any;
}

interface ApifyTikTokVideo {
  id: string;
  webVideoUrl: string;
  author: {
    uniqueId: string;
    avatarThumb: string;
    signature: string; // Bio
  };
  stats: {
    diggCount: number; // Likes
    commentCount: number;
    shareCount: number;
    playCount: number;
  };
  desc: string; // Caption/Description
  createTime: number; // Unix timestamp
  [key: string]: any;
}

export class ApifyService {
  private client: ApifyClient;

  constructor() {
    if (!process.env.APIFY_API_KEY) {
      throw new Error('Apify API key not found in environment variables');
    }
    this.client = new ApifyClient({
      token: process.env.APIFY_API_KEY,
    });
  }

  async discoverCreatorsByInstagramHashtag(
    hashtags: string[], 
    maxResults: number = 50
  ): Promise<{ creators: Creator[], postsMap: Map<string, InstagramPost[]> }> {
    console.log(`Starting Apify Instagram discovery for hashtags: ${hashtags.join(', ')} with a limit of ${maxResults} results.`);
    const actor = this.client.actor('apify/instagram-hashtag-scraper');
    const limitPerHashtag = Math.ceil((maxResults * 1.2) / hashtags.length);

    const run = await actor.call({
      hashtags: hashtags,
      resultsLimit: limitPerHashtag,
    });

    console.log(`Apify actor run started with ID: ${run.id}. Waiting for results...`);
    const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
    console.log(`Received ${items.length} posts from Apify.`);

    const creatorsMap = new Map<string, Creator>();
    const postsMap = new Map<string, InstagramPost[]>();

    for (const item of items as unknown as ApifyInstagramPost[]) {
      const username = item.ownerUsername;
      if (!username) continue;

      if (!creatorsMap.has(username)) {
        creatorsMap.set(username, {
          username: username,
          platform: 'instagram',
          status: CreatorStatus.DISCOVERED,
          contactAttempts: 0,
          estimatedFollowers: 0,
          engagementRate: 0,
          profileImageUrl: item.ownerProfilePicUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        postsMap.set(username, []);
      }

      const creatorPosts = postsMap.get(username)!;
      creatorPosts.push({
        id: item.id,
        username: item.ownerUsername,
        caption: item.caption,
        likes: item.likesCount,
        comments: item.commentsCount,
        timestamp: new Date(item.timestamp),
        mediaType: 'photo',
        hashtags: (item.caption.match(/#[a-zA-Z0-9_]+/g) || []).map(tag => tag.substring(1)),
        mentions: (item.caption.match(/@[a-zA-Z0-9_.]+/g) || []).map(mention => mention.substring(1)),
      });
    }
    
    return { creators: Array.from(creatorsMap.values()), postsMap };
  }

  async discoverCreatorsByTikTokHashtag(
    hashtags: string[],
    maxResults: number = 50
  ): Promise<{ creators: Creator[], postsMap: Map<string, TikTokVideo[]> }> {
    console.log(`Starting Apify TikTok discovery for hashtags: ${hashtags.join(', ')} with a limit of ${maxResults} results.`);
    const actor = this.client.actor('apify/tiktok-hashtag-scraper');
    
    const run = await actor.call({
      hashtags: hashtags,
      resultsPerPage: maxResults, // This actor uses a different parameter name
      shouldDownloadVideos: false,
    });

    console.log(`Apify actor run started with ID: ${run.id}. Waiting for results...`);
    const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
    console.log(`Received ${items.length} videos from Apify.`);

    const creatorsMap = new Map<string, Creator>();
    const postsMap = new Map<string, TikTokVideo[]>();

    for (const item of items as unknown as ApifyTikTokVideo[]) {
      const username = item.author?.uniqueId;
      if (!username) continue;

      if (!creatorsMap.has(username)) {
        creatorsMap.set(username, {
          username: username,
          platform: 'tiktok',
          status: CreatorStatus.DISCOVERED,
          contactAttempts: 0,
          estimatedFollowers: 0,
          engagementRate: 0,
          profileImageUrl: item.author.avatarThumb,
          bio: item.author.signature,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        postsMap.set(username, []);
      }

      const creatorPosts = postsMap.get(username)!;
      creatorPosts.push({
        id: item.id,
        username: username,
        description: item.desc,
        likes: item.stats.diggCount,
        comments: item.stats.commentCount,
        shares: item.stats.shareCount,
        plays: item.stats.playCount,
        timestamp: new Date(item.createTime * 1000), // Convert Unix timestamp
        duration: item.video.duration,
        hashtags: (item.desc.match(/#[a-zA-Z0-9_]+/g) || []).map(tag => tag.substring(1)),
      });
    }

    return { creators: Array.from(creatorsMap.values()), postsMap };
  }
}