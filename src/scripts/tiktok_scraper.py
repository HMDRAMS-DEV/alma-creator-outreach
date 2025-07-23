#!/usr/bin/env python3
"""
TikTok Creator Discovery Service using PyTok
Safe and conservative scraping with anti-detection measures
"""

import asyncio
import json
import sys
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import argparse

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    import aiohttp
    from playwright.async_api import async_playwright
except ImportError:
    logger.error("Missing dependencies. Install with: pip install playwright aiohttp")
    sys.exit(1)

class TikTokDiscoveryService:
    def __init__(self, headless: bool = True, slow_mo: int = 3000):
        self.headless = headless
        self.slow_mo = slow_mo
        self.request_count = 0
        self.last_request_time = 0
        self.max_requests_per_minute = 3  # Very conservative
        self.browser = None
        self.page = None
        
    async def initialize(self):
        """Initialize the browser with anti-detection measures"""
        logger.info("🔧 Initializing TikTok scraper with stealth mode...")
        
        playwright = await async_playwright().start()
        
        self.browser = await playwright.chromium.launch(
            headless=self.headless,
            slow_mo=self.slow_mo,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-blink-features=AutomationControlled',
                '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        )
        
        self.page = await self.browser.new_page(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        
        # Block media to appear more bot-like (ironically safer)
        await self.page.route("**/*.{png,jpg,jpeg,gif,webp,mp4,mov,avi,svg}", lambda route: route.abort())
        
        # Remove automation indicators
        await self.page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
        """)
        
        logger.info("✅ TikTok scraper initialized with stealth mode")

    async def respect_rate_limit(self):
        """Enforce very conservative rate limiting"""
        now = time.time()
        time_since_last = now - self.last_request_time
        
        # Reset counter every minute
        if time_since_last > 60:
            self.request_count = 0
        
        # Check rate limit
        if self.request_count >= self.max_requests_per_minute:
            wait_time = 60 - time_since_last
            logger.info(f"🐌 Rate limit reached, waiting {wait_time:.1f}s...")
            await asyncio.sleep(wait_time)
            self.request_count = 0
        
        # Minimum delay between requests
        min_delay = 15  # 15 seconds minimum
        if time_since_last < min_delay:
            wait_time = min_delay - time_since_last
            await asyncio.sleep(wait_time)
        
        self.request_count += 1
        self.last_request_time = time.time()

    async def random_delay(self, min_ms: int = 2000, max_ms: int = 5000):
        """Add random delay to appear more human"""
        import random
        delay = random.randint(min_ms, max_ms) / 1000
        await asyncio.sleep(delay)

    async def scrape_hashtag_creators(self, hashtag: str, max_posts: int = 10) -> Dict[str, Any]:
        """Scrape creators from a TikTok hashtag page"""
        if not self.page:
            raise Exception("Browser not initialized")
        
        logger.info(f"🔍 Scraping TikTok hashtag: #{hashtag} (max {max_posts} posts)")
        
        start_time = time.time()
        creators = []
        posts = []
        errors = []
        
        try:
            await self.respect_rate_limit()
            
            # Navigate to hashtag page
            url = f"https://www.tiktok.com/tag/{hashtag}"
            logger.info(f"Navigating to {url}")
            
            await self.page.goto(url, timeout=30000, wait_until='domcontentloaded')
            await self.random_delay(3000, 6000)
            
            # Check if page loaded correctly
            try:
                await self.page.wait_for_selector('[data-e2e="challenge-item"]', timeout=10000)
            except:
                logger.warning("Challenge items not found, trying alternative selectors...")
                try:
                    await self.page.wait_for_selector('div[data-e2e="recommend-list-item-container"]', timeout=10000)
                except:
                    errors.append("Could not find video elements on page")
                    return self._create_result(creators, posts, errors, time.time() - start_time)
            
            # Get video elements (conservative approach)
            video_elements = await self.page.query_selector_all('div[data-e2e="recommend-list-item-container"], [data-e2e="challenge-item"]')
            
            logger.info(f"Found {len(video_elements)} video elements")
            
            # Process only the first few videos to stay conservative
            videos_to_process = min(len(video_elements), max_posts)
            
            for i, video_element in enumerate(video_elements[:videos_to_process]):
                try:
                    logger.info(f"Processing video {i+1}/{videos_to_process}")
                    
                    # Extract creator info and post data
                    post_data = await self._extract_video_data(video_element)
                    
                    if post_data:
                        posts.append(post_data)
                        
                        # Create creator entry if not already seen
                        creator_username = post_data.get('username')
                        if creator_username and not any(c['username'] == creator_username for c in creators):
                            creator_data = {
                                'username': creator_username,
                                'platform': 'tiktok',
                                'estimatedFollowers': post_data.get('estimatedFollowers', 0),
                                'engagementRate': 0.0,  # Will calculate later
                                'status': 'discovered',
                                'contactAttempts': 0,
                                'createdAt': datetime.now().isoformat(),
                                'updatedAt': datetime.now().isoformat()
                            }
                            creators.append(creator_data)
                    
                    # Delay between processing videos
                    await self.random_delay(2000, 4000)
                    
                except Exception as e:
                    errors.append(f"Error processing video {i+1}: {str(e)}")
                    logger.error(f"Error processing video {i+1}: {e}")
            
        except Exception as e:
            errors.append(f"Hashtag scraping error: {str(e)}")
            logger.error(f"Hashtag scraping error: {e}")
        
        time_elapsed = time.time() - start_time
        logger.info(f"✅ Finished scraping #{hashtag}: {len(posts)} posts, {len(creators)} creators in {time_elapsed:.1f}s")
        
        return self._create_result(creators, posts, errors, time_elapsed)

    async def _extract_video_data(self, video_element) -> Optional[Dict[str, Any]]:
        """Extract data from a single video element"""
        try:
            # Get username - try multiple selectors
            username = None
            username_selectors = [
                'a[data-e2e="video-author-uniqueid"]',
                'span[data-e2e="video-author-uniqueid"]',
                'a[href*="/@"]',
                'span[data-e2e="video-author-name"]'
            ]
            
            for selector in username_selectors:
                username_element = await video_element.query_selector(selector)
                if username_element:
                    username_text = await username_element.text_content()
                    if username_text:
                        username = username_text.strip().replace('@', '')
                        break
            
            if not username:
                return None
            
            # Get video description/caption
            description = ""
            desc_selectors = [
                'div[data-e2e="video-desc"] span',
                'span[data-e2e="video-desc"]',
                'div[data-e2e="video-desc"]'
            ]
            
            for selector in desc_selectors:
                desc_element = await video_element.query_selector(selector)
                if desc_element:
                    desc_text = await desc_element.text_content()
                    if desc_text:
                        description = desc_text.strip()
                        break
            
            # Extract engagement metrics (TikTok often hides exact numbers)
            likes = await self._extract_metric(video_element, 'like')
            comments = await self._extract_metric(video_element, 'comment')
            shares = await self._extract_metric(video_element, 'share')
            
            # Extract hashtags from description
            hashtags = []
            if description:
                import re
                hashtag_matches = re.findall(r'#[\w\d_]+', description)
                hashtags = [tag[1:] for tag in hashtag_matches]  # Remove # symbol
            
            # Estimate follower count based on engagement (rough heuristic)
            estimated_followers = self._estimate_followers(likes, comments, shares)
            
            return {
                'id': f"tiktok_{username}_{int(time.time())}",
                'username': username,
                'description': description,
                'likes': likes,
                'comments': comments,
                'shares': shares,
                'plays': likes * 20,  # Rough estimate: assume 20:1 play to like ratio
                'hashtags': hashtags,
                'timestamp': datetime.now().isoformat(),
                'estimatedFollowers': estimated_followers
            }
            
        except Exception as e:
            logger.error(f"Error extracting video data: {e}")
            return None

    async def _extract_metric(self, element, metric_type: str) -> int:
        """Extract engagement metric (likes, comments, shares)"""
        selectors = [
            f'strong[data-e2e="video-{metric_type}-count"]',
            f'span[data-e2e="video-{metric_type}-count"]',
            f'[data-e2e="video-{metric_type}-count"]'
        ]
        
        for selector in selectors:
            metric_element = await element.query_selector(selector)
            if metric_element:
                metric_text = await metric_element.text_content()
                if metric_text:
                    return self._parse_metric_number(metric_text.strip())
        
        return 0

    def _parse_metric_number(self, text: str) -> int:
        """Parse TikTok metric text (handles K, M suffixes)"""
        try:
            text = text.replace(',', '').strip()
            
            if 'K' in text.upper():
                return int(float(text.upper().replace('K', '')) * 1000)
            elif 'M' in text.upper():
                return int(float(text.upper().replace('M', '')) * 1000000)
            else:
                return int(text)
        except:
            return 0

    def _estimate_followers(self, likes: int, comments: int, shares: int) -> int:
        """Estimate follower count based on engagement metrics"""
        total_engagement = likes + comments * 5 + shares * 10  # Weight different engagement types
        
        # Rough heuristic: followers are usually 10-100x the engagement
        # TikTok typically has higher engagement rates than Instagram
        if total_engagement > 0:
            estimated = total_engagement * 30  # Conservative multiplier
            return min(max(estimated, 100), 1000000)  # Cap between 100 and 1M
        
        return 0

    def _create_result(self, creators: List[Dict], posts: List[Dict], errors: List[str], time_elapsed: float) -> Dict[str, Any]:
        """Create standardized result object"""
        return {
            'creators': creators,
            'posts': posts,
            'errors': errors,
            'stats': {
                'totalScraped': len(posts),
                'qualified': len(creators),
                'duplicates': 0,
                'timeElapsed': int(time_elapsed * 1000)  # Convert to milliseconds
            }
        }

    async def discover_creators(self, criteria: Dict[str, Any]) -> Dict[str, Any]:
        """Main discovery function that processes multiple hashtags"""
        logger.info("🎯 Starting TikTok creator discovery...")
        
        hashtags = criteria.get('hashtags', [])
        max_posts_per_hashtag = 8  # Very conservative
        
        all_creators = []
        all_posts = []
        all_errors = []
        total_time = 0
        
        for i, hashtag in enumerate(hashtags):
            logger.info(f"\n📍 Processing hashtag {i+1}/{len(hashtags)}: #{hashtag}")
            
            try:
                result = await self.scrape_hashtag_creators(hashtag, max_posts_per_hashtag)
                
                all_creators.extend(result['creators'])
                all_posts.extend(result['posts'])
                all_errors.extend(result['errors'])
                total_time += result['stats']['timeElapsed']
                
                # Long delay between hashtags (60-120 seconds)
                if i < len(hashtags) - 1:
                    delay = 60 + (i * 30)  # Increasing delays
                    logger.info(f"🕐 Waiting {delay}s before next hashtag...")
                    await asyncio.sleep(delay)
                
            except Exception as e:
                all_errors.append(f"Error processing hashtag {hashtag}: {str(e)}")
                logger.error(f"Error processing hashtag {hashtag}: {e}")
        
        # Remove duplicate creators
        unique_creators = []
        seen_usernames = set()
        for creator in all_creators:
            if creator['username'] not in seen_usernames:
                unique_creators.append(creator)
                seen_usernames.add(creator['username'])
        
        logger.info(f"\n🎉 TikTok discovery completed!")
        logger.info(f"- Total posts: {len(all_posts)}")
        logger.info(f"- Unique creators: {len(unique_creators)}")
        logger.info(f"- Total time: {total_time/1000:.1f}s")
        
        return {
            'creators': unique_creators,
            'posts': all_posts,
            'errors': all_errors,
            'stats': {
                'totalScraped': len(all_posts),
                'qualified': len(unique_creators),
                'duplicates': len(all_creators) - len(unique_creators),
                'timeElapsed': total_time
            }
        }

    async def close(self):
        """Clean up browser resources"""
        if self.browser:
            await self.browser.close()
        logger.info("🔒 TikTok scraper closed")

# CLI interface
async def main():
    parser = argparse.ArgumentParser(description='TikTok Creator Discovery Service')
    parser.add_argument('--hashtags', nargs='+', required=True, help='Hashtags to scrape')
    parser.add_argument('--headless', action='store_true', help='Run in headless mode')
    parser.add_argument('--max-posts', type=int, default=8, help='Max posts per hashtag')
    parser.add_argument('--output', type=str, help='Output JSON file path')
    
    args = parser.parse_args()
    
    # Create discovery criteria
    criteria = {
        'hashtags': args.hashtags,
        'platforms': ['tiktok'],
        'followerRange': [1000, 50000],
        'minEngagementRate': 0.03
    }
    
    scraper = TikTokDiscoveryService(headless=args.headless)
    
    try:
        await scraper.initialize()
        result = await scraper.discover_creators(criteria)
        
        # Output results
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(result, f, indent=2)
            logger.info(f"📁 Results saved to {args.output}")
        else:
            print(json.dumps(result, indent=2))
        
    except Exception as e:
        logger.error(f"❌ Discovery failed: {e}")
        sys.exit(1)
    finally:
        await scraper.close()

if __name__ == "__main__":
    asyncio.run(main())