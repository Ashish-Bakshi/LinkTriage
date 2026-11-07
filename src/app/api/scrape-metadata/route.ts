import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { Platform, ScrapedMetadata } from '@/types';

function detectPlatform(urlStr: string): Platform {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    if (host.includes('linkedin.com')) return 'LinkedIn';
    if (host.includes('twitter.com') || host.includes('x.com') || host.includes('t.co')) return 'X';
    if (host.includes('instagram.com')) return 'Instagram';
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube';
    return 'Web';
  } catch {
    return 'Web';
  }
}

function cleanText(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .trim();
}

function generateFallbackTitle(urlStr: string, platform: Platform): string {
  try {
    const parsed = new URL(urlStr);
    const pathSegments = parsed.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1] || '';

    if (platform === 'LinkedIn') {
      if (parsed.pathname.includes('/posts/')) return 'LinkedIn Post';
      if (parsed.pathname.includes('/pulse/')) return 'LinkedIn Article';
      return 'LinkedIn Resource';
    }
    if (platform === 'X') {
      if (pathSegments.length >= 2 && pathSegments[1] === 'status') {
        return `X Post by @${pathSegments[0]}`;
      }
      return 'X Post / Thread';
    }
    if (platform === 'Instagram') {
      if (parsed.pathname.includes('/reel/')) return 'Instagram Reel';
      return 'Instagram Post';
    }
    if (platform === 'YouTube') {
      return 'YouTube Video';
    }

    if (lastSegment) {
      const readable = decodeURIComponent(lastSegment)
        .replace(/[-_]/g, ' ')
        .replace(/\.[a-z0-9]+$/i, '');
      if (readable.length > 3) {
        return readable.charAt(0).toUpperCase() + readable.slice(1);
      }
    }

    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'Saved Link';
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let targetUrl = body.url;

    if (!targetUrl || typeof targetUrl !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    targetUrl = targetUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    // Validate URL syntax
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return NextResponse.json({ error: 'Malformed URL provided' }, { status: 400 });
    }

    const platform = detectPlatform(targetUrl);
    const fallbackTitle = generateFallbackTitle(targetUrl, platform);

    // Fetch page with a 6-second timeout and browser-like user agent
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    let html = '';
    try {
      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (response.ok) {
        html = await response.text();
      }
    } catch {
      // Fetch may fail due to bot blockers or network timeout, handled gracefully below
    } finally {
      clearTimeout(timeoutId);
    }

    if (!html) {
      // Return detected platform and fallback title
      const result: ScrapedMetadata = {
        url: targetUrl,
        title: fallbackTitle,
        description: `Resource from ${parsedUrl.hostname}`,
        platform,
        siteName: parsedUrl.hostname.replace(/^www\./, ''),
      };
      return NextResponse.json(result);
    }

    const $ = cheerio.load(html);

    // Extract Title
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const twitterTitle = $('meta[name="twitter:title"]').attr('content');
    const docTitle = $('title').text();
    const h1Title = $('h1').first().text();

    const title = cleanText(ogTitle || twitterTitle || docTitle || h1Title) || fallbackTitle;

    // Extract Description
    const ogDesc = $('meta[property="og:description"]').attr('content');
    const twitterDesc = $('meta[name="twitter:description"]').attr('content');
    const metaDesc = $('meta[name="description"]').attr('content');
    const description = cleanText(ogDesc || twitterDesc || metaDesc || '');

    // Extract Image
    const ogImage = $('meta[property="og:image"]').attr('content');
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    let image = ogImage || twitterImage;
    if (image && !image.startsWith('http')) {
      try {
        image = new URL(image, targetUrl).toString();
      } catch {
        image = undefined;
      }
    }

    // Site Name
    const ogSiteName = $('meta[property="og:site_name"]').attr('content');
    const siteName = cleanText(ogSiteName) || parsedUrl.hostname.replace(/^www\./, '');

    const metadata: ScrapedMetadata = {
      url: targetUrl,
      title,
      description,
      platform,
      image,
      siteName,
    };

    return NextResponse.json(metadata);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to extract metadata';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
