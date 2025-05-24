import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Check if this is an embeddable tweet URL
    const isEmbeddableTweet =
      (url.includes("twitter.com/") || url.includes("x.com/")) &&
      url.includes("/status/") &&
      !url.includes("/communities/") &&
      !url.includes("/search") &&
      !url.includes("/intent/");

    if (!isEmbeddableTweet) {
      // Return empty response for non-embeddable URLs
      return NextResponse.json({
        html: null,
        error: "URL is not an embeddable tweet",
      });
    }

    const response = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(
        url
      )}&omit_script=true`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PumpInternet/1.0)",
        },
      }
    );

    if (!response.ok) {
      // Don't throw, just return null html
      console.log(
        `Twitter oEmbed returned status ${response.status} for URL: ${url}`
      );
      return NextResponse.json({
        html: null,
        error: `Twitter API returned status ${response.status}`,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching Twitter embed:", error);
    return NextResponse.json(
      { html: null, error: "Failed to fetch Twitter embed" },
      { status: 200 } // Return 200 to avoid client-side errors
    );
  }
}
