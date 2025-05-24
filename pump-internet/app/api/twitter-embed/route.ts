import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    const twitterResponse = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(
        url
      )}&omit_script=true&dnt=true`
    );

    if (!twitterResponse.ok) {
      console.log(
        `Twitter API error for URL ${url}: ${twitterResponse.status}`
      );

      return NextResponse.json({
        html: `<div class="twitter-fallback">
                <p>Could not load tweet</p>
                <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
               </div>`,
        url,
        error: `Twitter API responded with ${twitterResponse.status}`,
      });
    }

    const data = await twitterResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching Twitter embed:", error);

    return NextResponse.json({
      html: `<div class="twitter-fallback">
              <p>Could not load tweet</p>
              <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
             </div>`,
      url,
      error: "Failed to fetch Twitter embed",
    });
  }
}
