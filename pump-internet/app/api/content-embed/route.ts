import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache for failed Twitter embeds
const failedTwitterCache = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const type = request.nextUrl.searchParams.get("type");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    let embedResponse;

    switch (type) {
      case "twitter":
        // Check if this URL has recently failed
        const failedAt = failedTwitterCache.get(url);
        if (failedAt && Date.now() - failedAt < CACHE_DURATION) {
          console.log(`Skipping cached failed Twitter URL: ${url}`);
          return NextResponse.json({
            html: `<div class="content-fallback">
                    <p>Could not load tweet</p>
                    <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
                   </div>`,
            url,
            error: `Cached failure - Twitter embed unavailable`,
          });
        }

        embedResponse = await fetch(
          `https://publish.twitter.com/oembed?url=${encodeURIComponent(
            url
          )}&omit_script=true&dnt=true`
        );

        // Cache failed requests
        if (!embedResponse.ok) {
          failedTwitterCache.set(url, Date.now());
          // Clean up old entries
          if (failedTwitterCache.size > 1000) {
            const now = Date.now();
            for (const [cachedUrl, timestamp] of failedTwitterCache.entries()) {
              if (now - timestamp > CACHE_DURATION) {
                failedTwitterCache.delete(cachedUrl);
              }
            }
          }
        }
        break;

      case "instagram":
        embedResponse = await fetch(
          `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(
            url
          )}&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN || "demo"}`
        );
        break;

      case "tiktok":
        embedResponse = await fetch(
          `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
        );
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported content type" },
          { status: 400 }
        );
    }

    if (!embedResponse.ok) {
      console.log(`${type} API error for URL ${url}: ${embedResponse.status}`);

      return NextResponse.json({
        html: `<div class="content-fallback">
                <p>Could not load ${type} content</p>
                <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
               </div>`,
        url,
        error: `${type} API responded with ${embedResponse.status}`,
      });
    }

    const data = await embedResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching ${type} embed:`, error);

    return NextResponse.json({
      html: `<div class="content-fallback">
              <p>Could not load ${type} content</p>
              <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
             </div>`,
      url,
      error: `Failed to fetch ${type} embed`,
    });
  }
}
